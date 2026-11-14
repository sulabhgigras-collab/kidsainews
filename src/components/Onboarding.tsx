import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, ChevronLeft, Sparkles, Zap } from "lucide-react";
import { INTERESTS, COMIC_STYLES, COUNTRIES, LANGUAGES, savePreferences, UserPreferences } from "@/lib/newsData";

interface OnboardingProps {
  onComplete: (prefs: UserPreferences) => void;
  initialPreferences?: UserPreferences | null;
}

const Onboarding = ({ onComplete, initialPreferences }: OnboardingProps) => {
  const [step, setStep] = useState(initialPreferences ? 2 : 0);
  const [age, setAge] = useState(initialPreferences?.age ?? 8);
  const [country, setCountry] = useState(initialPreferences?.country ?? "");
  const [additionalCountries, setAdditionalCountries] = useState<string[]>(initialPreferences?.additionalCountries ?? []);
  const [interests, setInterests] = useState<string[]>(initialPreferences?.interests ?? []);
  const [comicStyle, setComicStyle] = useState(initialPreferences?.comicStyle ?? "");
  const [language, setLanguage] = useState(initialPreferences?.language ?? "en");

  const toggleInterest = (id: string) => {
    setInterests((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const toggleAdditionalCountry = (c: string) => {
    if (c === country) return;
    setAdditionalCountries((prev) =>
      prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]
    );
  };

  const canProceed = () => {
    if (step === 0) return age >= 5 && age <= 15;
    if (step === 1) return country !== "";
    if (step === 2) return interests.length >= 1;
    if (step === 3) return comicStyle !== "";
    if (step === 4) return language !== "";
    return false;
  };

  const handleFinish = () => {
    const prefs: UserPreferences = {
      age,
      country,
      additionalCountries,
      interests,
      comicStyle,
      language,
      onboardingComplete: true,
    };
    savePreferences(prefs);
    onComplete(prefs);
  };

  const steps = [
    // Step 0: Age
    <motion.div key="age" initial={{ opacity: 0, x: 80 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -80 }} className="space-y-8 text-center">
      <div>
        <h2 className="font-bangers text-4xl md:text-5xl text-foreground tracking-wider"
          style={{ textShadow: "3px 3px 0px hsl(var(--secondary))" }}
        >
          HOW OLD ARE YOU? 🎂
        </h2>
        <p className="font-comic font-bold text-muted-foreground mt-2">We'll make the news perfect for your age!</p>
      </div>
      <div className="flex flex-col items-center gap-4">
        <motion.div
          className="font-bangers text-9xl text-primary"
          key={age}
          initial={{ scale: 1.3 }}
          animate={{ scale: 1 }}
          style={{ textShadow: "4px 4px 0px hsl(var(--secondary))" }}
        >
          {age}
        </motion.div>
        <input
          type="range"
          min={5}
          max={15}
          value={age}
          onChange={(e) => setAge(Number(e.target.value))}
          className="w-64 h-4 rounded-full appearance-none cursor-pointer accent-primary bg-muted border-2 border-foreground"
        />
        <p className="font-comic font-bold text-sm text-muted-foreground">Slide to pick your age (5-15)</p>
      </div>
    </motion.div>,

    // Step 1: Country
    <motion.div key="country" initial={{ opacity: 0, x: 80 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -80 }} className="space-y-6">
      <div className="text-center">
        <h2 className="font-bangers text-4xl md:text-5xl text-foreground tracking-wider"
          style={{ textShadow: "3px 3px 0px hsl(var(--secondary))" }}
        >
          WHERE ARE YOU FROM? 🌍
        </h2>
        <p className="font-comic font-bold text-muted-foreground mt-2">We'll show you news from your country first!</p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-64 overflow-y-auto p-1">
        {COUNTRIES.map((c) => (
          <button
            key={c}
            onClick={() => setCountry(c)}
            className={`px-3 py-2 rounded-lg text-sm font-bold font-comic transition-all border-2 ${
              country === c
                ? "bg-primary text-primary-foreground border-foreground shadow-[3px_3px_0px_hsl(var(--foreground))]"
                : "bg-card text-card-foreground border-foreground/20 hover:border-foreground/50"
            }`}
          >
            {c}
          </button>
        ))}
      </div>
      {country && (
        <div className="space-y-3">
          <p className="font-comic font-bold text-sm text-muted-foreground text-center">
            Want news from other countries too? (optional)
          </p>
          <div className="flex flex-wrap gap-2 justify-center max-h-32 overflow-y-auto">
            {COUNTRIES.filter((c) => c !== country).map((c) => (
              <button
                key={c}
                onClick={() => toggleAdditionalCountry(c)}
                className={`px-2 py-1 rounded-md text-xs font-bold font-comic transition-all border-2 ${
                  additionalCountries.includes(c)
                    ? "bg-secondary text-secondary-foreground border-foreground"
                    : "bg-muted/50 text-muted-foreground border-transparent hover:border-foreground/30"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      )}
    </motion.div>,

    // Step 2: Interests
    <motion.div key="interests" initial={{ opacity: 0, x: 80 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -80 }} className="space-y-6">
      <div className="text-center">
        <h2 className="font-bangers text-4xl md:text-5xl text-foreground tracking-wider"
          style={{ textShadow: "3px 3px 0px hsl(var(--secondary))" }}
        >
          WHAT EXCITES YOU? ⚡
        </h2>
        <p className="font-comic font-bold text-muted-foreground mt-2">Pick at least 1 topic you love!</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {INTERESTS.map((item) => (
          <button
            key={item.id}
            onClick={() => toggleInterest(item.id)}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg text-left font-bold font-comic transition-all border-2 ${
              interests.includes(item.id)
                ? "bg-primary/15 text-foreground border-foreground shadow-[3px_3px_0px_hsl(var(--foreground))]"
                : "bg-card text-card-foreground border-foreground/20 hover:border-foreground/50"
            }`}
          >
            <span className="text-2xl">{item.emoji}</span>
            <span className="text-sm">{item.label}</span>
          </button>
        ))}
      </div>
    </motion.div>,

    // Step 3: Comic Style
    <motion.div key="comic" initial={{ opacity: 0, x: 80 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -80 }} className="space-y-6">
      <div className="text-center">
        <h2 className="font-bangers text-4xl md:text-5xl text-foreground tracking-wider"
          style={{ textShadow: "3px 3px 0px hsl(var(--secondary))" }}
        >
          PICK YOUR STYLE! 🎨
        </h2>
        <p className="font-comic font-bold text-muted-foreground mt-2">How should your news look?</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {COMIC_STYLES.map((style) => (
          <button
            key={style.id}
            onClick={() => setComicStyle(style.id)}
            className={`flex items-center gap-4 px-5 py-4 rounded-lg text-left transition-all border-2 ${
              comicStyle === style.id
                ? "bg-secondary/30 text-foreground border-foreground shadow-[4px_4px_0px_hsl(var(--foreground))]"
                : "bg-card text-card-foreground border-foreground/20 hover:border-foreground/50"
            }`}
          >
            <span className="text-4xl">{style.emoji}</span>
            <div>
              <div className="font-bangers text-lg tracking-wide">{style.label}</div>
              <div className="text-xs font-comic font-bold text-muted-foreground">{style.description}</div>
            </div>
          </button>
        ))}
      </div>
    </motion.div>,

    // Step 4: Language
    <motion.div key="language" initial={{ opacity: 0, x: 80 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -80 }} className="space-y-6">
      <div className="text-center">
        <h2 className="font-bangers text-4xl md:text-5xl text-foreground tracking-wider"
          style={{ textShadow: "3px 3px 0px hsl(var(--secondary))" }}
        >
          PICK YOUR LANGUAGE! 🗣️
        </h2>
        <p className="font-comic font-bold text-muted-foreground mt-2">What language should we tell stories in?</p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {LANGUAGES.map((lang) => (
          <button
            key={lang.id}
            onClick={() => setLanguage(lang.id)}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg text-left font-bold font-comic transition-all border-2 ${
              language === lang.id
                ? "bg-primary/15 text-foreground border-foreground shadow-[3px_3px_0px_hsl(var(--foreground))]"
                : "bg-card text-card-foreground border-foreground/20 hover:border-foreground/50"
            }`}
          >
            <span className="text-2xl">{lang.emoji}</span>
            <span className="text-sm">{lang.label}</span>
          </button>
        ))}
      </div>
    </motion.div>,
  ];

  return (
    <div className="min-h-screen bg-background comic-dots flex items-center justify-center p-4">
      {/* Comic decorative elements */}
      <div className="fixed top-4 left-4 comic-burst text-2xl !rotate-[-12deg]">POW!</div>
      <div className="fixed bottom-8 right-6 comic-burst text-2xl !rotate-[8deg] !bg-primary !text-primary-foreground">BAM!</div>
      <div className="fixed top-1/4 right-8 comic-burst text-lg !rotate-[-5deg] !bg-accent !text-accent-foreground">ZAP!</div>

      <div className="relative w-full max-w-2xl">
        {/* Progress bar - comic style */}
        <div className="flex justify-center gap-3 mb-8">
          {[0, 1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className={`h-3 rounded-sm border-2 border-foreground transition-all duration-300 ${
                i <= step ? "bg-primary w-14" : "bg-muted w-10"
              }`}
            />
          ))}
        </div>

        <div className="comic-panel bg-card rounded-lg p-6 md:p-8">
          <AnimatePresence mode="wait">{steps[step]}</AnimatePresence>
        </div>

        {/* Navigation */}
        <div className="flex justify-between mt-6">
          <button
            onClick={() => setStep((s) => s - 1)}
            className={`flex items-center gap-1 px-4 py-2 font-bangers text-lg tracking-wider transition-all ${
              step === 0
                ? "opacity-0 pointer-events-none"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <ChevronLeft className="w-5 h-5" /> BACK
          </button>

          {step < 4 ? (
            <motion.button
              onClick={() => setStep((s) => s + 1)}
              disabled={!canProceed()}
              className="comic-banner flex items-center gap-1 bg-primary text-primary-foreground px-6 py-3 font-bangers text-lg tracking-wider disabled:opacity-40 disabled:shadow-none transition-all"
              whileHover={canProceed() ? { scale: 1.05 } : {}}
              whileTap={canProceed() ? { scale: 0.95 } : {}}
            >
              NEXT <ChevronRight className="w-5 h-5" />
            </motion.button>
          ) : (
            <motion.button
              onClick={handleFinish}
              disabled={!canProceed()}
              className="comic-banner flex items-center gap-2 bg-comic-green text-primary-foreground px-8 py-3 font-bangers text-lg tracking-wider disabled:opacity-40 disabled:shadow-none transition-all"
              whileHover={canProceed() ? { scale: 1.05 } : {}}
              whileTap={canProceed() ? { scale: 0.95 } : {}}
            >
              <Zap className="w-5 h-5" /> LET'S GO!
            </motion.button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
