import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  component?: ReactNode;
  action?: () => void;
  validation?: () => boolean;
  skippable?: boolean;
  required?: boolean;
}

export interface UserProfile {
  name: string;
  email: string;
  preferences: {
    notifications: boolean;
    dataSharing: boolean;
    weeklyReports: boolean;
  };
  interests: string[];
  goals: string[];
  experienceLevel: 'beginner' | 'intermediate' | 'advanced';
}

export interface UserProgress {
  completedSteps: string[];
  currentStep: string;
  totalSteps: number;
  achievements: Achievement[];
  showTips: boolean;
  lastActiveDate: number;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt: number;
  category: 'onboarding' | 'integration' | 'engagement' | 'mastery';
}

export interface TutorialState {
  isActive: boolean;
  currentTutorial: string | null;
  stepIndex: number;
  overlayElement: HTMLElement | null;
  canProceed: boolean;
}

interface OnboardingContextType {
  // State
  isOnboarding: boolean;
  currentStepIndex: number;
  userProfile: UserProfile | null;
  userProgress: UserProgress | null;
  tutorialState: TutorialState;

  // Onboarding Steps
  steps: OnboardingStep[];

  // Actions
  startOnboarding: () => void;
  completeCurrentStep: () => void;
  skipCurrentStep: () => void;
  goToStep: (stepIndex: number) => void;
  updateProfile: (profile: Partial<UserProfile>) => void;

  // Tutorial System
  startTutorial: (tutorialId: string) => void;
  endTutorial: () => void;
  nextTutorialStep: () => void;
  previousTutorialStep: () => void;

  // Progress & Achievements
  unlockAchievement: (achievement: Achievement) => void;
  updateProgress: (progress: Partial<UserProgress>) => void;

  // Help System
  showHelp: (topic?: string) => void;
  toggleTips: () => void;

  // UI State
  setOverlayElement: (element: HTMLElement | null) => void;
  dismissOnboarding: () => void;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

export const useOnboarding = () => {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
};

interface OnboardingProviderProps {
  children: ReactNode;
}

export const OnboardingProvider: React.FC<OnboardingProviderProps> = ({ children }) => {
  const [isOnboarding, setIsOnboarding] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [userProgress, setUserProgress] = useState<UserProgress | null>(null);
  const [tutorialState, setTutorialState] = useState<TutorialState>({
    isActive: false,
    currentTutorial: null,
    stepIndex: 0,
    overlayElement: null,
    canProceed: true,
  });

  // Onboarding Steps Configuration
  const steps: OnboardingStep[] = [
    {
      id: 'welcome',
      title: 'Welcome to AI Council LifeOS',
      description:
        "Your personal AI advisory council is ready to help you optimize every aspect of your life. Let's get you set up!",
      skippable: false,
      required: true,
    },
    {
      id: 'profile-setup',
      title: 'Set Up Your Profile',
      description:
        'Tell us about yourself so your council can provide personalized guidance tailored to your needs.',
      required: true,
      validation: () => (userProfile?.name && userProfile?.email ? true : false),
    },
    {
      id: 'council-introduction',
      title: 'Meet Your Council',
      description:
        'Get to know your 8 specialized AI council members and their unique areas of expertise.',
      required: true,
    },
    {
      id: 'data-connection',
      title: 'Connect Your Data',
      description:
        'Connect your data sources to enable personalized insights. Start with one integration and add more as you go.',
      skippable: true,
    },
    {
      id: 'goal-setting',
      title: 'Set Your Goals',
      description:
        'What would you like to achieve? Your council will help you create actionable plans to reach your goals.',
      required: true,
      validation: () => (userProfile?.goals && userProfile.goals.length > 0 ? true : false),
    },
    {
      id: 'first-insights',
      title: 'Your First Insights',
      description:
        'Your council is already analyzing your data. Here are your first personalized insights!',
      required: true,
    },
    {
      id: 'completion',
      title: "You're All Set!",
      description:
        "Congratulations! Your AI council is ready to help you achieve your goals. Here's what to do next.",
      required: true,
    },
  ];

  // Initialize user progress from localStorage
  useEffect(() => {
    const savedProfile = localStorage.getItem('userProfile');
    const savedProgress = localStorage.getItem('userProgress');
    const hasCompletedOnboarding = localStorage.getItem('hasCompletedOnboarding');

    if (savedProfile) {
      setUserProfile(JSON.parse(savedProfile));
    }

    if (savedProgress) {
      setUserProgress(JSON.parse(savedProgress));
    }

    // Start onboarding for new users
    if (!hasCompletedOnboarding && !savedProfile) {
      setIsOnboarding(true);
    }
  }, []);

  // Save user profile to localStorage
  useEffect(() => {
    if (userProfile) {
      localStorage.setItem('userProfile', JSON.stringify(userProfile));
    }
  }, [userProfile]);

  // Save user progress to localStorage
  useEffect(() => {
    if (userProgress) {
      localStorage.setItem('userProgress', JSON.stringify(userProgress));
    }
  }, [userProgress]);

  const startOnboarding = () => {
    setIsOnboarding(true);
    setCurrentStepIndex(0);
    if (!userProgress) {
      setUserProgress({
        completedSteps: [],
        currentStep: steps[0].id,
        totalSteps: steps.length,
        achievements: [],
        showTips: true,
        lastActiveDate: Date.now(),
      });
    }
  };

  const completeCurrentStep = () => {
    const currentStep = steps[currentStepIndex];

    // Update progress
    if (userProgress) {
      const newCompletedSteps = [...userProgress.completedSteps, currentStep.id];
      const updatedProgress = {
        ...userProgress,
        completedSteps: newCompletedSteps,
        currentStep: steps[currentStepIndex + 1]?.id || currentStep.id,
        lastActiveDate: Date.now(),
      };
      setUserProgress(updatedProgress);

      // Check for achievements
      checkForAchievements(newCompletedSteps);
    }

    // Move to next step or complete onboarding
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
    } else {
      completeOnboarding();
    }
  };

