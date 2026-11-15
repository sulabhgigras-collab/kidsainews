import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import ComicCard from "@/components/ComicCard";
import { MOCK_STORY, MOCK_STORY_2 } from "@/test/mocks";

// Mock framer-motion with Proxy so any motion.xxx element works
vi.mock("framer-motion", () => {
  const handler = {
    get(_target: any, prop: string) {
      return ({ children, whileTap, whileHover, initial, animate, exit, transition, variants, ...rest }: any) => {
        const Tag = prop as any;
        return <Tag {...rest}>{children}</Tag>;
      };
    },
  };
  return {
    motion: new Proxy({}, handler),
    AnimatePresence: ({ children }: any) => <>{children}</>,
  };
});

// Mock StoryExplainer (it calls supabase)
vi.mock("@/components/StoryExplainer", () => ({
  default: () => <div data-testid="story-explainer">Explainer</div>,
}));

// Mock StoryIllustration
vi.mock("@/components/StoryIllustration", () => ({
  default: ({ title, emoji, category }: any) => (
    <div data-testid="story-illustration">{emoji} {category}</div>
  ),
}));

describe("ComicCard", () => {
  const defaultProps = {
    story: MOCK_STORY,
    index: 0,
    comicStyle: "detective",
    age: 10,
    language: "en",
  };

  it("renders story title", () => {
    render(<ComicCard {...defaultProps} />);
    expect(screen.getByText("Scientists Discover New Planet")).toBeInTheDocument();
  });

  it("renders story summary", () => {
    render(<ComicCard {...defaultProps} />);
    expect(screen.getByText(MOCK_STORY.story)).toBeInTheDocument();
  });

  it("renders category label", () => {
    render(<ComicCard {...defaultProps} />);
    expect(screen.getByText("Space")).toBeInTheDocument();
  });

  it("renders emoji", () => {
    render(<ComicCard {...defaultProps} />);
    expect(screen.getByText("🪐")).toBeInTheDocument();
  });

  it("renders country badge when story has country", () => {
    render(<ComicCard {...defaultProps} />);
    expect(screen.getByText(/World/)).toBeInTheDocument();
  });

  it("renders source name", () => {
    render(<ComicCard {...defaultProps} />);
    expect(screen.getByText("BBC News")).toBeInTheDocument();
  });

  it("renders source link", () => {
    render(<ComicCard {...defaultProps} />);
    const link = screen.getByText("Read source");
    expect(link.closest("a")).toHaveAttribute("href", MOCK_STORY.sourceUrl);
    expect(link.closest("a")).toHaveAttribute("target", "_blank");
  });

  it("renders dialogue lines for both characters", () => {
    render(<ComicCard {...defaultProps} />);
    expect(screen.getByText("Wow, a new planet!")).toBeInTheDocument();
    expect(screen.getByText("I wonder if anyone lives there!")).toBeInTheDocument();
  });

  it("renders Mina and Rosey labels", () => {
    render(<ComicCard {...defaultProps} />);
    expect(screen.getByText("Mina")).toBeInTheDocument();
    expect(screen.getByText("Rosey")).toBeInTheDocument();
  });

  it("renders fun fact", () => {
    render(<ComicCard {...defaultProps} />);
    expect(screen.getByText(MOCK_STORY.funFact)).toBeInTheDocument();
  });

  it("renders reading time estimate", () => {
    render(<ComicCard {...defaultProps} />);
    // Should show at least "1 min"
    expect(screen.getByText(/\d+ min/)).toBeInTheDocument();
  });

  it("renders simplicity score dots when present", () => {
    render(<ComicCard {...defaultProps} />);
    // simplicityScore is 4, so 4 green dots + 1 gray
    const title = `Simplicity: ${MOCK_STORY.simplicityScore}/5`;
    expect(screen.getByTitle(title)).toBeInTheDocument();
  });

  it("renders card number badge", () => {
    render(<ComicCard {...defaultProps} />);
    expect(screen.getByText("#1")).toBeInTheDocument();
  });

  it("increments card number for different indices", () => {
    render(<ComicCard {...defaultProps} index={4} />);
    expect(screen.getByText("#5")).toBeInTheDocument();
  });

  it("renders StoryIllustration", () => {
    render(<ComicCard {...defaultProps} />);
    expect(screen.getByTestId("story-illustration")).toBeInTheDocument();
  });

  it("renders StoryExplainer", () => {
    render(<ComicCard {...defaultProps} />);
    expect(screen.getByTestId("story-explainer")).toBeInTheDocument();
  });

  // ── Bookmark button ──────────────────────────────────────

  it("does NOT show bookmark button when no userId", () => {
    render(<ComicCard {...defaultProps} />);
    expect(screen.queryByTitle("Save story")).not.toBeInTheDocument();
  });

  it("shows bookmark button when userId is provided", () => {
    render(
      <ComicCard
        {...defaultProps}
        userId="user-123"
        onBookmarkToggle={vi.fn()}
        isBookmarked={false}
      />
    );
    expect(screen.getByTitle("Save story")).toBeInTheDocument();
  });

  it("shows filled heart when bookmarked", () => {
    render(
      <ComicCard
        {...defaultProps}
        userId="user-123"
        onBookmarkToggle={vi.fn()}
        isBookmarked={true}
      />
    );
    expect(screen.getByTitle("Remove bookmark")).toBeInTheDocument();
  });

  it("calls onBookmarkToggle with story when clicked", () => {
    const toggle = vi.fn();
    render(
      <ComicCard
        {...defaultProps}
        userId="user-123"
        onBookmarkToggle={toggle}
        isBookmarked={false}
      />
    );
    fireEvent.click(screen.getByTitle("Save story"));
    expect(toggle).toHaveBeenCalledWith(MOCK_STORY);
  });

  // ── Audio button ──────────────────────────────────────────

  it("renders audio button", () => {
    render(<ComicCard {...defaultProps} />);
    expect(screen.getByTitle("Read aloud")).toBeInTheDocument();
  });

  it("toggles speech synthesis on click", () => {
    render(<ComicCard {...defaultProps} />);
    fireEvent.click(screen.getByTitle("Read aloud"));
    expect(window.speechSynthesis.speak).toHaveBeenCalled();
  });

  // ── Edge cases ────────────────────────────────────────────

  it("handles story with empty dialogue gracefully", () => {
    const story = { ...MOCK_STORY, dialogue: [] };
    render(<ComicCard {...defaultProps} story={story} />);
    // Falls back to showing story text as Mina dialogue (appears in both "What happened" and dialogue)
    const matches = screen.getAllByText(story.story);
    expect(matches.length).toBeGreaterThanOrEqual(2);
  });

  it("handles missing simplicityScore", () => {
    const story = { ...MOCK_STORY, simplicityScore: undefined };
    render(<ComicCard {...defaultProps} story={story} />);
    // Should not crash, simplicity dots just won't show
    expect(screen.getByText(story.title)).toBeInTheDocument();
  });
});
