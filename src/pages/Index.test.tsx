import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Index from "@/pages/Index";
import { MOCK_PREFERENCES } from "@/test/mocks";

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
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } },
      })),
    },
    functions: {
      invoke: vi.fn().mockResolvedValue({ data: { stories: [], sourcesUsed: [] }, error: null }),
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: [] }),
      maybeSingle: vi.fn().mockResolvedValue({ data: null }),
    })),
  },
}));

describe("Index page", () => {
  it("shows onboarding when no preferences stored", async () => {
    render(
      <MemoryRouter>
        <Index />
      </MemoryRouter>
    );
    await waitFor(() => {
      expect(screen.getByText(/HOW OLD ARE YOU/)).toBeInTheDocument();
    });
  });

  it("shows NewsFeed when preferences are complete", async () => {
    localStorage.setItem("kidsainews_preferences", JSON.stringify(MOCK_PREFERENCES));
    render(
      <MemoryRouter>
        <Index />
      </MemoryRouter>
    );
    await waitFor(() => {
      // "KidsAINews" is split across child spans
      expect(screen.getAllByText((_content, el) => el?.tagName === "SPAN" && el?.textContent === "KidsAINews").length).toBeGreaterThan(0);
    });
  });
});
