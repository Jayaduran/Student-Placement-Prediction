const mongoose = require('mongoose');

const predictionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  inputData: {
    cgpa: Number,
    projects: Number,
    internships: Number,
    certifications: Number,
    hackathons: Number,
    leetcodeRating: Number,
    aptitudeScore: Number,
    softSkillsRating: Number,
    communicationRating: Number
  },
  predictionResult: {
    percentage: Number,
    category: { type: String, enum: ['Exceptional', 'High', 'Medium', 'Low'] },
    careerMatches: {
      roles: [String],
      companies: [mongoose.Schema.Types.Mixed],
      expectedPackage: String
    }
  }
}, { timestamps: true });

module.exports = mongoose.model('Prediction', predictionSchema);
