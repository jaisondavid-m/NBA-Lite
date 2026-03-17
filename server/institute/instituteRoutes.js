import express from "express";
import { getAllPrograms } from "./instituteController.js";

const router = express.Router();

// Get all programs/courses for the institute
router.get("/courses", getAllPrograms);

export default router;
