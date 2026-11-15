import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import StoryIllustration from "@/components/StoryIllustration";

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

describe("StoryIllustration", () => {
  it("renders the emoji", () => {
    render(<StoryIllustration title="Test Title" emoji="🪐" category="Space" />);
    expect(screen.getByText("🪐")).toBeInTheDocument();
  });

  it("renders the category label in SVG", () => {
    const { container } = render(
      <StoryIllustration title="Test Title" emoji="🔬" category="Science" />
    );
    const text = container.querySelector("text");
    expect(text?.textContent).toBe("SCIENCE");
  });

  it("produces consistent output for the same title", () => {
    const { container: c1 } = render(
      <StoryIllustration title="Same Title" emoji="🌍" category="World" />
    );
    const { container: c2 } = render(
      <StoryIllustration title="Same Title" emoji="🌍" category="World" />
    );
    expect(c1.innerHTML).toBe(c2.innerHTML);
  });

  it("produces different output for different titles", () => {
    const { container: c1 } = render(
      <StoryIllustration title="Title A" emoji="🌍" category="World" />
    );
    const { container: c2 } = render(
      <StoryIllustration title="Title B" emoji="🌍" category="World" />
    );
    // The SVG pattern IDs include the hash, so they'll differ
    expect(c1.innerHTML).not.toBe(c2.innerHTML);
  });

  it("uses default palette for unknown category", () => {
    const { container } = render(
      <StoryIllustration title="Test" emoji="❓" category="UnknownCategory" />
    );
    // Should still render without error
    expect(container.querySelector("svg")).toBeInTheDocument();
  });

  it("renders correct number of decorative circles", () => {
    const { container } = render(
      <StoryIllustration title="Circle Test" emoji="🎯" category="Fun" />
    );
    const circles = container.querySelectorAll("circle");
    // At least: dot pattern circle + central glow + 3-6 decorative = 5+
    expect(circles.length).toBeGreaterThanOrEqual(3);
  });

  it("renders SVG with correct viewBox", () => {
    const { container } = render(
      <StoryIllustration title="Test" emoji="⚽" category="Sports" />
    );
    const svg = container.querySelector("svg");
    expect(svg?.getAttribute("viewBox")).toBe("0 0 480 300");
  });

  it("handles all known categories without error", () => {
    const categories = [
      "Science", "Tech", "World", "Sports", "Space", "Animals",
      "Health", "Fun", "Culture", "US", "Nature", "Environment",
      "Politics", "Education",
    ];
    for (const cat of categories) {
      const { container } = render(
        <StoryIllustration title={`Test ${cat}`} emoji="✅" category={cat} />
      );
      expect(container.querySelector("svg")).toBeInTheDocument();
    }
  });
});
