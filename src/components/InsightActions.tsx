import React, { useState } from 'react';

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

interface InsightActionsProps {
  insight: Insight;
  onStatusChange: () => void;
  councilMemberName?: string;
  councilMemberColor?: string;
}

export default function InsightActions({
  insight,
  onStatusChange,
  councilMemberName,
  councilMemberColor,
}: InsightActionsProps) {
  const [loading, setLoading] = useState(false);

  const updateInsightStatus = async (newStatus: 'reviewed' | 'acted_upon') => {
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:3002/api/insights/${insight._id}/act`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error('Failed to update insight status');
      }

      onStatusChange();
    } catch (error) {
      console.error('Error updating insight:', error);
      alert('Failed to update insight status');
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority: number) => {
    if (priority >= 3) return 'text-red-400';
    if (priority >= 2) return 'text-yellow-400';
    return 'text-green-400';
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-900 text-yellow-200';
      case 'reviewed':
        return 'bg-blue-900 text-blue-200';
      case 'acted_upon':
        return 'bg-green-900 text-green-200';
      default:
        return 'bg-gray-700 text-gray-300';
    }
  };

  const formatDate = (timestamp: number) => {
    return (
      new Date(timestamp).toLocaleDateString() + ' ' + new Date(timestamp).toLocaleTimeString()
    );
  };

  return (
    <div
      className="bg-gray-800 rounded-lg p-4 border-l-4"
      style={{ borderLeftColor: councilMemberColor || '#4B5563' }}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: councilMemberColor || '#4B5563' }}
            />
            <h3 className="font-semibold text-white">{insight.title}</h3>
            <span className={`text-sm ${getPriorityColor(insight.priority)}`}>
              Priority {insight.priority}
            </span>
          </div>
          <p className="text-gray-300 text-sm mb-2">{insight.description}</p>
          <div className="flex items-center space-x-4 text-xs text-gray-400 mb-3">
            <span>From: {councilMemberName || 'Unknown'}</span>
            <span>Confidence: {Math.round(insight.confidence * 100)}%</span>
            <span>{formatDate(insight.createdAt)}</span>
          </div>
        </div>
        <span className={`px-2 py-1 text-xs rounded ${getStatusBadge(insight.status)}`}>
          {insight.status.replace('_', ' ')}
        </span>
      </div>

      {insight.recommendations.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-semibold mb-2 text-gray-300">Recommendations:</h4>
          <ul className="list-disc list-inside text-sm text-gray-300 space-y-1">
            {insight.recommendations.map((rec, index) => (
              <li key={index} className="flex items-start">
                <span className="mr-2">{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex items-center justify-between pt-3 border-t border-gray-700">
        <div className="text-xs text-gray-500">
          Category: <span className="capitalize">{insight.category}</span>
        </div>
        <div className="flex space-x-2">
          {insight.status === 'pending' && (
            <button
              onClick={() => updateInsightStatus('reviewed')}
              disabled={loading}
              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded transition-colors disabled:opacity-50"
            >
              {loading ? 'Marking...' : 'Mark as Reviewed'}
            </button>
          )}
          {insight.status !== 'acted_upon' && (
            <button
              onClick={() => updateInsightStatus('acted_upon')}
              disabled={loading}
              className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-xs rounded transition-colors disabled:opacity-50"
            >
              {loading ? 'Marking...' : 'Mark as Acted Upon'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
