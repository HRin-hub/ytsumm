import Link from 'next/link';
import { FaEye } from 'react-icons/fa';

interface SummaryCardProps {
    id: string;
    youtubeId: string;
    title: string;
    viewCount: number;
}

export default function SummaryCard({ id, youtubeId, title, viewCount }: SummaryCardProps) {
    return (
        <Link href={`/summary/${id}`} className="group block h-full">
            <div className="bg-slate-800/40 hover:bg-slate-800/80 border border-slate-700/50 hover:border-purple-500/50 rounded-2xl overflow-hidden transition-all duration-300 h-full flex flex-col shadow-lg">
                {/* Thumbnail Image */}
                <div className="w-full aspect-video bg-slate-900 relative overflow-hidden">
                    <img
                        src={`https://img.youtube.com/vi/${youtubeId}/mqdefault.jpg`}
                        alt={title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                        loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent opacity-60" />
                </div>

                <div className="p-5 flex flex-col flex-1">
                    <h3 className="font-medium text-slate-200 leading-snug line-clamp-2 group-hover:text-purple-300 transition-colors mb-4">
                        {title}
                    </h3>
                    <div className="mt-auto flex items-center justify-between text-xs text-slate-400">
                        <span className="flex items-center gap-1.5 bg-slate-900/60 px-3 py-1.5 rounded-full border border-slate-700/50">
                            <FaEye className="text-slate-500" />
                            <span className="font-medium">{viewCount.toLocaleString()}</span>
                        </span>
                        <span className="text-indigo-400 font-medium text-sm group-hover:translate-x-1 transition-transform flex items-center gap-1">
                            見る &rarr;
                        </span>
                    </div>
                </div>
            </div>
        </Link>
    );
}
