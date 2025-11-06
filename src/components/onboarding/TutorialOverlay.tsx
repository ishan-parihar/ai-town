import React, { useState, useEffect, useRef } from 'react';
import { useOnboarding } from '../../contexts/OnboardingContext';
// Inline SVG components instead of lucide-react

// Inline SVG components
const XIcon = ({ size, className }: { size?: number; className?: string }) => (
  <svg
    width={size}
    height={size}
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const ArrowRightIcon = ({ size, className }: { size?: number; className?: string }) => (
  <svg
    width={size}
    height={size}
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  </svg>
);

const ArrowLeftIcon = ({ size, className }: { size?: number; className?: string }) => (
  <svg
    width={size}
    height={size}
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
  </svg>
);

interface TutorialStep {
  id: string;
  title: string;
  content: string;
  target?: string; // CSS selector for target element
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
  action?: () => void;
  validation?: () => boolean;
  spotlight?: boolean;
}

interface TutorialOverlayProps {
  tutorialId: string;
  steps: TutorialStep[];
  onComplete: () => void;
  onSkip: () => void;
}

const TutorialOverlay: React.FC<TutorialOverlayProps> = ({
  tutorialId,
  steps,
  onComplete,
  onSkip,
}) => {
  const { tutorialState, nextTutorialStep, previousTutorialStep, endTutorial } = useOnboarding();
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [highlightRect, setHighlightRect] = useState<DOMRect | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const overlayRef = useRef<HTMLDivElement>(null);

  const currentStep = steps[currentStepIndex];

  useEffect(() => {
    if (currentStep?.target) {
      highlightElement(currentStep.target);
    } else {
      setHighlightRect(null);
    }
  }, [currentStepIndex, currentStep]);

  const highlightElement = (selector: string) => {
    const element = document.querySelector(selector) as HTMLElement;
    if (element) {
      const rect = element.getBoundingClientRect();
      setHighlightRect(rect);
      positionTooltip(rect, currentStep?.position || 'top');
    }
  };

  const positionTooltip = (targetRect: DOMRect, position: string) => {
    const tooltipWidth = 400;
    const tooltipHeight = 200;
    const padding = 20;

    let top = 0;
    let left = 0;

    switch (position) {
      case 'top':
        top = targetRect.top - tooltipHeight - padding;
        left = targetRect.left + targetRect.width / 2 - tooltipWidth / 2;
        break;
      case 'bottom':
        top = targetRect.bottom + padding;
        left = targetRect.left + targetRect.width / 2 - tooltipWidth / 2;
        break;
      case 'left':
        top = targetRect.top + targetRect.height / 2 - tooltipHeight / 2;
        left = targetRect.left - tooltipWidth - padding;
        break;
      case 'right':
        top = targetRect.top + targetRect.height / 2 - tooltipHeight / 2;
        left = targetRect.right + padding;
        break;
      case 'center':
        top = window.innerHeight / 2 - tooltipHeight / 2;
        left = window.innerWidth / 2 - tooltipWidth / 2;
        break;
    }

    // Ensure tooltip stays within viewport
    left = Math.max(padding, Math.min(left, window.innerWidth - tooltipWidth - padding));
    top = Math.max(padding, Math.min(top, window.innerHeight - tooltipHeight - padding));

    setTooltipPosition({ top, left });
  };

  const handleNext = () => {
    if (currentStep.action) {
      currentStep.action();
    }

    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
      nextTutorialStep();
    } else {
      onComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
      previousTutorialStep();
    }
  };

  const canProceed = !currentStep.validation || currentStep.validation();

  if (!tutorialState.isActive || tutorialState.currentTutorial !== tutorialId) {
    return null;
  }

  return (
    <div ref={overlayRef} className="fixed inset-0 z-50 pointer-events-none">
      {/* Semi-transparent overlay */}
      <div className="absolute inset-0 bg-black bg-opacity-60 pointer-events-auto" />

      {/* Highlight spotlight */}
      {highlightRect && currentStep?.spotlight && (
        <div
          className="absolute border-4 border-blue-500 rounded-lg shadow-2xl pointer-events-none"
          style={{
            top: highlightRect.top - 4,
            left: highlightRect.left - 4,
            width: highlightRect.width + 8,
            height: highlightRect.height + 8,
            boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.6)',
          }}
        />
      )}

      {/* Tooltip */}
      <div
        className="absolute bg-gray-900 rounded-lg shadow-2xl border border-gray-700 p-6 max-w-md pointer-events-auto"
        style={{
          top: tooltipPosition.top,
          left: tooltipPosition.left,
        }}
      >
        {/* Close button */}
        <button
          onClick={onSkip}
          className="absolute top-2 right-2 text-gray-400 hover:text-white transition-colors"
        >
          <XIcon size={20} />
        </button>

        {/* Progress indicator */}
        <div className="flex space-x-1 mb-4">
          {steps.map((_, index) => (
            <div
              key={index}
              className={`h-1 flex-1 rounded-full ${
                index === currentStepIndex
                  ? 'bg-blue-500'
                  : index < currentStepIndex
                    ? 'bg-green-500'
                    : 'bg-gray-600'
              }`}
            />
          ))}
        </div>

        {/* Content */}
        <h3 className="text-lg font-semibold text-white mb-2">{currentStep?.title}</h3>
        <p className="text-gray-300 mb-6">{currentStep?.content}</p>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <div className="flex space-x-2">
            {currentStepIndex > 0 && (
              <button
                onClick={handlePrevious}
                className="flex items-center space-x-1 px-3 py-1 text-gray-400 hover:text-white transition-colors"
              >
                <ArrowLeftIcon size={16} />
                <span>Previous</span>
              </button>
            )}
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={onSkip}
              className="text-sm text-gray-400 hover:text-yellow-400 transition-colors"
            >
              Skip Tutorial
            </button>

            <button
              onClick={handleNext}
              disabled={!canProceed}
              className={`flex items-center space-x-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                canProceed
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-700 text-gray-400 cursor-not-allowed'
              }`}
            >
              <span>{currentStepIndex === steps.length - 1 ? 'Finish' : 'Next'}</span>
              <ArrowRightIcon size={16} />
            </button>
          </div>
        </div>

        {/* Step counter */}
        <div className="text-center mt-3">
          <span className="text-xs text-gray-500">
            Step {currentStepIndex + 1} of {steps.length}
          </span>
        </div>
      </div>
    </div>
  );
};

