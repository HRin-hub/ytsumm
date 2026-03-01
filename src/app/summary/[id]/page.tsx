import { supabase } from '@/lib/supabase';
import { notFound } from 'next/navigation';
import TagChip from '@/components/TagChip';
import Link from 'next/link';
import { FaArrowLeft, FaEye, FaCalendarAlt } from 'react-icons/fa';
import ViewTracker from '@/components/ViewTracker';

// Next.js ISR configuration
export const revalidate = 60;

export default async function SummaryPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    // UUID形式の簡易チェック
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
        notFound();
    }

    // Fetch video data and linked tags
    const { data: video, error } = await supabase
        .from('videos')
        .select(`
      *,
      video_tags (
        tags (name)
      )
    `)
        .eq('id', id)
        .single();

    if (error || !video) {
        notFound();
    }

    // Extract tags gracefully
    const tags = video.video_tags
        ?.map((vt: any) => vt.tags?.name)
        .filter(Boolean) || [];

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <Link href="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-indigo-400 transition-colors font-medium">
                <FaArrowLeft /> トップページへ戻る
            </Link>

            <div className="bg-slate-800/40 rounded-3xl overflow-hidden border border-slate-700/50 shadow-2xl backdrop-blur-sm">
                {/* YouTube Embed Container */}
                <div className="w-full aspect-video bg-black relative">
                    <iframe
                        src={`https://www.youtube.com/embed/${video.youtube_id}`}
                        title={video.title}
                        className="absolute top-0 left-0 w-full h-full"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                    ></iframe>
                </div>

                <div className="p-6 md:p-10 space-y-8">
                    {/* Header */}
                    <div className="space-y-4">
                        <h1 className="text-2xl md:text-3xl font-bold text-slate-100 leading-snug">
                            {video.title}
                        </h1>

                        <div className="flex flex-wrap items-center gap-4 text-sm text-slate-400">
                            <span className="flex items-center gap-1.5">
                                <FaCalendarAlt />
                                {new Date(video.created_at).toLocaleDateString('ja-JP')}
                            </span>
                            <span className="flex items-center gap-1.5 bg-slate-900/60 px-3 py-1 rounded-full border border-slate-700/50">
                                <FaEye className="text-slate-500" />
                                <span className="font-medium">{video.view_count || 0} views</span>
                            </span>
                        </div>
                    </div>

                    <hr className="border-slate-700/50" />

                    {/* Summary Content */}
                    <div className="space-y-4">
                        <h2 className="text-xl font-bold flex items-center gap-2 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
                            ✨ AIによる要約
                        </h2>
                        <div className="prose prose-invert prose-slate max-w-none text-slate-300 leading-relaxed whitespace-pre-wrap font-medium">
                            {video.summary_text}
                        </div>
                    </div>

                    <hr className="border-slate-700/50" />

                    {/* Tags */}
                    {tags.length > 0 && (
                        <div className="space-y-4">
                            <h3 className="text-lg font-medium text-slate-300">関連タグ</h3>
                            <div className="flex flex-wrap gap-2">
                                {tags.map((tag: string) => (
                                    <TagChip key={tag} name={tag} />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Background tracking of views */}
            <ViewTracker id={id} />
        </div>
    );
}
