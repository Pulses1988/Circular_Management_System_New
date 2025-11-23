const express = require('express');
const router = express.Router();
const circularTrackingController = require('../controllers/circularTrackingController');

// Get unseen circulars for an employee
router.get('/unseen/:employeeId', circularTrackingController.getUnseenCirculars);


router.get('/seen/:employeeId', circularTrackingController.getSeenCirculars);

// Mark circular as seen
router.post('/mark-seen', circularTrackingController.markSeen);

// Mark circular as completed
router.post('/mark-completed', circularTrackingController.markCompleted);

router.get('/completion-status/:circularId/:employeeId', circularTrackingController.getCompletionStatus);

module.exports = router;
