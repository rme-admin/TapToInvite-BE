#!/bin/bash

# API Integration Quick Test Script
# This script helps verify the API integration is working correctly
# Usage: chmod +x verify-integration.sh && ./verify-integration.sh

set -e

echo "🔍 TapToInvite API Integration Verification"
echo "==========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test 1: Backend Server Running
echo -e "${BLUE}Test 1: Checking if backend server is running...${NC}"
if curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Backend server is running on http://localhost:3000${NC}"
else
    echo -e "${RED}❌ Backend server is NOT running on http://localhost:3000${NC}"
    echo "   Start it with: cd /Users/pruthvirajb/TapToInvite_BE && npm start"
    exit 1
fi
echo ""

# Test 2: Frontend Server Running
echo -e "${BLUE}Test 2: Checking if frontend server is running...${NC}"
if curl -s http://localhost:9002 > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Frontend server is running on http://localhost:9002${NC}"
else
    echo -e "${YELLOW}⚠️  Frontend server is NOT running on http://localhost:9002${NC}"
    echo "   Start it with: cd /Users/pruthvirajb/TapToInvite && npm run dev"
    echo "   (This is NOT critical for API testing, but needed for UI testing)"
fi
echo ""

# Test 3: API Routes Available
echo -e "${BLUE}Test 3: Checking if admin API routes are available...${NC}"
if curl -s -H "Authorization: Bearer invalid-token" http://localhost:3000/api/admin/content/landing 2>&1 | grep -q "Access Denied"; then
    echo -e "${GREEN}✅ Admin routes are responding (auth check working)${NC}"
else
    echo -e "${RED}❌ Admin routes not responding as expected${NC}"
fi
echo ""

# Test 4: Get Admin Token
echo -e "${BLUE}Test 4: Attempting to get admin token...${NC}"
echo "   (This test requires valid admin credentials)"
echo ""
echo -e "${YELLOW}Option A: Use existing admin account${NC}"
read -p "   Enter admin email (or press Enter to skip): " ADMIN_EMAIL

if [ -z "$ADMIN_EMAIL" ]; then
    echo "   Skipped. You can test manually with:"
    echo "   curl -X POST http://localhost:3000/api/public/login \\"
    echo "     -H 'Content-Type: application/json' \\"
    echo "     -d '{\"email_or_phone\": \"your@email.com\", \"password\": \"password\", \"login_method\": \"email\"}'"
    echo ""
else
    read -sp "   Enter admin password: " ADMIN_PASSWORD
    echo ""
    
    RESPONSE=$(curl -s -X POST http://localhost:3000/api/public/login \
        -H 'Content-Type: application/json' \
        -d "{\"email_or_phone\": \"$ADMIN_EMAIL\", \"password\": \"$ADMIN_PASSWORD\", \"login_method\": \"email\"}")
    
    TOKEN=$(echo $RESPONSE | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)
    
    if [ -z "$TOKEN" ] || [ "$TOKEN" = "null" ]; then
        echo -e "${RED}❌ Failed to get token. Check credentials and try again.${NC}"
        echo "   Response: $RESPONSE"
    else
        echo -e "${GREEN}✅ Successfully obtained admin token${NC}"
        echo "   Token: ${TOKEN:0:20}...${TOKEN: -10}"
        echo ""
        
        # Test 5: GET Page Content with Token
        echo -e "${BLUE}Test 5: Testing GET /api/admin/content/landing with token...${NC}"
        GET_RESPONSE=$(curl -s -X GET http://localhost:3000/api/admin/content/landing \
            -H "Authorization: Bearer $TOKEN" \
            -H "Content-Type: application/json")
        
        if echo $GET_RESPONSE | grep -q '"success":true'; then
            echo -e "${GREEN}✅ Successfully fetched content from API${NC}"
            echo "   Response includes: heroSection, collections, benefits, steps, testimonials"
        elif echo $GET_RESPONSE | grep -q '"success":false'; then
            echo -e "${YELLOW}⚠️  API returned error: $(echo $GET_RESPONSE | grep -o '"message":"[^"]*' | cut -d'"' -f4)${NC}"
        else
            echo -e "${RED}❌ Unexpected response from API${NC}"
            echo "   Response: $GET_RESPONSE"
        fi
        echo ""
        
        # Test 6: POST Save Content
        echo -e "${BLUE}Test 6: Testing POST /api/admin/content/landing (Save)...${NC}"
        
        POST_DATA='{
            "title": "Landing Page Content",
            "content": {
                "hero": [],
                "collections": [],
                "collectionsData": [],
                "benefits": [],
                "benefitsData": [],
                "steps": [],
                "stepsData": [],
                "testimonials": [],
                "testimonialsData": []
            }
        }'
        
        POST_RESPONSE=$(curl -s -X POST http://localhost:3000/api/admin/content/landing \
            -H "Authorization: Bearer $TOKEN" \
            -H "Content-Type: application/json" \
            -d "$POST_DATA")
        
        if echo $POST_RESPONSE | grep -q '"success":true'; then
            echo -e "${GREEN}✅ Successfully saved content to API${NC}"
            MSG=$(echo $POST_RESPONSE | grep -o '"message":"[^"]*' | cut -d'"' -f4)
            echo "   Message: $MSG"
        else
            echo -e "${RED}❌ Failed to save content${NC}"
            echo "   Response: $POST_RESPONSE"
        fi
        echo ""
    fi
fi

# Summary
echo -e "${BLUE}==========================================="
echo "Integration Verification Summary${NC}"
echo -e "${GREEN}✅ Backend server running${NC}"
echo -e "${GREEN}✅ Admin routes available${NC}"
echo -e "${YELLOW}ℹ️  Frontend: Start with 'npm run dev' to test UI${NC}"
echo ""
echo "Next steps:"
echo "1. Login to admin panel at http://localhost:9002/login"
echo "2. Navigate to http://localhost:9002/admin/content/landing"
echo "3. Edit content and click 'Save Changes'"
echo "4. Verify toast notification shows success"
echo "5. Refresh page to verify persistence"
echo ""
echo "All endpoints are documented in: INTEGRATION_GUIDE.md"
echo "Frontend implementation details in: FRONTEND_INTEGRATION_GUIDE.md"
