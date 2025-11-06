import React, { useState, useEffect } from 'react';
import { useOnboarding } from '../../contexts/OnboardingContext';
// Using inline SVG components instead of lucide-react to avoid dependency issues
const X = ({ size, className }: { size?: number; className?: string }) => (
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

const ArrowRight = ({ size, className }: { size?: number; className?: string }) => (
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

const ArrowLeft = ({ size, className }: { size?: number; className?: string }) => (
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

const SkipForward = ({ size, className }: { size?: number; className?: string }) => (
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
      d="M11.933 12.8a1 1 0 000-1.6L6.6 7.2A1 1 0 005 8v8a1 1 0 001.6.8l5.333-4zM19.933 12.8a1 1 0 000-1.6l-5.333-4A1 1 0 0013 8v8a1 1 0 001.6.8l5.333-4z"
    />
  </svg>
);

const Sparkles = ({ size, className }: { size?: number; className?: string }) => (
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
      d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
    />
  </svg>
);

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const OnboardingModal: React.FC<OnboardingModalProps> = ({ isOpen, onClose }) => {
  const {
    steps,
    currentStepIndex,
    completeCurrentStep,
    skipCurrentStep,
    goToStep,
    updateProfile,
    userProfile,
    isOnboarding,
  } = useOnboarding();

  const [animationClass, setAnimationClass] = useState('');
  const currentStep = steps[currentStepIndex];

  useEffect(() => {
    if (isOpen) {
      setAnimationClass('animate-in');
    }
  }, [isOpen]);

  const handleNext = () => {
    if (currentStep.validation && !currentStep.validation()) {
      return;
    }

    setAnimationClass('animate-out');
    setTimeout(() => {
      completeCurrentStep();
      setAnimationClass('animate-in');
    }, 300);
  };

  const handleSkip = () => {
    if (currentStep.skippable) {
      skipCurrentStep();
    }
  };

  const canProceed = !currentStep.validation || currentStep.validation();

  if (!isOpen || !currentStep) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75">
      <div
        className={`relative max-w-2xl w-full mx-4 bg-gray-900 rounded-2xl shadow-2xl border border-gray-700 ${animationClass}`}
      >
        {/* Progress Bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gray-800 rounded-t-2xl">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-purple-600 transition-all duration-500"
            style={{ width: `${((currentStepIndex + 1) / steps.length) * 100}%` }}
          />
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors z-10"
        >
          <X size={24} />
        </button>

        {/* Step Indicator */}
        <div className="flex justify-center pt-6 pb-4">
          <div className="flex space-x-2">
            {steps.map((step, index) => (
              <button
                key={step.id}
                onClick={() => goToStep(index)}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === currentStepIndex
                    ? 'bg-blue-500 w-8'
                    : index < currentStepIndex
                      ? 'bg-green-500'
                      : 'bg-gray-600 hover:bg-gray-500'
                }`}
                title={step.title}
              />
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="px-8 py-6">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mb-4">
              <Sparkles className="text-white" size={32} />
            </div>
            <h2 className="text-3xl font-bold text-white mb-3">{currentStep.title}</h2>
            <p className="text-gray-300 text-lg">{currentStep.description}</p>
          </div>

          {/* Step-specific content */}
          <div className="mb-8">
            {currentStep.id === 'welcome' && <WelcomeStep />}
            {currentStep.id === 'profile-setup' && (
              <ProfileSetupStep profile={userProfile} onUpdate={updateProfile} />
            )}
            {currentStep.id === 'council-introduction' && <CouncilIntroductionStep />}
            {currentStep.id === 'data-connection' && <DataConnectionStep />}
            {currentStep.id === 'goal-setting' && (
              <GoalSettingStep profile={userProfile} onUpdate={updateProfile} />
            )}
            {currentStep.id === 'first-insights' && <FirstInsightsStep />}
            {currentStep.id === 'completion' && <CompletionStep />}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <div className="flex space-x-3">
              {currentStepIndex > 0 && (
                <button
                  onClick={() => goToStep(currentStepIndex - 1)}
                  className="flex items-center space-x-2 px-4 py-2 text-gray-400 hover:text-white transition-colors"
                >
                  <ArrowLeft size={20} />
                  <span>Previous</span>
                </button>
              )}
            </div>

            <div className="flex items-center space-x-3">
              {currentStep.skippable && (
                <button
                  onClick={handleSkip}
                  className="flex items-center space-x-2 px-4 py-2 text-gray-400 hover:text-yellow-400 transition-colors"
                >
                  <SkipForward size={20} />
                  <span>Skip</span>
                </button>
              )}

              <button
                onClick={handleNext}
                disabled={!canProceed}
                className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-all ${
                  canProceed
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700'
                    : 'bg-gray-700 text-gray-400 cursor-not-allowed'
                }`}
              >
                <span>{currentStepIndex === steps.length - 1 ? 'Get Started' : 'Continue'}</span>
                <ArrowRight size={20} />
              </button>
            </div>
          </div>
        </div>

        {/* Step Counter */}
        <div className="px-8 pb-6 text-center">
          <span className="text-sm text-gray-500">
            Step {currentStepIndex + 1} of {steps.length}
          </span>
        </div>
      </div>

      <style>{`
        .animate-in {
          animation: slideIn 0.3s ease-out;
        }
        
        .animate-out {
          animation: slideOut 0.3s ease-in;
        }
        
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes slideOut {
          from {
            opacity: 1;
            transform: translateY(0);
          }
          to {
            opacity: 0;
            transform: translateY(-20px);
          }
        }
      `}</style>
    </div>
  );
};

// Step Components
const WelcomeStep: React.FC = () => (
  <div className="text-center space-y-6">
    <div className="grid grid-cols-2 gap-4 text-left">
      <div className="bg-gray-800 rounded-lg p-4">
        <div className="text-2xl mb-2">🤖</div>
        <h3 className="font-semibold text-white mb-2">8 AI Council Members</h3>
        <p className="text-sm text-gray-400">
          Specialized experts in life, finance, health, career, and more
        </p>
      </div>
      <div className="bg-gray-800 rounded-lg p-4">
        <div className="text-2xl mb-2">📊</div>
        <h3 className="font-semibold text-white mb-2">Smart Data Integration</h3>
        <p className="text-sm text-gray-400">
          Connect your favorite apps for personalized insights
        </p>
      </div>
      <div className="bg-gray-800 rounded-lg p-4">
        <div className="text-2xl mb-2">🎯</div>
        <h3 className="font-semibold text-white mb-2">Goal Achievement</h3>
        <p className="text-sm text-gray-400">
          AI-powered recommendations to reach your goals faster
        </p>
      </div>
      <div className="bg-gray-800 rounded-lg p-4">
        <div className="text-2xl mb-2">🔒</div>
        <h3 className="font-semibold text-white mb-2">Privacy First</h3>
        <p className="text-sm text-gray-400">
          Your data is encrypted and always under your control
        </p>
      </div>
    </div>
  </div>
);

interface ProfileSetupStepProps {
  profile: any;
  onUpdate: (updates: any) => void;
}

const ProfileSetupStep: React.FC<ProfileSetupStepProps> = ({ profile, onUpdate }) => {
  const [formData, setFormData] = useState({
    name: profile?.name || '',
    email: profile?.email || '',
    experienceLevel: profile?.experienceLevel || 'beginner',
    interests: profile?.interests || [],
    preferences: {
      notifications: profile?.preferences?.notifications ?? true,
      dataSharing: profile?.preferences?.dataSharing ?? false,
      weeklyReports: profile?.preferences?.weeklyReports ?? true,
    },
  });

  const interestOptions = [
    'Health & Fitness',
    'Career Development',
    'Financial Growth',
    'Relationships',
    'Personal Growth',
    'Productivity',
    'Learning & Education',
    'Work-Life Balance',
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdate(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Your Name</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter your name"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Email Address</label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="your@email.com"
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Experience Level</label>
        <select
          value={formData.experienceLevel}
          onChange={(e) => setFormData({ ...formData, experienceLevel: e.target.value as any })}
          className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="beginner">Beginner - New to AI assistants</option>
          <option value="intermediate">Intermediate - Some experience</option>
          <option value="advanced">Advanced - Power user</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Areas of Interest</label>
        <div className="grid grid-cols-2 gap-3">
          {interestOptions.map((interest) => (
            <label key={interest} className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.interests.includes(interest)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setFormData({
                      ...formData,
                      interests: [...formData.interests, interest],
                    });
                  } else {
                    setFormData({
                      ...formData,
                      interests: formData.interests.filter((i: string) => i !== interest),
                    });
                  }
                }}
                className="w-4 h-4 text-blue-600 bg-gray-800 border-gray-600 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-300">{interest}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Preferences</label>
        <div className="space-y-2">
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.preferences.notifications}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  preferences: {
                    ...formData.preferences,
                    notifications: e.target.checked,
                  },
                })
              }
              className="w-4 h-4 text-blue-600 bg-gray-800 border-gray-600 rounded focus:ring-blue-500"
            />
            <span className="text-sm text-gray-300">Enable notifications</span>
          </label>
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.preferences.weeklyReports}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  preferences: {
                    ...formData.preferences,
                    weeklyReports: e.target.checked,
                  },
                })
              }
              className="w-4 h-4 text-blue-600 bg-gray-800 border-gray-600 rounded focus:ring-blue-500"
            />
            <span className="text-sm text-gray-300">Weekly progress reports</span>
          </label>
        </div>
      </div>
    </form>
  );
};

