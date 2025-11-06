import React, { useState, useRef, useEffect } from 'react';

// Inline SVG components
const InfoIcon = ({ size, className }: { size?: number; className?: string }) => (
  <svg
    width={size}
    height={size}
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);

const HelpIcon = ({ size, className }: { size?: number; className?: string }) => (
  <svg
    width={size}
    height={size}
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);

const LightbulbIcon = ({ size, className }: { size?: number; className?: string }) => (
  <svg
    width={size}
    height={size}
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
    />
  </svg>
);

interface TooltipContent {
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  videoUrl?: string;
  relatedHelp?: string;
}

interface TooltipProps {
  content: TooltipContent;
  position?: 'top' | 'bottom' | 'left' | 'right';
  trigger?: 'hover' | 'click';
  icon?: 'info' | 'help' | 'lightbulb';
  size?: 'small' | 'medium' | 'large';
  className?: string;
  children?: React.ReactNode;
}

const Tooltip: React.FC<TooltipProps> = ({
  content,
  position = 'top',
  trigger = 'hover',
  icon = 'info',
  size = 'medium',
  className = '',
  children,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const getIcon = () => {
    switch (icon) {
      case 'help':
        return <HelpIcon size={16} className="text-blue-400" />;
      case 'lightbulb':
        return <LightbulbIcon size={16} className="text-yellow-400" />;
      default:
        return <InfoIcon size={16} className="text-gray-400" />;
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'small':
        return 'max-w-xs';
      case 'large':
        return 'max-w-md';
      default:
        return 'max-w-sm';
    }
  };

  useEffect(() => {
    if (isVisible && triggerRef.current && tooltipRef.current) {
      const triggerRect = triggerRef.current.getBoundingClientRect();
      const tooltipRect = tooltipRef.current.getBoundingClientRect();
      const padding = 8;

      let top = 0;
      let left = 0;

      switch (position) {
        case 'top':
          top = triggerRect.top - tooltipRect.height - padding;
          left = triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2;
          break;
        case 'bottom':
          top = triggerRect.bottom + padding;
          left = triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2;
          break;
        case 'left':
          top = triggerRect.top + triggerRect.height / 2 - tooltipRect.height / 2;
          left = triggerRect.left - tooltipRect.width - padding;
          break;
        case 'right':
          top = triggerRect.top + triggerRect.height / 2 - tooltipRect.height / 2;
          left = triggerRect.right + padding;
          break;
      }

      // Ensure tooltip stays within viewport
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      if (left < padding) left = padding;
      if (left + tooltipRect.width > viewportWidth - padding) {
        left = viewportWidth - tooltipRect.width - padding;
      }
      if (top < padding) top = padding;
      if (top + tooltipRect.height > viewportHeight - padding) {
        top = viewportHeight - tooltipRect.height - padding;
      }

      setTooltipPosition({ top, left });
    }
  }, [isVisible, position]);

  const handleMouseEnter = () => {
    if (trigger === 'hover') {
      setIsVisible(true);
    }
  };

  const handleMouseLeave = () => {
    if (trigger === 'hover') {
      setIsVisible(false);
    }
  };

  const handleClick = () => {
    if (trigger === 'click') {
      setIsVisible(!isVisible);
    }
  };

  const handleClickOutside = (event: MouseEvent) => {
    if (
      trigger === 'click' &&
      tooltipRef.current &&
      !tooltipRef.current.contains(event.target as Node) &&
      triggerRef.current &&
      !triggerRef.current.contains(event.target as Node)
    ) {
      setIsVisible(false);
    }
  };

  useEffect(() => {
    if (trigger === 'click') {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [trigger]);

  return (
    <>
      <div
        ref={triggerRef}
        className={`inline-flex items-center justify-center cursor-pointer ${className}`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
      >
        {children || getIcon()}
      </div>

      {isVisible && (
        <div
          ref={tooltipRef}
          className={`fixed z-50 bg-gray-900 border border-gray-700 rounded-lg shadow-2xl p-4 ${getSizeClasses()} animate-fade-in`}
          style={{
            top: tooltipPosition.top,
            left: tooltipPosition.left,
          }}
        >
          {/* Arrow */}
          <div
            className={`absolute w-3 h-3 bg-gray-900 border border-gray-700 transform rotate-45 ${
              position === 'top'
                ? 'bottom-[-6px] left-1/2 -translate-x-1/2 border-t-0 border-l-0'
                : position === 'bottom'
                  ? 'top-[-6px] left-1/2 -translate-x-1/2 border-b-0 border-r-0'
                  : position === 'left'
                    ? 'right-[-6px] top-1/2 -translate-y-1/2 border-r-0 border-t-0'
                    : 'left-[-6px] top-1/2 -translate-y-1/2 border-l-0 border-b-0'
            }`}
          />

          <div className="relative z-10">
            <h4 className="font-semibold text-white mb-2">{content.title}</h4>
            <p className="text-sm text-gray-300 mb-3">{content.description}</p>

            {content.videoUrl && (
              <div className="mb-3">
                <a
                  href={content.videoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-1 text-sm text-blue-400 hover:text-blue-300 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span>Watch Tutorial</span>
                </a>
              </div>
            )}

            {content.action && (
              <button
                onClick={content.action.onClick}
                className="w-full px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
              >
                {content.action.label}
              </button>
            )}

            {content.relatedHelp && (
              <div className="mt-3 pt-3 border-t border-gray-700">
                <a
                  href={`/help?topic=${content.relatedHelp}`}
                  className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                >
                  Learn more →
                </a>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

// Contextual Help Provider
interface ContextualHelpProviderProps {
  children: React.ReactNode;
}

interface HelpContext {
  registerTooltip: (id: string, content: TooltipContent) => void;
  unregisterTooltip: (id: string) => void;
  showTooltip: (id: string) => void;
  hideTooltip: (id: string) => void;
}

const ContextualHelpContext = React.createContext<HelpContext | undefined>(undefined);

export const ContextualHelpProvider: React.FC<ContextualHelpProviderProps> = ({ children }) => {
  const [tooltips, setTooltips] = useState<Map<string, TooltipContent>>(new Map());
  const [activeTooltips, setActiveTooltips] = useState<Set<string>>(new Set());

  const registerTooltip = (id: string, content: TooltipContent) => {
    setTooltips((prev) => new Map(prev.set(id, content)));
  };

  const unregisterTooltip = (id: string) => {
    setTooltips((prev) => {
      const newMap = new Map(prev);
      newMap.delete(id);
      return newMap;
    });
    setActiveTooltips((prev) => {
      const newSet = new Set(prev);
      newSet.delete(id);
      return newSet;
    });
  };

  const showTooltip = (id: string) => {
    if (tooltips.has(id)) {
      setActiveTooltips((prev) => new Set(prev).add(id));
    }
  };

  const hideTooltip = (id: string) => {
    setActiveTooltips((prev) => {
      const newSet = new Set(prev);
      newSet.delete(id);
      return newSet;
    });
  };

  return (
    <ContextualHelpContext.Provider
      value={{
        registerTooltip,
        unregisterTooltip,
        showTooltip,
        hideTooltip,
      }}
    >
      {children}
    </ContextualHelpContext.Provider>
  );
};

export const useContextualHelp = () => {
  const context = React.useContext(ContextualHelpContext);
  if (!context) {
    throw new Error('useContextualHelp must be used within a ContextualHelpProvider');
  }
  return context;
};

// Smart Tooltip Hook
export const useSmartTooltip = (id: string, content: TooltipContent) => {
  const { registerTooltip, unregisterTooltip } = useContextualHelp();

  useEffect(() => {
    registerTooltip(id, content);
    return () => {
      unregisterTooltip(id);
    };
  }, [id, content, registerTooltip, unregisterTooltip]);
};

// Predefined tooltip configurations
export const tooltipConfigs = {
  councilMember: {
    title: 'Council Member',
    description:
      'Your AI council members are specialized experts who provide personalized recommendations based on your data and goals.',
    action: {
      label: 'Meet Your Council',
      onClick: () => console.log('Navigate to council introduction'),
    },
    relatedHelp: 'council-members',
  },
  insights: {
    title: 'AI Insights',
    description:
      'Insights are personalized recommendations from your council members. Higher priority items need your attention sooner.',
    videoUrl: 'https://example.com/insights-tutorial',
    relatedHelp: 'understanding-insights',
  },
  goalProgress: {
    title: 'Goal Progress',
    description:
      'Track your progress towards your goals. Your council helps you break down big goals into achievable steps.',
    action: {
      label: 'Set New Goal',
      onClick: () => console.log('Open goal creation'),
    },
    relatedHelp: 'goal-setting',
  },
  dataSync: {
    title: 'Data Synchronization',
    description:
      'Connect your favorite apps to provide your council with the data they need to give you personalized insights.',
    action: {
      label: 'Manage Integrations',
      onClick: () => console.log('Open integrations'),
    },
    relatedHelp: 'data-connections',
  },
  notifications: {
    title: 'Notifications',
    description:
      'Stay updated with important insights, goal progress, and council recommendations.',
    relatedHelp: 'notification-settings',
  },
  privacy: {
    title: 'Privacy & Security',
    description:
      'Your data is encrypted and processed securely. You have full control over what information is shared with your council.',
    action: {
      label: 'Privacy Settings',
      onClick: () => console.log('Open privacy settings'),
    },
    relatedHelp: 'privacy-security',
  },
};

export default Tooltip;
