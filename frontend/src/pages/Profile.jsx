import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { motion } from 'framer-motion';
import { FileText, Cpu, BookOpen, Target, ShieldCheck, Zap, Briefcase, Building2, ChevronDown, ExternalLink } from 'lucide-react';

function Profile() {
  const [formData, setFormData] = useState({
    cgpa: '',
    skills: '',
    projects: '',
    internships: '',
    certifications: '',
    hackathons: '',
    leetcodeRating: '',
    aptitudeScore: '',
    softSkillsRating: '',
    communicationRating: ''
  });
  const [loading, setLoading] = useState(false);
  const [resumeLoading, setResumeLoading] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await api.get('/profile');
      if (res.data) {
        setFormData({
          cgpa: res.data.cgpa || '',
          skills: res.data.skills?.join(', ') || '',
          projects: res.data.projects || '',
          internships: res.data.internships || '',
          certifications: res.data.certifications || '',
          hackathons: res.data.hackathons || '',
          leetcodeRating: res.data.leetcodeRating || '',
          aptitudeScore: res.data.aptitudeScore || '',
          softSkillsRating: res.data.softSkillsRating || '',
          communicationRating: res.data.communicationRating || ''
        });
      }
      
      // Auto-fetch latest prediction so the companies appear immediately without needing to click Predict again
      const predRes = await api.get('/profile/predictions');
      if (predRes.data && predRes.data.length > 0) {
        setResult(predRes.data[0].predictionResult);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleResumeUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setResumeLoading(true);
    const formDataObj = new FormData();
    formDataObj.append('resume', file);
    
    try {
      const res = await api.post('/profile/parse-resume', formDataObj, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data.fallbackUsed) {
        alert(res.data.warning || 'Resume parsed with basic parser. AI extraction is temporarily unavailable.');
      } else {
        alert(res.data.message || 'Resume parsed and profile updated successfully.');
      }

      const nextProfile = res.data.profile || {};
      setFormData((prev) => ({
        ...prev,
        cgpa: nextProfile.cgpa ?? prev.cgpa,
        skills: Array.isArray(nextProfile.skills) ? nextProfile.skills.join(', ') : prev.skills,
        projects: nextProfile.projects ?? prev.projects,
        internships: nextProfile.internships ?? prev.internships,
        certifications: nextProfile.certifications ?? prev.certifications,
        hackathons: nextProfile.hackathons ?? prev.hackathons,
        leetcodeRating: nextProfile.leetcodeRating ?? prev.leetcodeRating,
        aptitudeScore: nextProfile.aptitudeScore ?? prev.aptitudeScore,
        softSkillsRating: nextProfile.softSkillsRating ?? prev.softSkillsRating,
        communicationRating: nextProfile.communicationRating ?? prev.communicationRating
      }));

      if (res.data.predictionResult) {
        setResult(res.data.predictionResult);
      }
    } catch (err) {
      alert('Error parsing resume: ' + (err.response?.data?.error || err.message));
    } finally {
      setResumeLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    try {
      const formattedData = {
        ...formData,
        cgpa: parseFloat(formData.cgpa || 0),
        projects: parseInt(formData.projects || 0),
        internships: parseInt(formData.internships || 0),
        certifications: parseInt(formData.certifications || 0),
        hackathons: parseInt(formData.hackathons || 0),
        leetcodeRating: parseInt(formData.leetcodeRating || 0),
        aptitudeScore: parseInt(formData.aptitudeScore || 1),
        softSkillsRating: parseInt(formData.softSkillsRating || 1),
        communicationRating: parseInt(formData.communicationRating || 1),
        skills: formData.skills.split(',').map(s => s.trim()).filter(s => s)
      };
      const res = await api.post('/profile/predict', formattedData);
      setResult(res.data.predictionResult);
    } catch (err) {
      alert('Error predicting placement: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100 } }
  };

  return (
    <motion.div initial="hidden" animate="show" variants={containerVariants} style={{ paddingBottom: '80px' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '32px' }}>
        <div>
          <h1 className="text-gradient" style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '36px' }}>
            <Cpu color="var(--primary-color)" size={32} /> Parameter configuration
          </h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '8px', fontSize: '15px' }}>
            Optimize your data inputs for the proprietary AI matching engine. 
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 350px', gap: '32px', alignItems: 'start' }}>
        
        {/* Main Form Area */}
        <motion.div variants={itemVariants}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            <div className="glass-panel" style={{ padding: '32px' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px', fontSize: '18px' }}>
                <BookOpen size={20} color="var(--secondary-color)" /> Academic & Core Metrics
              </h3>
              <div className="grid-2">
                <div>
                  <label>Cumulative GPA (0.0 - 10.0)</label>
                  <input type="number" step="0.01" min="0" max="10" name="cgpa" placeholder="e.g. 8.5" value={formData.cgpa} onChange={handleChange} required />
                </div>
                <div>
                  <label>Aptitude Standard Score (1-100)</label>
                  <input type="number" min="1" max="100" name="aptitudeScore" placeholder="e.g. 85" value={formData.aptitudeScore} onChange={handleChange} required />
                </div>
              </div>
              
              <div style={{ marginTop: '4px' }}>
                <label>Technical Skill Tokens (Comma separated)</label>
                <input type="text" name="skills" placeholder="e.g. React, Python, Cloud Computing, System Design" value={formData.skills} onChange={handleChange} />
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '32px' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px', fontSize: '18px' }}>
                <Target size={20} color="var(--primary-color)" /> Extra Vector Variables (EVV)
              </h3>
              <div className="grid-2" style={{ gap: '20px 32px' }}>
                <div><label>Deployed Projects</label><input type="number" min="0" max="50" placeholder="2" name="projects" value={formData.projects} onChange={handleChange} /></div>
                <div><label>Completed Internships</label><input type="number" min="0" max="10" placeholder="1" name="internships" value={formData.internships} onChange={handleChange} /></div>
                <div><label>Hackathons Won</label><input type="number" min="0" max="20" placeholder="0" name="hackathons" value={formData.hackathons} onChange={handleChange} /></div>
                <div><label>LeetCode ELO Rating</label><input type="number" min="0" max="4000" placeholder="1500" name="leetcodeRating" value={formData.leetcodeRating} onChange={handleChange} /></div>
                <div><label>Soft Skills (1-10)</label><input type="number" min="1" max="10" placeholder="8" name="softSkillsRating" value={formData.softSkillsRating} onChange={handleChange} /></div>
                <div><label>Communication (1-10)</label><input type="number" min="1" max="10" placeholder="9" name="communicationRating" value={formData.communicationRating} onChange={handleChange} /></div>
              </div>
            </div>

            <button type="submit" className="btn-primary" style={{ padding: '16px', fontSize: '16px' }} disabled={loading}>
              {loading ? 'Crunching Matrices...' : 'Execute AI Calculation Array'}
            </button>
          </form>
        </motion.div>

        {/* Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', position: 'sticky', top: '100px' }}>
          
          <motion.div className="glass-panel" style={{ padding: '24px', border: '1px dashed var(--secondary-color)', background: 'transparent' }} variants={itemVariants}>
            <h3 style={{ marginBottom: '16px', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Zap size={18} color="var(--secondary-color)" /> LLM Auto-Fill
            </h3>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
              Dump your resume PDF here. The heuristics engine will automatically tokenize and map coordinates to your fields.
            </p>
            
            <label htmlFor="resume-upload" className="upload-zone" style={{ padding: '24px', marginBottom: 0, backgroundColor: 'rgba(255,255,255,0.5)' }}>
              <input id="resume-upload" type="file" accept=".pdf" onChange={handleResumeUpload} style={{ display: 'none' }} />
              {resumeLoading ? (
                <div style={{ color: 'var(--primary-color)', fontWeight: 500, fontSize: '14px' }}>Parsing Document...</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                  <FileText color="var(--text-secondary)" size={32} />
                  <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--secondary-color)' }}>Select PDF Document</span>
                </div>
              )}
            </label>
          </motion.div>

          {result && (
            <>
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }} 
                animate={{ scale: 1, opacity: 1 }} 
                className="glass-panel" 
                style={{ padding: '32px', textAlign: 'center', border: 'none', background: 'linear-gradient(135deg, var(--primary-color), var(--primary-hover))', color: 'white', boxShadow: '0 12px 30px rgba(217, 108, 83, 0.3)' }}
              >
                <ShieldCheck size={40} style={{ margin: '0 auto 16px', opacity: 0.9 }} />
                <h3 style={{ fontSize: '16px', color: 'rgba(255,255,255,0.9)' }}>Calculated Integrity</h3>
                <div style={{ fontSize: '72px', fontFamily: 'Outfit', fontWeight: 'bold', margin: '4px 0', lineHeight: 1 }}>
                  {result.percentage}%
                </div>
                <div style={{ marginTop: '16px', display: 'inline-block', backgroundColor: 'rgba(0,0,0,0.15)', padding: '6px 16px', borderRadius: '20px', fontSize: '14px', fontWeight: 600 }}>
                  {result.category} Probability Matrix
                </div>
              </motion.div>

              <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="glass-panel" style={{ padding: '24px' }}>
                <h3 style={{ marginBottom: '16px', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Briefcase size={18} color="var(--primary-color)" /> Matching Companies
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {result.careerMatches?.companies?.map((companyObj, idx) => {
                    const isLegacy = typeof companyObj === 'string';
                    const name = isLegacy ? companyObj : companyObj.name;
                    const type = isLegacy ? 'Verified Firm' : companyObj.type;
                    const link = isLegacy ? '#' : companyObj.link;
                    const isProduct = type.includes('Product');

                    return (
                    <details key={idx} style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', borderRadius: '8px', overflow: 'hidden' }}>
                      <summary style={{ padding: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontWeight: 600, listStyle: 'none' }} className="accordion-summary">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Building2 size={16} color="var(--secondary-color)" /> {name}
                        </div>
                        <ChevronDown size={16} className="accordion-icon" />
                      </summary>
                      <div style={{ padding: '0 16px 16px 16px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                        <p style={{ marginBottom: '8px' }}><strong>Type:</strong> <span style={{ color: isProduct ? '#a5b4fc' : '#fde047' }}>{type}</span></p>
                        <p style={{ marginBottom: '8px' }}><strong>Role:</strong> {result.careerMatches.roles[0] || 'Software Engineer'}</p>
                        <p style={{ marginBottom: '16px' }}><strong>Expected Package:</strong> {result.careerMatches.expectedPackage}</p>
                        <a href={link} target="_blank" rel="noopener noreferrer" className="btn-secondary" style={{ display: 'inline-flex', padding: '6px 12px', fontSize: '12px', gap: '6px', pointerEvents: isLegacy ? 'none' : 'auto', opacity: isLegacy ? 0.5 : 1 }}>
                          Official Application Portal <ExternalLink size={12} />
                        </a>
                      </div>
                    </details>
                    );
                  })}
                  {(!result.careerMatches?.companies || result.careerMatches.companies.length === 0) && (
                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>No verified opportunities found in our registry.</p>
                  )}
                </div>
              </motion.div>
            </>
          )}

        </div>
      </div>
    </motion.div>
  );
}

export default Profile;
