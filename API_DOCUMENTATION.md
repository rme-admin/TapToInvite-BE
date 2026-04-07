# Admin Content Management API Documentation

## Overview
The Admin Content Management API allows administrators to manage and update content for different pages (landing, about, contact, etc.) through a dynamic content management interface. All content is stored as JSON in the database for flexibility.

## Authentication
- **Required**: All endpoints require authentication via JWT Bearer token
- **Authorization**: Only users with `admin` role can access these endpoints
- **Token Location**: `Authorization: Bearer <accessToken>`

## Endpoints

### 1. Get All Pages Content (Paginated)
```
GET /api/admin/content
```

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)

**Response (200 OK):**
```json
{
  "success": true,
  "message": "All content fetched successfully",
  "data": [
    {
      "id": 1,
      "page_slug": "landing",
      "title": "Landing Page Content",
      "content": { /* JSON object */ },
      "last_updated_by": 5,
      "updated_at": "2026-04-07T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 5,
    "pages": 1
  }
}
```

---

### 2. Get Specific Page Content
```
GET /api/admin/content/:pageSlug
```

**Parameters:**
- `pageSlug` (string, required): The page identifier (e.g., 'landing', 'about', 'contact')

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Content fetched successfully",
  "data": {
    "id": 1,
    "page_slug": "landing",
    "title": "Landing Page Content",
    "content": {
      "hero": [
        { "key": "HeroSection-Title", "label": "Main Title", "value": "The Smart Invitation", "type": "text" }
      ],
      "collections": [],
      "collectionsData": [
        {
          "id": "1",
          "title": "Luxury Gold",
          "subtitle": "Smart Wedding Cards",
          "description": "Premium gold-plated finish...",
          "image": "data:image/png;base64,..." // Base64 encoded image
        }
      ],
      "benefits": [],
      "benefitsData": [
        {
          "id": "1",
          "title": "Unmatched Durability",
          "description": "Made from premium materials...",
          "icon": "data:image/png;base64,..." // Base64 encoded icon
        }
      ],
      "steps": [],
      "stepsData": [
        {
          "id": "1",
          "number": "1",
          "title": "Select Package",
          "description": "Choose from Classic, Premium..."
        }
      ],
      "testimonials": [],
      "testimonialsData": [
        {
          "id": "1",
          "name": "Sarah & Michael",
          "event": "Wedding",
          "content": "The NFC cards were the highlight...",
          "image": "data:image/png;base64,..." // Base64 encoded avatar
        }
      ]
    },
    "last_updated_by": 5,
    "updated_at": "2026-04-07T10:30:00Z"
  }
}
```

**Error Response (404 Not Found):**
```json
{
  "success": false,
  "message": "Content for page 'landing' not found. Please create it first.",
  "content": null
}
```

---

### 3. Save or Update Page Content
```
POST /api/admin/content/:pageSlug
```

**Parameters:**
- `pageSlug` (string, required): The page identifier (e.g., 'landing')

**Request Body:**
```json
{
  "title": "Landing Page Content",
  "content": {
    "hero": [ /* Array of content blocks */ ],
    "collections": [ /* Array of content blocks */ ],
    "collectionsData": [ /* Array of collection objects */ ],
    "benefits": [ /* Array of content blocks */ ],
    "benefitsData": [ /* Array of benefit objects */ ],
    "steps": [ /* Array of content blocks */ ],
    "stepsData": [ /* Array of step objects */ ],
    "testimonials": [ /* Array of content blocks */ ],
    "testimonialsData": [ /* Array of testimonial objects */ ]
  }
}
```

**Response (201 Created / 200 Updated):**
```json
{
  "success": true,
  "message": "Content created successfully",
  "data": {
    "id": 1,
    "page_slug": "landing",
    "title": "Landing Page Content",
    "content": { /* Parsed JSON */ },
    "last_updated_by": 5,
    "updated_at": "2026-04-07T10:30:00Z"
  }
}
```

**Error Response (400 Bad Request):**
```json
{
  "success": false,
  "message": "Title and content are required."
}
```

---

### 4. Delete Page Content
```
DELETE /api/admin/content/:pageSlug
```

**Parameters:**
- `pageSlug` (string, required): The page identifier

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Content deleted successfully",
  "deleted_count": 1
}
```

