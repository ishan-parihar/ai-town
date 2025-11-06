/**
 * Server Application Index
 *
 * This file provides references to all server applications in the project.
 * Server files are organized in this directory for better maintainability.
 */

// Server paths for reference
export const SERVER_PATHS = {
  main: "./server/server.js",
  secure: "./server/secure-server.js",
  logs: "./server/server.log",
} as const;

/**
 * Server information
 */
export const SERVER_INFO = {
  main: {
    path: SERVER_PATHS.main,
    description: "Main server application with Express.js",
    port: process.env.PORT || 3000,
  },
  secure: {
    path: SERVER_PATHS.secure,
    description: "Secure server with enterprise-grade security features",
    port: process.env.SECURE_PORT || 3001,
  },
} as const;
