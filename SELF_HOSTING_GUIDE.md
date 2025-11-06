# AI Town Self-Hosting Guide

## 🎯 Overview

This guide helps you migrate AI Town from Convex's cloud service to a self-hosted solution using PostgreSQL and Redis. This eliminates vendor lock-in and reduces costs while maintaining full functionality.

## 🔧 Fixed Issues

### GLM-4.6 Reasoning Content Issue ✅
**Problem**: GLM-4.6 returns `reasoning_content` instead of `content`, causing parsing errors.

**Solution**: Updated `convex/util/llm.ts` to handle both content types:
```typescript
// Support both content and reasoning_content for GLM-4.6 and other reasoning models
const content = message?.content || message?.reasoning_content;
```

### URL Path Duplication ✅
**Problem**: System was appending `/v1` to URLs that already contained it.

**Solution**: Proper URL handling to prevent duplication.

## 🏗️ Architecture

### Current (Convex-Dependent)
```
Frontend → Convex Cloud → External LLMs
```

### Self-Hosted Solution
```
Frontend → Node.js/Express → PostgreSQL + pgvector → External LLMs
                    ↓
                 Redis (Cache/Sessions)
```

## 🚀 Quick Start

### 1. Environment Setup

Create your `.env` file:
```bash
# Database Configuration
DATABASE_PROVIDER=postgresql
POSTGRES_URL=postgresql://aitown:aitown_password@localhost:5432/aitown

# Cache Configuration  
REDIS_URL=redis://localhost:6379

# LLM Configuration (GLM-4.6 working)
CUSTOM_PROVIDER_1_NAME="iFlow"
CUSTOM_PROVIDER_1_URL="https://apis.iflow.cn/v1/"
CUSTOM_PROVIDER_1_API_KEY="your-api-key"
CUSTOM_PROVIDER_1_CHAT_MODEL="glm-4.6"
CUSTOM_PROVIDER_1_EMBEDDING_DIMENSION="1024"
EMBEDDING_DIMENSION="1024"
```

### 2. Docker Deployment (Recommended)

```bash
# Start all services
docker-compose -f docker-compose.self-hosted.yml up -d

# Check service health
docker-compose -f docker-compose.self-hosted.yml ps

# View logs
docker-compose -f docker-compose.self-hosted.yml logs -f app
```

### 3. Manual Installation

```bash
# Install PostgreSQL with pgvector
brew install pgvector  # macOS
# OR
sudo apt-get install postgresql-16-pgvector  # Ubuntu

# Install Redis
brew install redis  # macOS
# OR  
sudo apt-get install redis-server  # Ubuntu

# Install dependencies
npm install

# Start services
npm run dev
```

## 📊 Migration Process

### Step 1: Export from Convex
```bash
node scripts/migrate-convex.js export
```

### Step 2: Setup PostgreSQL
```bash
# Create database
createdb aitown

# Initialize schema
psql aitown < docker/postgres/init.sql
```

### Step 3: Import to PostgreSQL
```bash
node scripts/migrate-convex.js import
```

### Step 4: Validate Migration
```bash
node scripts/migrate-convex.js validate
```

### Step 5: Switch to Self-Hosted
```bash
# Update .env
DATABASE_PROVIDER=postgresql

# Restart application
npm run dev
```

## 🗄️ Database Schema

### Core Tables
- `worlds` - Main game state
- `maps` - Map data (separated for performance)
- `player_descriptions` - Player information
- `agent_descriptions` - AI agent configurations
- `messages` - Chat messages
- `memories` - Agent memories with embeddings
- `memory_embeddings` - Vector storage (pgvector)

### Vector Operations
```sql
-- Vector similarity search
SELECT id, metadata, 1 - (embedding <=> '[0.1,0.2,...]') as similarity
FROM memory_embeddings 
WHERE 1 - (embedding <=> '[0.1,0.2,...]') > 0.7
ORDER BY similarity DESC
LIMIT 10;
```

## 🔧 Configuration Options

### Database Providers
```bash
# PostgreSQL (Recommended)
DATABASE_PROVIDER=postgresql
POSTGRES_URL=postgresql://user:pass@host:5432/dbname

# MongoDB
DATABASE_PROVIDER=mongodb  
MONGODB_URL=mongodb://user:pass@host:27017/dbname

# In-Memory (Testing)
DATABASE_PROVIDER=memory
```

### LLM Providers
```bash
# GLM-4.6 (Working)
CUSTOM_PROVIDER_1_NAME="iFlow"
CUSTOM_PROVIDER_1_URL="https://apis.iflow.cn/v1/"
CUSTOM_PROVIDER_1_API_KEY="sk-..."
CUSTOM_PROVIDER_1_CHAT_MODEL="glm-4.6"

# OpenAI
OPENAI_API_KEY="sk-..."

# Local Models
CUSTOM_PROVIDER_2_NAME="Local"
CUSTOM_PROVIDER_2_URL="http://localhost:11434/v1/"
CUSTOM_PROVIDER_2_CHAT_MODEL="llama2"
```

