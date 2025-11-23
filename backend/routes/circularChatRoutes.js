const express = require("express");
const router = express.Router();
const circularChatController = require("../controllers/circularChatController");

// POST — Create new chat message
router.post("/", circularChatController.createChat);

// GET — Fetch all chats for a circular
router.get("/:circular_id", circularChatController.getChatsByCircular);

// DELETE — Delete chat (optional)
router.delete("/:chat_id", circularChatController.deleteChat);

router.post("/system-message", circularChatController.createSystemMessage);

module.exports = router;