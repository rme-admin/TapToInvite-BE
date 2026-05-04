#!/bin/bash

# Color codes for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# API base URL
API_BASE="http://localhost:3000"
FRONTEND_URL="http://localhost:9002"

# Test user credentials
TEST_EMAIL="test.user.$(date +%s)@taptoinvite.test"
TEST_PASSWORD="TestPassword123!"
TEST_PHONE="+919876543210"

echo "========================================"
echo "🚀 TapToInvite API Verification"
echo "========================================"
echo ""

# Store variables from responses
SETUP_TOKEN=""
ACCESS_TOKEN=""
REFRESH_TOKEN=""
USER_ID=""
ORDER_ID=""
PLAN_ID=""
CATEGORY_ID=""
NFC_TEMPLATE_ID=""
NORMAL_TEMPLATE_ID=""

# Test 1: Register User
echo "1️⃣ Testing: Register User"
REGISTER_RESPONSE=$(curl -s -X POST "$API_BASE/api/public/register" \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"Test User\",
    \"email\": \"$TEST_EMAIL\",
    \"country_code\": \"+91\",
    \"phone\": \"$TEST_PHONE\",
    \"address\": {
      \"line_1\": \"123 Main St\",
      \"line_2\": \"Apt 4\",
      \"city\": \"Bangalore\",
      \"state\": \"Karnataka\",
      \"country\": \"India\",
      \"pincode\": \"560001\"
    }
  }")

if echo "$REGISTER_RESPONSE" | jq . > /dev/null 2>&1; then
  if echo "$REGISTER_RESPONSE" | jq -e '.success == true' > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Register: PASS${NC}"
    # Extract verification token from response or DB (for testing, we'll check the user exists)
    SETUP_TOKEN=$(echo "$REGISTER_RESPONSE" | jq -r '.data.verification_token // empty')
    if [ -z "$SETUP_TOKEN" ]; then
      echo "  Note: Setup token not returned; will need to check database or email."
    fi
  else
    echo -e "${RED}✗ Register: FAIL${NC}"
    echo "$REGISTER_RESPONSE" | jq '.'
  fi
else
  echo -e "${RED}✗ Register: ERROR (invalid JSON)${NC}"
  echo "$REGISTER_RESPONSE"
fi
echo ""

# Test 2: Fetch Plans (No Auth)
echo "2️⃣ Testing: Fetch Public Plans"
PLANS_RESPONSE=$(curl -s -X GET "$API_BASE/api/public/plans")

if echo "$PLANS_RESPONSE" | jq . > /dev/null 2>&1; then
  if echo "$PLANS_RESPONSE" | jq -e '.success == true and (.data | length) > 0' > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Fetch Public Plans: PASS${NC}"
    PLAN_ID=$(echo "$PLANS_RESPONSE" | jq -r '.data[0].id')
    echo "  Sample plan ID: $PLAN_ID"
  else
    echo -e "${RED}✗ Fetch Public Plans: FAIL${NC}"
    echo "$PLANS_RESPONSE" | jq '.'
  fi
else
  echo -e "${RED}✗ Fetch Public Plans: ERROR (invalid JSON)${NC}"
fi
echo ""

# Test 3: Fetch Plan Pricing
echo "3️⃣ Testing: Fetch Plan Pricing"
if [ -n "$PLAN_ID" ]; then
  PRICING_RESPONSE=$(curl -s -X GET "$API_BASE/api/public/plans/$PLAN_ID/pricing")
  
  if echo "$PRICING_RESPONSE" | jq . > /dev/null 2>&1; then
    if echo "$PRICING_RESPONSE" | jq -e '.success == true' > /dev/null 2>&1; then
      echo -e "${GREEN}✓ Fetch Plan Pricing: PASS${NC}"
    else
      echo -e "${RED}✗ Fetch Plan Pricing: FAIL${NC}"
      echo "$PRICING_RESPONSE" | jq '.'
    fi
  else
    echo -e "${RED}✗ Fetch Plan Pricing: ERROR${NC}"
  fi
else
  echo -e "${YELLOW}⊘ Fetch Plan Pricing: SKIPPED (no plan ID)${NC}"
