const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const Admin = require('../models/Admin');
const Student = require('../models/Student');

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await Student.findById(id) || await Admin.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

// Google Strategy
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID || 'dummy_id',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'dummy_secret',
    callbackURL: "/api/auth/google/callback"
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      // Check if user exists
      let user = await Student.findOne({ googleId: profile.id });
      if (user) return done(null, user);

      // Check if email exists
      const email = profile.emails && profile.emails[0]?.value;
      if (email) {
        user = await Student.findOne({ email });
        if (user) {
          user.googleId = profile.id;
          await user.save();
          return done(null, user);
        }
      }

      // Create new user
      user = new Student({
        name: profile.displayName,
        email: email || `${profile.id}@google.com`,
        password: 'oauth_user', // Dummy password, won't be used since logic checks password match, we can skip password check for oauth users but we rely on simple jwt
        role: 'student',
        googleId: profile.id
      });
      await user.save();
      done(null, user);
    } catch (err) {
      done(err, null);
    }
  }
));

// Facebook Strategy
passport.use(new FacebookStrategy({
    clientID: process.env.FACEBOOK_APP_ID || 'dummy_id',
    clientSecret: process.env.FACEBOOK_APP_SECRET || 'dummy_secret',
    callbackURL: "/api/auth/facebook/callback",
    profileFields: ['id', 'displayName', 'emails']
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      let user = await Student.findOne({ facebookId: profile.id });
      if (user) return done(null, user);

      const email = profile.emails && profile.emails[0]?.value;
      if (email) {
        user = await Student.findOne({ email });
        if (user) {
          user.facebookId = profile.id;
          await user.save();
          return done(null, user);
        }
      }

      user = new Student({
        name: profile.displayName,
        email: email || `${profile.id}@facebook.com`,
        password: 'oauth_user',
        role: 'student',
        facebookId: profile.id
      });
      await user.save();
      done(null, user);
    } catch (err) {
      done(err, null);
    }
  }
));

module.exports = passport;
