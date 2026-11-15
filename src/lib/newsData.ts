export interface UserPreferences {
  age: number;
  country: string;
  additionalCountries: string[];
  interests: string[];
  comicStyle: string;
  language: string;
  onboardingComplete: boolean;
}

export const LANGUAGES = [
  { id: "en", label: "English", emoji: "🇬🇧" },
  { id: "es", label: "Español", emoji: "🇪🇸" },
  { id: "fr", label: "Français", emoji: "🇫🇷" },
  { id: "de", label: "Deutsch", emoji: "🇩🇪" },
  { id: "pt", label: "Português", emoji: "🇧🇷" },
  { id: "hi", label: "हिन्दी", emoji: "🇮🇳" },
  { id: "ar", label: "العربية", emoji: "🇸🇦" },
  { id: "zh", label: "中文", emoji: "🇨🇳" },
  { id: "ja", label: "日本語", emoji: "🇯🇵" },
  { id: "ko", label: "한국어", emoji: "🇰🇷" },
  { id: "ur", label: "اردو", emoji: "🇵🇰" },
  { id: "nl", label: "Nederlands", emoji: "🇳🇱" },
  { id: "it", label: "Italiano", emoji: "🇮🇹" },
  { id: "sv", label: "Svenska", emoji: "🇸🇪" },
  { id: "th", label: "ไทย", emoji: "🇹🇭" },
];

export interface DialogueLine {
  speaker: "mina" | "rosey";
  text: string;
}

export type StoryCategory = "Science" | "Nature" | "Tech" | "Sports" | "Space" | "World" | "Culture" | "Health" | "Animals" | "US" | "Fun" | "Environment" | "Politics" | "Education";

export interface NewsStory {
  title: string;
  story: string;
  dialogue: DialogueLine[];
  funFact: string;
  emoji: string;
  category: StoryCategory | string;
  imageDescription: string;
  country?: string;
  sourceName: string;
  sourceUrl: string;
  publishedAt: string;
  simplicityScore?: number;
}

const NEWS_CACHE_VERSION = "v6";
const NEWS_CACHE_PREFIX = `kidsainews_cache_${NEWS_CACHE_VERSION}_`;

function hashString(value: string): string {
  let hash = 0;

  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }

  return hash.toString(36);
}

function normalizePreferencesForCache(prefs: UserPreferences) {
  return {
    ...prefs,
    additionalCountries: [...prefs.additionalCountries].sort(),
    interests: [...prefs.interests].sort(),
  };
}

export function getNewsCacheKey(prefs: UserPreferences): string {
  return `${NEWS_CACHE_PREFIX}${hashString(JSON.stringify(normalizePreferencesForCache(prefs)))}`;
}

export function clearNewsCache(): void {
  Object.keys(localStorage)
    .filter((key) => key === "kidsainews_cache" || key.startsWith(NEWS_CACHE_PREFIX))
    .forEach((key) => localStorage.removeItem(key));
}

export const INTERESTS = [
  { id: "science", label: "Science & Discoveries", emoji: "🔬" },
  { id: "space", label: "Space & Planets", emoji: "🚀" },
  { id: "animals", label: "Animals & Nature", emoji: "🐾" },
  { id: "tech", label: "Robots & Technology", emoji: "🤖" },
  { id: "sports", label: "Sports & Games", emoji: "⚽" },
  { id: "art", label: "Art & Creativity", emoji: "🎨" },
  { id: "environment", label: "Climate & Environment", emoji: "🌍" },
  { id: "health", label: "Health & Body", emoji: "💪" },
  { id: "history", label: "History & Culture", emoji: "🏛️" },
  { id: "food", label: "Food & Cooking", emoji: "🍕" },
  { id: "geopolitics", label: "Geopolitics & World Affairs", emoji: "🗺️" },
];

export const COMIC_STYLES = [
  { id: "superhero", label: "Superhero Style", emoji: "🦸", description: "POW! BAM! News with superhero energy!" },
  { id: "adventure", label: "Adventure Quest", emoji: "⚔️", description: "Every story is an epic quest!" },
  { id: "detective", label: "Detective Mystery", emoji: "🔍", description: "Uncover clues in every story!" },
  { id: "space-explorer", label: "Space Explorer", emoji: "👨‍🚀", description: "Explore news from across the galaxy!" },
  { id: "animal-friends", label: "Animal Friends", emoji: "🐻", description: "Cute animals tell the news!" },
  { id: "time-traveler", label: "Time Traveler", emoji: "⏰", description: "Travel through time for news!" },
];

