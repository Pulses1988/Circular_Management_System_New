const express = require("express");
const cors = require("cors");
const initializeDatabase = require("./config/init_db");
const { Server } = require("socket.io");
const http = require("http");

require("./rules/circularRules");
const app = express();
const server = http.createServer(app);
const subscribedCircularRooms = new Set();
const auditRoutes = require("./routes/auditRoutes");

// const io = new Server(server, {
//   cors: {
//     origin: ["http://localhost:4200", "http://192.168.1.11:4200", "http://192.168.1.10:4200"],
//     methods: ["GET", "POST"],
//     credentials: true
//   },
const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:4200",
      "http://192.168.1.11:4200",
      "http://192.168.1.10:4200",
      "http://localhost:8080",
      "http://127.0.0.1:8080",
      "http://192.168.1.3:8080",
      "http://192.168.1.8:4200",

      "http://192.168.1.8:4200"
    ],
    methods: ["GET", "POST"],
    credentials: true
  },
  transports: ['websocket', 'polling'], // Allow both transports
  allowEIO3: true, // Allow older clients
  pingTimeout: 60000,
  pingInterval: 25000
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

const recurrenceRoutes =require("./routes/recurrenceRoutes");

const hoAssignmentRoutes = require("./routes/hoAssignmentRoute");

