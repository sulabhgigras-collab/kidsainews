import { useState, useEffect } from "react";
import Onboarding from "@/components/Onboarding";
import NewsFeed from "@/components/NewsFeed";
import { getPreferences, savePreferences, UserPreferences } from "@/lib/newsData";

const Index = () => {
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    const stored = getPreferences();
    if (stored?.onboardingComplete) {
      setPreferences(stored);
    } else {
      setShowOnboarding(true);
    }
  }, []);

  const handleOnboardingComplete = (prefs: UserPreferences) => {
    setPreferences(prefs);
    setShowOnboarding(false);
  };

  const handleEditPreferences = () => {
    setShowOnboarding(true);
  };

  if (showOnboarding) {
    return <Onboarding onComplete={handleOnboardingComplete} initialPreferences={preferences} />;
  }

  if (preferences) {
    return <NewsFeed preferences={preferences} onEditPreferences={handleEditPreferences} onPreferencesChange={setPreferences} />;
  }

  return null;
};

export default Index;
