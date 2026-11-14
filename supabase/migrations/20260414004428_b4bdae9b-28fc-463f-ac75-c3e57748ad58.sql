
CREATE TABLE public.daily_news_cache (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cache_key TEXT NOT NULL,
  cache_date DATE NOT NULL DEFAULT CURRENT_DATE,
  stories JSONB NOT NULL DEFAULT '[]'::jsonb,
  sources_used TEXT[] NOT NULL DEFAULT '{}',
  no_news_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (cache_key, cache_date)
);

-- Index for fast lookups
CREATE INDEX idx_daily_news_cache_lookup ON public.daily_news_cache (cache_key, cache_date);

-- Enable RLS
ALTER TABLE public.daily_news_cache ENABLE ROW LEVEL SECURITY;

-- Anyone can read cached news (no auth required for this public app)
CREATE POLICY "Anyone can read cached news"
ON public.daily_news_cache
FOR SELECT
USING (true);
