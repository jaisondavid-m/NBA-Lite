import pool from "../db.js";

export const getAllPrograms = async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [programs] = await connection.query(
      "SELECT id, department_name as programName FROM all_program ORDER BY department_name"
    );
    connection.release();

    if (!programs || programs.length === 0) {
      return res.json({
        success: true,
        data: [],
        message: "No programs found",
      });
    }

    res.json({
      success: true,
      data: programs,
      message: "Programs fetched successfully",
    });
  } catch (error) {
    console.error("Error fetching programs:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch programs",
      error: error.message,
    });
  }
};
