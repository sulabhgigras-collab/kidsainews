import { motion } from "framer-motion";
import { ExternalLink, Heart, Volume2 } from "lucide-react";
import { useState, useRef } from "react";
import { NewsStory, DialogueLine } from "@/lib/newsData";
import StoryExplainer from "@/components/StoryExplainer";
import StoryIllustration from "@/components/StoryIllustration";

interface ComicCardProps {
  story: NewsStory;
  index: number;
  comicStyle: string;
  imageDelay?: number;
  age?: number;
  language?: string;
  onBookmarkToggle?: (story: NewsStory) => void;
  isBookmarked?: boolean;
  userId?: string;
  onStoryRead?: (story: NewsStory) => void;
}

const PANEL_COLORS = [
  "bg-comic-red",
  "bg-comic-blue",
  "bg-comic-yellow",
  "bg-comic-green",
  "bg-comic-orange",
  "bg-comic-pink",
];

const CHARACTER_INFO = {
  mina: { name: "Mina", emoji: "🐿️", color: "border-comic-orange", bg: "bg-comic-orange/10", tail: "left" },
  rosey: { name: "Rosey", emoji: "🦊", color: "border-comic-red", bg: "bg-comic-red/10", tail: "right" },
};

const formatPublishedTime = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Recent";
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

