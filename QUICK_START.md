# AI Town - Quick Start Guide

## 🚀 Single Command Startup

You can now start the entire AI Town application with a single command! No need to run backend and frontend separately.

### Option 1: Quick Start (Recommended for development)
```bash
npm run start:quick
```
Or directly:
```bash
./start-quick.sh
```

**What it does:**
- Starts API server on port 3002
- Starts frontend on port 8080  
- Initializes services quickly
- Provides simple output

### Option 2: Full Start (Production-ready)
```bash
npm run start
```
Or directly:
```bash
./start-ai-town.sh
```

**What it does:**
- Comprehensive service health checks
- Port conflict detection and resolution
- Service monitoring and auto-restart
- Detailed logging to `logs/` directory
- Graceful shutdown handling
- Convex backend initialization

### Option 3: Original Development Mode
```bash
npm run dev
```
**Note:** This uses the original Vite setup which may have connectivity issues.

## 📱 Access the Application

Once started, access the application at:
- **Frontend**: http://localhost:8080
- **API Server**: http://localhost:3002
- **Login**: user@example.com / password (if authentication is enabled)

## 🛑 Stopping the Application

Press `Ctrl+C` in the terminal where the script is running. All services will stop gracefully.

## 📋 Service Status

The startup script will show you:
- ✅ Service health status
- 📱 Application URLs
- 🔑 Login credentials (if needed)
- 📋 Process IDs for debugging

## 🔧 Troubleshooting

If you encounter issues:
1. Check if ports 3002 and 8080 are free
2. Run `./start-ai-town.sh` for detailed logging
3. Check the `logs/` directory for service logs
4. Make sure all dependencies are installed (`npm install`)

## 🎯 Features Available

- AI Council Dashboard with 8 specialized members
- Real-time API integration
- System statistics and monitoring
- Personal data input capabilities
- Telegram integration dashboard
- Authentication bypassed (direct dashboard access)

That's it! With `npm run start:quick`, you have the entire AI Town application running with a single command.