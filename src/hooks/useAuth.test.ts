import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useAuth } from "@/hooks/useAuth";

// Mock Supabase
const mockUnsubscribe = vi.fn();
let authChangeCallback: Function;

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({
        data: { session: null },
        error: null,
      }),
      onAuthStateChange: vi.fn((callback: Function) => {
        authChangeCallback = callback;
        return {
          data: { subscription: { unsubscribe: mockUnsubscribe } },
        };
      }),
      signInWithOAuth: vi.fn().mockResolvedValue({ data: null, error: null }),
      signInWithPassword: vi.fn().mockResolvedValue({ data: null, error: null }),
      signUp: vi.fn().mockResolvedValue({ data: null, error: null }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
    },
  },
}));

describe("useAuth", () => {
  it("starts with loading=true and no user", async () => {
    const { result } = renderHook(() => useAuth());
    // Initially loading
    expect(result.current.loading).toBe(true);
    expect(result.current.user).toBeNull();
    expect(result.current.session).toBeNull();

    // After session check completes
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
  });

  it("updates user when auth state changes", async () => {
    const { result } = renderHook(() => useAuth());
    await waitFor(() => expect(result.current.loading).toBe(false));

    const mockSession = {
      user: { id: "user-123", email: "test@example.com" },
      access_token: "token",
    };

    act(() => {
      authChangeCallback("SIGNED_IN", mockSession);
    });

    expect(result.current.user).toEqual(mockSession.user);
    expect(result.current.session).toEqual(mockSession);
  });

  it("clears user on sign out event", async () => {
    const { result } = renderHook(() => useAuth());
    await waitFor(() => expect(result.current.loading).toBe(false));

    // First sign in
    act(() => {
      authChangeCallback("SIGNED_IN", {
        user: { id: "user-123" },
        access_token: "token",
      });
    });
    expect(result.current.user).not.toBeNull();

    // Then sign out
    act(() => {
      authChangeCallback("SIGNED_OUT", null);
    });
    expect(result.current.user).toBeNull();
    expect(result.current.session).toBeNull();
  });

  it("provides signInWithGoogle function", async () => {
    const { result } = renderHook(() => useAuth());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(typeof result.current.signInWithGoogle).toBe("function");
    await result.current.signInWithGoogle();
    const { supabase } = await import("@/integrations/supabase/client");
    expect(supabase.auth.signInWithOAuth).toHaveBeenCalledWith({
      provider: "google",
      options: { redirectTo: expect.any(String) },
    });
  });

  it("provides signOut function", async () => {
    const { result } = renderHook(() => useAuth());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await result.current.signOut();
    const { supabase } = await import("@/integrations/supabase/client");
    expect(supabase.auth.signOut).toHaveBeenCalled();
  });

  it("unsubscribes on unmount", async () => {
    const { unmount } = renderHook(() => useAuth());
    unmount();
    expect(mockUnsubscribe).toHaveBeenCalled();
  });
});
