#!/usr/bin/env node

/**
 * Custom LLM Provider Test Script
 *
 * This script helps verify custom LLM provider setup by testing:
 * - Provider connectivity
 * - API key validation
 * - Chat completions
 * - Embeddings
 * - Health endpoints
 * - Performance benchmarking
 * - Fallback logic
 *
 * Usage: node scripts/test-custom-providers.js [options]
 */

import fs from "fs";
import path from "path";
import https from "https";
import http from "http";
import { performance } from "perf_hooks";
import { inspect } from "util";
import { fileURLToPath } from "url";

// ES module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const CONFIG_DIR = path.join(__dirname, "../config");
const ENV_EXAMPLE = path.join(CONFIG_DIR, ".env.example");
const CUSTOM_PROVIDERS_ENV = path.join(
  CONFIG_DIR,
  "custom-providers.env.example",
);

// Test configuration
const TEST_CONFIG = {
  // Test message for chat completions
  testMessage: "Hello! This is a test message. Please respond briefly.",

  // Test text for embeddings
  testText: "This is a test text for generating embeddings.",

  // Timeout for requests (milliseconds)
  requestTimeout: 30000,

  // Performance thresholds
  performanceThresholds: {
    responseTime: 5000, // 5 seconds
    embeddingTime: 10000, // 10 seconds
    healthCheckTime: 2000, // 2 seconds
  },
};

// Colors for console output
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  white: "\x1b[37m",
};

// Test results storage
const testResults = {
  connectivity: [],
  authentication: [],
  chatCompletions: [],
  embeddings: [],
  healthChecks: [],
  performance: [],
  fallback: [],
  summary: {
    totalTests: 0,
    passedTests: 0,
    failedTests: 0,
    warnings: 0,
  },
};

/**
 * Utility functions
 */
function log(level, message, data = null) {
  const timestamp = new Date().toISOString();
  const prefix = `[${timestamp}]`;

  switch (level) {
    case "info":
      console.log(`${colors.blue}${prefix}ℹ${colors.reset} ${message}`);
      break;
    case "success":
      console.log(`${colors.green}${prefix}✅${colors.reset} ${message}`);
      break;
    case "warning":
      console.log(`${colors.yellow}${prefix}⚠️${colors.reset} ${message}`);
      break;
    case "error":
      console.log(`${colors.red}${prefix}❌${colors.reset} ${message}`);
      break;
    case "debug":
      if (process.argv.includes("--verbose")) {
        console.log(`${colors.cyan}${prefix}🔍${colors.reset} ${message}`);
      }
      break;
  }

  if (data && process.argv.includes("--verbose")) {
    console.log(`${colors.gray}Data:${colors.reset}`, data);
  }
}

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    log("warning", `Environment file not found: ${filePath}`);
    return {};
  }

  const content = fs.readFileSync(filePath, "utf8");
  const env = {};

  content.split("\n").forEach((line) => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#")) {
      const [key, ...values] = trimmed.split("=");
      if (key && values.length > 0) {
        env[key.trim()] = values
          .join("=")
          .trim()
          .replace(/^["']|["']$/g, "");
      }
    }
  });

  return env;
}

function parseProviderConfig(env) {
  const providers = {};

  // Parse OpenAI-compatible providers
  [
    "OPENAI",
    "AZURE",
    "ANTHROPIC",
    "COHERE",
    "MISTRAL",
    "LOCALAI",
    "OLLAMA",
  ].forEach((provider) => {
    const baseUrl =
      env[`${provider}_API_BASE_URL`] || env[`${provider}_BASE_URL`];
    const apiKey = env[`${provider}_API_KEY`];

    if (baseUrl) {
      providers[provider.toLowerCase()] = {
        name: provider,
        baseUrl,
        apiKey,
        type: "openai-compatible",
        version: env[`${provider}_API_VERSION`] || null,
        resourceName: env[`${provider}_RESOURCE_NAME`] || null,
        deploymentName: env[`${provider}_DEPLOYMENT_NAME`] || null,
      };
    }
  });

  // Parse custom providers
  Object.keys(env).forEach((key) => {
    if (
      key.endsWith("_API_BASE_URL") &&
      !key.includes("OPENAI") &&
      !key.includes("AZURE") &&
      !key.includes("ANTHROPIC") &&
      !key.includes("COHERE") &&
      !key.includes("MISTRAL") &&
      !key.includes("LOCALAI") &&
      !key.includes("OLLAMA")
    ) {
      const providerName = key.replace("_API_BASE_URL", "").toLowerCase();
      providers[providerName] = {
        name: providerName.toUpperCase(),
        baseUrl: env[key],
        apiKey: env[`${providerName.toUpperCase()}_API_KEY`],
        type: "openai-compatible",
        custom: true,
      };
    }
  });

  return providers;
}

