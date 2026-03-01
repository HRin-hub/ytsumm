'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FaSearch, FaSpinner } from 'react-icons/fa';

export default function SearchBar() {
    const [url, setUrl] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!url.trim()) return;

        setIsLoading(true);

        try {
            const res = await fetch('/api/summarize', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ youtubeUrl: url }),
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
        <div className="w-full max-w-3xl mx-auto p-1 bg-gradient-to-tr from-blue-500 via-indigo-500 to-purple-600 rounded-2xl shadow-xl shadow-purple-900/20">
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row items-center bg-slate-900 rounded-xl overflow-hidden p-1.5 gap-2">
                <div className="w-full sm:w-auto flex flex-1 items-center px-3 gap-3">
                    <FaSearch className="text-slate-400 text-lg flex-shrink-0" />
                    <input
                        type="url"
                        placeholder="YouTubeのURLを入力 (例: https://youtube.com/watch...)"
                        className="w-full bg-transparent border-none outline-none text-slate-200 py-3 text-base placeholder:text-slate-500 min-w-[200px]"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        required
                        disabled={isLoading}
                    />
                </div>
                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-3.5 rounded-lg font-medium transition-colors flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                >
                    {isLoading ? (
                        <>
                            <FaSpinner className="animate-spin" />
                            <span>要約中...</span>
                        </>
                    ) : (
                        <span>要約する</span>
                    )}
                </button>
            </form>
        </div>
    );
}
