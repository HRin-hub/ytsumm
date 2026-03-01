import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(req: Request, context: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await context.params;
        if (!id) return NextResponse.json({ error: 'IDが不足しています' }, { status: 400 });

        const { data: video } = await supabase
            .from('videos')
            .select('view_count')
            .eq('id', id)
            .single();

        if (video) {
            await supabase
                .from('videos')
                .update({ view_count: (video.view_count || 0) + 1 })
                .eq('id', id);
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('View tracking error', error);
        return NextResponse.json({ error: '内部サーバーエラー' }, { status: 500 });
    }
}
