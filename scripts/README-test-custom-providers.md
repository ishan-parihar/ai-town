# Custom LLM Provider Test Script

This script helps you verify your custom LLM provider setup by testing connectivity, authentication, and functionality.

## 🚀 Quick Start

```bash
# Run basic tests
node scripts/test-custom-providers.js

# Run with verbose output
node scripts/test-custom-providers.js --verbose

# Run quick tests (skip performance benchmarks)
node scripts/test-custom-providers.js --quick
```

## 📋 What It Tests

The script performs comprehensive tests on your configured LLM providers:

### ✅ Connectivity Tests

- Checks if provider endpoints are reachable
- Tests basic network connectivity
- Measures initial response times

### 🔐 Authentication Tests

- Validates API keys and credentials
- Tests access to `/models` endpoint
- Verifies proper authorization headers

### 💬 Chat Completion Tests

- Sends test messages to chat endpoints
- Validates response structure
- Tests with different provider formats (OpenAI, Azure, etc.)

### 🔤 Embedding Tests

- Generates test embeddings
- Validates embedding dimensions
- Tests embedding API compatibility

### 🏥 Health Check Tests

- Probes common health endpoints (`/health`, `/status`, `/ping`)
- Tests provider monitoring capabilities
- Validates service availability

### ⚡ Performance Benchmarks

- Measures chat completion response times
- Tests embedding generation speed
- Compares against performance thresholds
- Runs multiple iterations for accuracy

### 🔄 Fallback Logic Tests

- Analyzes provider availability
- Tests failover scenarios
- Provides recommendations for redundancy

## 🛠️ Configuration

The script automatically reads configuration from:

1. **`config/.env.example`** - Main environment configuration
2. **`config/custom-providers.env.example`** - Custom provider settings

### Supported Providers

- **OpenAI** - Standard OpenAI API
- **Azure OpenAI** - Azure-hosted OpenAI services
- **Anthropic** - Claude API
- **Cohere** - Cohere AI
- **Mistral** - Mistral AI
- **LocalAI** - Self-hosted OpenAI-compatible servers
- **Ollama** - Local Ollama instances
- **Custom providers** - Any OpenAI-compatible endpoint

### Configuration Examples

#### OpenAI

```bash
OPENAI_API_KEY=sk-...
OPENAI_API_BASE_URL=https://api.openai.com/v1
```

#### Azure OpenAI

```bash
AZURE_API_KEY=...
AZURE_API_BASE_URL=https://your-resource.openai.azure.com/
AZURE_RESOURCE_NAME=your-resource
AZURE_DEPLOYMENT_NAME=your-deployment
AZURE_API_VERSION=2023-12-01-preview
```

#### Custom Provider

```bash
MYPROVIDER_API_KEY=your-key
MYPROVIDER_API_BASE_URL=https://your-provider.com/v1
```

## 📊 Understanding the Results

### Status Indicators

- ✅ **Pass** - Test completed successfully
- ⚠️ **Warning** - Test passed but with concerns (slow response, etc.)
- ❌ **Fail** - Test failed completely
- ⏭️ **Skip** - Test skipped (no API key, endpoint not available, etc.)

### Performance Thresholds

- **Chat Completions**: 5 seconds
- **Embeddings**: 10 seconds
- **Health Checks**: 2 seconds

### Report Sections

1. **Summary** - Overall test statistics and success rate
2. **Connectivity** - Network reachability results
3. **Authentication** - API key validation results
4. **Chat Completions** - Chat API functionality
5. **Embeddings** - Embedding API functionality
6. **Health Checks** - Service health monitoring
7. **Performance** - Detailed performance metrics
8. **Fallback Logic** - Redundancy and failover analysis
9. **Recommendations** - Actionable improvement suggestions

## 🎯 Common Issues and Solutions

### Connection Failures

```
❌ Failed to connect to provider: ENOTFOUND
```

**Solution**: Check the provider URL and network connectivity. Ensure the endpoint is correct and accessible.

### Authentication Failures

```
❌ Authentication failed for provider: 401 Unauthorized
```

**Solution**: Verify the API key is correct and has proper permissions for the requested operations.

### Model Not Found

```
❌ Chat completion failed: 404 Model not found
```

**Solution**: Check that the model name is correct for the provider. Some providers use different model names.

### Slow Performance

```
⚠️ Chat completion performance: avg 8000ms
```

**Solution**: Consider optimizing network latency, using a closer endpoint, or choosing a faster provider.

## 📝 Command Line Options

```bash
Options:
  --help, -h              Show help message
  --verbose, -v           Enable detailed output
  --providers-only        Skip setup checks, test providers only
  --quick                 Skip performance tests (faster execution)
  --report-file <path>    Save detailed report to file
```

### Examples

```bash
# Basic test with all checks
node scripts/test-custom-providers.js

# Verbose output for debugging
node scripts/test-custom-providers.js --verbose

# Quick test without performance benchmarks
node scripts/test-custom-providers.js --quick

# Save report to file for later analysis
node scripts/test-custom-providers.js --report-file test-results.txt

# Full verbose test with report saving
node scripts/test-custom-providers.js --verbose --report-file full-report.txt
```

## 🔧 Integration with CI/CD

You can integrate this script into your CI/CD pipeline:

```yaml
# GitHub Actions example
- name: Test LLM Providers
  run: |
    node scripts/test-custom-providers.js --quick
    if [ $? -eq 1 ]; then
      echo "LLM provider tests failed"
      exit 1
    fi
```

## 🐛 Troubleshooting

### Script Won't Run

```bash
Error: Cannot find module 'fs'
```

**Solution**: Ensure you're using Node.js 18+ and the script is in the correct location.

### No Providers Found

```
ℹ No providers found in configuration files
```

**Solution**: Check that your configuration files exist and contain valid provider settings.

### Timeout Errors

```
❌ Request timeout
```

**Solution**: Increase timeout values in the script or check network connectivity to the provider.

## 📚 Additional Resources

- [Custom LLM Configuration Guide](./CUSTOM_LLM_QUICK_START.md)
- [Provider Best Practices](./CUSTOM_LLM_BEST_PRACTICES.md)
- [Troubleshooting Guide](./CUSTOM_LLM_TROUBLESHOOTING.md)
- [Security Considerations](./SECURITY_IMPLEMENTATION.md)

## 🤝 Contributing

To add support for new providers or enhance the test script:

1. Update the `parseProviderConfig()` function
2. Add provider-specific test logic
3. Update the help documentation
4. Test with real provider endpoints

## 📄 License

This script is part of the AI Town project and follows the same license terms.
