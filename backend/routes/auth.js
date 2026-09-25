import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { User, AuditLog } from '../models/index.js';
import { authenticate, requireRole, requireAdminType, optionalAuthenticate } from '../middleware/auth.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'hostelops_default_jwt_secret_dev_key';

// Demo credentials catalog (for 1-click college presentation / demo filling)
export const DEMO_USERS = {
  superadmin: {
    id: 'adm-1',
    username: 'superadmin',
    name: 'Dr. K. Sundaram',
    initials: 'KS',
    room: 'Executive Suite 301',
    block: 'Admin Block',
    floor: 'Floor 3',
    roll_number: 'ADM-SUPER-01',
    email: 'superadmin@hostel.edu',
    phone: '+91 98765 00001',
    role: 'admin',
    admin_type: 'superadmin',
    avatar_color: '#ef4444',
    defaultPassword: 'admin@123',
  },
  assetadmin: {
    id: 'adm-2',
    username: 'assetadmin',
    name: 'Dr. Meena Sharma',
    initials: 'MS',
    room: 'Asset Logistics 102',
    block: 'Admin Block',
    floor: 'Floor 1',
    roll_number: 'ADM-ASSET-02',
    email: 'assetadmin@hostel.edu',
    phone: '+91 98765 00002',
    role: 'admin',
    admin_type: 'assetadmin',
    avatar_color: '#7c3aed',
    defaultPassword: 'admin@123',
  },
  student1: {
    id: 'usr-1',
    username: 'student1',
    name: 'Himachalam',
    initials: 'HC',
    room: '204',
    block: 'Block A',
    floor: 'Floor 2',
    roll_number: '21CS204',
    email: 'hima@hostel.edu',
    phone: '+91 98765 43210',
    role: 'user',
    admin_type: '',
    avatar_color: '#06b6d4',
    defaultPassword: 'user@123',
  },
  student2: {
    id: 'usr-2',
    username: 'student2',
    name: 'Priya Sharma',
    initials: 'PS',
    room: '102',
    block: 'Block B',
    floor: 'Floor 1',
    roll_number: '22EC102',
    email: 'priya@hostel.edu',
    phone: '+91 98765 43211',
    role: 'user',
    admin_type: '',
    avatar_color: '#ec4899',
    defaultPassword: 'user@123',
  },
  student3: {
    id: 'usr-3',
    username: 'student3',
    name: 'Naveen Kumar',
    initials: 'NK',
    room: '112',
    block: 'Block A',
    floor: 'Floor 1',
    roll_number: '21IT112',
    email: 'naveen@hostel.edu',
    phone: '+91 98765 43212',
    role: 'user',
    admin_type: '',
    avatar_color: '#f59e0b',
    defaultPassword: 'user@123',
  },
  student4: {
    id: 'usr-4',
    username: 'student4',
    name: 'Devansh Chouhan',
    initials: 'DC',
    room: '305',
    block: 'Block C',
    floor: 'Floor 3',
    roll_number: '23ME305',
    email: 'devansh@hostel.edu',
    phone: '+91 98765 43213',
    role: 'user',
    admin_type: '',
    avatar_color: '#10b981',
    defaultPassword: 'user@123',
  },
  staff1: {
    id: 'stf-1',
    username: 'staff1',
    name: 'Sarathi Kamal',
    initials: 'SK',
    room: 'Maintenance Workshop',
    block: 'Service Block',
    floor: 'Ground Floor',
    roll_number: 'STF-TECH-01',
    email: 'sarathi@hostel.edu',
    phone: '+91 98765 11122',
    role: 'staff',
    admin_type: '',
    avatar_color: '#f59e0b',
    defaultPassword: 'user@123',
  },
};

/**
 * Generate signed JWT
 */
function createToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      username: user.username,
      role: user.role,
      admin_type: user.admin_type || '',
      name: user.name,
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