const sourceTypeRoutes = require("./routes/sourceTypesRoutes");
const circularApprovalRoutes = require("./routes/CircularApprovalsRoutes");
const repeatCycleRoutes = require("./routes/repeatCycleRoutes");
const circularVisibilityRoutes = require("./routes/circularVisibilityRoutes");
const circularTrackingRouter = require('./routes/circularTrackingRouter');
const circularChatRoutes = require("./routes/circularChatRoutes");
const circularAttachmentRoutes = require("./routes/circularAttachmentRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const circularCompletionRoutes = require("./routes/circularCompletionRoutes");
const cron = require('node-cron');
const circularRecurrenceController = require("./controllers/circularRecurrenceController");
const circularRecurrenceRoutes = require("./routes/circularRecurrenceRoutes");
const settingsRoutes = require("./routes/settingsRoutes");
const circularReminderService = require("./services/circularReminderService");
const circularReadReminderService = require('./services/circularReadReminderService');
const recurrenceService = require("./services/recurrenceService");
const ruleExecutionRoutes = require("./routes/ruleExecutionRoutes");

//Higher authority Controller
const higherAuthorityRoutes =require("./routes/higherAuthorityRoutes");
//Rule Engine Route
const ruleEngineRoutes = require("./routes/ruleEngineRoutes");
//register route 
const regionRoutes = require("./routes/regionRoutes");

//ROute for Zone 
const zoneRoutes = require("./routes/zoneRoutes");  

//Route for circle
const circleRoutes =require("./routes/circleRoutes");

//ROute for commitee
const committeeRoutes = require("./routes/committeeRoutes"); 
const memberTypeRoutes = require("./routes/memberTypeRoutes");


// Allow cross-origin requests from your Angular app
// app.use(
//   cors({
//     origin: ["http://localhost:4200", "http://192.168.1.11:4200"],
//     credentials: true,
//     methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
//     allowedHeaders: ["Content-Type", "Authorization"]
//   })
// ); 

// app.use(
//   cors({
//     origin: [
//       "http://localhost:4200",
//       "http://192.168.1.11:4200",
//       "http://192.168.1.10:4200",

//       // Built Angular frontend
//       "http://localhost:8080",
//       "http://127.0.0.1:8080",
//       "http://192.168.1.3:8080"
//     ],
//     credentials: true,
//     methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
//     allowedHeaders: ["Content-Type", "Authorization"]
//   })
// );
app.use(
  cors({
    origin: [
      "http://localhost:4200",
      "http://192.168.1.11:4200",
      "http://192.168.1.10:4200",

      // Built Angular frontend
      "http://localhost:8080",
      "http://127.0.0.1:8080",
      "http://192.168.1.3:8080",
      "http://192.168.1.8:8080"
    ],
    origin: (origin, callback) => callback(null, true),
    allowedHeaders: [
      "Content-Type", 
      "Authorization", 
      "X-Requested-With", 
      "X-Tunnel-Authorization"
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
  })
);

// Add this
app.use(express.json());

initializeDatabase(); 

const eventLogRoutes =
require("./routes/eventLogRoutes");

app.use(
    "/api/event-master",
    eventLogRoutes
);



// app.use("/api/circular", circularRoutes);




app.use(
"/api/recurrence",
recurrenceRoutes
); 


//routes for rules execution
app.use("/api", ruleExecutionRoutes); 

//routes for rule engine
app.use("/api/rule-engine", ruleEngineRoutes); 

app.use("/api/member-types", memberTypeRoutes);

// Parse JSON body requests
// app.use(express.json());

// initializeDatabase();

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
   socket.on('join-circular-chat', (circular_id) => {
    const roomName = `circular-chat-${circular_id}`;
    socket.join(roomName);
    subscribedCircularRooms.add(circular_id);
    console.log(`✅ Socket ${socket.id} joined circular chat room: ${roomName}`);
    console.log(`Total clients in room ${roomName}:`, io.sockets.adapter.rooms.get(roomName)?.size || 0);
  });

  // NEW: Leave circular chat room
  socket.on('leave-circular-chat', (circular_id) => {
    const roomName = `circular-chat-${circular_id}`;
    socket.leave(roomName);
    subscribedCircularRooms.delete(circular_id);
    console.log(`❌ Socket ${socket.id} left circular chat room: ${roomName}`);
  });

   socket.on('subscribe-notifications', (employee_id) => {
    const roomName = `notifications-${employee_id}`;
    socket.join(roomName);
    console.log(`Employee ${employee_id} subscribed to notifications`);
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

app.use("/api/ho-assignments", express.json(), hoAssignmentRoutes);

app.use("/api/source-type", express.json(), sourceTypeRoutes);
app.use("/api/circular-approvals", express.json(), circularApprovalRoutes);
app.use("/api/repeat-cycle", express.json(), repeatCycleRoutes);
app.use("/api/circular-visibility",express.json(),circularVisibilityRoutes);
app.use('/api/circular-tracking', express.json(),circularTrackingRouter);
app.use("/api/circular-chats", express.json(),circularChatRoutes);
app.use("/api/circular-attachments", circularAttachmentRoutes);
app.use("/api/notifications", express.json(), notificationRoutes);
app.use("/api/circular-completion", express.json(), circularCompletionRoutes);
app.use("/api/circular-recurrence", express.json(), circularRecurrenceRoutes); 
// Settings API
app.use("/api/settings", express.json(), settingsRoutes); 

//routes for higher authority
app.use("/api/higher-authority",higherAuthorityRoutes);

//Routes for regions //
app.use("/api/regions", regionRoutes);

//Register zone 
app.use("/api/zones", zoneRoutes);

//Register the route for circle 
app.use("/api/circle",circleRoutes);

//Route for commitee
app.use("/api/committee", committeeRoutes); 

//Route for Audit trail 
app.use("/api/audit", auditRoutes);

app.get("/api/test-reminders", async (req, res) => {
  try {
    const result = await circularReminderService.sendPendingReminders(io);

    res.status(200).json({
      message: "Reminder check completed successfully",
      sent: result.sent
    });
  } catch (error) {
    console.error("Test reminder error:", error);

    res.status(500).json({
      error: "Failed to send reminders"
    });
  }
});


cron.schedule('1 0 * * *', async () => {
  console.log('🔄 Running automated circular recurrence check...');
  try {
    const result = await circularRecurrenceController.checkAndRenewExpiredCycles();
    console.log(`✅ Renewed ${result.renewed} circular cycles`);
  } catch (error) {
    console.error('❌ Error in automated recurrence:', error);
  }
});

app.get("/", (req, res) => {
  res.send("Backend API Server is running successfully!");
});

 const PORT = 3000;
//const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Server is running on port ${PORT}`);
  console.log(`Local: http://localhost:${PORT}`);
  // console.log(`Network: http://192.168.1.11:${PORT}`);
  console.log(`Network: http://192.168.1.8:${PORT}`);
});
// setInterval(async () => {
//   await recurrenceService.processRecurringCirculars();
// }, 10000);

cron.schedule('0 0 * * *', async () => {
    await recurrenceService.processRecurringCirculars();
});

// A single sweep keeps reminders durable across restarts; it does not create a
// timer for each circular. Individual due times are calculated in SQL.
cron.schedule('* * * * *', async () => {
 
  // try {
  //   await circularReadReminderService.processDueReminders(io);
  // } catch (error) {
  //   console.error('Circular read reminder scheduler failed:', error);
  // }  
 const startTime = Date.now();

  console.log(
    '🔔 Reminder scheduler START:',
    new Date().toLocaleString()
  );

  try {
    await circularReadReminderService.processDueReminders(io);

    console.log(
      '✅ Reminder scheduler END:',
      new Date().toLocaleString(),
      '| Duration:',
      Date.now() - startTime,
      'ms'
    );

  } catch (error) {
    console.error(
      '❌ Circular read reminder scheduler failed:',
      error
    );
  }









});


module.exports = { io };
