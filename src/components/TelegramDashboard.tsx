import React, { useState, useEffect } from 'react';

interface TelegramBot {
  name: string;
  token: string;
  webhookUrl: string;
  registeredAt: string;
  isActive: boolean;
  userCount: number;
}

interface TelegramStats {
  totalUsers: number;
  totalMessages: number;
  totalDataPoints: number;
  activeUsers: number;
  users: Array<{
    id: number;
    username?: string;
    firstName: string;
    messageCount: number;
    dataPoints: number;
    lastActivity: number;
    isActive: boolean;
  }>;
}

export default function TelegramDashboard() {
  const [bots, setBots] = useState<TelegramBot[]>([]);
  const [selectedBot, setSelectedBot] = useState<string>('');
  const [stats, setStats] = useState<TelegramStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchBots();
  }, []);

  useEffect(() => {
    if (selectedBot) {
      fetchBotStats();
    }
  }, [selectedBot]);

  const fetchBots = async () => {
    try {
      const response = await fetch('http://localhost:3002/api/telegram/bots');
      const data = await response.json();
      setBots(data.bots || []);
      if (data.bots && data.bots.length > 0) {
        setSelectedBot(data.bots[0].token);
      }
    } catch (error) {
      console.error('Failed to fetch Telegram bots:', error);
      setError('Failed to fetch bots');
    }
  };

  const fetchBotStats = async () => {
    if (!selectedBot) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`http://localhost:3002/api/telegram/stats/${selectedBot}`);
      const data = await response.json();
      setStats(data.stats);
    } catch (error) {
      console.error('Failed to fetch bot stats:', error);
      setError('Failed to fetch bot statistics');
    } finally {
      setLoading(false);
    }
  };

  const sendMessageToUser = async (userId: number, message: string) => {
    if (!selectedBot) return;

    try {
      const response = await fetch(`http://localhost:3002/api/telegram/send/${selectedBot}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          message,
        }),
      });

      if (response.ok) {
        alert('Message sent successfully!');
      } else {
        throw new Error('Failed to send message');
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      alert('Failed to send message');
    }
  };

  if (bots.length === 0) {
    return (
      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Telegram Bot Dashboard</h3>
        <div className="text-center py-8">
          <div className="text-gray-400 mb-4">
            <svg className="w-16 h-16 mx-auto mb-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.56c-.21 2.27-1.13 7.75-1.6 10.29-.2 1.08-.59 1.44-.97 1.47-.82.07-1.44-.54-2.23-1.06-1.24-.81-1.94-1.32-3.14-2.11-1.39-.9-.49-1.39.3-1.97.21-.15 3.86-3.53 3.93-3.83.01-.04.01-.19-.07-.27s-.2-.06-.29-.03c-.12.04-2.09 1.33-5.91 3.9-.56.38-1.06.57-1.52.56-.5-.01-1.46-.28-2.18-.51-.88-.28-1.57-.43-1.51-.91.03-.25.38-.51 1.05-.78 4.11-1.79 6.85-2.97 8.21-3.55 3.92-1.63 4.73-1.91 5.26-1.92.12 0 .37.03.53.17.14.12.18.28.2.45-.01.06.01.24 0 .36z" />
            </svg>
          </div>
          <h4 className="text-gray-300 font-medium mb-2">No Telegram Bots Connected</h4>
          <p className="text-gray-400 text-sm mb-4">
            Connect a Telegram bot to start collecting data through the app
          </p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Set Up Telegram Bot
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold">Telegram Bot Dashboard</h3>
        <button onClick={fetchBots} className="text-gray-400 hover:text-white transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
        </button>
      </div>

      {error && <div className="bg-red-900 text-red-200 p-3 rounded-lg mb-4">{error}</div>}

      {/* Bot Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">Select Bot</label>
        <select
          value={selectedBot}
          onChange={(e) => setSelectedBot(e.target.value)}
          className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
        >
          {bots.map((bot) => (
            <option key={bot.token} value={bot.token}>
              {bot.name} ({bot.userCount} users)
            </option>
          ))}
        </select>
      </div>

      {stats && (
        <>
          {/* Stats Overview */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="bg-gray-700 p-4 rounded-lg">
              <div className="text-2xl font-bold text-blue-400">{stats.totalUsers}</div>
              <div className="text-sm text-gray-400">Total Users</div>
            </div>
            <div className="bg-gray-700 p-4 rounded-lg">
              <div className="text-2xl font-bold text-green-400">{stats.totalMessages}</div>
              <div className="text-sm text-gray-400">Total Messages</div>
            </div>
            <div className="bg-gray-700 p-4 rounded-lg">
              <div className="text-2xl font-bold text-purple-400">{stats.totalDataPoints}</div>
              <div className="text-sm text-gray-400">Data Points</div>
            </div>
            <div className="bg-gray-700 p-4 rounded-lg">
              <div className="text-2xl font-bold text-yellow-400">{stats.activeUsers}</div>
              <div className="text-sm text-gray-400">Active Users</div>
            </div>
          </div>

          {/* Users Table */}
          <div>
            <h4 className="font-medium mb-3">User Activity</h4>
            <div className="bg-gray-700 rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-600">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Messages
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Data Points
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Last Active
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-600">
                    {stats.users.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-600">
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-white">{user.firstName}</div>
                            <div className="text-sm text-gray-400">@{user.username || 'N/A'}</div>
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300">
                          {user.messageCount}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300">
                          {user.dataPoints}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300">
                          {new Date(user.lastActivity).toLocaleString()}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              user.isActive
                                ? 'bg-green-800 text-green-200'
                                : 'bg-gray-600 text-gray-300'
                            }`}
                          >
                            {user.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => {
                              const message = prompt('Enter message to send:');
                              if (message) {
                                sendMessageToUser(user.id, message);
                              }
                            }}
                            className="text-blue-400 hover:text-blue-300"
                          >
                            Send Message
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}

      {loading && (
        <div className="text-center py-8">
          <div className="text-gray-400">Loading bot statistics...</div>
        </div>
      )}
    </div>
  );
}
