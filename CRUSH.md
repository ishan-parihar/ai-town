# CRUSH.md - AI Council LifeOS Development Guide

This guide helps agents work effectively in the AI Council LifeOS codebase, which transforms the original AI Town virtual simulation into a comprehensive personal advisory system.

## Project Overview

AI Council LifeOS is a sophisticated personal life management system where 8 specialized AI council members analyze user data, collaborate across domains, and provide holistic insights. The system is built on React, TypeScript, Convex for backend, and includes enterprise-grade security with OAuth integrations.

## Essential Commands

### Development
```bash
# Start full development environment (backend + frontend)
npm run dev

# Start only backend (Convex)
npm run dev:backend

# Start only frontend (Vite)
npm run dev:frontend

# Initialize Convex before development
npm run predev

# Level editor for maps
npm run level-editor
npm run le
```

### Building & Deployment
```bash
# Build for production
npm run build

# Build secure version with authentication
npm run build:secure

# Deploy to production
npm run deploy:prod

# Start secure server in production
npm run start:secure
```

### Testing & Quality
```bash
# Run tests
npm test

# Security-specific tests
npm run test:security
npm run test:auth
npm run test:privacy

# Linting
npm run lint
```

### Security & Utilities
```bash
# Generate secrets (JWT, encryption, session)
npm run generate-secrets

# Security configuration checks
npm run security:check
npm run security:validate
```

### Convex Management
```bash
# Open Convex dashboard
npm run dashboard
```

## Architecture Overview

### Core Components

**Frontend (`src/`)**: React application with TypeScript
- Main app: `src/App.tsx`
- Dashboard: `src/components/CouncilDashboard.tsx`
- Authentication: `src/contexts/AuthContext.tsx`
- Security: `src/security/` directory

**Backend (`convex/`)**: Convex-powered backend
- Game engine: `convex/engine/`
- AI agents: `convex/agent/`
- Game logic: `convex/aiTown/`
- Schema definitions: `convex/schema.ts`

**Data Management (`data/`)**: Character definitions and spritesheets
- Characters: `data/characters.ts` (8 council members)
- Spritesheets: `data/spritesheets/`

### The 8 AI Council Members

1. **Aria** - Life Coach (f1 spritesheet)
2. **Marcus** - Financial Analyst (f4 spritesheet)
3. **Sofia** - Health & Wellness Advisor
4. **James** - Career Strategist
5. **Elena** - Relationship Counselor
6. **David** - Knowledge Curator
7. **Lisa** - Productivity Manager
8. **Alex** - Integration Coordinator

Each council member has:
- `name`: Display name
- `character`: Spritesheet identifier
- `role`: Specialization area
- `identity`: Detailed personality description
- `expertise`: Array of domain expertise
- `plan`: Behavioral directive
- `dataFocus`: Types of data they analyze

## Code Organization & Patterns

### Convex Patterns

**Schema Definition**: All tables defined in `convex/aiTown/schema.ts`
- Use `v.id()` for foreign key references
- Separate game state from archival data
- Include worldId for multi-world support

**Input Handling**: Game inputs in `convex/aiTown/inputs.ts`
- Use `inputHandler` for type-safe input processing
- All game state changes go through inputs
- Separate agent inputs from player inputs

**Engine Architecture**: `convex/engine/abstractGame.ts`
- Single-threaded game loop
- Historical objects for smooth client interpolation
- Batch processing (1 step/second, 60 ticks/second)

### Frontend Patterns

**Component Structure**:
- `components/`: React components
- `contexts/`: React context providers
- `hooks/`: Custom React hooks
- `services/`: Business logic services
- `security/`: Authentication and authorization

**State Management**:
- Convex `useQuery` for server state
- React Context for client state (Auth, Onboarding)
- Historical hooks for smooth animations: `useHistoricalValue`, `useHistoricalTime`

**Styling**: Tailwind CSS with custom components
- Use `clsx` for conditional classes
- Follow existing color scheme (gray-900, blue-600, purple-700)

### Security Implementation

**Authentication**:
- JWT-based authentication in `src/security/AuthenticationService.ts`
- OAuth providers: Google, Microsoft
- Session management with Redis

**Data Protection**:
- Encryption service in `src/security/DataProtectionService.ts`
- GDPR/CCPA compliance features
- Rate limiting and input sanitization

## Important Gotchas

### Convex Specific
1. **Game Engine Exclusivity**: Only the game engine should modify game state tables
2. **Historical Objects**: Limited to numeric values, no nested objects
3. **Input Latency**: Expect ~1.5s latency due to step batching
4. **Memory Constraints**: Keep active game state under few dozen KB

### Development Workflow
1. **Always run `npm run predev`** before starting development
2. **Use `npm run dev`** for full-stack development
3. **Convex dashboard** for database inspection
4. **Environment variables** in `config/.env.example`

### Code Style
- **TypeScript strict mode** enabled
- **ESLint** ignores `convex/`, `server/`, `scripts/` directories
- **No explicit any**: Use proper TypeScript types
- **Unused variables**: Prefix with `_` to suppress warnings

### Testing
- **Jest** configuration in `jest.config.ts`
- **Security tests** in separate test suites
- **Integration tests** for external services (Notion, Telegram)

## Configuration Files

### Key Files
- `convex.json`: Convex project configuration
- `package.json`: Scripts and dependencies
- `.eslintrc.cjs`: Linting configuration
- `data/characters.ts`: Council member definitions

### Environment Setup
1. Copy `config/.env.example` to `.env.local`
2. Generate secrets with `npm run generate-secrets`
3. Configure OAuth providers in `config/oauth.env.example`

## Integration Services

### Notion Integration
- Service: `src/services/notionService.ts`
- Routes: `src/routes/notionRoutes.ts`
- Testing: `scripts/test-notion-integration.sh`

### Telegram Integration
- Service: `src/services/telegramService.ts`
- Routes: `src/routes/telegramRoutes.ts`
- Testing: `scripts/test-telegram-integration.sh`

### OAuth Integration
- Service: `src/services/OAuthIntegrationService.ts`
- Multiple providers: Google, Microsoft
- Routes: `src/routes/oauthRoutes.ts`

## Deployment & Production

### Docker Support
- Configuration in `docker/`
- Fly.io deployment configs in `fly/`

### Secure Deployment
- Use `npm run build:secure` for production
- Security validation before deploy
- Environment-specific configurations

## Debugging & Monitoring

### Monitoring System
- Service: `src/services/monitoring/`
- Dashboard: `src/components/monitoring/MonitoringDashboard.tsx`
- Health checks, error handling, alerting

### Development Tips
1. Use Convex dashboard for data inspection
2. Check browser console for client-side errors
3. Monitor server logs in development
4. Use `npm run test` for regression testing

## Common Tasks

### Adding New Council Member
1. Add character to `data/characters.ts`
2. Create spritesheet in `data/spritesheets/`
3. Update `data/spritesheets/types.ts`
4. Add member initialization in game startup

### Modifying Game Logic
1. Update schema in `convex/aiTown/schema.ts`
2. Modify inputs in `convex/aiTown/inputs.ts`
3. Update game engine in `convex/aiTown/`
4. Adjust frontend components in `src/components/`

### Adding External Integration
1. Create service in `src/services/`
2. Add routes in `src/routes/`
3. Update environment configuration
4. Add integration tests

This codebase is well-structured for development with clear separation of concerns, comprehensive security, and extensive documentation. The transformation from AI Town to AI Council LifeOS maintains the robust game engine while focusing on personal data analysis and insights.