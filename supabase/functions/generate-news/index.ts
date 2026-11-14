import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "npm:zod@3.25.76";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const MAX_STORIES = 15;
const MAX_COUNTRIES = 3;
const RECENT_WINDOW_HOURS = 36;
const SEARCH_RESULTS_PER_FEED = 8;

const RequestSchema = z.object({
  age: z.union([z.number(), z.string()]).optional(),
  interests: z.array(z.string()).optional().default([]),
  country: z.string().optional().default(""),
  additionalCountries: z.array(z.string()).optional().default([]),
  comicStyle: z.string().optional().default("superhero"),
  language: z.string().optional().default("en"),
});

type DialogueSpeaker = "mina" | "rosey";
type StoryCategory = "Science" | "Nature" | "Tech" | "Sports" | "Space" | "World" | "Culture" | "Health" | "Animals" | "US" | "Fun";
type FeedKey = "world" | "science" | "technology" | "health" | "arts" | "sport" | "business";

interface FeedPlan {
  key: FeedKey;
  url: string;
  sourceName: string;
  matchedTopic: string;
  category: StoryCategory;
  emoji: string;
}

interface RecentArticle {
  title: string;
  description: string;
  link: string;
  publishedAt: string;
  source: string;
  matchedTopic: string;
  matchedCountry: string;
  category: StoryCategory;
  emoji: string;
}

interface StoryPayload {
  title?: unknown;
  story?: unknown;
  dialogue?: unknown;
  funFact?: unknown;
  imageDescription?: unknown;
  sourceTitle?: unknown;
}

const FEEDS: Record<FeedKey, Omit<FeedPlan, "matchedTopic">> = {
  world: { key: "world", url: "https://feeds.bbci.co.uk/news/world/rss.xml", sourceName: "BBC News", category: "World", emoji: "🌍" },
  science: { key: "science", url: "https://feeds.bbci.co.uk/news/science_and_environment/rss.xml", sourceName: "BBC News", category: "Science", emoji: "🔬" },
  technology: { key: "technology", url: "https://feeds.bbci.co.uk/news/technology/rss.xml", sourceName: "BBC News", category: "Tech", emoji: "💻" },
  health: { key: "health", url: "https://feeds.bbci.co.uk/news/health/rss.xml", sourceName: "BBC News", category: "Health", emoji: "🩺" },
  arts: { key: "arts", url: "https://feeds.bbci.co.uk/news/entertainment_and_arts/rss.xml", sourceName: "BBC News", category: "Fun", emoji: "🎨" },
  sport: { key: "sport", url: "https://feeds.bbci.co.uk/sport/rss.xml", sourceName: "BBC Sport", category: "Sports", emoji: "⚽" },
  business: { key: "business", url: "https://feeds.bbci.co.uk/news/business/rss.xml", sourceName: "BBC News", category: "World", emoji: "📰" },
};

const BLOCKED_HEADLINE_PATTERNS = [
  /\bopinion\b/i, /\banalysis\b/i, /\beditorial\b/i, /\bpodcast\b/i,
  /\bnewsletter\b/i, /\bquiz\b/i, /\breview\b/i, /\blive updates?\b/i, /\bphotos\b/i,
];

const COUNTRY_ALIASES: Record<string, string[]> = {
  "united states": ["united states", "us", "u s", "u.s", "u.s.", "america", "american"],
  "united kingdom": ["united kingdom", "uk", "u k", "u.k", "u.k.", "britain", "british", "england"],
  "united arab emirates": ["united arab emirates", "uae", "u a e"],
  "south korea": ["south korea", "korea", "south korean"],
  "new zealand": ["new zealand", "new zealander"],
  "saudi arabia": ["saudi arabia", "saudi"],
};

