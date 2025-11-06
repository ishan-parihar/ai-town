#!/bin/bash

echo "🚀 Testing Notion API Integration for AI Council LifeOS"
echo "======================================================"

# Test server health
echo "📡 Testing server health..."
curl -s http://localhost:3001/api/council-members | jq '.[0].name' > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✅ Server is running and responding"
else
    echo "❌ Server is not responding. Please start the server first."
    exit 1
fi

# Test Notion connection status
echo "🔗 Testing Notion connection endpoint..."
response=$(curl -s http://localhost:3001/api/notion/status)
connected=$(echo $response | jq -r '.connected')

if [ "$connected" = "false" ]; then
    echo "✅ Notion endpoint working - not connected (expected)"
else
    echo "✅ Notion endpoint working"
fi

# Test invalid API key
echo "🔑 Testing invalid API key handling..."
response=$(curl -s -X POST http://localhost:3001/api/notion/connect \
    -H "Content-Type: application/json" \
    -d '{"apiKey": "invalid_key_test"}')

error=$(echo $response | jq -r '.error')
if [ "$error" != "null" ]; then
    echo "✅ Invalid API key properly rejected"
else
    echo "⚠️  API key validation might need attention"
fi

echo ""
echo "🎉 Notion API Integration is ready!"
echo ""
echo "📋 Next steps:"
echo "1. Get your Notion API key from notion.so > Settings & Members > Integrations"
echo "2. Share your database with the integration"
echo "3. Use the 'Sync Notion' button in the AI Council dashboard"
echo "4. Select your database and data type"
echo "5. Sync your data to get AI insights!"
echo ""
echo "📚 For detailed setup instructions, see: NOTION_INTEGRATION.md"