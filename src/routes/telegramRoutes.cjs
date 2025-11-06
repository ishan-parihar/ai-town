const express = require('express');
const rateLimit = require('express-rate-limit');
const crypto = require('crypto');

// Note: This is a simplified version for demo purposes
// In production, you would compile TypeScript to JavaScript

class TelegramService {
  constructor(config) {
    this.config = config;
    this.users = new Map();
    this.dataBuffer = new Map();
    this.commandHandlers = new Map();

    // Mock bot for demo
    this.bot = {
      sendMessage: async (chatId, text, options = {}) => {
        console.log(`Mock Telegram: Sending to ${chatId}: ${text}`);
        return { ok: true };
      },
      setWebHook: async (url) => {
        console.log(`Mock Telegram: Setting webhook to ${url}`);
        return { ok: true };
      },
      deleteWebHook: async () => {
        console.log('Mock Telegram: Deleting webhook');
        return { ok: true };
      },
    };

    this.setupCommandHandlers();
  }

  setupCommandHandlers() {
    this.commandHandlers.set('help', async (msg) => {
      const helpText = `
🤖 *AI Council LifeOS Bot Commands*

📊 *Data Logging Commands:*
/log [type] [data] - Quick data logging
• Types: health, finance, productivity, relationships, learning
• Example: /log health steps 8000 calories 2000

📈 *Insight Commands:*
/insights - Get latest AI insights
/status - Show your recent logs and stats

📝 *Natural Language:*
Just send any message about your activities, and I'll parse it!
Examples:
• "Walked 5 miles today"
• "Spent $50 on groceries"
• "Finished project proposal"

❓ *Help:*
/help - Show this message
      `;

      await this.bot.sendMessage(msg.chat.id, helpText, {
        parse_mode: 'Markdown',
      });
    });

    this.commandHandlers.set('status', async (msg) => {
      const stats = `
📊 *Your Activity Stats*

👤 *Profile:*
• Name: ${msg.from.first_name || 'User'}
• Username: @${msg.from.username || 'N/A'}
• Messages: 10
• Data Points: 5

📝 *Recent Activity:*
• Last Active: ${new Date().toLocaleString()}
• Pending Data: 2 items
      `;

      await this.bot.sendMessage(msg.chat.id, stats, {
        parse_mode: 'Markdown',
      });
    });
  }

  async sendMessage(chatId, text, options) {
    return await this.bot.sendMessage(chatId, text, options);
  }

  getUserStats() {
    return Array.from(this.users.values());
  }

  getDataBuffer(userId) {
    return this.dataBuffer.get(userId) || [];
  }

  clearDataBuffer(userId) {
    this.dataBuffer.delete(userId);
  }

  async setWebhook(webhookUrl) {
    return await this.bot.setWebHook(webhookUrl);
  }

  async deleteWebhook() {
    return await this.bot.deleteWebHook();
  }
}

const router = express.Router();

// Rate limiting for Telegram endpoints
const telegramRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Store active Telegram bots
const telegramBots = new Map();

// Middleware to verify Telegram webhook
const verifyTelegramWebhook = (req, res, next) => {
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (secret) {
    const signature = req.headers['x-telegram-bot-api-secret-token'];
    if (!signature) {
      return res.status(401).json({ error: 'Missing signature' });
    }

    const hash = crypto.createHmac('sha256', secret).update(JSON.stringify(req.body)).digest('hex');

    if (hash !== signature) {
      return res.status(401).json({ error: 'Invalid signature' });
    }
  }
  next();
};

