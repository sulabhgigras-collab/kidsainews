import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ExternalLink, ImageIcon, Loader2, RotateCw } from "lucide-react";
import { NewsStory, DialogueLine } from "@/lib/newsData";
import { supabase } from "@/integrations/supabase/client";
import StoryExplainer from "@/components/StoryExplainer";

interface ComicCardProps {
  story: NewsStory;
  index: number;
  comicStyle: string;
  imageDelay?: number;
  age?: number;
  language?: string;
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

const ComicCard = ({ story, index, comicStyle, imageDelay = 0, age = 10, language = "en" }: ComicCardProps) => {
  const panelColor = PANEL_COLORS[index % PANEL_COLORS.length];
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);

  const fetchImage = (attempt: number = 0) => {
    if (!story.imageDescription) return;

    const cacheKey = `kidsainews_img_${Array.from(new TextEncoder().encode(story.title)).map(b => b.toString(36)).join("").slice(0, 30)}`;
    const cached = sessionStorage.getItem(cacheKey);
    if (cached) {
      setImageUrl(cached);
      return;
    }

    setImageLoading(true);
    setImageFailed(false);

    const delay = attempt === 0 ? imageDelay : imageDelay + Math.pow(2, attempt) * 5000;

    const timeout = setTimeout(async () => {
      try {
        const { data, error } = await supabase.functions.invoke("generate-comic-image", {
          body: { imageDescription: story.imageDescription, comicStyle },
        });

        if (!error && data?.imageUrl) {
          setImageUrl(data.imageUrl);
          try { sessionStorage.setItem(cacheKey, data.imageUrl); } catch {}
          setImageLoading(false);
        } else if (attempt < 4) {
          fetchImage(attempt + 1);
        } else {
          setImageLoading(false);
          setImageFailed(true);
        }
      } catch {
        if (attempt < 4) {
          fetchImage(attempt + 1);
        } else {
          setImageLoading(false);
          setImageFailed(true);
        }
      }
    }, delay);

    return () => clearTimeout(timeout);
  };

  useEffect(() => {
    const cleanup = fetchImage(0);
    return cleanup;
  }, [story.imageDescription, story.title, comicStyle, imageDelay]);

  const rotations = [-2, 1.5, -1, 2, -1.5, 1];
  const rot = rotations[index % rotations.length];

  const dialogueLines: DialogueLine[] = story.dialogue && story.dialogue.length > 0
    ? story.dialogue
    : [
        { speaker: "mina", text: story.story },
      ];

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
          <span className="text-lg">🐿️</span>
          <span className="text-lg">🦊</span>
          <div className="comic-burst text-xs !py-0.5 !px-2">
            #{index + 1}
          </div>
        </div>
      </div>

      <div className="relative w-full aspect-[16/10] bg-muted comic-dots overflow-hidden border-b-3 border-foreground">
        {imageLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted/80 gap-2">
            <Loader2 className="w-10 h-10 text-comic-red animate-spin" />
            <span className="font-bangers text-sm text-muted-foreground">Drawing...</span>
          </div>
        )}
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={`${story.title} illustration based on a real news article from ${story.sourceName}`}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : imageFailed ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted/50 gap-2">
            <ImageIcon className="w-10 h-10 text-muted-foreground/60" />
            <button
              onClick={() => fetchImage(0)}
              className="flex items-center gap-1 text-xs font-bold text-comic-blue hover:underline"
            >
              <RotateCw className="w-3 h-3" /> Retry
            </button>
          </div>
        ) : !imageLoading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-muted/30">
            <ImageIcon className="w-10 h-10 text-muted-foreground/40" />
          </div>
        ) : null}
      </div>

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
