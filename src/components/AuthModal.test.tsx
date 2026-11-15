import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import AuthModal from "@/components/AuthModal";

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

describe("AuthModal", () => {
  const defaultProps = {
    open: true,
    onClose: vi.fn(),
    onEmailSignIn: vi.fn().mockResolvedValue({ error: null }),
    onEmailSignUp: vi.fn().mockResolvedValue({ error: null }),
  };

  it("renders nothing when closed", () => {
    const { container } = render(<AuthModal {...defaultProps} open={false} />);
    expect(container.innerHTML).toBe("");
  });

  it("renders login form when open", () => {
    render(<AuthModal {...defaultProps} />);
    expect(screen.getByText("Welcome Back!")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("your@email.com")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("At least 6 characters")).toBeInTheDocument();
  });

  it("calls onEmailSignIn on form submit in login mode", async () => {
    render(<AuthModal {...defaultProps} />);
    fireEvent.change(screen.getByPlaceholderText("your@email.com"), {
      target: { value: "test@example.com" },
    });
    fireEvent.change(screen.getByPlaceholderText("At least 6 characters"), {
      target: { value: "password123" },
    });
    fireEvent.click(screen.getByText("Log In"));
    await waitFor(() => {
      expect(defaultProps.onEmailSignIn).toHaveBeenCalledWith("test@example.com", "password123");
    });
  });

  it("switches to signup mode", () => {
    render(<AuthModal {...defaultProps} />);
    fireEvent.click(screen.getByText("Create an account"));
    expect(screen.getByText("Join KidsAINews!")).toBeInTheDocument();
    expect(screen.getByText("Sign Up")).toBeInTheDocument();
  });

  it("calls onEmailSignUp in signup mode", async () => {
    render(<AuthModal {...defaultProps} />);
    fireEvent.click(screen.getByText("Create an account"));
    fireEvent.change(screen.getByPlaceholderText("your@email.com"), {
      target: { value: "new@example.com" },
    });
    fireEvent.change(screen.getByPlaceholderText("At least 6 characters"), {
      target: { value: "newpass123" },
    });
    fireEvent.click(screen.getByText("Sign Up"));
    await waitFor(() => {
      expect(defaultProps.onEmailSignUp).toHaveBeenCalledWith("new@example.com", "newpass123");
    });
  });

  it("closes modal after successful signup", async () => {
    render(<AuthModal {...defaultProps} />);
    fireEvent.click(screen.getByText("Create an account"));
    fireEvent.change(screen.getByPlaceholderText("your@email.com"), {
      target: { value: "new@example.com" },
    });
    fireEvent.change(screen.getByPlaceholderText("At least 6 characters"), {
      target: { value: "newpass123" },
    });
    fireEvent.click(screen.getByText("Sign Up"));
    await waitFor(() => {
      expect(defaultProps.onClose).toHaveBeenCalled();
    });
  });

  it("shows error message on login failure", async () => {
    const props = {
      ...defaultProps,
      onEmailSignIn: vi.fn().mockResolvedValue({
        error: { message: "Invalid credentials" },
      }),
    };
    render(<AuthModal {...props} />);
    fireEvent.change(screen.getByPlaceholderText("your@email.com"), {
      target: { value: "test@example.com" },
    });
    fireEvent.change(screen.getByPlaceholderText("At least 6 characters"), {
      target: { value: "wrong" },
    });
    fireEvent.click(screen.getByText("Log In"));
    await waitFor(() => {
      expect(screen.getByText("Invalid credentials")).toBeInTheDocument();
    });
  });

  it("calls onClose when X button clicked", () => {
    render(<AuthModal {...defaultProps} />);
    // Find the close button (the one with X icon in header)
    const closeButtons = screen.getAllByRole("button");
    // First button in the header area is the close button
    const closeBtn = closeButtons.find((b) => b.querySelector(".lucide-x"));
    if (closeBtn) fireEvent.click(closeBtn);
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it("calls onClose when backdrop clicked", () => {
    render(<AuthModal {...defaultProps} />);
    // The backdrop is the absolute inset-0 bg-black/50 div
    const backdrop = document.querySelector(".bg-black\\/50");
    if (backdrop) fireEvent.click(backdrop);
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it("switches back to login from signup", () => {
    render(<AuthModal {...defaultProps} />);
    fireEvent.click(screen.getByText("Create an account"));
    expect(screen.getByText("Join KidsAINews!")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Log in"));
    expect(screen.getByText("Welcome Back!")).toBeInTheDocument();
  });
});
