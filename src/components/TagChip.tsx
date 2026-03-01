import Link from 'next/link';

interface TagChipProps {
    name: string;
}

export default function TagChip({ name }: TagChipProps) {
    return (
        <Link
            href={`/tags/${encodeURIComponent(name)}`}
            className="inline-block px-4 py-1.5 bg-slate-800/80 hover:bg-slate-700 border border-slate-700 hover:border-indigo-400 text-slate-300 hover:text-indigo-300 text-sm rounded-full transition-all duration-200 whitespace-nowrap"
        >
            #{name}
        </Link>
    );
}
