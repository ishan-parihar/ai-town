#!/bin/bash

echo "🔍 Testing Embeddings Provider Configuration..."
echo "=========================================="

# Load environment variables
if [ -f ".env.local" ]; then
    export $(cat .env.local | grep -v '^#' | xargs)
    echo "✅ Environment variables loaded from .env.local"
else
    echo "❌ .env.local file not found"
    exit 1
fi

# Check embeddings provider variables
echo ""
echo "📋 Checking Embeddings Provider Variables:"
echo "-----------------------------------------"

if [ -n "$EMBEDDINGS_PROVIDER_1_NAME" ]; then
    echo "✅ EMBEDDINGS_PROVIDER_1_NAME is set: $EMBEDDINGS_PROVIDER_1_NAME"
else
    echo "❌ EMBEDDINGS_PROVIDER_1_NAME is not set"
fi

if [ -n "$EMBEDDINGS_PROVIDER_1_URL" ]; then
    echo "✅ EMBEDDINGS_PROVIDER_1_URL is set: $EMBEDDINGS_PROVIDER_1_URL"
else
    echo "❌ EMBEDDINGS_PROVIDER_1_URL is not set"
fi

if [ -n "$EMBEDDINGS_PROVIDER_1_API_KEY" ]; then
    echo "✅ EMBEDDINGS_PROVIDER_1_API_KEY is set: ${EMBEDDINGS_PROVIDER_1_API_KEY:0:10}..."
else
    echo "❌ EMBEDDINGS_PROVIDER_1_API_KEY is not set"
fi

if [ -n "$EMBEDDINGS_PROVIDER_1_MODEL" ]; then
    echo "✅ EMBEDDINGS_PROVIDER_1_MODEL is set: $EMBEDDINGS_PROVIDER_1_MODEL"
else
    echo "❌ EMBEDDINGS_PROVIDER_1_MODEL is not set"
fi

if [ -n "$EMBEDDINGS_PROVIDER_1_DIMENSION" ]; then
    echo "✅ EMBEDDINGS_PROVIDER_1_DIMENSION is set: $EMBEDDINGS_PROVIDER_1_DIMENSION"
else
    echo "❌ EMBEDDINGS_PROVIDER_1_DIMENSION is not set"
fi

if [ -n "$EMBEDDING_DIMENSION" ]; then
    echo "✅ EMBEDDING_DIMENSION is set: $EMBEDDING_DIMENSION"
else
    echo "❌ EMBEDDING_DIMENSION is not set"
fi

# Test embeddings endpoint
echo ""
echo "🌐 Testing Embeddings Endpoint:"
echo "------------------------------"

if [ -n "$EMBEDDINGS_PROVIDER_1_URL" ] && [ -n "$EMBEDDINGS_PROVIDER_1_API_KEY" ]; then
    echo "Testing embeddings API..."
    
    response=$(curl -s -w "HTTPSTATUS:%{http_code}" \
        -X POST \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $EMBEDDINGS_PROVIDER_1_API_KEY" \
        -d "{\"model\":\"$EMBEDDINGS_PROVIDER_1_MODEL\",\"input\":\"test embedding\"}" \
        "$EMBEDDINGS_PROVIDER_1_URL/embeddings" 2>/dev/null)
    
    http_code=$(echo $response | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')
    body=$(echo $response | sed -e 's/HTTPSTATUS:.*//g')
    
    if [ "$http_code" = "200" ]; then
        echo "✅ Embeddings endpoint is accessible (HTTP $http_code)"
        echo "Response preview: ${body:0:100}..."
    elif [ "$http_code" = "404" ]; then
        echo "⚠️  Endpoint not found (HTTP 404) - trying /v1/embeddings path"
        
        # Try with /v1/embeddings if not already included
        if [[ "$EMBEDDINGS_PROVIDER_1_URL" != *"/v1"* ]]; then
            test_url="${EMBEDDINGS_PROVIDER_1_URL}/v1/embeddings"
        else
            test_url="${EMBEDDINGS_PROVIDER_1_URL}/embeddings"
        fi
        
        response=$(curl -s -w "HTTPSTATUS:%{http_code}" \
            -X POST \
            -H "Content-Type: application/json" \
            -H "Authorization: Bearer $EMBEDDINGS_PROVIDER_1_API_KEY" \
            -d "{\"model\":\"$EMBEDDINGS_PROVIDER_1_MODEL\",\"input\":\"test embedding\"}" \
            "$test_url" 2>/dev/null)
        
        http_code=$(echo $response | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')
        body=$(echo $response | sed -e 's/HTTPSTATUS:.*//g')
        
        if [ "$http_code" = "200" ]; then
            echo "✅ Embeddings endpoint is accessible via $test_url (HTTP $http_code)"
            echo "Response preview: ${body:0:100}..."
        else
            echo "⚠️  Embeddings endpoint returned HTTP $http_code"
            echo "This might be expected if the provider uses a different endpoint structure"
        fi
    else
        echo "⚠️  Embeddings endpoint returned HTTP $http_code"
        echo "Response: $body"
    fi
else
    echo "❌ Cannot test endpoint - URL or API key not configured"
fi

echo ""
echo "📝 Summary:"
echo "----------"
if [ -n "$EMBEDDINGS_PROVIDER_1_NAME" ] && [ -n "$EMBEDDINGS_PROVIDER_1_URL" ] && [ -n "$EMBEDDINGS_PROVIDER_1_API_KEY" ] && [ -n "$EMBEDDINGS_PROVIDER_1_MODEL" ]; then
    echo "🎉 Embeddings provider configuration is complete!"
    echo ""
    echo "🔗 Configuration Summary:"
    echo "  Provider: $EMBEDDINGS_PROVIDER_1_NAME"
    echo "  URL: $EMBEDDINGS_PROVIDER_1_URL"
    echo "  Model: $EMBEDDINGS_PROVIDER_1_MODEL"
    echo "  Dimension: $EMBEDDINGS_PROVIDER_1_DIMENSION"
    echo "  Global Dimension: $EMBEDDING_DIMENSION"
    echo ""
    echo "Next steps:"
    echo "1. Start the application: npm run dev"
    echo "2. Test agent conversations to verify embeddings work"
    echo "3. Check Convex dashboard for memoryEmbeddings table"
else
    echo "❌ Embeddings provider configuration is incomplete"
    echo "Please set all required EMBEDDINGS_PROVIDER_* variables"
fi

echo "=========================================="