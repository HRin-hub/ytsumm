-- Enable Row Level Security (RLS) but set policies to allow anonymous read/write for now
-- Note: In a real production environment, you'd want tighter security policies.

-- Create videos/summaries table
CREATE TABLE IF NOT EXISTS public.videos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    youtube_id TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    summary_text TEXT NOT NULL,
    view_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create tags table
CREATE TABLE IF NOT EXISTS public.tags (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT UNIQUE NOT NULL
);

-- Create many-to-many relationship table for videos and tags
CREATE TABLE IF NOT EXISTS public.video_tags (
    video_id UUID REFERENCES public.videos(id) ON DELETE CASCADE,
    tag_id UUID REFERENCES public.tags(id) ON DELETE CASCADE,
    PRIMARY KEY (video_id, tag_id)
);

-- Create IP limits table for abuse prevention
CREATE TABLE IF NOT EXISTS public.ip_limits (
    ip_address TEXT PRIMARY KEY,
    request_count INTEGER DEFAULT 1,
    last_request_date DATE DEFAULT CURRENT_DATE
);

-- Setup basic RLS (Row Level Security) - allow public access for this MVP
ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ip_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to videos" ON public.videos FOR SELECT USING (true);
CREATE POLICY "Allow public insert to videos" ON public.videos FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update to videos (view_count)" ON public.videos FOR UPDATE USING (true);

CREATE POLICY "Allow public read access to tags" ON public.tags FOR SELECT USING (true);
CREATE POLICY "Allow public insert to tags" ON public.tags FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public read access to video_tags" ON public.video_tags FOR SELECT USING (true);
CREATE POLICY "Allow public insert to video_tags" ON public.video_tags FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public read access to ip_limits" ON public.ip_limits FOR SELECT USING (true);
CREATE POLICY "Allow public insert to ip_limits" ON public.ip_limits FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update to ip_limits" ON public.ip_limits FOR UPDATE USING (true);