function jsonResponse(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function normalizeText(value: string) {
  return value.toLowerCase().replace(/&/g, " and ").replace(/[^a-z0-9]+/g, " ").trim();
}

function decodeHtmlEntities(value: string) {
  return value
    .replace(/<!\[CDATA\[|\]\]>/g, "")
    .replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&#x2F;/g, "/").replace(/&#8217;/g, "'").replace(/&#8211;/g, "–")
    .replace(/&#8230;/g, "…").replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)));
}

function stripHtml(value: string) {
  return decodeHtmlEntities(value).replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function readTag(block: string, tag: string) {
  const match = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i"));
  return match ? stripHtml(match[1]) : "";
}

function getAgeConfig(age: number) {
  if (age <= 7) return { dialogueLines: "2-3", storyLength: "1 short sentence", vocabulary: "very simple words a 5-7 year old would understand", funFactLength: "1 short sentence" };
  if (age <= 10) return { dialogueLines: "3-4", storyLength: "1-2 short sentences", vocabulary: "simple and clear language for an 8-10 year old", funFactLength: "1 sentence" };
  return { dialogueLines: "4-5", storyLength: "2 short sentences", vocabulary: "clear language for a teenager, still simple and calm", funFactLength: "1 short sentence" };
}

function isRecent(publishedAt: string) {
  const timestamp = Date.parse(publishedAt);
  if (Number.isNaN(timestamp)) return false;
  return Date.now() - timestamp <= RECENT_WINDOW_HOURS * 60 * 60 * 1000;
}

function isAllowedHeadline(title: string) {
  return !BLOCKED_HEADLINE_PATTERNS.some((pattern) => pattern.test(title));
}

function classifyCategory(title: string, description: string, feedCategory: StoryCategory): StoryCategory {
  const text = normalizeText(`${title} ${description}`);
  const usTokens = ["united states", "us ", "u s ", "america", "american", "white house", "congress", "senate", "washington dc", "pentagon"];
  if (usTokens.some(t => text.includes(t))) return "US";
  const animalTokens = ["animal", "wildlife", "species", "bird", "fish", "whale", "dolphin", "elephant", "tiger", "lion", "bear", "dog", "cat", "zoo", "pet", "insect", "dinosaur", "fossil"];
  if (animalTokens.some(t => text.includes(t))) return "Animals";
  const spaceTokens = ["space", "nasa", "rocket", "asteroid", "planet", "mars", "moon", "satellite", "astronaut", "orbit", "telescope", "galaxy", "star", "comet", "spacecraft"];
  if (spaceTokens.some(t => text.includes(t))) return "Space";
  const funTokens = ["movie", "film", "music", "game", "toy", "lego", "disney", "minecraft", "festival", "celebration", "holiday", "dance", "comic", "cartoon", "concert", "album", "singer", "actor", "actress", "celebrity", "entertain", "award", "grammy", "oscar", "emmy", "broadway", "theatre", "theater", "tv show", "series", "streaming", "netflix", "youtube", "tiktok", "viral", "funny", "joke", "magic", "circus", "theme park", "roller coaster", "amusement", "video game", "playstation", "xbox", "nintendo", "pokemon", "marvel", "superhero", "book", "novel", "author", "art exhibit", "museum", "gallery", "fashion", "runway"];
  if (funTokens.some(t => text.includes(t))) return "Fun";
  // The BBC arts/entertainment feed should default to Fun, not Culture
  if (feedCategory === "Culture") return "Fun";
  return feedCategory;
}

function getCountryTokens(country: string) {
  const normalizedCountry = normalizeText(country);
  return COUNTRY_ALIASES[normalizedCountry] ?? [normalizedCountry];
}

function detectMatchedCountry(text: string, countries: string[]) {
  const normalizedText = ` ${normalizeText(text)} `;
  for (const country of countries) {
    const aliases = getCountryTokens(country);
    if (aliases.some((alias) => normalizedText.includes(` ${normalizeText(alias)} `))) return country;
  }
  return "";
}

async function fetchRssWithRetry(url: string, retries = 2): Promise<string | null> {
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const response = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          "Accept": "application/rss+xml, application/xml, text/xml, */*",
        },
      });
      if (response.ok) return await response.text();
      console.error(`Feed fetch failed [${response.status}]`, url);
    } catch (error) {
      console.error("Feed fetch error", url, error);
    }
    if (attempt < retries) await new Promise((resolve) => setTimeout(resolve, 800 * (attempt + 1)));
  }
  return null;
}

