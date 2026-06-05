# API Documentation

## 🌐 Base URL
**Development**: `http://localhost:4000/api`
**Production**: `https://your-domain.com/api`

## 🔐 Authentication

All protected endpoints require JWT token sent in HTTP-only cookies.

### **Login**
```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com",
      "role": "trainer",
      "status": "active"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### **Get Current User**
```http
GET /auth/me
Cookie: token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "role": "trainer",
    "status": "active",
    "lastLogin": "2024-03-23"
  }
}
```

### **Logout**
```http
POST /auth/logout
Cookie: token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 👑 Admin Endpoints

### **Get All Users**
```http
GET /admin/users
```

**Response:**
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": 1,
        "name": "Admin User",
        "email": "admin@example.com",
        "role": "admin",
        "status": "active",
        "lastLogin": "2024-03-23",
        "createdAt": "2024-01-01T00:00:00.000Z"
      }
    ]
  }
}
```

### **Create User**
```http
POST /admin/users
Content-Type: application/json

{
  "name": "New User",
  "email": "newuser@example.com",
  "password": "password123",
  "role": "trainer",
  "department": "Training",
  "designation": "Senior Trainer"
}
```

### **Update User**
```http
PUT /admin/users/:id
Content-Type: application/json

{
  "name": "Updated Name",
  "email": "updated@example.com",
  "role": "manager",
  "status": "inactive",
  "department": "Operations",
  "designation": "Team Lead"
}
```

### **Toggle User Status**
```http
PUT /admin/users/:id
Content-Type: application/json

{
  "status": "inactive"
}
```

### **Delete User**
```http
DELETE /admin/users/:id
```

### **Get Dashboard Overview**
```http
GET /admin/overview
```

**Response:**
```json
{
  "success": true,
  "data": {
    "users": 15,
    "courses": 8,
    "assessments": 45
  }
}
```

### **Get All Assessments**
```http
GET /admin/assessments
```

**Response:**
```json
{
  "success": true,
  "data": {
    "assessments": [
      {
        "id": 1,
        "title": "Safety Training Assessment",
        "description": "Comprehensive safety evaluation",
        "scheduled_date": "2024-03-25T10:00:00.000Z",
        "status": "Scheduled",
        "trainer": {
          "id": 1,
          "name": "John Trainer"
        },
        "course": {
          "id": 1,
          "name": "Safety Course"
        },
        "managers": [
          {
            "id": 2,
            "name": "Jane Manager"
          }
        ]
      }
    ]
  }
}
```

### **Create Assessment**
```http
POST /admin/assessments
Content-Type: application/json

{
  "title": "New Assessment",
  "description": "Assessment description",
  "scheduled_date": "2024-03-25T10:00:00.000Z",
  "trainer_id": 1,
  "course_id": 1,
  "manager_ids": [2, 3]
}
```

### **Get All Courses**
```http
GET /admin/courses
```

### **Get All Trainers**
```http
GET /admin/trainers
```

**Response:**
```json
{
  "success": true,
  "data": {
    "trainers": [
      {
        "id": 1,
        "name": "John Trainer",
        "email": "trainer@example.com",
        "status": "active"
      }
    ]
  }
}
```

### **Get All Managers**
```http
GET /admin/managers
```

## 👔 Manager Endpoints

### **Get Assigned Assessments**
```http
GET /manager/assessments
```

**Response:**
```json
{
  "success": true,
  "data": {
    "assessments": [
      {
        "id": 1,
        "title": "Safety Training Assessment",
        "trainer": {
          "id": 1,
          "name": "John Trainer"
        },
        "feedbacks": [
          {
            "id": 1,
            "content": "Excellent performance",
            "rating": 5,
            "manager_id": 2,
            "manager": {
              "name": "Jane Manager"
            },
            "created_at": "2024-03-23T10:30:00.000Z"
          }
        ]
      }
    ]
  }
}
```

### **Submit Feedback**
```http
POST /manager/feedback
Content-Type: application/json