  const skipCurrentStep = () => {
    const currentStep = steps[currentStepIndex];
    if (currentStep.skippable) {
      if (currentStepIndex < steps.length - 1) {
        setCurrentStepIndex(currentStepIndex + 1);
      } else {
        completeOnboarding();
      }
    }
  };

  const goToStep = (stepIndex: number) => {
    if (stepIndex >= 0 && stepIndex < steps.length) {
      setCurrentStepIndex(stepIndex);
    }
  };

  const completeOnboarding = () => {
    setIsOnboarding(false);
    localStorage.setItem('hasCompletedOnboarding', 'true');

    // Unlock completion achievement
    unlockAchievement({
      id: 'onboarding-complete',
      title: 'AI Council Initiated',
      description: 'Successfully completed the onboarding process',
      icon: '🎉',
      unlockedAt: Date.now(),
      category: 'onboarding',
    });
  };

  const dismissOnboarding = () => {
    setIsOnboarding(false);
    localStorage.setItem('hasCompletedOnboarding', 'true');
  };

  const updateProfile = (profileUpdates: Partial<UserProfile>) => {
    setUserProfile((prev) => (prev ? { ...prev, ...profileUpdates } : null));
  };

  const startTutorial = (tutorialId: string) => {
    setTutorialState({
      isActive: true,
      currentTutorial: tutorialId,
      stepIndex: 0,
      overlayElement: null,
      canProceed: true,
    });
  };

  const endTutorial = () => {
    setTutorialState({
      isActive: false,
      currentTutorial: null,
      stepIndex: 0,
      overlayElement: null,
      canProceed: true,
    });
  };

  const nextTutorialStep = () => {
    setTutorialState((prev) => ({
      ...prev,
      stepIndex: prev.stepIndex + 1,
    }));
  };

  const previousTutorialStep = () => {
    setTutorialState((prev) => ({
      ...prev,
      stepIndex: Math.max(0, prev.stepIndex - 1),
    }));
  };

  const unlockAchievement = (achievement: Achievement) => {
    if (userProgress) {
      const existingAchievement = userProgress.achievements.find((a) => a.id === achievement.id);
      if (!existingAchievement) {
        const updatedProgress = {
          ...userProgress,
          achievements: [...userProgress.achievements, achievement],
        };
        setUserProgress(updatedProgress);
      }
    }
  };

  const updateProgress = (progressUpdates: Partial<UserProgress>) => {
    setUserProgress((prev) => (prev ? { ...prev, ...progressUpdates } : null));
  };

  const showHelp = (topic?: string) => {
    // Implementation for help system
    console.log('Showing help for topic:', topic);
  };

  const toggleTips = () => {
    setUserProgress((prev) => (prev ? { ...prev, showTips: !prev.showTips } : null));
  };

  const setOverlayElement = (element: HTMLElement | null) => {
    setTutorialState((prev) => ({ ...prev, overlayElement: element }));
  };

  const checkForAchievements = (completedSteps: string[]) => {
    // Check for various achievements based on completed steps
    if (completedSteps.includes('profile-setup')) {
      unlockAchievement({
        id: 'profile-complete',
        title: 'Identity Established',
        description: 'Completed your profile setup',
        icon: '👤',
        unlockedAt: Date.now(),
        category: 'onboarding',
      });
    }

    if (completedSteps.includes('data-connection')) {
      unlockAchievement({
        id: 'data-connected',
        title: 'Data Stream Initiated',
        description: 'Connected your first data source',
        icon: '📊',
        unlockedAt: Date.now(),
        category: 'integration',
      });
    }

    if (completedSteps.length === steps.length) {
      unlockAchievement({
        id: 'onboarding-master',
        title: 'Quick Learner',
        description: 'Completed all onboarding steps without skipping',
        icon: '⚡',
        unlockedAt: Date.now(),
        category: 'onboarding',
      });
    }
  };

  const value: OnboardingContextType = {
    // State
    isOnboarding,
    currentStepIndex,
    userProfile,
    userProgress,
    tutorialState,

    // Onboarding Steps
    steps,

    // Actions
    startOnboarding,
    completeCurrentStep,
    skipCurrentStep,
    goToStep,
    updateProfile,

    // Tutorial System
    startTutorial,
    endTutorial,
    nextTutorialStep,
    previousTutorialStep,

    // Progress & Achievements
    unlockAchievement,
    updateProgress,

    // Help System
    showHelp,
    toggleTips,

    // UI State
    setOverlayElement,
    dismissOnboarding,
  };

  return <OnboardingContext.Provider value={value}>{children}</OnboardingContext.Provider>;
};
