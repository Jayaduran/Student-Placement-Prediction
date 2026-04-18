const Admin = require('../models/Admin');
const Student = require('../models/Student');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const defaultFrontendUrl = process.env.NODE_ENV === 'production'
  ? 'https://student-placement-prediction-seven.vercel.app'
  : 'http://localhost:5173';

const frontendBaseUrl = (process.env.FRONTEND_URLS || process.env.FRONTEND_URL || defaultFrontendUrl)
  .split(',')
  .map((origin) => origin.trim())
  .find(Boolean);

exports.register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    const normalizedRole = role === 'admin' ? 'admin' : 'student';
    const [adminUser, studentUser] = await Promise.all([
      Admin.findOne({ email }),
      Student.findOne({ email })
    ]);

    if (adminUser || studentUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const UserModel = normalizedRole === 'admin' ? Admin : Student;
    const user = new UserModel({
      name,
      email,
      password: hashedPassword,
      role: normalizedRole
    });

    await user.save();
    
    res.status(201).json({ message: 'User created successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await Admin.findOne({ email }) || await Student.findOne({ email });
    if (!user) return res.status(400).json({ error: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET || 'secretkey123', { expiresIn: '1d' });
    res.json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.oauthCallback = (req, res) => {
  if (!req.user) {
    return res.redirect(`${frontendBaseUrl}/login?error=true`);
  }
  const token = jwt.sign({ id: req.user._id, role: req.user.role }, process.env.JWT_SECRET || 'secretkey123', { expiresIn: '1d' });
  // Redirect to frontend with token
  res.redirect(`${frontendBaseUrl}/oauth-success?token=${token}`);
};

exports.getMe = async (req, res) => {
  try {
    const user = req.user.role === 'admin'
      ? await Admin.findById(req.user.id)
      : await Student.findById(req.user.id);

    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.simulateOAuth = async (req, res) => {
  try {
    let user = await Student.findOne({ email: 'demo@google.com' });
    if (!user) {
      user = new Student({
        name: 'Alex Developer',
        email: 'demo@google.com',
        password: 'oauth_simulated',
        role: 'student'
      });
      await user.save();
    }
    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET || 'secretkey123', { expiresIn: '1d' });
    res.redirect(`${frontendBaseUrl}/oauth-success?token=${token}`);
  } catch (err) {
    res.redirect(`${frontendBaseUrl}/login?error=simulated_auth_failed`);
  }
};
