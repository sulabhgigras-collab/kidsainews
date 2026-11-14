import { useState, useEffect, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import { RefreshCw, Settings, Sparkles, Zap, Globe } from "lucide-react";
import ComicCard from "@/components/ComicCard";
import CategoryTabs, { NEWS_TABS } from "@/components/CategoryTabs";
import StorySkeletonGrid from "@/components/StoryCardSkeleton";
import {
  UserPreferences,
  NewsStory,
  clearNewsCache,
  getCachedNews,
  getNewsCacheKey,
  cacheNews,
  COMIC_STYLES,
  INTERESTS,
  LANGUAGES,
  savePreferences,
} from "@/lib/newsData";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface NewsFeedProps {
  preferences: UserPreferences;
  onEditPreferences: () => void;
  onPreferencesChange?: (prefs: UserPreferences) => void;
}

const NewsFeed = ({ preferences, onEditPreferences, onPreferencesChange }: NewsFeedProps) => {
  const [stories, setStories] = useState<NewsStory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [sourcesUsed, setSourcesUsed] = useState<string[]>([]);
  const [noNewsReason, setNoNewsReason] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("top");
  const { toast } = useToast();

  const currentLang = LANGUAGES.find((l) => l.id === preferences.language) || LANGUAGES[0];
  const cacheKey = getNewsCacheKey(preferences);
  const interestLabels = useMemo(
    () => preferences.interests
      .map((id) => INTERESTS.find((i) => i.id === id)?.label ?? id)
      .filter(Boolean),
    [preferences.interests]
  );

  const handleLanguageChange = (langId: string) => {
    const updated = { ...preferences, language: langId };
    savePreferences(updated);
    onPreferencesChange?.(updated);
    setShowLangMenu(false);
    clearNewsCache();
    fetchNews(true);
  };

  const currentStyle = COMIC_STYLES.find((s) => s.id === preferences.comicStyle);

  const fetchNews = useCallback(async (forceRefresh = false) => {
    // Check localStorage cache first (instant)
    if (!forceRefresh) {
      const cached = getCachedNews(cacheKey);
      if (cached) {
        setStories(cached.stories);
        setSourcesUsed([...new Set(cached.stories.map((story) => story.sourceName).filter(Boolean))]);
        setNoNewsReason(null);
        setLoading(false);
        return;
      }
    }

    setLoading(true);
    setError(null);
    setNoNewsReason(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke("generate-news", {
        body: {
          age: preferences.age,
          interests: interestLabels,
          country: preferences.country,
          additionalCountries: preferences.additionalCountries,
          comicStyle: preferences.comicStyle,
          language: preferences.language || "en",
        },
      });

      if (fnError) throw new Error(fnError.message);
      if (data?.error) throw new Error(data.error);
      if (!Array.isArray(data?.stories)) throw new Error("Invalid response format");

      setStories(data.stories);
      setSourcesUsed(Array.isArray(data?.sourcesUsed) ? data.sourcesUsed.filter(Boolean) : []);
      setNoNewsReason(typeof data?.noNewsReason === "string" ? data.noNewsReason : null);

      if (data.stories.length > 0) {
        cacheNews(data.stories, cacheKey);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong!";
      setError(message);
      toast({ title: "Oops!", description: message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [cacheKey, interestLabels, preferences, toast]);

  useEffect(() => {
    fetchNews();
  }, [fetchNews]);

  const filteredStories = useMemo(() => {
    if (activeTab === "top") return stories;
    const tab = NEWS_TABS.find((t) => t.id === activeTab);
    if (!tab || tab.categories.length === 0) return stories;
    return stories.filter((s) => tab.categories.includes(s.category));
  }, [stories, activeTab]);

  const storyCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const tab of NEWS_TABS) {
      counts[tab.id] = tab.id === "top" ? stories.length : stories.filter((s) => tab.categories.includes(s.category)).length;
    }
    return counts;
  }, [stories]);

  const today = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  return (
    <div className="min-h-screen bg-background comic-dots">
      <header className="sticky top-0 z-50 bg-primary border-b-4 border-foreground shadow-lg">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <motion.div
              className="bg-secondary border-2 border-foreground rounded-lg p-1.5"
              style={{ boxShadow: "3px 3px 0px hsl(var(--foreground))" }}
              whileHover={{ rotate: 10 }}
            >
              <Zap className="w-5 h-5 text-foreground" />
            </motion.div>
            <span className="font-bangers text-2xl text-primary-foreground tracking-wider drop-shadow-md">
              Kids<span className="text-secondary">AI</span>News
            </span>
          </div>
          <div className="flex items-center gap-2">
            <motion.button
              onClick={() => fetchNews(true)}
              disabled={loading}
              className="comic-banner flex items-center gap-1 bg-secondary text-foreground px-4 py-2 rounded-none font-bangers tracking-wide text-sm disabled:opacity-50"
              whileTap={{ scale: 0.95 }}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              NEW!
            </motion.button>
            <div className="relative">
              <button
                onClick={() => setShowLangMenu(!showLangMenu)}
                className="flex items-center gap-1 p-2 rounded-lg border-2 border-primary-foreground/30 hover:bg-primary-foreground/10 transition"
              >
                <span className="text-lg">{currentLang.emoji}</span>
                <Globe className="w-4 h-4 text-primary-foreground" />
              </button>
              {showLangMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowLangMenu(false)} />
                  <div className="absolute right-0 top-full mt-2 z-50 bg-card border-2 border-foreground rounded-lg shadow-[4px_4px_0px_hsl(var(--foreground))] p-2 w-48 max-h-64 overflow-y-auto">
                    {LANGUAGES.map((lang) => (
                      <button
                        key={lang.id}
                        onClick={() => handleLanguageChange(lang.id)}
                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-left font-comic font-bold text-sm transition-all ${
                          preferences.language === lang.id
                            ? "bg-primary/15 text-foreground"
                            : "text-card-foreground hover:bg-muted"
                        }`}
                      >
                        <span>{lang.emoji}</span>
                        <span>{lang.label}</span>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
            <button
              onClick={onEditPreferences}
              className="p-2 rounded-lg border-2 border-primary-foreground/30 hover:bg-primary-foreground/10 transition"
            >
              <Settings className="w-5 h-5 text-primary-foreground" />
            </button>
          </div>
        </div>
      </header>

      <CategoryTabs activeTab={activeTab} onTabChange={setActiveTab} storyCounts={storyCounts} />

      <main className="container mx-auto px-4 py-8">
        <motion.div
          className="text-center mb-10"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", bounce: 0.4 }}
        >
          <p className="font-comic font-bold text-sm text-muted-foreground uppercase tracking-widest">{today}</p>
          <div className="inline-block mt-2 mb-4">
            <h1 className="font-bangers text-5xl md:text-6xl text-foreground tracking-wider"
              style={{ textShadow: "3px 3px 0px hsl(var(--secondary)), 6px 6px 0px hsl(var(--primary) / 0.3)" }}
            >
              DAILY NEWS COMICS! {currentStyle?.emoji}
            </h1>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2 mb-3">
            <span className="comic-burst text-sm !bg-primary !text-primary-foreground">
              📍 {preferences.country}
              {preferences.additionalCountries.length > 0 && ` +${preferences.additionalCountries.length}`}
            </span>
            {interestLabels.slice(0, 5).map((label) => (
              <span key={label} className="comic-burst text-xs !bg-accent !text-accent-foreground">{label}</span>
            ))}
            {interestLabels.length > 5 && (
              <span className="font-bangers text-sm text-muted-foreground">+{interestLabels.length - 5} more</span>
            )}
          </div>
          {sourcesUsed.length > 0 && (
            <p className="font-comic font-bold text-sm text-muted-foreground">Trusted sources: {sourcesUsed.join(", ")}</p>
          )}
        </motion.div>

        {/* Skeleton loading */}
        {loading && <StorySkeletonGrid count={6} />}

        {error && !loading && (
          <div className="text-center py-16 space-y-4">
            <p className="text-6xl">💥</p>
            <p className="font-bangers text-3xl text-foreground tracking-wider">CRASH! BANG!</p>
            <p className="font-comic font-bold text-muted-foreground">{error}</p>
            <motion.button
              onClick={() => fetchNews(true)}
              className="comic-banner bg-primary text-primary-foreground px-8 py-3 font-bangers text-lg tracking-wider"
              whileTap={{ scale: 0.95 }}
            >
              TRY AGAIN!
            </motion.button>
          </div>
        )}

        {!loading && !error && stories.length === 0 && (
          <div className="text-center py-16 space-y-4">
            <p className="text-6xl">📰</p>
            <p className="font-bangers text-3xl text-foreground tracking-wider">NO SAFE VERIFIED NEWS RIGHT NOW</p>
            <p className="font-comic font-bold text-muted-foreground max-w-xl mx-auto">
              {noNewsReason || "We could not find real, child-safe stories for this country and topic right now."}
            </p>
            <motion.button
              onClick={() => fetchNews(true)}
              className="comic-banner bg-primary text-primary-foreground px-8 py-3 font-bangers text-lg tracking-wider"
              whileTap={{ scale: 0.95 }}
            >
              CHECK AGAIN!
            </motion.button>
          </div>
        )}

        {!loading && !error && filteredStories.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
            {filteredStories.map((story, i) => (
              <ComicCard
                key={`${story.sourceUrl}-${story.publishedAt}`}
                story={story}
                index={i}
                comicStyle={preferences.comicStyle}
                imageDelay={i * 12000}
                age={preferences.age}
                language={preferences.language}
              />
            ))}
          </div>
        )}

        {!loading && !error && stories.length > 0 && filteredStories.length === 0 && (
          <div className="text-center py-16 space-y-4">
            <p className="text-6xl">{activeTab === "fun" ? "🎉" : "📭"}</p>
            <p className="font-bangers text-3xl text-foreground tracking-wider">
              {activeTab === "fun" ? "NO FUN STORIES TODAY YET" : "NO STORIES IN THIS SECTION"}
            </p>
            <p className="font-comic font-bold text-muted-foreground">
              {activeTab === "fun"
                ? "No fun stories today yet — check back later!"
                : "Try checking another tab or refresh for new stories!"}
            </p>
            <motion.button
              onClick={() => setActiveTab("top")}
              className="comic-banner bg-primary text-primary-foreground px-8 py-3 font-bangers text-lg tracking-wider"
              whileTap={{ scale: 0.95 }}
            >
              VIEW ALL NEWS
            </motion.button>
          </div>
        )}
      </main>

      <footer className="border-t-4 border-foreground bg-primary/10 comic-dots py-4 text-center">
        <p className="font-bangers text-sm text-muted-foreground tracking-wider">
          ⚡ REAL SOURCES ONLY • MADE FOR KIDS • UPDATED DAILY ⚡
        </p>
      </footer>
    </div>
  );
};

export default NewsFeed;
