#!/bin/bash

# API Integration Test Script
# This script tests the admin content management API endpoints

echo "========================================"
echo "Admin Content Management API Tests"
echo "========================================"
echo ""

# Set variables
BASE_URL="http://localhost:3000/api/admin"
ADMIN_TOKEN="" # You'll need to get this from login first

# Get a sample admin token (mock for now)
echo "Note: For API testing, you need an admin user token from the login endpoint"
echo ""
echo "Steps to get admin token:"
echo "1. Login as admin user at: POST http://localhost:3000/api/public/login"
echo "2. Copy the accessToken from the response"
echo "3. Replace ADMIN_TOKEN in the commands below"
echo ""

# Test 1: Get all pages content (without auth - will fail and show how to authenticate)
echo "========================================"
echo "Test 1: Get All Pages (No Auth - Will Fail)"
echo "========================================"
echo "URL: GET $BASE_URL/content"
echo ""
curl -X GET "$BASE_URL/content" \
  -H "Content-Type: application/json" \
  -w "\nHTTP Status: %{http_code}\n"
echo ""
echo ""

# Test 2: Get landing page content (no auth - will fail)
echo "========================================"
echo "Test 2: Get Landing Page Content (No Auth - Will Fail)"
echo "========================================"
echo "URL: GET $BASE_URL/content/landing"
echo ""
curl -X GET "$BASE_URL/content/landing" \
  -H "Content-Type: application/json" \
  -w "\nHTTP Status: %{http_code}\n"
echo ""
echo ""

echo "========================================"
echo "To Test With Authentication:"
echo "========================================"
echo ""
echo "1. First, login as admin:"
echo ""
echo "curl -X POST 'http://localhost:3000/api/public/login' \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -d '{\"email_or_phone\": \"admin@example.com\", \"password\": \"password\", \"login_method\": \"email\"}'"
echo ""
echo "2. Copy the accessToken from the response"
echo ""
echo "3. Then fetch content with token:"
echo ""
echo "curl -X GET '$BASE_URL/content/landing' \\"
echo "  -H 'Authorization: Bearer YOUR_ACCESS_TOKEN' \\"
echo "  -H 'Content-Type: application/json'"
echo ""
echo "4. Save content with token:"
echo ""
echo "curl -X POST '$BASE_URL/content/landing' \\"
echo "  -H 'Authorization: Bearer YOUR_ACCESS_TOKEN' \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -d '{\"title\": \"Landing Page\", \"content\": {...}}'"
echo ""
