const express = require("express");
const router = express.Router();
const notificationController = require("../controllers/notificationController");

router.get("/:employee_id/unread", notificationController.getUnreadNotifications);
router.get("/:employee_id/count", notificationController.getUnreadCount);
router.put("/:notification_id/read", notificationController.markAsRead);
router.put("/:employee_id/read-all", notificationController.markAllAsRead);

module.exports = router;