{
  "assessment_id": 1,
  "content": "Great job on the assessment",
  "rating": 4
}
```

### **Get Team Performance**
```http
GET /manager/performance
```

## 🎓 Trainer Endpoints

### **Get Assigned Assessments**
```http
GET /trainer/assessments
```

**Response:**
```json
{
  "success": true,
  "data": {
    "assessments": [
      {
        "id": 1,
        "title": "Safety Training Assessment",
        "description": "Comprehensive safety evaluation",
        "scheduled_date": "2024-03-25T10:00:00.000Z",
        "status": "Completed",
        "course": {
          "name": "Safety Course"
        },
        "feedback": {
          "content": "Excellent performance",
          "rating": 5,
          "created_at": "2024-03-23T10:30:00.000Z"
        }
      }
    ]
  }
}
```

### **Get Assessment History**
```http
GET /trainer/history
```

### **Get Profile**
```http
GET /trainer/profile
```

## 📜 Certificate Endpoints

### **Get Certificates (Admin)**
```http
GET /admin/certificates
```

### **Issue Certificate (Manager)**
```http
POST /manager/certificates
Content-Type: application/json

{
  "user_id": 1,
  "assessment_id": 1,
  "template_id": 1,
  "issue_date": "2024-03-23"
}
```

### **Get Certificates (Trainer)**
```http
GET /trainer/certificates
```

## 🎯 Error Responses

### **Standard Error Format**
```json
{
  "success": false,
  "error": "Error message description",
  "code": "ERROR_CODE"
}
```

### **Common HTTP Status Codes**
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized (invalid/missing token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `500` - Internal Server Error

### **Authentication Errors**
```json
{
  "success": false,
  "error": "Invalid credentials",
  "code": "INVALID_CREDENTIALS"
}
```

```json
{
  "success": false,
  "error": "User is inactive",
  "code": "USER_INACTIVE"
}
```

```json
{
  "success": false,
  "error": "Token expired",
  "code": "TOKEN_EXPIRED"
}
```

### **Validation Errors**
```json
{
  "success": false,
  "error": "Email is required",
  "code": "VALIDATION_ERROR",
  "details": [
    {
      "field": "email",
      "message": "Email is required"
    }
  ]
}
```

## 🔄 Rate Limiting

API endpoints are rate-limited to prevent abuse:
- **Authentication endpoints**: 5 requests per minute
- **Other endpoints**: 100 requests per minute

Rate limit headers are included in responses:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

## 🌍 CORS Configuration

**Development**: Allows `http://localhost:3000`
**Production**: Configure your domain in environment variables

## 📝 Request/Response Examples

### **Multi-Manager Feedback Scenario**

**Request:**
```http
POST /manager/feedback
Content-Type: application/json

{
  "assessment_id": 1,
  "content": "Demonstrated excellent safety protocols",
  "rating": 5
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "feedback": {
      "id": 2,
      "assessment_id": 1,
      "content": "Demonstrated excellent safety protocols",
      "rating": 5,
      "manager_id": 3,
      "created_at": "2024-03-23T11:00:00.000Z"
    }
  },
  "message": "Feedback submitted successfully"
}
```

### **User Status Toggle Scenario**

**Request:**
```http
PUT /admin/users/6
Content-Type: application/json

{
  "status": "inactive"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 6,
      "name": "John Doe",
      "email": "john@example.com",
      "role": "trainer",
      "status": "inactive",
      "lastLogin": "2024-03-20"
    }
  },
  "message": "User deactivated successfully"
}
```

## 🔧 Testing the API

### **Using Postman/Thunder Client**
1. Import the collection (if provided)
2. Set environment variables:
   - `baseUrl`: http://localhost:4000/api
   - `token`: (auto-captured from login response)
3. Execute requests in order:
   - Login to get token
   - Use token for subsequent requests

### **Using cURL**
```bash
# Login
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password123"}' \
  -c cookies.txt

# Get users (with token)
curl -X GET http://localhost:4000/api/admin/users \
  -b cookies.txt
```

## 📊 Pagination

List endpoints support pagination:
```http
GET /admin/users?page=1&limit=10
```

**Response:**
```json
{
  "success": true,
  "data": {
    "users": [...],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 25,
      "pages": 3
    }
  }
}
```

## 🔍 Search & Filtering

### **User Search**
```http
GET /admin/users?search=john&role=trainer&status=active
```

### **Assessment Filtering**
```http
GET /admin/assessments?status=completed&trainer_id=1
```

## 🚀 WebSocket Events (Future Enhancement)

Real-time events for:
- Assessment status updates
- New feedback notifications
- User status changes
- Certificate issuances

```javascript
// Example WebSocket connection
const ws = new WebSocket('ws://localhost:4000');

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Real-time update:', data);
};
```

This API documentation provides comprehensive information for integrating with the Automation Assessment System backend services.
