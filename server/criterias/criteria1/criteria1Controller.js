import pool from "../../db.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SERVER_ROOT = path.resolve(__dirname, "../..");
const UPLOAD_DIR = path.join(SERVER_ROOT, "uploads", "criteria1");
const IMAGE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg", ".bmp"]);

// Ensure uploads directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const getDefaultAcademicYear = () => {
  const year = new Date().getFullYear();
  return `${year}-${String(year + 1).slice(-2)}`;
};

const sanitizeSegment = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "entry";

const isStoredCriteriaFile = (value) =>
  typeof value === "string" && value.startsWith("/uploads/criteria1/");

const resolveStoredFilePath = (value) =>
  path.join(SERVER_ROOT, String(value || "").replace(/^\//, ""));

const removeStoredFile = (value) => {
  if (!isStoredCriteriaFile(value)) {
    return;
  }

  const filePath = resolveStoredFilePath(value);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
};

const writeTextFile = ({ departmentName, criterionName, academicYear, contentText }) => {
  const normalizedText = String(contentText || "").trim();
  if (!normalizedText) {
    return null;
  }

  const fileName = `${sanitizeSegment(departmentName)}_${sanitizeSegment(criterionName)}_${sanitizeSegment(academicYear)}_${Date.now()}.txt`;
  const relativePath = `/uploads/criteria1/${fileName}`;
  fs.writeFileSync(resolveStoredFilePath(relativePath), normalizedText, "utf8");
  return relativePath;
};

const writeAttachmentFile = ({ departmentName, criterionName, academicYear, file }) => {
  if (!file) {
    return null;
  }

  const originalExtension = path.extname(file.originalname || "") || ".bin";
  const fileName = `${sanitizeSegment(departmentName)}_${sanitizeSegment(criterionName)}_${sanitizeSegment(academicYear)}_${Date.now()}${originalExtension}`;
  const relativePath = `/uploads/criteria1/${fileName}`;
  fs.writeFileSync(resolveStoredFilePath(relativePath), file.buffer);
  return relativePath;
};

const readStoredText = (value) => {
  if (!isStoredCriteriaFile(value) || path.extname(value).toLowerCase() !== ".txt") {
    return value || "";
  }

  const filePath = resolveStoredFilePath(value);
  if (!fs.existsSync(filePath)) {
    return "";
  }

  return fs.readFileSync(filePath, "utf8");
};

const getAttachmentKind = (value) => {
  const extension = path.extname(String(value || "")).toLowerCase();
  return IMAGE_EXTENSIONS.has(extension) ? "image" : "file";
};

const mapEntry = (row) => ({
  id: row.id,
  program_id: row.department_id,
  department_name: row.department_name,
  criterion_name: row.criterion_code,
  criterion_title: row.criterion_title,
  content_text: readStoredText(row.content),
  content_file_url:
    isStoredCriteriaFile(row.content) && path.extname(row.content).toLowerCase() === ".txt"
      ? row.content
      : null,
  attachment_url: row.file_url || null,
  attachment_name: row.file_url ? path.basename(row.file_url) : null,
  attachment_kind: row.file_url ? getAttachmentKind(row.file_url) : null,
  updated_at: row.created_at,
});

/**
 * Create a new vision, mission, or PEOs entry
 * POST /api/criteria1/vision-mission-peos
 */
export const createVisionMissionPEOs = async (req, res) => {
  let connection;

  try {
    const uploadedFile =
      req.file ||
      req.files?.attachment?.[0] ||
      req.files?.file?.[0] ||
      null;

    const {
      programId,
      departmentName,
      criterionName,
      contentText,
      imageAltText,
      academicYear,
      createdBy,
    } = req.body;
    const normalizedAcademicYear = String(academicYear || "").trim() || getDefaultAcademicYear();
    const normalizedText = String(contentText || "").trim();

    // Validate required fields
    if (!programId || !departmentName || !criterionName) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: programId, departmentName, criterionName",
      });
    }

    if (!normalizedText && !uploadedFile) {
      return res.status(400).json({
        success: false,
        message: "Provide text content or upload a file",
      });
    }

    connection = await pool.getConnection();

    const [criteriaRows] = await connection.query(
      "SELECT id, code FROM criteria WHERE code = ? LIMIT 1",
      [criterionName],
    );

    if (!criteriaRows || criteriaRows.length === 0) {
      return res.status(400).json({
        success: false,
        message: `Invalid criterion code: ${criterionName}`,
      });
    }

    const criteriaId = criteriaRows[0].id;

    // Check if entry already exists for this program and criterion
    const [existing] = await connection.query(
      `SELECT id, content, file_url
       FROM department_criteria_content
       WHERE department_id = ? AND criteria_id = ?
       ORDER BY id DESC
       LIMIT 1`,
      [programId, criteriaId],
    );

    const existingEntry = existing && existing.length > 0 ? existing[0] : null;
    let storedTextPath = null;
    let storedAttachmentPath = null;

    if (normalizedText) {
      removeStoredFile(existingEntry?.content);
      storedTextPath = writeTextFile({
        departmentName,
        criterionName,
        academicYear: normalizedAcademicYear,
        contentText: normalizedText,
      });
    }

    if (uploadedFile) {
      removeStoredFile(existingEntry?.file_url);
      storedAttachmentPath = writeAttachmentFile({
        departmentName,
        criterionName,
        academicYear: normalizedAcademicYear,
        file: uploadedFile,
      });
    }

    let query;
    let params;

    if (existingEntry) {
      // Update existing entry
      query = `
        UPDATE department_criteria_content 
        SET content_type = ?,
            content = ?, 
            file_url = ?
        WHERE id = ?
      `;
      params = [
        storedAttachmentPath ? "mixed" : "text",
        storedTextPath || existingEntry.content,
        storedAttachmentPath || existingEntry.file_url,
        existingEntry.id,
      ];
    } else {
      // Create new entry
      query = `
        INSERT INTO department_criteria_content 
        (department_id, criteria_id, content_type, content, file_url)
        VALUES (?, ?, ?, ?, ?)
      `;
      params = [
        programId,
        criteriaId,
        storedAttachmentPath ? "mixed" : "text",
        storedTextPath,
        storedAttachmentPath,
      ];
    }

    await connection.query(query, params);

    res.json({
      success: true,
      message: existingEntry ? "Entry updated successfully" : "Entry created successfully",
      textStoredAsFile: Boolean(storedTextPath),
      attachmentUrl: storedAttachmentPath || existingEntry?.image_url || null,
    });
  } catch (error) {
    console.error("Error creating/updating vision mission PEOs:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create/update entry",
      error: error.message,
    });
  } finally {
    connection?.release();
  }
};

