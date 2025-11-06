# AI Town - Agent Development Guide

## Build/Lint/Test Commands

```bash
npm run dev          # Start development (backend + frontend)
npm run build        # Build for production
npm run lint         # Run ESLint
npm test             # Run all tests
npm test -- path/to/file.test.ts           # Run single test file
npm test -- --testNamePattern="test name"  # Run specific test
npm run test:security # Run security tests
npm run test:auth     # Run auth tests
npm run test:privacy  # Run privacy tests
```

## Code Style Guidelines

### TypeScript & ESLint

- Uses @typescript-eslint parser with ES2018+ modules
- `any` types allowed - use when appropriate
- No explicit function return types required
- Prefix unused variables with `_` (ignored by linter)
- Non-null assertions (`!`) allowed

### Project Structure

- Frontend: `src/` with React + TypeScript + Tailwind
- Backend: `convex/` with Convex functions
- Tests: Co-located as `*.test.ts` files
- Game engine: PIXI.js with React integration

### Imports & Formatting

- ES6 module syntax (`import/export`)
- React 18 patterns with hooks
- TypeScript strict mode not enforced
- Prettier available for formatting

### Testing

- Jest framework with describe/test structure
- Test files follow source file naming with `.test.ts`
- Use verbose flag for detailed output
- Security/auth/privacy have dedicated test suites
