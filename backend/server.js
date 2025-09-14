const express = require("express");
const cors = require("cors");
const initializeDatabase = require("./config/init_db");
const app = express();
const userRoutes = require("./routes/userRoutes");
const adminRoutes = require("./routes/adminRoutes");

// Allow cross-origin requests from your Angular app
app.use(
  cors({
    origin: "http://localhost:4200",
  })
);

// Parse JSON body requests
app.use(express.json());

initializeDatabase();

app.use("/api", adminRoutes);

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
