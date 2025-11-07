// Simple test server
import express from 'express';
import cors from 'cors';

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Game endpoints
app.get('/api/world/defaultWorldStatus', (req, res) => {
  res.json({
    status: 'ok',
    worldId: 'test-world',
    engineId: 'test-engine',
    message: 'Default world status'
  });
});

app.get('/api/world/gameDescriptions', (req, res) => {
  res.json({
    status: 'ok',
    agentDescriptions: [
      {
        agentId: 'aria',
        name: 'Aria',
        character: 'f1',
        identity: 'Life Coach & Personal Development Expert',
        plan: 'Help users achieve their personal goals and grow as individuals',
        dataFocus: ['personal development', 'goals', 'habits', 'mindfulness'],
        expertise: ['life coaching', 'personal development', 'goal setting', 'mindfulness'],
        role: 'Life Coach'
      },
      {
        agentId: 'marcus',
        name: 'Marcus',
        character: 'f4',
        identity: 'Financial Analyst & Wealth Management Expert',
        plan: 'Provide sound financial advice and help users build wealth',
        dataFocus: ['finances', 'investments', 'budgeting', 'retirement'],
        expertise: ['financial planning', 'investment strategies', 'budget management', 'retirement planning'],
        role: 'Financial Analyst'
      },
      {
        agentId: 'lena',
        name: 'Dr. Lena',
        character: 'f6',
        identity: 'Health & Wellness Advisor',
        plan: 'Optimize health and well-being through evidence-based recommendations',
        dataFocus: ['health', 'wellness', 'exercise', 'nutrition'],
        expertise: ['nutrition', 'exercise', 'sleep', 'mental health'],
        role: 'Health & Wellness Advisor'
      },
      {
        agentId: 'sophia',
        name: 'Sophia',
        character: 'f3',
        identity: 'Career Strategist',
        plan: 'Accelerate professional growth and maximize career potential',
        dataFocus: ['career', 'skills', 'professional development'],
        expertise: ['career planning', 'skill development', 'networking'],
        role: 'Career Strategist'
      }
    ],
    playerDescriptions: [],
    worldMap: {
      width: 50,
      height: 50,
      tiles: Array(50).fill(null).map(() => Array(50).fill(0))
    }
  });
});

app.get('/api/world/worldState', (req, res) => {
  res.json({
    status: 'ok',
    worldState: {
      players: [],
      agents: [
        {
          id: 'aria',
          position: { x: 10, y: 10 },
          status: 'active',
          isAgent: true
        },
        {
          id: 'marcus',
          position: { x: 15, y: 15 },
          status: 'active',
          isAgent: true
        },
        {
          id: 'lena',
          position: { x: 20, y: 10 },
          status: 'active',
          isAgent: true
        },
        {
          id: 'sophia',
          position: { x: 25, y: 15 },
          status: 'active',
          isAgent: true
        }
      ],
      environment: {},
      engine: {
        time: 0,
        running: true
      }
    },
    world: {
      id: 'test-world',
      name: 'AI Council Chamber',
      status: 'active'
    }
  });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Test server running on http://0.0.0.0:${PORT}`);
  console.log(`📊 Health: http://localhost:${PORT}/health`);
});

// Keep process alive
setInterval(() => {}, 60000);