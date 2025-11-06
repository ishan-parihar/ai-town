import { Client } from '@notionhq/client';
export class NotionService {
    constructor() {
        this.client = null;
        this.credentials = null;
    }
    async initialize(credentials) {
        try {
            this.credentials = credentials;
            this.client = new Client({ auth: credentials.apiKey });
            await this.client.users.me({});
            return true;
        }
        catch (error) {
            console.error('Failed to initialize Notion client:', error);
            this.client = null;
            this.credentials = null;
            return false;
        }
    }
    async testConnection() {
        if (!this.client)
            return false;
        try {
            await this.client.users.me({});
            return true;
        }
        catch (error) {
            console.error('Notion connection test failed:', error);
            return false;
        }
    }
    async getDatabases() {
        if (!this.client) {
            throw new Error('Notion client not initialized');
        }
        try {
            const searchResponse = await this.client.search({
                filter: {
                    value: 'database',
                    property: 'object',
                },
                page_size: 50,
            });
            const databases = [];
            for (const result of searchResponse.results) {
                if ('properties' in result) {
                    const database = result;
                    databases.push({
                        id: database.id,
                        title: this.extractTitle(database.title),
                        description: database.description?.[0]?.plain_text || '',
                        url: database.url,
                        properties: database.properties,
                    });
                }
            }
            return databases;
        }
        catch (error) {
            console.error('Failed to fetch databases:', error);
            throw new Error('Failed to fetch Notion databases');
        }
    }
    async getDatabasePages(databaseId, pageSize = 50, startCursor) {
        if (!this.client) {
            throw new Error('Notion client not initialized');
        }
        try {
            const query = {
                database_id: databaseId,
                page_size: pageSize,
            };
            if (startCursor) {
                query.start_cursor = startCursor;
            }
            // Use a different approach to query the database
            const response = await this.client.databases.query(query);
            const pages = [];
            for (const page of response.results) {
                if (page.object === 'page') {
                    const pageData = await this.processPage(page);
                    pages.push(pageData);
                }
            }
            return {
                pages,
                hasMore: response.has_more,
                nextCursor: response.next_cursor || undefined,
            };
        }
        catch (error) {
            console.error('Failed to fetch database pages:', error);
            throw new Error('Failed to fetch pages from Notion database');
        }
    }
    async processPage(page) {
        const title = this.extractPageTitle(page);
        const content = await this.getPageContent(page.id);
        const processedProperties = this.processProperties(page.properties);
        return {
            id: page.id,
            title,
            properties: processedProperties,
            content,
            url: page.url,
            createdTime: page.created_time,
            lastEditedTime: page.last_edited_time,
        };
    }
    async getPageContent(pageId) {
        if (!this.client)
            return '';
        try {
            const blocks = await this.client.blocks.children.list({
                block_id: pageId,
                page_size: 100,
            });
            const contentParts = [];
            for (const block of blocks.results) {
                const blockText = this.extractTextFromBlock(block);
                if (blockText) {
                    contentParts.push(blockText);
                }
            }
            return contentParts.join('\n\n');
        }
        catch (error) {
            console.error('Failed to get page content:', error);
            return '';
        }
    }
    extractTextFromBlock(block) {
        switch (block.type) {
            case 'paragraph':
                return this.extractRichText(block.paragraph.text);
            case 'heading_1':
                return `# ${this.extractRichText(block.heading_1.text)}`;
            case 'heading_2':
                return `## ${this.extractRichText(block.heading_2.text)}`;
            case 'heading_3':
                return `### ${this.extractRichText(block.heading_3.text)}`;
            case 'bulleted_list_item':
                return `• ${this.extractRichText(block.bulleted_list_item.text)}`;
            case 'numbered_list_item':
                return `${this.extractRichText(block.numbered_list_item.text)}`;
            case 'to_do':
                const checked = block.to_do.checked ? '✓' : '○';
                return `${checked} ${this.extractRichText(block.to_do.text)}`;
            case 'toggle':
                return `📂 ${this.extractRichText(block.toggle.text)}`;
            case 'quote':
                return `> ${this.extractRichText(block.quote.text)}`;
            case 'divider':
                return '---';
            case 'callout':
                return `💡 ${this.extractRichText(block.callout.text)}`;
            default:
                return '';
        }
    }
    extractRichText(richText) {
        if (!richText || !Array.isArray(richText))
            return '';
        return richText.map((text) => text.plain_text).join('');
    }
    extractTitle(titleProperty) {
        if (!titleProperty || !Array.isArray(titleProperty) || titleProperty.length === 0) {
            return 'Untitled';
        }
        return titleProperty[0]?.plain_text || 'Untitled';
    }
    extractPageTitle(page) {
        const properties = page.properties;
        const titleProperties = ['Name', 'Title', 'Task', 'Project', 'title', 'name'];
        for (const propName of titleProperties) {
            if (properties[propName] && properties[propName].type === 'title') {
                return this.extractRichText(properties[propName].title);
            }
        }
        for (const [, value] of Object.entries(properties)) {
            if (value.type === 'title') {
                return this.extractRichText(value.title);
            }
        }
        return 'Untitled';
    }
    processProperties(properties) {
        const processed = {};
        for (const [key, prop] of Object.entries(properties)) {
            const propData = prop;
            switch (propData.type) {
                case 'title':
                    processed[key] = this.extractRichText(propData.title);
                    break;
                case 'rich_text':
                    processed[key] = this.extractRichText(propData.rich_text);
                    break;
                case 'text':
                    processed[key] = propData.text?.[0]?.plain_text || '';
                    break;
                case 'number':
                    processed[key] = propData.number;
                    break;
                case 'select':
                    processed[key] = propData.select?.name || null;
                    break;
                case 'multi_select':
                    processed[key] = propData.multi_select?.map((item) => item.name) || [];
                    break;
                case 'date':
                    processed[key] = propData.date?.start || null;
                    if (propData.date?.end) {
                        processed[key + '_end'] = propData.date.end;
                    }
                    break;
                case 'checkbox':
                    processed[key] = propData.checkbox;
                    break;
                case 'url':
                    processed[key] = propData.url || null;
                    break;
                case 'email':
                    processed[key] = propData.email || null;
                    break;
                case 'phone':
                    processed[key] = propData.phone || null;
                    break;
                case 'status':
                    processed[key] = propData.status?.name || null;
                    break;
                case 'relation':
                    processed[key] = propData.relation?.map((item) => item.id) || [];
                    break;
                case 'people':
                    processed[key] = propData.people?.map((person) => person.name) || [];
                    break;
                case 'created_time':
                    processed[key] = propData.created_time;
                    break;
                case 'created_by':
                    processed[key] = propData.created_by?.name || null;
                    break;
                case 'last_edited_time':
                    processed[key] = propData.last_edited_time;
                    break;
                case 'last_edited_by':
                    processed[key] = propData.last_edited_by?.name || null;
                    break;
                case 'formula':
                    if (propData.formula.type === 'string') {
                        processed[key] = propData.formula.string;
                    }
                    else if (propData.formula.type === 'number') {
                        processed[key] = propData.formula.number;
                    }
                    else if (propData.formula.type === 'boolean') {
                        processed[key] = propData.formula.boolean;
                    }
                    else if (propData.formula.type === 'date') {
                        processed[key] = propData.formula.date?.start || null;
                    }
                    break;
                default:
                    break;
            }
        }
        return processed;
    }
    static convertToPersonalData(page, dataType) {
        const baseData = {
            _id: `notion_${page.id}`,
            dataType,
            source: 'notion',
            value: {
                title: page.title,
                properties: page.properties,
                content: page.content,
                url: page.url,
                createdTime: page.createdTime,
                lastEditedTime: page.lastEditedTime,
            },
            timestamp: new Date(page.lastEditedTime).getTime(),
            processed: false,
        };
        switch (dataType) {
            case 'productivity':
                return {
                    ...baseData,
                    value: {
                        ...baseData.value,
                        task: page.title,
                        status: page.properties.Status || page.properties.status || 'unknown',
                        priority: page.properties.Priority || page.properties.priority || null,
                        dueDate: page.properties['Due Date'] || page.properties.dueDate || null,
                        completed: page.properties.Done === true || page.properties.completed === true,
                    },
                };
            case 'learning':
                return {
                    ...baseData,
                    value: {
                        ...baseData.value,
                        topic: page.title,
                        category: page.properties.Category || page.properties.category || 'general',
                        progress: page.properties.Progress || page.properties.progress || null,
                        duration: page.properties.Duration || page.properties.duration || null,
                        source: page.properties.Source || page.properties.source || 'Notion',
                    },
                };
            case 'health':
                return {
                    ...baseData,
                    value: {
                        ...baseData.value,
                        activity: page.title,
                        type: page.properties.Type || page.properties.type || 'general',
                        duration: page.properties.Duration || page.properties.duration || null,
                        date: page.properties.Date || page.properties.date || null,
                        notes: page.content,
                    },
                };
            case 'finance':
                return {
                    ...baseData,
                    value: {
                        ...baseData.value,
                        transaction: page.title,
                        amount: page.properties.Amount || page.properties.amount || null,
                        category: page.properties.Category || page.properties.category || 'general',
                        date: page.properties.Date || page.properties.date || null,
                        account: page.properties.Account || page.properties.account || null,
                    },
                };
            default:
                return baseData;
        }
    }
    cleanup() {
        this.client = null;
        this.credentials = null;
    }
    isInitialized() {
        return this.client !== null && this.credentials !== null;
    }
}
