// Self-hosted API Server
// Replaces Convex backend with Express.js + PostgreSQL

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { DatabaseManager } from '../src/config/DatabaseManager';
import { createServer } from 'http';
import { config } from 'dotenv';

// Load environment variables
config();

class APIServer {
  private app: express.Application;
  private server: any;
  private dbManager: DatabaseManager;
  private port: number;

  constructor() {
    this.app = express();
    this.server = createServer(this.app);
    
    // Use memory provider for development if PostgreSQL is not available
    if (!process.env.DATABASE_URL && !process.env.DATABASE_PROVIDER) {
      console.log('📝 Using memory database for development (set DATABASE_URL to use PostgreSQL)');
      process.env.DATABASE_PROVIDER = 'memory';
    }
    
    this.dbManager = DatabaseManager.getInstance();
    this.port = parseInt(process.env.PORT || '3000');
    
    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  private setupMiddleware(): void {
    // Security
    this.app.use(helmet({
      contentSecurityPolicy: false, // Needed for PIXI.js
    }));

    // CORS
    this.app.use(cors({
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      credentials: true
    }));

    // Rate limiting
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // limit each IP to 100 requests per windowMs
      message: 'Too many requests from this IP, please try again later.'
    });
    this.app.use('/api/', limiter);

    // General middleware
    this.app.use(compression());
    this.app.use(morgan('combined') as any);
    this.app.use(express.json({ limit: '50mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '50mb' }));
  }

  private setupRoutes(): void {
    // Health check
    this.app.get('/health', async (req, res) => {
      try {
        const health = await this.dbManager.healthCheck();
        res.json({
          status: 'ok',
          timestamp: new Date().toISOString(),
          database: health,
          environment: process.env.NODE_ENV || 'development'
        });
      } catch (error) {
        res.status(500).json({
          status: 'error',
          message: error.message
        });
      }
    });

    // API endpoints - replacing Convex functions
    this.setupAPIRoutes();

    // Serve static files
    this.app.use(express.static('dist'));
    
    // SPA fallback
    this.app.get(/.*/, (_req, res) => {
      res.sendFile('dist/index.html', { root: '.' });
    });
  }

  private setupAPIRoutes(): void {
    // Mock council members data (replacing Convex agent data)
    const councilMembers = [
      {
        id: '1',
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
        id: '2',
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
        id: '3',
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
        id: '4',
        playerId: '4',
        name: 'James',
        role: 'Career Strategist',
        expertise: ['career planning', 'skill development', 'networking'],
        color: '#FF9800',
        dataFocus: ['career'],
        status: 'active',
        lastInsight: Date.now() - 1800000,
        insightCount: 6,
      },
      {
        id: '5',
        playerId: '5',
        name: 'Elena',
        role: 'Relationship Counselor',
        expertise: ['communication', 'emotional intelligence', 'conflict resolution'],
        color: '#9C27B0',
        dataFocus: ['relationships'],
        status: 'processing',
        lastInsight: Date.now() - 5400000,
        insightCount: 9,
      },
      {
        id: '6',
        playerId: '6',
        name: 'David',
        role: 'Knowledge Curator',
        expertise: ['research', 'information organization', 'learning strategies'],
        color: '#607D8B',
        dataFocus: ['knowledge'],
        status: 'idle',
        lastInsight: Date.now() - 9000000,
        insightCount: 20,
      },
      {
        id: '7',
        playerId: '7',
        name: 'Lisa',
        role: 'Productivity Manager',
        expertise: ['time management', 'workflow optimization', 'focus techniques'],
        color: '#795548',
        dataFocus: ['productivity'],
        status: 'active',
        lastInsight: Date.now() - 2700000,
        insightCount: 14,
      },
      {
        id: '8',
        playerId: '8',
        name: 'Alex',
        role: 'Integration Coordinator',
        expertise: ['systems thinking', 'holistic planning', 'synthesis'],
        color: '#00BCD4',
        dataFocus: ['integration'],
        status: 'processing',
        lastInsight: Date.now() - 4500000,
        insightCount: 11,
      },
    ];

    // World state (replaces Convex world queries)
    this.app.get('/api/world', async (_req, res) => {
      try {
        const db = await this.dbManager.getProvider();
        const worlds = await db.query('worlds').collect();
        res.json(worlds[0] || { 
          id: 'default-world',
          name: 'AI Council LifeOS',
          players: [],
          agents: councilMembers,
          conversations: [],
          mapData: null
        });
      } catch (error) {
        res.status(500).json({ error: (error as Error).message });
      }
    });

    // Council members
    this.app.get('/api/council-members', (_req, res) => {
      res.json(councilMembers);
    });

    // Messages (replaces Convex messages table)
    this.app.get('/api/messages', async (_req, res) => {
      try {
        const db = await this.dbManager.getProvider();
        const messages = await db.query('messages').collect();
        res.json(messages);
      } catch (error) {
        res.status(500).json({ error: (error as Error).message });
      }
    });

    this.app.post('/api/messages', async (req, res) => {
      try {
        const { conversationId, author, text } = req.body;
        const db = await this.dbManager.getProvider();
        
        const message = {
          conversationId,
          messageUuid: crypto.randomUUID(),
          author,
          text,
          worldId: 'default-world',
          created_at: new Date()
        };
        
        const messageId = await db.insert('messages', message);
        res.json({ id: messageId, ...message });
      } catch (error) {
        res.status(500).json({ error: (error as Error).message });
      }
    });

    // Agent operations (replaces Convex agent functions)
    this.app.post('/api/agents/:agentId/generate-message', async (req, res) => {
      try {
        const { agentId } = req.params;
        
        // Simulate agent processing
        setTimeout(() => {
          const agent = councilMembers.find(a => a.id === agentId);
          if (!agent) {
            return res.status(404).json({ error: 'Agent not found' });
          }
          
          const response = {
            agentId,
            message: `Hi, I'm ${agent.name}, your ${agent.role}. I'm here to help you with ${agent.expertise.join(', ')}.`,
            timestamp: Date.now(),
            status: 'completed'
          };
          
          res.json(response);
        }, 2000);
        
      } catch (error) {
        res.status(500).json({ error: (error as Error).message });
      }
    });

    // Insights
    this.app.get('/api/insights', async (_req, res) => {
      try {
        const db = await this.dbManager.getProvider();
        const memories = await db.query('memories').collect();
        const insights = (memories as any[]).filter((m: any) => m.data?.type === 'insight');
        res.json(insights);
      } catch (error) {
        // Fallback mock data
        const mockInsights = [
          {
            id: '1',
            councilMemberId: '1',
            title: 'Weekly Goal Review',
            description: 'Review your weekly progress and adjust goals as needed',
            category: 'goal_setting',
            priority: 3,
            confidence: 0.85,
            recommendations: ['Set SMART goals for next week', 'Celebrate completed tasks'],
            status: 'pending',
            created_at: Date.now() - 86400000,
          },
        ];
        res.json(mockInsights);
      }
    });

    // Personal data
    this.app.get('/api/personal-data', async (_req, res) => {
      try {
        const db = await this.dbManager.getProvider();
        const memories = await db.query('memories').collect();
        const personalData = (memories as any[]).filter((m: any) => m.data?.type === 'personalData');
        res.json(personalData);
      } catch (error) {
        // Fallback mock data
        const mockPersonalData = [
          {
            id: '1',
            dataType: 'health',
            source: 'fitbit',
            value: { steps: 7650, heartRate: 72, sleep: 7.5 },
            timestamp: Date.now() - 1800000,
            processed: true,
          },
          {
            id: '2',
            dataType: 'finance',
            source: 'plaid',
            value: { spending: 145.50, savings: 2300, budget_used: 0.73 },
            timestamp: Date.now() - 3600000,
            processed: true,
          },
        ];
        res.json(mockPersonalData);
      }
    });

    // Goals
    this.app.get('/api/goals', async (_req, res) => {
      try {
        const db = await this.dbManager.getProvider();
        const memories = await db.query('memories').collect();
        const goals = (memories as any[]).filter((m: any) => m.data?.type === 'goalProgress');
        res.json(goals);
      } catch (error) {
        // Fallback mock data
        const mockGoals = [
          {
            id: '1',
            title: 'Daily Exercise',
            description: 'Exercise for at least 30 minutes every day',
            category: 'health',
            targetValue: 30,
            currentValue: 25,
            unit: 'minutes',
            deadline: Date.now() + 2592000000,
            status: 'active',
            created_at: Date.now() - 604800000,
            updated_at: Date.now() - 86400000,
          },
        ];
        res.json(mockGoals);
      }
    });

    // Authentication endpoints
    this.app.post('/api/auth/login', (req, res) => {
      const { email, password } = req.body;
      
      // Mock authentication
      if (email === 'user@example.com' && password === 'password') {
        const token = 'mock-jwt-token-' + Date.now();
        res.json({
          token,
          user: {
            id: '1',
            email: 'user@example.com',
            name: 'Demo User',
          },
        });
      } else {
        res.status(401).json({ error: 'Invalid credentials' });
      }
    });

    this.app.post('/api/auth/register', (req, res) => {
      const { email, name } = req.body;
      const token = 'mock-jwt-token-' + Date.now();
      res.json({
        token,
        user: {
          id: '1',
          email,
          name,
        },
      });
    });

    this.app.get('/api/auth/profile', (_req, res) => {
      const user = {
        id: '1',
        email: 'user@example.com',
        name: 'Demo User',
      };
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json(user);
    });

    this.app.post('/api/auth/logout', (_req, res) => {
      res.json({ message: 'Logout successful' });
    });
  }

  private setupErrorHandling(): void {
    // 404 handler
    this.app.use((_req, res) => {
      res.status(404).json({
        error: 'Not Found',
        message: `Route not found`
      });
    });

    // Global error handler
    this.app.use((error: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
      console.error('Unhandled error:', error);
      
      res.status(error.status || 500).json({
        error: error.name || 'Internal Server Error',
        message: error.message || 'Something went wrong',
        ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
      });
    });
  }

  public async start(): Promise<void> {
    try {
      // Initialize database
      console.log('🔌 Initializing database connection...');
      await this.dbManager.getProvider();
      console.log('✅ Database connected successfully');

      // Start HTTP server
      this.server.listen(this.port, () => {
        console.log(`🚀 AI Town API Server running on port ${this.port}`);
        console.log(`📊 Health check: http://localhost:${this.port}/health`);
        console.log(`🔧 Database provider: ${this.dbManager.getConfig().provider}`);
        console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
        console.log(`🤖 LLM Provider: ${process.env.CUSTOM_PROVIDER_1_NAME || 'Default'}`);
      });

      // Graceful shutdown
      process.on('SIGTERM', () => this.shutdown());
      process.on('SIGINT', () => this.shutdown());

    } catch (error) {
      console.error('❌ Failed to start server:', error);
      process.exit(1);
    }
  }

  public async shutdown(): Promise<void> {
    console.log('\n🛑 Shutting down server...');
    
    try {
      // Close HTTP server
      if (this.server) {
        await new Promise<void>((resolve, reject) => {
          this.server.close((err: any) => {
            if (err) reject(err);
            else resolve();
          });
        });
      }

      // Close database connection
      await this.dbManager.disconnect();
      
      console.log('✅ Server shut down gracefully');
      process.exit(0);
    } catch (error) {
      console.error('❌ Error during shutdown:', error);
      process.exit(1);
    }
  }
}

// Start server if this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const server = new APIServer();
  server.start().catch(console.error);
}

export default APIServer;