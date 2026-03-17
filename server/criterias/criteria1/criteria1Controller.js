import pool from "../db.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const UPLOAD_DIR = path.join(__dirname, "../uploads/criteria1");

// Ensure uploads directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

/**
 * Create a new vision, mission, or PEOs entry
 * POST /api/criteria1/vision-mission-peos
 */
export const createVisionMissionPEOs = async (req, res) => {
  try {
    const {
      programId,
      departmentName,
      criterionName,
      contentText,
      imageAltText,
      academicYear,
      createdBy,
    } = req.body;

    let imageUrl = null;

    // Handle image upload if present
    if (req.file) {
      const fileExt = path.extname(req.file.originalname);
      const fileName = `${criterionName}_${programId}_${Date.now()}${fileExt}`;
      const filePath = path.join(UPLOAD_DIR, fileName);

      // Save file
      fs.writeFileSync(filePath, req.file.buffer);
      imageUrl = `/uploads/criteria1/${fileName}`;
    }

    // Validate required fields
    if (!programId || !departmentName || !criterionName) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: programId, departmentName, criterionName",
      });
    }

    const connection = await pool.getConnection();

    // Check if entry already exists for this program and criterion
    const [existing] = await connection.query(
      "SELECT id FROM vision_mission_peos WHERE program_id = ? AND criterion_name = ? AND academic_year = ?",
      [programId, criterionName, academicYear || new Date().getFullYear() + "-" + String(new Date().getFullYear() + 1).slice(-2)]
    );

    let query, params;

    if (existing && existing.length > 0) {
      // Update existing entry
      query = `
        UPDATE vision_mission_peos 
        SET content_text = ?, 
            image_url = COALESCE(?, image_url),
            image_alt_text = ?, 
            updated_by = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `;
      params = [
        contentText || null,
        imageUrl,
        imageAltText || null,
        createdBy,
        existing[0].id,
      ];
    } else {
      // Create new entry
      query = `
        INSERT INTO vision_mission_peos 
        (program_id, department_name, criterion_name, content_text, image_url, image_alt_text, academic_year, created_by, updated_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      params = [
        programId,
        departmentName,
        criterionName,
        contentText || null,
        imageUrl,
        imageAltText || null,
        academicYear ||
          new Date().getFullYear() +
            "-" +
            String(new Date().getFullYear() + 1).slice(-2),
        createdBy,
        createdBy,
      ];
    }

    await connection.query(query, params);
    connection.release();

    res.json({
      success: true,
      message: existing && existing.length > 0 ? "Entry updated successfully" : "Entry created successfully",
      imageUrl,
    });
  } catch (error) {
    console.error("Error creating/updating vision mission PEOs:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create/update entry",
      error: error.message,
    });
  }
};

/**
 * Get all vision, mission, PEOs entries with filtering
 * GET /api/criteria1/vision-mission-peos
 * Query params: departmentName, criterionName, academicYear
 */
export const getVisionMissionPEOs = async (req, res) => {
  try {
    const { departmentName, criterionName, academicYear } = req.query;

    let query =
      "SELECT * FROM vision_mission_peos WHERE 1=1";
    let params = [];

    if (departmentName) {
      query += " AND department_name = ?";
      params.push(departmentName);
    }

    if (criterionName) {
      query += " AND criterion_name = ?";
      params.push(criterionName);
    }

    if (academicYear) {
      query += " AND academic_year = ?";
      params.push(academicYear);
    }

    query += " ORDER BY department_name, criterion_name, created_at DESC";

    const connection = await pool.getConnection();
    const [data] = await connection.query(query, params);
    connection.release();

    res.json({
      success: true,
      data,
      message: "Data fetched successfully",
    });
  } catch (error) {
    console.error("Error fetching vision mission PEOs:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch data",
      error: error.message,
    });
  }
};

/**
 * Get entries grouped by department
 * GET /api/criteria1/vision-mission-peos/by-department
 */
export const getVisionMissionPEOsByDepartment = async (req, res) => {
  try {
    const { academicYear } = req.query;

    let query = `
      SELECT 
        department_name,
        criterion_name,
        GROUP_CONCAT(id) as ids,
        COUNT(*) as count
      FROM vision_mission_peos
      WHERE 1=1
    `;
    let params = [];

    if (academicYear) {
      query += " AND academic_year = ?";
      params.push(academicYear);
    }

    query +=
      " GROUP BY department_name, criterion_name ORDER BY department_name";

    const connection = await pool.getConnection();
    const [data] = await connection.query(query, params);
    connection.release();

    res.json({
      success: true,
      data,
      message: "Data fetched successfully",
    });
  } catch (error) {
    console.error("Error fetching vision mission PEOs by department:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch data",
      error: error.message,
    });
  }
};

/**
 * Get single entry by ID
 * GET /api/criteria1/vision-mission-peos/:id
 */
export const getVisionMissionPEOsById = async (req, res) => {
  try {
    const { id } = req.params;

    const connection = await pool.getConnection();
    const [data] = await connection.query(
      "SELECT * FROM vision_mission_peos WHERE id = ?",
      [id]
    );
    connection.release();

    if (!data || data.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Entry not found",
      });
    }

    res.json({
      success: true,
      data: data[0],
      message: "Entry fetched successfully",
    });
  } catch (error) {
    console.error("Error fetching vision mission PEOs by ID:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch entry",
      error: error.message,
    });
  }
};

/**
 * Delete an entry
 * DELETE /api/criteria1/vision-mission-peos/:id
 */
export const deleteVisionMissionPEOs = async (req, res) => {
  try {
    const { id } = req.params;

    const connection = await pool.getConnection();

    // Get the entry to find image file
    const [entry] = await connection.query(
      "SELECT image_url FROM vision_mission_peos WHERE id = ?",
      [id]
    );

    if (entry && entry.length > 0 && entry[0].image_url) {
      // Delete image file
      const filePath = path.join(__dirname, "..", entry[0].image_url);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    // Delete database entry
    await connection.query(
      "DELETE FROM vision_mission_peos WHERE id = ?",
      [id]
    );
    connection.release();

    res.json({
      success: true,
      message: "Entry deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting vision mission PEOs:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete entry",
      error: error.message,
    });
  }
};

/**
 * Get all unique departments
 * GET /api/criteria1/departments
 */
export const getDepartments = async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [departments] = await connection.query(
      "SELECT DISTINCT department_name FROM vision_mission_peos ORDER BY department_name"
    );
    connection.release();

    res.json({
      success: true,
      data: departments,
      message: "Departments fetched successfully",
    });
  } catch (error) {
    console.error("Error fetching departments:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch departments",
      error: error.message,
    });
  }
};
