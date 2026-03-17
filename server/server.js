const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
require("dotenv").config();

const authRoutes = require("./auth/authRoutes");
const instituteRoutes = require("./institute/instituteRoutes");
const alliedCourseRoutes = require("./alliedCourse/alliedCourseRoutes");
const facultyRoutes = require("./faculty/facultyRoutes");
const intakeRoutes = require("./intake/intakeRoutes");
const studentByDepartmentRoutes = require("./studentByDepartment/studentByDepartmentRoutes");
const ratioByDepartmentRoutes = require("./ratio/ratioByDepartmentRoutes");

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests from localhost on any port (for development)
      // Also allow requests with no origin (like mobile apps, curl, postman)
      if (!origin || /^http:\/\/localhost:\d+$/.test(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  }),
);
app.use(express.json());
app.use(cookieParser());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/institute", instituteRoutes);
app.use("/api/allied-course", alliedCourseRoutes);
app.use("/api/faculty", facultyRoutes);
app.use("/api/intake", intakeRoutes);
app.use("/api/student-by-department", studentByDepartmentRoutes);
app.use("/api/ratio", ratioByDepartmentRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "OK", message: "Server is running" });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
