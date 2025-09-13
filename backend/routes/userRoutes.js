const express = require('express');
const { getAllUsers, addUser } = require('../controllers/userController');
const router = express.Router();

router.get('/', getAllUsers);
router.post('/users',addUser);

module.exports = router;
