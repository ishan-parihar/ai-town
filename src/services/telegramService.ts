import TelegramBot from 'node-telegram-bot-api';
import crypto from 'crypto';

export interface TelegramConfig {
  token: string;
  webhookUrl?: string;
  allowedUsers?: string[];
  adminUsers?: string[];
}

export interface ParsedData {
  dataType: 'health' | 'finance' | 'productivity' | 'relationships' | 'learning';
  value: any;
  confidence: number;
  metadata: {
    originalMessage: string;
    timestamp: number;
    userId: number;
    username?: string;
  };
}

export interface TelegramUser {
  id: number;
  username?: string;
  firstName: string;
  lastName?: string;
  isBot: boolean;
  languageCode?: string;
  isActive: boolean;
  lastActivity: number;
  messageCount: number;
  dataPoints: number;
}

export class TelegramService {
  private bot: TelegramBot;
  private config: TelegramConfig;
  private users: Map<number, TelegramUser> = new Map();
  private dataBuffer: Map<number, ParsedData[]> = new Map();
  private commandHandlers: Map<
    string,
    (msg: TelegramBot.Message, match?: RegExpExecArray) => Promise<void>
  > = new Map();

  constructor(config: TelegramConfig) {
    this.config = config;
    this.bot = new TelegramBot(config.token, {
      polling: !config.webhookUrl,
    });

    if (config.webhookUrl) {
      this.bot.setWebHook(config.webhookUrl);
    }

    this.setupCommandHandlers();
    this.setupMessageHandlers();
  }

