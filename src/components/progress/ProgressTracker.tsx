import React, { useState, useEffect } from 'react';
import { useOnboarding, Achievement } from '../../contexts/OnboardingContext';

// Inline SVG components
const TrophyIcon = ({ size, className }: { size?: number; className?: string }) => (
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
      d="M5 10V7a2 2 0 012-2h10a2 2 0 012 2v3m-6 5v8m-6-3h12M8 14l4-4 4 4"
    />
  </svg>
);

const StarIcon = ({ size, className }: { size?: number; className?: string }) => (
  <svg width={size} height={size} className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
  </svg>
);

const TargetIcon = ({ size, className }: { size?: number; className?: string }) => (
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
      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);

const ZapIcon = ({ size, className }: { size?: number; className?: string }) => (
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
      d="M13 10V3L4 14h7v7l9-11h-7z"
    />
  </svg>
);

const RocketIcon = ({ size, className }: { size?: number; className?: string }) => (
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
      d="M13 10V3L4 14h7v7l9-11h-7z"
    />
  </svg>
);

const AwardIcon = ({ size, className }: { size?: number; className?: string }) => (
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
      d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
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

const ProgressTracker: React.FC = () => {
  const { userProgress, unlockAchievement } = useOnboarding();
  const [showCelebration, setShowCelebration] = useState(false);
  const [newAchievement, setNewAchievement] = useState<Achievement | null>(null);

  useEffect(() => {
    // Check for new achievements and show celebration
    if (userProgress?.achievements) {
      const latestAchievement = userProgress.achievements[userProgress.achievements.length - 1];
      if (latestAchievement && Date.now() - latestAchievement.unlockedAt < 5000) {
        setNewAchievement(latestAchievement);
        setShowCelebration(true);
        setTimeout(() => setShowCelebration(false), 5000);
      }
    }
  }, [userProgress?.achievements]);

  const getProgressStats = () => {
    if (!userProgress) return { total: 0, unlocked: 0, percentage: 0 };

    const totalAchievements = getAllAchievements().length;
    const unlockedAchievements = userProgress.achievements.length;
    const percentage = totalAchievements > 0 ? (unlockedAchievements / totalAchievements) * 100 : 0;

    return {
      total: totalAchievements,
      unlocked: unlockedAchievements,
      percentage,
    };
  };

  const getAllAchievements = () => [
    // Onboarding Achievements
    {
      id: 'first-login',
      title: 'First Steps',
      description: 'Logged into your AI Council for the first time',
      icon: '👋',
      category: 'onboarding' as const,
    },
    {
      id: 'profile-complete',
      title: 'Identity Established',
      description: 'Completed your profile setup',
      icon: '👤',
      category: 'onboarding' as const,
    },
    {
      id: 'onboarding-complete',
      title: 'AI Council Initiated',
      description: 'Successfully completed the onboarding process',
      icon: '🎉',
      category: 'onboarding' as const,
    },
    {
      id: 'onboarding-master',
      title: 'Quick Learner',
      description: 'Completed all onboarding steps without skipping',
      icon: '⚡',
      category: 'onboarding' as const,
    },

    // Integration Achievements
    {
      id: 'data-connected',
      title: 'Data Stream Initiated',
      description: 'Connected your first data source',
      icon: '📊',
      category: 'integration' as const,
    },
    {
      id: 'notion-master',
      title: 'Notion Integration Expert',
      description: 'Successfully connected and configured Notion',
      icon: '📝',
      category: 'integration' as const,
    },
    {
      id: 'telegram-explorer',
      title: 'Mobile Commander',
      description: 'Set up Telegram bot for on-the-go access',
      icon: '💬',
      category: 'integration' as const,
    },
    {
      id: 'integration-collector',
      title: 'Data Hub Manager',
      description: 'Connected 3 or more integrations',
      icon: '🔌',
      category: 'integration' as const,
    },

    // Engagement Achievements
    {
      id: 'first-insight',
      title: 'Enlightened',
      description: 'Received your first AI insight',
      icon: '💡',
      category: 'engagement' as const,
    },
    {
      id: 'insight-explorer',
      title: 'Curious Mind',
      description: 'Reviewed 10 insights from your council',
      icon: '🔍',
      category: 'engagement' as const,
    },
    {
      id: 'action-taker',
      title: 'Proactive Achiever',
      description: 'Acted upon 5 council recommendations',
      icon: '🎯',
      category: 'engagement' as const,
    },
    {
      id: 'feedback-provider',
      title: 'Collaborative Partner',
      description: 'Provided feedback on 20 insights',
      icon: '🤝',
      category: 'engagement' as const,
    },

    // Mastery Achievements
    {
      id: 'goal-setter',
      title: 'Aspiring Achiever',
      description: 'Set your first goal',
      icon: '🎯',
      category: 'mastery' as const,
    },
    {
      id: 'goal-achiever',
      title: 'Goal Crusher',
      description: 'Completed your first goal',
      icon: '🏆',
      category: 'mastery' as const,
    },
    {
      id: 'streak-warrior',
      title: 'Consistency Champion',
      description: 'Maintained a 7-day activity streak',
      icon: '🔥',
      category: 'mastery' as const,
    },
    {
      id: 'council-master',
      title: 'Life Optimization Expert',
      description: 'Unlocked all achievements and mastered your council',
      icon: '👑',
      category: 'mastery' as const,
    },
  ];

  const getAchievementsByCategory = () => {
    const allAchievements = getAllAchievements();
    const categories = ['onboarding', 'integration', 'engagement', 'mastery'] as const;

    return categories.map((category) => ({
      category,
      achievements: allAchievements.filter((a) => a.category === category),
      unlocked: userProgress?.achievements.filter((a) => a.category === category) || [],
    }));
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'onboarding':
        return <RocketIcon size={20} className="text-blue-400" />;
      case 'integration':
        return <ZapIcon size={20} className="text-purple-400" />;
      case 'engagement':
        return <StarIcon size={20} className="text-yellow-400" />;
      case 'mastery':
        return <TrophyIcon size={20} className="text-green-400" />;
      default:
        return <AwardIcon size={20} className="text-gray-400" />;
    }
  };

  const getCategoryProgress = (category: string) => {
    const categoryData = getAchievementsByCategory().find((c) => c.category === category);
    if (!categoryData) return 0;
    return (categoryData.unlocked.length / categoryData.achievements.length) * 100;
  };

  const stats = getProgressStats();

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      {/* Achievement Celebration Modal */}
      {showCelebration && newAchievement && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 pointer-events-none">
          <div className="bg-gray-900 rounded-lg p-8 max-w-md text-center animate-bounce">
            <div className="text-6xl mb-4">{newAchievement.icon}</div>
            <h2 className="text-2xl font-bold text-white mb-2">Achievement Unlocked!</h2>
            <h3 className="text-xl text-blue-400 mb-2">{newAchievement.title}</h3>
            <p className="text-gray-300">{newAchievement.description}</p>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Achievements & Progress</h1>
          <p className="text-gray-400">Track your journey and celebrate your accomplishments</p>
        </div>

        {/* Overall Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-800 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <TrophyIcon size={32} className="text-yellow-400" />
              <span className="text-2xl font-bold text-white">
                {stats.unlocked}/{stats.total}
              </span>
            </div>
            <h3 className="text-lg font-semibold text-white mb-1">Total Achievements</h3>
            <p className="text-sm text-gray-400">Unlocked achievements</p>
          </div>

          <div className="bg-gray-800 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <TargetIcon size={32} className="text-green-400" />
              <span className="text-2xl font-bold text-white">{Math.round(stats.percentage)}%</span>
            </div>
            <h3 className="text-lg font-semibold text-white mb-1">Completion Rate</h3>
            <p className="text-sm text-gray-400">Overall progress</p>
          </div>

          <div className="bg-gray-800 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <ZapIcon size={32} className="text-purple-400" />
              <span className="text-2xl font-bold text-white">
                {userProgress?.completedSteps.length || 0}
              </span>
            </div>
            <h3 className="text-lg font-semibold text-white mb-1">Steps Completed</h3>
            <p className="text-sm text-gray-400">Onboarding progress</p>
          </div>

          <div className="bg-gray-800 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <LightbulbIcon size={32} className="text-blue-400" />
              <span className="text-2xl font-bold text-white">
                {userProgress?.showTips ? 'On' : 'Off'}
              </span>
            </div>
            <h3 className="text-lg font-semibold text-white mb-1">Tips Enabled</h3>
            <p className="text-sm text-gray-400">Help system status</p>
          </div>
        </div>

        {/* Progress Overview */}
        <div className="bg-gray-800 rounded-lg p-6 mb-8">
          <h2 className="text-2xl font-semibold mb-4">Progress Overview</h2>
          <div className="space-y-4">
            {getAchievementsByCategory().map(({ category, achievements, unlocked }) => (
              <div key={category} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {getCategoryIcon(category)}
                    <div>
                      <h3 className="font-medium text-white capitalize">{category}</h3>
                      <p className="text-sm text-gray-400">
                        {unlocked.length} of {achievements.length} unlocked
                      </p>
                    </div>
                  </div>
                  <span className="text-sm text-gray-400">
                    {Math.round(getCategoryProgress(category))}%
                  </span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${getCategoryProgress(category)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Achievement Grid */}
        <div className="space-y-8">
          {getAchievementsByCategory().map(({ category, achievements, unlocked }) => (
            <div key={category}>
              <div className="flex items-center space-x-3 mb-4">
                {getCategoryIcon(category)}
                <h2 className="text-2xl font-semibold capitalize">{category}</h2>
                <span className="text-sm text-gray-400">
                  ({unlocked.length}/{achievements.length})
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {achievements.map((achievement) => {
                  const isUnlocked = unlocked.some((u) => u.id === achievement.id);
                  const unlockedData = unlocked.find((u) => u.id === achievement.id);

                  return (
                    <div
                      key={achievement.id}
                      className={`relative rounded-lg p-4 border-2 transition-all ${
                        isUnlocked
                          ? 'bg-gray-800 border-green-600 hover:border-green-500'
                          : 'bg-gray-900 border-gray-700 opacity-75'
                      }`}
                    >
                      <div className="text-center">
                        <div className={`text-4xl mb-3 ${isUnlocked ? '' : 'grayscale'}`}>
                          {achievement.icon}
                        </div>
                        <h3
                          className={`font-semibold mb-2 ${isUnlocked ? 'text-white' : 'text-gray-500'}`}
                        >
                          {achievement.title}
                        </h3>
                        <p className={`text-sm ${isUnlocked ? 'text-gray-300' : 'text-gray-600'}`}>
                          {achievement.description}
                        </p>

                        {isUnlocked && unlockedData && (
                          <div className="mt-3 pt-3 border-t border-gray-700">
                            <p className="text-xs text-green-400">
                              Unlocked {new Date(unlockedData.unlockedAt).toLocaleDateString()}
                            </p>
                          </div>
                        )}

                        {!isUnlocked && (
                          <div className="mt-3">
                            <div className="w-full bg-gray-700 rounded-full h-1">
                              <div
                                className="bg-gray-600 h-1 rounded-full"
                                style={{ width: '0%' }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Tips Section */}
        <div className="mt-12 bg-gray-800 rounded-lg p-6">
          <h2 className="text-2xl font-semibold mb-4">Tips for Unlocking More Achievements</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold mt-0.5">
                  1
                </div>
                <div>
                  <h4 className="font-medium text-white">Connect Your Data</h4>
                  <p className="text-sm text-gray-400">
                    Integrate Notion, Telegram, and other services to unlock integration
                    achievements
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold mt-0.5">
                  2
                </div>
                <div>
                  <h4 className="font-medium text-white">Engage with Insights</h4>
                  <p className="text-sm text-gray-400">
                    Review, act upon, and provide feedback on council recommendations
                  </p>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold mt-0.5">
                  3
                </div>
                <div>
                  <h4 className="font-medium text-white">Set and Achieve Goals</h4>
                  <p className="text-sm text-gray-400">
                    Create meaningful goals and work towards them consistently
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold mt-0.5">
                  4
                </div>
                <div>
                  <h4 className="font-medium text-white">Stay Consistent</h4>
                  <p className="text-sm text-gray-400">
                    Use your council regularly to build streaks and mastery achievements
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProgressTracker;
