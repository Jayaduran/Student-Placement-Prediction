require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const passport = require('./config/passport');

const authRoutes = require('./routes/authRoutes');
const profileRoutes = require('./routes/profileRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();

const isProduction = process.env.NODE_ENV === 'production';

const sanitizeMongoUri = (value) => {
  if (typeof value !== 'string') return value;
  if (!/^mongodb(\+srv)?:\/\//i.test(value)) return value;

  const schemeEndIndex = value.indexOf('//');
  const authority = value.slice(schemeEndIndex + 2);
  const separatorIndex = authority.lastIndexOf('@');

  if (separatorIndex === -1) return value;

  const authPart = authority.slice(0, separatorIndex).replace(/@/g, '%40');
  const hostPart = authority.slice(separatorIndex + 1);

  return `${value.slice(0, schemeEndIndex + 2)}${authPart}@${hostPart}`;
};

const mongoEnvValue = process.env.MONGO_URI || process.env.MONGO_URL;
const mongoUri = sanitizeMongoUri(mongoEnvValue);

const fallbackOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://placement-prediction-git-main-jayadurans-projects.vercel.app',
  'https://placement-prediction-bmpjebrra-jayadurans-projects.vercel.app',
  'https://placement-prediction.vercel.app',
  'https://placement-prediction-eogpnn2q9-jayadurans-projects.vercel.app',
  'https://placement-prediction-theta.vercel.app'
];

const configuredOrigins = (process.env.FRONTEND_URLS || process.env.FRONTEND_URL || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const allowedOrigins = Array.from(new Set([...fallbackOrigins, ...configuredOrigins]));

const isAllowedVercelPreview = (origin) => (
  /^https:\/\/placement-prediction-[a-z0-9-]+-jayadurans-projects\.vercel\.app$/i.test(origin)
);

/* =========================
   🔥 FIXED CORS
========================= */
const corsOptions = {
  origin: (origin, callback) => {
    console.log('Request from origin:', origin); // 🔥 DEBUG

    if (!origin || allowedOrigins.includes(origin) || isAllowedVercelPreview(origin)) {
      return callback(null, true);
    }
    return callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true,
};

app.set('trust proxy', 1);

/* 🔥 IMPORTANT ORDER */
app.use(cors(corsOptions));
app.options(/.*/, cors(corsOptions)); // Express 5-safe preflight matcher

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* =========================
   🔥 SESSION FIX
========================= */
const sessionConfig = {
  secret: process.env.SESSION_SECRET || 'fallback_secret',
  resave: false,
  saveUninitialized: false,
  proxy: true, // 🔥 FIXED
  cookie: {
    secure: true,          // 🔥 FORCE TRUE (Render uses HTTPS)
    sameSite: 'none',      // 🔥 REQUIRED for Vercel ↔ Render
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24,
  },
};

if (mongoEnvValue) {
  sessionConfig.store = MongoStore.create({
    mongoUrl: mongoUri,
    collectionName: 'sessions',
  });
}

app.use(session(sessionConfig));

app.use(passport.initialize());
app.use(passport.session());

app.get('/', (req, res) => {
  res.json({ message: 'Service live', status: 'ok' });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'API is running' });
});

const rateLimit = require('express-rate-limit');

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 150,
  message: { error: 'Too many requests from this IP, please try again after 15 minutes' },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', apiLimiter);

app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/admin', adminRoutes);

/* =========================
   ERROR HANDLER
========================= */
app.use((err, req, res, next) => {
  console.error('[System Error]:', err.stack);
  res.status(err.status || 500).json({
    error: 'An unexpected internal error occurred.',
    details: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

const PORT = process.env.PORT || 5000;

/* =========================
   🔥 FIXED DB CONNECTION
========================= */
const isValidMongoUri = (value) => typeof value === 'string' && /^mongodb(\+srv)?:\/\//i.test(value);

const startServer = async () => {
  if (!mongoUri) {
    console.log('❌ Mongo URI missing. Set MONGO_URI (preferred) or MONGO_URL in deployment ENV.');
    process.exit(1); // 🔥 STOP using in-memory DB
  }

  if (!isValidMongoUri(mongoUri)) {
    console.log('❌ MONGO_URI is invalid. It must start with mongodb:// or mongodb+srv://');
    process.exit(1);
  }

  mongoose.connect(mongoUri)
    .then(() => {
      console.log('MongoDB Connected ✅');
      app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
    })
    .catch(err => console.log(err));
};

startServer();