fi
echo ""

# Test 4: Fetch Event Categories
echo "4️⃣ Testing: Fetch Event Categories"
CATEGORIES_RESPONSE=$(curl -s -X GET "$API_BASE/api/public/event-categories")

if echo "$CATEGORIES_RESPONSE" | jq . > /dev/null 2>&1; then
  if echo "$CATEGORIES_RESPONSE" | jq -e '.success == true and (.data | length) > 0' > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Fetch Event Categories: PASS${NC}"
    CATEGORY_ID=$(echo "$CATEGORIES_RESPONSE" | jq -r '.data[0].id')
    echo "  Sample category ID: $CATEGORY_ID"
  else
    echo -e "${RED}✗ Fetch Event Categories: FAIL${NC}"
    echo "$CATEGORIES_RESPONSE" | jq '.'
  fi
else
  echo -e "${RED}✗ Fetch Event Categories: ERROR${NC}"
fi
echo ""

# Test 5: Fetch NFC Templates (Public endpoint - no auth)
echo "5️⃣ Testing: Fetch NFC Templates"
NFC_RESPONSE=$(curl -s -X GET "$API_BASE/api/public/nfc-templates")

if echo "$NFC_RESPONSE" | jq . > /dev/null 2>&1; then
  if echo "$NFC_RESPONSE" | jq -e '.success == true and (.data | length) > 0' > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Fetch NFC Templates: PASS${NC}"
    NFC_TEMPLATE_ID=$(echo "$NFC_RESPONSE" | jq -r '.data[0].id')
    echo "  Sample NFC template ID: $NFC_TEMPLATE_ID"
  else
    echo -e "${RED}✗ Fetch NFC Templates: FAIL${NC}"
    echo "$NFC_RESPONSE" | jq '.'
  fi
else
  echo -e "${RED}✗ Fetch NFC Templates: ERROR${NC}"
fi
echo ""

# Test 6: Fetch Normal Templates
echo "6️⃣ Testing: Fetch Normal Card Templates"
NORMAL_RESPONSE=$(curl -s -X GET "$API_BASE/api/public/normal-templates")

if echo "$NORMAL_RESPONSE" | jq . > /dev/null 2>&1; then
  if echo "$NORMAL_RESPONSE" | jq -e '.success == true and (.data | length) > 0' > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Fetch Normal Templates: PASS${NC}"
    NORMAL_TEMPLATE_ID=$(echo "$NORMAL_RESPONSE" | jq -r '.data[0].id')
    echo "  Sample normal template ID: $NORMAL_TEMPLATE_ID"
  else
    echo -e "${RED}✗ Fetch Normal Templates: FAIL${NC}"
    echo "$NORMAL_RESPONSE" | jq '.'
  fi
else
  echo -e "${RED}✗ Fetch Normal Templates: ERROR${NC}"
fi
echo ""

# --- Need to setup user and get access token for protected routes ---
# For testing, we'll use the admin user we created earlier
echo "🔑 Setting up admin access token for protected endpoints..."
LOGIN_RESPONSE=$(curl -s -X POST "$API_BASE/api/public/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin+local@taptoinvite.test",
    "password": "Password123!"
  }')

if echo "$LOGIN_RESPONSE" | jq -e '.success == true' > /dev/null 2>&1; then
  ACCESS_TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.accessToken')
  REFRESH_TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.refreshToken')
  USER_ID=$(echo "$LOGIN_RESPONSE" | jq -r '.user.id')
  echo -e "${GREEN}✓ Admin login successful${NC}"
  echo "  Access Token obtained (expires in 15 min)"
else
  echo -e "${RED}✗ Admin login failed${NC}"
  echo "$LOGIN_RESPONSE" | jq '.'
fi
echo ""

