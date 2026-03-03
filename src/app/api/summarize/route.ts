import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { ai } from '@/lib/gemini';
import { headers } from 'next/headers';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { YoutubeTranscript } from 'youtube-transcript';

const DAILY_LIMIT = 20;

export async function POST(req: Request) {
    try {
        const { youtubeUrl } = await req.json();

        if (!youtubeUrl) {
            return NextResponse.json({ error: 'YouTube URLが必要です。' }, { status: 400 });
        }

        // 1. IP Rate Limiting
        const headersList = await headers();
        const ip = headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || 'unknown';

        const { data: limitData } = await supabase
            .from('ip_limits')
            .select('*')
            .eq('ip_address', ip)
            .single();

        const today = new Date().toISOString().split('T')[0];

        if (limitData) {
            if (limitData.last_request_date === today) {
                if (limitData.request_count >= DAILY_LIMIT) {
                    return NextResponse.json({ error: '1日の要約上限（20回）に達しました。明日またお試しください。' }, { status: 429 });
                }
                await supabase
                    .from('ip_limits')
                    .update({ request_count: limitData.request_count + 1 })
                    .eq('ip_address', ip);
            } else {
                await supabase
                    .from('ip_limits')
                    .update({ request_count: 1, last_request_date: today })
                    .eq('ip_address', ip);
            }
        } else {
            await supabase
                .from('ip_limits')
                .insert([{ ip_address: ip, request_count: 1, last_request_date: today }]);
        }

        // 2. Extract YouTube ID
        const match = youtubeUrl.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?]+)/);
        const videoId = match ? match[1] : null;

        if (!videoId) {
            return NextResponse.json({ error: '無効なYouTube URLです。' }, { status: 400 });
        }

        // Check if we already summarized this video
        const { data: existingVideo } = await supabase
            .from('videos')
            .select('id')
            .eq('youtube_id', videoId)
            .single();

        if (existingVideo) {
            // Return existing summary
            return NextResponse.json({ success: true, summaryId: existingVideo.id, cached: true });
        }

        // 3. Fetch Title (using oEmbed bypassing API key)
        let title = `YouTube Video (${videoId})`;
        try {
            const oembedRes = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`);
            if (oembedRes.ok) {
                const oembedData = await oembedRes.json();
                title = oembedData.title || title;
            }
        } catch (e) {
            console.error('Failed to fetch title', e);
        }

        // 4. Fetch Transcript via yt-dlp
        let transcriptText = '';
        let ytDlpFailed = false;

        let ytDlpErrorLog = '';

        try {
            const url = `https://www.youtube.com/watch?v=${videoId}`;
            // Save to the OS temp directory to avoid cluttering specific project folders
            const tempDir = process.env.TEMP || process.env.TMPDIR || '/tmp';
            const outputTemplate = path.join(tempDir, `${videoId}.%(ext)s`);
            const vttPath = path.join(tempDir, `${videoId}.ja.vtt`);

            const isWindows = process.platform === 'win32';

            if (isWindows) {
                // Local development (Windows) uses yt-dlp.exe
                console.log(`Downloading subtitles for ${videoId} using yt-dlp.exe...`);

                // Clean up old files just in case
                if (fs.existsSync(vttPath)) fs.unlinkSync(vttPath);

                let ytDlpCmd = `"${path.join(process.cwd(), 'yt-dlp.exe')}"`;

                try {
                    console.log(`Executing yt-dlp command: ${ytDlpCmd}`);
                    execSync(`${ytDlpCmd} --write-auto-sub --sub-lang ja --skip-download -o "${outputTemplate}" "${url}"`, { stdio: 'pipe' });
                } catch (execError: any) {
                    console.error("yt-dlp EXEC ERROR:", execError.message);
                    ytDlpErrorLog += "Exec Error: " + execError.message + "\n";
                    if (execError.stdout) ytDlpErrorLog += "Stdout: " + execError.stdout.toString() + "\n";
                    if (execError.stderr) ytDlpErrorLog += "Stderr: " + execError.stderr.toString() + "\n";
                    ytDlpFailed = true;
                }

                if (!ytDlpFailed && fs.existsSync(vttPath)) {
                    const vttContent = fs.readFileSync(vttPath, 'utf8');
                    const lines = vttContent.split('\n');
                    const textLines = [];

                    for (let i = 0; i < lines.length; i++) {
                        const line = lines[i].trim();
                        if (line === '' || line.startsWith('WEBVTT') || line.startsWith('Kind:') || line.startsWith('Language:') || line.includes('-->')) {
                            continue;
                        }
                        const cleanLine = line.replace(/<[^>]+>/g, '').trim();
                        if (cleanLine) textLines.push(cleanLine);
                    }

                    const uniqueLines = [];
                    for (let i = 0; i < textLines.length; i++) {
                        if (i === 0 || textLines[i] !== textLines[i - 1]) {
                            uniqueLines.push(textLines[i]);
                        }
                    }
                    transcriptText = uniqueLines.join(' ');

                    // Cleanup
                    fs.unlinkSync(vttPath);
                } else {
                    ytDlpFailed = true;
                    if (!ytDlpErrorLog) ytDlpErrorLog += "vtt file was not generated.\n";
                }
            } else {
                // Vercel / Linux Environment
                // Use Supadata.ai API to fetch subtitles – no bot detection issues
                console.log(`Fetching subtitles for ${videoId} via Supadata.ai API...`);
                const supadataApiKey = process.env.SUPADATA_API_KEY;
                if (!supadataApiKey) {
                    ytDlpFailed = true;
                    ytDlpErrorLog += "SUPADATA_API_KEY is not set.\n";
                } else {
                    try {
                        const supadataRes = await fetch(
                            `https://api.supadata.ai/v1/youtube/transcript?videoId=${videoId}&lang=ja&text=true`,
                            { headers: { 'x-api-key': supadataApiKey } }
                        );
                        if (!supadataRes.ok) {
                            const errText = await supadataRes.text();
                            console.error("Supadata API error:", supadataRes.status, errText);
                            ytDlpErrorLog += `Supadata API error ${supadataRes.status}: ${errText}\n`;
                            ytDlpFailed = true;
                        } else {
                            const supadataData = await supadataRes.json();
                            if (supadataData && supadataData.content) {
                                transcriptText = supadataData.content;
                                console.log(`Supadata transcript fetched, length: ${transcriptText.length}`);
                            } else {
                                ytDlpFailed = true;
                                ytDlpErrorLog += "Supadata API returned empty transcript.\n";
                            }
                        }
                    } catch (apiErr: any) {
                        console.error("Supadata API call error:", apiErr.message);
                        ytDlpFailed = true;
                        ytDlpErrorLog += "API Call Error: " + apiErr.message + "\n";
                    }
                }
            }

        } catch (error: any) {
            console.error('subtitle fetch unexpected error', error);
            ytDlpFailed = true;
            ytDlpErrorLog += "Unexpected Error: " + error.message + "\n";
        }

        // If transcript fetch failed on Vercel, return a clear error
        const isWindowsEnv = process.platform === 'win32';
        if (ytDlpFailed && !isWindowsEnv) {
            return NextResponse.json({ error: `この動画の字幕を取得できませんでした。字幕・自動字幕が無効な動画は対応していません。\n(detail: ${ytDlpErrorLog})` }, { status: 400 });
        }

        // 5. Gemini API for Summary & Tags
        // Cap at 20000 chars to avoid prompt length limits
        if (transcriptText.length > 20000) {
            transcriptText = transcriptText.substring(0, 20000) + '...';
        }

        console.log(`Using text transcript for ${videoId}, length: ${transcriptText.length}`);
        const prompt = `
以下のYouTube動画の文字起こしを読んで、概要を分かりやすい日本語で段落を分けて詳細に要約してください。
また、動画内容に合ったハッシュタグ（キーワード）を最大5つ抽出してください。
以下のJSONフォーマット（JSON文字列のみ）で出力してください。マークダウンの記法などは一切含めないでください。

{
  "summary": "要約テキスト（適度に改行を含める）",
  "tags": ["タグ1", "タグ2", "タグ3"]
}

--- 動画の文字起こし ---
${transcriptText}
`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });

        const aiText = response.text;
        if (!aiText) {
            throw new Error('AIが空の応答を返しました');
        }

        // Safe JSON Parsing
        let aiResult;
        try {
            const cleanJson = aiText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
            aiResult = JSON.parse(cleanJson);
        } catch (e) {
            console.error("JSON Parse failed:", aiText);
            return NextResponse.json({ error: 'AIからの応答形式が不正でした。' }, { status: 500 });
        }

        const { summary, tags } = aiResult;

        // 6. Save to Supabase
        const { data: videoData, error: videoError } = await supabase
            .from('videos')
            .insert([{ youtube_id: videoId, title, summary_text: summary }])
            .select('id')
            .single();

        if (videoError || !videoData) {
            console.error(videoError);
            return NextResponse.json({ error: 'データベースの保存に失敗しました。' }, { status: 500 });
        }

        // Save Tags
        if (tags && Array.isArray(tags)) {
            for (let tagName of tags) {
                // Tag Cleanup
                tagName = tagName.replace(/^#/, '').trim();
                if (!tagName) continue;

                let tagId;
                const { data: existingTag } = await supabase
                    .from('tags')
                    .select('id')
                    .eq('name', tagName)
                    .single();

                if (existingTag) {
                    tagId = existingTag.id;
                } else {
                    const { data: newTag } = await supabase
                        .from('tags')
                        .insert([{ name: tagName }])
                        .select('id')
                        .single();
                    if (newTag) tagId = newTag.id;
                }

                if (tagId) {
                    await supabase
                        .from('video_tags')
                        .insert([{ video_id: videoData.id, tag_id: tagId }]);
                }
            }
        }

        return NextResponse.json({ success: true, summaryId: videoData.id });

    } catch (error: any) {
        console.error('API Error:', error);
        return NextResponse.json({ error: 'サーバーで予期せぬエラーが発生しました。' }, { status: 500 });
    }
}
