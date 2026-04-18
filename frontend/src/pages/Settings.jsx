import React, { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { motion } from 'framer-motion';
import { User, Bell, Shield, Moon, Monitor, CreditCard } from 'lucide-react';

function Settings() {
  const { user } = useContext(AuthContext);
  const { theme, setTheme } = useTheme();

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <motion.div initial="hidden" animate="show" variants={containerVariants} style={{ padding: '16px', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 className="text-gradient">Account Settings</h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: '8px' }}>Manage your preferences and personal information.</p>
      </div>

      <div style={{ display: 'grid', gap: '24px' }}>
        {/* Profile Section */}
        <motion.div className="glass-panel" variants={itemVariants} style={{ padding: '24px' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
            <User size={20} color="var(--primary-color)" /> Profile Information
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label>Full Name</label>
              <input type="text" value={user?.name || ''} disabled style={{ backgroundColor: 'var(--bg-primary)', opacity: 0.7 }} />
            </div>
            <div>
              <label>Email Address</label>
              <input type="email" value={user?.email || ''} disabled style={{ backgroundColor: 'var(--bg-primary)', opacity: 0.7 }} />
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
            <button className="btn-secondary" style={{ opacity: 0.5, cursor: 'not-allowed' }}>Update Profile</button>
          </div>
        </motion.div>

        {/* Preferences Section */}
        <motion.div className="glass-panel" variants={itemVariants} style={{ padding: '24px' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
            <Monitor size={20} color="var(--primary-color)" /> Display Preferences
          </h3>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', backgroundColor: 'var(--bg-primary)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
            <div>
              <h4 style={{ fontSize: '15px' }}>Theme Selection</h4>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>Switch between Light and Dark mode.</p>
            </div>
            <select style={{ width: 'auto', marginBottom: 0 }} value={theme} onChange={(e) => setTheme(e.target.value)}>
              <option value="system">System Default</option>
              <option value="light">Light Mode</option>
              <option value="dark">Dark Mode</option>
            </select>
          </div>
        </motion.div>

        {/* Notifications */}
        <motion.div className="glass-panel" variants={itemVariants} style={{ padding: '24px' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
            <Bell size={20} color="var(--primary-color)" /> Notifications
          </h3>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', borderBottom: '1px solid var(--border-color)' }}>
            <div>
              <h4 style={{ fontSize: '15px' }}>Email Alerts</h4>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>Receive emails about placement predictions.</p>
            </div>
            <input type="checkbox" defaultChecked style={{ width: '20px', height: '20px', marginBottom: 0 }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px' }}>
            <div>
              <h4 style={{ fontSize: '15px' }}>Marketing Updates</h4>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>Receive occasional promotional material.</p>
            </div>
            <input type="checkbox" style={{ width: '20px', height: '20px', marginBottom: 0 }} />
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

export default Settings;
