'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import SummaryCard from '@/components/SummaryCard';
import Link from 'next/link';
import { FaArrowLeft, FaSearch, FaSpinner } from 'react-icons/fa';

function SearchResults() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const q = searchParams.get('q') || '';
    const [query, setQuery] = useState(q);
    const [results, setResults] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [searched, setSearched] = useState(false);

    useEffect(() => {
        if (q) {
            setQuery(q);
            doSearch(q);
        }
    }, [q]);

    const doSearch = async (keyword: string) => {
        if (!keyword.trim()) return;
        setIsLoading(true);
        setSearched(false);
        try {
            const res = await fetch(`/api/search?q=${encodeURIComponent(keyword)}`);
            const data = await res.json();
            setResults(data.results || []);
        } catch (e) {
            setResults([]);
        } finally {
            setIsLoading(false);
            setSearched(true);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim()) return;
        router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    };

    return (
        <div className="space-y-8 pb-12">
            <Link href="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-indigo-400 transition-colors font-medium">
                <FaArrowLeft /> トップページへ戻る
            </Link>

            {/* Search form */}
            <div className="w-full p-1 bg-gradient-to-tr from-blue-500 via-indigo-500 to-purple-600 rounded-2xl shadow-xl shadow-purple-900/20">
                <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row items-center bg-slate-900 rounded-xl overflow-hidden p-1.5 gap-2">
                    <div className="w-full sm:w-auto flex flex-1 items-center px-3 gap-3">
                        <FaSearch className="text-slate-400 text-lg flex-shrink-0" />
                        <input
                            type="text"
                            placeholder="タイトルやタグで検索..."
                            className="w-full bg-transparent border-none outline-none text-slate-200 py-3 text-base placeholder:text-slate-500"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            autoFocus
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-3.5 rounded-lg font-medium transition-colors flex justify-center items-center gap-2 whitespace-nowrap"
                    >
                        検索する
                    </button>
                </form>
            </div>

            {/* Results */}
            {isLoading ? (
                <div className="flex justify-center items-center py-24 gap-3 text-slate-400">
                    <FaSpinner className="animate-spin text-2xl" />
                    <span>検索中...</span>
                </div>
            ) : searched ? (
                results.length > 0 ? (
                    <div>
                        <p className="text-slate-400 mb-6">
                            「<span className="text-indigo-400 font-semibold">{q}</span>」の検索結果：<span className="text-slate-300 font-bold">{results.length}件</span>
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {results.map((video: any) => (
                                <SummaryCard
                                    key={video.id}
                                    id={video.id}
                                    youtubeId={video.youtube_id}
                                    title={video.title}
                                    viewCount={video.view_count || 0}
                                />
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-24 bg-slate-800/30 rounded-3xl border border-slate-700/50 border-dashed">
                        <p className="text-slate-400 text-lg">
                            「<span className="text-indigo-400">{q}</span>」に一致する動画は見つかりませんでした。
                        </p>
                        <p className="text-slate-500 text-sm mt-3">別のキーワードで試してみてください。</p>
                    </div>
                )
            ) : null}
        </div>
    );
}

export default function SearchPage() {
    return (
        <Suspense fallback={
            <div className="flex justify-center items-center py-24 gap-3 text-slate-400">
                <FaSpinner className="animate-spin text-2xl" />
                <span>読み込み中...</span>
            </div>
        }>
            <SearchResults />
        </Suspense>
    );
}