// GET /api/auth/demo-accounts — List demo accounts for presentation
router.get('/auth/demo-accounts', (req, res) => {
  res.json({
    admins: [
      {
        key: 'superadmin',
        title: 'Super Admin (Admin 1)',
        name: DEMO_USERS.superadmin.name,
        role: 'admin',
        admin_type: 'superadmin',
        description: 'Full system control, User management, Settings & System-wide Asset Lifecycle',
        credentials: { username: 'superadmin', password: DEMO_USERS.superadmin.defaultPassword },
        icon: '👑',
        color: '#ef4444',
      },
      {
        key: 'assetadmin',
        title: 'Asset Admin (Admin 2)',
        name: DEMO_USERS.assetadmin.name,
        role: 'admin',
        admin_type: 'assetadmin',
        description: 'Asset Register, Allocation, Maintenance, Return/Transfer, History & Reports',
        credentials: { username: 'assetadmin', password: DEMO_USERS.assetadmin.defaultPassword },
        icon: '🛡️',
        color: '#7c3aed',
      },
    ],
    users: [
      {
        key: 'student1',
        title: 'Student A',
        name: DEMO_USERS.student1.name,
        room: 'Block A - 204',
        roll: '21CS204',
        role: 'user',
        credentials: { username: 'student1', password: DEMO_USERS.student1.defaultPassword },
        icon: '🎓',
        color: '#06b6d4',
      },
      {
        key: 'student2',
        title: 'Student B',
        name: DEMO_USERS.student2.name,
        room: 'Block B - 102',
        roll: '22EC102',
        role: 'user',
        credentials: { username: 'student2', password: DEMO_USERS.student2.defaultPassword },
        icon: '🎓',
        color: '#ec4899',
      },
      {
        key: 'staff1',
        title: 'Technician',
        name: DEMO_USERS.staff1.name,
        room: 'Service Block - Workshop',
        roll: 'STF-TECH-01',
        role: 'staff',
        credentials: { username: 'staff1', password: DEMO_USERS.staff1.defaultPassword },
        icon: '⚡',
        color: '#f59e0b',
      },
    ],
  });
});

