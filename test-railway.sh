#!/bin/bash

# 🧪 Railway Deployment Test Script
# Nahraď RAILWAY_URL svojou skutočnou Railway URL

RAILWAY_URL="https://tvoja-railway-url.up.railway.app"
API_KEY="13b73451d48edd9b9d69963dcb7243a7c804663c"

echo "╔══════════════════════════════════════════════════════════════════╗"
echo "║                                                                  ║"
echo "║         🧪  RAILWAY DEPLOYMENT TEST  🧪                          ║"
echo "║                                                                  ║"
echo "╚══════════════════════════════════════════════════════════════════╝"
echo ""
echo "📍 Railway URL: $RAILWAY_URL"
echo "🔑 API Key: $API_KEY"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Test 1: Health Check
echo "🧪 Test 1: Health Check"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
curl -s "$RAILWAY_URL/health" | jq
echo ""
echo ""

# Test 2: Get All Faktury Count
echo "🧪 Test 2: Počet faktúr"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
COUNT=$(curl -s -H "X-Faktury-API-Key: $API_KEY" "$RAILWAY_URL/api/faktury" | jq '.count')
echo "📊 Počet faktúr: $COUNT"
echo ""
echo ""

# Test 3: Štatistiky
echo "🧪 Test 3: Štatistiky"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
curl -s -H "X-Faktury-API-Key: $API_KEY" "$RAILWAY_URL/api/statistiky" | jq
echo ""
echo ""

# Test 4: Detail faktúry
echo "🧪 Test 4: Detail faktúry 20250001"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
curl -s -H "X-Faktury-API-Key: $API_KEY" "$RAILWAY_URL/api/faktury/20250001" | jq '.data | {cislo, partner, celkom_s_dph, datum_vystavenia}'
echo ""
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "✅ Test dokončený!"
echo ""

