import express from 'express';
import Joi from 'joi';
import { SecurityManager } from '../security/SecurityManager';
import { AuthenticationService, AuthenticatedRequest } from '../security/AuthenticationService';
import { DataProtectionService } from '../security/DataProtectionService';
import { Permission } from '../security/types';

const router = express.Router();

// Validation schemas
const personalDataSchema = Joi.object({
  dataType: Joi.string()
    .valid('health', 'finance', 'productivity', 'relationships', 'learning')
    .required(),
  source: Joi.string().required(),
  value: Joi.object().required(),
  timestamp: Joi.date().optional(),
});

const goalSchema = Joi.object({
  title: Joi.string().min(1).required(),
  description: Joi.string().min(1).required(),
  category: Joi.string()
    .valid('health', 'finance', 'career', 'productivity', 'learning', 'relationships')
    .required(),
  targetValue: Joi.number().required(),
  currentValue: Joi.number().default(0),
  unit: Joi.string().required(),
  deadline: Joi.date().required(),
});

export function createSecureApiRoutes(
  securityManager: SecurityManager,
  authService: AuthenticationService,
  dataProtectionService: DataProtectionService,
) {
  // Get council members (protected endpoint)
  router.get(
    '/council-members',
    authService.authenticate(),
    authService.authorize([Permission.READ_DATA, Permission.ACCESS_AI_COUNCIL]),
    async (req: AuthenticatedRequest, res: express.Response) => {
      try {
        const user = req.user!;

        // Mock council members data (in production, this would come from database)
        const councilMembers = [
          {
            _id: '1',
            playerId: user.id,
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
            playerId: user.id,
            name: 'Marcus',
            role: 'Financial Analyst',
            expertise: ['budgeting', 'investing', 'financial planning'],
            color: '#2196F3',
            dataFocus: ['finance'],
            status: 'processing',
            lastInsight: Date.now() - 7200000,
            insightCount: 8,
          },
          // ... other council members
        ];

        // Log access
        dataProtectionService.logAccess(
          user,
          'read_council_members',
          'council_members',
          'data',
          'success',
          { ipAddress: req.ip, userAgent: req.get('User-Agent') },
        );

        res.json(councilMembers);
      } catch (error) {
        console.error('Get council members error:', error);
        res.status(500).json({ error: 'Failed to fetch council members' });
      }
    },
  );

  // Get insights (protected endpoint)
  router.get(
    '/insights',
    authService.authenticate(),
    authService.authorize([Permission.READ_DATA, Permission.ACCESS_AI_COUNCIL]),
    async (req: AuthenticatedRequest, res: express.Response) => {
      try {
        const user = req.user!;
        const { category, limit = 50, offset = 0 } = req.query;

        // Mock insights data (in production, this would be filtered by user)
        let insights = [
          {
            _id: '1',
            councilMemberId: '1',
            title: 'Weekly Goal Progress Review',
            description: "You've made excellent progress on your fitness goals this week.",
            category: 'goals',
            priority: 2,
            confidence: 0.85,
            recommendations: [
              'Increase daily step goal to 8,500',
              'Add evening stretching routine',
            ],
            status: 'pending',
            createdAt: Date.now() - 3600000,
            userId: user.id,
          },
          // ... other insights
        ];

        // Filter by category if specified
        if (category) {
          insights = insights.filter((insight) => insight.category === category);
        }

        // Apply pagination
        const paginatedInsights = insights.slice(Number(offset), Number(offset) + Number(limit));

        // Log access
        dataProtectionService.logAccess(user, 'read_insights', 'insights', 'data', 'success', {
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
          category,
          limit,
          offset,
          dataAccessed: paginatedInsights.map((i) => i._id),
        });

        res.json({
          insights: paginatedInsights,
          total: insights.length,
          limit: Number(limit),
          offset: Number(offset),
        });
      } catch (error) {
        console.error('Get insights error:', error);
        res.status(500).json({ error: 'Failed to fetch insights' });
      }
    },
  );

  // Get personal data (protected and encrypted endpoint)
  router.get(
    '/personal-data',
    authService.authenticate(),
    authService.authorize([Permission.READ_DATA]),
    async (req: AuthenticatedRequest, res: express.Response) => {
      try {
        const user = req.user!;
        const { dataType, limit = 100, offset = 0 } = req.query;

        // Mock personal data (in production, this would be fetched from database and decrypted)
        let personalData = [
          {
            _id: '1',
            userId: user.id,
            dataType: 'health',
            source: 'fitbit',
            value: { steps: 7650, heartRate: 72, sleep: 7.5 },
            timestamp: Date.now() - 1800000,
            processed: true,
          },
          // ... other data entries
        ];

        // Filter by data type if specified
        if (dataType) {
          personalData = personalData.filter((data) => data.dataType === dataType);
        }

        // Apply pagination
        const paginatedData = personalData.slice(Number(offset), Number(offset) + Number(limit));

        // Log access (including specific data accessed)
        dataProtectionService.logAccess(
          user,
          'read_personal_data',
          'personal_data',
          'data',
          'success',
          {
            ipAddress: req.ip,
            userAgent: req.get('User-Agent'),
            dataType,
            limit,
            offset,
            dataAccessed: paginatedData.map((d) => d._id),
          },
        );

        res.json({
          data: paginatedData,
          total: personalData.length,
          limit: Number(limit),
          offset: Number(offset),
        });
      } catch (error) {
        console.error('Get personal data error:', error);
        res.status(500).json({ error: 'Failed to fetch personal data' });
      }
    },
  );

  // Add personal data (protected endpoint with encryption)
  router.post(
    '/personal-data',
    authService.authenticate(),
    authService.authorize([Permission.WRITE_DATA]),
    authService.validateInput(personalDataSchema),
    authService.rateLimit(50, 60 * 1000), // 50 requests per minute
    async (req: AuthenticatedRequest, res: express.Response) => {
      try {
        const user = req.user!;
        const { dataType, source, value, timestamp } = req.body;

        // Classify data
        const classification = dataProtectionService.classifyData(value, dataType);

        // Encrypt sensitive data if required
        let encryptedValue = value;
        let encryptionMetadata = null;

        if (classification.requiresEncryption) {
          const encryption = dataProtectionService.encryptData(value, user.id, dataType);
          encryptedValue = encryption.encryptedData;
          encryptionMetadata = encryption.metadata;
        }

        // Create data entry
        const newData = {
          _id: securityManager.generateSecureToken(16),
          userId: user.id,
          dataType,
          source,
          value: encryptedValue,
          encryptionMetadata,
          timestamp: timestamp || new Date(),
          processed: false,
          classification,
          createdAt: new Date(),
        };

        // Log data creation
        dataProtectionService.logAccess(
          user,
          'create_personal_data',
          newData._id,
          'personal_data',
          'success',
          {
            ipAddress: req.ip,
            userAgent: req.get('User-Agent'),
            dataType,
            source,
            encrypted: classification.requiresEncryption,
            classification: classification.level,
          },
        );

        // In production, this would be saved to database
        console.log(`New personal data created for user ${user.id}:`, newData._id);

        // Trigger data processing (async)
        setTimeout(() => {
          console.log(`Processing data entry ${newData._id} for AI insights`);
        }, 2000);

        res.status(201).json({
          message: 'Personal data added successfully',
          data: {
            _id: newData._id,
            dataType,
            source,
            timestamp: newData.timestamp,
            encrypted: classification.requiresEncryption,
          },
        });
      } catch (error) {
        console.error('Add personal data error:', error);
        res.status(500).json({ error: 'Failed to add personal data' });
      }
    },
  );

  // Get goals (protected endpoint)
  router.get(
    '/goals',
    authService.authenticate(),
    authService.authorize([Permission.READ_DATA]),
    async (req: AuthenticatedRequest, res: express.Response) => {
      try {
        const user = req.user!;
        const { status, limit = 50, offset = 0 } = req.query;

        // Mock goals data (in production, this would be filtered by user)
        let goals = [
          {
            _id: '1',
            userId: user.id,
            title: 'Daily Exercise',
            description: 'Exercise for at least 30 minutes every day',
            category: 'health',
            targetValue: 30,
            currentValue: 25,
            unit: 'minutes',
            deadline: new Date(Date.now() + 2592000000), // 30 days from now
            status: 'active',
            createdAt: new Date(Date.now() - 604800000), // 1 week ago
            updatedAt: new Date(Date.now() - 86400000), // 1 day ago
          },
          // ... other goals
        ];

        // Filter by status if specified
        if (status) {
          goals = goals.filter((goal) => goal.status === status);
        }

        // Apply pagination
        const paginatedGoals = goals.slice(Number(offset), Number(offset) + Number(limit));

        // Log access
        dataProtectionService.logAccess(user, 'read_goals', 'goals', 'data', 'success', {
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
          status,
          limit,
          offset,
          dataAccessed: paginatedGoals.map((g) => g._id),
        });

        res.json({
          goals: paginatedGoals,
          total: goals.length,
          limit: Number(limit),
          offset: Number(offset),
        });
      } catch (error) {
        console.error('Get goals error:', error);
        res.status(500).json({ error: 'Failed to fetch goals' });
      }
    },
  );

  // Create goal (protected endpoint)
  router.post(
    '/goals',
    authService.authenticate(),
    authService.authorize([Permission.WRITE_DATA]),
    authService.validateInput(goalSchema),
    authService.rateLimit(10, 60 * 1000), // 10 requests per minute
    async (req: AuthenticatedRequest, res: express.Response) => {
      try {
        const user = req.user!;
        const goalData = req.body;

        // Create goal
        const newGoal = {
          _id: securityManager.generateSecureToken(16),
          userId: user.id,
          ...goalData,
          milestones: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        // Log goal creation
        dataProtectionService.logAccess(user, 'create_goal', newGoal._id, 'goal', 'success', {
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
          category: goalData.category,
          targetValue: goalData.targetValue,
        });

        // In production, this would be saved to database
        console.log(`New goal created for user ${user.id}:`, newGoal._id);

        res.status(201).json({
          message: 'Goal created successfully',
          goal: newGoal,
        });
      } catch (error) {
        console.error('Create goal error:', error);
        res.status(500).json({ error: 'Failed to create goal' });
      }
    },
  );

  // Act on insight (protected endpoint)
  router.post(
    '/insights/:id/act',
    authService.authenticate(),
    authService.authorize([Permission.WRITE_DATA]),
    authService.rateLimit(20, 60 * 1000), // 20 requests per minute
    async (req: AuthenticatedRequest, res: express.Response) => {
      try {
        const user = req.user!;
        const { id } = req.params;
        const { action, notes } = req.body;

        // Validate action
        const validActions = ['accept', 'reject', 'defer', 'complete'];
        if (!validActions.includes(action)) {
          return res.status(400).json({
            error: 'Invalid action',
            validActions,
          });
        }

        // Mock insight lookup (in production, this would query database)
        const insight = {
          _id: id,
          userId: user.id,
          title: 'Weekly Goal Progress Review',
          status: 'pending',
        };

        if (!insight) {
          return res.status(404).json({ error: 'Insight not found' });
        }

        // Update insight status
        insight.status = action === 'complete' ? 'acted_upon' : action;

        // Log action
        dataProtectionService.logAccess(user, 'act_on_insight', id, 'insight', 'success', {
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
          action,
          notes,
        });

        res.json({
          message: `Insight ${action}d successfully`,
          insight: {
            _id: insight._id,
            status: insight.status,
            updatedAt: new Date(),
          },
        });
      } catch (error) {
        console.error('Act on insight error:', error);
        res.status(500).json({ error: 'Failed to act on insight' });
      }
    },
  );

  // Get statistics (protected endpoint)
  router.get(
    '/stats',
    authService.authenticate(),
    authService.authorize([Permission.VIEW_ANALYTICS]),
    async (req: AuthenticatedRequest, res: express.Response) => {
      try {
        const user = req.user!;

        // Mock statistics (in production, this would be calculated from real data)
        const stats = {
          dataPoints: {
            total: 150,
            health: 45,
            finance: 30,
            productivity: 25,
            relationships: 20,
            learning: 30,
          },
          insights: {
            total: 25,
            pending: 8,
            reviewed: 12,
            acted_upon: 5,
          },
          goals: {
            total: 8,
            active: 5,
            completed: 3,
            onTrack: 4,
          },
          councilActivity: {
            totalInsights: 25,
            averageConfidence: 0.82,
            lastActivity: new Date(Date.now() - 3600000),
          },
        };

        // Log access
        dataProtectionService.logAccess(
          user,
          'view_analytics',
          'statistics',
          'analytics',
          'success',
          { ipAddress: req.ip, userAgent: req.get('User-Agent') },
        );

        res.json(stats);
      } catch (error) {
        console.error('Get stats error:', error);
        res.status(500).json({ error: 'Failed to fetch statistics' });
      }
    },
  );

  // Export data (GDPR data portability)
  router.get(
    '/export',
    authService.authenticate(),
    authService.authorize([Permission.EXPORT_DATA]),
    authService.rateLimit(1, 24 * 60 * 60 * 1000), // Once per day
    async (req: AuthenticatedRequest, res: express.Response) => {
      try {
        const user = req.user!;
        const { format = 'json' } = req.query;

        // Create data subject request
        const request = dataProtectionService.createDataSubjectRequest(
          user.id,
          'portability',
          `User requested data export in ${format} format`,
        );

        // Process export
        const exportData = await dataProtectionService.processDataSubjectRequest(
          request.id,
          user.id,
        );

        // Log export
        dataProtectionService.logAccess(user, 'export_data', 'data_export', 'data', 'success', {
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
          format,
          requestId: request.id,
        });

        // Set appropriate headers
        if (format === 'csv') {
          res.setHeader('Content-Type', 'text/csv');
          res.setHeader(
            'Content-Disposition',
            `attachment; filename="ai-council-export-${user.id}.csv"`,
          );
        } else {
          res.setHeader('Content-Type', 'application/json');
          res.setHeader(
            'Content-Disposition',
            `attachment; filename="ai-council-export-${user.id}.json"`,
          );
        }

        res.send(exportData);
      } catch (error) {
        console.error('Export data error:', error);
        res.status(500).json({ error: 'Failed to export data' });
      }
    },
  );

  // Delete personal data (protected endpoint)
  router.delete(
    '/personal-data/:id',
    authService.authenticate(),
    authService.authorize([Permission.DELETE_DATA]),
    authService.rateLimit(50, 60 * 1000), // 50 requests per minute
    async (req: AuthenticatedRequest, res: express.Response) => {
      try {
        const user = req.user!;
        const { id } = req.params;

        // Mock data lookup (in production, this would query database)
        const dataEntry = {
          _id: id,
          userId: user.id,
          dataType: 'health',
        };

        if (!dataEntry) {
          return res.status(404).json({ error: 'Data entry not found' });
        }

        // Log deletion
        dataProtectionService.logAccess(
          user,
          'delete_personal_data',
          id,
          'personal_data',
          'success',
          {
            ipAddress: req.ip,
            userAgent: req.get('User-Agent'),
            dataType: dataEntry.dataType,
          },
        );

        // In production, this would delete from database
        console.log(`Personal data ${id} deleted for user ${user.id}`);

        res.json({ message: 'Personal data deleted successfully' });
      } catch (error) {
        console.error('Delete personal data error:', error);
        res.status(500).json({ error: 'Failed to delete personal data' });
      }
    },
  );

  return router;
}