# Test 7: Place Order
echo "7️⃣ Testing: Place Order"
if [ -n "$ACCESS_TOKEN" ] && [ -n "$PLAN_ID" ] && [ -n "$CATEGORY_ID" ]; then
  PLACE_ORDER_RESPONSE=$(curl -s -X POST "$API_BASE/api/user/orders" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $ACCESS_TOKEN" \
    -d "{
      \"planId\": $PLAN_ID,
      \"eventCategoryId\": $CATEGORY_ID,
      \"eventTitle\": \"Test Event\",
      \"eventDate\": \"2026-12-25T18:00:00Z\",
      \"nfcTemplateId\": $NFC_TEMPLATE_ID,
      \"nfcQuantity\": 1,
      \"normalTemplates\": [{\"templateId\": $NORMAL_TEMPLATE_ID, \"quantity\": 10}],
      \"hasQR\": true,
      \"webAccess\": \"basic\",
      \"reminders\": \"basic\",
      \"digitalNotes\": \"Test order notes\",
      \"clientInfo\": {
        \"name\": \"Test Admin\",
        \"phone\": \"+919876543210\",
        \"email\": \"admin+local@taptoinvite.test\",
        \"address1\": \"123 Main St\",
        \"address2\": \"Apt 4\",
        \"city\": \"Bangalore\",
        \"state\": \"Karnataka\",
        \"pincode\": \"560001\",
        \"country\": \"India\"
      }
    }")
  
  if echo "$PLACE_ORDER_RESPONSE" | jq . > /dev/null 2>&1; then
    if echo "$PLACE_ORDER_RESPONSE" | jq -e '.success == true' > /dev/null 2>&1; then
      echo -e "${GREEN}✓ Place Order: PASS${NC}"
      ORDER_ID=$(echo "$PLACE_ORDER_RESPONSE" | jq -r '.data.orderId')
      echo "  Order ID: $ORDER_ID"
    else
      echo -e "${RED}✗ Place Order: FAIL${NC}"
      echo "$PLACE_ORDER_RESPONSE" | jq '.'
    fi
  else
    echo -e "${RED}✗ Place Order: ERROR${NC}"
  fi
else
  echo -e "${YELLOW}⊘ Place Order: SKIPPED (missing token or IDs)${NC}"
fi
echo ""

# Test 8: Fetch Order Details
echo "8️⃣ Testing: Fetch Order Details"
if [ -n "$ACCESS_TOKEN" ] && [ -n "$ORDER_ID" ]; then
  ORDER_DETAILS_RESPONSE=$(curl -s -X GET "$API_BASE/api/user/orders/$ORDER_ID" \
    -H "Authorization: Bearer $ACCESS_TOKEN")
  
  if echo "$ORDER_DETAILS_RESPONSE" | jq . > /dev/null 2>&1; then
    if echo "$ORDER_DETAILS_RESPONSE" | jq -e '.success == true' > /dev/null 2>&1; then
      echo -e "${GREEN}✓ Fetch Order Details: PASS${NC}"
    else
      echo -e "${RED}✗ Fetch Order Details: FAIL${NC}"
      echo "$ORDER_DETAILS_RESPONSE" | jq '.'
    fi
  else
    echo -e "${RED}✗ Fetch Order Details: ERROR${NC}"
  fi
else
  echo -e "${YELLOW}⊘ Fetch Order Details: SKIPPED (missing token or order ID)${NC}"
fi
echo ""

