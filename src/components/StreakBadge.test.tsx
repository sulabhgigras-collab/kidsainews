import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import StreakBadge from "@/components/StreakBadge";

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

describe("StreakBadge", () => {
  it("renders nothing when streak is 0 and no badges", () => {
    const { container } = render(
      <StreakBadge currentStreak={0} longestStreak={0} badges={[]} />
    );
    expect(container.innerHTML).toBe("");
  });

  it("renders fire emoji and streak count", () => {
    render(<StreakBadge currentStreak={5} longestStreak={5} badges={[]} />);
    expect(screen.getByText("🔥")).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument();
  });

  it("shows popup on click", () => {
    render(<StreakBadge currentStreak={7} longestStreak={10} badges={["Curious Cat"]} />);
    fireEvent.click(screen.getByText("7"));
    expect(screen.getByText("Reading Streak")).toBeInTheDocument();
    expect(screen.getByText(/7 days/)).toBeInTheDocument();
    expect(screen.getByText(/10 days/)).toBeInTheDocument();
  });

  it("displays badges in popup", () => {
    render(
      <StreakBadge
        currentStreak={7}
        longestStreak={7}
        badges={["Curious Cat", "News Explorer"]}
      />
    );
    fireEvent.click(screen.getByText("7"));
    expect(screen.getByText("BADGES")).toBeInTheDocument();
    expect(screen.getByText(/Curious Cat/)).toBeInTheDocument();
    expect(screen.getByText(/News Explorer/)).toBeInTheDocument();
  });

  it("renders even when streak is 0 but has badges", () => {
    render(
      <StreakBadge currentStreak={0} longestStreak={5} badges={["Curious Cat"]} />
    );
    // Badge emoji replaces flame when badges are earned
    expect(screen.getByText("🐱")).toBeInTheDocument();
    expect(screen.getByText("0")).toBeInTheDocument();
  });

  it("closes popup when clicking outside", () => {
    render(<StreakBadge currentStreak={3} longestStreak={3} badges={[]} />);
    fireEvent.click(screen.getByText("3"));
    expect(screen.getByText("Reading Streak")).toBeInTheDocument();
    // The "fixed inset-0" overlay acts as the close trigger
    const overlay = document.querySelector(".fixed.inset-0");
    if (overlay) fireEvent.click(overlay);
    expect(screen.queryByText("Reading Streak")).not.toBeInTheDocument();
  });
});
