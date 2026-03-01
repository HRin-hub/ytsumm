import SearchBar from '@/components/SearchBar';
import SummaryCard from '@/components/SummaryCard';
import TagChip from '@/components/TagChip';
import { supabase } from '@/lib/supabase';
import { FaFire, FaTags } from 'react-icons/fa';

export const revalidate = 0; // Disable static caching so rankings are fresh

export default async function Home() {
  // Fetch popular tags
  const { data: popularTags, error: tagError } = await supabase
    .from('tags')
    .select('name')
    .limit(15);

  // Fetch top ranked summaries by view_count
  const { data: topSummaries, error: summaryError } = await supabase
    .from('videos')
    .select('id, youtube_id, title, view_count, created_at')
    .order('view_count', { ascending: false })
    .limit(6);

  return (
    <div className="flex flex-col gap-16 pb-12">
      {/* Hero Section */}
      <section className="text-center pt-12 pb-8 space-y-6">
        <div className="inline-block mb-4 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-sm font-medium">
          ✨ Gemini による超高速要約に対応しました
        </div>
        <h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-100">
          動画の<span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">要点</span>を<br className="hidden md:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-pink-500">一瞬</span>でつかむ
        </h2>
        <p className="text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
          YouTubeのURLを入れるだけ。AIが動画を分析し、
          分かりやすい要約と関連タグを自動生成します。
        </p>

        <div className="pt-8">
          <SearchBar />
        </div>
      </section>

      {/* Popular Tags Section */}
      <section className="bg-slate-800/30 rounded-3xl p-6 md:p-8 border border-slate-700/50 shadow-lg">
        <div className="flex items-center gap-3 mb-6">
          <FaTags className="text-pink-500 text-xl" />
          <h3 className="text-2xl font-bold text-slate-200">人気のタグ</h3>
        </div>

        {tagError ? (
          <p className="text-slate-500">タグの読み込みに失敗しました。</p>
        ) : popularTags && popularTags.length > 0 ? (
          <div className="flex flex-wrap gap-2.5">
            {popularTags.map((tag) => (
              <TagChip key={tag.name} name={tag.name} />
            ))}
          </div>
        ) : (
          <p className="text-slate-500">まだタグがありません。最初の要約を作ってみましょう！</p>
        )}
      </section>

      {/* Rankings Section */}
      <section>
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <FaFire className="text-orange-500 text-2xl animate-pulse cursor-default" />
            <h3 className="text-2xl font-bold text-slate-200">
              人気の要約動画
            </h3>
          </div>
        </div>

        {summaryError ? (
          <p className="text-slate-500 text-center py-10">ランキングの読み込みに失敗しました。</p>
        ) : topSummaries && topSummaries.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {topSummaries.map((video) => (
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
          <div className="text-center py-24 bg-slate-800/20 rounded-3xl border border-slate-700/50 border-dashed">
            <p className="text-slate-400 text-lg mb-2">まだ要約された動画がありません。</p>
            <p className="text-slate-500 text-sm">上の検索窓からURLを入れて、最初の要約を作ってみましょう！</p>
          </div>
        )}
      </section>
    </div>
  );
}
