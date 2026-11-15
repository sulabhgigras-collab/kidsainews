import { useState, useEffect } from "react";
import Onboarding from "@/components/Onboarding";
import NewsFeed from "@/components/NewsFeed";
import { getPreferences, savePreferences, UserPreferences, loadPreferencesFromSupabase, syncPreferencesToSupabase } from "@/lib/newsData";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

const Index = () => {
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (authLoading) return;

    const resolve = async () => {
      // Authenticated user — try cloud prefs first
      if (user) {
        const cloudPrefs = await loadPreferencesFromSupabase(supabase, user.id);
        if (cloudPrefs) {
          savePreferences(cloudPrefs);
          setPreferences(cloudPrefs);
          toast({ title: "Welcome back!", description: "Your preferences are loaded." });
          setAuthChecked(true);
          return;
        }
      }

      // Fall back to localStorage (guest flow or first-time authenticated user)
      const stored = getPreferences();
      if (stored?.onboardingComplete) {
        // If authenticated but no cloud prefs, push local prefs to cloud
        if (user) {
          syncPreferencesToSupabase(supabase, user.id, stored);
        }
        setPreferences(stored);
      } else {
        setShowOnboarding(true);
      }
      setAuthChecked(true);
    };

    resolve();
  }, [authLoading, user?.id]);

  const handleOnboardingComplete = (prefs: UserPreferences) => {
    setPreferences(prefs);
    setShowOnboarding(false);
  };

  const handleEditPreferences = () => {
    setShowOnboarding(true);
  };

  // Show spinner while auth session resolves
  if (authLoading || !authChecked) {
    return (
      <div className="min-h-screen bg-background comic-dots flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <p className="font-bangers text-lg text-muted-foreground tracking-wide">Loading...</p>
        </div>
      </div>
    );
  }

  if (showOnboarding) {
    return (
      <Onboarding
        onComplete={handleOnboardingComplete}
        initialPreferences={preferences}
        onCancel={preferences ? () => setShowOnboarding(false) : undefined}
        onLoginSuccess={handleOnboardingComplete}
      />
    );
  }

  if (preferences) {
    return <NewsFeed preferences={preferences} onEditPreferences={handleEditPreferences} onPreferencesChange={setPreferences} />;
  }

  return null;
};

export default Index;
