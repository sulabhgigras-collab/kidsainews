import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import Onboarding from "@/components/Onboarding";
import { INTERESTS, COMIC_STYLES, LANGUAGES, COUNTRIES } from "@/lib/newsData";

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

describe("Onboarding", () => {
  const onComplete = vi.fn();

  it("starts on age step", () => {
    render(<Onboarding onComplete={onComplete} />);
    expect(screen.getByText(/HOW OLD ARE YOU/)).toBeInTheDocument();
  });

  it("shows age slider with default value 8", () => {
    render(<Onboarding onComplete={onComplete} />);
    expect(screen.getByText("8")).toBeInTheDocument();
    const slider = screen.getByRole("slider");
    expect(slider).toHaveAttribute("min", "5");
    expect(slider).toHaveAttribute("max", "15");
  });

  it("NEXT button is enabled when age is valid", () => {
    render(<Onboarding onComplete={onComplete} />);
    const nextBtn = screen.getByText("NEXT");
    expect(nextBtn).not.toBeDisabled();
  });

  it("advances to country step on NEXT", () => {
    render(<Onboarding onComplete={onComplete} />);
    fireEvent.click(screen.getByText("NEXT"));
    expect(screen.getByText(/WHERE ARE YOU FROM/)).toBeInTheDocument();
  });

  it("shows all countries in country step", () => {
    render(<Onboarding onComplete={onComplete} />);
    fireEvent.click(screen.getByText("NEXT")); // → country
    expect(screen.getByText("United States")).toBeInTheDocument();
    expect(screen.getByText("India")).toBeInTheDocument();
    expect(screen.getByText("Japan")).toBeInTheDocument();
  });

  it("NEXT disabled until country selected", () => {
    render(<Onboarding onComplete={onComplete} />);
    fireEvent.click(screen.getByText("NEXT")); // → country
    const nextBtn = screen.getByText("NEXT");
    expect(nextBtn).toBeDisabled();
  });

  it("selects a country and enables NEXT", () => {
    render(<Onboarding onComplete={onComplete} />);
    fireEvent.click(screen.getByText("NEXT")); // → country
    fireEvent.click(screen.getByText("United States"));
    expect(screen.getByText("NEXT")).not.toBeDisabled();
  });

  it("full flow: age → country → interests → style → language → complete", () => {
    render(<Onboarding onComplete={onComplete} />);

    // Step 0: Age (default 8 is valid)
    fireEvent.click(screen.getByText("NEXT"));

    // Step 1: Country
    fireEvent.click(screen.getByText("United States"));
    fireEvent.click(screen.getByText("NEXT"));

    // Step 2: Interests (pick 1)
    fireEvent.click(screen.getByText("Science & Discoveries"));
    fireEvent.click(screen.getByText("NEXT"));

    // Step 3: Comic style
    fireEvent.click(screen.getByText("Detective Mystery"));
    fireEvent.click(screen.getByText("NEXT"));

    // Step 4: Language (English pre-selected)
    expect(screen.getByText(/PICK YOUR LANGUAGE/)).toBeInTheDocument();
    // Click LET'S GO!
    fireEvent.click(screen.getByText("LET'S GO!"));

    expect(onComplete).toHaveBeenCalledWith(
      expect.objectContaining({
        age: 8,
        country: "United States",
        interests: ["science"],
        comicStyle: "detective",
        language: "en",
        onboardingComplete: true,
      })
    );
  });

  it("BACK button goes to previous step", () => {
    render(<Onboarding onComplete={onComplete} />);
    fireEvent.click(screen.getByText("NEXT")); // → country
    expect(screen.getByText(/WHERE ARE YOU FROM/)).toBeInTheDocument();
    fireEvent.click(screen.getByText("BACK"));
    expect(screen.getByText(/HOW OLD ARE YOU/)).toBeInTheDocument();
  });

  it("BACK button hidden on first step", () => {
    render(<Onboarding onComplete={onComplete} />);
    const backBtn = screen.getByText("BACK");
    expect(backBtn).toHaveClass("opacity-0");
  });

  it("starts at step 2 (interests) when initialPreferences provided", () => {
    render(
      <Onboarding
        onComplete={onComplete}
        initialPreferences={{
          age: 10,
          country: "India",
          additionalCountries: [],
          interests: ["space"],
          comicStyle: "superhero",
          language: "en",
          onboardingComplete: true,
        }}
      />
    );
    expect(screen.getByText(/WHAT EXCITES YOU/)).toBeInTheDocument();
  });

  it("allows multiple interest selection", () => {
    render(<Onboarding onComplete={onComplete} />);
    fireEvent.click(screen.getByText("NEXT")); // → country
    fireEvent.click(screen.getByText("United States"));
    fireEvent.click(screen.getByText("NEXT")); // → interests

    fireEvent.click(screen.getByText("Science & Discoveries"));
    fireEvent.click(screen.getByText("Space & Planets"));
    // Both should be "selected" (have the active class)
    expect(screen.getByText("NEXT")).not.toBeDisabled();
  });

  it("toggles interest off when clicked again", () => {
    render(<Onboarding onComplete={onComplete} />);
    fireEvent.click(screen.getByText("NEXT")); // → country
    fireEvent.click(screen.getByText("United States"));
    fireEvent.click(screen.getByText("NEXT")); // → interests

    fireEvent.click(screen.getByText("Science & Discoveries")); // select
    fireEvent.click(screen.getByText("Science & Discoveries")); // deselect
    // NEXT should be disabled now (0 interests)
    expect(screen.getByText("NEXT")).toBeDisabled();
  });
});
