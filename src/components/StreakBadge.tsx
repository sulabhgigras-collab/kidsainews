import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

interface StreakBadgeProps {
  currentStreak: number;
  longestStreak: number;
  badges: string[];
}

const BADGE_INFO: Record<string, { emoji: string; description: string }> = {
  "Curious Cat": { emoji: "🐱", description: "3-day reading streak!" },
  "News Explorer": { emoji: "🧭", description: "7-day reading streak!" },
  "Super Reader": { emoji: "🦸", description: "30-day reading streak!" },
};

const StreakBadge = ({ currentStreak, longestStreak, badges }: StreakBadgeProps) => {
  const [showPopup, setShowPopup] = useState(false);

  if (currentStreak === 0 && badges.length === 0) return null;

  // Show highest badge emoji, or flame if no badges yet
  const BADGE_ORDER = ["Super Reader", "News Explorer", "Curious Cat"];
  const topBadge = BADGE_ORDER.find((b) => badges.includes(b));
  const streakEmoji = topBadge ? BADGE_INFO[topBadge].emoji : "🔥";

  return (
    <div className="relative">
      <motion.button
        onClick={() => setShowPopup(!showPopup)}
        className="flex items-center gap-1 px-2 py-1 rounded-lg border-2 border-primary-foreground/30 hover:bg-primary-foreground/10 transition"
        whileTap={{ scale: 0.95 }}
      >
        <motion.span
          className="text-lg"
          animate={currentStreak > 0 ? { scale: [1, 1.2, 1] } : {}}
          transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 3 }}
        >
          {streakEmoji}
        </motion.span>
        <span className="font-bangers text-sm text-primary-foreground tracking-wide">
          {currentStreak}
        </span>
      </motion.button>

      <AnimatePresence>
        {showPopup && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setShowPopup(false)} />
            <motion.div
              className="absolute right-0 top-full mt-2 z-50 bg-card border-2 border-foreground rounded-lg shadow-[4px_4px_0px_hsl(var(--foreground))] p-4 w-56"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
            >
              <p className="font-bangers text-lg text-foreground tracking-wide mb-2">Reading Streak</p>
              <div className="space-y-2 text-sm font-comic font-bold">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Current</span>
                  <span className="text-foreground">🔥 {currentStreak} days</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Best</span>
                  <span className="text-foreground">⭐ {longestStreak} days</span>
                </div>
              </div>
              {badges.length > 0 && (
                <div className="mt-3 pt-3 border-t border-foreground/20">
                  <p className="font-bangers text-xs text-muted-foreground tracking-wide mb-2">BADGES</p>
                  <div className="flex flex-wrap gap-1">
                    {badges.map((badge) => {
                      const info = BADGE_INFO[badge];
                      return (
                        <span
                          key={badge}
                          className="inline-flex items-center gap-1 px-2 py-1 bg-secondary/40 border border-foreground/20 rounded-full text-xs font-comic font-bold"
                          title={info?.description}
                        >
                          {info?.emoji} {badge}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default StreakBadge;
