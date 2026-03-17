# API Documentation - Criteria 1: Vision, Mission & PEOs

## Base URL
```
http://localhost:5001/api/criteria1
```

---

## Endpoints

### 1. Create or Update Vision/Mission/PEOs Entry
**POST** `/vision-mission-peos`

Creates a new entry or updates existing one (upsert logic based on program_id + criterion_name).

#### Request
**Content-Type**: `multipart/form-data`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `programId` | number | ✅ | ID from all_program table |
| `departmentName` | string | ✅ | Department name (e.g., "Computer Science") |
| `criterionName` | string | ✅ | One of: Vision, Mission, PEOs, Process of Defining, Dissemination |
| `contentText` | string | ❌ | Text content of the criterion |
| `image` | file | ❌ | Image file (JPG, PNG, GIF, WebP, SVG; max 10MB) |
| `imageAltText` | string | ❌ | Alt text for image (accessibility) |
| `academicYear` | string | ❌ | Format: YYYY-YY (e.g., 2026-27). Defaults to current year |
| `createdBy` | string | ✅ | Username/email of person creating entry |

#### Example Request (using curl)
```bash
curl -X POST http://localhost:5001/api/criteria1/vision-mission-peos \
  -F "programId=5" \
  -F "departmentName=Computer Science" \
  -F "criterionName=Vision" \
  -F "contentText=To be a leading department in computer science education..." \
  -F "image=@/path/to/vision_image.jpg" \
  -F "imageAltText=Department Vision Statement" \
  -F "academicYear=2026-27" \
  -F "createdBy=admin@college.edu"
```

#### Example Request (using JavaScript/Fetch)
```javascript
const formData = new FormData();
formData.append('programId', 5);
formData.append('departmentName', 'Computer Science');
formData.append('criterionName', 'Vision');
formData.append('contentText', 'To be a leading department...');
formData.append('image', fileInputElement.files[0]);
formData.append('imageAltText', 'Department Vision Statement');
formData.append('academicYear', '2026-27');
formData.append('createdBy', 'admin@college.edu');

const response = await fetch(
  'http://localhost:5001/api/criteria1/vision-mission-peos',
  {
    method: 'POST',
    body: formData
  }
);
const data = await response.json();
```

#### Successful Response (201/200)
```json
{
  "success": true,
  "message": "Entry created successfully",
  "imageUrl": "/uploads/criteria1/Vision_5_1679123456789.jpg"
}
```

#### Error Response
```json
{
  "success": false,
  "message": "Missing required fields: programId, departmentName, criterionName"
}
```

---

### 2. Get All Vision/Mission/PEOs Entries (with Filtering)
**GET** `/vision-mission-peos`

Retrieves entries with optional filters.

#### Query Parameters
| Parameter | Type | Optional | Description |
|-----------|------|----------|-------------|
| `departmentName` | string | ✅ | Filter by specific department |
| `criterionName` | string | ✅ | Filter by criterion type |
| `academicYear` | string | ✅ | Filter by academic year (YYYY-YY) |

#### Example Requests
```bash
# Get all entries
GET /vision-mission-peos

# Get entries for specific department
GET /vision-mission-peos?departmentName=Computer%20Science

# Get Vision entries for Computer Science
GET /vision-mission-peos?departmentName=Computer%20Science&criterionName=Vision

# Get entries for academic year
GET /vision-mission-peos?academicYear=2026-27
```