async function makeHttpRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const isHttps = url.startsWith("https://");
    const client = isHttps ? https : http;

    const requestOptions = {
      method: options.method || "GET",
      headers: options.headers || {},
      timeout: options.timeout || TEST_CONFIG.requestTimeout,
      ...options,
    };

    const req = client.request(url, requestOptions, (res) => {
      let data = "";

      res.on("data", (chunk) => {
        data += chunk;
      });

      res.on("end", () => {
        try {
          const parsedData = data ? JSON.parse(data) : {};
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: parsedData,
            responseTime: Date.now() - options.startTime,
          });
        } catch (error) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: data,
            responseTime: Date.now() - options.startTime,
            parseError: error.message,
          });
        }
      });
    });

    req.on("error", (error) => {
      reject({
        error: error.message,
        code: error.code,
        responseTime: Date.now() - options.startTime,
      });
    });

    req.on("timeout", () => {
      req.destroy();
      reject({
        error: "Request timeout",
        code: "TIMEOUT",
        responseTime: Date.now() - options.startTime,
      });
    });

    if (options.body) {
      req.write(JSON.stringify(options.body));
    }

    req.end();
  });
}

/**
 * Test functions
 */
async function testConnectivity(providerName, provider) {
  log("info", `Testing connectivity to ${providerName}...`);

  const startTime = Date.now();

  try {
    const response = await makeHttpRequest(provider.baseUrl, {
      method: "GET",
      timeout: 5000,
      startTime,
    });

    const result = {
      provider: providerName,
      status:
        response.statusCode >= 200 && response.statusCode < 300
          ? "pass"
          : "fail",
      statusCode: response.statusCode,
      responseTime: response.responseTime,
      error: null,
    };

    if (result.status === "pass") {
      log(
        "success",
        `${providerName} is reachable (${response.responseTime}ms)`,
      );
    } else {
      log("error", `${providerName} returned status ${response.statusCode}`);
    }

    testResults.connectivity.push(result);
    return result;
  } catch (error) {
    const result = {
      provider: providerName,
      status: "fail",
      statusCode: null,
      responseTime: Date.now() - startTime,
      error: error.error || error.message,
    };

    log("error", `Failed to connect to ${providerName}: ${result.error}`);
    testResults.connectivity.push(result);
    return result;
  }
}

