const circularChatModel = require("../models/circularChatModel");
const notificationModel = require("../models/notificationModel");
const circularVisibilityModel = require("../models/circularVisibilityModel"); 
const db = require("../config/db");

// ✅ Add a new chat
exports.createChat = async (req, res) => {
  try {
    const { circular_id, employee_id, message } = req.body;

    if (!circular_id || !employee_id || !message) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const chatId = await circularChatModel.createChat({ circular_id, employee_id, message,is_system_message: false });
    
    // Fetch the complete chat data with employee details
    const newChatMessage = await circularChatModel.getChatById(chatId);

     newChatMessage.attachments = [];
    
    // Get Socket.IO instance
    const io = req.app.get('io');
    
    if (io) {
      // Emit to circular chat room (real-time chat update)
      const chatRoomName = `circular-chat-${circular_id}`;
      
      console.log(`Emitting to room: ${chatRoomName}`);
      console.log(`Clients in room:`, io.sockets.adapter.rooms.get(chatRoomName)?.size || 0);
      
      io.to(chatRoomName).emit('new-chat-message', {
        chat: newChatMessage,
        circular_id
      });
      
      console.log(`✅ Chat message emitted to room: ${chatRoomName}`);

      const recipientEmployees = await circularVisibilityModel.getEmployeesByCircular(circular_id);
      
      for (const recipient of recipientEmployees) {
        if (recipient.employee_id !== employee_id) {
          const notificationId = await notificationModel.createNotification({
            circular_id,
            recipient_employee_id: recipient.employee_id,
            sender_employee_id: employee_id,
            notification_type: 'message',
            message_preview: message.substring(0, 100)
          });
          
          // Emit notification via socket
          io.to(`notifications-${recipient.employee_id}`).emit('new-notification', {
            notification_id: notificationId,
            circular_id,
            sender_first_name: newChatMessage.first_name,
            sender_last_name: newChatMessage.last_name,
            notification_type: 'message',
            message_preview: message.substring(0, 100)
          });
        }
      }
    }

    res.status(201).json({ 
      message: "Chat added successfully", 
      chat_id: chatId,
      chat: newChatMessage
    });
  } catch (error) {
    console.error("Error creating chat:", error);
    res.status(500).json({ error: "Failed to create chat" });
  }
};

// ✅ Get all chats for a circular
exports.getChatsByCircular = async (req, res) => {
  try {
    const { circular_id } = req.params;
    const chats = await circularChatModel.getChatsByCircularId(circular_id);
    res.status(200).json(chats);
  } catch (error) {
    console.error("Error fetching chats:", error);
    res.status(500).json({ error: "Failed to fetch chats" });
  }
};

// ✅ Delete a chat (optional)
exports.deleteChat = async (req, res) => {
  try {
    const { chat_id } = req.params;
    await circularChatModel.deleteChat(chat_id);
    res.status(200).json({ message: "Chat deleted successfully" });
  } catch (error) {
    console.error("Error deleting chat:", error);
    res.status(500).json({ error: "Failed to delete chat" });
  }
};

exports.createSystemMessage = async (req, res) => {
  try {
    const { circular_id, employee_id, action_type } = req.body;

    if (!circular_id || !employee_id || !action_type) {
      return res.status(400).json({ error: "All fields are required" });
    }

    // Get employee details
    const [employeeRows] = await db.query(
      `SELECT first_name, last_name FROM employees WHERE id = ?`,
      [employee_id]
    );

    if (employeeRows.length === 0) {
      return res.status(404).json({ error: "Employee not found" });
    }

    const employee = employeeRows[0];
    let systemMessage = '';

    // Generate system message based on action type
    if (action_type === 'completed') {
      systemMessage = `✅ ${employee.first_name} ${employee.last_name} has marked this circular as completed and submitted compliance`;
    }

    const chatId = await circularChatModel.createChat({ 
      circular_id, 
      employee_id, 
      message: systemMessage,
      is_system_message: true 
    });
    
    const newChatMessage = await circularChatModel.getChatById(chatId);
    newChatMessage.attachments = [];
    newChatMessage.is_system_message = true; // Flag for styling
    
    const io = req.app.get('io');
    
    if (io) {
      const chatRoomName = `circular-chat-${circular_id}`;
      
      io.to(chatRoomName).emit('new-chat-message', {
        chat: newChatMessage,
        circular_id,
        is_system_message: true
      });
      
      console.log(`✅ System message emitted to room: ${chatRoomName}`);
      
      // Create notifications for all employees with access (except the one who completed)
      const recipientEmployees = await circularVisibilityModel.getEmployeesByCircular(circular_id);
      
      for (const recipient of recipientEmployees) {
        if (recipient.employee_id !== employee_id) {
          const notificationId = await notificationModel.createNotification({
            circular_id,
            recipient_employee_id: recipient.employee_id,
            sender_employee_id: employee_id,
            notification_type: 'message',
            message_preview: systemMessage
          });
          
          io.to(`notifications-${recipient.employee_id}`).emit('new-notification', {
            notification_id: notificationId,
            circular_id,
            sender_first_name: employee.first_name,
            sender_last_name: employee.last_name,
            notification_type: 'message',
            message_preview: systemMessage
          });
        }
      }
    }

    res.status(201).json({ 
      message: "System message sent successfully", 
      chat_id: chatId,
      chat: newChatMessage
    });
  } catch (error) {
    console.error("Error creating system message:", error);
    res.status(500).json({ error: "Failed to create system message" });
  }
};