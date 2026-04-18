import React, { useState, useEffect, useContext, useMemo } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import { Link } from 'react-router-dom';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  Radar, RadarChart, PolarGrid, PolarAngleAxis, BarChart, Bar, Cell 
} from 'recharts';
import { motion } from 'framer-motion';
import { DownloadCloud, LayoutDashboard, TrendingUp, Target, Users, AlertCircle, Briefcase, ExternalLink, Building2 } from 'lucide-react';
import { Trash2, Edit2, Search, Download, RefreshCcw, X } from 'lucide-react';

function Dashboard() {
  const { user } = useContext(AuthContext);
  const [predictions, setPredictions] = useState([]);
  const [leaders, setLeaders] = useState([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);
  const [leaderboardSearch, setLeaderboardSearch] = useState('');
  const [leaderboardCategory, setLeaderboardCategory] = useState('All');
  const [editModal, setEditModal] = useState({
    isOpen: false,
    userId: null,
    data: { cgpa: '', leetcodeRating: '', projects: '', internships: '', hackathons: '' }
  });
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, userId: null, name: '' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.role === 'student') {
      fetchPredictions();
    } else if (user?.role === 'admin') {
      fetchLeaderboardForAdmin();
      setLoading(false);
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchLeaderboardForAdmin = async () => {
    setLeaderboardLoading(true);
    try {
      const res = await api.get('/profile/leaderboard');
      setLeaders(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLeaderboardLoading(false);
    }
  };

  const fetchPredictions = async () => {
    try {
      const res = await api.get('/profile/predictions');
      if (res.data.length === 0 && user?.email === 'demo@google.com') {
        setPredictions([{
          predictionResult: { 
            percentage: 78, 
            category: 'High',
            careerMatches: {
              roles: ['Full Stack Developer', 'Backend Engineer'],
              companies: [
                { name: 'Zomato', type: 'Product Based', link: 'https://www.zomato.com/careers' },
                { name: 'TCS Digital', type: 'Service Based', link: 'https://www.tcs.com/careers' }
              ],
              expectedPackage: '12.0 - 20.0 LPA'
            }
          },
          inputData: { cgpa: 8.2, aptitudeScore: 85, projects: 4, internships: 1, softSkillsRating: 8, communicationRating: 7, leetcodeRating: 1400 },
          createdAt: new Date().toISOString()
        }]);
      } else {
        setPredictions(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const exportPDF = () => {
    window.print();
  };

  const filteredLeaders = useMemo(() => {
    const list = leaders.filter((student) => {
      const matchesSearch = (student.name || '').toLowerCase().includes(leaderboardSearch.toLowerCase());
      const matchesCategory = leaderboardCategory === 'All' || student.category === leaderboardCategory;
      return matchesSearch && matchesCategory;
    });

    return [...list].sort((a, b) => (b.score || 0) - (a.score || 0));
  }, [leaders, leaderboardSearch, leaderboardCategory]);

  const exportLeaderboardCsv = () => {
    if (!filteredLeaders.length) return;

    const escape = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`;
    const headers = ['Name', 'Category', 'Score', 'CGPA', 'LeetCode', 'Projects', 'Internships', 'Communication'];
    const rows = filteredLeaders.map((s) => [
      s.name,
      s.category,
      Math.round(s.score || 0),
      s.cgpa ?? '',
      s.leetcode ?? '',
      s.projects ?? 0,
      s.internships ?? 0,
      s.communication ?? ''
    ]);

    const csv = [headers.map(escape).join(','), ...rows.map((row) => row.map(escape).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `leaderboard-${Date.now()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const openEditModal = (student) => {
    setEditModal({
      isOpen: true,
      userId: student.userId || student._id,
      data: {
        cgpa: student.cgpa ?? '',
        leetcodeRating: student.leetcode ?? '',
        projects: student.projects ?? 0,
        internships: student.internships ?? 0,
        hackathons: student.hackathons ?? 0
      }
    });
  };

  const submitEdit = async (e) => {
    e.preventDefault();
    if (!editModal.userId) return;

    try {
      await api.put(`/admin/students/${editModal.userId}/profile`, {
        cgpa: Number(editModal.data.cgpa),
        leetcodeRating: Number(editModal.data.leetcodeRating),
        projects: Number(editModal.data.projects),
        internships: Number(editModal.data.internships),
        hackathons: Number(editModal.data.hackathons)
      });
      setEditModal({
        isOpen: false,
        userId: null,
        data: { cgpa: '', leetcodeRating: '', projects: '', internships: '', hackathons: '' }
      });
      fetchLeaderboardForAdmin();
    } catch (err) {
      alert('Failed to update leaderboard profile: ' + err.message);
    }
  };

  const confirmDelete = async () => {
    if (!deleteModal.userId) return;
    try {
      await api.delete(`/admin/students/${deleteModal.userId}`);
      setDeleteModal({ isOpen: false, userId: null, name: '' });
      fetchLeaderboardForAdmin();
    } catch (err) {
      alert('Failed to delete student: ' + err.message);
    }
  };

  if (loading) return <div className="container flex-center" style={{minHeight: '60vh'}}>Loading AI Engine...</div>;

  if (user?.role === 'admin') {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h1 className="text-gradient" style={{ marginBottom: '8px' }}>Admin Dashboard</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
          Manage leaderboard records directly from Dashboard.
        </p>

        <div className="glass-panel" style={{ padding: '24px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <div style={{ position: 'relative' }}>
                <Search size={16} color="var(--text-secondary)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="text"
                  value={leaderboardSearch}
                  onChange={(e) => setLeaderboardSearch(e.target.value)}
                  placeholder="Search leaderboard..."
                  style={{ margin: 0, paddingLeft: '36px', width: '240px' }}
                />
              </div>

              <select value={leaderboardCategory} onChange={(e) => setLeaderboardCategory(e.target.value)} style={{ width: '170px', margin: 0 }}>
                <option value="All">All Categories</option>
                <option value="Exceptional">Exceptional</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button className="btn-secondary" onClick={fetchLeaderboardForAdmin} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                <RefreshCcw size={16} /> Refresh
              </button>
              <button className="btn-secondary" onClick={exportLeaderboardCsv} disabled={!filteredLeaders.length} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                <Download size={16} /> Export CSV
              </button>
              <Link to="/admin" className="btn-secondary" style={{ width: 'auto', display: 'inline-flex', alignItems: 'center' }}>Open Admin Panel</Link>
            </div>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ marginBottom: '12px' }}>Leaderboard Manager</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '20px' }}>
            Edit leaderboard factors and delete records.
          </p>

          {leaderboardLoading ? (
            <div style={{ padding: '26px', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading leaderboard...</div>
          ) : filteredLeaders.length === 0 ? (
            <div style={{ padding: '26px', textAlign: 'center', color: 'var(--text-secondary)' }}>No leaderboard entries found.</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left', padding: '12px', borderBottom: '1px solid var(--border-color)' }}>Name</th>
                    <th style={{ textAlign: 'left', padding: '12px', borderBottom: '1px solid var(--border-color)' }}>Category</th>
                    <th style={{ textAlign: 'left', padding: '12px', borderBottom: '1px solid var(--border-color)' }}>Score</th>
                    <th style={{ textAlign: 'left', padding: '12px', borderBottom: '1px solid var(--border-color)' }}>CGPA</th>
                    <th style={{ textAlign: 'left', padding: '12px', borderBottom: '1px solid var(--border-color)' }}>LeetCode</th>
                    <th style={{ textAlign: 'right', padding: '12px', borderBottom: '1px solid var(--border-color)' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLeaders.map((student) => (
                    <tr key={student.userId || student._id}>
                      <td style={{ padding: '12px', borderBottom: '1px solid var(--border-color)' }}>{student.name}</td>
                      <td style={{ padding: '12px', borderBottom: '1px solid var(--border-color)' }}>{student.category || '-'}</td>
                      <td style={{ padding: '12px', borderBottom: '1px solid var(--border-color)' }}>{Math.round(student.score || 0)}%</td>
                      <td style={{ padding: '12px', borderBottom: '1px solid var(--border-color)' }}>{student.cgpa ?? '-'}</td>
                      <td style={{ padding: '12px', borderBottom: '1px solid var(--border-color)' }}>{student.leetcode ?? '-'}</td>
                      <td style={{ padding: '12px', borderBottom: '1px solid var(--border-color)', textAlign: 'right' }}>
                        <button
                          onClick={() => openEditModal(student)}
                          style={{ background: 'transparent', border: '1px solid rgba(74, 107, 93, 0.3)', color: 'var(--secondary-color)', borderRadius: '8px', padding: '6px', marginRight: '8px', cursor: 'pointer' }}
                          title="Edit"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => setDeleteModal({ isOpen: true, userId: student.userId || student._id, name: student.name })}
                          style={{ background: 'transparent', border: '1px solid rgba(224, 82, 67, 0.3)', color: 'var(--error)', borderRadius: '8px', padding: '6px', cursor: 'pointer' }}
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {editModal.isOpen && (
          <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
            <div className="glass-panel" style={{ width: 'min(560px, 92%)', padding: '24px', position: 'relative' }}>
              <button
                onClick={() => setEditModal({
                  isOpen: false,
                  userId: null,
                  data: { cgpa: '', leetcodeRating: '', projects: '', internships: '', hackathons: '' }
                })}
                style={{ position: 'absolute', right: '16px', top: '16px', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
              >
                <X size={20} />
              </button>

              <h3 style={{ marginBottom: '16px' }}>Edit Leaderboard Data</h3>
              <form onSubmit={submitEdit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <input type="number" step="0.1" placeholder="CGPA" value={editModal.data.cgpa} onChange={(e) => setEditModal((prev) => ({ ...prev, data: { ...prev.data, cgpa: e.target.value } }))} />
                <input type="number" placeholder="LeetCode Rating" value={editModal.data.leetcodeRating} onChange={(e) => setEditModal((prev) => ({ ...prev, data: { ...prev.data, leetcodeRating: e.target.value } }))} />
                <input type="number" placeholder="Projects" value={editModal.data.projects} onChange={(e) => setEditModal((prev) => ({ ...prev, data: { ...prev.data, projects: e.target.value } }))} />
                <input type="number" placeholder="Internships" value={editModal.data.internships} onChange={(e) => setEditModal((prev) => ({ ...prev, data: { ...prev.data, internships: e.target.value } }))} />
                <input type="number" placeholder="Hackathons" value={editModal.data.hackathons} onChange={(e) => setEditModal((prev) => ({ ...prev, data: { ...prev.data, hackathons: e.target.value } }))} />
                <div />
                <button type="submit" className="btn-primary" style={{ gridColumn: 'span 2' }}>Save Changes</button>
              </form>
            </div>
          </div>
        )}

        {deleteModal.isOpen && (
          <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
            <div className="glass-panel" style={{ width: 'min(460px, 92%)', padding: '24px' }}>
              <h3>Delete Student</h3>
              <p style={{ color: 'var(--text-secondary)', margin: '8px 0 18px' }}>
                Are you sure you want to delete {deleteModal.name}? This removes user, profile, and prediction records.
              </p>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button className="btn-secondary" onClick={() => setDeleteModal({ isOpen: false, userId: null, name: '' })}>Cancel</button>
                <button className="btn-primary" onClick={confirmDelete} style={{ width: 'auto', backgroundColor: 'var(--error)' }}>Delete</button>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    );
  }

  // Calculate advanced metrics based on latest prediction
  const latest = predictions.length > 0 ? predictions[0] : null;
  const prev = predictions.length > 1 ? predictions[1] : null;
  
  const growth = prev ? latest.predictionResult.percentage - prev.predictionResult.percentage : 0;
  
  // Advanced Math formulation mock to populate dynamic dashboard charts
  let radarData = [];
  let industryData = [];
  let weakSkill = null;
  let percentile = 0;

  if (latest) {
    const data = latest.inputData;
    radarData = [
      { subject: 'CGPA', A: (data.cgpa / 10) * 100, fullMark: 100 },
      { subject: 'Aptitude', A: data.aptitudeScore, fullMark: 100 },
      { subject: 'Projects', A: Math.min((data.projects / 5) * 100, 100), fullMark: 100 },
      { subject: 'Internship', A: Math.min((data.internships / 3) * 100, 100), fullMark: 100 },
      { subject: 'Soft Skills', A: (data.softSkillsRating / 10) * 100, fullMark: 100 },
      { subject: 'Comm.', A: (data.communicationRating / 10) * 100, fullMark: 100 },
    ];

    // Find weakest skill for actionable intel
    let lowest = radarData[0];
    radarData.forEach(item => { if(item.A < lowest.A) lowest = item; });
    weakSkill = lowest.subject;

    // Industry Match Formulation (Mocking real probability distribution)
    const base = latest.predictionResult.percentage;
    industryData = [
      { name: 'Service', probability: Math.min(base + 15, 99) },
      { name: 'Startups', probability: Math.min(base, 95) },
      { name: 'Big Tech', probability: Math.max(base - 20, 5) },
      { name: 'FAANG', probability: Math.max(base - 45, 1) },
    ];

    // Peer Percentile Calc
    percentile = Math.min(Math.round(base * 1.1), 99);
  }

  const lineData = [...predictions].reverse().map((p, index) => ({
    name: `Snapshot ${index + 1}`,
    Score: p.predictionResult.percentage
  }));

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100 } }
  };

  return (
    <motion.div id="dashboard-content" initial="hidden" animate="show" variants={containerVariants} style={{ padding: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '32px' }} data-html2canvas-ignore="true">
        <div>
          <h1 className="text-gradient" style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '36px' }}>
            <LayoutDashboard color="var(--primary-color)" size={32} /> {user.name}'s Placement Report
          </h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '8px', fontSize: '15px' }}>
            Executive summary and AI-driven predictive insights.
          </p>
        </div>
        {predictions.length > 0 && (
          <button className="btn-secondary" onClick={exportPDF} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px' }}>
            <DownloadCloud size={18} /> Generate Report
          </button>
        )}
      </div>
      
      {predictions.length === 0 ? (
        <motion.div className="glass-panel" style={{ padding: '40px', textAlign: 'center', marginTop: '32px' }} variants={itemVariants}>
          <div style={{ display: 'inline-flex', padding: '24px', backgroundColor: 'var(--bg-tertiary)', borderRadius: '50%', marginBottom: '24px' }}>
            <Target size={48} color="var(--primary-color)" />
          </div>
          <h2 style={{ marginBottom: '16px', fontSize: '28px' }}>Not enough data yet!</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '32px', maxWidth: '500px', margin: '0 auto 32px' }}>
            We need a complete profile footprint to generate your AI Matrix. Head over to your profile and drop your resume to begin analyzing probabilities.
          </p>
          <Link to="/profile" className="btn-primary" style={{ width: 'auto', padding: '14px 32px' }}>Initialize AI Matrix</Link>
        </motion.div>
      ) : (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(12, 1fr)', 
          gap: '24px',
          gridAutoRows: 'minmax(150px, auto)'
        }}>
          
          {/* Top Metric - Master Probability */}
          <motion.div className="glass-panel" style={{ gridColumn: 'span 4', display: 'flex', flexDirection: 'column', justifyContent: 'center' }} variants={itemVariants}>
            <h4 style={{color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px', fontSize: '13px' }}>Master Probability</h4>
            <div style={{ fontSize: '84px', fontFamily: 'Outfit', fontWeight: 'bold', margin: '8px 0', color: 'var(--primary-color)', lineHeight: 1 }}>
              {latest.predictionResult.percentage}<span style={{fontSize: '40px', color: 'var(--text-secondary)'}}>%</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: 'auto' }}>
              <span className={`badge ${latest.predictionResult.category}`} style={{ padding: '6px 16px', fontSize: '14px' }}>
                {latest.predictionResult.category} Tier
              </span>
              {growth !== 0 && (
                <span style={{ display: 'flex', alignItems: 'center', color: growth > 0 ? 'var(--success)' : 'var(--error)', fontSize: '14px', fontWeight: 600 }}>
                  <TrendingUp size={16} style={{ marginRight: '4px', transform: growth < 0 ? 'scaleY(-1)' : 'none' }} />
                  {Math.abs(growth)}% vs last
                </span>
              )}
            </div>
          </motion.div>

          {/* Actionable Intel panel */}
          <motion.div className="glass-panel" style={{ gridColumn: 'span 4', backgroundColor: 'var(--primary-color)', color: 'white', border: 'none', position: 'relative', overflow: 'hidden' }} variants={itemVariants}>
            <div style={{ position: 'relative', zIndex: 2 }}>
              <h4 style={{ color: 'rgba(255,255,255,0.8)', textTransform: 'uppercase', letterSpacing: '1px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertCircle size={16}/> Action Intel
              </h4>
              <p style={{ marginTop: '24px', fontSize: '20px', fontWeight: 500, lineHeight: 1.4 }}>
                Your {weakSkill} is holding back your FAANG eligibility.
              </p>
              <div style={{ marginTop: '32px', backgroundColor: 'rgba(255,255,255,0.2)', padding: '16px', borderRadius: '12px' }}>
                <p style={{ fontSize: '14px', fontWeight: 500 }}>Target Objective:</p>
                <p style={{ fontSize: '13px', opacity: 0.9, marginTop: '4px' }}>Boost {weakSkill} to increase overall probability by ~12%.</p>
              </div>
            </div>
            {/* Background decorative blob */}
            <div style={{ position: 'absolute', top: '-50%', right: '-30%', width: '300px', height: '300px', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '50%', zIndex: 1 }} />
          </motion.div>

          {/* Peer Percentile */}
          <motion.div className="glass-panel" style={{ gridColumn: 'span 4', display: 'flex', flexDirection: 'column', justifyContent: 'center' }} variants={itemVariants}>
             <h4 style={{color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
               <Users size={16}/> Peer Comparison
             </h4>
             <div style={{ marginTop: '24px' }}>
               <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                 <span style={{ fontSize: '56px', fontFamily: 'Outfit', fontWeight: 600 }}>Top {100 - percentile}%</span>
               </div>
               <p style={{ color: 'var(--text-secondary)', marginTop: '8px', fontSize: '14px' }}>
                 You rank higher than {percentile}% of current applicants in our model matrix.
               </p>
             </div>
             {/* Simple visual bar */}
             <div style={{ height: '8px', width: '100%', backgroundColor: 'var(--border-color)', borderRadius: '4px', marginTop: 'auto', position: 'relative' }}>
                <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `${percentile}%`, backgroundColor: 'var(--secondary-color)', borderRadius: '4px' }} />
                <div style={{ position: 'absolute', left: `${percentile}%`, top: '-4px', width: '16px', height: '16px', backgroundColor: 'var(--primary-color)', borderRadius: '50%', transform: 'translateX(-50%)', border: '3px solid white', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }} />
             </div>
          </motion.div>

          {/* Radar Chart */}
          <motion.div className="glass-panel" style={{ gridColumn: 'span 5', gridRow: 'span 2' }} variants={itemVariants}>
            <h4 style={{color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px', fontSize: '13px', marginBottom: '16px' }}>Competency Matrix</h4>
            <div style={{ height: 'calc(100% - 35px)', width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                  <PolarGrid stroke="rgba(0,0,0,0.06)" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: 'var(--text-secondary)', fontSize: 11, fontWeight: 500 }} />
                  <Tooltip contentStyle={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', borderRadius: '12px', boxShadow: '0 8px 24px rgba(0,0,0,0.08)' }} />
                  <Radar name="Student Profile" dataKey="A" stroke="var(--primary-color)" fill="var(--primary-color)" fillOpacity={0.15} strokeWidth={2} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Industry Tier Match */}
          <motion.div className="glass-panel" style={{ gridColumn: 'span 7' }} variants={itemVariants}>
            <h4 style={{color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px', fontSize: '13px', marginBottom: '16px' }}>Industry Tier Compatibility</h4>
            <div style={{ height: '220px', width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={industryData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(0,0,0,0.04)" />
                  <XAxis type="number" domain={[0, 100]} hide />
                  <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-primary)', fontWeight: 500 }} width={80} />
                  <Tooltip cursor={{fill: 'rgba(0,0,0,0.02)'}} contentStyle={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', borderRadius: '12px' }} />
                  <Bar dataKey="probability" radius={[0, 8, 8, 0]} barSize={24}>
                    {industryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index === 3 ? 'var(--primary-color)' : index === 2 ? 'var(--warning)' : index === 1 ? 'var(--secondary-color)' : 'rgba(74, 107, 93, 0.4)'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Timeline / Trajectory */}
          <motion.div className="glass-panel" style={{ gridColumn: 'span 7' }} variants={itemVariants}>
            <h4 style={{color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px', fontSize: '13px', marginBottom: '16px' }}>Growth Trajectory</h4>
            <div style={{ height: '220px', width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={lineData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.04)" />
                  <XAxis dataKey="name" stroke="var(--text-secondary)" tick={{fontSize: 12}} axisLine={false} tickLine={false} dy={10} />
                  <YAxis stroke="var(--text-secondary)" domain={[0, 100]} tick={{fontSize: 12}} axisLine={false} tickLine={false} dx={-10} />
                  <Tooltip contentStyle={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', borderRadius: '12px', boxShadow: '0 8px 24px rgba(0,0,0,0.08)' }} />
                  <Line type="monotone" dataKey="Score" stroke="var(--secondary-color)" strokeWidth={3} activeDot={{ r: 8, fill: 'var(--primary-color)' }} dot={{ r: 4, strokeWidth: 2, fill: '#fff', stroke: 'var(--secondary-color)' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Recommended Companies Section */}
          <motion.div className="glass-panel" style={{ gridColumn: 'span 12', marginTop: '12px' }} variants={itemVariants}>
            <h4 style={{color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px', fontSize: '13px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
               <Briefcase size={16}/> Target Opportunities Based on Prediction: {latest.predictionResult.category} Tier
            </h4>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
              {latest.predictionResult.careerMatches?.companies?.map((companyObj, idx) => {
                const isLegacy = typeof companyObj === 'string';
                const name = isLegacy ? companyObj : companyObj.name;
                const type = isLegacy ? 'Verified Firm' : companyObj.type;
                const link = isLegacy ? '#' : companyObj.link;
                const isProduct = type.includes('Product');
                
                return (
                <motion.div 
                  key={idx} 
                  whileHover={{ y: -5, boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)' }}
                  style={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.03)', 
                    border: '1px solid var(--border-color)', 
                    borderRadius: '12px', 
                    padding: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                >
                  {/* Type Badge */}
                  <div style={{ position: 'absolute', top: 0, right: 0, padding: '4px 12px', backgroundColor: isProduct ? 'rgba(88, 101, 242, 0.2)' : 'rgba(235, 169, 13, 0.2)', color: isProduct ? '#a5b4fc' : '#fde047', fontSize: '10px', fontWeight: 600, borderBottomLeftRadius: '12px', textTransform: 'uppercase' }}>
                     {type}
                  </div>

                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '8px', backgroundColor: 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Building2 size={20} color="var(--primary-color)" />
                      </div>
                      <div>
                        <h3 style={{ fontSize: '18px', fontWeight: 600 }}>{name}</h3>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
                          {latest.predictionResult.careerMatches?.roles?.[0] || 'Software Engineer'}
                        </p>
                      </div>
                    </div>
                    
                    <div style={{ padding: '12px', backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: '8px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between' }}>
                      <div>
                        <p style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Expected Package</p>
                        <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--secondary-color)' }}>{latest.predictionResult.careerMatches?.expectedPackage}</p>
                      </div>
                    </div>
                  </div>

                  <a href={link} target="_blank" rel="noopener noreferrer" className="btn-secondary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '10px', textDecoration: 'none', backgroundColor: 'transparent', border: '1px solid rgba(255,255,255,0.1)', pointerEvents: isLegacy ? 'none' : 'auto', opacity: isLegacy ? 0.5 : 1 }} data-html2canvas-ignore="true">
                    Apply Now <ExternalLink size={14} />
                  </a>
                </motion.div>
              )})}
            </div>
            
            {(!latest.predictionResult.careerMatches?.companies || latest.predictionResult.careerMatches.companies.length === 0) && (
               <p style={{color: 'var(--text-secondary)'}}>No specific companies found for this prediction.</p>
            )}
          </motion.div>

        </div>
      )}
    </motion.div>
  );
}

export default Dashboard;