async function testAuthentication(providerName, provider) {
  if (!provider.apiKey) {
    log(
      "warning",
      `No API key configured for ${providerName}, skipping authentication test`,
    );
    const result = {
      provider: providerName,
      status: "skip",
      reason: "No API key configured",
    };
    testResults.authentication.push(result);
    return result;
  }

  log("info", `Testing authentication for ${providerName}...`);

  const startTime = Date.now();

  try {
    // Try to list models as a simple authentication test
    const url = `${provider.baseUrl.replace(/\/$/, "")}/models`;

    const response = await makeHttpRequest(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${provider.apiKey}`,
        "Content-Type": "application/json",
      },
      timeout: TEST_CONFIG.requestTimeout,
      startTime,
    });

    const result = {
      provider: providerName,
      status: response.statusCode === 200 ? "pass" : "fail",
      statusCode: response.statusCode,
      responseTime: response.responseTime,
      error: null,
    };

    if (result.status === "pass") {
      log(
        "success",
        `${providerName} authentication successful (${response.responseTime}ms)`,
      );
      if (response.data && response.data.data) {
        log(
          "debug",
          `Available models: ${response.data.data.length} models found`,
        );
      }
    } else {
      log(
        "error",
        `${providerName} authentication failed (status: ${response.statusCode})`,
      );
    }

    testResults.authentication.push(result);
    return result;
  } catch (error) {
    const result = {
      provider: providerName,
      status: "fail",
      statusCode: null,
      responseTime: Date.now() - startTime,
      error: error.error || error.message,
    };

    log("error", `Authentication failed for ${providerName}: ${result.error}`);
    testResults.authentication.push(result);
    return result;
  }
}

async function testChatCompletion(providerName, provider) {
  if (!provider.apiKey) {
    log(
      "warning",
      `No API key configured for ${providerName}, skipping chat completion test`,
    );
    const result = {
      provider: providerName,
      status: "skip",
      reason: "No API key configured",
    };
    testResults.chatCompletions.push(result);
    return result;
  }

  log("info", `Testing chat completions for ${providerName}...`);

  const startTime = Date.now();

  try {
    let url = `${provider.baseUrl.replace(/\/$/, "")}/chat/completions`;

    // Handle Azure OpenAI special case
    if (
      provider.name === "AZURE" &&
      provider.resourceName &&
      provider.deploymentName
    ) {
      url = `https://${provider.resourceName}.openai.azure.com/openai/deployments/${provider.deploymentName}/chat/completions?api-version=${provider.version || "2023-12-01-preview"}`;
    }

    const requestBody = {
      model: provider.deploymentName || "gpt-3.5-turbo", // Fallback model name
      messages: [
        {
          role: "user",
          content: TEST_CONFIG.testMessage,
        },
      ],
      max_tokens: 50,
      temperature: 0.7,
    };

    const response = await makeHttpRequest(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${provider.apiKey}`,
        "Content-Type": "application/json",
        ...(provider.name === "AZURE" && { "api-key": provider.apiKey }),
      },
      body: requestBody,
      timeout: TEST_CONFIG.requestTimeout,
      startTime,
    });

    const result = {
      provider: providerName,
      status: response.statusCode === 200 ? "pass" : "fail",
      statusCode: response.statusCode,
      responseTime: response.responseTime,
      error: null,
      hasResponse: !!(
        response.data &&
        response.data.choices &&
        response.data.choices.length > 0
      ),
    };

    if (result.status === "pass" && result.hasResponse) {
      const reply = response.data.choices[0].message.content;
      log(
        "success",
        `${providerName} chat completion successful (${response.responseTime}ms)`,
      );
      log(
        "debug",
        `Response: "${reply.substring(0, 100)}${reply.length > 100 ? "..." : ""}"`,
      );
    } else if (result.status === "pass") {
      log(
        "warning",
        `${providerName} responded but no valid chat completion received`,
      );
      result.status = "partial";
    } else {
      log(
        "error",
        `${providerName} chat completion failed (status: ${response.statusCode})`,
      );
    }

    testResults.chatCompletions.push(result);
    return result;
  } catch (error) {
    const result = {
      provider: providerName,
      status: "fail",
      statusCode: null,
      responseTime: Date.now() - startTime,
      error: error.error || error.message,
    };

    log("error", `Chat completion failed for ${providerName}: ${result.error}`);
    testResults.chatCompletions.push(result);
    return result;
  }
}

async function testEmbeddings(providerName, provider) {
  if (!provider.apiKey) {
    log(
      "warning",
      `No API key configured for ${providerName}, skipping embeddings test`,
    );
    const result = {
      provider: providerName,
      status: "skip",
      reason: "No API key configured",
    };
    testResults.embeddings.push(result);
    return result;
  }

  log("info", `Testing embeddings for ${providerName}...`);

  const startTime = Date.now();

  try {
    let url = `${provider.baseUrl.replace(/\/$/, "")}/embeddings`;

    // Handle Azure OpenAI special case
    if (
      provider.name === "AZURE" &&
      provider.resourceName &&
      provider.deploymentName
    ) {
      url = `https://${provider.resourceName}.openai.azure.com/openai/deployments/${provider.deploymentName}/embeddings?api-version=${provider.version || "2023-12-01-preview"}`;
    }

    const requestBody = {
      model: provider.deploymentName || "text-embedding-ada-002", // Fallback model name
      input: TEST_CONFIG.testText,
    };

    const response = await makeHttpRequest(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${provider.apiKey}`,
        "Content-Type": "application/json",
        ...(provider.name === "AZURE" && { "api-key": provider.apiKey }),
      },
      body: requestBody,
      timeout: TEST_CONFIG.requestTimeout,
      startTime,
    });

    const result = {
      provider: providerName,
      status: response.statusCode === 200 ? "pass" : "fail",
      statusCode: response.statusCode,
      responseTime: response.responseTime,
      error: null,
      hasEmbedding: !!(
        response.data &&
        response.data.data &&
        response.data.data.length > 0
      ),
    };

    if (result.status === "pass" && result.hasEmbedding) {
      const embedding = response.data.data[0];
      const dimensions = embedding.embedding
        ? embedding.embedding.length
        : "unknown";
      log(
        "success",
        `${providerName} embeddings successful (${response.responseTime}ms, ${dimensions} dimensions)`,
      );
    } else if (result.status === "pass") {
      log(
        "warning",
        `${providerName} responded but no valid embedding received`,
      );
      result.status = "partial";
    } else {
      log(
        "error",
        `${providerName} embeddings failed (status: ${response.statusCode})`,
      );
    }

    testResults.embeddings.push(result);
    return result;
  } catch (error) {
    const result = {
      provider: providerName,
      status: "fail",
      statusCode: null,
      responseTime: Date.now() - startTime,
      error: error.error || error.message,
    };

    log("error", `Embeddings failed for ${providerName}: ${result.error}`);
    testResults.embeddings.push(result);
    return result;
  }
}

async function testHealthCheck(providerName, provider) {
  log("info", `Testing health check for ${providerName}...`);

  const startTime = Date.now();

  // Try common health endpoint patterns
  const healthEndpoints = [
    "/health",
    "/status",
    "/ping",
    "/v1/health",
    "/v1/status",
    "/v1/ping",
  ];

  for (const endpoint of healthEndpoints) {
    try {
      const url = `${provider.baseUrl.replace(/\/$/, "")}${endpoint}`;

      const response = await makeHttpRequest(url, {
        method: "GET",
        timeout: TEST_CONFIG.performanceThresholds.healthCheckTime,
        startTime,
      });

      const result = {
        provider: providerName,
        endpoint,
        status:
          response.statusCode >= 200 && response.statusCode < 300
            ? "pass"
            : "fail",
        statusCode: response.statusCode,
        responseTime: response.responseTime,
        error: null,
      };

      if (result.status === "pass") {
        log(
          "success",
          `${providerName} health check passed via ${endpoint} (${response.responseTime}ms)`,
        );
        testResults.healthChecks.push(result);
        return result;
      }
    } catch (error) {
      // Try next endpoint
      continue;
    }
  }

  // If no health endpoints work, mark as not available
  const result = {
    provider: providerName,
    endpoint: "none",
    status: "skip",
    reason: "No health endpoint available",
    responseTime: Date.now() - startTime,
  };

  log("warning", `${providerName} no health endpoints available`);
  testResults.healthChecks.push(result);
  return result;
}

async function testPerformance(providerName, provider) {
  if (!provider.apiKey) {
    const result = {
      provider: providerName,
      status: "skip",
      reason: "No API key configured",
    };
    testResults.performance.push(result);
    return result;
  }

  log("info", `Running performance tests for ${providerName}...`);

  const results = {
    provider: providerName,
    chatCompletions: [],
    embeddings: [],
  };

  // Test chat completion performance
  try {
    const times = [];
    const iterations = 3;

    for (let i = 0; i < iterations; i++) {
      const startTime = Date.now();

      let url = `${provider.baseUrl.replace(/\/$/, "")}/chat/completions`;
      if (
        provider.name === "AZURE" &&
        provider.resourceName &&
        provider.deploymentName
      ) {
        url = `https://${provider.resourceName}.openai.azure.com/openai/deployments/${provider.deploymentName}/chat/completions?api-version=${provider.version || "2023-12-01-preview"}`;
      }

      const response = await makeHttpRequest(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${provider.apiKey}`,
          "Content-Type": "application/json",
          ...(provider.name === "AZURE" && { "api-key": provider.apiKey }),
        },
        body: {
          model: provider.deploymentName || "gpt-3.5-turbo",
          messages: [{ role: "user", content: "Performance test" }],
          max_tokens: 10,
        },
        timeout: TEST_CONFIG.requestTimeout,
        startTime,
      });

      if (response.statusCode === 200) {
        times.push(response.responseTime);
      }
    }

    if (times.length > 0) {
      const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
      const minTime = Math.min(...times);
      const maxTime = Math.max(...times);

      results.chatCompletions = {
        average: avgTime,
        min: minTime,
        max: maxTime,
        samples: times.length,
        withinThreshold:
          avgTime <= TEST_CONFIG.performanceThresholds.responseTime,
      };

      const status = results.chatCompletions.withinThreshold
        ? "pass"
        : "warning";
      log(
        status === "pass" ? "success" : "warning",
        `${providerName} chat completion performance: avg ${avgTime.toFixed(0)}ms (min: ${minTime}ms, max: ${maxTime}ms)`,
      );
    }
  } catch (error) {
    log(
      "error",
      `Chat completion performance test failed for ${providerName}: ${error.error || error.message}`,
    );
    results.chatCompletions = { error: error.error || error.message };
  }

  // Test embedding performance
  try {
    const times = [];
    const iterations = 3;

    for (let i = 0; i < iterations; i++) {
      const startTime = Date.now();

      let url = `${provider.baseUrl.replace(/\/$/, "")}/embeddings`;
      if (
        provider.name === "AZURE" &&
        provider.resourceName &&
        provider.deploymentName
      ) {
        url = `https://${provider.resourceName}.openai.azure.com/openai/deployments/${provider.deploymentName}/embeddings?api-version=${provider.version || "2023-12-01-preview"}`;
      }

      const response = await makeHttpRequest(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${provider.apiKey}`,
          "Content-Type": "application/json",
          ...(provider.name === "AZURE" && { "api-key": provider.apiKey }),
        },
        body: {
          model: provider.deploymentName || "text-embedding-ada-002",
          input: "Performance test",
        },
        timeout: TEST_CONFIG.requestTimeout,
        startTime,
      });

      if (response.statusCode === 200) {
        times.push(response.responseTime);
      }
    }

    if (times.length > 0) {
      const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
      const minTime = Math.min(...times);
      const maxTime = Math.max(...times);

      results.embeddings = {
        average: avgTime,
        min: minTime,
        max: maxTime,
        samples: times.length,
        withinThreshold:
          avgTime <= TEST_CONFIG.performanceThresholds.embeddingTime,
      };

      const status = results.embeddings.withinThreshold ? "pass" : "warning";
      log(
        status === "pass" ? "success" : "warning",
        `${providerName} embedding performance: avg ${avgTime.toFixed(0)}ms (min: ${minTime}ms, max: ${maxTime}ms)`,
      );
    }
  } catch (error) {
    log(
      "error",
      `Embedding performance test failed for ${providerName}: ${error.error || error.message}`,
    );
    results.embeddings = { error: error.error || error.message };
  }

  // Overall performance assessment
  results.status = "pass";
  if (results.chatCompletions.error || results.embeddings.error) {
    results.status = "fail";
  } else if (
    !results.chatCompletions.withinThreshold ||
    !results.embeddings.withinThreshold
  ) {
    results.status = "warning";
  }

  testResults.performance.push(results);
  return results;
}

async function testFallbackLogic(providers) {
  log("info", "Testing fallback logic...");

  const result = {
    status: "pass",
    totalProviders: Object.keys(providers).length,
    workingProviders: 0,
    recommendations: [],
  };

  // Count working providers
  for (const [providerName, provider] of Object.entries(providers)) {
    const connectivityResult = testResults.connectivity.find(
      (r) => r.provider === providerName,
    );
    const authResult = testResults.authentication.find(
      (r) => r.provider === providerName,
    );

    if (
      connectivityResult &&
      connectivityResult.status === "pass" &&
      authResult &&
      authResult.status === "pass"
    ) {
      result.workingProviders++;
    }
  }

  if (result.workingProviders === 0) {
    result.status = "fail";
    result.recommendations.push(
      "No working providers found. Check your configuration.",
    );
  } else if (result.workingProviders === 1) {
    result.status = "warning";
    result.recommendations.push(
      "Only one working provider available. Consider configuring backup providers.",
    );
  } else {
    result.recommendations.push(
      `${result.workingProviders} working providers available for fallback.`,
    );
  }

  // Check for diverse provider types
  const providerTypes = new Set();
  Object.values(providers).forEach((p) => providerTypes.add(p.type));

  if (providerTypes.size > 1) {
    result.recommendations.push(
      "Diverse provider types configured for better resilience.",
    );
  }

  log(
    result.status === "pass"
      ? "success"
      : result.status === "warning"
        ? "warning"
        : "error",
    `Fallback logic test: ${result.workingProviders}/${result.totalProviders} providers working`,
  );

  testResults.fallback.push(result);
  return result;
}

/**
 * Report generation
 */
function generateReport() {
  console.log("\n" + "=".repeat(80));
  console.log(
    colors.bright +
      colors.cyan +
      "🔍 CUSTOM LLM PROVIDER TEST REPORT" +
      colors.reset,
  );
  console.log("=".repeat(80));

  // Calculate summary
  testResults.summary.totalTests = 0;
  testResults.summary.passedTests = 0;
  testResults.summary.failedTests = 0;
  testResults.summary.warnings = 0;

  Object.values(testResults).forEach((category) => {
    if (Array.isArray(category)) {
      category.forEach((test) => {
        if (test.status) {
          testResults.summary.totalTests++;
          switch (test.status) {
            case "pass":
              testResults.summary.passedTests++;
              break;
            case "fail":
              testResults.summary.failedTests++;
              break;
            case "warning":
            case "partial":
              testResults.summary.warnings++;
              break;
          }
        }
      });
    }
  });

  // Summary section
  console.log("\n" + colors.bright + "📊 SUMMARY" + colors.reset);
  console.log("-".repeat(40));
  console.log(`Total Tests: ${testResults.summary.totalTests}`);
  console.log(
    `${colors.green}Passed: ${testResults.summary.passedTests}${colors.reset}`,
  );
  console.log(
    `${colors.yellow}Warnings: ${testResults.summary.warnings}${colors.reset}`,
  );
  console.log(
    `${colors.red}Failed: ${testResults.summary.failedTests}${colors.reset}`,
  );

  const successRate =
    testResults.summary.totalTests > 0
      ? (
          (testResults.summary.passedTests / testResults.summary.totalTests) *
          100
        ).toFixed(1)
      : 0;
  console.log(`Success Rate: ${successRate}%`);

  // Detailed results
  const sections = [
    { name: "Connectivity", results: testResults.connectivity },
    { name: "Authentication", results: testResults.authentication },
    { name: "Chat Completions", results: testResults.chatCompletions },
    { name: "Embeddings", results: testResults.embeddings },
    { name: "Health Checks", results: testResults.healthChecks },
    { name: "Performance", results: testResults.performance },
  ];

  sections.forEach((section) => {
    if (section.results.length > 0) {
      console.log(
        "\n" +
          colors.bright +
          `🔧 ${section.name.toUpperCase()}` +
          colors.reset,
      );
      console.log("-".repeat(40));

      section.results.forEach((result) => {
        const provider = result.provider || "N/A";
        const status = result.status || "unknown";
        const time = result.responseTime ? `${result.responseTime}ms` : "N/A";

        let statusIcon;
        switch (status) {
          case "pass":
            statusIcon = `${colors.green}✅${colors.reset}`;
            break;
          case "warning":
          case "partial":
            statusIcon = `${colors.yellow}⚠️${colors.reset}`;
            break;
          case "fail":
            statusIcon = `${colors.red}❌${colors.reset}`;
            break;
          case "skip":
            statusIcon = `${colors.cyan}⏭️${colors.reset}`;
            break;
          default:
            statusIcon = `${colors.gray}❓${colors.reset}`;
        }

        console.log(
          `${statusIcon} ${provider.padEnd(20)} ${status.padEnd(10)} ${time.padEnd(10)}`,
        );

        if (result.error) {
          console.log(`   ${colors.red}Error: ${result.error}${colors.reset}`);
        }
        if (result.reason) {
          console.log(
            `   ${colors.yellow}Reason: ${result.reason}${colors.reset}`,
          );
        }
      });
    }
  });

  // Performance summary
  if (testResults.performance.length > 0) {
    console.log("\n" + colors.bright + "⚡ PERFORMANCE SUMMARY" + colors.reset);
    console.log("-".repeat(40));

    testResults.performance.forEach((result) => {
      if (result.chatCompletions && result.chatCompletions.average) {
        const chatStatus = result.chatCompletions.withinThreshold
          ? colors.green
          : colors.yellow;
        console.log(
          `${chatStatus}${result.provider} Chat: ${result.chatCompletions.average.toFixed(0)}ms avg${colors.reset}`,
        );
      }

      if (result.embeddings && result.embeddings.average) {
        const embedStatus = result.embeddings.withinThreshold
          ? colors.green
          : colors.yellow;
        console.log(
          `${embedStatus}${result.provider} Embeddings: ${result.embeddings.average.toFixed(0)}ms avg${colors.reset}`,
        );
      }
    });
  }

  // Fallback logic
  if (testResults.fallback.length > 0) {
    console.log("\n" + colors.bright + "🔄 FALLBACK LOGIC" + colors.reset);
    console.log("-".repeat(40));

    testResults.fallback.forEach((result) => {
      result.recommendations.forEach((rec) => {
        console.log(`• ${rec}`);
      });
    });
  }

  // Recommendations
  console.log("\n" + colors.bright + "💡 RECOMMENDATIONS" + colors.reset);
  console.log("-".repeat(40));

  const recommendations = [];

  // Check for common issues
  const failedConnectivity = testResults.connectivity.filter(
    (r) => r.status === "fail",
  );
  if (failedConnectivity.length > 0) {
    recommendations.push(
      "Some providers are not reachable. Check network connectivity and URLs.",
    );
  }

  const failedAuth = testResults.authentication.filter(
    (r) => r.status === "fail",
  );
  if (failedAuth.length > 0) {
    recommendations.push(
      "Authentication failed for some providers. Verify API keys are correct and have proper permissions.",
    );
  }

  const failedChat = testResults.chatCompletions.filter(
    (r) => r.status === "fail",
  );
  if (failedChat.length > 0) {
    recommendations.push(
      "Chat completions failed for some providers. Check model names and API compatibility.",
    );
  }

  const failedEmbeddings = testResults.embeddings.filter(
    (r) => r.status === "fail",
  );
  if (failedEmbeddings.length > 0) {
    recommendations.push(
      "Embeddings failed for some providers. Verify embedding models are available.",
    );
  }

  const slowPerformance = testResults.performance.filter(
    (r) =>
      (r.chatCompletions && !r.chatCompletions.withinThreshold) ||
      (r.embeddings && !r.embeddings.withinThreshold),
  );
  if (slowPerformance.length > 0) {
    recommendations.push(
      "Some providers are slow. Consider performance optimization or alternative providers.",
    );
  }

  if (recommendations.length === 0) {
    recommendations.push(
      "All tests passed! Your custom LLM provider setup is working correctly.",
    );
  }

  recommendations.forEach((rec, index) => {
    console.log(`${index + 1}. ${rec}`);
  });

  console.log("\n" + "=".repeat(80));
  console.log(
    colors.bright +
      "Test completed at: " +
      new Date().toISOString() +
      colors.reset,
  );
  console.log("=".repeat(80));
}

/**
 * Help and usage
 */
function showHelp() {
  console.log(`
${colors.bright}Custom LLM Provider Test Script${colors.reset}

${colors.cyan}Usage:${colors.reset}
  node scripts/test-custom-providers.js [options]

${colors.cyan}Options:${colors.reset}
  --help, -h              Show this help message
  --verbose, -v           Enable verbose output
  --providers-only        Only test configured providers, skip setup checks
  --quick                 Run quick tests (skip performance tests)
  --report-file <path>    Save report to file

${colors.cyan}Environment Files:${colors.reset}
  The script will check for configuration in:
  - config/.env.example
  - config/custom-providers.env.example

${colors.cyan}Examples:${colors.reset}
  node scripts/test-custom-providers.js
  node scripts/test-custom-providers.js --verbose
  node scripts/test-custom-providers.js --quick --report-file test-report.txt

${colors.cyan}What it tests:${colors.reset}
  ✅ Provider connectivity
  ✅ API key authentication
  ✅ Chat completions
  ✅ Embeddings generation
  ✅ Health endpoints
  ✅ Performance benchmarking
  ✅ Fallback logic
  ✅ Comprehensive reporting
`);
}

/**
 * Main execution
 */
async function main() {
  console.log(
    colors.bright +
      colors.cyan +
      "🚀 Custom LLM Provider Test Script" +
      colors.reset,
  );
  console.log("Testing your custom LLM provider configuration...\n");

  // Parse command line arguments
  const args = process.argv.slice(2);
  if (args.includes("--help") || args.includes("-h")) {
    showHelp();
    return;
  }

  const verbose = args.includes("--verbose") || args.includes("-v");
  const providersOnly = args.includes("--providers-only");
  const quick = args.includes("--quick");
  const reportFileIndex = args.indexOf("--report-file");
  const reportFile = reportFileIndex !== -1 ? args[reportFileIndex + 1] : null;

  try {
    // Load configuration
    log("info", "Loading configuration...");
    const env = {
      ...loadEnvFile(ENV_EXAMPLE),
      ...loadEnvFile(CUSTOM_PROVIDERS_ENV),
    };
    const providers = parseProviderConfig(env);

    if (Object.keys(providers).length === 0) {
      log("error", "No providers found in configuration files");
      log(
        "info",
        "Please check config/.env.example and config/custom-providers.env.example",
      );
      process.exit(1);
    }

    log(
      "info",
      `Found ${Object.keys(providers).length} provider(s): ${Object.keys(providers).join(", ")}`,
    );

    // Run tests
    for (const [providerName, provider] of Object.entries(providers)) {
      console.log(
        `\n${colors.bright}Testing ${providerName.toUpperCase()}${colors.reset}`,
      );
      console.log("-".repeat(50));

      await testConnectivity(providerName, provider);
      await testAuthentication(providerName, provider);
      await testChatCompletion(providerName, provider);
      await testEmbeddings(providerName, provider);
      await testHealthCheck(providerName, provider);

      if (!quick) {
        await testPerformance(providerName, provider);
      }
    }

    // Test fallback logic
    await testFallbackLogic(providers);

    // Generate report
    generateReport();

    // Save report if requested
    if (reportFile) {
      const reportContent = inspect(testResults, {
        depth: null,
        colors: false,
      });
      fs.writeFileSync(
        reportFile,
        `Custom LLM Provider Test Report\n${"=".repeat(50)}\n\n${reportContent}`,
      );
      log("info", `Report saved to: ${reportFile}`);
    }

    // Exit with appropriate code
    if (testResults.summary.failedTests > 0) {
      log("error", "Some tests failed. Please check the report above.");
      process.exit(1);
    } else if (testResults.summary.warnings > 0) {
      log("warning", "Tests completed with warnings.");
      process.exit(2);
    } else {
      log("success", "All tests passed successfully!");
      process.exit(0);
    }
  } catch (error) {
    log("error", `Unexpected error: ${error.message}`);
    if (verbose) {
      console.error(error);
    }
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export {
  testConnectivity,
  testAuthentication,
  testChatCompletion,
  testEmbeddings,
  testHealthCheck,
  testPerformance,
  testFallbackLogic,
  generateReport,
};
