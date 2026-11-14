import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, Loader2, Send, MessageCircleQuestion } from "lucide-react";
import { NewsStory } from "@/lib/newsData";
import { supabase } from "@/integrations/supabase/client";

interface StoryExplanation {
  moreDetails: string;
  background: string;
  hardWords: { word: string; meaning: string }[];
  keyPeople: { name: string; who: string }[];
  whatHappenedBefore: string;
  whyItMatters: string;
}

interface StoryExplainerProps {
  story: NewsStory;
  age: number;
  language: string;
}

const SECTION_ICONS: Record<string, string> = {
  moreDetails: "📖",
  background: "🕰️",
  hardWords: "📝",
  keyPeople: "👤",
  whatHappenedBefore: "⏪",
  whyItMatters: "💡",
};

const SECTION_TITLES: Record<string, string> = {
  moreDetails: "More Details",
  background: "Background",
  hardWords: "Hard Words Explained",
  keyPeople: "Key People",
  whatHappenedBefore: "What Happened Before",
  whyItMatters: "Why This Matters",
};

const StoryExplainer = ({ story, age, language }: StoryExplainerProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [explanation, setExplanation] = useState<StoryExplanation | null>(null);
  const [error, setError] = useState(false);

  const [question, setQuestion] = useState("");
  const [askingQuestion, setAskingQuestion] = useState(false);
  const [followUpAnswer, setFollowUpAnswer] = useState<string | null>(null);

  const fetchExplanation = async () => {
    if (explanation) {
      setIsOpen(true);
      return;
    }
    setIsOpen(true);
    setLoading(true);
    setError(false);
    try {
      const { data, error: fnError } = await supabase.functions.invoke("explain-story", {
        body: {
          title: story.title,
          story: story.story,
          funFact: story.funFact,
          sourceName: story.sourceName,
          sourceUrl: story.sourceUrl,
          age,
          language,
        },
      });
      if (fnError || data?.error) throw new Error("Failed");
      setExplanation(data as StoryExplanation);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const askFollowUp = async () => {
    if (!question.trim()) return;
    setAskingQuestion(true);
    setFollowUpAnswer(null);
    try {
      const { data, error: fnError } = await supabase.functions.invoke("explain-story", {
        body: {
          title: story.title,
          story: story.story,
          funFact: story.funFact,
          sourceName: story.sourceName,
          sourceUrl: story.sourceUrl,
          age,
          language,
          followUpQuestion: question.trim(),
        },
      });
      if (fnError || data?.error) throw new Error("Failed");
      setFollowUpAnswer(data.answer);
      setQuestion("");
    } catch {
      setFollowUpAnswer("Sorry, I couldn't answer that right now. Try again!");
    } finally {
      setAskingQuestion(false);
    }
  };

  return (
    <div className="mt-3">
      <motion.button
        onClick={fetchExplanation}
        className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg border-2 border-foreground bg-accent text-accent-foreground font-bangers text-sm tracking-wider transition-colors hover:bg-accent/80"
        style={{ boxShadow: "3px 3px 0px hsl(var(--foreground))" }}
        whileTap={{ scale: 0.97 }}
      >
        <BookOpen className="w-4 h-4" />
        {isOpen ? "HIDE DETAILS" : "I WANT MORE INFO!"}
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="mt-3 space-y-3 border-2 border-foreground rounded-lg p-4 bg-card comic-dots"
              style={{ boxShadow: "3px 3px 0px hsl(var(--foreground))" }}
            >
              {loading && (
                <div className="flex flex-col items-center py-6 gap-2">
                  <Loader2 className="w-8 h-8 text-accent animate-spin" />
                  <span className="font-bangers text-sm text-muted-foreground">Getting the details...</span>
                </div>
              )}

              {error && !loading && (
                <div className="text-center py-4">
                  <p className="font-comic font-bold text-sm text-muted-foreground">Couldn't load details right now.</p>
                  <button onClick={fetchExplanation} className="font-bangers text-xs text-accent hover:underline mt-1">
                    Try Again
                  </button>
                </div>
              )}

              {explanation && !loading && (
                <>
                  {(["moreDetails", "background", "whatHappenedBefore", "whyItMatters"] as const).map((key) => {
                    const value = explanation[key];
                    if (!value) return null;
                    return (
                      <div key={key} className="flex items-start gap-2">
                        <span className="text-lg shrink-0">{SECTION_ICONS[key]}</span>
                        <div>
                          <p className="font-bangers text-xs tracking-wide text-muted-foreground uppercase">{SECTION_TITLES[key]}</p>
                          <p className="text-sm font-comic font-bold text-foreground leading-relaxed">{value}</p>
                        </div>
                      </div>
                    );
                  })}

                  {explanation.hardWords && explanation.hardWords.length > 0 && (
                    <div className="flex items-start gap-2">
                      <span className="text-lg shrink-0">{SECTION_ICONS.hardWords}</span>
                      <div>
                        <p className="font-bangers text-xs tracking-wide text-muted-foreground uppercase">{SECTION_TITLES.hardWords}</p>
                        <ul className="space-y-1 mt-1">
                          {explanation.hardWords.map((hw, i) => (
                            <li key={i} className="text-sm font-comic font-bold text-foreground">
                              <span className="text-accent font-bangers">{hw.word}</span> — {hw.meaning}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}

                  {explanation.keyPeople && explanation.keyPeople.length > 0 && (
                    <div className="flex items-start gap-2">
                      <span className="text-lg shrink-0">{SECTION_ICONS.keyPeople}</span>
                      <div>
                        <p className="font-bangers text-xs tracking-wide text-muted-foreground uppercase">{SECTION_TITLES.keyPeople}</p>
                        <ul className="space-y-1 mt-1">
                          {explanation.keyPeople.map((p, i) => (
                            <li key={i} className="text-sm font-comic font-bold text-foreground">
                              <span className="text-accent font-bangers">{p.name}</span> — {p.who}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}

                  {/* Follow-up question */}
                  <div className="border-t-2 border-foreground/20 pt-3 mt-3">
                    <div className="flex items-center gap-2 mb-2">
                      <MessageCircleQuestion className="w-4 h-4 text-accent" />
                      <p className="font-bangers text-xs tracking-wide text-muted-foreground uppercase">Ask a question about this story</p>
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={question}
                        onChange={(e) => setQuestion(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && askFollowUp()}
                        placeholder="What do you want to know?"
                        className="flex-1 px-3 py-2 rounded-lg border-2 border-foreground bg-background text-foreground font-comic font-bold text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-accent"
                        disabled={askingQuestion}
                        maxLength={200}
                      />
                      <motion.button
                        onClick={askFollowUp}
                        disabled={askingQuestion || !question.trim()}
                        className="px-3 py-2 rounded-lg border-2 border-foreground bg-accent text-accent-foreground disabled:opacity-50"
                        whileTap={{ scale: 0.95 }}
                      >
                        {askingQuestion ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                      </motion.button>
                    </div>
                    {followUpAnswer && (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-2 p-3 rounded-lg bg-accent/10 border-2 border-accent/30"
                      >
                        <p className="text-sm font-comic font-bold text-foreground leading-relaxed">{followUpAnswer}</p>
                      </motion.div>
                    )}
                  </div>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default StoryExplainer;
