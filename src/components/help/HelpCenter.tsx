import React, { useState } from 'react';

// Inline SVG components
const SearchIcon = ({ size, className }: { size?: number; className?: string }) => (
  <svg
    width={size}
    height={size}
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
    />
  </svg>
);

const BookIcon = ({ size, className }: { size?: number; className?: string }) => (
  <svg
    width={size}
    height={size}
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
    />
  </svg>
);

const VideoIcon = ({ size, className }: { size?: number; className?: string }) => (
  <svg
    width={size}
    height={size}
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
    />
  </svg>
);

const MessageCircleIcon = ({ size, className }: { size?: number; className?: string }) => (
  <svg
    width={size}
    height={size}
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
    />
  </svg>
);

const ExternalLinkIcon = ({ size, className }: { size?: number; className?: string }) => (
  <svg
    width={size}
    height={size}
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
    />
  </svg>
);

interface HelpArticle {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  relatedArticles?: string[];
  videoUrl?: string;
}

interface HelpCategory {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
  articles: HelpArticle[];
}

const HelpCenter: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedArticle, setSelectedArticle] = useState<HelpArticle | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(['getting-started']),
  );

  const helpCategories: HelpCategory[] = [
    {
      id: 'getting-started',
      name: 'Getting Started',
      icon: <BookIcon size={20} className="text-blue-400" />,
      description: 'Learn the basics and set up your AI Council',
      articles: [
        {
          id: 'welcome-guide',
          title: 'Welcome to AI Council LifeOS',
          content: `
            <h3>What is AI Council LifeOS?</h3>
            <p>AI Council LifeOS is your personal advisory council of specialized AI agents working together to help you optimize all aspects of your life. Each council member has unique expertise in areas like health, finance, career, and personal development.</p>
            
            <h3>Your Council Members</h3>
            <ul>
              <li><strong>Aria (Life Coach):</strong> Personal development and goal achievement</li>
              <li><strong>Marcus (Financial Analyst):</strong> Budgeting, investing, and financial planning</li>
              <li><strong>Dr. Lena (Health & Wellness):</strong> Nutrition, fitness, and mental health</li>
              <li><strong>David (Career Strategist):</strong> Professional growth and career planning</li>
              <li><strong>Sophia (Relationship Counselor):</strong> Personal and professional relationships</li>
              <li><strong>Professor Alex (Knowledge Curator):</strong> Learning and skill development</li>
              <li><strong>Emma (Productivity Manager):</strong> Time management and efficiency</li>
              <li><strong>Sam (Integration Coordinator):</strong> System optimization and automation</li>
            </ul>
            
            <h3>Getting Started</h3>
            <p>Begin by completing the onboarding process, connecting your data sources, and setting your goals. Your council will start providing personalized insights immediately.</p>
          `,
          category: 'getting-started',
          tags: ['basics', 'introduction', 'overview'],
        },
        {
          id: 'first-steps',
          title: 'Your First Steps',
          content: `
            <h3>Complete Your Profile</h3>
            <p>Start by filling out your profile with accurate information about your goals, interests, and experience level. This helps your council provide more relevant recommendations.</p>
            
            <h3>Connect Data Sources</h3>
            <p>Connect your favorite apps and services to provide your council with the data they need to give you personalized insights. Popular integrations include Notion, Telegram, fitness trackers, and more.</p>
            
            <h3>Set Your Goals</h3>
            <p>Define clear, achievable goals in areas that matter to you. Your council will help break these down into actionable steps and track your progress.</p>
            
            <h3>Review Your Insights</h3>
            <p>Check your insights regularly to see recommendations from your council members. Provide feedback to help them learn your preferences and improve future recommendations.</p>
          `,
          category: 'getting-started',
          tags: ['setup', 'configuration', 'tutorial'],
        },
      ],
    },
    {
      id: 'features',
      name: 'Features & Functionality',
      icon: <VideoIcon size={20} className="text-green-400" />,
      description: 'Explore all the powerful features of your AI Council',
      articles: [
        {
          id: 'insights-system',
          title: 'Understanding Insights',
          content: `
            <h3>What are Insights?</h3>
            <p>Insights are personalized recommendations generated by your council members based on your data, goals, and patterns they observe. Each insight includes:</p>
            <ul>
              <li><strong>Title & Description:</strong> Clear explanation of the recommendation</li>
              <li><strong>Priority Level:</strong> How urgent or important the insight is</li>
              <li><strong>Confidence Score:</strong> How confident the council member is in this recommendation</li>
              <li><strong>Action Steps:</strong> Specific actions you can take</li>
            </ul>
            
            <h3>Priority Levels</h3>
            <ul>
              <li><strong>🔴 High Priority:</strong> Immediate attention required</li>
              <li><strong>🟡 Medium Priority:</strong> Important but not urgent</li>
              <li><strong>🟢 Low Priority:</strong> Suggestions for improvement</li>
            </ul>
            
            <h3>Taking Action</h3>
            <p>You can mark insights as reviewed, acted upon, or dismiss them. Your council learns from your feedback and adjusts future recommendations accordingly.</p>
          `,
          category: 'features',
          tags: ['insights', 'recommendations', 'ai-analysis'],
        },
        {
          id: 'goal-tracking',
          title: 'Goal Setting & Tracking',
          content: `
            <h3>Setting Effective Goals</h3>
            <p>Your council helps you set SMART goals (Specific, Measurable, Achievable, Relevant, Time-bound). When setting goals:</p>
            <ul>
              <li>Be specific about what you want to achieve</li>
              <li>Include measurable targets and deadlines</li>
              <li>Break large goals into smaller milestones</li>
              <li>Choose goals that align with your values</li>
            </ul>
            
            <h3>Progress Tracking</h3>
            <p>Your council automatically tracks your progress toward goals using:</p>
            <ul>
              <li>Data from connected apps and services</li>
              <li>Manual progress updates you provide</li>
              <li>Pattern recognition and trend analysis</li>
            </ul>
            
            <h3>Milestone Celebrations</h3>
            <p>Your council recognizes when you achieve milestones and provides positive reinforcement to keep you motivated.</p>
          `,
          category: 'features',
          tags: ['goals', 'progress', 'achievements'],
        },
      ],
    },
    {
      id: 'integrations',
      name: 'Integrations & Data',
      icon: <ExternalLinkIcon size={20} className="text-purple-400" />,
      description: 'Connect your favorite apps and services',
      articles: [
        {
          id: 'notion-integration',
          title: 'Notion Integration Setup',
          content: `
            <h3>Why Connect Notion?</h3>
            <p>Notion integration allows your council to analyze your notes, tasks, and project data to provide more relevant insights about your productivity, projects, and thought patterns.</p>
            
            <h3>Setup Instructions</h3>
            <ol>
              <li>Go to Settings > Integrations > Notion</li>
              <li>Click "Connect Notion"</li>
              <li>Sign in to your Notion account</li>
              <li>Grant permissions to access your workspace</li>
              <li>Select which databases to sync</li>
              <li>Configure sync preferences</li>
            </ol>
            
            <h3>Privacy & Security</h3>
            <p>Your Notion data is encrypted and processed securely. You maintain full control over which databases are shared and can revoke access at any time.</p>
            
            <h3>What Gets Synced?</h3>
            <ul>
              <li>Task completion status and deadlines</li>
              <li>Project progress and milestones</li>
              <li>Note content and tags (for pattern analysis)</li>
              <li>Time tracking data (if available)</li>
            </ul>
          `,
          category: 'integrations',
          tags: ['notion', 'productivity', 'setup'],
          videoUrl: 'https://example.com/notion-tutorial',
        },
        {
          id: 'telegram-integration',
          title: 'Telegram Bot Setup',
          content: `
            <h3>Telegram Bot Features</h3>
            <p>Connect your AI Council to Telegram for:</p>
            <ul>
              <li>Quick insights on the go</li>
              <li>Goal progress updates</li>
              <li>Voice-to-text journaling</li>
              <li>Emergency council consultations</li>
            </ul>
            
            <h3>Setup Process</h3>
            <ol>
              <li>Open Telegram and search for "AI Council Bot"</li>
              <li>Start a conversation with the bot</li>
              <li>Use the /connect command</li>
              <li>Enter your unique connection code from the dashboard</li>
              <li>Configure notification preferences</li>
            </ol>
            
            <h3>Available Commands</h3>
            <ul>
              <li><code>/insights</code> - Get latest recommendations</li>
              <li><code>/goals</code> - View goal progress</li>
              <li><code>/status</code> - Council member status</li>
              <li><code>/help</code> - Show all commands</li>
            </ul>
          `,
          category: 'integrations',
          tags: ['telegram', 'messaging', 'mobile'],
        },
      ],
    },
    {
      id: 'troubleshooting',
      name: 'Troubleshooting',
      icon: <MessageCircleIcon size={20} className="text-yellow-400" />,
      description: 'Solve common issues and problems',
      articles: [
        {
          id: 'sync-issues',
          title: 'Data Sync Problems',
          content: `
            <h3>Common Sync Issues</h3>
            
            <h4>Notion Not Syncing</h4>
            <ul>
              <li>Check your internet connection</li>
              <li>Verify Notion API permissions</li>
              <li>Ensure selected databases are accessible</li>
              <li>Try disconnecting and reconnecting</li>
            </ul>
            
            <h4>Telegram Bot Not Responding</h4>
            <ul>
              <li>Verify the bot is not blocked</li>
              <li>Check your connection code is valid</li>
              <li>Ensure notifications are enabled</li>
              <li>Try sending a /start command</li>
            </ul>
            
            <h3>Advanced Troubleshooting</h3>
            <p>If issues persist:</p>
            <ol>
              <li>Clear your browser cache and cookies</li>
              <li>Check service status in our status page</li>
              <li>Contact support with error details</li>
              <li>Try accessing from a different browser</li>
            </ol>
          `,
          category: 'troubleshooting',
          tags: ['sync', 'errors', 'technical'],
        },
      ],
    },
  ];

  const toggleCategory = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const filteredCategories = helpCategories
    .map((category) => ({
      ...category,
      articles: category.articles.filter(
        (article) =>
          article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          article.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
          article.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase())),
      ),
    }))
    .filter((category) => !searchQuery || category.articles.length > 0);

  if (selectedArticle) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-6">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => setSelectedArticle(null)}
            className="mb-6 text-blue-400 hover:text-blue-300 transition-colors flex items-center space-x-2"
          >
            ← Back to Help Center
          </button>

          <article className="bg-gray-800 rounded-lg p-8">
            <h1 className="text-3xl font-bold mb-4">{selectedArticle.title}</h1>

            <div className="flex items-center space-x-4 mb-6 text-sm text-gray-400">
              <span className="bg-gray-700 px-3 py-1 rounded">{selectedArticle.category}</span>
              {selectedArticle.tags.map((tag) => (
                <span key={tag} className="text-gray-400">
                  #{tag}
                </span>
              ))}
            </div>

            <div
              className="prose prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: selectedArticle.content }}
            />

            {selectedArticle.videoUrl && (
              <div className="mt-8 bg-gray-700 rounded-lg p-6">
                <h3 className="text-xl font-semibold mb-4">Video Tutorial</h3>
                <div className="aspect-video bg-gray-600 rounded-lg flex items-center justify-center">
                  <VideoIcon size={48} className="text-gray-400" />
                </div>
              </div>
            )}

            {selectedArticle.relatedArticles && selectedArticle.relatedArticles.length > 0 && (
              <div className="mt-8 pt-8 border-t border-gray-700">
                <h3 className="text-xl font-semibold mb-4">Related Articles</h3>
                <div className="space-y-2">
                  {selectedArticle.relatedArticles.map((articleId) => {
                    const relatedArticle = helpCategories
                      .flatMap((cat) => cat.articles)
                      .find((article) => article.id === articleId);
                    return relatedArticle ? (
                      <button
                        key={articleId}
                        onClick={() => setSelectedArticle(relatedArticle)}
                        className="block w-full text-left p-3 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
                      >
                        {relatedArticle.title}
                      </button>
                    ) : null;
                  })}
                </div>
              </div>
            )}
          </article>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Help Center</h1>
          <p className="text-gray-400">
            Find answers to your questions and learn how to get the most from your AI Council
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-8">
          <div className="relative max-w-2xl">
            <SearchIcon
              size={20}
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder="Search for help articles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Quick Links */}
        {!searchQuery && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <button
              onClick={() => {
                const article = helpCategories
                  .flatMap((cat) => cat.articles)
                  .find((a) => a.id === 'welcome-guide');
                if (article) setSelectedArticle(article);
              }}
              className="bg-gray-800 rounded-lg p-4 text-left hover:bg-gray-700 transition-colors"
            >
              <div className="text-2xl mb-2">🚀</div>
              <h3 className="font-semibold mb-1">Quick Start</h3>
              <p className="text-sm text-gray-400">Get started in 5 minutes</p>
            </button>

            <button
              onClick={() => {
                const article = helpCategories
                  .flatMap((cat) => cat.articles)
                  .find((a) => a.id === 'notion-integration');
                if (article) setSelectedArticle(article);
              }}
              className="bg-gray-800 rounded-lg p-4 text-left hover:bg-gray-700 transition-colors"
            >
              <div className="text-2xl mb-2">📝</div>
              <h3 className="font-semibold mb-1">Notion Setup</h3>
              <p className="text-sm text-gray-400">Connect your workspace</p>
            </button>

            <button
              onClick={() => {
                const article = helpCategories
                  .flatMap((cat) => cat.articles)
                  .find((a) => a.id === 'telegram-integration');
                if (article) setSelectedArticle(article);
              }}
              className="bg-gray-800 rounded-lg p-4 text-left hover:bg-gray-700 transition-colors"
            >
              <div className="text-2xl mb-2">💬</div>
              <h3 className="font-semibold mb-1">Telegram Bot</h3>
              <p className="text-sm text-gray-400">Chat on the go</p>
            </button>

            <button
              onClick={() => {
                const article = helpCategories
                  .flatMap((cat) => cat.articles)
                  .find((a) => a.id === 'sync-issues');
                if (article) setSelectedArticle(article);
              }}
              className="bg-gray-800 rounded-lg p-4 text-left hover:bg-gray-700 transition-colors"
            >
              <div className="text-2xl mb-2">🔧</div>
              <h3 className="font-semibold mb-1">Troubleshooting</h3>
              <p className="text-sm text-gray-400">Fix common issues</p>
            </button>
          </div>
        )}

        {/* Categories and Articles */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <h2 className="text-xl font-semibold mb-4">Categories</h2>
            <div className="space-y-2">
              {filteredCategories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => toggleCategory(category.id)}
                  className={`w-full text-left p-3 rounded-lg transition-colors ${
                    selectedCategory === category.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-800 hover:bg-gray-700'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    {category.icon}
                    <div>
                      <div className="font-medium">{category.name}</div>
                      <div className="text-sm opacity-75">{category.articles.length} articles</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="lg:col-span-2">
            <h2 className="text-xl font-semibold mb-4">
              {searchQuery
                ? `Search Results (${filteredCategories.flatMap((c) => c.articles).length})`
                : 'Articles'}
            </h2>
            <div className="space-y-4">
              {filteredCategories.map((category) => (
                <div key={category.id}>
                  {!searchQuery && (
                    <div className="flex items-center space-x-2 mb-3">
                      {category.icon}
                      <h3 className="text-lg font-semibold">{category.name}</h3>
                      <span className="text-sm text-gray-400">({category.articles.length})</span>
                    </div>
                  )}

                  <div className="space-y-2">
                    {category.articles.map((article) => (
                      <button
                        key={article.id}
                        onClick={() => setSelectedArticle(article)}
                        className="w-full text-left p-4 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors group"
                      >
                        <h4 className="font-medium text-white mb-1 group-hover:text-blue-400 transition-colors">
                          {article.title}
                        </h4>
                        <p className="text-sm text-gray-400 mb-2">
                          {article.content.replace(/<[^>]*>/g, '').substring(0, 150)}...
                        </p>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs bg-gray-700 px-2 py-1 rounded">
                            {article.category}
                          </span>
                          {article.tags.slice(0, 3).map((tag) => (
                            <span key={tag} className="text-xs text-gray-500">
                              #{tag}
                            </span>
                          ))}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Contact Support */}
        {!searchQuery && (
          <div className="mt-12 bg-gray-800 rounded-lg p-6 text-center">
            <h3 className="text-xl font-semibold mb-2">Still need help?</h3>
            <p className="text-gray-400 mb-4">
              Can't find what you're looking for? Our support team is here to help.
            </p>
            <div className="flex items-center justify-center space-x-4">
              <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                Contact Support
              </button>
              <button className="px-6 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors">
                Community Forum
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HelpCenter;
