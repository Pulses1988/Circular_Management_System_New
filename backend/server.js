const express = require("express");
const cors = require("cors");
const initializeDatabase = require("./config/init_db");
const app = express();
const userRoutes = require("./routes/userRoutes");
const adminRoutes = require("./routes/adminRoutes");
const headOfficeRoutes = require("./routes/headOfficeRoutes");
const branchRoutes = require("./routes/branchesRoutes");
const departmentRoutes = require("./routes/departmentRoutes")

// Allow cross-origin requests from your Angular app
app.use(
  cors({
    origin: "http://localhost:4200",
  })
);

// Parse JSON body requests
app.use(express.json());

initializeDatabase();

app.use("/api/admins", adminRoutes);
app.use("/api/head-office", headOfficeRoutes);
app.use("/api/branches", branchRoutes);
app.use("/api/departments",departmentRoutes);


const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
