import express from 'express';
import cors from 'cors';

const app = express();
const port = 3002;

app.use(cors());
app.use(express.json());

// Mock council members data
const councilMembers = [
  {
    _id: '1',
    playerId: '1',
    name: 'Aria',
    role: 'Life Coach',
    expertise: ['personal development', 'goal setting', 'habit formation'],
    color: '#4CAF50',
    dataFocus: ['goals', 'general'],
    status: 'active',
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
    status: 'processing',
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
    status: 'idle',
    lastInsight: Date.now() - 10800000,
    insightCount: 15,
  },
  {
    _id: '4',
    playerId: '4',
    name: 'Sophia',
    role: 'Career Strategist',
    expertise: ['skill development', 'opportunity identification', 'performance optimization'],
    color: '#9C27B0',
    dataFocus: ['career', 'productivity'],
    status: 'active',
    lastInsight: Date.now() - 5400000,
    insightCount: 10,
  },
  {
    _id: '5',
    playerId: '5',
    name: 'David',
    role: 'Relationship Counselor',
    expertise: ['communication analysis', 'relationship health', 'social dynamics'],
    color: '#FF9800',
    dataFocus: ['relationships', 'communication'],
    status: 'idle',
    lastInsight: Date.now() - 9000000,
    insightCount: 6,
  },
  {
    _id: '6',
    playerId: '6',
    name: 'Ruby',
    role: 'Knowledge Curator',
    expertise: ['information synthesis', 'learning optimization', 'knowledge organization'],
    color: '#F44336',
    dataFocus: ['learning', 'knowledge'],
    status: 'active',
    lastInsight: Date.now() - 1800000,
    insightCount: 20,
  },
  {
    _id: '7',
    playerId: '7',
    name: 'Max',
    role: 'Productivity Manager',
    expertise: ['time usage analysis', 'workflow optimization', 'task prioritization'],
    color: '#607D8B',
    dataFocus: ['productivity', 'time'],
    status: 'processing',
    lastInsight: Date.now() - 2700000,
    insightCount: 14,
  },
  {
    _id: '8',
    playerId: '8',
    name: 'Nova',
    role: 'Integration Coordinator',
    expertise: ['system integration', 'data synthesis', 'cross-domain analysis'],
    color: '#795548',
    dataFocus: ['integration', 'synthesis'],
    status: 'active',
    lastInsight: Date.now() - 4500000,
    insightCount: 18,
  },
];

// Mock insights data
const insights = [
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
    status: 'pending',
    createdAt: Date.now() - 3600000,
  },
  {
    _id: '2',
    councilMemberId: '2',
    title: 'Monthly Budget Analysis',
    description:
      'Your spending is 15% under budget this month. Great job! Consider allocating the surplus to your emergency fund.',
    category: 'finance',
    priority: 1,
    confidence: 0.92,
    recommendations: [
      'Transfer $200 to emergency fund',
      'Review investment portfolio',
      'Plan for upcoming expenses',
    ],
    status: 'reviewed',
    createdAt: Date.now() - 7200000,
  },
  {
    _id: '3',
    councilMemberId: '3',
    title: 'Sleep Quality Analysis',
    description:
      'Your average sleep duration has decreased by 30 minutes this week. This may be affecting your productivity and mood.',
    category: 'health',
    priority: 3,
    confidence: 0.78,
    recommendations: [
      'Establish consistent bedtime routine',
      'Limit screen time before bed',
      'Consider meditation or relaxation techniques',
    ],
    status: 'pending',
    createdAt: Date.now() - 1800000,
  },
  {
    _id: '4',
    councilMemberId: '4',
    title: 'Career Development Opportunity',
    description:
      'Based on your recent skill acquisition and project work, you may be ready for a leadership role consideration.',
    category: 'career',
    priority: 2,
    confidence: 0.73,
    recommendations: [
      'Update resume with recent achievements',
      'Express interest in leadership opportunities',
      'Seek mentorship from current leaders',
    ],
    status: 'reviewed',
    createdAt: Date.now() - 5400000,
  },
];

// Mock personal data
const personalData = [
  {
    _id: '1',
    dataType: 'health',
    source: 'fitbit',
    value: { steps: 7650, heartRate: 72, sleep: 7.5 },
    timestamp: Date.now() - 1800000,
    processed: true,
  },
  {
    _id: '2',
    dataType: 'finance',
    source: 'bank',
    value: { amount: 45.67, category: 'groceries', merchant: 'Whole Foods' },
    timestamp: Date.now() - 3600000,
    processed: true,
  },
  {
    _id: '3',
    dataType: 'productivity',
    source: 'manual',
    value: { task: 'Complete project proposal', timeSpent: 120, completed: true },
    timestamp: Date.now() - 5400000,
    processed: false,
  },
  {
    _id: '4',
    dataType: 'health',
    source: 'manual',
    value: { weight: 165, bodyFat: 18, energy: 7 },
    timestamp: Date.now() - 7200000,
    processed: true,
  },
  {
    _id: '5',
    dataType: 'relationships',
    source: 'calendar',
    value: { event: 'Team meeting', attendees: 5, duration: 60 },
    timestamp: Date.now() - 9000000,
    processed: true,
  },
];

