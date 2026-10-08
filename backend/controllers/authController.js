const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'hostel_asset_management_jwt_secret_mwt_2026';

const generateToken = (id) => {
  return jwt.sign({ id }, JWT_SECRET, { expiresIn: '30d' });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res, next) => {
  try {
    const { name, email, password, role, hostelBlock, roomNumber, phone, studentId } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email, and password',
      });
    }

    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(email.trim())) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long',
      });
    }

    const cleanEmail = email.toLowerCase().trim();
    const userExists = await User.findOne({ email: cleanEmail });
    if (userExists) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email address already exists',
      });
    }

    const assignedRole = role === 'admin' ? 'admin' : 'student';

    const user = await User.create({
      name: name.trim(),
      email: cleanEmail,
      password,
      role: assignedRole,
      hostelBlock: hostelBlock || 'Block A',
      roomNumber: roomNumber || '101',
      phone: phone || '',
      studentId: studentId || '',
    });

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        hostelBlock: user.hostelBlock,
        roomNumber: user.roomNumber,
        phone: user.phone,
        studentId: user.studentId,
      },
      message: 'Registration successful',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password',
      });
    }

    const cleanEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: cleanEmail }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    const token = generateToken(user._id);

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        hostelBlock: user.hostelBlock,
        roomNumber: user.roomNumber,
        phone: user.phone,
        studentId: user.studentId,
      },
      message: 'Login successful',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    res.json({
      success: true,
      user,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Logout user (Session invalidation acknowledgment)
// @route   POST /api/auth/logout
// @access  Private
const logout = async (req, res) => {
  res.json({
    success: true,
    message: 'User logged out successfully',
  });
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('+password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.name = req.body.name || user.name;
    user.hostelBlock = req.body.hostelBlock || user.hostelBlock;
    user.roomNumber = req.body.roomNumber || user.roomNumber;
    user.phone = req.body.phone !== undefined ? req.body.phone : user.phone;
    user.studentId = req.body.studentId !== undefined ? req.body.studentId : user.studentId;

    if (req.body.password) {
      user.password = req.body.password;
    }

    await user.save();

    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        hostelBlock: user.hostelBlock,
        roomNumber: user.roomNumber,
        phone: user.phone,
        studentId: user.studentId,
      },
      message: 'Profile updated successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Authenticate or register user with Google OAuth ID token
// @route   POST /api/auth/google
// @access  Public
const googleAuth = async (req, res, next) => {
  try {
    const { credential, userInfo } = req.body;

    if (!credential) {
      return res.status(400).json({
        success: false,
        message: 'Google credential token is required',
      });
    }

    let payload = null;
    const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;

    // Handle Mock/Demo Google credentials (useful for testing or before configuring Google Cloud console)
    if (typeof credential === 'string' && credential.startsWith('mock-google-token:')) {
      const demoEmail = credential.split(':')[1] || 'google.student@hostel.edu';
      const demoName = userInfo?.name || (demoEmail.split('@')[0].charAt(0).toUpperCase() + demoEmail.split('@')[0].slice(1));
      payload = {
        email: demoEmail,
        name: demoName,
        sub: 'mock_gid_' + Math.abs(demoEmail.split('').reduce((a, b) => ((a << 5) - a) + b.charCodeAt(0), 0)),
        picture: userInfo?.picture || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
      };
    } else {
      // Official Google ID Token verification
      try {
        if (GOOGLE_CLIENT_ID && GOOGLE_CLIENT_ID !== 'your_google_client_id_here.apps.googleusercontent.com') {
          const client = new OAuth2Client(GOOGLE_CLIENT_ID);
          const ticket = await client.verifyIdToken({
            idToken: credential,
            audience: GOOGLE_CLIENT_ID,
          });
          payload = ticket.getPayload();
        } else {
          // If backend GOOGLE_CLIENT_ID is not configured in .env, verify against Google's public tokeninfo
          const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`);
          if (!response.ok) {
            const errBody = await response.json().catch(() => ({}));
            throw new Error(errBody.error_description || 'Token verification failed with Google');
          }
          payload = await response.json();
        }
      } catch (verifyError) {
        return res.status(401).json({
          success: false,
          message: 'Google token verification failed: ' + (verifyError.message || 'Invalid token'),
        });
      }
    }

    if (!payload || !payload.email) {
      return res.status(400).json({
        success: false,
        message: 'Could not extract valid profile information from Google account',
      });
    }

    const cleanEmail = payload.email.toLowerCase().trim();
    const googleId = payload.sub;
    const avatar = payload.picture || '';
    const name = payload.name || cleanEmail.split('@')[0];

    // Find existing user by email
    let user = await User.findOne({ email: cleanEmail });

    if (user) {
      let changed = false;
      if (!user.googleId) {
        user.googleId = googleId;
        changed = true;
      }
      if (!user.avatar && avatar) {
        user.avatar = avatar;
        changed = true;
      }
      if (user.authProvider !== 'google' && !user.authProvider) {
        user.authProvider = 'google';
        changed = true;
      }
      if (changed) {
        await user.save();
      }
    } else {
      // Auto-register new student resident
      user = await User.create({
        name,
        email: cleanEmail,
        googleId,
        avatar,
        authProvider: 'google',
        role: 'student',
        hostelBlock: 'Block A',
        roomNumber: '101',
        phone: '',
        studentId: 'STU-' + Math.floor(1000 + Math.random() * 9000),
      });
    }

    const token = generateToken(user._id);

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        hostelBlock: user.hostelBlock,
        roomNumber: user.roomNumber,
        phone: user.phone || '',
        studentId: user.studentId || '',
        avatar: user.avatar || '',
        authProvider: user.authProvider || 'google',
      },
      message: 'Google authentication successful',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  getMe,
  logout,
  updateProfile,
  googleAuth,
};
