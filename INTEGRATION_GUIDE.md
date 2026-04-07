# API Integration Setup & Testing Guide

## ✅ Backend Status
- **Server**: Running on `http://localhost:3000`
- **API Base**: `http://localhost:3000/api`
- **Admin Routes**: Active at `/api/admin/content/*`

## 🚀 Integration Summary

### What Was Created

#### 1. Backend Controller (`/src/controllers/admin/contentController.js`)
- GET `/api/admin/content` - Get all pages (paginated)
- GET `/api/admin/content/:pageSlug` - Get specific page
- POST `/api/admin/content/:pageSlug` - Save/update page
- DELETE `/api/admin/content/:pageSlug` - Delete page

#### 2. Admin Routes (`/src/routes/admin.routes.js`)
- All routes protected by JWT authentication
- All routes require `admin` role
- Routes mounted at `/api/admin`

#### 3. Frontend Integration (`/src/app/admin/content/landing/page.tsx`)
- ✅ Page loads content from API on mount
- ✅ Graceful fallback to defaults if API fails
- ✅ Save button sends entire content to API
- ✅ Bearer token automatically included in requests
- ✅ Real-time error handling and toast notifications

---

## 📋 Step-by-Step Testing Instructions

### Step 1: Verify Backend is Running
```bash
# Check if backend is running
curl http://localhost:3000/

# Expected response:
# "TapToInvite API is running..."
```

### Step 2: Test API Without Authentication (Should Fail)
```bash
# This will fail because no token provided
curl -X GET "http://localhost:3000/api/admin/content/landing" \
  -H "Content-Type: application/json"

# Expected response:
# {"message": "Access Denied. No token provided."}
```

### Step 3: Get Admin Login Token

**Option A: Using cURL with an admin user**
```bash
curl -X POST "http://localhost:3000/api/public/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email_or_phone": "admin@example.com",
    "password": "adminPassword123",
    "login_method": "email"
  }'

# Response will include:
# {
#   "success": true,
#   "data": {
#     "accessToken": "eyJhbGc...",
#     "user": { "id": 5, "role": "admin", ... }
#   }
# }

# Copy the accessToken value for use in next steps
```

**Option B: Create a Test Admin User in Database**
```sql
INSERT INTO User (name, email, phone, country_code, status, role, password_hash, created_at, updated_at)
VALUES (
  'Test Admin',
  'testadmin@example.com',
  '9999999999',
  '+91',
  'active',
  'admin',
  '$2a$10$...', -- bcrypt hash of password
  NOW(),
  NOW()
);
```

### Step 4: Test GET Page Content (With Auth)

Save your token first:
```bash
export ADMIN_TOKEN="eyJhbGc...paste_your_token_here..."
```

Then test:
```bash
curl -X GET "http://localhost:3000/api/admin/content/landing" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -w "\nStatus: %{http_code}\n"

# Response:
# {
#   "success": true,
#   "message": "Content fetched successfully",
#   "data": { ... }
# }
# Status: 200
```

### Step 5: Test POST Save Content (Create New)

```bash
curl -X POST "http://localhost:3000/api/admin/content/landing" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Landing Page Content",
    "content": {
      "hero": [
        {"key": "HeroSection-Title", "label": "Main Title", "value": "The Smart Invitation", "type": "text"},
        {"key": "HeroSection-Highlight", "label": "Highlighted Word", "value": "Smart", "type": "text"},
        {"key": "HeroSection-Subtitle", "label": "Subtitle", "value": "Share your event instantly", "type": "textarea"}
      ],
      "collections": [],
      "collectionsData": [
        {
          "id": "1",
          "title": "Luxury Gold",
          "subtitle": "Smart Wedding Cards",
          "description": "Premium gold-plated finish with NFC",
          "image": ""
        }
      ],
      "benefits": [],
      "benefitsData": [
        {
          "id": "1",
          "title": "Unmatched Durability",
          "description": "Made from premium materials",
          "icon": ""
        }
      ],
      "steps": [],
      "stepsData": [
        {
          "id": "1",
          "number": "1",
          "title": "Select Package",
          "description": "Choose your plan"
        }
      ],
      "testimonials": [],
      "testimonialsData": [
        {
          "id": "1",
          "name": "Sarah & Michael",
          "event": "Wedding",
          "content": "Amazing NFC cards!",
          "image": ""
        }
      ]
    }
  }' \
  -w "\nStatus: %{http_code}\n"

# Response (201 Created):
# {
#   "success": true,
#   "message": "Content created successfully",
#   "data": { ... }
# }
# Status: 201
```

