import React, { useState, useEffect, useContext } from 'react';
import api from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Medal, Award, Activity, Search, ChevronDown, ChevronUp, Code, Briefcase, MessageSquare, Edit2, Trash2, X } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';

function Leaderboard() {
  const { user } = useContext(AuthContext);
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [expandedId, setExpandedId] = useState(null);
  const [editModal, setEditModal] = useState({
    isOpen: false,
    userId: null,
    data: { cgpa: '', leetcodeRating: '', projects: '', internships: '', hackathons: '' }
  });
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, userId: null, name: '' });

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      const res = await api.get('/profile/leaderboard');
      if (res.data.length < 3) {
        setLeaders([
          ...res.data,
          { _id: 'fake1', userId: 'fake1', name: 'Sarah Connor', score: 92, category: 'Exceptional', cgpa: 9.4, leetcode: 2100, projects: 5, internships: 2, communication: 9 },
          { _id: 'fake2', userId: 'fake2', name: 'John Doe', score: 85, category: 'High', cgpa: 8.9, leetcode: 1650, projects: 3, internships: 1, communication: 8 },
          { _id: 'fake3', userId: 'fake3', name: 'Alice Smith', score: 76, category: 'Medium', cgpa: 7.8, leetcode: 1200, projects: 2, internships: 0, communication: 7 },
          { _id: 'fake4', userId: 'fake4', name: 'Bob Johnson', score: 65, category: 'Medium', cgpa: 6.9, leetcode: 950, projects: 1, internships: 0, communication: 6 }
        ].sort((a,b) => b.score - a.score));
      } else {
        setLeaders(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredLeaders = leaders.filter(student => {
    const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = activeCategory === 'All' || student.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const closeEditModal = () => {
    setEditModal({
      isOpen: false,
      userId: null,
      data: { cgpa: '', leetcodeRating: '', projects: '', internships: '', hackathons: '' }
    });
  };

  const openEditModal = (student) => {
    const id = student.userId || student._id;
    if (!id || String(id).startsWith('fake')) {
      alert('Demo rows cannot be edited.');
      return;
    }

    setEditModal({
      isOpen: true,
      userId: id,
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
      closeEditModal();
      fetchLeaderboard();
    } catch (err) {
      alert('Failed to update leaderboard profile: ' + err.message);
    }
  };

  const confirmDelete = async () => {
    if (!deleteModal.userId) return;
    try {
      await api.delete(`/admin/students/${deleteModal.userId}`);
      setDeleteModal({ isOpen: false, userId: null, name: '' });
      fetchLeaderboard();
    } catch (err) {
      alert('Failed to delete student: ' + err.message);
    }
  };

  const getRankIcon = (index) => {
    switch(index) {
      case 0: return <Trophy size={28} color="#FFD700" style={{ filter: 'drop-shadow(0 4px 6px rgba(255, 215, 0, 0.4))' }} />;
      case 1: return <Medal size={28} color="#C0C0C0" />;
      case 2: return <Award size={28} color="#CD7F32" />;
      default: return <span style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--text-secondary)', padding: '0 8px' }}>#{index + 1}</span>;
    }
  };

  const getRankStyle = (index) => {
    if (index === 0) return { background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.1), rgba(255, 215, 0, 0.05))', border: '1px solid rgba(255, 215, 0, 0.3)' };
    if (index === 1) return { background: 'linear-gradient(135deg, rgba(192, 192, 192, 0.1), rgba(192, 192, 192, 0.05))', border: '1px solid rgba(192, 192, 192, 0.3)' };
    if (index === 2) return { background: 'linear-gradient(135deg, rgba(205, 127, 50, 0.1), rgba(205, 127, 50, 0.05))', border: '1px solid rgba(205, 127, 50, 0.3)' };
    return {};
  };

  if (loading) return <div className="container flex-center" style={{minHeight: '60vh'}}>Loading Matrix...</div>;

  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ maxWidth: '800px', margin: '0 auto', paddingBottom: '60px' }}>
      
      <div style={{ textAlign: 'center', marginBottom: '48px' }}>
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={{ display: 'inline-flex', padding: '24px', backgroundColor: 'var(--bg-tertiary)', borderRadius: '50%', marginBottom: '24px' }}>
          <Activity size={48} color="var(--primary-color)" />
        </motion.div>
        <h1 className="text-gradient" style={{ fontSize: '42px', marginBottom: '16px' }}>Global Leaderboard</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '16px', maxWidth: '500px', margin: '0 auto' }}>
          Real-time global rankings based on the AI Placement Probability matrix.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '32px' }}>
        
        {/* Search Bar */}
        <div style={{ position: 'relative' }}>
          <Search size={20} color="var(--text-secondary)" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
          <input 
            type="text" 
            placeholder="Search candidates by name..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '100%', padding: '16px 16px 16px 48px', borderRadius: '12px', border: '1px solid var(--border-color)', backgroundColor: 'var(--surface-color)', fontSize: '16px' }}
          />
        </div>

        {/* Tab Filters */}
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            {['All', 'Exceptional', 'High', 'Medium', 'Low'].map(cat => (
            <button 
              key={cat} 
              onClick={() => setActiveCategory(cat)}
              style={{
                padding: '8px 24px',
                borderRadius: '24px',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 500,
                backgroundColor: activeCategory === cat ? 'var(--primary-color)' : 'var(--bg-secondary)',
                color: activeCategory === cat ? '#fff' : 'var(--text-secondary)',
                transition: 'all 0.2s ease'
              }}
            >
              {cat}
            </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <AnimatePresence>
          {filteredLeaders.length === 0 ? (
            <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} style={{textAlign:'center', padding: '40px', color: 'var(--text-secondary)'}}>
              No candidates found matching those criteria.
            </motion.div>
          ) : (
            filteredLeaders.map((student, index) => {
              const rowId = student.userId || student._id;
              const isExpanded = expandedId === rowId;
              
              return (
                <motion.div 
                  key={rowId || index}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3 }}
                  className="glass-panel" 
                  style={{ 
                    padding: '24px 32px', 
                    cursor: 'pointer',
                    userSelect: 'none',
                    ...getRankStyle(index) 
                  }}
                  onClick={() => setExpandedId(isExpanded ? null : rowId)}
                  whileHover={{ x: 5, boxShadow: '0 8px 30px rgba(0,0,0,0.05)' }}
                >
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                    <div style={{ width: '40px', display: 'flex', justifyContent: 'center' }}>
                      {getRankIcon(index)}
                    </div>
                    
                    <div style={{ flex: 1 }}>
                      <h3 style={{ fontSize: '18px', fontWeight: 600, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {student.name}
                        {index === 0 && activeCategory === 'All' && !searchTerm && <span style={{ fontSize: '10px', backgroundColor: '#FFD700', color: '#000', padding: '2px 8px', borderRadius: '12px', fontWeight: 'bold', textTransform: 'uppercase' }}>Top 1%</span>}
                        {student.category && <span className={`badge ${student.category}`} style={{ fontSize: '11px', padding: '2px 8px' }}>{student.category}</span>}
                      </h3>
                      <div style={{ display: 'flex', gap: '16px', marginTop: '8px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                        <span>CGPA: <strong style={{ color: 'var(--text-primary)' }}>{student.cgpa}</strong></span>
                        <span>LeetCode: <strong style={{ color: 'var(--text-primary)' }}>{student.leetcode || 'N/A'}</strong></span>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <div>
                         <div style={{ fontSize: '32px', fontFamily: 'Outfit', fontWeight: 'bold', color: 'var(--primary-color)', lineHeight: 1 }}>
                           {Math.round(student.score)}%
                         </div>
                         <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                           Match
                         </div>
                      </div>
                      {user?.role === 'admin' && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }} onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => openEditModal(student)}
                            style={{ background: 'transparent', border: '1px solid rgba(74, 107, 93, 0.3)', color: 'var(--secondary-color)', borderRadius: '8px', padding: '6px', cursor: 'pointer' }}
                            title="Edit"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => {
                              const id = student.userId || student._id;
                              if (!id || String(id).startsWith('fake')) {
                                alert('Demo rows cannot be deleted.');
                                return;
                              }
                              setDeleteModal({ isOpen: true, userId: id, name: student.name });
                            }}
                            style={{ background: 'transparent', border: '1px solid rgba(224, 82, 67, 0.3)', color: 'var(--error)', borderRadius: '8px', padding: '6px', cursor: 'pointer' }}
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      )}
                      <div style={{ color: 'var(--text-secondary)' }}>
                        {isExpanded ? <ChevronUp size={24}/> : <ChevronDown size={24}/>}
                      </div>
                    </div>
                  </div>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        style={{ overflow: 'hidden' }}
                      >
                        <div style={{ marginTop: '24px', paddingTop: '24px', borderTop: '1px solid var(--border-color)', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                          
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', backgroundColor: 'var(--bg-secondary)', borderRadius: '12px' }}>
                            <Code color="var(--secondary-color)" size={24} />
                            <div>
                               <div style={{ fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Projects</div>
                               <div style={{ fontSize: '18px', fontWeight: 600 }}>{student.projects || 0} Deployed</div>
                            </div>
                          </div>
                          
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', backgroundColor: 'var(--bg-secondary)', borderRadius: '12px' }}>
                            <Briefcase color="var(--primary-color)" size={24} />
                            <div>
                               <div style={{ fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Experience</div>
                               <div style={{ fontSize: '18px', fontWeight: 600 }}>{student.internships || 0} Internships</div>
                            </div>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', backgroundColor: 'var(--bg-secondary)', borderRadius: '12px' }}>
                            <MessageSquare color="var(--warning)" size={24} />
                            <div>
                               <div style={{ fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Comm Skills</div>
                               <div style={{ fontSize: '18px', fontWeight: 600 }}>{student.communication || 0} / 10</div>
                            </div>
                          </div>

                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>

      </motion.div>

      <AnimatePresence>
        {editModal.isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
          >
            <div className="glass-panel" style={{ width: 'min(560px, 92%)', padding: '24px', position: 'relative' }}>
              <button onClick={closeEditModal} style={{ position: 'absolute', top: '16px', right: '16px', border: 'none', background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
              <h3 style={{ marginBottom: '14px' }}>Edit Leaderboard Profile</h3>

              <form onSubmit={submitEdit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <input type="number" step="0.1" placeholder="CGPA" value={editModal.data.cgpa} onChange={(e) => setEditModal((prev) => ({ ...prev, data: { ...prev.data, cgpa: e.target.value } }))} />
                <input type="number" placeholder="LeetCode Rating" value={editModal.data.leetcodeRating} onChange={(e) => setEditModal((prev) => ({ ...prev, data: { ...prev.data, leetcodeRating: e.target.value } }))} />
                <input type="number" placeholder="Projects" value={editModal.data.projects} onChange={(e) => setEditModal((prev) => ({ ...prev, data: { ...prev.data, projects: e.target.value } }))} />
                <input type="number" placeholder="Internships" value={editModal.data.internships} onChange={(e) => setEditModal((prev) => ({ ...prev, data: { ...prev.data, internships: e.target.value } }))} />
                <input type="number" placeholder="Hackathons" value={editModal.data.hackathons} onChange={(e) => setEditModal((prev) => ({ ...prev, data: { ...prev.data, hackathons: e.target.value } }))} />
                <div />
                <button type="submit" className="btn-primary" style={{ gridColumn: 'span 2' }}>Save Changes</button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {deleteModal.isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
          >
            <div className="glass-panel" style={{ width: 'min(460px, 92%)', padding: '24px' }}>
              <h3>Delete Student</h3>
              <p style={{ color: 'var(--text-secondary)', margin: '8px 0 18px' }}>
                Delete {deleteModal.name} and all related records?
              </p>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button className="btn-secondary" onClick={() => setDeleteModal({ isOpen: false, userId: null, name: '' })}>Cancel</button>
                <button className="btn-primary" onClick={confirmDelete} style={{ width: 'auto', backgroundColor: 'var(--error)' }}>Delete</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default Leaderboard;