const ComicCard = ({ story, index, comicStyle, age = 10, language = "en", onBookmarkToggle, isBookmarked = false, userId, onStoryRead }: ComicCardProps) => {
  const [speaking, setSpeaking] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const toggleAudio = () => {
    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }
    const text = `${story.title}. ${story.story}. ${story.dialogue.map(d => `${d.speaker === "mina" ? "Mina" : "Rosey"} says: ${d.text}`).join(". ")}. Fun fact: ${story.funFact}`;
    const utt = new SpeechSynthesisUtterance(text);
    utt.rate = 0.9;
    utt.pitch = 1.1;
    utt.onend = () => setSpeaking(false);
    utt.onerror = () => setSpeaking(false);
    utteranceRef.current = utt;
    setSpeaking(true);
    window.speechSynthesis.speak(utt);
  };

  const panelColor = PANEL_COLORS[index % PANEL_COLORS.length];

  const rotations = [-2, 1.5, -1, 2, -1.5, 1];
  const rot = rotations[index % rotations.length];

  const dialogueLines: DialogueLine[] = story.dialogue && story.dialogue.length > 0
    ? story.dialogue
    : [
        { speaker: "mina", text: story.story },
      ];

  // Reading time estimate (150 WPM for kids)
  const wordCount = (story.story + " " + story.dialogue.map(d => d.text).join(" ") + " " + story.funFact).split(/\s+/).length;
  const readingTime = Math.max(1, Math.ceil(wordCount / 150));

  return (
    <motion.article
      className="comic-panel bg-card rounded-lg overflow-hidden"
      initial={{ opacity: 0, y: 40, rotate: rot * 2 }}
      animate={{ opacity: 1, y: 0, rotate: 0 }}
      transition={{ duration: 0.5, delay: index * 0.12, type: "spring" }}
      whileHover={{ y: -6, rotate: rot, scale: 1.02 }}
    >
      <div className={`${panelColor} px-4 py-2 flex items-center justify-between border-b-3 border-foreground`}>
        <div className="flex items-center gap-2">
          <span className="text-2xl">{story.emoji}</span>
          <span className="font-bangers text-sm uppercase tracking-wider text-foreground drop-shadow-sm">
            {story.category}
          </span>
          {story.country && (
            <span className="font-comic font-bold text-xs bg-foreground/15 text-foreground px-2 py-0.5 rounded-full">
              📍 {story.country}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <span className="font-comic font-bold text-xs text-foreground/70">
            ⏱️ {readingTime} min
          </span>
          {(story as any).simplicityScore && (
            <span className="flex items-center gap-0.5" title={`Simplicity: ${(story as any).simplicityScore}/5`}>
              {Array.from({ length: 5 }, (_, i) => (
                <span
                  key={i}
                  className={`w-1.5 h-1.5 rounded-full ${
                    i < (story as any).simplicityScore
                      ? "bg-comic-green"
                      : "bg-foreground/20"
                  }`}
                />
              ))}
            </span>
          )}
          <span className="text-lg">🐿️</span>
          <span className="text-lg">🦊</span>
          <button
            onClick={toggleAudio}
            className={`p-1 rounded-full transition ${speaking ? "bg-foreground/20" : "hover:bg-foreground/10"}`}
            title={speaking ? "Stop reading" : "Read aloud"}
          >
            <Volume2 className={`w-4 h-4 ${speaking ? "text-primary" : "text-foreground/60"}`} />
          </button>
          {userId && onBookmarkToggle && (
            <button
              onClick={() => onBookmarkToggle(story)}
              className="p-1 rounded-full hover:bg-foreground/10 transition"
              title={isBookmarked ? "Remove bookmark" : "Save story"}
            >
              <Heart
                className={`w-4 h-4 transition ${isBookmarked ? "fill-white text-foreground drop-shadow-[0_0_1px_rgba(0,0,0,0.5)]" : "text-foreground/60"}`}
              />
            </button>
          )}
          <div className="comic-burst text-xs !py-0.5 !px-2">
            #{index + 1}
          </div>
        </div>
      </div>

      <StoryIllustration
        title={story.title}
        emoji={story.emoji}
        category={story.category}
      />

      <div className="p-4 space-y-3 comic-dots">
        <h3 className="font-bangers text-2xl text-card-foreground leading-tight tracking-wide">
          {story.title}
        </h3>

        <div className="flex flex-wrap items-center gap-2 text-xs font-comic font-bold text-muted-foreground">
          <span className="px-2 py-1 rounded-full bg-secondary/40 border border-foreground/20">{story.sourceName}</span>
          <span className="px-2 py-1 rounded-full bg-secondary/40 border border-foreground/20">{formatPublishedTime(story.publishedAt)}</span>
          <a
            href={story.sourceUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-secondary/40 border border-foreground/20 hover:bg-secondary/60"
          >
            Read source <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        {/* Real article summary */}
        <div className="bg-card border-2 border-foreground/30 rounded-lg p-3">
          <p className="font-bangers text-xs tracking-wide text-muted-foreground uppercase mb-1">📰 What happened</p>
          <p className="text-sm font-comic font-bold text-foreground leading-relaxed">{story.story}</p>
        </div>

        {/* Comic dialogue - supplementary */}
        <div className="space-y-3">
          <p className="font-bangers text-xs tracking-wide text-muted-foreground uppercase">🐿️🦊 Mina & Rosey discuss</p>
          {dialogueLines.map((line, i) => {
            const char = CHARACTER_INFO[line.speaker];
            const isLeft = line.speaker === "mina";
            return (
              <motion.div
                key={i}
                className={`flex items-start gap-2 ${isLeft ? "" : "flex-row-reverse"}`}
                initial={{ opacity: 0, x: isLeft ? -20 : 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.12 + i * 0.1 }}
              >
                <div className={`shrink-0 w-10 h-10 rounded-full border-3 ${char.color} bg-card flex items-center justify-center text-xl`}
                  style={{ boxShadow: "2px 2px 0px hsl(var(--foreground))" }}
                >
                  {char.emoji}
                </div>
                <div className={`relative ${char.bg} border-2 border-foreground rounded-xl px-3 py-2 max-w-[80%]`}
                  style={{ boxShadow: "2px 2px 0px hsl(var(--foreground))" }}
                >
                  <p className="font-bangers text-[10px] tracking-wider text-muted-foreground uppercase mb-0.5">
                    {char.name}
                  </p>
                  <p className="text-sm text-foreground leading-relaxed font-comic font-bold">
                    {line.text}
                  </p>
                  <div
                    className={`absolute top-3 ${isLeft ? "-left-2" : "-right-2"} w-3 h-3 ${char.bg} border-2 border-foreground`}
                    style={{
                      clipPath: isLeft
                        ? "polygon(100% 0, 100% 100%, 0 50%)"
                        : "polygon(0 0, 0 100%, 100% 50%)",
                    }}
                  />
                </div>
              </motion.div>
            );
          })}
        </div>

        <div className="flex items-start gap-3 bg-secondary/40 border-2 border-foreground rounded-lg p-3 relative"
          style={{ transform: "rotate(-0.5deg)" }}
        >
          <span className="text-xl shrink-0">🔎</span>
          <div>
            <p className="font-bangers text-sm text-foreground tracking-wide">FROM THE ARTICLE</p>
            <p className="text-xs text-foreground/80 leading-relaxed font-comic font-bold">{story.funFact}</p>
          </div>
        </div>

        <StoryExplainer story={story} age={age} language={language} />
      </div>
    </motion.article>
  );
};

export default ComicCard;
