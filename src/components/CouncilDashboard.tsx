import { useState, useEffect } from 'react';
import PersonalDataInput from './PersonalDataInput';
import SystemStats from './SystemStats';
import TelegramDashboard from './TelegramDashboard';

interface CouncilMember {
  _id: string;
  playerId: string;
  name: string;
  role: string;
  expertise: string[];
  color: string;
  dataFocus: string[];
  status: 'active' | 'processing' | 'idle';
  lastInsight?: number;
  insightCount: number;
}

interface Insight {
  _id: string;
  councilMemberId: string;
  title: string;
  description: string;
  category: string;
  priority: number;
  confidence: number;
  recommendations: string[];
  status: 'pending' | 'reviewed' | 'acted_upon';
  createdAt: number;
}

interface PersonalData {
  _id: string;
  dataType: string;
  source: string;
  value: any;
  timestamp: number;
  processed: boolean;
}

export default function CouncilDashboard() {
  const [selectedMember, setSelectedMember] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<
    'overview' | 'insights' | 'data' | 'goals' | 'telegram'
  >('overview');

  const [councilMembers, setCouncilMembers] = useState<CouncilMember[]>([]);
  const [recentInsights, setRecentInsights] = useState<Insight[]>([]);
  const [recentData, setRecentData] = useState<PersonalData[]>([]);
  const [goals, setGoals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch data from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const API_BASE = 'http://localhost:3002/api';

        const [membersRes, insightsRes, dataRes, goalsRes] = await Promise.all([
          fetch(`${API_BASE}/council-members`),
          fetch(`${API_BASE}/insights`),
          fetch(`${API_BASE}/personal-data`),
          fetch(`${API_BASE}/goals`),
        ]);

        if (!membersRes.ok || !insightsRes.ok || !dataRes.ok || !goalsRes.ok) {
          throw new Error('Failed to fetch data from API');
        }

        const [members, insights, data, goalsData] = await Promise.all([
          membersRes.json(),
          insightsRes.json(),
          dataRes.json(),
          goalsRes.json(),
        ]);

        setCouncilMembers(members);
        setRecentInsights(insights);
        setRecentData(data);
        setGoals(goalsData);
        setError(null);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(
          'Failed to connect to API server. Please ensure the server is running on port 3002.',
        );

        // Fallback to mock data if API fails
        setCouncilMembers([
          {
            _id: '1',
            playerId: '1',
            name: 'Aria',
            role: 'Life Coach',
            expertise: ['personal development', 'goal setting', 'habit formation'],
            color: '#4CAF50',
            dataFocus: ['goals', 'general'],
            status: 'active' as const,
            lastInsight: Date.now() - 3600000,
            insightCount: 12,
          },
          {
            _id: '2',
            playerId: '2',
            name: 'Marcus',
            role: 'Financial Analyst',
            expertise: ['budgeting', 'investing', 'financial planning'],
            color: '#2196F3',
            dataFocus: ['finance'],
            status: 'processing' as const,
            lastInsight: Date.now() - 7200000,
            insightCount: 8,
          },
          {
            _id: '3',
            playerId: '3',
            name: 'Dr. Lena',
            role: 'Health & Wellness Advisor',
            expertise: ['nutrition', 'exercise', 'sleep', 'mental health'],
            color: '#E91E63',
            dataFocus: ['health'],
            status: 'idle' as const,
            lastInsight: Date.now() - 10800000,
            insightCount: 15,
          },
        ]);
        setRecentInsights([
          {
            _id: '1',
            councilMemberId: '1',
            title: 'Weekly Goal Progress Review',
            description:
              "You've made excellent progress on your fitness goals this week. Consider increasing your daily step count by 10% to challenge yourself.",
            category: 'goals',
            priority: 2,
            confidence: 0.85,
            recommendations: [
              'Increase daily step goal to 8,500',
              'Add evening stretching routine',
              'Schedule weekly progress reviews',
            ],
            status: 'pending' as const,
            createdAt: Date.now() - 3600000,
          },
        ]);
        setRecentData([
          {
            _id: '1',
            dataType: 'health',
            source: 'fitbit',
            value: { steps: 7650, heartRate: 72, sleep: 7.5 },
            timestamp: Date.now() - 1800000,
            processed: true,
          },
        ]);
        setGoals([
          {
            _id: '1',
            title: 'Daily Exercise',
            description: 'Exercise for at least 30 minutes every day',
            category: 'health',
            targetValue: 30,
            currentValue: 25,
            unit: 'minutes',
            deadline: Date.now() + 2592000000,
            status: 'active',
            createdAt: Date.now() - 604800000,
            updatedAt: Date.now() - 86400000,
            milestones: [],
          },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // Set up periodic refresh
    const interval = setInterval(fetchData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  // Add loading and error handling to the UI
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Connecting to AI Council...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-6 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-red-500 mb-4">
            <svg
              className="w-12 h-12 mx-auto"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-semibold mb-2">Connection Error</h2>
          <p className="text-gray-400 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-colors"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500';
      case 'processing':
        return 'bg-yellow-500';
      case 'idle':
        return 'bg-gray-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getPriorityColor = (priority: number) => {
    if (priority >= 3) return 'text-red-600';
    if (priority >= 2) return 'text-yellow-600';
    return 'text-green-600';
  };

  const formatDate = (timestamp: number) => {
    return (
      new Date(timestamp).toLocaleDateString() + ' ' + new Date(timestamp).toLocaleTimeString()
    );
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">AI Council Dashboard</h1>
          <p className="text-gray-400">Your personal advisory council working 24/7</p>
        </div>

        {/* Navigation Tabs */}
        <div
          className="flex space-x-1 mb-6 bg-gray-800 rounded-lg p-1"
          data-testid="navigation-tabs"
        >
          {(['overview', 'insights', 'data', 'goals', 'telegram'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-md transition-colors capitalize ${
                activeTab === tab
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
            >
              {tab === 'telegram' ? '📱 Telegram' : tab}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Council Members */}
            <div className="lg:col-span-2" data-testid="council-members">
              <h2 className="text-2xl font-semibold mb-4">Council Members</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {councilMembers?.map((member) => (
                  <div
                    key={member._id}
                    onClick={() => setSelectedMember(member.name)}
                    className={`bg-gray-800 rounded-lg p-4 cursor-pointer transition-all hover:bg-gray-700 border-2 ${
                      selectedMember === member.name ? 'border-blue-500' : 'border-transparent'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: member.color }}
                        />
                        <h3 className="font-semibold">{member.name}</h3>
                      </div>
                      <div className={`w-2 h-2 rounded-full ${getStatusColor(member.status)}`} />
                    </div>
                    <p className="text-sm text-gray-400 mb-2">{member.role}</p>
                    <div className="flex flex-wrap gap-1 mb-2">
                      {member.expertise.slice(0, 3).map((skill, index) => (
                        <span key={index} className="text-xs bg-gray-700 px-2 py-1 rounded">
                          {skill}
                        </span>
                      ))}
                    </div>
                    <div className="text-xs text-gray-500">
                      {member.insightCount} insights • Last active:{' '}
                      {member.lastInsight ? formatDate(member.lastInsight) : 'Never'}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Stats */}
            <div data-testid="quick-stats">
              <h2 className="text-2xl font-semibold mb-4">System Overview</h2>
              <div className="space-y-4">
                <SystemStats />
              </div>
            </div>
          </div>
        )}

        {/* Insights Tab */}
        {activeTab === 'insights' && (
          <div>
            <h2 className="text-2xl font-semibold mb-4">Recent Insights</h2>
            <div className="space-y-4">
              {recentInsights?.map((insight) => {
                const member = councilMembers?.find((m) => m.playerId === insight.councilMemberId);
                return (
                  <div key={insight._id} className="bg-gray-800 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: member?.color || '#gray' }}
                        />
                        <h3 className="font-semibold">{insight.title}</h3>
                        <span
                          className={`text-sm ${getPriorityColor(insight.priority)}`}
                          data-testid="insight-priority"
                        >
                          Priority {insight.priority}
                        </span>
                      </div>
                      <span className="text-xs text-gray-500">{formatDate(insight.createdAt)}</span>
                    </div>
                    <p className="text-gray-300 mb-3">{insight.description}</p>
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-400">
                        From: {member?.name || 'Unknown'} • Confidence:{' '}
                        {Math.round(insight.confidence * 100)}%
                      </div>
                      <div className="flex items-center space-x-2" data-testid="insight-actions">
                        <span
                          className={`px-2 py-1 text-xs rounded ${
                            insight.status === 'pending'
                              ? 'bg-yellow-900 text-yellow-200'
                              : insight.status === 'reviewed'
                                ? 'bg-blue-900 text-blue-200'
                                : 'bg-green-900 text-green-200'
                          }`}
                        >
                          {insight.status}
                        </span>
                      </div>
                    </div>
                    {insight.recommendations.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-700">
                        <h4 className="text-sm font-semibold mb-2">Recommendations:</h4>
                        <ul className="list-disc list-inside text-sm text-gray-300 space-y-1">
                          {insight.recommendations.map((rec, index) => (
                            <li key={index}>{rec}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Data Tab */}
        {activeTab === 'data' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-semibold">Recent Personal Data</h2>
              <PersonalDataInput
                onDataAdded={() => {
                  // Refresh data when new data is added
                  window.location.reload();
                }}
              />
            </div>
            <div className="space-y-2">
              {recentData?.map((data) => (
                <div
                  key={data._id}
                  className="bg-gray-800 rounded-lg p-3 flex items-center justify-between"
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        data.processed ? 'bg-green-500' : 'bg-yellow-500'
                      }`}
                    />
                    <div>
                      <span className="font-semibold capitalize">{data.dataType}</span>
                      <span className="text-gray-400 ml-2">from {data.source}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-400">{formatDate(data.timestamp)}</div>
                    <div className="text-xs text-gray-500">
                      {data.processed ? 'Processed' : 'Pending'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Goals Tab */}
        {activeTab === 'goals' && (
          <div className="text-center" data-testid="goal-categories">
            <h2 className="text-2xl font-semibold mb-4">Active Goals</h2>
            <div className="space-y-4">
              {goals?.map((goal) => (
                <div key={goal._id} className="bg-gray-800 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-lg">{goal.title}</h3>
                    <span
                      className={`px-2 py-1 text-xs rounded ${
                        goal.status === 'active'
                          ? 'bg-green-900 text-green-200'
                          : goal.status === 'completed'
                            ? 'bg-blue-900 text-blue-200'
                            : 'bg-gray-700 text-gray-300'
                      }`}
                    >
                      {goal.status}
                    </span>
                  </div>
                  <p className="text-gray-300 mb-3">{goal.description}</p>
                  {goal.targetValue && goal.currentValue !== undefined && (
                    <div className="mb-3" data-testid="progress-tracking">
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span>Progress</span>
                        <span>{Math.round((goal.currentValue / goal.targetValue) * 100)}%</span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full"
                          style={{
                            width: `${Math.min((goal.currentValue / goal.targetValue) * 100, 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                  )}
                  <div className="text-sm text-gray-400">
                    Category: {goal.category} • Created: {formatDate(goal.createdAt)}
                    {goal.deadline && ` • Deadline: ${formatDate(goal.deadline)}`}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Telegram Tab */}
        {activeTab === 'telegram' && (
          <div>
            <TelegramDashboard />
          </div>
        )}
      </div>
    </div>
  );
}
