# AI Town 🤖✨

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-20232A?logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Convex](https://img.shields.io/badge/Convex-000000?logo=convex&logoColor=white)](https://convex.dev/)

A virtual town where AI characters interact, form relationships, and live out their lives in a dynamic 2D world. Built with modern web technologies and powered by AI language models.

```
┌─────────────────────────────────────────────────────────────┐
│                     AI TOWN WORLD                           │
├─────────────────────────────────────────────────────────────┤
│  🏘️ Virtual Village    💬 Conversations    🎮 Interactive  │
│  🤖 AI Characters      📍 Location-based   🌍 Real-time    │
│  🗺️ 2D Tile Map        🎭 Personalities   ⚡ Persistent  │
└─────────────────────────────────────────────────────────────┘
```

## 🌟 Project Overview

AI Town is a sophisticated simulation where AI agents navigate a virtual world, engage in conversations, form relationships, and exhibit emergent behaviors. Each character has their own personality, goals, and social dynamics that evolve over time.

### ✨ Key Features

- **🤖 Intelligent AI Characters**: Each with unique personalities, memories, and behaviors
- **🗺️ Interactive 2D World**: Tile-based map with locations for exploration and interaction
- **💬 Dynamic Conversations**: AI agents engage in contextual, meaningful dialogues
- **📍 Location System**: Characters move between different locations in the town
- **🎭 Social Relationships**: Complex relationship dynamics between characters
- **⚡ Real-time Updates**: Live simulation with continuous character development
- **🎮 Player Interaction**: Join the world as a human player and interact with AI agents

## 🏗️ Architecture

### Core Technologies

```
┌─────────────────────────────────────────────────────────────┐
│                      TECH STACK                              │
├─────────────────────────────────────────────────────────────┤
│  🔧 Backend              🎨 Frontend                       │
│  ├── Convex Database     ├── React 18 + TypeScript         │
│  ├── Real-time sync      ├── PIXI.js (Game Engine)         │
│  ├── Serverless functions├── Tailwind CSS                  │
│  └── AI/ML Pipeline      └── Vite Build System             │
│                                                             │
│  🤖 AI Integration       🎮 Game Engine                    │
│  ├── OpenAI API          ├── Tile-based rendering           │
│  ├── Character AI        ├── Viewport system               │
│  ├── Conversation logic  ├── Sprite animations             │
│  └── Behavior patterns   └── Interactive controls          │
│                                                             │
│  📊 Data Storage         🚀 Deployment                     │
│  ├── Character states    ├── Docker containers              │
│  ├── Conversations       ├── Fly.io hosting                 │
│  ├── World map data      ├── Environment variables          │
│  └── Game history        └── Production deployment         │
└─────────────────────────────────────────────────────────────┘
```

### System Components

- **Game Engine**: Real-time simulation engine managing character behaviors and world state
- **AI System**: Language model integration for character personalities and conversations
- **Database**: Convex backend for real-time data synchronization
- **Frontend**: React-based interface with PIXI.js for 2D graphics
- **Map Editor**: Built-in level editor for creating custom town layouts

## 📁 Project Structure

```
ai-town/
├── 📁 convex/           # Backend logic and database schema
│   ├── aiTown/         # Game-specific backend code
│   ├── agent/          # AI behavior and conversation logic
│   └── engine/         # Core game engine implementation
├── 📁 src/              # Frontend source code
│   ├── components/     # React components
│   ├── services/       # API and integration services
│   ├── hooks/          # Custom React hooks
│   └── editor/         # Built-in map editor
├── 📁 data/            # Game data and configurations
│   ├── characters.ts   # AI character definitions
│   ├── spritesheets/   # Character sprites and animations
│   └── animations/     # Animation data
├── 📁 assets/          # Static assets (images, fonts)
├── 📁 public/          # Public assets for serving
├── 📁 server/          # Server implementations
├── 📁 docker/          # Docker configuration
├── 📁 fly/            # Fly.io deployment config
└── 📁 scripts/        # Utility and deployment scripts
```

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ (LTS version recommended)
- **npm** or **yarn** package manager
- **Git** for version control
- **Convex** account (free tier available)

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/a16z-infra/ai-town.git
cd ai-town

# 2. Install dependencies
npm install

# 3. Set up Convex (Recommended)
./scripts/setup-convex.sh         # Interactive setup
# ./scripts/setup-convex.sh --dry-run  # Preview setup steps
# ./scripts/setup-convex.sh --help     # Show help

# Alternative: Manual Convex Setup
# cp config/.env.example .env.local
# npx convex dev
# npx convex deploy

# 4. Start the development server
npm run dev
```

### Environment Configuration

Create a `.env.local` file with the following variables:

```bash
# AI Model Configuration
OPENAI_API_KEY=your-openai-api-key
ANTHROPIC_API_KEY=your-anthropic-api-key  # Optional

# Convex Configuration
CONVEX_DEPLOYMENT=your-convex-deployment-url

# Development
VITE_CONVEX_URL=http://localhost:3210
```

## 🎮 Usage Guide

### Playing the Game

1. **Start the Application**: Run `npm run dev` to launch the development server
2. **Open Browser**: Navigate to `http://localhost:5173`
3. **Join the World**: Enter your name and join as a human player
4. **Explore**: Click on the map to move your character
5. **Interact**: Click on AI characters to start conversations
6. **Observe**: Watch AI characters interact with each other

### Map Editor

Create custom town layouts using the built-in editor:

```bash
# Launch the map editor
npm run level-editor

# Access at http://localhost:5174
```

**Editor Features:**

- Tile-based map creation
- Sprite placement and animation
- Location configuration
- Export/import map files

### Character Configuration

AI characters are defined in `data/characters.ts`. Each character includes:

```typescript
{
  name: 'Character Name',
  identity: 'Character personality and background',
  plan: 'Character goals and behavior patterns',
  // Additional configuration...
}
```

## 🛠️ Development

### Development Commands

```bash
# Development
npm run dev              # Start frontend + backend
npm run dev:frontend     # Frontend only
npm run dev:backend      # Convex backend only

# Testing
npm run test             # Run all tests
npm run lint             # ESLint checking

# Building
npm run build            # Production build
npm run preview          # Preview production build

# Tools
npm run level-editor     # Map editor
npm run dashboard        # Convex dashboard

# Custom LLM Provider Testing
npm run test:llm-providers              # Quick test all providers
npm run test:llm-providers:full         # Comprehensive test with performance
npm run test:llm-providers:report       # Save timestamped report
node scripts/test-custom-providers.js              # Direct script access
node scripts/test-custom-providers.js --verbose    # Detailed output
node scripts/test-custom-providers.js --quick      # Skip performance tests
./scripts/test-llm-providers quick                  # Easy wrapper commands
```

### 🤖 Custom LLM Provider Testing

AI Town supports custom LLM providers for enhanced flexibility. Use the built-in test script to verify your provider configuration:

```bash
# Quick test of all configured providers
node scripts/test-custom-providers.js --quick

# Comprehensive test with performance benchmarks
node scripts/test-custom-providers.js --verbose

# Save test report to file
node scripts/test-custom-providers.js --report-file test-results.txt
```

The script tests:

- ✅ Provider connectivity and authentication
- 💬 Chat completion functionality
- 🔤 Embedding generation
- ⚡ Performance benchmarks
- 🔄 Fallback logic validation

**Configuration**: Set up providers in `config/custom-providers.env`:

```bash
# OpenAI
OPENAI_API_KEY=your-key
OPENAI_API_BASE_URL=https://api.openai.com/v1

# Custom Provider
MYPROVIDER_API_KEY=your-custom-key
MYPROVIDER_API_BASE_URL=https://my-provider.com/v1
```

📖 **Full Guide**: See `scripts/README-test-custom-providers.md` for detailed instructions.

### Adding New Characters

1. **Define Character**: Add character definition in `data/characters.ts`
2. **Create Sprite**: Add character sprite in `data/spritesheets/`
3. **Configure AI**: Set up personality and behavior patterns
4. **Test**: Verify character integration in the game world

### Custom Maps

1. **Use Editor**: Create maps with the built-in level editor
2. **Export Maps**: Save map configurations to `src/editor/maps/`
3. **Load Maps**: Configure game to load custom map files
4. **Test Gameplay**: Verify map functionality and character navigation

### AI Behavior Customization

AI character behaviors are controlled through:

- **Conversation Logic**: `convex/agent/conversation.ts`
- **Memory System**: `convex/agent/memory.ts`
- **Movement Patterns**: `convex/aiTown/movement.ts`
- **Input Handling**: `convex/aiTown/inputHandler.ts`

## 🚀 Deployment

### Fly.io Deployment (Recommended)

```bash
# 1. Install Fly.io CLI
brew install flyctl

# 2. Login to Fly.io
fly auth login

# 3. Deploy Convex backend
npx convex deploy

# 4. Deploy frontend
fly launch
fly secrets set VITE_CONVEX_URL=<your-convex-url>
fly deploy
```

### Docker Deployment

```bash
# Build and run with Docker Compose
docker-compose up --build

# Access the application
# Frontend: http://localhost:5173
# API: http://localhost:3001
```

### Production Configuration

For production deployment:

1. **Set Environment Variables**: Configure all required secrets
2. **Update Allowed Hosts**: Modify `vite.config.ts` for production domains
3. **Enable HTTPS**: Configure SSL certificates
4. **Set Up Monitoring**: Implement health checks and logging
5. **Scale Resources**: Adjust resources based on user load

## 🤖 AI Integration

### Supported AI Providers

- **OpenAI GPT Models**: Primary choice for character conversations
- **Anthropic Claude**: Alternative AI provider
- **Local Models**: Support for local Ollama instances

### Character AI System

Each AI character features:

- **Memory System**: Remembers past interactions and relationships
- **Personality Traits**: Consistent behavior patterns
- **Goal-directed Behavior**: Characters pursue personal objectives
- **Social Dynamics**: Relationship building and maintenance
- **Context Awareness**: Responds to environment and other characters

### Conversation Engine

- **Dynamic Responses**: Context-aware dialogue generation
- **Relationship Tracking**: Characters remember past conversations
- **Group Conversations**: Multi-character interaction support
- **Emotional States**: Characters express and respond to emotions

## 📊 Monitoring & Debugging

### Convex Dashboard

Monitor your backend in real-time:

```bash
npm run dashboard
```

**Dashboard Features:**

- Real-time data viewer
- Function execution logs
- Database schema inspection
- Performance metrics

### Game Debugging

- **Debug Mode**: Enable debug overlays in the game
- **Console Logs**: Comprehensive logging system
- **State Inspection**: View character and world states
- **Performance Monitoring**: FPS and memory usage tracking

## 🎨 Customization

### Visual Assets

- **Sprites**: Character and object sprites in `assets/spritesheets/`
- **Tilesets**: Map tiles in `src/editor/tilesets/`
- **Fonts**: Custom fonts in `public/assets/fonts/`
- **UI Elements**: Interface components in `assets/ui/`

### Audio

- **Background Music**: Ambient game music
- **Sound Effects**: Interaction and movement sounds
- **Volume Controls**: Adjustable audio settings

### Themes

Customize the appearance:

- **Color Schemes**: Modify CSS variables
- **Layout Adjustments**: Responsive design configurations
- **Animation Timing**: Control animation speeds and transitions

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

### Areas for Contribution

- **🤖 AI Behaviors**: Improve character intelligence and interactions
- **🎨 Graphics**: Create new sprites, tiles, and visual assets
- **🔧 Features**: Add new gameplay mechanics and systems
- **🐛 Bug Fixes**: Help identify and resolve issues
- **📚 Documentation**: Improve guides and API documentation

### Development Setup

1. **Fork Repository**: Create your own fork on GitHub
2. **Clone Fork**: Clone your fork locally
3. **Create Branch**: `git checkout -b feature/your-feature-name`
4. **Make Changes**: Implement your contribution
5. **Test**: Verify changes work correctly
6. **Submit PR**: Create a pull request with detailed description

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:

- **📖 Documentation**: [Convex Docs](https://docs.convex.dev/)
- **💬 Discussions**: [GitHub Discussions](https://github.com/a16z-infra/ai-town/discussions)
- **🐛 Issues**: [GitHub Issues](https://github.com/a16z-infra/ai-town/issues)
- **🎮 Discord**: [Community Discord](https://discord.gg/convex)

## 🗺️ Roadmap

### Current Features

- ✅ Basic AI character simulation
- ✅ 2D tile-based world
- ✅ Real-time conversations
- ✅ Map editor
- ✅ Player interaction

### Planned Enhancements

- 🔄 Advanced AI behaviors
- 🔄 Mobile app support
- 🔄 Multiplayer functionality
- 🔄 Voice interactions
- 🔄 Expanded world features
- 🔄 Performance optimizations

---

**AI Town** - Where artificial intelligence comes to life in a virtual world. 🚀✨

_Built with ❤️ by the a16z-infra team_
