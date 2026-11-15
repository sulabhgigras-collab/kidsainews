import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { NewsStory } from "@/lib/newsData";

export function useReadingHistory(userId: string | null) {
  const recordRead = useCallback(
    async (story: NewsStory) => {
      if (!userId) return;
      await supabase.from("reading_history").insert({
        user_id: userId,
        story_title: story.title,
        story_url: story.sourceUrl,
        category: story.category,
      });
    },
    [userId]
  );

  return { recordRead };
}
