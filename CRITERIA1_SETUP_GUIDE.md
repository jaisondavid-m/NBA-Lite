# Criteria 1: Vision, Mission & PEOs - Complete Setup Guide

## Overview
This implementation provides a complete solution for managing institutional and departmental Vision, Mission, and Program Educational Objectives (PEOs) with text and image support, plus department-wise filtering.

## Architecture

### Database
- **Table**: `vision_mission_peos`
- **Fields**: 
  - Department filtering (department_name)
  - Criterion type (Vision, Mission, PEOs, Process of Defining, Dissemination)
  - Text content and image storage
  - Tracking (created_by, updated_by, timestamps)
  - Academic year support

### Backend (Express.js)
- **Routes**: `/api/criteria1/vision-mission-peos`
- **Image Upload**: Multer middleware (max 10MB, image files only)
- **Storage**: `/server/uploads/criteria1/` directory

### Frontend (React)
- **Form Component**: Text input + image upload
- **Display Component**: Expandable cards with department/criterion filtering
- **State Management**: Uses Zustand (program selection from TopBar)

## Setup Steps

### Step 1: Database Migration
Run the migration file to create the table:

```sql
-- Copy and run the SQL from: server/migrations/20260317_create_vision_mission_peos.sql
-- In your MySQL client/IDE:
```

OR via command line:
```bash
mysql -h your_host -u your_user -p your_database < server/migrations/20260317_create_vision_mission_peos.sql
```

### Step 2: Dependencies Installed ✅
- ✅ Multer installed in server
- No additional client-side dependencies needed

### Step 3: Start the Server
```bash
cd server
npm run dev  # or use 'air' if configured
```

### Step 4: Access the Application
Navigate to `http://localhost:5173/criteria1` (or your Vite port)

## Usage

### STEP 1: Select Department/Program
Use the **TopBar** filter to select a department/program first. This populates the form automatically.

### STEP 2: Fill the Form (Add Data)
On the "Add Vision, Mission & PEOs Data" section:

1. **Select Criterion** (dropdown):
   - Vision
   - Mission
   - Program Educational Objectives (PEOs)
   - Process of Defining Vision, Mission and PEOs
   - Dissemination of Vision, Mission and PEOs

2. **Enter Content** (textarea):
   - Type the text content for the selected criterion

3. **Upload Image** (optional):
   - Click "Upload Image" and select an image file
   - Supported formats: JPG, PNG, GIF, WebP, SVG
   - Max size: 10MB
   - Image preview appears below input

4. **Image Alt Text** (optional):
   - Add accessibility text for the image

5. **Submit**:
   - Click "Submit" button
   - Success message confirms creation/update

### STEP 3: View & Filter Data
On the "View Data by Department" section:

1. **Department Filter**: Select a specific department or "All Departments"
2. **Criterion Filter**: Filter by Vision, Mission, PEOs, etc., or view all
3. **Click Cards to Expand**: View content text, images, and metadata
4. **Delete Option**: Click "Delete" to remove entries (with confirmation)

## API Endpoints

### POST /api/criteria1/vision-mission-peos
Create or update an entry
**Request (multipart/form-data)**:
```
- programId (required)
- departmentName (required)
- criterionName (required)
- contentText (optional)
- image (file, optional)
- imageAltText (optional)
- academicYear (optional)
- createdBy (required)
```

**Response**:
```json
{
  "success": true,
  "message": "Entry created/updated successfully",
  "imageUrl": "/uploads/criteria1/Vision_1_1234567890.jpg"
}
```

### GET /api/criteria1/vision-mission-peos
Fetch entries with filters
**Query Parameters**:
- `departmentName` (optional)
- `criterionName` (optional)
- `academicYear` (optional)

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "program_id": 1,
      "department_name": "Computer Science",
      "criterion_name": "Vision",
      "content_text": "...",
      "image_url": "/uploads/criteria1/Vision_1_xxx.jpg",
      "image_alt_text": "Department Vision Statement",
      "academic_year": "2026-27",
      "created_at": "2026-03-17T10:00:00Z",
      "updated_at": "2026-03-17T10:00:00Z",
      "created_by": "admin",
      "updated_by": "admin"
    }
  ]
}
```

### GET /api/criteria1/vision-mission-peos/:id
Fetch a single entry by ID

### GET /api/criteria1/departments
Get all departments with entries (for filter dropdown)

### DELETE /api/criteria1/vision-mission-peos/:id
Delete an entry (removes image file and database record)

## File Locations

### Backend
```
server/
├── criterias/criteria1/
│   ├── criteria1Controller.js  (handlers)
│   └── criteria1Routes.js      (routes with multer)
├── migrations/
│   └── 20260317_create_vision_mission_peos.sql
├── uploads/criteria1/          (image storage - auto-created)
└── server.js                   (updated with routes)
```

### Frontend
```
client/src/
├── components/
│   ├── VisionMissionPEOsForm.jsx    (form component)
│   └── VisionMissionPEOsDisplay.jsx (display component)
└── pages/
    └── Creteria1.jsx               (integrated page)
```

## Key Features

✅ **Text & Image Input**: Combine text content with image uploads
✅ **Department Filtering**: View data organized by department
✅ **Criterion Categories**: Support for 5 criterion types
✅ **Image Validation**: File size limit (10MB) and format validation
✅ **Expandable View**: Compact list view with detailed expand
✅ **CRUD Operations**: Create, Read, Update, Delete support
✅ **Metadata Tracking**: Know who created/updated and when
✅ **Academic Year Support**: Track data by academic year
✅ **Responsive Design**: Works on desktop and mobile

## Troubleshooting

### Images show broken links
- Ensure `/server/uploads/criteria1/` directory exists
- Check that server is serving uploads: `app.use("/uploads", express.static(...))`
- Verify image paths in database start with `/uploads/criteria1/`

### Form submission fails
- Select a department from TopBar first
- Check browser console for errors
- Confirm server is running on port 5001
- Check CORS settings if getting blocked

### Database connection error
- Verify migration was applied: `SELECT * FROM vision_mission_peos;`
- Check DB credentials in `.env`
- Ensure all_program table exists (it should from previous setup)

### Image upload not working
- Check file size (max 10MB)
- Verify file format is image (JPG, PNG, GIF, WebP, SVG)
- Check upload directory permissions

## Customization

### Add New Criterion Type
1. Update dropdown in `VisionMissionPEOsForm.jsx`:
```jsx
<option value="YourNewCriterion">Your New Criterion</option>
```

2. Update color map in `VisionMissionPEOsDisplay.jsx`:
```jsx
const colors = {
  "YourNewCriterion": "bg-orange-100 text-orange-800",
  // ...
};
```

### Change Image Upload Size Limit
In `server/criterias/criteria1/criteria1Routes.js`:
```javascript
const upload = multer({
  limits: {
    fileSize: 50 * 1024 * 1024, // Change to 50MB
  },
});
```

### Connect to User Authentication
In `VisionMissionPEOsForm.jsx`, replace:
```javascript
createdBy: "admin" // TODO: Get from auth context
```

With your actual auth context:
```javascript
createdBy: user?.name // From your auth store
```

## Notes
- Images are stored on server filesystem for easy access and backup
- Consider adding cloud storage (S3, Cloudinary) for production
- Academic year defaults to current year if not specified
- Create and update operations use upsert logic (creates if new, updates if exists)

## Next Steps
1. Complete database migration
2. Test form submission with an actual department
3. Download exported data if needed (can add export to PDF/Excel feature)
4. Consider adding role-based permissions for edit/delete operations
