import { Router, Request, Response, NextFunction } from 'express';
import { DataSynchronizationService } from '../services/dataSynchronizationService.js';
import { OAuthService } from '../security/OAuthService.js';
import { body, query, validationResult } from 'express-validator';

export function createDataSyncRoutes(
  dataSyncService: DataSynchronizationService,
  oauthService: OAuthService,
): Router {
  const router = Router();

  // Middleware to validate requests
  const handleValidationErrors = (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
      });
    }
    next();
  };

  // Get all sync providers
  router.get('/providers', (req: Request, res: Response) => {
    try {
      const providers = dataSyncService.getAllProviders().map((provider) => ({
        id: provider.id,
        name: provider.name,
      }));

      res.json({
        success: true,
        data: providers,
      });
    } catch (error) {
      console.error('Error fetching sync providers:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch sync providers',
      });
    }
  });

  // Get sync jobs for a user
  router.get(
    '/jobs',
    [query('userId').notEmpty().withMessage('User ID is required')],
    handleValidationErrors,
    (req: Request, res: Response) => {
      try {
        const { userId } = req.query as { userId: string };
        const jobs = dataSyncService.getUserJobs(userId);

        res.json({
          success: true,
          data: jobs,
        });
      } catch (error) {
        console.error('Error fetching sync jobs:', error);
        res.status(500).json({
          success: false,
          message: 'Failed to fetch sync jobs',
        });
      }
    },
  );

  // Get specific sync job
  router.get('/jobs/:jobId', (req: Request, res: Response) => {
    try {
      const { jobId } = req.params;
      const job = dataSyncService.getJob(jobId);

      if (!job) {
        return res.status(404).json({
          success: false,
          message: 'Sync job not found',
        });
      }

      res.json({
        success: true,
        data: job,
      });
    } catch (error) {
      console.error('Error fetching sync job:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch sync job',
      });
    }
  });

  // Create new sync job
  router.post(
    '/jobs',
    [
      body('connectionId').notEmpty().withMessage('Connection ID is required'),
      body('serviceType').notEmpty().withMessage('Service type is required'),
      body('userId').notEmpty().withMessage('User ID is required'),
      body('config.interval').notEmpty().withMessage('Interval is required'),
      body('config.enabled').isBoolean().withMessage('Enabled must be boolean'),
      body('config.maxRetries')
        .isInt({ min: 0, max: 10 })
        .withMessage('Max retries must be between 0 and 10'),
      body('config.batchSize')
        .isInt({ min: 1, max: 1000 })
        .withMessage('Batch size must be between 1 and 1000'),
      body('config.syncWindow')
        .isInt({ min: 1, max: 168 })
        .withMessage('Sync window must be between 1 and 168 hours'),
    ],
    handleValidationErrors,
    async (req: Request, res: Response) => {
      try {
        const { connectionId, serviceType, userId, config } = req.body;

        // Verify connection exists and is active
        const connection = oauthService.getConnection(connectionId);
        if (!connection) {
          return res.status(404).json({
            success: false,
            message: 'OAuth connection not found',
          });
        }

        if (!connection.isActive) {
          return res.status(400).json({
            success: false,
            message: 'OAuth connection is not active',
          });
        }

        // Get provider ID from connection
        const providerId = connection.providerId;

        // Create sync job
        const job = dataSyncService.createSyncJob(
          connectionId,
          providerId,
          userId,
          serviceType,
          config,
        );

        res.status(201).json({
          success: true,
          message: 'Sync job created successfully',
          data: job,
        });
      } catch (error) {
        console.error('Error creating sync job:', error);
        res.status(500).json({
          success: false,
          message: 'Failed to create sync job',
        });
      }
    },
  );

  // Update sync job
  router.put(
    '/jobs/:jobId',
    [body('config').optional().isObject().withMessage('Config must be an object')],
    handleValidationErrors,
    (req: Request, res: Response) => {
      try {
        const { jobId } = req.params;
        const updates = req.body;

        const updated = dataSyncService.updateJob(jobId, updates);

        if (!updated) {
          return res.status(404).json({
            success: false,
            message: 'Sync job not found',
          });
        }

        const job = dataSyncService.getJob(jobId);

        res.json({
          success: true,
          message: 'Sync job updated successfully',
          data: job,
        });
      } catch (error) {
        console.error('Error updating sync job:', error);
        res.status(500).json({
          success: false,
          message: 'Failed to update sync job',
        });
      }
    },
  );

  // Delete sync job
  router.delete('/jobs/:jobId', (req: Request, res: Response) => {
    try {
      const { jobId } = req.params;
      const deleted = dataSyncService.deleteJob(jobId);

      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: 'Sync job not found',
        });
      }

      res.json({
        success: true,
        message: 'Sync job deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting sync job:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete sync job',
      });
    }
  });

  // Execute sync job manually
  router.post('/jobs/:jobId/execute', async (req: Request, res: Response) => {
    try {
      const { jobId } = req.params;

      const job = dataSyncService.getJob(jobId);
      if (!job) {
        return res.status(404).json({
          success: false,
          message: 'Sync job not found',
        });
      }

      if (job.status === 'running') {
        return res.status(400).json({
          success: false,
          message: 'Sync job is already running',
        });
      }

      // Execute the sync job
      const result = await dataSyncService.executeSyncJob(jobId);

      res.json({
        success: true,
        message: 'Sync job executed successfully',
        data: result,
      });
    } catch (error) {
      console.error('Error executing sync job:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to execute sync job',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // Pause sync job
  router.post('/jobs/:jobId/pause', (req: Request, res: Response) => {
    try {
      const { jobId } = req.params;
      const paused = dataSyncService.pauseJob(jobId);

      if (!paused) {
        return res.status(404).json({
          success: false,
          message: 'Sync job not found or not scheduled',
        });
      }

      res.json({
        success: true,
        message: 'Sync job paused successfully',
      });
    } catch (error) {
      console.error('Error pausing sync job:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to pause sync job',
      });
    }
  });

  // Resume sync job
  router.post('/jobs/:jobId/resume', (req: Request, res: Response) => {
    try {
      const { jobId } = req.params;
      const resumed = dataSyncService.resumeJob(jobId);

      if (!resumed) {
        return res.status(404).json({
          success: false,
          message: 'Sync job not found or already enabled',
        });
      }

      res.json({
        success: true,
        message: 'Sync job resumed successfully',
      });
    } catch (error) {
      console.error('Error resuming sync job:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to resume sync job',
      });
    }
  });

  // Get sync statistics
  router.get('/stats', (req: Request, res: Response) => {
    try {
      const stats = dataSyncService.getSyncStats();

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      console.error('Error fetching sync stats:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch sync statistics',
      });
    }
  });

  // Get jobs for a specific connection
  router.get('/connections/:connectionId/jobs', (req: Request, res: Response) => {
    try {
      const { connectionId } = req.params;
      const jobs = dataSyncService.getConnectionJobs(connectionId);

      res.json({
        success: true,
        data: jobs,
      });
    } catch (error) {
      console.error('Error fetching connection sync jobs:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch connection sync jobs',
      });
    }
  });

  // Cleanup old jobs
  router.post(
    '/cleanup',
    [
      body('olderThanDays')
        .optional()
        .isInt({ min: 1, max: 365 })
        .withMessage('Older than days must be between 1 and 365'),
    ],
    handleValidationErrors,
    (req: Request, res: Response) => {
      try {
        const { olderThanDays } = req.body;
        const deletedCount = dataSyncService.cleanupOldJobs(olderThanDays);

        res.json({
          success: true,
          message: `Cleaned up ${deletedCount} old sync jobs`,
          data: { deletedCount },
        });
      } catch (error) {
        console.error('Error cleaning up sync jobs:', error);
        res.status(500).json({
          success: false,
          message: 'Failed to cleanup sync jobs',
        });
      }
    },
  );

  // Test sync provider
  router.post('/providers/:providerId/test', async (req: Request, res: Response) => {
    try {
      const { providerId } = req.params;
      const { connectionId } = req.body;

      if (!connectionId) {
        return res.status(400).json({
          success: false,
          message: 'Connection ID is required for testing',
        });
      }

      const provider = dataSyncService.getProvider(providerId);
      if (!provider) {
        return res.status(404).json({
          success: false,
          message: 'Sync provider not found',
        });
      }

      // Test the provider by fetching a small amount of data
      const testData = await provider.fetch(connectionId, {
        batchSize: 5,
        syncWindow: 1,
      });

      res.json({
        success: true,
        message: 'Provider test successful',
        data: {
          providerId,
          recordsFetched: testData.length,
          sampleData: testData.slice(0, 2), // Return first 2 records as sample
        },
      });
    } catch (error) {
      console.error('Error testing sync provider:', error);
      res.status(500).json({
        success: false,
        message: 'Provider test failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  return router;
}
