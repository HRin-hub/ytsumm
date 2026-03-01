import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Link from 'next/link';
import { FaYoutube } from 'react-icons/fa';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "TubeSummary - AIによるYouTube動画要約＆タグ付け",
  description: "AIがYouTube動画の内容を高速で要約し、自動的にタグ付けを行います。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className={`${inter.className} antialiased bg-slate-900 text-slate-100 min-h-screen flex flex-col`}>
        <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-50">
          <div className="container mx-auto px-4 h-16 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 group">
              <FaYoutube className="text-red-500 text-3xl group-hover:scale-110 transition-transform" />
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 via-indigo-500 to-purple-500 bg-clip-text text-transparent">
                TubeSummary
              </h1>
            </Link>
          </div>
        </header>
        <main className="flex-1 w-full max-w-5xl mx-auto px-4 py-8">
          {children}
        </main>
        <footer className="border-t border-slate-800 py-8 mt-auto">
          <div className="container mx-auto px-4 text-center text-slate-500 text-sm">
            <p className="mb-2">※ 本サービスはYouTubeとは無関係の非公式サービスです。</p>
            <p>&copy; {new Date().getFullYear()} TubeSummary. All rights reserved.</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
