import express from 'express';
import db from '../db/database.js';

const router = express.Router();

// GET /api/user/profile — Return current student/user profile
router.get('/user/profile', (req, res) => {
  try {
    const userStmt = db.prepare('SELECT * FROM users LIMIT 1');
    const user = userStmt.get();
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({
      name: user.name,
      initials: user.initials,
      room: user.room,
      block: user.block,
      floor: user.floor,
      rollNumber: user.roll_number,
      email: user.email,
      phone: user.phone,
      role: user.role,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/login — Login / switch role
router.post('/auth/login', (req, res) => {
  try {
    const { role = 'student' } = req.body;
    res.json({
      success: true,
      role,
      token: `mock-jwt-token-${role}-${Date.now()}`,
      message: `Logged in as ${role}`,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