const CouncilIntroductionStep: React.FC = () => {
  const councilMembers = [
    {
      name: 'Aria',
      role: 'Life Coach',
      color: 'bg-green-500',
      description: 'Personal development and goal achievement',
    },
    {
      name: 'Marcus',
      role: 'Financial Analyst',
      color: 'bg-blue-500',
      description: 'Budgeting, investing, and financial planning',
    },
    {
      name: 'Dr. Lena',
      role: 'Health & Wellness Advisor',
      color: 'bg-pink-500',
      description: 'Nutrition, fitness, and mental health',
    },
    {
      name: 'David',
      role: 'Career Strategist',
      color: 'bg-purple-500',
      description: 'Professional growth and career planning',
    },
    {
      name: 'Sophia',
      role: 'Relationship Counselor',
      color: 'bg-yellow-500',
      description: 'Personal and professional relationships',
    },
    {
      name: 'Professor Alex',
      role: 'Knowledge Curator',
      color: 'bg-indigo-500',
      description: 'Learning and skill development',
    },
    {
      name: 'Emma',
      role: 'Productivity Manager',
      color: 'bg-red-500',
      description: 'Time management and efficiency',
    },
    {
      name: 'Tech Lead Sam',
      role: 'Integration Coordinator',
      color: 'bg-teal-500',
      description: 'System optimization and automation',
    },
  ];

  return (
    <div className="space-y-4">
      <p className="text-center text-gray-300 mb-6">
        Your council members work together to provide comprehensive guidance across all areas of
        your life.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {councilMembers.map((member, index) => (
          <div key={index} className="bg-gray-800 rounded-lg p-4 flex items-center space-x-4">
            <div
              className={`w-12 h-12 ${member.color} rounded-full flex items-center justify-center text-white font-bold`}
            >
              {member.name[0]}
            </div>
            <div>
              <h4 className="font-semibold text-white">{member.name}</h4>
              <p className="text-sm text-gray-400">{member.role}</p>
              <p className="text-xs text-gray-500 mt-1">{member.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const DataConnectionStep: React.FC = () => {
  const integrations = [
    { name: 'Notion', icon: '📝', description: 'Connect your notes and tasks' },
    { name: 'Telegram', icon: '💬', description: 'Chat with your council on the go' },
    { name: 'Google Calendar', icon: '📅', description: 'Sync your schedule and events' },
    { name: 'Fitness Trackers', icon: '⌚', description: 'Import health and activity data' },
  ];

  return (
    <div className="space-y-4">
      <p className="text-center text-gray-300 mb-6">
        Choose which integrations you want to set up now. You can always add more later.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {integrations.map((integration, index) => (
          <div
            key={index}
            className="bg-gray-800 rounded-lg p-4 border-2 border-dashed border-gray-700 hover:border-blue-500 transition-colors cursor-pointer"
          >
            <div className="flex items-center space-x-3">
              <div className="text-2xl">{integration.icon}</div>
              <div className="flex-1">
                <h4 className="font-semibold text-white">{integration.name}</h4>
                <p className="text-sm text-gray-400">{integration.description}</p>
              </div>
              <button className="px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors">
                Connect
              </button>
            </div>
          </div>
        ))}
      </div>
      <p className="text-center text-sm text-gray-500">
        Don't worry - you can configure these integrations later in the Data tab.
      </p>
    </div>
  );
};

interface GoalSettingStepProps {
  profile: any;
  onUpdate: (updates: any) => void;
}

const GoalSettingStep: React.FC<GoalSettingStepProps> = ({ profile, onUpdate }) => {
  const [goals, setGoals] = useState<string[]>(profile?.goals || []);
  const [newGoal, setNewGoal] = useState('');

  const addGoal = () => {
    if (newGoal.trim()) {
      setGoals([...goals, newGoal.trim()]);
      setNewGoal('');
      onUpdate({ goals: [...goals, newGoal.trim()] });
    }
  };

  const removeGoal = (index: number) => {
    const updatedGoals = goals.filter((_, i) => i !== index);
    setGoals(updatedGoals);
    onUpdate({ goals: updatedGoals });
  };

  const suggestedGoals = [
    'Improve physical fitness',
    'Advance in my career',
    'Build better financial habits',
    'Learn a new skill',
    'Strengthen relationships',
    'Increase productivity',
  ];

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          What are your top goals right now?
        </label>
        <div className="flex space-x-2">
          <input
            type="text"
            value={newGoal}
            onChange={(e) => setNewGoal(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addGoal()}
            className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter a goal..."
          />
          <button
            onClick={addGoal}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Add
          </button>
        </div>
      </div>

      {goals.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-300 mb-2">Your Goals:</h4>
          <div className="space-y-2">
            {goals.map((goal, index) => (
              <div
                key={index}
                className="flex items-center justify-between bg-gray-800 rounded-lg p-3"
              >
                <span className="text-white">{goal}</span>
                <button
                  onClick={() => removeGoal(index)}
                  className="text-red-400 hover:text-red-300 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <h4 className="text-sm font-medium text-gray-300 mb-2">Suggested Goals:</h4>
        <div className="grid grid-cols-2 gap-2">
          {suggestedGoals.map((goal, index) => (
            <button
              key={index}
              onClick={() => {
                if (!goals.includes(goal)) {
                  const updatedGoals = [...goals, goal];
                  setGoals(updatedGoals);
                  onUpdate({ goals: updatedGoals });
                }
              }}
              className={`text-left px-3 py-2 rounded-lg border transition-colors ${
                goals.includes(goal)
                  ? 'bg-blue-900 border-blue-600 text-blue-300'
                  : 'bg-gray-800 border-gray-700 text-gray-300 hover:border-gray-600'
              }`}
            >
              {goal}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

const FirstInsightsStep: React.FC = () => (
  <div className="text-center space-y-6">
    <div className="bg-gradient-to-r from-blue-900 to-purple-900 rounded-lg p-6 border border-blue-700">
      <div className="text-4xl mb-4">✨</div>
      <h3 className="text-xl font-semibold text-white mb-2">Your Council is Ready!</h3>
      <p className="text-gray-300 mb-4">
        Based on your profile and goals, your council members are already preparing personalized
        insights for you.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
        <div className="bg-gray-800 rounded-lg p-3">
          <h4 className="font-semibold text-white mb-1">🎯 Goal Alignment</h4>
          <p className="text-sm text-gray-400">
            Your goals have been analyzed and actionable steps are being prepared
          </p>
        </div>
        <div className="bg-gray-800 rounded-lg p-3">
          <h4 className="font-semibold text-white mb-1">📊 Data Processing</h4>
          <p className="text-sm text-gray-400">
            Your council is ready to analyze your connected data sources
          </p>
        </div>
        <div className="bg-gray-800 rounded-lg p-3">
          <h4 className="font-semibold text-white mb-1">🤝 Personalization</h4>
          <p className="text-sm text-gray-400">
            Insights will be tailored to your experience level and interests
          </p>
        </div>
      </div>
    </div>
    <p className="text-gray-400">
      Head over to the Insights tab to see your first recommendations once you connect some data!
    </p>
  </div>
);

const CompletionStep: React.FC = () => (
  <div className="text-center space-y-6">
    <div className="text-6xl mb-4">🎉</div>
    <h3 className="text-2xl font-bold text-white mb-2">Congratulations!</h3>
    <p className="text-gray-300 mb-6">
      You've successfully set up your AI Council LifeOS. Here's what to do next:
    </p>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
      <div className="bg-gray-800 rounded-lg p-4">
        <div className="flex items-center space-x-3 mb-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">
            1
          </div>
          <h4 className="font-semibold text-white">Connect Your Data</h4>
        </div>
        <p className="text-sm text-gray-400">
          Go to the Data tab to connect Notion, Telegram, and other services
        </p>
      </div>

      <div className="bg-gray-800 rounded-lg p-4">
        <div className="flex items-center space-x-3 mb-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">
            2
          </div>
          <h4 className="font-semibold text-white">Review Your Insights</h4>
        </div>
        <p className="text-sm text-gray-400">
          Check the Insights tab for personalized recommendations
        </p>
      </div>

      <div className="bg-gray-800 rounded-lg p-4">
        <div className="flex items-center space-x-3 mb-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">
            3
          </div>
          <h4 className="font-semibold text-white">Track Your Progress</h4>
        </div>
        <p className="text-sm text-gray-400">
          Monitor your goals and achievements in the Goals tab
        </p>
      </div>

      <div className="bg-gray-800 rounded-lg p-4">
        <div className="flex items-center space-x-3 mb-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">
            4
          </div>
          <h4 className="font-semibold text-white">Engage with Your Council</h4>
        </div>
        <p className="text-sm text-gray-400">
          Provide feedback to improve recommendations over time
        </p>
      </div>
    </div>

    <div className="bg-green-900 bg-opacity-50 rounded-lg p-4 border border-green-700">
      <p className="text-green-300">
        <strong>Pro Tip:</strong> Check back regularly - your council learns and improves with every
        interaction!
      </p>
    </div>
  </div>
);

export default OnboardingModal;