// Mock goals
const goals = [
  {
    _id: '1',
    title: 'Daily Exercise',
    description: 'Exercise for at least 30 minutes every day',
    category: 'health',
    targetValue: 30,
    currentValue: 25,
    unit: 'minutes',
    deadline: Date.now() + 2592000000, // 30 days from now
    status: 'active',
    createdAt: Date.now() - 604800000, // 1 week ago
    updatedAt: Date.now() - 86400000, // 1 day ago
    milestones: [],
  },
  {
    _id: '2',
    title: 'Emergency Fund',
    description: 'Save $10,000 in emergency fund',
    category: 'finance',
    targetValue: 10000,
    currentValue: 7500,
    unit: 'dollars',
    deadline: Date.now() + 7776000000, // 90 days from now
    status: 'active',
    createdAt: Date.now() - 2592000000, // 30 days ago
    updatedAt: Date.now() - 172800000, // 2 days ago
    milestones: [],
  },
  {
    _id: '3',
    title: 'Learn TypeScript',
    description: 'Complete advanced TypeScript course',
    category: 'career',
    targetValue: 100,
    currentValue: 65,
    unit: 'percent',
    deadline: Date.now() + 5184000000, // 60 days from now
    status: 'active',
    createdAt: Date.now() - 1209600000, // 2 weeks ago
    updatedAt: Date.now() - 259200000, // 3 days ago
    milestones: [],
  },
];

// API Endpoints
app.get('/api/council-members', (req, res) => {
  res.json(councilMembers);
});

app.get('/api/insights', (req, res) => {
  res.json(insights);
});

app.get('/api/personal-data', (req, res) => {
  res.json(personalData);
});

app.get('/api/goals', (req, res) => {
  res.json(goals);
});

app.post('/api/personal-data', (req, res) => {
  const newData = {
    _id: Date.now().toString(),
    ...req.body,
    timestamp: Date.now(),
    processed: false,
  };
  personalData.push(newData);
  res.json(newData);
});

app.post('/api/insights/:id/act', (req, res) => {
  const insightId = req.params.id;
  const insight = insights.find((i) => i._id === insightId);
  if (insight) {
    insight.status = 'acted_upon';
    res.json({ success: true, insight });
  } else {
    res.status(404).json({ error: 'Insight not found' });
  }
});

// Data Processing Pipeline
class DataProcessor {
  constructor() {
    this.insightTemplates = {
      health: [
        {
          title: 'Health Trend Analysis',
          descriptionTemplate: (data) =>
            `Based on your recent health data, ${this.generateHealthInsight(data)}`,
          priority: 2,
          recommendations: [
            'Maintain consistent routine',
            'Track progress regularly',
            'Set achievable goals',
          ],
        },
        {
          title: 'Exercise Performance Review',
          descriptionTemplate: (data) =>
            `Your workout data shows ${this.generateExerciseInsight(data)}`,
          priority: 1,
          recommendations: [
            'Increase intensity gradually',
            'Focus on form',
            'Allow adequate recovery',
          ],
        },
      ],
      finance: [
        {
          title: 'Spending Pattern Analysis',
          descriptionTemplate: (data) =>
            `Your financial data indicates ${this.generateFinanceInsight(data)}`,
          priority: 2,
          recommendations: [
            'Review budget allocations',
            'Identify savings opportunities',
            'Monitor recurring expenses',
          ],
        },
        {
          title: 'Financial Health Check',
          descriptionTemplate: (data) => `${this.generateFinancialHealthInsight(data)}`,
          priority: 1,
          recommendations: [
            'Build emergency fund',
            'Review investment strategy',
            'Set financial goals',
          ],
        },
      ],
      productivity: [
        {
          title: 'Productivity Analysis',
          descriptionTemplate: (data) =>
            `Your productivity data shows ${this.generateProductivityInsight(data)}`,
          priority: 2,
          recommendations: [
            'Optimize work environment',
            'Use time-blocking',
            'Take regular breaks',
          ],
        },
        {
          title: 'Task Completion Review',
          descriptionTemplate: (data) => `${this.generateTaskInsight(data)}`,
          priority: 1,
          recommendations: [
            'Break down large tasks',
            'Prioritize important items',
            'Celebrate completed work',
          ],
        },
      ],
    };
  }

