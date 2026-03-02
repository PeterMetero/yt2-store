const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Joi = require('joi');
const crypto = require('crypto');
const { sendVerificationEmail } = require('../utils/emailService');

const registerSchema = Joi.object({
  name: Joi.string().trim().required(),
  email: Joi.string().trim().email().required(),
  password: Joi.string().min(6).required(),
  isAdmin: Joi.boolean().optional()
});

const loginSchema = Joi.object({
  email: Joi.string().trim().email().required(),
  password: Joi.string().required()
});

exports.register = async (req, res) => {
  try {
    // 1) Validate payload
    const { error, value } = registerSchema.validate(req.body);
    if (error) return res.status(400).json({ msg: error.details[0].message });

    // 2) Check existing user
    const existing = await User.findOne({ email: value.email });
    if (existing) return res.status(400).json({ msg: 'User exists' });

    // 3) Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(value.password, salt);

    // 4) Generate email verification token
    const emailVerificationToken = crypto.randomBytes(32).toString('hex');
    const emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

    // 5) Save user
    const user = await User.create({
      name: value.name,
      email: value.email,
      password: hashedPassword,
      isAdmin: value.isAdmin || false,
      isEmailVerified: false,
      emailVerificationToken,
      emailVerificationExpires
    });

    // 6) Send verification email
    try {
      await sendVerificationEmail(user.email, emailVerificationToken);
    } catch (emailError) {
      console.error('Email sending failed:', emailError);
      // Still create user but inform them
    }

    return res.status(201).json({ 
      msg: 'Registration successful! Please check your email to verify your account.',
      needsVerification: true 
    });

  } catch (err) {
    console.error('REGISTER ERROR:', err);
    return res.status(500).json({ msg: 'Server error' });
  }
};

exports.login = async (req, res) => {
  try {
    // 1) Validate payload
    const { error, value } = loginSchema.validate(req.body);
    if (error) return res.status(400).json({ msg: error.details[0].message });

    // 2) Find user
    const user = await User.findOne({ email: value.email });
    if (!user) return res.status(400).json({ msg: 'Invalid credentials' });

    // 3) Check if email is verified
    if (!user.isEmailVerified) {
      return res.status(403).json({ 
        msg: 'Please verify your email before logging in',
        needsVerification: true 
      });
    }

    // 4) Compare password
    const isMatch = await bcrypt.compare(value.password, user.password);
    if (!isMatch) return res.status(400).json({ msg: 'Invalid credentials' });

    // 5) Check last login (inactivity > 1 month)
    const ONE_MONTH = 30 * 24 * 60 * 60 * 1000;
    if (user.lastLoginAt && (Date.now() - user.lastLoginAt.getTime() > ONE_MONTH)) {
      return res.status(403).json({
        msg: 'You haven\'t logged in for over a month. Please reset your password for security.',
        needsReauth: true
      });
    }

    // 6) Update last login
    user.lastLoginAt = new Date();
    await user.save();

    // 7) Sign token
    const token = jwt.sign(
      { id: user.id, isAdmin: user.isAdmin },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Return user data (excluding sensitive fields)
    const userData = {
      id: user._id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt
    };

    return res.status(200).json({ token, user: userData });

  } catch (err) {
    console.error('LOGIN ERROR:', err);
    return res.status(500).json({ msg: 'Server error' });
  }
};

// Email verification endpoint
exports.verifyEmail = async (req, res) => {
  try {
    const { token } = req.query;

    const user = await User.findOne({
      emailVerificationToken: token,
      emailVerificationExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ msg: 'Invalid or expired verification token' });
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    return res.json({ msg: 'Email verified successfully! You can now log in.' });

  } catch (err) {
    console.error('VERIFY EMAIL ERROR:', err);
    return res.status(500).json({ msg: 'Server error' });
  }
};

// Get user profile
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password -emailVerificationToken -resetPasswordToken');
    if (!user) return res.status(404).json({ msg: 'User not found' });
    res.json(user);
  } catch (err) {
    console.error('GET PROFILE ERROR:', err);
    res.status(500).json({ msg: 'Server error' });
  }
};