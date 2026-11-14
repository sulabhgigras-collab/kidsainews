import { useRef, useEffect } from "react";
import { motion } from "framer-motion";

export interface NewsTab {
  id: string;
  label: string;
  emoji: string;
  categories: string[]; // matched against story.category
}

export const NEWS_TABS: NewsTab[] = [
  { id: "top", label: "Top News", emoji: "🔥", categories: [] },
  { id: "world", label: "World", emoji: "🌍", categories: ["World"] },
  { id: "us", label: "U.S.", emoji: "🇺🇸", categories: ["US"] },
  { id: "science", label: "Science", emoji: "🔬", categories: ["Science"] },
  { id: "animals", label: "Animals", emoji: "🐾", categories: ["Animals"] },
  { id: "sports", label: "Sports", emoji: "⚽", categories: ["Sports"] },
  { id: "space", label: "Space", emoji: "🚀", categories: ["Space"] },
  { id: "tech", label: "Technology", emoji: "🤖", categories: ["Tech"] },
  { id: "fun", label: "Fun", emoji: "🎉", categories: ["Culture", "Fun"] },
];

interface CategoryTabsProps {
  activeTab: string;
  onTabChange: (tabId: string) => void;
  storyCounts?: Record<string, number>;
}

const CategoryTabs = ({ activeTab, onTabChange, storyCounts }: CategoryTabsProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (activeRef.current && scrollRef.current) {
      const container = scrollRef.current;
      const button = activeRef.current;
      const scrollLeft = button.offsetLeft - container.offsetWidth / 2 + button.offsetWidth / 2;
      container.scrollTo({ left: scrollLeft, behavior: "smooth" });
    }
  }, [activeTab]);

  return (
    <div className="sticky top-[60px] z-40 bg-card/95 backdrop-blur-sm border-b-2 border-foreground/20 shadow-sm">
      <div
        ref={scrollRef}
        className="flex overflow-x-auto scrollbar-hide gap-1 px-3 py-2 container mx-auto"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {NEWS_TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          const count = storyCounts?.[tab.id];
          return (
            <motion.button
              key={tab.id}
              ref={isActive ? activeRef : undefined}
              onClick={() => onTabChange(tab.id)}
              className={`
                relative flex items-center gap-1.5 px-4 py-2 rounded-full font-bangers text-sm tracking-wide
                whitespace-nowrap transition-all shrink-0
                ${isActive
                  ? "bg-primary text-primary-foreground shadow-[2px_2px_0px_hsl(var(--foreground))]"
                  : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
                }
              `}
              whileTap={{ scale: 0.95 }}
            >
              <span className="text-base">{tab.emoji}</span>
              <span>{tab.label}</span>
              {count !== undefined && count > 0 && (
                <span className={`text-[10px] font-comic font-bold ml-0.5 ${isActive ? "text-primary-foreground/80" : "text-muted-foreground/60"}`}>
                  {count}
                </span>
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};

export default CategoryTabs;