  generateHealthInsight(data) {
    if (data.steps)
      return `you're averaging ${data.steps} steps daily, which is ${data.steps >= 8000 ? 'excellent' : 'below recommended levels'}`;
    if (data.sleep)
      return `your sleep duration is ${data.sleep} hours, which is ${data.sleep >= 7 ? 'healthy' : 'below the recommended 7-9 hours'}`;
    if (data.heartRate)
      return `your resting heart rate is ${data.heartRate} bpm, indicating ${data.heartRate <= 80 ? 'good' : 'room for improvement in'} cardiovascular fitness`;
    return 'positive health trends that we should continue to monitor';
  }

  generateExerciseInsight(data) {
    if (data.duration)
      return `${data.duration} minutes of exercise with ${data.calories || 'moderate'} calories burned`;
    if (data.exercise)
      return `good performance in ${data.exercise} with ${data.duration || 'solid'} duration`;
    return 'consistent exercise patterns that are contributing to your fitness goals';
  }

  generateFinanceInsight(data) {
    if (data.amount && data.category)
      return `spending patterns in ${data.category} with recent purchases of $${data.amount}`;
    if (data.amount)
      return `transaction amounts averaging $${data.amount}, suggesting ${data.amount > 100 ? 'significant' : 'modest'} spending levels`;
    return 'financial activity that aligns with your budget goals';
  }

  generateFinancialHealthInsight(data) {
    return 'your financial habits demonstrate responsible spending patterns and good saving potential';
  }

  generateProductivityInsight(data) {
    if (data.timeSpent)
      return `${data.timeSpent} minutes spent on tasks with ${data.completed ? 'high' : 'variable'} completion rates`;
    if (data.task)
      return `focused work on ${data.task} with ${data.timeSpent || 'appropriate'} time investment`;
    return 'productive work patterns that support your goal achievement';
  }

  generateTaskInsight(data) {
    return data.completed
      ? 'excellent task completion rate that demonstrates strong focus and efficiency'
      : 'opportunities to improve task completion through better time management';
  }

  processNewData(newData) {
    const relevantCouncilMembers = councilMembers.filter(
      (member) =>
        member.dataFocus.includes(newData.dataType) || member.dataFocus.includes('general'),
    );

    const generatedInsights = [];

    relevantCouncilMembers.forEach((member) => {
      const templates = this.insightTemplates[newData.dataType] || this.insightTemplates.health;

      if (Math.random() > 0.3) {
        // 70% chance to generate insight
        const template = templates[Math.floor(Math.random() * templates.length)];
        const insight = {
          _id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          councilMemberId: member.playerId,
          title: template.title,
          description: template.descriptionTemplate(newData.value),
          category: newData.dataType,
          priority: template.priority,
          confidence: 0.7 + Math.random() * 0.25, // 0.7-0.95 confidence
          recommendations: template.recommendations,
          status: 'pending',
          createdAt: Date.now(),
        };

        insights.push(insight);
        generatedInsights.push(insight);

        // Update council member stats
        member.lastInsight = Date.now();
        member.insightCount = (member.insightCount || 0) + 1;
        member.status = Math.random() > 0.5 ? 'active' : 'processing';
      }
    });

    return generatedInsights;
  }

  processAllUnprocessedData() {
    const unprocessedData = personalData.filter((data) => !data.processed);
    const allGeneratedInsights = [];

    unprocessedData.forEach((data) => {
      const insights = this.processNewData(data);
      data.processed = true;
      allGeneratedInsights.push(...insights);
    });

    return allGeneratedInsights;
  }
}

const dataProcessor = new DataProcessor();

// Enhanced personal data endpoint with processing
app.post('/api/personal-data', (req, res) => {
  const newData = {
    _id: req.body._id || Date.now().toString(),
    ...req.body,
    timestamp: req.body.timestamp || Date.now(),
    processed: req.body.processed || false,
  };
  personalData.push(newData);

  // Process the new data and generate insights
  setTimeout(() => {
    const generatedInsights = dataProcessor.processNewData(newData);
    newData.processed = true;
    console.log(`Generated ${generatedInsights.length} insights from new ${newData.dataType} data`);
  }, 2000); // Simulate processing time

  res.json(newData);
});

// New endpoint to manually trigger data processing
app.post('/api/process-data', (req, res) => {
  const generatedInsights = dataProcessor.processAllUnprocessedData();
  res.json({
    message: `Processed ${personalData.filter((d) => d.processed).length} data items and generated ${generatedInsights.length} new insights`,
    insights: generatedInsights,
  });
});