function parseRssItems(xml: string, plan: FeedPlan, countries: string[]) {
  const items = [...xml.matchAll(/<item\b[\s\S]*?<\/item>/gi)];
  return items.map((entry) => {
    const block = entry[0];
    const title = readTag(block, "title").replace(/\s+-\s+[^-]+$/, "").trim();
    const description = readTag(block, "description");
    const link = readTag(block, "link");
    const publishedAt = readTag(block, "pubDate");
    const matchedCountry = detectMatchedCountry(`${title} ${description}`, countries);
    const category = classifyCategory(title, description, plan.category);
    return { title, description, link, publishedAt, source: plan.sourceName, matchedTopic: plan.matchedTopic, matchedCountry: matchedCountry || "World", category, emoji: plan.emoji } satisfies RecentArticle;
  }).filter((article) => article.title && article.link);
}

async function fetchRecentArticles(countries: string[], requestedTopics: string[]) {
  const feedPlans = Object.values(FEEDS).map((feed) => ({ ...feed, matchedTopic: feed.category }));
  const groups = await Promise.all(
    feedPlans.map(async (plan) => {
      const xml = await fetchRssWithRetry(plan.url);
      if (!xml) return [] as RecentArticle[];
      return parseRssItems(xml, plan, countries).slice(0, SEARCH_RESULTS_PER_FEED);
    }),
  );

  const deduped: RecentArticle[] = [];
  const seenLinks = new Set<string>();
  for (const article of groups.flat()) {
    if (seenLinks.has(article.link)) continue;
    if (!isRecent(article.publishedAt)) continue;
    if (!isAllowedHeadline(article.title)) continue;
    seenLinks.add(article.link);
    deduped.push(article);
  }
  return deduped.sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt)).slice(0, MAX_STORIES * 2);
}

function sanitizeDialogue(dialogue: unknown) {
  if (!Array.isArray(dialogue)) return [] as { speaker: DialogueSpeaker; text: string }[];
  return dialogue
    .filter((line): line is Record<string, unknown> => typeof line === "object" && line !== null)
    .map((line) => ({ speaker: (line.speaker === "rosey" ? "rosey" : "mina") as DialogueSpeaker, text: isNonEmptyString(line.text) ? line.text.trim() : "" }))
    .filter((line) => line.text.length > 0);
}

function formatPublishedDate(publishedAt: string) {
  const date = new Date(publishedAt);
  if (Number.isNaN(date.getTime())) return "recently";
  return date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

function sanitizeStories(rawStories: unknown, articles: RecentArticle[]) {
  if (!Array.isArray(rawStories)) return [];
  const articleMap = new Map(articles.map((article) => [article.title, article]));
  const seenSourceTitles = new Set<string>();
  const seenStoryTitles = new Set<string>();

  return rawStories
    .filter((story): story is StoryPayload => typeof story === "object" && story !== null)
    .map((story) => {
      const sourceTitle = isNonEmptyString(story.sourceTitle) ? story.sourceTitle.trim() : "";
      const article = articleMap.get(sourceTitle);
      const dialogue = sanitizeDialogue(story.dialogue);
      if (!article) return null;
      if (!isNonEmptyString(story.title) || !isNonEmptyString(story.story) || !isNonEmptyString(story.imageDescription)) return null;
      if (dialogue.length === 0) return null;
      const normalizedSourceTitle = normalizeText(sourceTitle);
      const normalizedStoryTitle = normalizeText(story.title.trim());
      if (seenSourceTitles.has(normalizedSourceTitle)) return null;
      if (seenStoryTitles.has(normalizedStoryTitle)) return null;
      seenSourceTitles.add(normalizedSourceTitle);
      seenStoryTitles.add(normalizedStoryTitle);
      return {
        title: story.title.trim(),
        story: story.story.trim(),
        dialogue,
        funFact: isNonEmptyString(story.funFact) ? story.funFact.trim() : `Reported by ${article.source} on ${formatPublishedDate(article.publishedAt)}.`,
        emoji: article.emoji,
        category: article.category,
        imageDescription: story.imageDescription.trim(),
        country: article.matchedCountry,
        sourceName: article.source,
        sourceUrl: article.link,
        publishedAt: article.publishedAt,
      };
    })
    .filter((story): story is NonNullable<typeof story> => Boolean(story))
    .slice(0, MAX_STORIES);
}

// Build a deterministic cache key from request params
function buildCacheKey(params: { age: number; country: string; additionalCountries: string[]; language: string; comicStyle: string; interests: string[] }): string {
  const normalized = {
    age: params.age,
    country: params.country.toLowerCase().trim(),
    additionalCountries: [...params.additionalCountries].map(c => c.toLowerCase().trim()).sort(),
    language: params.language,
    comicStyle: params.comicStyle,
    interests: [...params.interests].sort(),
  };
  let hash = 0;
  const str = JSON.stringify(normalized);
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) >>> 0;
  }
  return hash.toString(36);
}

