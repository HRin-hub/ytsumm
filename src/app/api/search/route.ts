import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q')?.trim();

    if (!q || q.length < 1) {
        return NextResponse.json({ error: 'キーワードを入力してください。' }, { status: 400 });
    }

    // 1. Search videos by title (case-insensitive partial match)
    const { data: titleResults, error: titleError } = await supabase
        .from('videos')
        .select('id, youtube_id, title, view_count, created_at')
        .ilike('title', `%${q}%`)
        .order('view_count', { ascending: false })
        .limit(20);

    // 2. Search tags by name matching keyword
    const { data: matchedTags } = await supabase
        .from('tags')
        .select('id, name')
        .ilike('name', `%${q}%`);

    let tagResults: any[] = [];
    if (matchedTags && matchedTags.length > 0) {
        const tagIds = matchedTags.map(t => t.id);

        // Fetch videos linked to these tags
        const { data: videoTags } = await supabase
            .from('video_tags')
            .select('videos(id, youtube_id, title, view_count, created_at)')
            .in('tag_id', tagIds);

        if (videoTags) {
            tagResults = videoTags.map((vt: any) => vt.videos).filter(Boolean);
        }
    }

    // 3. Merge results and deduplicate by id
    const allResults = [...(titleResults || []), ...tagResults];
    const seen = new Set<string>();
    const deduplicated = allResults.filter(v => {
        if (!v || seen.has(v.id)) return false;
        seen.add(v.id);
        return true;
    });

    // Sort by view_count descending
    deduplicated.sort((a, b) => (b.view_count || 0) - (a.view_count || 0));

    return NextResponse.json({ results: deduplicated, query: q });
}
