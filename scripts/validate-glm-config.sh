#!/bin/bash

# GLM-4.6 Configuration Validation Script
# This script validates that all required environment variables are set for GLM-4.6

echo "🔍 Validating GLM-4.6 Configuration..."
echo "====================================="

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo "❌ .env.local file not found!"
    exit 1
fi

echo "✅ .env.local file found"

# Load environment variables
set -a
source .env.local
set +a

# Required variables
REQUIRED_VARS=(
    "CUSTOM_PROVIDER_1_NAME"
    "CUSTOM_PROVIDER_1_URL"
    "CUSTOM_PROVIDER_1_API_KEY"
    "CUSTOM_PROVIDER_1_CHAT_MODEL"
    "CUSTOM_PROVIDER_1_EMBEDDING_MODEL"
    "CUSTOM_PROVIDER_1_EMBEDDING_DIMENSION"
)

# Optional but recommended variables
OPTIONAL_VARS=(
    "CUSTOM_PROVIDER_1_STOP_WORDS"
    "CUSTOM_PROVIDER_1_TIMEOUT"
    "CUSTOM_PROVIDER_1_MAX_RETRIES"
)

echo ""
echo "📋 Checking Required Variables:"
echo "------------------------------"

all_valid=true

for var in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!var}" ]; then
        echo "❌ $var is not set or empty"
        all_valid=false
    else
        if [[ "$var" == *"API_KEY"* ]] && [[ "${!var}" == *"your"* ]]; then
            echo "⚠️  $var contains placeholder value - please update with actual value"
            all_valid=false
        else
            echo "✅ $var is set"
        fi
    fi
done

echo ""
echo "📋 Checking Optional Variables:"
echo "------------------------------"

for var in "${OPTIONAL_VARS[@]}"; do
    if [ -z "${!var}" ]; then
        echo "⚪ $var not set (using default)"
    else
        echo "✅ $var is set"
    fi
done

echo ""
echo "🔧 Configuration Details:"
echo "------------------------"

if [ ! -z "$CUSTOM_PROVIDER_1_NAME" ]; then
    echo "Provider Name: $CUSTOM_PROVIDER_1_NAME"
fi

if [ ! -z "$CUSTOM_PROVIDER_1_URL" ]; then
    echo "Endpoint URL: $CUSTOM_PROVIDER_1_URL"
fi

if [ ! -z "$CUSTOM_PROVIDER_1_CHAT_MODEL" ]; then
    echo "Chat Model: $CUSTOM_PROVIDER_1_CHAT_MODEL"
fi

if [ ! -z "$CUSTOM_PROVIDER_1_EMBEDDING_MODEL" ]; then
    echo "Embedding Model: $CUSTOM_PROVIDER_1_EMBEDDING_MODEL"
fi

if [ ! -z "$CUSTOM_PROVIDER_1_EMBEDDING_DIMENSION" ]; then
    echo "Embedding Dimension: $CUSTOM_PROVIDER_1_EMBEDDING_DIMENSION"
fi

echo ""
echo "🌐 Testing Endpoint Accessibility:"
echo "--------------------------------"

if [ ! -z "$CUSTOM_PROVIDER_1_URL" ] && [ ! -z "$CUSTOM_PROVIDER_1_API_KEY" ]; then
    if command -v curl &> /dev/null; then
        echo "Testing models endpoint..."
        
        # Skip if using placeholder values
        if [[ "$CUSTOM_PROVIDER_1_URL" == *"your"* ]] || [[ "$CUSTOM_PROVIDER_1_API_KEY" == *"your"* ]]; then
            echo "⚠️  Skipping endpoint test - placeholder values detected"
        else
            HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
                -H "Authorization: Bearer $CUSTOM_PROVIDER_1_API_KEY" \
                "$CUSTOM_PROVIDER_1_URL/v1/models" 2>/dev/null)
            
            if [ "$HTTP_STATUS" = "200" ]; then
                echo "✅ Endpoint is accessible (HTTP $HTTP_STATUS)"
            elif [ "$HTTP_STATUS" = "000" ]; then
                echo "❌ Failed to connect to endpoint"
                all_valid=false
            else
                echo "⚠️  Endpoint returned HTTP $HTTP_STATUS"
            fi
        fi
    else
        echo "⚠️  curl not available - cannot test endpoint"
    fi
else
    echo "⚠️  Cannot test endpoint - URL or API key not set"
fi

echo ""
echo "📝 Summary:"
echo "----------"

if [ "$all_valid" = true ]; then
    echo "🎉 Configuration looks good!"
    echo ""
    echo "Next steps:"
    echo "1. Update any placeholder values in .env.local"
    echo "2. Run: npm run start:complete"
    echo "3. Test agent conversations in the UI"
else
    echo "❌ Configuration issues found!"
    echo ""
    echo "Please fix the issues above before continuing."
    echo "See GLM-4.6-SETUP.md for detailed instructions."
fi

echo ""
echo "====================================="