### Step 6: Test POST Update Content (Existing Page)

Run the same POST command again - it will update instead of create:

```bash
curl -X POST "http://localhost:3000/api/admin/content/landing" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ ... }'

# Response (200 OK):
# {
#   "success": true,
#   "message": "Content updated successfully",
#   "data": { ... }
# }
# Status: 200
```

### Step 7: Frontend Testing

1. **Open Admin Landing Page**
   - URL: `http://localhost:9002/admin/content/landing`
   - You must be logged in as admin

2. **Verify Loading**
   - Page shows loading spinner
   - Content loads from API
   - Falls back to defaults if API fails

3. **Add & Edit Content**
   - Edit hero title
   - Add new collection with image
   - Add new benefit with icon
   - Add new step
   - Add new testimonial with avatar

4. **Save Content**
   - Click "Save Changes" button
   - Watch for success toast notification
   - Verify "Last updated" timestamp updates
   - Refresh page - content persists

---

## 🔍 Database Verification

Check if content was saved:
```sql
SELECT * FROM SiteContent WHERE page_slug = 'landing';
```

Expected result:
```
id | page_slug | content_key | title | content | last_updated_by | updated_at
1  | landing   | landing     | Landing Page Content | {...}  | 5 | 2026-04-08 10:30:00
```

---

## ✅ Frontend Status Checklist

- [ ] Backend server running on port 3000
- [ ] Admin routes responding to requests
- [ ] Authentication working (JWT token generation)
- [ ] Admin user can login
- [ ] Frontend can fetch content from API
- [ ] Frontend can save content to API
- [ ] Content persists in database
- [ ] Placeholder icons/images work when not uploaded
- [ ] Error handling works properly
- [ ] Toast notifications show correctly

---

## 📝 Common Issues & Solutions

### Issue: "Access Denied. No token provided"
- **Cause**: Missing Authorization header
- **Solution**: Add header: `Authorization: Bearer YOUR_ACCESS_TOKEN`

### Issue: "Access Denied. admin only"
- **Cause**: User is not admin
- **Solution**: Login with admin account and use that token

### Issue: 404 Content Not Found
- **Cause**: No content saved for that page yet
- **Solution**: Create content using POST endpoint first

### Issue: Frontend shows "Using default content"
- **Cause**: API failed to fetch content
- **Solution**: 
  1. Check backend is running: `curl http://localhost:3000`
  2. Check auth token is valid
  3. Check browser console for errors
  4. Verify CORS is allowed for frontend origin

### Issue: Base64 images too large
- **Cause**: Database LONGTEXT field might have size limits
- **Solution**: Use external storage (S3, Cloudinary) for large files

---

## 🚀 Next Steps

1. **Create Additional Pages**
   - POST to `/api/admin/content/about`
   - POST to `/api/admin/content/contact`
   - POST to `/api/admin/content/terms`

2. **Add File Upload Service**
   - Use S3, Cloudinary, or similar
   - Store file URLs instead of Base64
   - Update contentController to handle file references

3. **Add Content Images to Frontend**
   - Fetch content from API
   - Render collections with images
   - Render testimonials with avatars
   - Render benefits with icons

4. **Add Caching**
   - Cache content in Redis
   - Invalidate cache on update
   - Reduce database queries

5. **Add Versioning**
   - Track content versions
   - Allow rollback to previous versions
   - Show version history in admin panel

---

## 📚 API Documentation
See `/API_DOCUMENTATION.md` for complete API reference with all endpoints, request/response formats, and error codes.
