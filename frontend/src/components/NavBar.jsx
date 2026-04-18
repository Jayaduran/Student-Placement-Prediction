import React, { useState, useContext, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, Settings, User as UserIcon, LayoutDashboard, ChevronDown } from 'lucide-react';

function NavBar() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
    setDropdownOpen(false);
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  return (
    <nav className="navbar">
      <div className="logo">
        <h2 className="text-gradient" style={{ margin: 0 }}>PredictivePlacement</h2>
      </div>
      <div className="nav-links">
        <Link to="/">Dashboard</Link>
        <Link to="/leaderboard">Leaderboard</Link>
        {user?.role === 'student' && <Link to="/profile">My Profile</Link>}
        {user?.role === 'admin' && <Link to="/admin">Admin Panel</Link>}
        
        <div className="profile-dropdown-container" ref={dropdownRef}>
          <div 
            className="avatar-circle" 
            onClick={() => setDropdownOpen(!dropdownOpen)}
            title={user?.name || 'Profile Menu'}
          >
            {getInitials(user?.name)}
          </div>

          <AnimatePresence>
            {dropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="profile-dropdown"
              >
                <div className="dropdown-header">
                  <div className="dropdown-name">{user?.name || 'User'}</div>
                  <div className="dropdown-email">{user?.email || 'user@example.com'}</div>
                  <div style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--primary-color)', fontWeight: 600, marginTop: '4px', letterSpacing: '0.05em' }}>
                    {user?.role} Account
                  </div>
                </div>

                <div style={{ padding: '8px 0' }}>
                  <Link to="/" className="dropdown-item" onClick={() => setDropdownOpen(false)}>
                    <LayoutDashboard size={16} /> Dashboard
                  </Link>
                  {user?.role === 'student' && (
                    <Link to="/profile" className="dropdown-item" onClick={() => setDropdownOpen(false)}>
                      <UserIcon size={16} /> Profile
                    </Link>
                  )}
                  <Link to="/settings" className="dropdown-item" onClick={() => setDropdownOpen(false)}>
                    <Settings size={16} /> Settings
                  </Link>
                </div>
                
                <div style={{ padding: '8px 0', borderTop: '1px solid var(--border-color)' }}>
                  <button className="dropdown-item danger" onClick={handleLogout}>
                    <LogOut size={16} /> Logout
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </nav>
  );
}

export default NavBar;
