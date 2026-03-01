import { supabase } from '@/lib/supabase';
import SummaryCard from '@/components/SummaryCard';
import Link from 'next/link';
import { FaArrowLeft, FaHashtag } from 'react-icons/fa';

export const revalidate = 60;

export default async function TagPage({ params }: { params: Promise<{ name: string }> }) {
    const { name } = await params;
    const decodedName = decodeURIComponent(name);

    // 1. Fetch tag ID
    const { data: tag } = await supabase
        .from('tags')
        .select('id')
        .eq('name', decodedName)
        .single();

    let videos: any[] = [];

    if (tag) {
        // 2. Fetch videos linked to this tag
        const { data: videoTags, error } = await supabase
            .from('video_tags')
            .select(`
        videos (
          id,
          youtube_id,
          title,
          view_count,
          created_at
        )
      `)
            .eq('tag_id', tag.id);

        if (videoTags && !error) {
            // videos from join might be nested or an array depending on foreign key
            // supabase join usually returns the joined object directly under the table name
            videos = videoTags.map((vt: any) => vt.videos).filter(Boolean);

            // Sort by date descending (latest first)
            videos.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        }
    }

    return (
        <div className="space-y-8 pb-12">
            <Link href="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-indigo-400 transition-colors font-medium">
                <FaArrowLeft /> トップページへ戻る
            </Link>

            <div className="flex items-center gap-3 mb-8">
                <FaHashtag className="text-pink-500 text-3xl" />
                <h1 className="text-3xl md:text-4xl font-bold text-slate-100">
                    {decodedName}
                </h1>
                <span className="text-slate-400 text-lg mt-1 pl-2">
                    の要約一覧
                </span>
            </div>

            {videos.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {videos.map((video: any) => (
                        <SummaryCard
                            key={video.id}
                            id={video.id}
                            youtubeId={video.youtube_id}
                            title={video.title}
                            viewCount={video.view_count || 0}
                        />
                    ))}
                </div>
            ) : (
                <div className="text-center py-24 bg-slate-800/30 rounded-3xl border border-slate-700/50 border-dashed">
                    <p className="text-slate-400 text-lg">このタグに関連する動画は見つかりませんでした。</p>
                    <Link href="/" className="inline-block mt-8 px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-lg transition-colors shadow-lg shadow-indigo-500/20">
                        トップページで要約を作成する
                    </Link>
                </div>
            )}
        </div>
    );
}
