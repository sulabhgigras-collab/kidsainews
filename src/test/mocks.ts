import { vi } from "vitest";
import type { NewsStory, UserPreferences } from "@/lib/newsData";

// Reusable Supabase mock builder
export function createSupabaseMock(overrides: Record<string, any> = {}) {
  const chainable = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    upsert: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    filter: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
    ...overrides,
  };

  return {
    from: vi.fn(() => chainable),
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } },
      })),
      signInWithOAuth: vi.fn().mockResolvedValue({ data: null, error: null }),
      signInWithPassword: vi.fn().mockResolvedValue({ data: null, error: null }),
      signUp: vi.fn().mockResolvedValue({ data: null, error: null }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
    },
    functions: {
      invoke: vi.fn().mockResolvedValue({ data: null, error: null }),
    },
    _chainable: chainable,
  };
}

// Fixture data
export const MOCK_STORY: NewsStory = {
  title: "Scientists Discover New Planet",
  story: "Scientists found a new planet that might have water on it.",
  dialogue: [
    { speaker: "mina", text: "Wow, a new planet!" },
    { speaker: "rosey", text: "I wonder if anyone lives there!" },
  ],
  funFact: "The planet is 100 light years away from Earth.",
  emoji: "🪐",
  category: "Space",
  imageDescription: "A blue planet with rings floating in space",
  country: "World",
  sourceName: "BBC News",
  sourceUrl: "https://bbc.co.uk/news/science-1234",
  publishedAt: new Date().toISOString(),
  simplicityScore: 4,
};

export const MOCK_STORY_2: NewsStory = {
  title: "Kids Plant Trees in Park",
  story: "A group of students planted 100 trees in their local park to help the environment.",
  dialogue: [
    { speaker: "mina", text: "Planting trees is so cool!" },
    { speaker: "rosey", text: "Every tree helps our planet!" },
    { speaker: "mina", text: "I want to plant one too!" },
  ],
  funFact: "One tree can absorb about 22 kg of CO2 per year.",
  emoji: "🌳",
  category: "Environment",
  imageDescription: "Kids planting trees in a sunny park",
  country: "United States",
  sourceName: "The Guardian",
  sourceUrl: "https://theguardian.com/environment/trees-1234",
  publishedAt: new Date(Date.now() - 3600000).toISOString(),
  simplicityScore: 2,
};

export const MOCK_STORY_POLITICS: NewsStory = {
  title: "Countries Sign Climate Deal",
  story: "Leaders from 50 countries agreed to reduce pollution.",
  dialogue: [
    { speaker: "mina", text: "What does this deal mean?" },
    { speaker: "rosey", text: "Countries promised to use cleaner energy!" },
  ],
  funFact: "The meeting lasted three days.",
  emoji: "🏛️",
  category: "Politics",
  imageDescription: "World leaders shaking hands",
  country: "World",
  sourceName: "NPR",
  sourceUrl: "https://npr.org/politics/climate-deal",
  publishedAt: new Date(Date.now() - 7200000).toISOString(),
};

export const MOCK_PREFERENCES: UserPreferences = {
  age: 10,
  country: "United States",
  additionalCountries: ["India"],
  interests: ["science", "space"],
  comicStyle: "detective",
  language: "en",
  onboardingComplete: true,
};
