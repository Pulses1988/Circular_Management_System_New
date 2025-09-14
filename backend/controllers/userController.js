const db = require('../config/db'); // Add this
const { fetchAllUsers } = require('../models/userModel');

async function getAllUsers(req, res) {
  try {
    const users = await fetchAllUsers();
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

async function addUser(req, res){
  const { username, email } = req.body;

  if (!username || !email) {
    return res.status(400).json({ error: 'Username and email are required' });
  }

  try {
    const [result] = await db.query(
      'INSERT INTO users (username, email) VALUES (?, ?)',
      [username, email]
    );

    res.status(201).json({
      message: 'User added successfully',
      userId: result.insertId
    });
  } catch (err) {
    console.error('Error adding user:', err); // this will show the real DB error in terminal
    res.status(500).json({ error: 'Database error' });
  }
}

module.exports = { getAllUsers, addUser };
