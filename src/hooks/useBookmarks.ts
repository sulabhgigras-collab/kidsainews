import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { NewsStory } from "@/lib/newsData";

export interface Bookmark {
  id: string;
  story_data: NewsStory;
  created_at: string;
}

export function useBookmarks(userId: string | null) {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [bookmarkedUrls, setBookmarkedUrls] = useState<Set<string>>(new Set());

  const fetchBookmarks = useCallback(async () => {
    if (!userId) {
      setBookmarks([]);
      setBookmarkedUrls(new Set());
      return;
    }
    const { data } = await supabase
      .from("bookmarks")
      .select("id, story_data, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (data) {
      const items = data as unknown as Bookmark[];
      setBookmarks(items);
      setBookmarkedUrls(new Set(items.map((b) => (b.story_data as any)?.sourceUrl).filter(Boolean)));
    }
  }, [userId]);

  useEffect(() => {
    fetchBookmarks();
  }, [fetchBookmarks]);

  const toggleBookmark = async (story: NewsStory) => {
    if (!userId) return;

    if (bookmarkedUrls.has(story.sourceUrl)) {
      // Remove
      await supabase
        .from("bookmarks")
        .delete()
        .eq("user_id", userId)
        .filter("story_data->>sourceUrl", "eq", story.sourceUrl);
      setBookmarkedUrls((prev) => {
        const next = new Set(prev);
        next.delete(story.sourceUrl);
        return next;
      });
      setBookmarks((prev) => prev.filter((b) => (b.story_data as any)?.sourceUrl !== story.sourceUrl));
    } else {
      // Add
      const { data } = await supabase
        .from("bookmarks")
        .insert({ user_id: userId, story_data: story as any })
        .select("id, story_data, created_at")
        .single();
      if (data) {
        const item = data as unknown as Bookmark;
        setBookmarks((prev) => [item, ...prev]);
        setBookmarkedUrls((prev) => new Set(prev).add(story.sourceUrl));
      }
    }
  };

  const isBookmarked = (sourceUrl: string) => bookmarkedUrls.has(sourceUrl);

  return { bookmarks, toggleBookmark, isBookmarked, fetchBookmarks };
}
