const express = require("express");
const cors = require("cors");
const initializeDatabase = require("./config/init_db");
const app = express();
const userRoutes = require("./routes/userRoutes");
const adminRoutes = require("./routes/adminRoutes");
const headOfficeRoutes = require("./routes/headOfficeRoutes");
const branchRoutes = require("./routes/branchesRoutes");
const departmentRoutes = require("./routes/departmentRoutes");
const employeeRoutes = require("./routes/employeesRoutes");
const roleRoutes = require("./routes/roleRoutes");
const circularRoutes = require("./routes/circularRoutes");
const sourceTypeRoutes = require("./routes/sourceTypesRoutes");
const circularApprovalRoutes = require("./routes/CircularApprovalsRoutes");
const repeatCycleRoutes = require("./routes/repeatCycleRoutes");

// Allow cross-origin requests from your Angular app
app.use(
  cors({
    origin: "http://localhost:4200",
  })
);

// Parse JSON body requests
// app.use(express.json());

initializeDatabase();

app.use("/api/admins", express.json(), adminRoutes);
app.use("/api/head-office", express.json(), headOfficeRoutes);
app.use("/api/branches", express.json(), branchRoutes);
app.use("/api/departments", express.json(), departmentRoutes);
app.use("/api/employees", express.json(), employeeRoutes);
app.use("/api/roles", express.json(), roleRoutes);
app.use("/api/circular", circularRoutes);
app.use("/api/source-type", express.json(), sourceTypeRoutes);
app.use("/api/circular-approvals", express.json(), circularApprovalRoutes);
app.use("/api/repeat-cycle", express.json(), repeatCycleRoutes);

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
