import { useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, BookmarkX } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useBookmarks } from "@/hooks/useBookmarks";
import { getPreferences } from "@/lib/newsData";
import ComicCard from "@/components/ComicCard";

const Bookmarks = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { bookmarks, toggleBookmark, isBookmarked } = useBookmarks(user?.id ?? null);
  const prefs = getPreferences();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/");
    }
  }, [authLoading, user, navigate]);

  if (authLoading) return null;

  return (
    <div className="min-h-screen bg-background comic-dots">
      <header className="sticky top-0 z-50 bg-primary border-b-4 border-foreground shadow-lg">
        <div className="container mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => navigate("/")}
            className="p-2 rounded-lg border-2 border-primary-foreground/30 hover:bg-primary-foreground/10 transition"
          >
            <ArrowLeft className="w-5 h-5 text-primary-foreground" />
          </button>
          <span className="font-bangers text-2xl text-primary-foreground tracking-wider">
            My Saved Stories
          </span>
          <span className="text-2xl">💾</span>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {bookmarks.length === 0 ? (
          <div className="text-center py-16 space-y-4">
            <p className="text-6xl">📚</p>
            <p className="font-bangers text-3xl text-foreground tracking-wider">NO SAVED STORIES YET</p>
            <p className="font-comic font-bold text-muted-foreground max-w-md mx-auto">
              Tap the heart on any story to save it here! You can read your favorites anytime.
            </p>
            <motion.button
              onClick={() => navigate("/")}
              className="comic-banner bg-primary text-primary-foreground px-8 py-3 font-bangers text-lg tracking-wider"
              whileTap={{ scale: 0.95 }}
            >
              FIND STORIES!
            </motion.button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
            {bookmarks.map((bm, i) => (
              <div key={bm.id} className="relative">
                <ComicCard
                  story={bm.story_data}
                  index={i}
                  comicStyle={prefs?.comicStyle ?? "superhero"}
                  age={prefs?.age}
                  language={prefs?.language}
                  onBookmarkToggle={toggleBookmark}
                  isBookmarked={isBookmarked(bm.story_data.sourceUrl)}
                  userId={user?.id}
                />
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Bookmarks;
