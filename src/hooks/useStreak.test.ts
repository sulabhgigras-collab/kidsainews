import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useStreak } from "@/hooks/useStreak";

const mockSelect = vi.fn();
const mockUpdate = vi.fn();
const mockEq = vi.fn();
const mockMaybeSingle = vi.fn();
const mockSelectAfterUpdate = vi.fn();
const mockSingle = vi.fn();

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: vi.fn((table: string) => ({
      select: mockSelect.mockReturnValue({
        eq: mockEq.mockReturnValue({
          maybeSingle: mockMaybeSingle,
        }),
      }),
      update: mockUpdate.mockReturnValue({
        eq: vi.fn().mockReturnValue({
          select: mockSelectAfterUpdate.mockReturnValue({
            single: mockSingle,
          }),
        }),
      }),
    })),
  },
}));

describe("useStreak", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns null streak when no userId", async () => {
    mockMaybeSingle.mockResolvedValue({ data: null });
    const { result } = renderHook(() => useStreak(null));
    await waitFor(() => {
      expect(result.current.streak).toBeNull();
    });
  });

  it("fetches streak data for logged-in user", async () => {
    mockMaybeSingle.mockResolvedValue({
      data: {
        current_streak: 5,
        longest_streak: 10,
        badges: ["Curious Cat"],
        last_read_date: "2026-11-13",
      },
    });

    const { result } = renderHook(() => useStreak("user-123"));

    await waitFor(() => {
      expect(result.current.streak).not.toBeNull();
      expect(result.current.streak!.current_streak).toBe(5);
      expect(result.current.streak!.longest_streak).toBe(10);
      expect(result.current.streak!.badges).toContain("Curious Cat");
    });
  });

  it("recordToday increments streak when last read was yesterday", async () => {
    const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
    mockMaybeSingle.mockResolvedValue({
      data: {
        current_streak: 3,
        longest_streak: 5,
        badges: [],
        last_read_date: yesterday,
      },
    });
    mockSingle.mockResolvedValue({
      data: {
        current_streak: 4,
        longest_streak: 5,
        badges: ["Curious Cat"],
        last_read_date: new Date().toISOString().split("T")[0],
      },
    });

    const { result } = renderHook(() => useStreak("user-123"));
    await waitFor(() => expect(result.current.streak).not.toBeNull());

    await act(async () => {
      await result.current.recordToday();
    });

    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        current_streak: 4,
        badges: ["Curious Cat"], // 4 >= 3 threshold
      })
    );
  });

  it("recordToday resets streak when last read was not yesterday", async () => {
    mockMaybeSingle.mockResolvedValue({
      data: {
        current_streak: 5,
        longest_streak: 10,
        badges: [],
        last_read_date: "2026-01-01", // long ago
      },
    });
    mockSingle.mockResolvedValue({
      data: {
        current_streak: 1,
        longest_streak: 10,
        badges: [],
        last_read_date: new Date().toISOString().split("T")[0],
      },
    });

    const { result } = renderHook(() => useStreak("user-123"));
    await waitFor(() => expect(result.current.streak).not.toBeNull());

    await act(async () => {
      await result.current.recordToday();
    });

    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ current_streak: 1 })
    );
  });

  it("recordToday does nothing if already recorded today", async () => {
    const today = new Date().toISOString().split("T")[0];
    mockMaybeSingle.mockResolvedValue({
      data: {
        current_streak: 5,
        longest_streak: 5,
        badges: [],
        last_read_date: today,
      },
    });

    const { result } = renderHook(() => useStreak("user-123"));
    await waitFor(() => expect(result.current.streak).not.toBeNull());

    await act(async () => {
      await result.current.recordToday();
    });

    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("BADGE_THRESHOLDS has correct values", () => {
    const { result } = renderHook(() => useStreak(null));
    expect(result.current.BADGE_THRESHOLDS).toEqual([
      { days: 3, badge: "Curious Cat", emoji: "🐱" },
      { days: 7, badge: "News Explorer", emoji: "🧭" },
      { days: 30, badge: "Super Reader", emoji: "🦸" },
    ]);
  });
});
