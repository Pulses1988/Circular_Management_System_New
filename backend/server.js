const express = require("express");
const cors = require("cors");
const initializeDatabase = require("./config/init_db");
const { Server } = require("socket.io");
const http = require("http");


const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.set('io', io);

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
const circularVisibilityRoutes = require("./routes/circularVisibilityRoutes")

// Allow cross-origin requests from your Angular app
app.use(
  cors({
    origin: "*",
  })
);

// Parse JSON body requests
// app.use(express.json());

initializeDatabase();

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
   let currentApproverId = null;

  socket.on('subscribe-circulars', (approver_id) => {
    currentApproverId = approver_id;
    const roomName = `approver-${approver_id}`;
    console.log(`Approver ${approver_id} subscribed for circular updates`);
    socket.join(`approver-${approver_id}`);
    socket.rooms.forEach(room => {
      if (room !== socket.id && room.startsWith('approver-')) {
        socket.leave(room);
        console.log(`Left old room: ${room}`);
      }
    });
    socket.join(roomName);
    console.log(`Approver ${approver_id} (socket: ${socket.id}) joined room: ${roomName}`);
    console.log(`Total clients in room ${roomName}:`, io.sockets.adapter.rooms.get(roomName)?.size || 0);
    
    // Send confirmation back to client
    socket.emit('subscription-confirmed', { approver_id, roomName });
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
     if (currentApproverId) {
      console.log(`Approver ${currentApproverId} disconnected`);
    }
  });
});

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
app.use("/api/circular-visibility",express.json(),circularVisibilityRoutes);

const PORT = 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Server is running on port ${PORT}`);
  console.log(`Local: http://localhost:${PORT}`);
  console.log(`Network: http://192.168.1.8:${PORT}`);
});

module.exports = { io };