const express = require("express");
const router = express.Router();
const { getRatioByDepartment } = require("./ratioByDepartmentController");
const { authenticateToken, authorizeRoles } = require("../auth/authController");

router.get(
  "/department",
  authenticateToken,
  authorizeRoles("admin", "user"),
  getRatioByDepartment,
);

module.exports = router;
