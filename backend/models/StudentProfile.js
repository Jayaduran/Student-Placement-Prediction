const mongoose = require('mongoose');

const studentProfileSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true, unique: true },
  cgpa: { type: Number, required: true },
  skills: [{ type: String }],
  projects: { type: Number, default: 0 },
  internships: { type: Number, default: 0 },
  certifications: { type: Number, default: 0 },
  hackathons: { type: Number, default: 0 },
  leetcodeRating: { type: Number, default: 0 },
  aptitudeScore: { type: Number },
  softSkillsRating: { type: Number, min: 1, max: 10 },
  communicationRating: { type: Number, min: 1, max: 10 },
  resumeProjects: [{
    name: { type: String },
    description: { type: String },
    technologies: [{ type: String }],
    impact: { type: String }
  }],
  resumeEducation: [{
    degree: { type: String },
    institute: { type: String },
    score: { type: String },
    year: { type: String }
  }],
  resumeWorkExperience: [{
    role: { type: String },
    company: { type: String },
    duration: { type: String },
    summary: { type: String }
  }],
  resumeMeta: {
    email: { type: String },
    phone: { type: String },
    linkedin: { type: String },
    github: { type: String },
    summary: { type: String },
    rawTextLength: { type: Number },
    parserModel: { type: String },
    lastParsedAt: { type: Date }
  }
}, { timestamps: true });

module.exports = mongoose.model('StudentProfile', studentProfileSchema);
