import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Bookmarks from "@/pages/Bookmarks";
import { MOCK_STORY, MOCK_PREFERENCES } from "@/test/mocks";

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

// Mock supabase
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({
        data: {
          session: {
            user: { id: "user-123", email: "test@example.com" },
            access_token: "token",
          },
        },
      }),
      onAuthStateChange: vi.fn((cb: Function) => {
        cb("SIGNED_IN", {
          user: { id: "user-123", email: "test@example.com" },
          access_token: "token",
        });
        return {
          data: { subscription: { unsubscribe: vi.fn() } },
        };
      }),
      signOut: vi.fn(),
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: [] }),
      maybeSingle: vi.fn().mockResolvedValue({ data: null }),
    })),
  },
}));

// Mock ComicCard
vi.mock("@/components/ComicCard", () => ({
  default: ({ story }: any) => <div data-testid="comic-card">{story.title}</div>,
}));

describe("Bookmarks page", () => {
  beforeEach(() => {
    localStorage.setItem("kidsainews_preferences", JSON.stringify(MOCK_PREFERENCES));
  });

  it("renders header with title", async () => {
    render(
      <MemoryRouter>
        <Bookmarks />
      </MemoryRouter>
    );
    expect(screen.getByText("My Saved Stories")).toBeInTheDocument();
  });

  it("shows empty state when no bookmarks", async () => {
    render(
      <MemoryRouter>
        <Bookmarks />
      </MemoryRouter>
    );
    expect(screen.getByText("NO SAVED STORIES YET")).toBeInTheDocument();
    expect(screen.getByText("FIND STORIES!")).toBeInTheDocument();
  });
});