// New endpoint to get processing statistics
app.get('/api/stats', (req, res) => {
  const stats = {
    totalDataPoints: personalData.length,
    processedDataPoints: personalData.filter((d) => d.processed).length,
    pendingDataPoints: personalData.filter((d) => !d.processed).length,
    totalInsights: insights.length,
    pendingInsights: insights.filter((i) => i.status === 'pending').length,
    reviewedInsights: insights.filter((i) => i.status === 'reviewed').length,
    actedUponInsights: insights.filter((i) => i.status === 'acted_upon').length,
    councilMemberStats: councilMembers.map((member) => ({
      name: member.name,
      insightCount: member.insightCount,
      status: member.status,
      lastInsight: member.lastInsight,
    })),
  };
  res.json(stats);
});

// Mock authentication endpoints
const mockUsers = [
  {
    _id: '1',
    email: 'user@example.com',
    password: 'password123', // In production, this would be hashed
    profile: {
      firstName: 'Demo',
      lastName: 'User',
      phone: '+1234567890',
      timezone: 'America/New_York',
      language: 'en',
      dateOfBirth: new Date('1990-01-01'),
    },
    preferences: {
      theme: 'dark',
      notifications: {
        email: true,
        push: true,
        sms: false,
        insights: true,
        security: true,
        updates: false,
      },
      dashboard: {
        layout: 'grid',
        widgets: ['overview', 'insights', 'data'],
        refreshInterval: 30,
      },
      ai: {
        responseStyle: 'casual',
        insightFrequency: 'daily',
        dataSensitivity: 'medium',
      },
    },
    security: {
      privacySettings: {
        shareDataWithAI: true,
        allowDataAnalysis: true,
        allowPersonalizedInsights: true,
        dataSharingConsent: true,
        marketingConsent: false,
        cookieConsent: true,
        analyticsTracking: true,
      },
    },
  },
];

// Helper function to find user by email
const findUserByEmail = (email) => mockUsers.find(user => user.email === email);

// Helper function to generate JWT token (mock)
const generateToken = () => 'mock_jwt_token_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);

// Auth endpoints
app.post('/api/auth/login', (req, res) => {
  const { email, password, rememberMe } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const user = findUserByEmail(email);
  
  if (!user || user.password !== password) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = generateToken();
  
  // Return user data without password
  const { password: _, ...userWithoutPassword } = user;
  
  res.json({
    token,
    user: userWithoutPassword,
    message: 'Login successful'
  });
});

app.post('/api/auth/register', (req, res) => {
  const { email, password, firstName, lastName, phone, timezone, language } = req.body;

  if (!email || !password || !firstName || !lastName) {
    return res.status(400).json({ error: 'All required fields must be provided' });
  }

  // Check if user already exists
  if (findUserByEmail(email)) {
    return res.status(409).json({ error: 'User already exists' });
  }

  // Create new user
  const newUser = {
    _id: Date.now().toString(),
    email,
    password, // In production, this would be hashed
    profile: {
      firstName,
      lastName,
      phone: phone || '',
      timezone: timezone || 'America/New_York',
      language: language || 'en',
      dateOfBirth: null,
    },
    preferences: {
      theme: 'dark',
      notifications: {
        email: true,
        push: true,
        sms: false,
        insights: true,
        security: true,
        updates: false,
      },
      dashboard: {
        layout: 'grid',
        widgets: ['overview', 'insights', 'data'],
        refreshInterval: 30,
      },
      ai: {
        responseStyle: 'casual',
        insightFrequency: 'daily',
        dataSensitivity: 'medium',
      },
    },
    security: {
      privacySettings: {
        shareDataWithAI: true,
        allowDataAnalysis: true,
        allowPersonalizedInsights: true,
        dataSharingConsent: true,
        marketingConsent: false,
        cookieConsent: true,
        analyticsTracking: true,
      },
    },
  };

  mockUsers.push(newUser);
  const token = generateToken();
  
  // Return user data without password
  const { password: _, ...userWithoutPassword } = newUser;
  
  res.status(201).json({
    token,
    user: userWithoutPassword,
    message: 'Registration successful'
  });
});

app.get('/api/auth/profile', (req, res) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  // In a real app, you would verify the JWT token
  // For mock purposes, we'll return the first user
  const user = mockUsers[0];
  
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  // Return user data without password
  const { password: _, ...userWithoutPassword } = user;
  
  res.json(userWithoutPassword);
});

app.post('/api/auth/logout', (req, res) => {
  // In a real app, you would invalidate the token
  res.json({ message: 'Logout successful' });
});

app.listen(port, () => {
  console.log(`AI Council API server running at http://localhost:${port}`);
  console.log('Data processing pipeline initialized');
});
