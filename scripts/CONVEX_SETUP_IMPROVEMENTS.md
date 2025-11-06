# Convex Setup Script Improvements

This document describes the improvements made to the Convex setup script to fix authentication detection and improve the overall user experience.

## Issues Fixed

### 1. Authentication Detection

**Problem**: The original script tried to use `npx convex whoami` which doesn't exist, leading to failed authentication detection.

**Solution**:

- Implemented proper authentication detection by checking `~/.convex/config.json`
- Added token validation and expiration checking
- Added debugging information to help troubleshoot authentication issues

### 2. Device Code Flow Handling

**Problem**: The script didn't properly handle Convex's device code authentication flow, especially in non-interactive terminals.

**Solution**:

- Added detection for interactive vs non-interactive terminals
- Provides clear instructions for manual authentication in non-interactive environments
- Better error handling and user guidance throughout the authentication process

### 3. Project Configuration

**Problem**: The script didn't properly validate or create project configurations.

**Solution**:

- Improved project configuration detection in `convex.json`
- Better error handling when project creation fails
- Clear instructions for manual project setup

### 4. Environment Variable Setup

**Problem**: URL detection was unreliable and environment setup was fragile.

**Solution**:

- Multiple methods for detecting Convex deployment URLs
- Better validation of environment variables
- Clear error messages when configuration is incomplete

## New Features

### Debug Mode

```bash
./scripts/setup-convex.sh --debug
```

Shows detailed authentication and configuration status, including:

- Credential file status
- Token validation
- Project configuration
- Environment variable status
- Manual setup instructions

### Improved Help

```bash
./scripts/setup-convex.sh --help
```

Enhanced help documentation with:

- Authentication flow explanation
- Troubleshooting tips
- Manual setup instructions
- All available options

### Better Error Handling

- Graceful handling of non-interactive terminals
- Detailed debugging information when authentication fails
- Clear next steps when automatic setup isn't possible

## Authentication Flow

### Interactive Terminals

1. Script detects authentication status
2. If not authenticated, guides user through browser login
3. Automatically detects successful authentication
4. Proceeds with project setup

### Non-Interactive Terminals

1. Script detects non-interactive environment
2. Provides manual authentication instructions
3. Waits for user to complete manual setup
4. Validates authentication after manual process

## Key Functions

### `check_convex_login()`

- Validates Convex authentication token
- Checks token expiration
- Validates project access
- Provides debugging information

### `debug_auth_status()`

- Shows comprehensive authentication status
- Helps troubleshoot configuration issues
- Provides manual setup guidance

### `is_interactive()`

- Detects if terminal supports user interaction
- Adapts script behavior accordingly
- Provides appropriate instructions for each environment

### `test_convex_connectivity()`

- Validates Convex CLI functionality
- Ensures CLI is properly installed and accessible
- Catches connectivity issues early

## Troubleshooting

### Common Issues and Solutions

1. **Authentication not detected**

   - Check `~/.convex/config.json` exists
   - Verify token is not expired
   - Run `npx convex logout` and re-authenticate

2. **Project not configured**

   - Ensure `convex.json` has valid team and project fields
   - Run `npx convex dev --once` to configure project
   - Check dashboard access with `npx convex dashboard --no-open`

3. **Environment variables incorrect**

   - Verify `CONVEX_DEPLOYMENT` in `.env.local`
   - Ensure `VITE_CONVEX_URL` points to correct deployment
   - Use debug mode to check configuration

4. **Non-interactive terminal issues**
   - Follow manual setup instructions provided
   - Use `--debug` flag for detailed guidance
   - Complete authentication manually before running script

## Usage Examples

### Standard Setup

```bash
./scripts/setup-convex.sh
```

### Dry Run (test without making changes)

```bash
./scripts/setup-convex.sh --dry-run
```

### Debug Mode (troubleshooting)

```bash
./scripts/setup-convex.sh --debug
```

### Help Documentation

```bash
./scripts/setup-convex.sh --help
```

## Testing

The script has been tested with:

- Interactive terminals (bash, zsh)
- Non-interactive terminals (CI/CD environments)
- Various authentication states (authenticated, unauthenticated, expired tokens)
- Different project configurations (new projects, existing projects)

## Backward Compatibility

All improvements maintain backward compatibility with existing workflows. The script will work with:

- Existing Convex authentication
- Current project configurations
- Existing environment variable setups

## Future Improvements

Potential enhancements for future versions:

- Automatic token refresh
- Project selection from multiple projects
- Integration with CI/CD pipelines
- Configuration validation and repair
- Progress indicators for long-running operations
