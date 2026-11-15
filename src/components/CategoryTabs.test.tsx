import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import CategoryTabs, { NEWS_TABS } from "@/components/CategoryTabs";

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

describe("CategoryTabs", () => {
  it("renders all tabs", () => {
    render(<CategoryTabs activeTab="top" onTabChange={vi.fn()} />);
    for (const tab of NEWS_TABS) {
      expect(screen.getByText(tab.label)).toBeInTheDocument();
    }
  });

  it("NEWS_TABS has at least 10 entries", () => {
    expect(NEWS_TABS.length).toBeGreaterThanOrEqual(10);
  });

  it("NEWS_TABS includes expected categories", () => {
    const ids = NEWS_TABS.map((t) => t.id);
    expect(ids).toContain("top");
    expect(ids).toContain("world");
    expect(ids).toContain("science");
    expect(ids).toContain("sports");
    expect(ids).toContain("space");
    expect(ids).toContain("fun");
    expect(ids).toContain("environment");
    expect(ids).toContain("politics");
    expect(ids).toContain("education");
  });

  it("top tab has empty categories (shows all)", () => {
    const topTab = NEWS_TABS.find((t) => t.id === "top");
    expect(topTab).toBeDefined();
    expect(topTab!.categories).toHaveLength(0);
  });

  it("calls onTabChange when a tab is clicked", () => {
    const onTabChange = vi.fn();
    render(<CategoryTabs activeTab="top" onTabChange={onTabChange} />);
    fireEvent.click(screen.getByText("Science"));
    expect(onTabChange).toHaveBeenCalledWith("science");
  });

  it("displays story counts when provided", () => {
    const counts: Record<string, number> = { top: 12, science: 3, sports: 2 };
    render(<CategoryTabs activeTab="top" onTabChange={vi.fn()} storyCounts={counts} />);
    expect(screen.getByText("12")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("does not display count for zero", () => {
    const counts: Record<string, number> = { top: 5, science: 0 };
    render(<CategoryTabs activeTab="top" onTabChange={vi.fn()} storyCounts={counts} />);
    expect(screen.getByText("5")).toBeInTheDocument();
    expect(screen.queryByText("0")).not.toBeInTheDocument();
  });

  it("each tab has an emoji", () => {
    for (const tab of NEWS_TABS) {
      expect(tab.emoji).toBeTruthy();
      expect(tab.emoji.length).toBeGreaterThanOrEqual(1);
    }
  });
});
