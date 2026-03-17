import express from "express";
import multer from "multer";
import {
  createVisionMissionPEOs,
  getVisionMissionPEOs,
  getVisionMissionPEOsByDepartment,
  getVisionMissionPEOsById,
  deleteVisionMissionPEOs,
  getDepartments,
} from "./criteria1Controller.js";

const router = express.Router();

// Configure multer for image uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 25 * 1024 * 1024,
  },
});

// Routes
router.post(
  "/vision-mission-peos",
  upload.fields([
    { name: "attachment", maxCount: 1 },
    { name: "file", maxCount: 1 },
  ]),
  createVisionMissionPEOs,
);
router.get("/vision-mission-peos", getVisionMissionPEOs);
router.get("/vision-mission-peos/by-department", getVisionMissionPEOsByDepartment);
router.get("/vision-mission-peos/:id", getVisionMissionPEOsById);
router.delete("/vision-mission-peos/:id", deleteVisionMissionPEOs);
router.get("/departments", getDepartments);

export default router;