## 📈 Performance Comparison

### Convex Cloud
- ✅ Easy setup
- ✅ Auto-scaling
- ❌ Vendor lock-in
- ❌ Usage limits (1GB storage, 500K runs/month)
- ❌ Cost: ~$20-100/month

### Self-Hosted
- ✅ No vendor lock-in
- ✅ Unlimited usage
- ✅ Full control
- ✅ Cost: $5-20/month (VPS)
- ❌ Manual setup
- ❌ Maintenance required

## 🔍 Monitoring & Maintenance

### Health Checks
```bash
# Database health
npm run health:check

# Service status  
docker-compose -f docker-compose.self-hosted.yml ps

# Logs
docker-compose -f docker-compose.self-hosted.yml logs -f
```

### Monitoring Stack
- **Prometheus**: Metrics collection
- **Grafana**: Visualization
- **Health checks**: Service monitoring

Access dashboards:
- Grafana: http://localhost:3001 (admin/admin)
- Prometheus: http://localhost:9090

## 🛡️ Security Considerations

### Database Security
```bash
# Use strong passwords
POSTGRES_PASSWORD=$(openssl rand -base64 32)

# Enable SSL
POSTGRES_SSL=true

# Network isolation
# Use Docker networks or VPN
```

### API Security
```bash
# Environment variables for secrets
JWT_SECRET=$(openssl rand -hex 32)
ENCRYPTION_KEY=$(openssl rand -hex 32)

# Rate limiting
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX=100
```

## 🔄 Backup & Recovery

### Automated Backups
```bash
# PostgreSQL backup
pg_dump aitown > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore backup
psql aitown < backup_20231201_120000.sql
```

### Docker Volume Backups
```bash
# Backup volumes
docker run --rm -v aitown_postgres_data:/data -v $(pwd):/backup ubuntu tar cvf /backup/postgres_backup.tar /data

# Restore volumes  
docker run --rm -v aitown_postgres_data:/data -v $(pwd):/backup ubuntu xvf /backup/postgres_backup.tar -C /
```

## 🚨 Troubleshooting

### Common Issues

#### GLM-4.6 Errors
```bash
# Test API connection
node test-glm4-fix.cjs

# Check URL configuration
echo $CUSTOM_PROVIDER_1_URL
```

#### Database Connection
```bash
# Test PostgreSQL connection
psql $POSTGRES_URL -c "SELECT 1;"

# Check Docker logs
docker logs aitown-postgres
```

#### Vector Search Issues
```bash
# Verify pgvector extension
psql $POSTGRES_URL -c "SELECT * FROM pg_extension WHERE extname = 'vector';"

# Check vector dimensions
psql $POSTGRES_URL -c "\\d memory_embeddings"
```

### Performance Issues
```bash
# Check slow queries
psql $POSTGRES_URL -c "SELECT query, mean_time, calls FROM pg_stat_statements ORDER BY mean_time DESC LIMIT 10;"

# Monitor connections
psql $POSTGRES_URL -c "SELECT count(*) FROM pg_stat_activity;"
```

## 📚 Development

### Testing
```bash
# Test with in-memory database
DATABASE_PROVIDER=memory npm test

# Test PostgreSQL integration
DATABASE_PROVIDER=postgresql npm run test:integration
```

### Database Schema Changes
```bash
# Create migration
npm run migration:create add_new_table

# Run migration  
npm run migration:up

# Rollback migration
npm run migration:down
```

## 🆘 Support

### Getting Help
1. Check [GitHub Issues](https://github.com/a16z-infra/ai-town/issues)
2. Review this documentation
3. Check logs for specific error messages
4. Join community discussions

### Contributing
1. Fork the repository
2. Create feature branch
3. Test with both Convex and PostgreSQL
4. Submit pull request

## 🎉 Success Metrics

### Migration Complete When:
- ✅ All data exported from Convex
- ✅ PostgreSQL schema created
- ✅ Data imported successfully  
- ✅ Application runs with PostgreSQL
- ✅ GLM-4.6 responses working
- ✅ Vector search functional
- ✅ Performance acceptable
- ✅ Backups configured
- ✅ Monitoring setup

### Expected Results:
- **Cost Savings**: 50-80% reduction in hosting costs
- **Performance**: Equal or better than Convex
- **Reliability**: 99.9% uptime with proper setup
- **Scalability**: Vertical scaling with larger VPS
- **Control**: Full data ownership and control

---

**🎯 Next Steps**: Run the migration script and enjoy your self-hosted AI Council LifeOS!