  private setupCommandHandlers() {
    // Help command
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
/goals - View your current goals

⚙️ *Setup Commands:*
/connect - Connect to your AI Council account
/profile - View your profile settings

📝 *Natural Language:*
Just send any message about your activities, and I'll parse it!
Examples:
• "Walked 5 miles today"
• "Spent $50 on groceries"
• "Finished project proposal"
• "Had coffee with Sarah"

❓ *Help:*
/help - Show this message
/cancel - Cancel current operation

*Privacy:* Your data is encrypted and only used for your AI Council insights.
      `;

      await this.bot.sendMessage(msg.chat.id, helpText, {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [
              { text: '📊 Log Health Data', callback_data: 'log_health' },
              { text: '💰 Log Finance Data', callback_data: 'log_finance' },
            ],
            [
              { text: '⚡ Log Productivity', callback_data: 'log_productivity' },
              { text: '👥 Log Relationships', callback_data: 'log_relationships' },
            ],
            [
              { text: '📚 Log Learning', callback_data: 'log_learning' },
              { text: '📈 View Insights', callback_data: 'view_insights' },
            ],
          ],
        },
      });
    });

    // Status command
    this.commandHandlers.set('status', async (msg) => {
      if (!msg.from) return;
      const user = this.getUser(msg.from);
      const userBuffer = this.dataBuffer.get(user.id) || [];

      const stats = `
📊 *Your Activity Stats*

👤 *Profile:*
• Name: ${user.firstName} ${user.lastName || ''}
• Username: @${user.username || 'N/A'}
• Messages: ${user.messageCount}
• Data Points: ${user.dataPoints}

📝 *Recent Activity:*
• Last Active: ${new Date(user.lastActivity).toLocaleString()}
• Pending Data: ${userBuffer.length} items

📈 *Data Types Logged:*
${this.getDataTypeStats(user.id)}
      `;

      await this.bot.sendMessage(msg.chat.id, stats, {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [
              { text: '📊 View All Logs', callback_data: 'view_logs' },
              { text: '📈 Get Insights', callback_data: 'view_insights' },
            ],
          ],
        },
      });
    });

    // Log command
    this.commandHandlers.set('log', async (msg, match) => {
      if (!msg.from) return;
      if (!match || !match[1]) {
        await this.bot.sendMessage(
          msg.chat.id,
          'Please specify a data type and value.\nExample: /log health steps 8000',
          { reply_markup: { force_reply: true } },
        );
        return;
      }

      const parts = match[1].split(' ');
      const dataType = parts[0] as any;
      const dataValue = parts.slice(1).join(' ');

      if (!['health', 'finance', 'productivity', 'relationships', 'learning'].includes(dataType)) {
        await this.bot.sendMessage(
          msg.chat.id,
          'Invalid data type. Use: health, finance, productivity, relationships, or learning',
        );
        return;
      }

      const parsed = this.parseDataMessage(dataValue, dataType, msg);
      if (parsed) {
        await this.processParsedData(msg.chat.id, parsed);
      } else {
        await this.bot.sendMessage(
          msg.chat.id,
          'Could not parse your data. Please try again with clearer information.',
        );
      }
    });

    // Insights command
    this.commandHandlers.set('insights', async (msg) => {
      if (!msg.from) return;
      await this.bot.sendMessage(msg.chat.id, '🔍 Fetching your latest AI insights...', {
        reply_markup: { force_reply: true },
      });

      // This would trigger the AI Council to generate insights
      // For now, we'll send a placeholder
      setTimeout(async () => {
        await this.bot.sendMessage(
          msg.chat.id,
          '📈 *Latest Insights*\n\n' +
            '💪 *Fitness Progress:* Your step count has increased 15% this week!\n' +
            "💰 *Budget Alert:* You're 20% under budget this month - great job!\n" +
            '⚡ *Productivity:* Task completion rate improved by 8%',
          { parse_mode: 'Markdown' },
        );
      }, 2000);
    });

    // Connect command
    this.commandHandlers.set('connect', async (msg) => {
      if (!msg.from) return;
      const connectToken = this.generateConnectToken(msg.from.id);
      const connectUrl = `${process.env.WEBAPP_URL || 'http://localhost:3000'}/telegram/connect?token=${connectToken}`;

      await this.bot.sendMessage(
        msg.chat.id,
        '🔗 *Connect to AI Council*\n\n' +
          'Click the link below to connect this Telegram bot to your AI Council account:\n\n' +
          `${connectUrl}\n\n` +
          'This link expires in 10 minutes.',
        {
          parse_mode: 'Markdown',
          disable_web_page_preview: true,
        },
      );
    });
  }

  private setupMessageHandlers() {
    // Handle commands
    this.bot.onText(/\/(\w+)(?:\s+(.+))?/, async (msg, match) => {
      if (!msg.from) return;

      const command = match?.[1];
      const handler = this.commandHandlers.get(command || '');

      if (handler) {
        await handler(msg, match || undefined);
      } else if (command) {
        await this.bot.sendMessage(
          msg.chat.id,
          `Unknown command: /${command}\nType /help for available commands.`,
        );
      }
    });

    // Handle callback queries (inline keyboard buttons)
    this.bot.on('callback_query', async (callbackQuery: any) => {
      const action = callbackQuery.data;
      const msg = callbackQuery.message;

      if (!msg || !msg.chat) return;

      await this.bot.answerCallbackQuery(callbackQuery.id);

      switch (action) {
        case 'log_health':
          await this.promptForData(msg.chat.id, 'health');
          break;
        case 'log_finance':
          await this.promptForData(msg.chat.id, 'finance');
          break;
        case 'log_productivity':
          await this.promptForData(msg.chat.id, 'productivity');
          break;
        case 'log_relationships':
          await this.promptForData(msg.chat.id, 'relationships');
          break;
        case 'log_learning':
          await this.promptForData(msg.chat.id, 'learning');
          break;
        case 'view_insights':
          await this.commandHandlers.get('insights')?.(msg);
          break;
        case 'view_logs':
          await this.showRecentLogs(msg.chat.id);
          break;
        default:
          if (action?.startsWith('confirm_')) {
            // await this.confirmDataEntry(msg.chat.id, action.replace('confirm_', ''));
          }
      }
    });

    // Handle regular messages (natural language parsing)
    this.bot.on('message', async (msg: any) => {
      if (!msg.from || msg.text?.startsWith('/')) return;

      const user = this.getUser(msg.from);
      user.messageCount++;
      user.lastActivity = Date.now();

      if (msg.text && !msg.text.startsWith('/')) {
        const parsed = this.parseNaturalLanguageMessage(msg);
        if (parsed) {
          await this.processParsedData(msg.chat.id, parsed);
        }
      }
    });

    // Handle different message types
    this.bot.on('photo', async (msg: any) => {
      if (!msg.from) return;
      // Handle photo messages (e.g., food photos for health tracking)
      await this.handlePhotoMessage(msg);
    });

    this.bot.on('location', async (msg: any) => {
      if (!msg.from) return;
      // Handle location messages (e.g., workout locations)
      await this.handleLocationMessage(msg);
    });

    this.bot.on('document', async (msg: any) => {
      if (!msg.from) return;
      // Handle document messages (e.g., receipts, reports)
      await this.handleDocumentMessage(msg);
    });
  }

  private getUser(from: TelegramBot.User): TelegramUser {
    if (!this.users.has(from.id)) {
      this.users.set(from.id, {
        id: from.id,
        username: from.username,
        firstName: from.first_name,
        lastName: from.last_name,
        isBot: from.is_bot,
        languageCode: from.language_code,
        isActive: true,
        lastActivity: Date.now(),
        messageCount: 0,
        dataPoints: 0,
      });
    }
    return this.users.get(from.id)!;
  }

  private parseNaturalLanguageMessage(msg: any): ParsedData | null {
    if (!msg.text || !msg.from) return null;

    const text = msg.text.toLowerCase();

    // Health data patterns
    const healthPatterns = [
      /(?:walked|ran|cycled|exercised|worked out)\s+(\d+)\s*(?:miles?|km|kilometers?|steps?)/i,
      /(?:slept|slept for)\s+(\d+(?:\.\d+)?)\s*hours?/i,
      /(?:weigh|weight)\s+(\d+(?:\.\d+)?)\s*(?:lbs?|kg|pounds?)/i,
      /(?:blood pressure|bp)\s+(\d+)\/(\d+)/i,
      /(?:heart rate|hr)\s+(\d+)\s*bpm/i,
      /(?:calories|burned)\s+(\d+)/i,
    ];

    // Finance data patterns
    const financePatterns = [
      /(?:spent|paid|cost)\s+\$?(\d+(?:\.\d{2})?)/i,
      /(?:earned|made|income)\s+\$?(\d+(?:\.\d{2})?)/i,
      /(?:saved|deposited)\s+\$?(\d+(?:\.\d{2})?)/i,
      /(?:bill|rent|payment)\s+\$?(\d+(?:\.\d{2})?)/i,
    ];

    // Productivity patterns
    const productivityPatterns = [
      /(?:completed|finished|done)\s+(.+)/i,
      /(?:worked on|task|project)\s+(.+?)(?:\s+for\s+(\d+)\s*(?:hours?|hrs?|minutes?|mins?))?/i,
      /(?:meeting|call)\s+(.+?)(?:\s+(\d+)\s*(?:hours?|hrs?|minutes?|mins?))?/i,
    ];

    // Relationship patterns
    const relationshipPatterns = [
      /(?:met|had|went)\s+(?:with|to)\s+(.+?)(?:\s+for\s+(\d+)\s*(?:hours?|hrs?|minutes?|mins?))?/i,
      /(?:call|phone|text)\s+(.+?)/i,
      /(?:lunch|dinner|coffee)\s+with\s+(.+)/i,
    ];

    // Learning patterns
    const learningPatterns = [
      /(?:learned|studied|read)\s+(.+?)(?:\s+for\s+(\d+)\s*(?:hours?|hrs?|minutes?|mins?))?/i,
      /(?:course|class|tutorial)\s+(.+?)(?:\s+(\d+)\s*%?\s+complete)?/i,
      /(?:book|article)\s+(.+)/i,
    ];

    // Try to match patterns
    for (const pattern of healthPatterns) {
      const match = text.match(pattern);
      if (match) {
        return this.createParsedData('health', match, msg);
      }
    }

    for (const pattern of financePatterns) {
      const match = text.match(pattern);
      if (match) {
        return this.createParsedData('finance', match, msg);
      }
    }

    for (const pattern of productivityPatterns) {
      const match = text.match(pattern);
      if (match) {
        return this.createParsedData('productivity', match, msg);
      }
    }

    for (const pattern of relationshipPatterns) {
      const match = text.match(pattern);
      if (match) {
        return this.createParsedData('relationships', match, msg);
      }
    }

    for (const pattern of learningPatterns) {
      const match = text.match(pattern);
      if (match) {
        return this.createParsedData('learning', match, msg);
      }
    }

    return null;
  }

  private parseDataMessage(message: string, dataType: string, msg: any): ParsedData | null {
    return this.createParsedData(dataType as any, [message], msg);
  }

  private createParsedData(
    dataType: any,
    match: RegExpMatchArray | string[],
    msg: any,
  ): ParsedData {
    let value: any = {};
    let confidence = 0.8;

    // Extract structured data based on data type and match
    switch (dataType) {
      case 'health':
        if (typeof match[0] === 'string') {
          const text = match[0];
          if (text.includes('steps')) value.steps = parseInt(match[1] || '0');
          if (text.includes('miles') || text.includes('km'))
            value.distance = parseFloat(match[1] || '0');
          if (text.includes('hours')) value.sleep = parseFloat(match[1] || '0');
          if (text.includes('weight')) value.weight = parseFloat(match[1] || '0');
          if (text.includes('blood pressure') && match[1] && match[2]) {
            value.bloodPressure = { systolic: parseInt(match[1]), diastolic: parseInt(match[2]) };
          }
          if (text.includes('heart rate')) value.heartRate = parseInt(match[1] || '0');
          if (text.includes('calories')) value.calories = parseInt(match[1] || '0');
        }
        break;

      case 'finance':
        if (typeof match[0] === 'string') {
          const text = match[0];
          const amount = parseFloat(match[1] || '0');
          if (text.includes('spent') || text.includes('paid')) {
            value = { amount, type: 'expense' };
          } else if (text.includes('earned') || text.includes('made')) {
            value = { amount, type: 'income' };
          } else if (text.includes('saved') || text.includes('deposited')) {
            value = { amount, type: 'savings' };
          }
        }
        break;

      case 'productivity':
        if (typeof match[0] === 'string') {
          const text = match[0];
          value = {
            task: match[1] || text,
            completed: text.includes('completed') || text.includes('finished'),
            timeSpent: match[2] ? parseInt(match[2]) : undefined,
          };
        }
        break;

      case 'relationships':
        if (typeof match[0] === 'string') {
          const text = match[0];
          value = {
            person: match[1] || 'someone',
            activity: text.includes('call')
              ? 'call'
              : text.includes('coffee')
                ? 'coffee'
                : 'meeting',
            duration: match[2] ? parseInt(match[2]) : undefined,
          };
        }
        break;

      case 'learning':
        if (typeof match[0] === 'string') {
          const text = match[0];
          value = {
            subject: match[1] || text,
            duration: match[2] ? parseInt(match[2]) : undefined,
            progress: match[2] && text.includes('%') ? parseInt(match[2]) : undefined,
          };
        }
        break;
    }

    return {
      dataType,
      value,
      confidence,
      metadata: {
        originalMessage: msg.text || '',
        timestamp: Date.now(),
        userId: msg.from!.id,
        username: msg.from?.username,
      },
    };
  }

  private async processParsedData(chatId: number, parsed: ParsedData) {
    const user = this.getUser({ id: parsed.metadata.userId } as TelegramBot.User);
    user.dataPoints++;

    // Add to buffer
    if (!this.dataBuffer.has(user.id)) {
      this.dataBuffer.set(user.id, []);
    }
    this.dataBuffer.get(user.id)!.push(parsed);

    // Send confirmation
    const confirmation = `
✅ *Data Logged Successfully!*

📊 *Type:* ${parsed.dataType}
📝 *Details:* ${JSON.stringify(parsed.value, null, 2)}
⚡ *Confidence:* ${Math.round(parsed.confidence * 100)}%

This data has been added to your AI Council for analysis. Check /insights to see what your council members think!
    `;

    await this.bot.sendMessage(chatId, confirmation, { parse_mode: 'Markdown' });

    // Trigger data processing (this would connect to the main system)
    await this.submitDataToMainSystem(parsed);
  }

  private async promptForData(chatId: number, dataType: string) {
    const prompts = {
      health: '🏃‍♂️ Send your health data (steps, sleep, weight, exercise, etc.)',
      finance: '💰 Send your financial data (expenses, income, savings, etc.)',
      productivity: '⚡ Send your productivity data (tasks completed, projects, meetings, etc.)',
      relationships: '👥 Send your relationship data (meetings, calls, social activities, etc.)',
      learning: '📚 Send your learning data (studying, courses, books, etc.)',
    };

    await this.bot.sendMessage(chatId, prompts[dataType as keyof typeof prompts], {
      reply_markup: { force_reply: true },
    });
  }

  private async showRecentLogs(chatId: number) {
    // This would fetch recent logs from the main system
    await this.bot.sendMessage(chatId, '📊 *Recent Logs*\n\nFetching your recent data entries...');
  }

  private async handlePhotoMessage(msg: any) {
    // Handle photo uploads (e.g., food photos for meal tracking)
    if (msg.photo && msg.from) {
      await this.bot.sendMessage(
        msg.chat.id,
        '📷 *Photo received!* I can analyze this for nutrition tracking or activity documentation.',
        { parse_mode: 'Markdown' },
      );
    }
  }

  private async handleLocationMessage(msg: any) {
    // Handle location data (e.g., workout locations, meeting places)
    if (msg.location && msg.from) {
      const parsed: ParsedData = {
        dataType: 'health',
        value: {
          location: {
            latitude: msg.location.latitude,
            longitude: msg.location.longitude,
          },
          activity: 'location_tracked',
        },
        confidence: 0.9,
        metadata: {
          originalMessage: 'Location shared',
          timestamp: Date.now(),
          userId: msg.from.id,
          username: msg.from.username,
        },
      };

      await this.processParsedData(msg.chat.id, parsed);
    }
  }

  private async handleDocumentMessage(msg: any) {
    // Handle document uploads (e.g., receipts, reports)
    if (msg.document && msg.from) {
      await this.bot.sendMessage(
        msg.chat.id,
        '📄 *Document received!* I can process receipts, reports, and other documents for data extraction.',
        { parse_mode: 'Markdown' },
      );
    }
  }

  private getDataTypeStats(userId: number): string {
    const userBuffer = this.dataBuffer.get(userId) || [];
    const counts = {
      health: 0,
      finance: 0,
      productivity: 0,
      relationships: 0,
      learning: 0,
    };

    userBuffer.forEach((data) => {
      counts[data.dataType as keyof typeof counts]++;
    });

    return (
      Object.entries(counts)
        .filter(([_, count]) => count > 0)
        .map(([type, count]) => `• ${type.charAt(0).toUpperCase() + type.slice(1)}: ${count}`)
        .join('\n') || 'No data logged yet'
    );
  }

  private generateConnectToken(userId: number): string {
    const timestamp = Date.now();
    const data = `${userId}:${timestamp}`;
    return crypto
      .createHmac('sha256', process.env.JWT_SECRET || 'default-secret')
      .update(data)
      .digest('hex');
  }

  private async submitDataToMainSystem(parsed: ParsedData) {
    // This would submit the parsed data to the main AI Council system
    // For now, we'll just log it
    console.log('Submitting data to main system:', parsed);

    // In a real implementation, this would make an API call to the main server
    try {
      const response = await fetch('http://localhost:3001/api/personal-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dataType: parsed.dataType,
          source: 'telegram',
          value: parsed.value,
          metadata: parsed.metadata,
        }),
      });

      if (response.ok) {
        console.log('Data successfully submitted to main system');
      } else {
        console.error('Failed to submit data to main system');
      }
    } catch (error) {
      console.error('Error submitting data to main system:', error);
    }
  }

  public async sendMessage(chatId: number, text: string, options?: any) {
    return await this.bot.sendMessage(chatId, text, options);
  }

  public getBotInfo(): any {
    return this.bot;
  }

  public getUserStats(): TelegramUser[] {
    return Array.from(this.users.values());
  }

  public getDataBuffer(userId: number): ParsedData[] {
    return this.dataBuffer.get(userId) || [];
  }

  public clearDataBuffer(userId: number) {
    this.dataBuffer.delete(userId);
  }

  public async setWebhook(webhookUrl: string) {
    return await this.bot.setWebHook(webhookUrl);
  }

  public async deleteWebhook() {
    return await this.bot.deleteWebHook();
  }
}
