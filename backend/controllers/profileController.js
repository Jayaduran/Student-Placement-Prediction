const StudentProfile = require('../models/StudentProfile');
const Prediction = require('../models/Prediction');
const Student = require('../models/Student');
const pdfParseLib = require('pdf-parse');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Simple Sigmoid function for mock Logistic Regression
const sigmoid = (z) => 1 / (1 + Math.exp(-z));
const gemini = process.env.GEMINI_API_KEY ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null;

const toNumber = (value, fallback = 0) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const toStringArray = (value) => {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => (typeof item === 'string' ? item.trim() : ''))
    .filter(Boolean);
};

  const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const extractPdfText = async (buffer) => {
  // pdf-parse v2 exports PDFParse class, while v1 exported a function.
  if (typeof pdfParseLib === 'function') {
    const data = await pdfParseLib(buffer);
    return data?.text || '';
  }

  if (typeof pdfParseLib?.PDFParse === 'function') {
    const parser = new pdfParseLib.PDFParse({ data: buffer });
    try {
      const result = await parser.getText();
      return result?.text || '';
    } finally {
      await parser.destroy();
    }
  }

  throw new Error('Unsupported pdf-parse version.');
};

const parseJsonFromModelText = (text) => {
  const cleaned = (text || '').trim().replace(/^```json\s*/i, '').replace(/^```/, '').replace(/```$/, '').trim();
  return JSON.parse(cleaned || '{}');
};

const buildPredictionResult = ({
  cgpa,
  projects,
  internships,
  certifications,
  hackathons,
  leetcodeRating,
  aptitudeScore,
  softSkillsRating,
  communicationRating
}) => {
  let z = -24; // Baseline bias

  z += (cgpa * 1.8); // High impact
  z += (projects * 1.2);
  z += (internships * 1.5);
  z += (certifications * 0.3);
  z += (hackathons * 0.8);
  z += (leetcodeRating * 0.0025); // 2000 adds 5.0
  z += (aptitudeScore * 0.04);
  z += (softSkillsRating * 0.4);
  z += (communicationRating * 0.4);

  const probability = sigmoid(z);
  const percentage = Math.round(probability * 100);

  let category = 'Low';
  let careerMatches = { roles: [], companies: [], expectedPackage: '' };

  if (percentage > 85 && leetcodeRating >= 1600 && cgpa >= 8.0) {
    category = 'Exceptional';
    careerMatches.roles = ['Software Development Engineer', 'Data Scientist', 'Core Tech Role'];
    careerMatches.companies = [
      { name: 'Google', type: 'Product Based', link: 'https://careers.google.com' },
      { name: 'Amazon', type: 'Product Based', link: 'https://amazon.jobs' },
      { name: 'Microsoft', type: 'Product Based', link: 'https://careers.microsoft.com' },
      { name: 'Uber', type: 'Product Based', link: 'https://www.uber.com/careers' }
    ];
    careerMatches.expectedPackage = '25.0 - 45.0 LPA';
  } else if (percentage > 65) {
    category = 'High';
    careerMatches.roles = ['Full Stack Developer', 'Backend Engineer', 'Product Engineer'];
    careerMatches.companies = [
      { name: 'Zomato', type: 'Product Based', link: 'https://www.zomato.com/careers' },
      { name: 'Swiggy', type: 'Product Based', link: 'https://careers.swiggy.com' },
      { name: 'Razorpay', type: 'Product Based', link: 'https://razorpay.com/jobs/' },
      { name: 'TCS Digital', type: 'Service Based', link: 'https://www.tcs.com/careers' }
    ];
    careerMatches.expectedPackage = '12.0 - 20.0 LPA';
  } else if (percentage > 40) {
    category = 'Medium';
    careerMatches.roles = ['System Analyst', 'Frontend Developer', 'QA Engineer'];
    careerMatches.companies = [
      { name: 'Infosys', type: 'Service Based', link: 'https://www.infosys.com/careers/' },
      { name: 'Capgemini', type: 'Service Based', link: 'https://www.capgemini.com/careers/' },
      { name: 'Wipro', type: 'Service Based', link: 'https://careers.wipro.com/' },
      { name: 'Cognizant', type: 'Service Based', link: 'https://careers.cognizant.com/' }
    ];
    careerMatches.expectedPackage = '4.5 - 8.0 LPA';
  } else {
    category = 'Low';
    careerMatches.roles = ['Technical Support', 'Trainee Engineer', 'BPO Tech Ops'];
    careerMatches.companies = [
      { name: 'TCS Ninja', type: 'Service Based', link: 'https://www.tcs.com/careers' },
      { name: 'Accenture', type: 'Service Based', link: 'https://www.accenture.com/in-en/careers' },
      { name: 'Local IT Firms', type: 'Product/Service', link: 'https://in.indeed.com/' }
    ];
    careerMatches.expectedPackage = '3.0 - 4.5 LPA';
  }

  return { percentage, category, careerMatches };
};

const normalizeResumeExtraction = (raw) => {
  const extracted = raw && typeof raw === 'object' ? raw : {};
  const resumeProjects = Array.isArray(extracted.projects)
    ? extracted.projects
        .map((p) => ({
          name: typeof p?.name === 'string' ? p.name.trim() : '',
          description: typeof p?.description === 'string' ? p.description.trim() : '',
          technologies: toStringArray(p?.technologies),
          impact: typeof p?.impact === 'string' ? p.impact.trim() : ''
        }))
        .filter((p) => p.name || p.description)
    : [];

  const resumeEducation = Array.isArray(extracted.education)
    ? extracted.education
        .map((e) => ({
          degree: typeof e?.degree === 'string' ? e.degree.trim() : '',
          institute: typeof e?.institute === 'string' ? e.institute.trim() : '',
          score: typeof e?.score === 'string' ? e.score.trim() : '',
          year: typeof e?.year === 'string' ? e.year.trim() : ''
        }))
        .filter((e) => e.degree || e.institute)
    : [];

  const resumeWorkExperience = Array.isArray(extracted.workExperience)
    ? extracted.workExperience
        .map((w) => ({
          role: typeof w?.role === 'string' ? w.role.trim() : '',
          company: typeof w?.company === 'string' ? w.company.trim() : '',
          duration: typeof w?.duration === 'string' ? w.duration.trim() : '',
          summary: typeof w?.summary === 'string' ? w.summary.trim() : ''
        }))
        .filter((w) => w.role || w.company)
    : [];

  return {
    cgpa: clamp(toNumber(extracted.cgpa, 0), 0, 10),
    skills: toStringArray(extracted.skills),
    projects: Math.max(0, toNumber(extracted.projectsCount, resumeProjects.length)),
    internships: Math.max(0, toNumber(extracted.internships, 0)),
    certifications: Math.max(0, toNumber(extracted.certifications, 0)),
    hackathons: Math.max(0, toNumber(extracted.hackathons, 0)),
    leetcodeRating: Math.max(0, toNumber(extracted.leetcodeRating, 0)),
    aptitudeScore: clamp(toNumber(extracted.aptitudeScore, 1), 1, 100),
    softSkillsRating: clamp(toNumber(extracted.softSkillsRating, 5), 1, 10),
    communicationRating: clamp(toNumber(extracted.communicationRating, 5), 1, 10),
    resumeProjects,
    resumeEducation,
    resumeWorkExperience,
    resumeMeta: {
      email: typeof extracted.contact?.email === 'string' ? extracted.contact.email.trim() : '',
      phone: typeof extracted.contact?.phone === 'string' ? extracted.contact.phone.trim() : '',
      linkedin: typeof extracted.contact?.linkedin === 'string' ? extracted.contact.linkedin.trim() : '',
      github: typeof extracted.contact?.github === 'string' ? extracted.contact.github.trim() : '',
      summary: typeof extracted.summary === 'string' ? extracted.summary.trim() : ''
    }
  };
};

const buildHeuristicExtraction = (text) => {
  const cgpaMatch = text.match(/(?:cgpa|gpa|score)\s*[:\-]?\s*([0-9](?:\.[0-9]{1,2})?)/i);
  const keywordPool = [
    'React', 'Node', 'Node.js', 'Python', 'Java', 'C++', 'SQL', 'MongoDB', 'AWS',
    'Docker', 'Kubernetes', 'Machine Learning', 'JavaScript', 'TypeScript', 'HTML', 'CSS'
  ];

  const foundSkills = keywordPool.filter((kw) => new RegExp(`\\b${escapeRegex(kw)}\\b`, 'i').test(text));

  const countByKeywords = (keywords) => {
    const pattern = new RegExp(`(?:^|\\n)\\s*(?:${keywords.join('|')})\\b`, 'gim');
    return (text.match(pattern) || []).length;
  };

  const projectsCount = countByKeywords(['projects?', 'personal projects?', 'academic projects?']) || 0;
  const internships = countByKeywords(['internships?', 'experience']) || 0;
  const certifications = countByKeywords(['certifications?', 'certificates?']) || 0;
  const hackathons = countByKeywords(['hackathons?', 'competitions?']) || 0;

  return {
    cgpa: cgpaMatch ? Number(cgpaMatch[1]) : null,
    skills: foundSkills,
    projectsCount,
    projects: [],
    internships,
    certifications,
    hackathons,
    leetcodeRating: null,
    aptitudeScore: null,
    softSkillsRating: null,
    communicationRating: null,
    education: [],
    workExperience: [],
    contact: { email: '', phone: '', linkedin: '', github: '' },
    summary: ''
  };
};

exports.getProfile = async (req, res) => {
  try {
    const profile = await StudentProfile.findOne({ user: req.user.id });
    res.json(profile);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateProfileAndPredict = async (req, res) => {
  try {
    const { cgpa, skills, projects, internships, certifications, hackathons, leetcodeRating, aptitudeScore, softSkillsRating, communicationRating } = req.body;

    const student = await Student.findById(req.user.id).select('_id');
    if (!student) {
      return res.status(401).json({ error: 'Student account not found. Please login again.' });
    }
    
    // Save Profile
    let profile = await StudentProfile.findOne({ user: req.user.id });
    if (!profile) {
      profile = new StudentProfile({ user: req.user.id });
    }
    profile.cgpa = cgpa;
    profile.skills = skills;
    profile.projects = projects;
    profile.internships = internships;
    profile.certifications = certifications;
    profile.hackathons = hackathons;
    profile.leetcodeRating = leetcodeRating;
    profile.aptitudeScore = aptitudeScore;
    profile.softSkillsRating = softSkillsRating;
    profile.communicationRating = communicationRating;
    await profile.save();
    const predictionResult = buildPredictionResult({
      cgpa,
      projects,
      internships,
      certifications,
      hackathons,
      leetcodeRating,
      aptitudeScore,
      softSkillsRating,
      communicationRating
    });

    // Save Prediction
    const prediction = new Prediction({
      user: req.user.id,
      inputData: { cgpa, projects, internships, certifications, hackathons, leetcodeRating, aptitudeScore, softSkillsRating, communicationRating },
      predictionResult
    });
    await prediction.save();

    res.json({ profile, predictionResult: prediction.predictionResult });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getPredictions = async (req, res) => {
  try {
    const predictions = await Prediction.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.json(predictions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getLeaderboard = async (req, res) => {
  try {
    const leaderboard = await Prediction.aggregate([
      { $sort: { 'predictionResult.percentage': -1, createdAt: -1 } },
      { $group: { _id: '$user', bestScore: { $first: '$$ROOT' } } },
      { $lookup: { from: 'students', localField: '_id', foreignField: '_id', as: 'studentDetails' } },
      { $addFields: { userDetails: { $arrayElemAt: ['$studentDetails', 0] } } },
      { $match: { userDetails: { $ne: null } } },
      { $project: {
          userId: '$_id',
          name: '$userDetails.name',
          score: '$bestScore.predictionResult.percentage',
          category: '$bestScore.predictionResult.category',
          cgpa: '$bestScore.inputData.cgpa',
          leetcode: '$bestScore.inputData.leetcodeRating',
          projects: '$bestScore.inputData.projects',
          internships: '$bestScore.inputData.internships',
          communication: '$bestScore.inputData.communicationRating',
          skills: '$bestScore.inputData.softSkillsRating',
          date: '$bestScore.createdAt'
      }},
      { $sort: { score: -1 } },
      { $limit: 15 }
    ]);
    res.json(leaderboard);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.parseResume = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    if (!gemini) {
      return res.status(500).json({
        error: 'GEMINI_API_KEY is not configured on the backend. Add it in environment variables.'
      });
    }

    const text = await extractPdfText(req.file.buffer);
    const promptText = text.slice(0, 15000);

    let parsed;
    let fallbackUsed = false;
    let fallbackReason = '';

    try {
      const model = gemini.getGenerativeModel({ model: process.env.GEMINI_MODEL || 'gemini-2.0-flash' });
      const generation = await model.generateContent(
        'Extract resume details and return STRICT JSON only. Do not use markdown. Keep unknown values null/empty.\\n\\n' +
        `Return JSON with exact shape:\n` +
        `{\n` +
        `  "cgpa": number|null,\n` +
        `  "skills": string[],\n` +
        `  "projectsCount": number|null,\n` +
        `  "projects": [{"name": string, "description": string, "technologies": string[], "impact": string}],\n` +
        `  "internships": number|null,\n` +
        `  "certifications": number|null,\n` +
        `  "hackathons": number|null,\n` +
        `  "leetcodeRating": number|null,\n` +
        `  "aptitudeScore": number|null,\n` +
        `  "softSkillsRating": number|null,\n` +
        `  "communicationRating": number|null,\n` +
        `  "education": [{"degree": string, "institute": string, "score": string, "year": string}],\n` +
        `  "workExperience": [{"role": string, "company": string, "duration": string, "summary": string}],\n` +
        `  "contact": {"email": string, "phone": string, "linkedin": string, "github": string},\n` +
        `  "summary": string\n` +
        `}\n\nResume text:\n${promptText}`
      );

      const rawText = generation?.response?.text?.() || '{}';
      parsed = parseJsonFromModelText(rawText);
    } catch (modelError) {
      fallbackUsed = true;
      const rawModelError = modelError?.message || 'Gemini extraction failed';
      console.error('[Gemini Parse Error]:', rawModelError);

      if (/429|quota|rate limit/i.test(rawModelError)) {
        fallbackReason = 'AI quota reached';
      } else if (/404|not found|unsupported/i.test(rawModelError)) {
        fallbackReason = 'AI model unavailable';
      } else {
        fallbackReason = 'AI service temporarily unavailable';
      }

      parsed = buildHeuristicExtraction(text);
    }

    const extracted = normalizeResumeExtraction(parsed);

    const student = await Student.findById(req.user.id).select('_id');
    if (!student) {
      return res.status(401).json({ error: 'Student account not found. Please login again.' });
    }

    let profile = await StudentProfile.findOne({ user: req.user.id });
    if (!profile) {
      profile = new StudentProfile({ user: req.user.id, cgpa: extracted.cgpa || 0 });
    }

    profile.cgpa = extracted.cgpa;
    profile.skills = extracted.skills;
    profile.projects = extracted.projects;
    profile.internships = extracted.internships;
    profile.certifications = extracted.certifications;
    profile.hackathons = extracted.hackathons;
    profile.leetcodeRating = extracted.leetcodeRating;
    profile.aptitudeScore = extracted.aptitudeScore;
    profile.softSkillsRating = extracted.softSkillsRating;
    profile.communicationRating = extracted.communicationRating;
    profile.resumeProjects = extracted.resumeProjects;
    profile.resumeEducation = extracted.resumeEducation;
    profile.resumeWorkExperience = extracted.resumeWorkExperience;
    profile.resumeMeta = {
      ...extracted.resumeMeta,
      rawTextLength: text.length,
      parserModel: process.env.GEMINI_MODEL || 'gemini-2.0-flash',
      lastParsedAt: new Date()
    };
    await profile.save();

    const predictionInput = {
      cgpa: profile.cgpa || 0,
      projects: profile.projects || 0,
      internships: profile.internships || 0,
      certifications: profile.certifications || 0,
      hackathons: profile.hackathons || 0,
      leetcodeRating: profile.leetcodeRating || 0,
      aptitudeScore: profile.aptitudeScore || 1,
      softSkillsRating: profile.softSkillsRating || 1,
      communicationRating: profile.communicationRating || 1
    };

    const predictionResult = buildPredictionResult(predictionInput);

    const prediction = new Prediction({
      user: req.user.id,
      inputData: predictionInput,
      predictionResult
    });
    await prediction.save();

    res.json({
      message: fallbackUsed
        ? 'Resume parsed with basic parser.'
        : 'Resume parsed and profile updated successfully.',
      warning: fallbackUsed
        ? `${fallbackReason}. We saved your profile and generated prediction using basic parsing.`
        : '',
      fallbackUsed,
      aiStatus: fallbackUsed ? 'fallback' : 'gemini',
      extracted,
      profile,
      predictionResult
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to parse resume: ' + err.message });
  }
};
