import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useBookmarks } from "@/hooks/useBookmarks";
import { MOCK_STORY, MOCK_STORY_2 } from "@/test/mocks";

const mockSelect = vi.fn();
const mockInsert = vi.fn();
const mockDelete = vi.fn();
const mockEq = vi.fn();
const mockOrder = vi.fn();
const mockFilter = vi.fn();
const mockSingle = vi.fn();

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: vi.fn(() => ({
      select: mockSelect.mockReturnValue({
        eq: mockEq.mockReturnValue({
          order: mockOrder,
        }),
      }),
      insert: mockInsert.mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: mockSingle,
        }),
      }),
      delete: mockDelete.mockReturnValue({
        eq: vi.fn().mockReturnValue({
          filter: mockFilter,
        }),
      }),
    })),
  },
}));

describe("useBookmarks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockOrder.mockResolvedValue({ data: [] });
    mockSingle.mockResolvedValue({ data: null });
    mockFilter.mockResolvedValue({ error: null });
  });

  it("returns empty bookmarks when no userId", async () => {
    const { result } = renderHook(() => useBookmarks(null));
    expect(result.current.bookmarks).toEqual([]);
    expect(result.current.isBookmarked("any-url")).toBe(false);
  });

  it("fetches bookmarks for logged-in user", async () => {
    mockOrder.mockResolvedValue({
      data: [
        {
          id: "bm-1",
          story_data: MOCK_STORY,
          created_at: "2026-11-14T10:00:00Z",
        },
      ],
    });

    const { result } = renderHook(() => useBookmarks("user-123"));
    await waitFor(() => {
      expect(result.current.bookmarks).toHaveLength(1);
      expect(result.current.isBookmarked(MOCK_STORY.sourceUrl)).toBe(true);
    });
  });

  it("toggleBookmark adds a bookmark", async () => {
    mockOrder.mockResolvedValue({ data: [] });
    mockSingle.mockResolvedValue({
      data: {
        id: "bm-new",
        story_data: MOCK_STORY_2,
        created_at: "2026-11-14T12:00:00Z",
      },
    });

    const { result } = renderHook(() => useBookmarks("user-123"));
    await waitFor(() => expect(result.current.bookmarks).toHaveLength(0));

    await act(async () => {
      await result.current.toggleBookmark(MOCK_STORY_2);
    });

    expect(mockInsert).toHaveBeenCalledWith({
      user_id: "user-123",
      story_data: MOCK_STORY_2,
    });
    expect(result.current.bookmarks).toHaveLength(1);
    expect(result.current.isBookmarked(MOCK_STORY_2.sourceUrl)).toBe(true);
  });

  it("toggleBookmark removes an existing bookmark", async () => {
    mockOrder.mockResolvedValue({
      data: [
        {
          id: "bm-1",
          story_data: MOCK_STORY,
          created_at: "2026-11-14T10:00:00Z",
        },
      ],
    });

    const { result } = renderHook(() => useBookmarks("user-123"));
    await waitFor(() => expect(result.current.bookmarks).toHaveLength(1));

    await act(async () => {
      await result.current.toggleBookmark(MOCK_STORY);
    });

    expect(mockDelete).toHaveBeenCalled();
    expect(result.current.isBookmarked(MOCK_STORY.sourceUrl)).toBe(false);
    expect(result.current.bookmarks).toHaveLength(0);
  });

  it("does nothing when toggleBookmark called without userId", async () => {
    const { result } = renderHook(() => useBookmarks(null));
    await act(async () => {
      await result.current.toggleBookmark(MOCK_STORY);
    });
    expect(mockInsert).not.toHaveBeenCalled();
    expect(mockDelete).not.toHaveBeenCalled();
  });
});
