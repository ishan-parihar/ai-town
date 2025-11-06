import express from 'express';
import { NotionService } from '../services/notionService.js';

const router = express.Router();

let notionCredentials = null;
let notionService = null;

/**
 * POST /api/notion/connect
 * Store and test Notion API credentials
 */
router.post('/connect', async (req, res) => {
  try {
    const { apiKey } = req.body;

    if (!apiKey) {
      return res.status(400).json({
        error: 'API key is required',
      });
    }

    notionService = new NotionService();
    const success = await notionService.initialize({ apiKey });

    if (!success) {
      notionService = null;
      notionCredentials = null;
      return res.status(401).json({
        error: 'Invalid Notion API key or connection failed',
      });
    }

    notionCredentials = { apiKey };

    res.json({
      success: true,
      message: 'Successfully connected to Notion workspace',
    });
  } catch (error) {
    console.error('Notion connection error:', error);
    res.status(500).json({
      error: 'Failed to connect to Notion workspace',
    });
  }
});

/**
 * GET /api/notion/status
 * Check if Notion is connected and credentials are valid
 */
router.get('/status', async (req, res) => {
  try {
    if (!notionService || !notionCredentials) {
      return res.json({
        connected: false,
        message: 'Not connected to Notion',
      });
    }

    const isValid = await notionService.testConnection();

    if (!isValid) {
      notionService = null;
      notionCredentials = null;
      return res.json({
        connected: false,
        message: 'Notion connection lost',
      });
    }

    res.json({
      connected: true,
      message: 'Connected to Notion workspace',
    });
  } catch (error) {
    console.error('Notion status check error:', error);
    res.status(500).json({
      error: 'Failed to check Notion connection status',
    });
  }
});

/**
 * GET /api/notion/databases
 * Get all accessible databases
 */
router.get('/databases', async (req, res) => {
  try {
    if (!notionService) {
      return res.status(401).json({
        error: 'Not connected to Notion. Please connect first.',
      });
    }

    const databases = await notionService.getDatabases();

    const relevantDatabases = databases.filter((db) => {
      const title = db.title.toLowerCase();
      const description = db.description?.toLowerCase() || '';

      const relevantKeywords = [
        'task',
        'project',
        'goal',
        'todo',
        'habit',
        'routine',
        'schedule',
        'learning',
        'study',
        'course',
        'skill',
        'knowledge',
        'note',
        'health',
        'fitness',
        'workout',
        'exercise',
        'wellness',
        'finance',
        'budget',
        'expense',
        'income',
        'investment',
        'journal',
        'diary',
        'log',
        'tracker',
        'planner',
      ];

      return relevantKeywords.some(
        (keyword) => title.includes(keyword) || description.includes(keyword),
      );
    });

    res.json(relevantDatabases);
  } catch (error) {
    console.error('Failed to fetch Notion databases:', error);
    res.status(500).json({
      error: 'Failed to fetch databases from Notion',
    });
  }
});

/**
 * POST /api/notion/sync-database
 * Sync data from a specific database
 */
router.post('/sync-database', async (req, res) => {
  try {
    if (!notionService) {
      return res.status(401).json({
        error: 'Not connected to Notion. Please connect first.',
      });
    }

    const { databaseId, dataType, pageSize = 50 } = req.body;

    if (!databaseId) {
      return res.status(400).json({
        error: 'Database ID is required',
      });
    }

    if (
      !dataType ||
      !['health', 'finance', 'productivity', 'relationships', 'learning'].includes(dataType)
    ) {
      return res.status(400).json({
        error:
          'Valid data type is required (health, finance, productivity, relationships, learning)',
      });
    }

    let allPages = [];
    let hasMore = true;
    let nextCursor;
    let pageCount = 0;
    const maxPages = 100;

    while (hasMore && pageCount < maxPages) {
      const result = await notionService.getDatabasePages(databaseId, pageSize, nextCursor);

      const personalDataItems = result.pages.map((page) =>
        NotionService.convertToPersonalData(page, dataType),
      );

      allPages.push(...personalDataItems);
      hasMore = result.hasMore;
      nextCursor = result.nextCursor;
      pageCount++;
    }

    res.json({
      success: true,
      message: `Successfully synced ${allPages.length} items from Notion database`,
      data: allPages,
      stats: {
        totalItems: allPages.length,
        databaseId,
        dataType,
        pagesProcessed: pageCount,
      },
    });
  } catch (error) {
    console.error('Failed to sync Notion database:', error);
    res.status(500).json({
      error: 'Failed to sync data from Notion database',
    });
  }
});

