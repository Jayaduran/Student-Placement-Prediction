import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import NavBar from './components/NavBar';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import AdminPanel from './pages/AdminPanel';
import OAuthSuccess from './pages/OAuthSuccess';
import Leaderboard from './pages/Leaderboard';
import Settings from './pages/Settings';
import { AuthContext } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';

const PrivateRoute = ({ children, roles }) => {
  const { user } = useContext(AuthContext);
  if (!user) return <Navigate to="/login" />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" />;
  return children;
};

function App() {
  const { user } = useContext(AuthContext);

  return (
    <ThemeProvider>
      <Router>
      {user && <NavBar />}
      <div className="container" style={{ marginTop: user ? '32px' : '0' }}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/oauth-success" element={<OAuthSuccess />} />
          <Route
            path="/"
            element={<PrivateRoute><Dashboard /></PrivateRoute>}
          />
          <Route
            path="/leaderboard"
            element={<PrivateRoute><Leaderboard /></PrivateRoute>}
          />
          <Route
            path="/profile"
            element={<PrivateRoute roles={['student']}><Profile /></PrivateRoute>}
          />
          <Route
            path="/admin"
            element={<PrivateRoute roles={['admin']}><AdminPanel /></PrivateRoute>}
          />
          <Route
            path="/settings"
            element={<PrivateRoute><Settings /></PrivateRoute>}
          />
        </Routes>
      </div>
      </Router>
    </ThemeProvider>
  );
}

export default App;
