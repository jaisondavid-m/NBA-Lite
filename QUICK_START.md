# 🚀 Quick Start Guide - Criteria 1 Implementation

## What Was Built

A complete **Vision, Mission & PEOs** management system for your NBA portal with:
- Form to input text + images
- Filter by department
- View filtered data in expandable cards
- Delete capability

---

## ⚡ Quick Setup (3 Steps)

### Step 1: Apply Database Migration
```bash
# Option A: Via MySQL client/workbench
# Copy-paste the SQL from: server/migrations/20260317_create_vision_mission_peos.sql

# Option B: Via Command line
mysql -h your_host -u your_user -p your_database < server/migrations/20260317_create_vision_mission_peos.sql
```

### Step 2: Install Dependencies
```bash
cd server
npm install  # Already done! ✅
```

### Step 3: Start Server
```bash
npm run dev  # or use 'air' if configured
```

---

## 📖 How to Use

### Adding Data

1. **Open** `http://localhost:5173/criteria1`
2. **Select Department** using the TopBar dropdown (top-right)
3. **Fill the Form**:
   - Select a criterion (Vision, Mission, PEOs, etc.)
   - Enter text content
   - Upload an image (optional, max 10MB)
   - Add image alt text (optional)
4. **Click Submit**
5. ✅ Data appears in the display section below

### Viewing & Filtering Data

1. **Filter by Department**: Use dropdown in "View Data" section
2. **Filter by Criterion**: Use criterion dropdown
3. **View Details**: Click any card to expand and see full content + image
4. **Delete**: Click "Delete" button (with confirmation)

---

## 📁 File Structure

```
NBA-Lite/
├── server/
│   ├── criterias/criteria1/
│   │   ├── criteria1Controller.js ⭐ NEW
│   │   └── criteria1Routes.js ⭐ NEW
│   ├── migrations/
│   │   └── 20260317_create_vision_mission_peos.sql ⭐ NEW
│   ├── uploads/
│   │   └── criteria1/ (auto-created for images)
│   └── server.js ⭐ MODIFIED
│
├── client/
│   └── src/
│       ├── components/
│       │   ├── VisionMissionPEOsForm.jsx ⭐ NEW
│       │   └── VisionMissionPEOsDisplay.jsx ⭐ NEW
│       └── pages/
│           └── Creteria1.jsx ⭐ MODIFIED
│
└── IMPLEMENTATION_SUMMARY.md ⭐ NEW
```

---

## 🎯 Criterion Types

You can enter data for 5 types:

| Type | Use Case |
|------|----------|
| **Vision** | Department's long-term vision |
| **Mission** | Department's mission statement |
| **PEOs** | Program Educational Objectives |
| **Process of Defining** | How vision/mission/PEOs are defined (1.1.3) |
| **Dissemination** | How vision/mission/PEOs are communicated (1.1.4) |

---

## 🔌 API Endpoints

| Method | Endpoint | What It Does |
|--------|----------|------|
| POST | `/api/criteria1/vision-mission-peos` | Create/update entry with image |
| GET | `/api/criteria1/vision-mission-peos` | Fetch entries (filterable) |
| GET | `/api/criteria1/departments` | Get all departments |
| DELETE | `/api/criteria1/vision-mission-peos/:id` | Delete entry |

---

## ❓ FAQ

**Q: Do I need to select a department?**
A: Yes, first select department from TopBar. It's required to create entries.

**Q: Can I upload multiple images?**
A: Currently one image per criterion per department. Update existing entry to change image.

**Q: Where are images stored?**
A: Server's `/server/uploads/criteria1/` directory. Database stores the URL.

**Q: What image formats work?**
A: JPG, PNG, GIF, WebP, SVG. Max 10MB.

**Q: Can I edit after submission?**
A: Yes! Submit again with same department+criterion to update (overwrites).

**Q: How do I delete an entry?**
A: Click "Delete" on the card. Images are also removed from server.

---

## ✅ Verification Checklist

After setup, verify:
- [ ] Database table created (`SELECT * FROM vision_mission_peos;`)
- [ ] Server runs without errors
- [ ] Can access `/criteria1` page  
- [ ] Can select department from TopBar
- [ ] Can submit form with text and image
- [ ] Image displays in the display section
- [ ] Filters work for department and criterion
- [ ] Delete removes entry and image file

---

## 🆘 Troubleshooting

**"No program selected"**
→ Select department from TopBar first!

**"Failed to submit form"**
→ Check if server is running on port 5001

**Images show broken link**
→ Ensure `/server/uploads/criteria1/` exists & has images

**Database error on submit**
→ Verify migration was applied: `SHOW TABLES;` should include `vision_mission_peos`

**Multer module not found**
→ Run: `cd server && npm install`

---

## 📚 More Documentation

- **Full Setup Guide**: `CRITERIA1_SETUP_GUIDE.md`
- **Implementation Details**: `IMPLEMENTATION_SUMMARY.md`
- **Code Comments**: Check JSDoc in component files

---

## 🎁 What's Included

✅ Form component (text + image input)
✅ Display component (with filtering)
✅ Backend routes & API endpoints
✅ Image upload with validation
✅ Database schema
✅ CRUD operations
✅ Responsive UI (Tailwind CSS)
✅ Error handling
✅ Success notifications

---

## 🚢 Ready to Go!

Your Criteria 1 system is complete and ready to use. Just apply the database migration and start the server!

**Questions?** Check the detailed documentation files or review the component code directly - everything is well-commented.