// Tutorial configurations
export const tutorialConfigurations = {
  dashboardOverview: {
    id: 'dashboard-overview',
    steps: [
      {
        id: 'welcome',
        title: 'Welcome to Your Dashboard',
        content:
          "This is your AI Council dashboard where you'll oversee all aspects of your life optimization journey.",
        position: 'center' as const,
        spotlight: false,
      },
      {
        id: 'council-members',
        title: 'Your Council Members',
        content:
          'Here you can see all your AI council members. Each has specialized expertise to help you in different areas of life.',
        target: '[data-testid="council-members"]',
        position: 'bottom' as const,
        spotlight: true,
      },
      {
        id: 'navigation-tabs',
        title: 'Navigation Tabs',
        content:
          'Use these tabs to access different parts of your council system: Overview, Insights, Data, Goals, and integrations.',
        target: '[data-testid="navigation-tabs"]',
        position: 'bottom' as const,
        spotlight: true,
      },
      {
        id: 'quick-stats',
        title: 'Quick Statistics',
        content:
          'Get a quick overview of your system status, recent activity, and key metrics here.',
        target: '[data-testid="quick-stats"]',
        position: 'left' as const,
        spotlight: true,
      },
    ] as TutorialStep[],
  },
  insightsTutorial: {
    id: 'insights-tutorial',
    steps: [
      {
        id: 'insights-overview',
        title: 'Understanding Your Insights',
        content:
          'Insights are personalized recommendations from your council members based on your data and goals.',
        position: 'center' as const,
        spotlight: false,
      },
      {
        id: 'insight-priority',
        title: 'Priority Levels',
        content:
          'Each insight has a priority level. Red means urgent, yellow means important, and green means suggestions.',
        target: '[data-testid="insight-priority"]',
        position: 'right' as const,
        spotlight: true,
      },
      {
        id: 'insight-actions',
        title: 'Taking Action',
        content:
          'You can mark insights as reviewed, acted upon, or dismiss them. Your council learns from your feedback.',
        target: '[data-testid="insight-actions"]',
        position: 'top' as const,
        spotlight: true,
      },
    ] as TutorialStep[],
  },
  dataConnectionTutorial: {
    id: 'data-connection-tutorial',
    steps: [
      {
        id: 'data-sources',
        title: 'Connect Your Data',
        content:
          'Connect various data sources to provide your council with the information they need to give you personalized advice.',
        position: 'center' as const,
        spotlight: false,
      },
      {
        id: 'notion-integration',
        title: 'Notion Integration',
        content:
          'Connect your Notion workspace to sync tasks, notes, and project data with your council.',
        target: '[data-testid="notion-integration"]',
        position: 'left' as const,
        spotlight: true,
      },
      {
        id: 'telegram-integration',
        title: 'Telegram Integration',
        content: 'Connect Telegram to chat with your council on the go and receive quick insights.',
        target: '[data-testid="telegram-integration"]',
        position: 'right' as const,
        spotlight: true,
      },
      {
        id: 'data-privacy',
        title: 'Your Data is Secure',
        content:
          'All your data is encrypted and processed securely. You have full control over what information is shared.',
        position: 'center' as const,
        spotlight: false,
      },
    ] as TutorialStep[],
  },
  goalSettingTutorial: {
    id: 'goal-setting-tutorial',
    steps: [
      {
        id: 'goals-overview',
        title: 'Achieve Your Goals',
        content: 'Set and track your personal goals with guidance from your AI council.',
        position: 'center' as const,
        spotlight: false,
      },
      {
        id: 'goal-categories',
        title: 'Goal Categories',
        content:
          'Organize your goals by categories like health, career, finance, and personal development.',
        target: '[data-testid="goal-categories"]',
        position: 'bottom' as const,
        spotlight: true,
      },
      {
        id: 'progress-tracking',
        title: 'Track Your Progress',
        content:
          'Monitor your progress with visual indicators and celebrate milestones along the way.',
        target: '[data-testid="progress-tracking"]',
        position: 'left' as const,
        spotlight: true,
      },
      {
        id: 'milestone-achievements',
        title: 'Milestone Achievements',
        content:
          'Your council will help you break down large goals into achievable milestones and celebrate your successes.',
        position: 'center' as const,
        spotlight: false,
      },
    ] as TutorialStep[],
  },
};

export default TutorialOverlay;
