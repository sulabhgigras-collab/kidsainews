import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface StreakData {
  current_streak: number;
  longest_streak: number;
  badges: string[];
  last_read_date: string | null;
}

const BADGE_THRESHOLDS = [
  { days: 3, badge: "Curious Cat", emoji: "🐱" },
  { days: 7, badge: "News Explorer", emoji: "🧭" },
  { days: 30, badge: "Super Reader", emoji: "🦸" },
];

export function useStreak(userId: string | null) {
  const [streak, setStreak] = useState<StreakData | null>(null);

  const fetchStreak = useCallback(async () => {
    if (!userId) {
      setStreak(null);
      return;
    }
    const { data } = await supabase
      .from("reading_streaks")
      .select("current_streak, longest_streak, badges, last_read_date")
      .eq("user_id", userId)
      .maybeSingle();

    if (data) {
      setStreak(data as StreakData);
    } else {
      // No row yet (trigger may not have fired) — create one
      const { data: created } = await supabase
        .from("reading_streaks")
        .upsert({ user_id: userId, current_streak: 0, longest_streak: 0, badges: [], last_read_date: null })
        .select("current_streak, longest_streak, badges, last_read_date")
        .single();
      if (created) setStreak(created as StreakData);
    }
  }, [userId]);

  useEffect(() => {
    fetchStreak();
  }, [fetchStreak]);

  const recordToday = useCallback(async () => {
    if (!userId || !streak) return;

    const today = new Date().toISOString().split("T")[0];
    if (streak.last_read_date === today) return; // already recorded

    const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
    const newStreak = streak.last_read_date === yesterday
      ? streak.current_streak + 1
      : 1;
    const newLongest = Math.max(newStreak, streak.longest_streak);

    // Compute badges
    const newBadges = [...(streak.badges || [])];
    for (const { days, badge } of BADGE_THRESHOLDS) {
      if (newStreak >= days && !newBadges.includes(badge)) {
        newBadges.push(badge);
      }
    }

    const { data } = await supabase
      .from("reading_streaks")
      .update({
        current_streak: newStreak,
        longest_streak: newLongest,
        last_read_date: today,
        badges: newBadges,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId)
      .select("current_streak, longest_streak, badges, last_read_date")
      .single();

    if (data) setStreak(data as StreakData);
  }, [userId, streak]);

  return { streak, recordToday, BADGE_THRESHOLDS };
}