export const COUNTRIES = [
  "United States", "United Kingdom", "Canada", "Australia", "India",
  "Germany", "France", "Japan", "Brazil", "Mexico", "South Korea",
  "Italy", "Spain", "Netherlands", "Sweden", "Norway", "Denmark",
  "New Zealand", "Singapore", "South Africa", "Nigeria", "Kenya",
  "Egypt", "UAE", "Saudi Arabia", "China", "Indonesia", "Philippines",
  "Thailand", "Vietnam", "Argentina", "Colombia", "Chile", "Peru",
  "Ireland", "Switzerland", "Austria", "Belgium", "Portugal", "Poland",
];

export const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  Science: { bg: "bg-comic-blue/20", text: "text-comic-blue", border: "border-comic-blue/40" },
  Nature: { bg: "bg-comic-green/20", text: "text-comic-green", border: "border-comic-green/40" },
  Tech: { bg: "bg-purple/20", text: "text-purple", border: "border-purple/40" },
  Sports: { bg: "bg-comic-orange/20", text: "text-comic-orange", border: "border-comic-orange/40" },
  Space: { bg: "bg-purple/20", text: "text-purple", border: "border-purple/40" },
  World: { bg: "bg-comic-red/20", text: "text-comic-red", border: "border-comic-red/40" },
  Culture: { bg: "bg-comic-pink/20", text: "text-comic-pink", border: "border-comic-pink/40" },
  Health: { bg: "bg-comic-green/20", text: "text-comic-green", border: "border-comic-green/40" },
  Animals: { bg: "bg-comic-green/20", text: "text-comic-green", border: "border-comic-green/40" },
  US: { bg: "bg-comic-blue/20", text: "text-comic-blue", border: "border-comic-blue/40" },
  Fun: { bg: "bg-comic-pink/20", text: "text-comic-pink", border: "border-comic-pink/40" },
  Environment: { bg: "bg-comic-green/20", text: "text-comic-green", border: "border-comic-green/40" },
  Politics: { bg: "bg-purple/20", text: "text-purple", border: "border-purple/40" },
  Education: { bg: "bg-comic-blue/20", text: "text-comic-blue", border: "border-comic-blue/40" },
};

export function getPreferences(): UserPreferences | null {
  const stored = localStorage.getItem("kidsainews_preferences");
  if (!stored) return null;
  try {
    return JSON.parse(stored);
  } catch {
    return null;
  }
}

export function savePreferences(prefs: UserPreferences): void {
  localStorage.setItem("kidsainews_preferences", JSON.stringify(prefs));
}

// Sync preferences to Supabase (fire-and-forget, called after local save)
export async function syncPreferencesToSupabase(
  supabase: { from: (table: string) => any },
  userId: string,
  prefs: UserPreferences,
): Promise<void> {
  try {
    await supabase.from("user_profiles").upsert({
      id: userId,
      age: prefs.age,
      country: prefs.country,
      additional_countries: prefs.additionalCountries,
      interests: prefs.interests,
      comic_style: prefs.comicStyle,
      language: prefs.language,
      updated_at: new Date().toISOString(),
    });
  } catch (err) {
    console.error("Failed to sync preferences:", err);
  }
}

// Load preferences from Supabase (on login)
export async function loadPreferencesFromSupabase(
  supabase: { from: (table: string) => any },
  userId: string,
): Promise<UserPreferences | null> {
  try {
    const { data } = await supabase
      .from("user_profiles")
      .select("age, country, additional_countries, interests, comic_style, language")
      .eq("id", userId)
      .maybeSingle();

    if (!data || !data.age) return null;

    return {
      age: data.age,
      country: data.country || "",
      additionalCountries: data.additional_countries || [],
      interests: data.interests || [],
      comicStyle: data.comic_style || "superhero",
      language: data.language || "en",
      onboardingComplete: true,
    };
  } catch {
    return null;
  }
}

export function getCachedNews(cacheKey: string): { stories: NewsStory[]; date: string } | null {
  const stored = localStorage.getItem(cacheKey);
  if (!stored) return null;
  try {
    const parsed = JSON.parse(stored);
    const today = new Date().toDateString();
    if (parsed.date === today) return parsed;
    return null;
  } catch {
    return null;
  }
}

export function cacheNews(stories: NewsStory[], cacheKey: string): void {
  localStorage.setItem(
    cacheKey,
    JSON.stringify({ stories, date: new Date().toDateString() })
  );
}