/**
 * Get all vision, mission, PEOs entries with filtering
 * GET /api/criteria1/vision-mission-peos
 * Query params: departmentName, criterionName, academicYear
 */
export const getVisionMissionPEOs = async (req, res) => {
  let connection;

  try {
    const { departmentName, criterionName, academicYear } = req.query;

    let query = `
      SELECT 
        dcc.id,
        dcc.department_id,
        ap.department_name,
        c.code as criterion_code,
        c.title as criterion_title,
        dcc.content,
        dcc.file_url,
        dcc.created_at
      FROM department_criteria_content dcc
      INNER JOIN criteria c ON c.id = dcc.criteria_id
      LEFT JOIN all_program ap ON ap.id = dcc.department_id
      WHERE 1=1
    `;
    let params = [];

    if (departmentName) {
      query += " AND ap.department_name = ?";
      params.push(departmentName);
    }

    if (criterionName) {
      query += " AND c.code = ?";
      params.push(criterionName);
    }

    query += " ORDER BY ap.department_name, c.code, dcc.created_at DESC";

    connection = await pool.getConnection();
    const [data] = await connection.query(query, params);

    res.json({
      success: true,
      data: data.map(mapEntry),
      message: "Data fetched successfully",
    });
  } catch (error) {
    console.error("Error fetching vision mission PEOs:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch data",
      error: error.message,
    });
  } finally {
    connection?.release();
  }
};

/**
 * Get entries grouped by department
 * GET /api/criteria1/vision-mission-peos/by-department
 */
export const getVisionMissionPEOsByDepartment = async (req, res) => {
  let connection;

  try {
    let query = `
      SELECT 
        ap.department_name,
        c.code as criterion_code,
        GROUP_CONCAT(dcc.id) as ids,
        COUNT(*) as count
      FROM department_criteria_content dcc
      INNER JOIN criteria c ON c.id = dcc.criteria_id
      LEFT JOIN all_program ap ON ap.id = dcc.department_id
      WHERE 1=1
    `;
    let params = [];

    query +=
      " GROUP BY ap.department_name, c.code ORDER BY ap.department_name";

    connection = await pool.getConnection();
    const [data] = await connection.query(query, params);

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
  } finally {
    connection?.release();
  }
};

/**
 * Get single entry by ID
 * GET /api/criteria1/vision-mission-peos/:id
 */
export const getVisionMissionPEOsById = async (req, res) => {
  let connection;

  try {
    const { id } = req.params;

    connection = await pool.getConnection();
    const [data] = await connection.query(
      `SELECT 
        dcc.id,
        dcc.department_id,
        ap.department_name,
        c.code as criterion_code,
        c.title as criterion_title,
        dcc.content,
        dcc.file_url,
        dcc.created_at
      FROM department_criteria_content dcc
      INNER JOIN criteria c ON c.id = dcc.criteria_id
      LEFT JOIN all_program ap ON ap.id = dcc.department_id
      WHERE dcc.id = ?`,
      [id]
    );

    if (!data || data.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Entry not found",
      });
    }

    res.json({
      success: true,
      data: mapEntry(data[0]),
      message: "Entry fetched successfully",
    });
  } catch (error) {
    console.error("Error fetching vision mission PEOs by ID:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch entry",
      error: error.message,
    });
  } finally {
    connection?.release();
  }
};

/**
 * Delete an entry
 * DELETE /api/criteria1/vision-mission-peos/:id
 */
export const deleteVisionMissionPEOs = async (req, res) => {
  let connection;

  try {
    const { id } = req.params;

    connection = await pool.getConnection();

    // Get the entry to find stored files
    const [entry] = await connection.query(
      "SELECT content, file_url FROM department_criteria_content WHERE id = ?",
      [id]
    );

    if (entry && entry.length > 0) {
      removeStoredFile(entry[0].content);
      removeStoredFile(entry[0].file_url);
    }

    // Delete database entry
    await connection.query(
      "DELETE FROM department_criteria_content WHERE id = ?",
      [id]
    );

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
  } finally {
    connection?.release();
  }
};

/**
 * Get all unique departments
 * GET /api/criteria1/departments
 */
export const getDepartments = async (req, res) => {
  let connection;

  try {
    connection = await pool.getConnection();
    const [departments] = await connection.query(
      `SELECT DISTINCT department_name
       FROM all_program
       WHERE department_name IS NOT NULL AND department_name != ''
       ORDER BY department_name`
    );

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
  } finally {
    connection?.release();
  }
};