#### Successful Response (200)
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "program_id": 5,
      "department_name": "Computer Science",
      "criterion_name": "Vision",
      "content_text": "To be a leading department in computer science education...",
      "image_url": "/uploads/criteria1/Vision_5_1679123456789.jpg",
      "image_alt_text": "Department Vision Statement",
      "academic_year": "2026-27",
      "created_at": "2026-03-17T10:30:00.000Z",
      "updated_at": "2026-03-17T10:30:00.000Z",
      "created_by": "admin@college.edu",
      "updated_by": "admin@college.edu"
    },
    {
      "id": 2,
      "program_id": 5,
      "department_name": "Computer Science",
      "criterion_name": "Mission",
      "content_text": "To provide quality education in computer science...",
      "image_url": "/uploads/criteria1/Mission_5_1679123456790.jpg",
      "image_alt_text": "Department Mission Statement",
      "academic_year": "2026-27",
      "created_at": "2026-03-17T11:00:00.000Z",
      "updated_at": "2026-03-17T11:00:00.000Z",
      "created_by": "admin@college.edu",
      "updated_by": "admin@college.edu"
    }
  ],
  "message": "Data fetched successfully"
}
```

#### Empty Result
```json
{
  "success": true,
  "data": [],
  "message": "Data fetched successfully"
}
```

---

### 3. Get Vision/Mission/PEOs by Department (Grouped)
**GET** `/vision-mission-peos/by-department`

Returns grouped data by department and criterion (for dashboard overview).

#### Query Parameters
| Parameter | Type | Optional | Description |
|-----------|------|----------|-------------|
| `academicYear` | string | ✅ | Filter by academic year |

#### Example Request
```bash
GET /vision-mission-peos/by-department?academicYear=2026-27
```

#### Successful Response (200)
```json
{
  "success": true,
  "data": [
    {
      "department_name": "Computer Science",
      "criterion_name": "Vision",
      "ids": "1,2,3",
      "count": 3
    },
    {
      "department_name": "Computer Science",
      "criterion_name": "Mission",
      "ids": "4,5",
      "count": 2
    },
    {
      "department_name": "Electrical Engineering",
      "criterion_name": "Vision",
      "ids": "6",
      "count": 1
    }
  ],
  "message": "Data fetched successfully"
}
```

---

### 4. Get Single Vision/Mission/PEOs Entry by ID
**GET** `/vision-mission-peos/:id`

Retrieves a single entry by its ID.

#### URL Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | number | Entry ID |

#### Example Request
```bash
GET /vision-mission-peos/1
```

#### Successful Response (200)
```json
{
  "success": true,
  "data": {
    "id": 1,
    "program_id": 5,
    "department_name": "Computer Science",
    "criterion_name": "Vision",
    "content_text": "To be a leading department...",
    "image_url": "/uploads/criteria1/Vision_5_1679123456789.jpg",
    "image_alt_text": "Department Vision Statement",
    "academic_year": "2026-27",
    "created_at": "2026-03-17T10:30:00.000Z",
    "updated_at": "2026-03-17T10:30:00.000Z",
    "created_by": "admin@college.edu",
    "updated_by": "admin@college.edu"
  },
  "message": "Entry fetched successfully"
}
```

#### Error Response (404)
```json
{
  "success": false,
  "message": "Entry not found"
}
```

---

### 5. Delete Vision/Mission/PEOs Entry
**DELETE** `/vision-mission-peos/:id`

Deletes an entry and its associated image file.

#### URL Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | number | Entry ID to delete |

#### Example Request
```bash
curl -X DELETE http://localhost:5001/api/criteria1/vision-mission-peos/1
```

#### Successful Response (200)
```json
{
  "success": true,
  "message": "Entry deleted successfully"
}
```

#### Error Response
```json
{
  "success": false,
  "message": "Entry not found"
}
```

---

### 6. Get All Departments
**GET** `/departments`

Returns list of unique departments that have entries.

#### Example Request
```bash
GET /departments
```

#### Successful Response (200)
```json
{
  "success": true,
  "data": [
    {
      "department_name": "Computer Science"
    },
    {
      "department_name": "Electrical Engineering"
    },
    {
      "department_name": "Mechanical Engineering"
    }
  ],
  "message": "Departments fetched successfully"
}
```

---

## Status Codes

| Code | Meaning | Example |
|------|---------|---------|
| 200 | Success | Return data, update successful, delete successful |
| 201 | Created | Entry created (POST) |
| 400 | Bad Request | Missing required fields, invalid file type |
| 404 | Not Found | Entry ID doesn't exist |
| 500 | Server Error | Database error, file system error |

---

## Authentication & Headers

Currently, no authentication is implemented. In production:
- Add JWT token validation
- Check user permissions
- Audit logging

Example with auth (future):
```javascript
const response = await fetch(
  'http://localhost:5001/api/criteria1/vision-mission-peos',
  {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer YOUR_JWT_TOKEN'
    },
    body: formData
  }
);
```

---

## Error Handling

Common errors and solutions:

### Upload Size Error
```json
{
  "success": false,
  "message": "File too large",
  "error": "File size exceeds 10MB limit"
}
```
**Solution**: Upload image less than 10MB

### Invalid File Type
```json
{
  "success": false,
  "error": "Only image files are allowed"
}
```
**Solution**: Use JPG, PNG, GIF, WebP, or SVG format

### Database Connection Error
```json
{
  "success": false,
  "message": "Failed to create/update entry",
  "error": "ER_DUP_ENTRY"
}
```
**Solution**: Check database connection, verify all_program table exists

---

## Rate Limiting

Not currently implemented. Consider adding:
- 100 requests per minute per IP
- 1000 requests per hour per user
- File upload size limits

---

## Testing with Postman

1. **Create/Update**:
   - Method: POST
   - URL: `http://localhost:5001/api/criteria1/vision-mission-peos`
   - Body: form-data with fields from above
   - Add image file to "image" field

2. **Get All**:
   - Method: GET
   - URL: `http://localhost:5001/api/criteria1/vision-mission-peos`
   - Query params: `departmentName`, `criterionName`, `academicYear`

3. **Delete**:
   - Method: DELETE
   - URL: `http://localhost:5001/api/criteria1/vision-mission-peos/1`

---

## Response Time Expectations

- Create/Update: 500-1500ms (includes file upload)
- GET all: 100-300ms
- GET single: 50-100ms
- DELETE: 200-400ms
- GET departments: 50-100ms

---

## Webhooks (Future Enhancement)

Consider implementing webhooks to notify other systems when:
- Entry created: `POST /webhooks/entry-created`
- Entry updated: `POST /webhooks/entry-updated`
- Entry deleted: `POST /webhooks/entry-deleted`

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-03-17 | Initial release with CRUD, images, filtering |

---

## Support

For issues or questions:
1. Check the error message and solutions above
2. Review component code (JSDoc comments)
3. Check database logs: `SHOW ERRORS;`
4. Check server console for detailed error messages
