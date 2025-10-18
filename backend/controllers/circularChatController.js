const circularChatModel = require("../models/circularChatModel");

// ✅ Add a new chat
exports.createChat = async (req, res) => {
  try {
    const { circular_id, employee_id, message } = req.body;

    if (!circular_id || !employee_id || !message) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const chatId = await circularChatModel.createChat({ circular_id, employee_id, message });
    res.status(201).json({ message: "Chat added successfully", chat_id: chatId });
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
