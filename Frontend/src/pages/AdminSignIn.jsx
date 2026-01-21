import React, { useContext, useState } from 'react'
import { AppContext } from '../context/Context';
import { useNavigate } from "react-router-dom"

const AdminSignIn = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate()
  const { setUser } = useContext(AppContext)

  const handleAdminSignIn = async () => {
    if (!username || !password) {
      setError('Please enter username and password');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:8080/api/admin/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username,
          password
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to sign in');
      }

      // Store admin data and token
      localStorage.setItem('user', JSON.stringify(data.user));
      localStorage.setItem('token', data.token);
      localStorage.setItem('accessToken', data.token);
      setUser(data.user);

      // Navigate to admin dashboard
      navigate('/admin/dashboard');
    } catch (err) {
      console.error('Admin Sign in error:', err);
      setError(err.message || 'Network error');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !loading) {
      handleAdminSignIn();
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-6">
      <div className="bg-gray-800 rounded-lg p-8 w-full max-w-md">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white">Admin Sign In</h1>
          <p className="text-gray-400 text-sm mt-2">Access the admin dashboard</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-900 border border-red-700 rounded-lg">
            <p className="text-red-200 text-sm">{error}</p>
          </div>
        )}

        {/* Form Fields */}
        <div>
          {/* Username Field */}
          <div className="mb-6">
            <label className="block text-white text-sm font-medium mb-2">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Enter your username"
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-green-400 focus:ring-1 focus:ring-green-400"
              disabled={loading}
              autoComplete="username"
            />
          </div>

          {/* Password Field */}
          <div className="mb-8">
            <label className="block text-white text-sm font-medium mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Enter your password"
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-green-400 focus:ring-1 focus:ring-green-400"
              disabled={loading}
              autoComplete="current-password"
            />
          </div>

          {/* Sign In Button */}
          <button
            onClick={handleAdminSignIn}
            disabled={loading}
            className="w-full bg-green-400 hover:bg-green-500 disabled:bg-gray-600 text-gray-900 py-3 rounded-lg font-medium transition-colors disabled:cursor-not-allowed"
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </div>

        
      </div>
    </div>
  );
};

export default AdminSignIn;