**Error Response (404 Not Found):**
```json
{
  "success": false,
  "message": "Content for page 'landing' not found."
}
```

---

## Data Structure Examples

### Content Block (Hero, Collections, Benefits, Steps, Testimonials - Titles)
```typescript
interface ContentBlock {
  key: string;         // Unique identifier (e.g., 'HeroSection-Title')
  label: string;       // Display name in admin UI
  value: string;       // Content value
  type: 'text' | 'textarea' | 'json';  // Input field type
}
```

### Collection Object
```typescript
interface Collection {
  id: string;                    // Unique ID for collection
  title: string;                 // Collection title
  subtitle: string;              // Collection subtitle
  description: string;           // Description text
  image?: string;                // Base64 encoded image or URL
}
```

### Benefit Object
```typescript
interface Benefit {
  id: string;                    // Unique ID for benefit
  title: string;                 // Benefit title
  description: string;           // Benefit description
  icon?: string;                 // Base64 encoded icon or URL (64x64px recommended)
}
```

### Step Object
```typescript
interface Step {
  id: string;                    // Unique ID for step
  number: string;                // Step number (1, 2, 3, etc.)
  title: string;                 // Step title
  description: string;           // Step description
}
```

### Testimonial Object
```typescript
interface Testimonial {
  id: string;                    // Unique ID for testimonial
  name: string;                  // Customer name
  event: string;                 // Event type
  content: string;               // Testimonial message
  image?: string;                // Base64 encoded avatar or URL
}
```

---

## Error Codes

| Code | Message | Description |
|------|---------|-------------|
| 200 | Content fetched/updated successfully | Successful GET/POST operation |
| 201 | Content created successfully | New content created |
| 400 | Bad Request | Missing or invalid parameters |
| 401 | Access Denied. No token provided. | Missing authentication token |
| 403 | Access Denied / Invalid or Expired Token | Invalid token or insufficient permissions |
| 404 | Content not found | Page slug doesn't exist in database |
| 500 | Internal Server Error | Server error during processing |

---

## Usage Examples

### Frontend (React)
```typescript
import { getAccessToken } from '@/lib/auth-utils';
import API_ENDPOINTS from '@/lib/api-config';

// Fetch content
const response = await fetch(API_ENDPOINTS.GET_PAGE_CONTENT('landing'), {
  headers: { 'Authorization': `Bearer ${getAccessToken()}` }
});
const data = await response.json();

// Save content
const saveResponse = await fetch(API_ENDPOINTS.SAVE_PAGE_CONTENT('landing'), {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${getAccessToken()}`
  },
  body: JSON.stringify({ title: 'Landing Page', content: contentObject })
});
```

### cURL
```bash
# Get content
curl -X GET http://localhost:3000/api/admin/content/landing \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

# Save content
curl -X POST http://localhost:3000/api/admin/content/landing \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{"title": "Landing Page", "content": {...}}'
```

---

## Notes

- **Image Storage**: Images and icons are stored as Base64-encoded strings within the JSON content
- **JSON Size**: Since Base64 significantly increases data size, consider using an external storage service (S3, etc.) for large files in production
- **Content Key**: For landing page, the `content_key` is always set to `'landing'`
- **Last Updated By**: Automatically captured from the authenticated user's ID
- **Timestamps**: `updated_at` is automatically set/updated on each modification
- **Default Content**: If content doesn't exist for a page, the frontend should use predefined defaults

---

## Database Schema

```sql
CREATE TABLE IF NOT EXISTS SiteContent (
  id INT AUTO_INCREMENT PRIMARY KEY,
  page_slug VARCHAR(255) NOT NULL,
  content_key VARCHAR(255),
  title VARCHAR(255),
  content LONGTEXT,
  last_updated_by INT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```
