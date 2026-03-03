'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FaSearch, FaSpinner, FaYoutube } from 'react-icons/fa';

type Mode = 'summarize' | 'search';

export default function SearchBar() {
    const [mode, setMode] = useState<Mode>('summarize');
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim()) return;

        if (mode === 'search') {
            router.push(`/search?q=${encodeURIComponent(input.trim())}`);
            return;
        }

        // mode === 'summarize'
        setIsLoading(true);
        try {
            const res = await fetch('/api/summarize', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ youtubeUrl: input }),
            });

            if (!res.ok) {
                const error = await res.json();
                alert(`エラー: ${error.error || '処理に失敗しました。'}`);
                return;
            }

            const data = await res.json();
            router.push(`/summary/${data.summaryId}`);
        } catch (error) {
            console.error(error);
            alert('通信エラーが発生しました。');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="w-full max-w-3xl mx-auto space-y-3">
            {/* Mode tabs */}
            <div className="flex gap-2 justify-center">
                <button
                    onClick={() => { setMode('summarize'); setInput(''); }}
                    className={`flex items-center gap-2 px-5 py-2 rounded-full text-sm font-medium transition-all ${mode === 'summarize'
                            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                            : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
                        }`}
                >
                    <FaYoutube /> URL を要約
                </button>
                <button
                    onClick={() => { setMode('search'); setInput(''); }}
                    className={`flex items-center gap-2 px-5 py-2 rounded-full text-sm font-medium transition-all ${mode === 'search'
                            ? 'bg-pink-600 text-white shadow-lg shadow-pink-500/20'
                            : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
                        }`}
                >
                    <FaSearch /> キーワード検索
                </button>
            </div>

            {/* Input form */}
            <div className={`p-1 rounded-2xl shadow-xl ${mode === 'summarize'
                    ? 'bg-gradient-to-tr from-blue-500 via-indigo-500 to-purple-600 shadow-purple-900/20'
                    : 'bg-gradient-to-tr from-pink-500 via-rose-500 to-orange-400 shadow-pink-900/20'
                }`}>
                <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row items-center bg-slate-900 rounded-xl overflow-hidden p-1.5 gap-2">
                    <div className="w-full sm:w-auto flex flex-1 items-center px-3 gap-3">
                        {mode === 'summarize' ? (
                            <FaYoutube className="text-red-500 text-xl flex-shrink-0" />
                        ) : (
                            <FaSearch className="text-pink-400 text-lg flex-shrink-0" />
                        )}
                        <input
                            key={mode}
                            type={mode === 'summarize' ? 'url' : 'text'}
                            placeholder={
                                mode === 'summarize'
                                    ? 'YouTubeのURLを入力 (例: https://youtube.com/watch...)'
                                    : 'タイトルやタグで検索 (例: Python, プログラミング...)'
                            }
                            className="w-full bg-transparent border-none outline-none text-slate-200 py-3 text-base placeholder:text-slate-500 min-w-[200px]"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            required
                            disabled={isLoading}
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={isLoading}
                        className={`w-full sm:w-auto text-white px-8 py-3.5 rounded-lg font-medium transition-colors flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap ${mode === 'summarize'
                                ? 'bg-indigo-600 hover:bg-indigo-500'
                                : 'bg-pink-600 hover:bg-pink-500'
                            }`}
                    >
                        {isLoading ? (
                            <>
                                <FaSpinner className="animate-spin" />
                                <span>要約中...</span>
                            </>
                        ) : mode === 'summarize' ? (
                            <span>要約する</span>
                        ) : (
                            <span>検索する</span>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}