function getSupabaseAdmin() {
  const url = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  return createClient(url, serviceKey);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const parsedBody = RequestSchema.safeParse(await req.json());
    if (!parsedBody.success) return jsonResponse({ error: parsedBody.error.flatten().fieldErrors }, 400);

    const body = parsedBody.data;
    const ageNum = typeof body.age === "number" ? body.age : parseInt(String(body.age ?? "10"), 10) || 10;
    const countries = [body.country, ...body.additionalCountries]
      .filter((value): value is string => Boolean(value && value.trim()))
      .map((value) => value.trim())
      .slice(0, MAX_COUNTRIES);
    const requestedTopics = body.interests.filter((topic) => topic.trim().length > 0).map((topic) => topic.trim());

    if (countries.length === 0) return jsonResponse({ error: "A country is required" }, 400);

    const cacheKey = buildCacheKey({
      age: ageNum,
      country: countries[0],
      additionalCountries: countries.slice(1),
      language: body.language,
      comicStyle: body.comicStyle,
      interests: requestedTopics,
    });

    // Check DB cache first
    const supabaseAdmin = getSupabaseAdmin();
    const today = new Date().toISOString().split("T")[0];

    const { data: cached } = await supabaseAdmin
      .from("daily_news_cache")
      .select("stories, sources_used, no_news_reason")
      .eq("cache_key", cacheKey)
      .eq("cache_date", today)
      .maybeSingle();

    if (cached && Array.isArray(cached.stories) && cached.stories.length > 0) {
      console.log("Serving from DB cache, key:", cacheKey);
      return jsonResponse({
        stories: cached.stories,
        sourcesUsed: cached.sources_used ?? [],
        noNewsReason: cached.no_news_reason,
        fromCache: true,
      });
    }

    // Not cached — generate fresh
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const recentArticles = await fetchRecentArticles(countries, requestedTopics);

    if (recentArticles.length === 0) {
      return jsonResponse({ stories: [], sourcesUsed: [], noNewsReason: "No safe verified articles were available for that country and topic right now." });
    }

    const ageConfig = getAgeConfig(ageNum);
    const articleContext = recentArticles.map((article, index) => [
      `ARTICLE ${index + 1}`,
      `Original title: ${article.title}`,
      `Summary: ${article.description || "No summary provided."}`,
      `Source: ${article.source}`,
      `Published: ${article.publishedAt}`,
      `Country: ${article.matchedCountry}`,
      `Link: ${article.link}`,
    ].join("\n")).join("\n\n");

    const systemPrompt = `You are a children's news editor who covers ALL real news — including wars, politics, conflicts, and world events.

You are ONLY allowed to simplify the real articles provided by the user.
Do NOT invent stories.
Do NOT add facts not present in the article.
Do NOT guess missing details.
Each article must produce EXACTLY ONE story. Never create two stories from the same article.

Every output story must stay traceable to exactly one provided article using sourceTitle.

IMPORTANT: The "story" field must be a real, factual summary of the article in ${ageConfig.storyLength}. It should read like a short news report — accurate and clear.
The "dialogue" field is a SEPARATE comic-style conversation between Mina and Rosey that DISCUSSES the story.

Language rules:
- Use ${ageConfig.vocabulary}.
- Explain events simply and clearly. For example, instead of "airstrikes killed 20", say "planes dropped bombs on buildings and many people were hurt."
- Do NOT hide or skip what happened — just use calm, simple words.
- Keep the tone calm, factual, and not scary.
- Do NOT take sides or say who is right or wrong.
- Story length: ${ageConfig.storyLength}.
- Dialogue length: ${ageConfig.dialogueLines} lines.
- funFact length: ${ageConfig.funFactLength}.
- All text output must be written in ${body.language === "en" ? "English" : `the language with code "${body.language}"`}.
- imageDescription must stay in English.

The funFact must be a small real detail from the same article, or a short source-based line like "Reported by BBC News on April 8, 2026."`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Simplify ALL ${Math.min(MAX_STORIES, recentArticles.length)} articles below for kids. Do NOT skip any article — every topic matters, including wars, politics, and conflicts. Just use simple, calm language.\n\nARTICLE LIST:\n${articleContext}` },
        ],
        tools: [{
          type: "function",
          function: {
            name: "deliver_news",
            description: "Return only simplified versions of the provided real articles",
            parameters: {
              type: "object",
              properties: {
                stories: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      sourceTitle: { type: "string", enum: recentArticles.map((a) => a.title) },
                      title: { type: "string" },
                      story: { type: "string" },
                      dialogue: { type: "array", items: { type: "object", properties: { speaker: { type: "string", enum: ["mina", "rosey"] }, text: { type: "string" } }, required: ["speaker", "text"], additionalProperties: false } },
                      funFact: { type: "string" },
                      imageDescription: { type: "string" },
                    },
                    required: ["sourceTitle", "title", "story", "dialogue", "funFact", "imageDescription"],
                    additionalProperties: false,
                  },
                },
              },
              required: ["stories"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "deliver_news" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) return jsonResponse({ error: "Too many requests! Please wait a moment and try again." }, 429);
      if (response.status === 402) return jsonResponse({ error: "AI credits needed. Please add funds to continue." }, 402);
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return jsonResponse({ stories: [], sourcesUsed: [...new Set(recentArticles.map((a) => a.source))] });
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    const rawStories = toolCall?.function?.arguments
      ? JSON.parse(toolCall.function.arguments).stories
      : (() => {
          const content = data.choices?.[0]?.message?.content;
          if (!content) return [];
          try { const parsed = JSON.parse(content); return Array.isArray(parsed) ? parsed : parsed.stories; } catch { return []; }
        })();

    const stories = sanitizeStories(rawStories, recentArticles);
    const sourcesUsed = [...new Set(stories.map((s) => s.sourceName))];
    const noNewsReason = stories.length === 0 ? "No safe verified articles were available for that country and topic right now." : undefined;

    // Store in DB cache (fire-and-forget)
    supabaseAdmin
      .from("daily_news_cache")
      .upsert({
        cache_key: cacheKey,
        cache_date: today,
        stories,
        sources_used: sourcesUsed,
        no_news_reason: noNewsReason ?? null,
      }, { onConflict: "cache_key,cache_date" })
      .then(({ error }) => { if (error) console.error("Cache write error:", error); });

    return jsonResponse({ stories, sourcesUsed, noNewsReason });
  } catch (error) {
    console.error("generate-news error:", error);
    return jsonResponse({ error: error instanceof Error ? error.message : "Unknown error" }, 500);
  }
});
