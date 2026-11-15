import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  getPreferences,
  savePreferences,
  getNewsCacheKey,
  getCachedNews,
  cacheNews,
  clearNewsCache,
  syncPreferencesToSupabase,
  loadPreferencesFromSupabase,
  UserPreferences,
  INTERESTS,
  COMIC_STYLES,
  COUNTRIES,
  LANGUAGES,
  CATEGORY_COLORS,
} from "@/lib/newsData";
import { MOCK_PREFERENCES, MOCK_STORY, MOCK_STORY_2 } from "@/test/mocks";

describe("newsData", () => {
  // ── Constants ──────────────────────────────────────────────

  describe("constants", () => {
    it("INTERESTS has at least 10 options", () => {
      expect(INTERESTS.length).toBeGreaterThanOrEqual(10);
    });

    it("each INTEREST has id, label, emoji", () => {
      for (const interest of INTERESTS) {
        expect(interest.id).toBeTruthy();
        expect(interest.label).toBeTruthy();
        expect(interest.emoji).toBeTruthy();
      }
    });

    it("COMIC_STYLES has at least 5 styles", () => {
      expect(COMIC_STYLES.length).toBeGreaterThanOrEqual(5);
    });

    it("each COMIC_STYLE has id, label, emoji, description", () => {
      for (const style of COMIC_STYLES) {
        expect(style.id).toBeTruthy();
        expect(style.label).toBeTruthy();
        expect(style.emoji).toBeTruthy();
        expect(style.description).toBeTruthy();
      }
    });

    it("COUNTRIES has at least 30 countries", () => {
      expect(COUNTRIES.length).toBeGreaterThanOrEqual(30);
    });

    it("COUNTRIES includes United States and India", () => {
      expect(COUNTRIES).toContain("United States");
      expect(COUNTRIES).toContain("India");
    });

    it("LANGUAGES has at least 10 languages", () => {
      expect(LANGUAGES.length).toBeGreaterThanOrEqual(10);
    });

    it("LANGUAGES includes English as first entry", () => {
      expect(LANGUAGES[0].id).toBe("en");
      expect(LANGUAGES[0].label).toBe("English");
    });

    it("CATEGORY_COLORS covers all expected categories", () => {
      const expected = [
        "Science", "Nature", "Tech", "Sports", "Space", "World",
        "Culture", "Health", "Animals", "US", "Fun",
        "Environment", "Politics", "Education",
      ];
      for (const cat of expected) {
        expect(CATEGORY_COLORS[cat]).toBeDefined();
        expect(CATEGORY_COLORS[cat].bg).toBeTruthy();
        expect(CATEGORY_COLORS[cat].text).toBeTruthy();
        expect(CATEGORY_COLORS[cat].border).toBeTruthy();
      }
    });
  });

  // ── Preferences ────────────────────────────────────────────

  describe("getPreferences / savePreferences", () => {
    it("returns null when no preferences stored", () => {
      expect(getPreferences()).toBeNull();
    });

    it("saves and retrieves preferences", () => {
      savePreferences(MOCK_PREFERENCES);
      const loaded = getPreferences();
      expect(loaded).toEqual(MOCK_PREFERENCES);
    });

    it("returns null for malformed JSON", () => {
      localStorage.setItem("kidsainews_preferences", "not-json");
      expect(getPreferences()).toBeNull();
    });

    it("overwrites previous preferences", () => {
      savePreferences(MOCK_PREFERENCES);
      const updated = { ...MOCK_PREFERENCES, age: 12 };
      savePreferences(updated);
      expect(getPreferences()?.age).toBe(12);
    });
  });

  // ── Cache ──────────────────────────────────────────────────

  describe("news cache", () => {
    it("getNewsCacheKey is deterministic", () => {
      const key1 = getNewsCacheKey(MOCK_PREFERENCES);
      const key2 = getNewsCacheKey(MOCK_PREFERENCES);
      expect(key1).toBe(key2);
    });

    it("different preferences produce different cache keys", () => {
      const key1 = getNewsCacheKey(MOCK_PREFERENCES);
      const key2 = getNewsCacheKey({ ...MOCK_PREFERENCES, age: 7 });
      expect(key1).not.toBe(key2);
    });

    it("cache key is stable regardless of interest/country order", () => {
      const prefs1 = { ...MOCK_PREFERENCES, interests: ["science", "space"] };
      const prefs2 = { ...MOCK_PREFERENCES, interests: ["space", "science"] };
      expect(getNewsCacheKey(prefs1)).toBe(getNewsCacheKey(prefs2));
    });

    it("getCachedNews returns null when nothing cached", () => {
      expect(getCachedNews("nonexistent_key")).toBeNull();
    });

    it("cacheNews + getCachedNews round-trips", () => {
      const key = getNewsCacheKey(MOCK_PREFERENCES);
      cacheNews([MOCK_STORY, MOCK_STORY_2], key);
      const cached = getCachedNews(key);
      expect(cached).not.toBeNull();
      expect(cached!.stories).toHaveLength(2);
      expect(cached!.stories[0].title).toBe(MOCK_STORY.title);
    });

    it("getCachedNews returns null for stale (different day) cache", () => {
      const key = getNewsCacheKey(MOCK_PREFERENCES);
      // Manually write stale cache
      localStorage.setItem(
        key,
        JSON.stringify({ stories: [MOCK_STORY], date: "Mon Jan 01 2024" })
      );
      expect(getCachedNews(key)).toBeNull();
    });

    it("clearNewsCache removes all cache keys", () => {
      const key1 = getNewsCacheKey(MOCK_PREFERENCES);
      const key2 = getNewsCacheKey({ ...MOCK_PREFERENCES, age: 7 });
      cacheNews([MOCK_STORY], key1);
      cacheNews([MOCK_STORY_2], key2);
      clearNewsCache();
      expect(getCachedNews(key1)).toBeNull();
      expect(getCachedNews(key2)).toBeNull();
    });

    it("clearNewsCache does not remove non-cache keys", () => {
      localStorage.setItem("kidsainews_preferences", "kept");
      localStorage.setItem("kidsainews_theme", "dark");
      cacheNews([MOCK_STORY], getNewsCacheKey(MOCK_PREFERENCES));
      clearNewsCache();
      expect(localStorage.getItem("kidsainews_preferences")).toBe("kept");
      expect(localStorage.getItem("kidsainews_theme")).toBe("dark");
    });
  });

  // ── Supabase preference sync ───────────────────────────────

  describe("syncPreferencesToSupabase", () => {
    it("calls upsert with correct fields", async () => {
      const upsert = vi.fn().mockResolvedValue({ error: null });
      const mockSupabase = {
        from: vi.fn(() => ({ upsert })),
      };

      await syncPreferencesToSupabase(mockSupabase, "user-123", MOCK_PREFERENCES);

      expect(mockSupabase.from).toHaveBeenCalledWith("user_profiles");
      expect(upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          id: "user-123",
          age: 10,
          country: "United States",
          additional_countries: ["India"],
          interests: ["science", "space"],
          comic_style: "detective",
          language: "en",
        })
      );
    });

    it("does not throw on upsert error", async () => {
      const mockSupabase = {
        from: vi.fn(() => ({
          upsert: vi.fn().mockRejectedValue(new Error("DB error")),
        })),
      };

      // Should not throw
      await expect(
        syncPreferencesToSupabase(mockSupabase, "user-123", MOCK_PREFERENCES)
      ).resolves.toBeUndefined();
    });
  });

  describe("loadPreferencesFromSupabase", () => {
    it("returns preferences when data exists", async () => {
      const maybeSingle = vi.fn().mockResolvedValue({
        data: {
          age: 10,
          country: "United States",
          additional_countries: ["India"],
          interests: ["science", "space"],
          comic_style: "detective",
          language: "en",
        },
      });

      const mockSupabase = {
        from: vi.fn(() => ({
          select: vi.fn(() => ({
            eq: vi.fn(() => ({ maybeSingle })),
          })),
        })),
      };

      const result = await loadPreferencesFromSupabase(mockSupabase, "user-123");
      expect(result).not.toBeNull();
      expect(result!.age).toBe(10);
      expect(result!.onboardingComplete).toBe(true);
    });

    it("returns null when no data", async () => {
      const maybeSingle = vi.fn().mockResolvedValue({ data: null });
      const mockSupabase = {
        from: vi.fn(() => ({
          select: vi.fn(() => ({
            eq: vi.fn(() => ({ maybeSingle })),
          })),
        })),
      };

      const result = await loadPreferencesFromSupabase(mockSupabase, "user-123");
      expect(result).toBeNull();
    });

    it("returns null when age is missing", async () => {
      const maybeSingle = vi.fn().mockResolvedValue({
        data: { age: null, country: null },
      });
      const mockSupabase = {
        from: vi.fn(() => ({
          select: vi.fn(() => ({
            eq: vi.fn(() => ({ maybeSingle })),
          })),
        })),
      };

      const result = await loadPreferencesFromSupabase(mockSupabase, "user-123");
      expect(result).toBeNull();
    });
  });
});
