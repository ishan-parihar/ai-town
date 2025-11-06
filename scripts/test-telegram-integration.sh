#!/bin/bash

# Telegram Bot Integration Test Script
# This script tests the Telegram API endpoints

echo "🤖 Testing Telegram Bot Integration"
echo "=================================="

BASE_URL="http://localhost:3001"
BOT_TOKEN="${1:-test_bot_token}"

echo ""
echo "📋 Test Configuration:"
echo "  Base URL: $BASE_URL"
echo "  Bot Token: ${BOT_TOKEN:0:10}..."

# Test 1: Register a new bot
echo ""
echo "1️⃣ Testing Bot Registration..."
REGISTER_RESPONSE=$(curl -s -X POST "$BASE_URL/api/telegram/register" \
  -H "Content-Type: application/json" \
  -d "{\"token\":\"$BOT_TOKEN\",\"name\":\"Test Bot\"}")

if echo "$REGISTER_RESPONSE" | grep -q "successfully"; then
    echo "✅ Bot registration successful"
else
    echo "❌ Bot registration failed"
    echo "Response: $REGISTER_RESPONSE"
fi

# Test 2: List all bots
echo ""
echo "2️⃣ Testing Bot List..."
BOTS_RESPONSE=$(curl -s -X GET "$BASE_URL/api/telegram/bots")

if echo "$BOTS_RESPONSE" | grep -q "bots"; then
    echo "✅ Bot list retrieved successfully"
    BOT_COUNT=$(echo "$BOTS_RESPONSE" | grep -o '"name"' | wc -l)
    echo "   Found $BOT_COUNT registered bot(s)"
else
    echo "❌ Failed to retrieve bot list"
    echo "Response: $BOTS_RESPONSE"
fi

# Test 3: Get bot statistics
echo ""
echo "3️⃣ Testing Bot Statistics..."
STATS_RESPONSE=$(curl -s -X GET "$BASE_URL/api/telegram/stats/$BOT_TOKEN")

if echo "$STATS_RESPONSE" | grep -q "stats"; then
    echo "✅ Bot statistics retrieved successfully"
    USER_COUNT=$(echo "$STATS_RESPONSE" | grep -o '"totalUsers":[0-9]*' | cut -d':' -f2)
    echo "   Total users: $USER_COUNT"
else
    echo "❌ Failed to retrieve bot statistics"
    echo "Response: $STATS_RESPONSE"
fi

# Test 4: Send a test message (will fail without actual user)
echo ""
echo "4️⃣ Testing Message Send (expected to fail without real user)..."
SEND_RESPONSE=$(curl -s -X POST "$BASE_URL/api/telegram/send/$BOT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"userId":123456,"message":"Test message from AI Council"}')

if echo "$SEND_RESPONSE" | grep -q "error\|failed"; then
    echo "✅ Message send properly handled (expected failure without real user)"
else
    echo "⚠️  Unexpected response from message send"
    echo "Response: $SEND_RESPONSE"
fi

# Test 5: Get user data buffer
echo ""
echo "5️⃣ Testing User Data Buffer..."
DATA_RESPONSE=$(curl -s -X GET "$BASE_URL/api/telegram/data/$BOT_TOKEN/123456")

if echo "$DATA_RESPONSE" | grep -q "dataCount\|userId"; then
    echo "✅ User data buffer retrieved successfully"
    DATA_COUNT=$(echo "$DATA_RESPONSE" | grep -o '"dataCount":[0-9]*' | cut -d':' -f2)
    echo "   Data points: $DATA_COUNT"
else
    echo "❌ Failed to retrieve user data buffer"
    echo "Response: $DATA_RESPONSE"
fi

# Test 6: Unregister the bot
echo ""
echo "6️⃣ Testing Bot Unregistration..."
UNREGISTER_RESPONSE=$(curl -s -X DELETE "$BASE_URL/api/telegram/unregister/$BOT_TOKEN")

if echo "$UNREGISTER_RESPONSE" | grep -q "successfully"; then
    echo "✅ Bot unregistration successful"
else
    echo "❌ Bot unregistration failed"
    echo "Response: $UNREGISTER_RESPONSE"
fi

echo ""
echo "🏁 Integration Tests Complete"
echo "============================"

# Check if server is running
echo ""
echo "🔍 Server Health Check..."
HEALTH_RESPONSE=$(curl -s -X GET "$BASE_URL/api/council-members")

if echo "$HEALTH_RESPONSE" | grep -q "Aria\|Marcus"; then
    echo "✅ Server is running and responding"
else
    echo "❌ Server is not responding correctly"
    echo "   Make sure the server is running on port 3001"
    echo "   Run: npm run dev"
fi

echo ""
echo "📚 Next Steps:"
echo "1. Create a real Telegram bot using @BotFather"
echo "2. Use the actual bot token in the PersonalDataInput component"
echo "3. Test the bot by sending messages to your Telegram bot"
echo "4. Monitor the Telegram Dashboard for user activity"
echo ""
echo "📖 For detailed documentation, see: TELEGRAM_INTEGRATION.md"