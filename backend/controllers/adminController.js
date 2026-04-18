const Student = require('../models/Student');
const StudentProfile = require('../models/StudentProfile');
const Prediction = require('../models/Prediction');

exports.getAllStudents = async (req, res) => {
  try {
    const students = await Student.find().select('-password').lean();

    const studentIds = students.map((student) => student._id);
    const profiles = await StudentProfile.find({ user: { $in: studentIds } }).lean();

    const profileMap = new Map(profiles.map((profile) => [String(profile.user), profile]));
    const studentsWithProfiles = students.map((student) => ({
      ...student,
      profile: profileMap.get(String(student._id)) || null
    }));

    res.json(studentsWithProfiles);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Admin can manually delete a student
exports.deleteStudent = async (req, res) => {
  try {
    const studentId = req.params.id;
    if (!studentId || studentId === 'undefined') {
      return res.status(400).json({ error: 'Valid Student ID required' });
    }
    
    // Attempt to parse to ObjectId cleanly
    const mongoose = require('mongoose');
    const objectId = mongoose.Types.ObjectId.isValid(studentId) ? new mongoose.Types.ObjectId(studentId) : studentId;

    await Student.findByIdAndDelete(objectId);
    await StudentProfile.deleteMany({ user: objectId });
    await Prediction.deleteMany({ user: objectId });
    
    res.json({ message: 'Student and related records deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Admin can update a student's profile for the leaderboard
exports.updateStudentProfile = async (req, res) => {
  try {
    const studentId = req.params.id;
    const { cgpa, leetcodeRating, projects, internships, hackathons } = req.body;
    const toNumber = (value) => (value === '' || value === null || value === undefined ? undefined : Number(value));
    
    let profile = await StudentProfile.findOne({ user: studentId });
    if (!profile) {
      // Create a profile if missing so admin edit always works.
      profile = new StudentProfile({ user: studentId, cgpa: toNumber(cgpa) ?? 0 });
    }
    
    const parsedCgpa = toNumber(cgpa);
    const parsedLeetcode = toNumber(leetcodeRating);
    const parsedProjects = toNumber(projects);
    const parsedInternships = toNumber(internships);
    const parsedHackathons = toNumber(hackathons);

    if (parsedCgpa !== undefined) profile.cgpa = parsedCgpa;
    if (parsedLeetcode !== undefined) profile.leetcodeRating = parsedLeetcode;
    if (parsedProjects !== undefined) profile.projects = parsedProjects;
    if (parsedInternships !== undefined) profile.internships = parsedInternships;
    if (parsedHackathons !== undefined) profile.hackathons = parsedHackathons;
    
    await profile.save();
    
    // Once updated, we might need to invalidate their Prediction but we'll leave it simple.
    res.json({ message: 'Profile updated successfully', profile });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

