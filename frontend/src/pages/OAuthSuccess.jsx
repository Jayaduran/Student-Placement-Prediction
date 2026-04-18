import React, { useEffect, useContext, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';

function OAuthSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setUser } = useContext(AuthContext);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');
    
    if (token) {
      localStorage.setItem('token', token);
      
      // Fetch user profile
      api.get('/auth/me')
        .then(res => {
          localStorage.setItem('user', JSON.stringify(res.data.user));
          setUser(res.data.user);
          navigate('/');
        })
        .catch(err => {
          console.error(err);
          setError('Failed to fetch user profile. Please login again.');
          localStorage.removeItem('token');
        });
    } else {
      setError('Invalid OAuth response. No token provided.');
    }
  }, [searchParams, navigate, setUser]);

  return (
    <div className="flex-center" style={{ minHeight: '80vh' }}>
      <div className="glass-panel" style={{ padding: '40px', textAlign: 'center' }}>
        {error ? (
          <div>
            <h3 style={{ color: 'var(--error)' }}>OAuth Error</h3>
            <p>{error}</p>
            <button onClick={() => navigate('/login')} className="btn-primary" style={{ marginTop: '16px' }}>Return to Login</button>
          </div>
        ) : (
          <h3 className="text-gradient">Evaluating Credentials...</h3>
        )}
      </div>
    </div>
  );
}

export default OAuthSuccess;