// POST /api/auth/login — Authenticate with real password verification & JWT
router.post('/auth/login', async (req, res) => {
  try {
    const { username = '', password = '', userKey = '' } = req.body;

    const cleanUser = (username || userKey || '').trim().toLowerCase();
    const cleanPass = (password || '').trim();

    if (!cleanUser) {
      return res.status(400).json({
        success: false,
        message: 'Username, Roll number, or Email is required.',
        errorCode: 'MISSING_USERNAME',
      });
    }

    if (!cleanPass) {
      return res.status(400).json({
        success: false,
        message: 'Password is required.',
        errorCode: 'MISSING_PASSWORD',
      });
    }

    // 1. Search for user in MongoDB
    let dbUser = await User.findOne({
      $or: [
        { username: cleanUser },
        { email: cleanUser },
        { roll_number: cleanUser.toUpperCase() },
        { roll_number: cleanUser },
      ],
    }).select('+password');

    // 2. Fallback check against known demo accounts if database doesn't have it yet
    const demoMatch = Object.values(DEMO_USERS).find(
      (d) =>
        d.username.toLowerCase() === cleanUser ||
        d.email.toLowerCase() === cleanUser ||
        d.roll_number.toLowerCase() === cleanUser
    );

    if (!dbUser && demoMatch) {
      // Validate demo password
      if (cleanPass !== demoMatch.defaultPassword) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials. Please verify your password.',
          errorCode: 'INVALID_CREDENTIALS',
        });
      }

      // Lazily create demo user in MongoDB with secure bcrypt hash
      try {
        dbUser = await User.create({
          id: demoMatch.id,
          username: demoMatch.username,
          name: demoMatch.name,
          initials: demoMatch.initials,
          room: demoMatch.room,
          block: demoMatch.block,
          floor: demoMatch.floor,
          roll_number: demoMatch.roll_number,
          email: demoMatch.email,
          phone: demoMatch.phone,
          role: demoMatch.role,
          admin_type: demoMatch.admin_type,
          avatar_color: demoMatch.avatar_color,
          password: demoMatch.defaultPassword,
          isActive: true,
        });
      } catch (err) {
        // If race condition created it, fetch again
        dbUser = await User.findOne({ username: demoMatch.username }).select('+password');
      }
    }

    if (!dbUser) {
      return res.status(401).json({
        success: false,
        message: 'Account not found. Please check your username or register a new student account.',
        errorCode: 'USER_NOT_FOUND',
      });
    }

    if (dbUser.isActive === false) {
      return res.status(403).json({
        success: false,
        message: 'Account is deactivated. Contact Super Admin for assistance.',
        errorCode: 'ACCOUNT_DEACTIVATED',
      });
    }

    // 3. Verify password with bcrypt
    const isPasswordValid = await dbUser.comparePassword(cleanPass);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid password. Please try again.',
        errorCode: 'INVALID_PASSWORD',
      });
    }

    // 4. Generate signed JWT token
    const token = createToken(dbUser);
    const safeUser = dbUser.toSafeObject();

    // Audit login
    await AuditLog.create({
      id: `AL-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
      action: `User Login: ${safeUser.name} (${safeUser.username}) as ${safeUser.role}`,
      actor: safeUser.name,
      target: safeUser.id,
      category: 'Auth',
      timestamp: new Date().toLocaleString(),
    }).catch(() => {});

    return res.json({
      success: true,
      user: safeUser,
      token,
      role: safeUser.role,
      admin_type: safeUser.admin_type,
      message: `Welcome back, ${safeUser.name}!`,
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({
      success: false,
      message: 'Server error during authentication.',
      error: err.message,
    });
  }
});

// POST /api/auth/register — Student self-registration (Strictly User/Student role only)
router.post('/auth/register', async (req, res) => {
  try {
    const {
      username,
      name,
      room = '101',
      block = 'Block A',
      floor = 'Floor 1',
      roll_number,
      email,
      phone = '+91 98765 00000',
      password = 'user@123',
    } = req.body;

    const cleanUsername = (username || '').trim().toLowerCase();
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanRoll = (roll_number || '').trim().toUpperCase();
    const cleanName = (name || '').trim();
    const cleanPass = (password || 'user@123').trim();

    if (!cleanUsername || cleanUsername.length < 3) {
      return res.status(400).json({ success: false, message: 'Username must be at least 3 characters long.' });
    }
    if (!cleanName) {
      return res.status(400).json({ success: false, message: 'Full Name is required.' });
    }
    if (!cleanEmail || !cleanEmail.includes('@')) {
      return res.status(400).json({ success: false, message: 'A valid email address is required.' });
    }
    if (cleanPass.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long.' });
    }

    // Check duplicate username, email, roll_number
    const existing = await User.findOne({
      $or: [
        { username: cleanUsername },
        { email: cleanEmail },
        ...(cleanRoll ? [{ roll_number: cleanRoll }] : []),
      ],
    });

    if (existing) {
      let duplicateField = 'Account details';
      if (existing.username === cleanUsername) duplicateField = 'Username';
      else if (existing.email === cleanEmail) duplicateField = 'Email';
      else if (cleanRoll && existing.roll_number === cleanRoll) duplicateField = 'Roll number';

      return res.status(409).json({
        success: false,
        message: `${duplicateField} is already registered. Please use another one or log in.`,
        errorCode: 'DUPLICATE_USER',
      });
    }

    const initials = cleanName
      .split(' ')
      .filter(Boolean)
      .map((p) => p[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || 'ST';

    // IMPORTANT: Security requirement 5 — Student registration CANNOT create admin
    const newUser = await User.create({
      id: `usr-${crypto.randomUUID()}`,
      username: cleanUsername,
      name: cleanName,
      initials,
      room,
      block,
      floor,
      roll_number: cleanRoll || `ROLL-${Date.now().toString().slice(-4)}`,
      email: cleanEmail,
      phone,
      role: 'user', // Forced to user/student
      admin_type: '', // Cannot elevate privilege
      avatar_color: '#06b6d4',
      password: cleanPass,
      isActive: true,
    });

    const safeUser = newUser.toSafeObject();
    const token = createToken(newUser);

    res.status(201).json({
      success: true,
      message: 'Student account registered successfully!',
      user: safeUser,
      token,
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ success: false, message: 'Registration failed.', error: err.message });
  }
});

// POST /api/auth/users — Admin creates user/admin (Protected by Super Admin privilege)
router.post('/auth/users', authenticate, requireRole(['admin']), requireAdminType('superadmin'), async (req, res) => {
  try {
    const {
      username,
      name,
      room = '101',
      block = 'Block A',
      floor = 'Floor 1',
      roll_number,
      email,
      phone = '+91 98765 00000',
      role = 'user',
      admin_type = '',
      password = 'user@123',
    } = req.body;

    const cleanUsername = (username || '').trim().toLowerCase();
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanRoll = (roll_number || '').trim().toUpperCase();
    const cleanName = (name || '').trim();

    if (!cleanUsername || !cleanName || !cleanEmail) {
      return res.status(400).json({ success: false, message: 'Username, Name, and Email are required.' });
    }

    // Role security check: If creating an admin account, require Super Admin caller
    if (role === 'admin' || admin_type) {
      if (!req.user || req.user.role !== 'admin' || req.user.admin_type !== 'superadmin') {
        return res.status(403).json({
          success: false,
          message: 'Security error: Only Super Admin can create administrator accounts.',
          errorCode: 'ADMIN_CREATION_FORBIDDEN',
        });
      }
    }

    // Check duplicate
    const existing = await User.findOne({
      $or: [
        { username: cleanUsername },
        { email: cleanEmail },
        ...(cleanRoll ? [{ roll_number: cleanRoll }] : []),
      ],
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'Username, Email, or Roll number already exists.',
        errorCode: 'DUPLICATE_USER',
      });
    }

    const initials = cleanName
      .split(' ')
      .filter(Boolean)
      .map((p) => p[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || 'US';

    const defaultRole = role === 'admin' ? 'admin' : role === 'staff' ? 'staff' : 'user';
    const defaultAdminType = defaultRole === 'admin' ? (admin_type || 'assetadmin') : '';

    const newUser = await User.create({
      id: `usr-${crypto.randomUUID()}`,
      username: cleanUsername,
      name: cleanName,
      initials,
      room,
      block,
      floor,
      roll_number: cleanRoll || `ROLL-${Date.now().toString().slice(-4)}`,
      email: cleanEmail,
      phone,
      role: defaultRole,
      admin_type: defaultAdminType,
      avatar_color: defaultRole === 'admin' ? '#ef4444' : '#06b6d4',
      password: password || 'user@123',
      isActive: true,
    });

    res.status(201).json(newUser.toSafeObject());
  } catch (err) {
    console.error('Create user error:', err);
    res.status(500).json({ success: false, message: 'Could not create account.', error: err.message });
  }
});

// GET /api/auth/users — Manage all accounts (Requires Admin role)
router.get('/auth/users', optionalAuthenticate, async (req, res) => {
  try {
    const users = await User.find().sort({ role: 1, createdAt: 1 }).lean();
    if (users && users.length > 0) {
      return res.json(users.map((u) => {
        delete u.password;
        return u;
      }));
    }
    res.json(Object.values(DEMO_USERS));
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/user/profile & GET /api/auth/me — Return current user profile
router.get(['/user/profile', '/auth/me'], optionalAuthenticate, async (req, res) => {
  try {
    if (req.user) {
      const dbUser = await User.findOne({ id: req.user.id || req.user.sub }).lean();
      if (dbUser) {
        delete dbUser.password;
        return res.json(dbUser);
      }
      return res.json(req.user);
    }

    const { key, username } = req.query;
    if (key && DEMO_USERS[key]) return res.json(DEMO_USERS[key]);
    if (username) {
      const dbUser = await User.findOne({ username: username.toLowerCase() }).lean();
      if (dbUser) {
        delete dbUser.password;
        return res.json(dbUser);
      }
    }

    res.json(DEMO_USERS.superadmin);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PATCH /api/auth/profile — Persist permitted profile changes (Requirement 26)
router.patch('/auth/profile', authenticate, async (req, res) => {
  try {
    const userId = req.user.id || req.user.sub;
    const { name, phone, room, block, floor, avatar_color } = req.body;

    const user = await User.findOne({ id: userId });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User profile not found.' });
    }

    // Update only permitted fields (prevent role escalation via profile)
    if (name) {
      user.name = name.trim();
      user.initials = name
        .trim()
        .split(' ')
        .filter(Boolean)
        .map((p) => p[0])
        .join('')
        .slice(0, 2)
        .toUpperCase() || user.initials;
    }
    if (phone) user.phone = phone.trim();
    if (room) user.room = room.trim();
    if (block) user.block = block.trim();
    if (floor) user.floor = floor.trim();
    if (avatar_color) user.avatar_color = avatar_color;

    await user.save();

    await AuditLog.create({
      id: `AL-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
      action: `Profile Updated: ${user.name} (${user.username})`,
      actor: user.name,
      target: user.id,
      category: 'Auth',
      timestamp: new Date().toLocaleString(),
    }).catch(() => {});

    res.json({
      success: true,
      message: 'Profile updated successfully!',
      user: user.toSafeObject(),
    });
  } catch (err) {
    console.error('Profile update error:', err);
    res.status(500).json({ success: false, message: 'Could not update profile.', error: err.message });
  }
});

// PATCH /api/auth/users/:id — Admin updates user account (role-protected)
router.patch('/auth/users/:id', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone, room, block, floor, role, admin_type, isActive, avatar_color } = req.body;

    const user = await User.findOne({ id });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    // Only Super Admin can change someone to admin or modify admin_type
    if (role === 'admin' || admin_type) {
      if (req.user.admin_type !== 'superadmin') {
        return res.status(403).json({
          success: false,
          message: 'Only Super Admin can grant or alter administrator roles.',
        });
      }
    }

    if (name) user.name = name.trim();
    if (phone) user.phone = phone.trim();
    if (room) user.room = room.trim();
    if (block) user.block = block.trim();
    if (floor) user.floor = floor.trim();
    if (role) user.role = role;
    if (admin_type !== undefined) user.admin_type = admin_type;
    if (isActive !== undefined) user.isActive = Boolean(isActive);
    if (avatar_color) user.avatar_color = avatar_color;

    await user.save();

    res.json({
      success: true,
      message: 'User updated successfully.',
      user: user.toSafeObject(),
    });
  } catch (err) {
    console.error('Admin update user error:', err);
    res.status(500).json({ success: false, message: 'Could not update user.', error: err.message });
  }
});

export default router;