# Test 9: NFC Issuance
echo "9️⃣ Testing: NFC Card Issuance (Admin)"
if [ -n "$ACCESS_TOKEN" ]; then
  # Use the test order we created earlier (order ID 1)
  NFC_ISSUANCE_RESPONSE=$(curl -s -X POST "$API_BASE/api/admin/orders/1/nfc-issuances" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $ACCESS_TOKEN" \
    -d "{
      \"nfcCardNumber\": \"TEST-NFC-API-$(date +%s)\",
      \"method\": \"taptoinvite_site\",
      \"calendarUrl\": \"https://calendar.google.com/\",
      \"locationUrl\": \"https://maps.google.com/?q=test\",
      \"digitalInvitationType\": \"url\",
      \"digitalInvitationContent\": \"https://example.com/invite\",
      \"websiteUrl\": \"https://example.com/event\",
      \"status\": \"registered\"
    }")
  
  if echo "$NFC_ISSUANCE_RESPONSE" | jq . > /dev/null 2>&1; then
    if echo "$NFC_ISSUANCE_RESPONSE" | jq -e '.success == true' > /dev/null 2>&1; then
      echo -e "${GREEN}✓ NFC Card Issuance: PASS${NC}"
      INVITE_KEY=$(echo "$NFC_ISSUANCE_RESPONSE" | jq -r '.data.autogeneratedKey')
      echo "  Generated invite key: $INVITE_KEY"
    else
      echo -e "${RED}✗ NFC Card Issuance: FAIL${NC}"
      echo "$NFC_ISSUANCE_RESPONSE" | jq '.'
    fi
  else
    echo -e "${RED}✗ NFC Card Issuance: ERROR${NC}"
  fi
else
  echo -e "${YELLOW}⊘ NFC Card Issuance: SKIPPED (no access token)${NC}"
fi
echo ""

# Test 10: Tracking Notes
echo "🔟 Testing: Tracking Notes (Admin)"
if [ -n "$ACCESS_TOKEN" ]; then
  TRACKING_RESPONSE=$(curl -s -X POST "$API_BASE/api/admin/orders/1/tracking-notes" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $ACCESS_TOKEN" \
    -d "{
      \"noteDate\": \"$(date +%Y-%m-%d)\",
      \"noteTime\": \"$(date +%H:%M)\",
      \"heading\": \"Test Tracking Note\",
      \"description\": \"This is a test tracking note\",
      \"visibleToUser\": true
    }")
  
  if echo "$TRACKING_RESPONSE" | jq . > /dev/null 2>&1; then
    if echo "$TRACKING_RESPONSE" | jq -e '.success == true' > /dev/null 2>&1; then
      echo -e "${GREEN}✓ Tracking Notes: PASS${NC}"
    else
      echo -e "${RED}✗ Tracking Notes: FAIL${NC}"
      echo "$TRACKING_RESPONSE" | jq '.'
    fi
  else
    echo -e "${RED}✗ Tracking Notes: ERROR${NC}"
  fi
else
  echo -e "${YELLOW}⊘ Tracking Notes: SKIPPED (no access token)${NC}"
fi
echo ""

# Test 11: Public Invite Endpoint
echo "1️⃣1️⃣ Testing: Public Invite Endpoint"
if [ -n "$INVITE_KEY" ]; then
  INVITE_RESPONSE=$(curl -s -X GET "$API_BASE/api/public/invites/$INVITE_KEY")
  
  if echo "$INVITE_RESPONSE" | jq . > /dev/null 2>&1; then
    if echo "$INVITE_RESPONSE" | jq -e '.success == true' > /dev/null 2>&1; then
      echo -e "${GREEN}✓ Public Invite Endpoint: PASS${NC}"
    else
      echo -e "${RED}✗ Public Invite Endpoint: FAIL${NC}"
      echo "$INVITE_RESPONSE" | jq '.'
    fi
  else
    echo -e "${RED}✗ Public Invite Endpoint: ERROR${NC}"
  fi
else
  echo -e "${YELLOW}⊘ Public Invite Endpoint: SKIPPED (no invite key)${NC}"
fi
echo ""

# Test 12: Refresh Token
echo "1️⃣2️⃣ Testing: Refresh Token"
if [ -n "$REFRESH_TOKEN" ]; then
  REFRESH_RESPONSE=$(curl -s -X POST "$API_BASE/api/public/refresh-token" \
    -H "Content-Type: application/json" \
    -d "{
      \"refreshToken\": \"$REFRESH_TOKEN\"
    }")
  
  if echo "$REFRESH_RESPONSE" | jq . > /dev/null 2>&1; then
    if echo "$REFRESH_RESPONSE" | jq -e '.success == true' > /dev/null 2>&1; then
      echo -e "${GREEN}✓ Refresh Token: PASS${NC}"
    else
      echo -e "${RED}✗ Refresh Token: FAIL${NC}"
      echo "$REFRESH_RESPONSE" | jq '.'
    fi
  else
    echo -e "${RED}✗ Refresh Token: ERROR${NC}"
  fi
else
  echo -e "${YELLOW}⊘ Refresh Token: SKIPPED (no refresh token)${NC}"
fi
echo ""

echo "========================================"
echo "✅ API Verification Complete!"
echo "========================================"