// Register a new Telegram bot
router.post('/register', telegramRateLimit, async (req, res) => {
  try {
    const { token, name, webhookUrl } = req.body;

    if (!token) {
      return res.status(400).json({ error: 'Bot token is required' });
    }

    // Check if bot already exists
    if (telegramBots.has(token)) {
      return res.status(409).json({ error: 'Bot already registered' });
    }

    // Create new Telegram service
    const config = {
      token,
      webhookUrl:
        webhookUrl || `${req.protocol}://${req.get('host')}/api/telegram/webhook/${token}`,
      allowedUsers: req.body.allowedUsers || [],
      adminUsers: req.body.adminUsers || [],
    };

    const telegramService = new TelegramService(config);

    // Store the bot
    telegramBots.set(token, {
      service: telegramService,
      name: name || 'Unnamed Bot',
      registeredAt: new Date().toISOString(),
      webhookUrl: config.webhookUrl,
      isActive: true,
    });

    console.log(`Telegram bot registered: ${name}`);

    res.json({
      message: 'Bot registered successfully',
      bot: {
        name: name || 'Unnamed Bot',
        webhookUrl: config.webhookUrl,
        registeredAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Error registering Telegram bot:', error);
    res.status(500).json({ error: 'Failed to register bot' });
  }
});

// Handle webhook updates from Telegram
router.post('/webhook/:token', verifyTelegramWebhook, telegramRateLimit, async (req, res) => {
  try {
    const token = req.params.token;
    const botInfo = telegramBots.get(token);

    if (!botInfo || !botInfo.isActive) {
      return res.status(404).json({ error: 'Bot not found or inactive' });
    }

    console.log(`Received webhook update for bot: ${botInfo.name}`);

    res.json({ status: 'ok' });
  } catch (error) {
    console.error('Error handling Telegram webhook:', error);
    res.status(500).json({ error: 'Failed to process webhook' });
  }
});

// Unregister a Telegram bot
router.delete('/unregister/:token', telegramRateLimit, async (req, res) => {
  try {
    const token = req.params.token;
    const botInfo = telegramBots.get(token);

    if (!botInfo) {
      return res.status(404).json({ error: 'Bot not found' });
    }

    // Delete webhook and clean up
    await botInfo.service.deleteWebhook();
    telegramBots.delete(token);

    console.log(`Telegram bot unregistered: ${botInfo.name}`);

    res.json({ message: 'Bot unregistered successfully' });
  } catch (error) {
    console.error('Error unregistering Telegram bot:', error);
    res.status(500).json({ error: 'Failed to unregister bot' });
  }
});

// Get list of registered bots
router.get('/bots', telegramRateLimit, async (req, res) => {
  try {
    const bots = Array.from(telegramBots.entries()).map(([token, info]) => ({
      name: info.name,
      token: token.substring(0, 10) + '...',
      webhookUrl: info.webhookUrl,
      registeredAt: info.registeredAt,
      isActive: info.isActive,
      userCount: info.service.getUserStats().length,
    }));

    res.json({ bots });
  } catch (error) {
    console.error('Error fetching Telegram bots:', error);
    res.status(500).json({ error: 'Failed to fetch bots' });
  }
});

// Get bot statistics
router.get('/stats/:token', telegramRateLimit, async (req, res) => {
  try {
    const token = req.params.token;
    const botInfo = telegramBots.get(token);

    if (!botInfo) {
      return res.status(404).json({ error: 'Bot not found' });
    }

    const userStats = botInfo.service.getUserStats();
    const totalMessages = userStats.reduce((sum, user) => sum + (user.messageCount || 0), 0);
    const totalDataPoints = userStats.reduce((sum, user) => sum + (user.dataPoints || 0), 0);

    res.json({
      bot: {
        name: botInfo.name,
        registeredAt: botInfo.registeredAt,
        isActive: botInfo.isActive,
      },
      stats: {
        totalUsers: userStats.length,
        totalMessages,
        totalDataPoints,
        activeUsers: userStats.filter(
          (user) => Date.now() - (user.lastActivity || 0) < 24 * 60 * 60 * 1000,
        ).length,
      },
      users: userStats.map((user) => ({
        id: user.id,
        username: user.username,
        firstName: user.firstName,
        messageCount: user.messageCount || 0,
        dataPoints: user.dataPoints || 0,
        lastActivity: user.lastActivity || Date.now(),
        isActive: user.isActive || true,
      })),
    });
  } catch (error) {
    console.error('Error fetching Telegram bot stats:', error);
    res.status(500).json({ error: 'Failed to fetch bot statistics' });
  }
});

// Send message to user
router.post('/send/:token', telegramRateLimit, async (req, res) => {
  try {
    const token = req.params.token;
    const { userId, message, options } = req.body;

    if (!userId || !message) {
      return res.status(400).json({ error: 'userId and message are required' });
    }

    const botInfo = telegramBots.get(token);
    if (!botInfo) {
      return res.status(404).json({ error: 'Bot not found' });
    }

    await botInfo.service.sendMessage(parseInt(userId), message, options);

    res.json({ message: 'Message sent successfully' });
  } catch (error) {
    console.error('Error sending Telegram message:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// Get user data buffer
router.get('/data/:token/:userId', telegramRateLimit, async (req, res) => {
  try {
    const token = req.params.token;
    const userId = parseInt(req.params.userId);

    const botInfo = telegramBots.get(token);
    if (!botInfo) {
      return res.status(404).json({ error: 'Bot not found' });
    }

    const dataBuffer = botInfo.service.getDataBuffer(userId);

    res.json({
      userId,
      dataCount: dataBuffer.length,
      data: dataBuffer,
    });
  } catch (error) {
    console.error('Error fetching user data buffer:', error);
    res.status(500).json({ error: 'Failed to fetch user data' });
  }
});

// Clear user data buffer
router.delete('/data/:token/:userId', telegramRateLimit, async (req, res) => {
  try {
    const token = req.params.token;
    const userId = parseInt(req.params.userId);

    const botInfo = telegramBots.get(token);
    if (!botInfo) {
      return res.status(404).json({ error: 'Bot not found' });
    }

    botInfo.service.clearDataBuffer(userId);

    res.json({ message: 'User data buffer cleared successfully' });
  } catch (error) {
    console.error('Error clearing user data buffer:', error);
    res.status(500).json({ error: 'Failed to clear user data' });
  }
});

module.exports = router;