/**
 * GET /api/notion/database/:id/preview
 * Preview data from a database without importing
 */
router.get('/database/:id/preview', async (req, res) => {
  try {
    if (!notionService) {
      return res.status(401).json({
        error: 'Not connected to Notion. Please connect first.',
      });
    }

    const databaseId = req.params.id;
    const limit = parseInt(req.query.limit) || 5;

    const result = await notionService.getDatabasePages(databaseId, limit);

    const preview = result.pages.map((page) => ({
      id: page.id,
      title: page.title,
      createdTime: page.createdTime,
      lastEditedTime: page.lastEditedTime,
      properties: Object.keys(page.properties).slice(0, 5),
      hasContent: page.content.length > 0,
    }));

    res.json({
      databaseId,
      preview,
      hasMore: result.hasMore,
      totalFetched: preview.length,
    });
  } catch (error) {
    console.error('Failed to preview Notion database:', error);
    res.status(500).json({
      error: 'Failed to preview database from Notion',
    });
  }
});

/**
 * POST /api/notion/disconnect
 * Disconnect from Notion and clear credentials
 */
router.post('/disconnect', (req, res) => {
  try {
    if (notionService) {
      notionService.cleanup();
    }

    notionService = null;
    notionCredentials = null;

    res.json({
      success: true,
      message: 'Successfully disconnected from Notion workspace',
    });
  } catch (error) {
    console.error('Notion disconnect error:', error);
    res.status(500).json({
      error: 'Failed to disconnect from Notion workspace',
    });
  }
});

/**
 * GET /api/notion/data-types
 * Get suggested data types for a database based on its properties
 */
router.get('/database/:id/data-types', async (req, res) => {
  try {
    if (!notionService) {
      return res.status(401).json({
        error: 'Not connected to Notion. Please connect first.',
      });
    }

    const databaseId = req.params.id;
    const databases = await notionService.getDatabases();
    const database = databases.find((db) => db.id === databaseId);

    if (!database) {
      return res.status(404).json({
        error: 'Database not found',
      });
    }

    const propertyNames = Object.keys(database.properties).map((key) => key.toLowerCase());
    const title = database.title.toLowerCase();
    const description = database.description?.toLowerCase() || '';

    const suggestions = [];

    if (
      propertyNames.some((p) =>
        ['task', 'project', 'todo', 'status', 'priority', 'due'].includes(p),
      ) ||
      title.includes('task') ||
      title.includes('project') ||
      title.includes('todo')
    ) {
      suggestions.push('productivity');
    }

    if (
      propertyNames.some((p) =>
        ['course', 'skill', 'learning', 'study', 'progress', 'topic'].includes(p),
      ) ||
      title.includes('learning') ||
      title.includes('course') ||
      title.includes('skill')
    ) {
      suggestions.push('learning');
    }

    if (
      propertyNames.some((p) =>
        ['workout', 'exercise', 'health', 'fitness', 'weight', 'sleep'].includes(p),
      ) ||
      title.includes('health') ||
      title.includes('fitness') ||
      title.includes('workout')
    ) {
      suggestions.push('health');
    }

    if (
      propertyNames.some((p) =>
        ['amount', 'expense', 'income', 'budget', 'price', 'cost'].includes(p),
      ) ||
      title.includes('finance') ||
      title.includes('budget') ||
      title.includes('expense')
    ) {
      suggestions.push('finance');
    }

    if (
      propertyNames.some((p) =>
        ['contact', 'meeting', 'relationship', 'person', 'network'].includes(p),
      ) ||
      title.includes('contact') ||
      title.includes('relationship') ||
      title.includes('network')
    ) {
      suggestions.push('relationships');
    }

    if (suggestions.length === 0) {
      suggestions.push('productivity', 'learning');
    }

    res.json({
      databaseId,
      suggestedDataTypes: suggestions,
      confidence: suggestions.length > 1 ? 'high' : 'medium',
      analysis: {
        propertyCount: Object.keys(database.properties).length,
        title: database.title,
        description: database.description,
      },
    });
  } catch (error) {
    console.error('Failed to analyze Notion database:', error);
    res.status(500).json({
      error: 'Failed to analyze database for data type suggestions',
    });
  }
});

export default router;
