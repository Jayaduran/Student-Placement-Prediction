import React, { useState, useEffect, useMemo } from 'react';
import api from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Activity, HardDrive, Trash2, Search, FileUp, Settings as SettingsIcon, Edit2, X, Download, RefreshCcw } from 'lucide-react';

function AdminPanel() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [joinedFilter, setJoinedFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [page, setPage] = useState(1);
  const limit = 5;

  // Modals state
  const [editModal, setEditModal] = useState({ isOpen: false, studentId: null, data: {} });
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, studentId: null });
  const [savingEdit, setSavingEdit] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async (showLoader = true) => {
    if (showLoader) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }

    try {
      const res = await api.get('/admin/students');
      setStudents(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      if (showLoader) {
        setLoading(false);
      } else {
        setRefreshing(false);
      }
    }
  };

  const toCsvValue = (value) => {
    const safe = String(value ?? '').replace(/"/g, '""');
    return `"${safe}"`;
  };

  const exportFilteredStudents = () => {
    if (!filteredStudents.length) return;

    const header = ['Name', 'Email', 'Joined Date'];
    const rows = filteredStudents.map((student) => [
      student.name,
      student.email,
      new Date(student.createdAt).toLocaleDateString()
    ]);

    const csv = [
      header.map(toCsvValue).join(','),
      ...rows.map((row) => row.map(toCsvValue).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `students-${Date.now()}.csv`;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const confirmDelete = async () => {
    if (!deleteModal.studentId) return;
    setDeleting(true);
    try {
      await api.delete(`/admin/students/${deleteModal.studentId}`);
      setDeleteModal({ isOpen: false, studentId: null });
      fetchStudents();
    } catch (err) {
      alert('Error deleting student: ' + (err.response?.data?.error || err.message));
    } finally {
      setDeleting(false);
    }
  };

  const toNumberOrUndefined = (value) => {
    if (value === '' || value === null || value === undefined) return undefined;
    const num = Number(value);
    return Number.isNaN(num) ? undefined : num;
  };

  const openEditModal = (student) => {
    const p = student.profile || {};
    setEditModal({
      isOpen: true,
      studentId: student._id,
      data: {
        cgpa: p.cgpa ?? '',
        leetcodeRating: p.leetcodeRating ?? '',
        projects: p.projects ?? '',
        internships: p.internships ?? '',
        hackathons: p.hackathons ?? ''
      }
    });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editModal.studentId) return;
    setSavingEdit(true);

    const payload = {
      cgpa: toNumberOrUndefined(editModal.data.cgpa),
      leetcodeRating: toNumberOrUndefined(editModal.data.leetcodeRating),
      projects: toNumberOrUndefined(editModal.data.projects),
      internships: toNumberOrUndefined(editModal.data.internships),
      hackathons: toNumberOrUndefined(editModal.data.hackathons)
    };

    try {
      await api.put(`/admin/students/${editModal.studentId}/profile`, payload);
      setEditModal({ isOpen: false, studentId: null, data: {} });
      alert('Leaderboard profile updated successfully.');
      fetchStudents();
    } catch (err) {
      alert('Error updating profile: ' + (err.response?.data?.error || err.message));
    } finally {
      setSavingEdit(false);
    }
  };

  const filteredStudents = useMemo(() => {
    const now = Date.now();
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
    const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;

    const filtered = students.filter((student) => {
      const matchesSearch =
        student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.email.toLowerCase().includes(searchTerm.toLowerCase());

      if (!matchesSearch) return false;
      if (joinedFilter === 'all') return true;

      const ageMs = now - new Date(student.createdAt).getTime();
      if (joinedFilter === '7d') return ageMs <= sevenDaysMs;
      if (joinedFilter === '30d') return ageMs <= thirtyDaysMs;

      return true;
    });

    const sorted = [...filtered].sort((a, b) => {
      if (sortBy === 'name-asc') return a.name.localeCompare(b.name);
      if (sortBy === 'name-desc') return b.name.localeCompare(a.name);
      if (sortBy === 'oldest') return new Date(a.createdAt) - new Date(b.createdAt);
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

    return sorted;
  }, [students, searchTerm, joinedFilter, sortBy]);

  const newThisWeekCount = useMemo(() => {
    const now = Date.now();
    const weekMs = 7 * 24 * 60 * 60 * 1000;
    return students.filter((student) => now - new Date(student.createdAt).getTime() <= weekMs).length;
  }, [students]);

  const paginatedStudents = filteredStudents.slice((page - 1) * limit, page * limit);
  const totalPages = Math.ceil(filteredStudents.length / limit) || 1;

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  const modalOverlayVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 }
  };

  return (
    <motion.div initial="hidden" animate="show" variants={containerVariants} style={{ paddingBottom: '60px' }}>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
        <SettingsIcon size={32} color="var(--primary-color)" />
        <h1 className="text-gradient" style={{ margin: 0 }}>Command Center</h1>
      </div>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '32px' }}>
        System management, analytics, and leaderboard controls.
      </p>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px', marginBottom: '32px' }}>
        <motion.div className="glass-panel" variants={itemVariants} style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ padding: '16px', backgroundColor: 'rgba(217, 108, 83, 0.1)', borderRadius: '12px', display: 'flex', color: 'var(--primary-color)' }}>
            <Users size={28} />
          </div>
          <div>
            <h4 style={{ color: 'var(--text-secondary)', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '1px' }}>Registered Students</h4>
            <div style={{ fontSize: '32px', fontWeight: 600, fontFamily: 'Outfit' }}>{students.length}</div>
          </div>
        </motion.div>

        <motion.div className="glass-panel" variants={itemVariants} style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ padding: '16px', backgroundColor: 'rgba(74, 107, 93, 0.1)', borderRadius: '12px', display: 'flex', color: 'var(--secondary-color)' }}>
            <Activity size={28} />
          </div>
          <div>
            <h4 style={{ color: 'var(--text-secondary)', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '1px' }}>New This Week</h4>
            <div style={{ fontSize: '32px', fontWeight: 600, fontFamily: 'Outfit', color: 'var(--success)' }}>{newThisWeekCount}</div>
          </div>
        </motion.div>

        <motion.div className="glass-panel" variants={itemVariants} style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '20px' }}>
           <div style={{ padding: '16px', backgroundColor: 'rgba(226, 149, 71, 0.1)', borderRadius: '12px', display: 'flex', color: 'var(--warning)' }}>
            <HardDrive size={28} />
          </div>
          <div>
            <h4 style={{ color: 'var(--text-secondary)', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '1px' }}>Filtered View</h4>
            <div style={{ fontSize: '32px', fontWeight: 600, fontFamily: 'Outfit' }}>{filteredStudents.length}</div>
          </div>
        </motion.div>
      </div>
      
      {/* Table Section */}
      <motion.div className="glass-panel" variants={itemVariants} style={{ padding: '32px', position: 'relative' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h3 style={{ fontSize: '20px', marginBottom: '4px' }}>Student Database</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Manage profiles, edit leaderboard metrics, or purge accounts.</p>
          </div>
          
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative' }}>
              <Search size={16} color="var(--text-secondary)" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
              <input 
                type="text" 
                placeholder="Search students..." 
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
                style={{ width: '240px', margin: 0, paddingLeft: '42px', borderRadius: '24px' }}
              />
            </div>

            <select
              value={joinedFilter}
              onChange={(e) => {
                setJoinedFilter(e.target.value);
                setPage(1);
              }}
              style={{ width: '170px', margin: 0, borderRadius: '10px' }}
            >
              <option value="all">Joined: Any Time</option>
              <option value="7d">Joined: Last 7 Days</option>
              <option value="30d">Joined: Last 30 Days</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              style={{ width: '170px', margin: 0, borderRadius: '10px' }}
            >
              <option value="newest">Sort: Newest</option>
              <option value="oldest">Sort: Oldest</option>
              <option value="name-asc">Sort: Name A-Z</option>
              <option value="name-desc">Sort: Name Z-A</option>
            </select>

            <button
              className="btn-secondary"
              onClick={() => fetchStudents(false)}
              disabled={refreshing}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 12px', border: '1px solid var(--border-color)' }}
              title="Refresh student list"
            >
              <RefreshCcw size={15} />
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </button>

            <button
              className="btn-secondary"
              onClick={exportFilteredStudents}
              disabled={!filteredStudents.length}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 12px', border: '1px solid var(--border-color)' }}
              title="Export filtered rows"
            >
              <Download size={15} />
              Export CSV
            </button>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>Loading students...</div>
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={{ padding: '16px', borderBottom: '2px solid var(--border-color)', textAlign: 'left', color: 'var(--text-secondary)', fontSize: '12px', textTransform: 'uppercase' }}>Student Name</th>
                    <th style={{ padding: '16px', borderBottom: '2px solid var(--border-color)', textAlign: 'left', color: 'var(--text-secondary)', fontSize: '12px', textTransform: 'uppercase' }}>Email Address</th>
                    <th style={{ padding: '16px', borderBottom: '2px solid var(--border-color)', textAlign: 'left', color: 'var(--text-secondary)', fontSize: '12px', textTransform: 'uppercase' }}>Joined Date</th>
                    <th style={{ padding: '16px', borderBottom: '2px solid var(--border-color)', textAlign: 'right', color: 'var(--text-secondary)', fontSize: '12px', textTransform: 'uppercase' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedStudents.length === 0 ? (
                    <tr><td colSpan="4" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>No matching entries found.</td></tr>
                  ) : (
                    paginatedStudents.map(student => (
                      <motion.tr key={student._id} whileHover={{ backgroundColor: 'var(--bg-tertiary)' }} transition={{ duration: 0.1 }}>
                        <td style={{ padding: '16px', borderBottom: '1px solid var(--border-color)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: 'var(--primary-color)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 600 }}>
                              {student.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                            </div>
                            <span style={{ fontWeight: 600 }}>{student.name}</span>
                          </div>
                        </td>
                        <td style={{ padding: '16px', borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>{student.email}</td>
                        <td style={{ padding: '16px', borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>{new Date(student.createdAt).toLocaleDateString()}</td>
                        <td style={{ padding: '16px', borderBottom: '1px solid var(--border-color)', textAlign: 'right' }}>
                          
                          {/* Edit Profile Button */}
                          <button 
                            onClick={() => openEditModal(student)} 
                            style={{ background: 'rgba(74, 107, 93, 0.08)', border: '1px solid rgba(74, 107, 93, 0.35)', padding: '8px', borderRadius: '10px', color: 'var(--secondary-color)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginRight: '8px', transition: 'all 0.2s ease' }}
                            title="Edit Leaderboard Stats"
                          >
                            <Edit2 size={16} />
                          </button>

                          {/* Delete Button */}
                          <button 
                            onClick={() => setDeleteModal({ isOpen: true, studentId: student._id })} 
                            style={{ background: 'rgba(224, 82, 67, 0.08)', border: '1px solid rgba(224, 82, 67, 0.35)', padding: '8px', borderRadius: '10px', color: 'var(--error)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s ease' }}
                            title="Delete Student"
                          >
                            <Trash2 size={16} />
                          </button>

                        </td>
                      </motion.tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            
            {filteredStudents.length > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '24px' }}>
                <button className="btn-secondary" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={{ padding: '8px 16px' }}>Previous</button>
                <div style={{ display: 'flex', gap: '4px' }}>
                  {Array.from({ length: totalPages }).map((_, i) => (
                    <button 
                      key={i} 
                      onClick={() => setPage(i + 1)} 
                      style={{ width: '32px', height: '32px', borderRadius: '8px', border: 'none', background: page === i + 1 ? 'var(--primary-color)' : 'var(--bg-tertiary)', color: page === i + 1 ? 'white' : 'var(--text-primary)', cursor: 'pointer', fontWeight: 600 }}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
                <button className="btn-secondary" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages} style={{ padding: '8px 16px' }}>Next</button>
              </div>
            )}
          </>
        )}
      </motion.div>


      {/* Delete Confirmation Modal Overlay */}
      <AnimatePresence>
        {deleteModal.isOpen && (
          <motion.div 
            initial="hidden" animate="visible" exit="hidden" variants={modalOverlayVariants}
            style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
          >
            <div className="glass-panel" style={{ padding: '32px', maxWidth: '400px', width: '90%', textAlign: 'center' }}>
              <Trash2 size={48} color="var(--error)" style={{ marginBottom: '16px' }} />
              <h3>Confirm Deletion</h3>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>Are you strictly sure you want to purge this user and all related records? This action cannot be undone.</p>
              <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
                <button className="btn-secondary" onClick={() => setDeleteModal({ isOpen: false, studentId: null })}>Cancel</button>
                <button className="btn-primary" onClick={confirmDelete} disabled={deleting} style={{ backgroundColor: 'var(--error)' }}>{deleting ? 'Deleting...' : 'Purge Record'}</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Profile Modal Overlay */}
      <AnimatePresence>
        {editModal.isOpen && (
          <motion.div 
            initial="hidden" animate="visible" exit="hidden" variants={modalOverlayVariants}
            style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
          >
            <div className="glass-panel" style={{ padding: '32px', maxWidth: '500px', width: '90%', position: 'relative' }}>
              <button onClick={() => setEditModal({ isOpen: false, studentId: null, data: {} })} style={{ position: 'absolute', top: '24px', right: '24px', background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                <X size={24} />
              </button>
              <h3 style={{ marginBottom: '8px' }}>Adjust Leaderboard Stats</h3>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', fontSize: '14px' }}>Modify the student's base profile metrics to update their leaderboard position globally.</p>
              
              <form onSubmit={handleEditSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 600 }}>CGPA Override</label>
                    <input type="number" step="0.1" value={editModal.data.cgpa || ''} onChange={(e) => setEditModal(p => ({...p, data: {...p.data, cgpa: e.target.value}}))} placeholder="e.g. 9.2" />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 600 }}>LeetCode Rating</label>
                    <input type="number" value={editModal.data.leetcodeRating || ''} onChange={(e) => setEditModal(p => ({...p, data: {...p.data, leetcodeRating: e.target.value}}))} placeholder="e.g. 1850" />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 600 }}>Total Projects</label>
                    <input type="number" value={editModal.data.projects || ''} onChange={(e) => setEditModal(p => ({...p, data: {...p.data, projects: e.target.value}}))} placeholder="e.g. 4" />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 600 }}>Internships</label>
                    <input type="number" value={editModal.data.internships || ''} onChange={(e) => setEditModal(p => ({...p, data: {...p.data, internships: e.target.value}}))} placeholder="e.g. 1" />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 600 }}>Hackathons</label>
                    <input type="number" value={editModal.data.hackathons || ''} onChange={(e) => setEditModal(p => ({...p, data: {...p.data, hackathons: e.target.value}}))} placeholder="e.g. 2" />
                  </div>
                </div>
                
                <button type="submit" className="btn-primary" disabled={savingEdit} style={{ marginTop: '16px' }}>{savingEdit ? 'Saving...' : 'Save Changes'}</button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </motion.div>
  );
}

export default AdminPanel;
