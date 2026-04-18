import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BACKEND_ORIGIN } from '../services/api';

function Signup() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('student');
  const [error, setError] = useState('');
  const { register } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await register(name, email, password, role);
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
    }
  };

  return (
    <div className="flex-center" style={{ minHeight: '80vh', padding: '40px 0' }}>
      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ duration: 0.5, ease: "easeOut" }} 
        className="glass-panel" 
        style={{ width: '100%', maxWidth: '420px' }}
      >
        <h2 className="text-gradient" style={{ textAlign: 'center', marginBottom: '32px', fontSize: '32px' }}>Create Account</h2>
        
        <a href={`${BACKEND_ORIGIN}/api/auth/google`} className="btn-social google">
          <img src="https://www.google.com/favicon.ico" width="20" alt="Google" style={{ borderRadius: '50%' }} /> 
          Sign up with Google
        </a>
        <a href={`${BACKEND_ORIGIN}/api/auth/facebook`} className="btn-social facebook">
          <img src="https://www.facebook.com/favicon.ico" width="20" alt="Facebook" style={{ borderRadius: '50%' }} /> 
          Sign up with Facebook
        </a>
        
        <div style={{ display: 'flex', alignItems: 'center', margin: '24px 0' }}>
          <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border-color)' }}></div>
          <span style={{ padding: '0 16px', color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>or register with email</span>
          <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border-color)' }}></div>
        </div>

        {error && <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} style={{ color: 'var(--error)', marginBottom: '16px', textAlign: 'center', fontSize: '14px', backgroundColor: 'rgba(224, 82, 67, 0.1)', padding: '10px', borderRadius: '8px' }}>{error}</motion.div>}
        
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <label>Full Name</label>
            <input type="text" placeholder="John Doe" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div style={{ marginBottom: '16px' }}>
            <label>Email Address</label>
            <input type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div style={{ marginBottom: '16px' }}>
            <label>Password</label>
            <input type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          <div style={{ marginBottom: '24px' }}>
            <label>Account Type</label>
            <select value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="student">Student</option>
              <option value="admin">Administrator</option>
            </select>
          </div>
          <button type="submit" className="btn-primary">Sign Up</button>
        </form>
        
        <div style={{ textAlign: 'center', marginTop: '32px', fontSize: '14px' }}>
          <span style={{ color: 'var(--text-secondary)' }}>Already have an account? </span>
          <Link to="/login" style={{ color: 'var(--primary-color)', fontWeight: '600' }}>Log in here</Link>
        </div>
      </motion.div>
    </div>
  );
}

export default Signup;
