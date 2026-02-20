import React, { useContext, useState } from 'react'
import { AppContext } from '../context/Context';
import { useNavigate } from "react-router-dom"
import { authAPI, getErrorMessage, setToken } from '../utils/api';

const AdminSignIn = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate()
  const { login } = useContext(AppContext)

  const handleAdminSignIn = async (e) => {
    e?.preventDefault();

    if (!username || !password) {
      setError('Please enter username and password');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await authAPI.adminLogin(username, password);

      if (!response.success) {
        setError(getErrorMessage(response));
        return;
      }

      // Handle successful admin sign in
      const { data: responseData } = response;
      if (responseData.data) {
        const adminData = {
          ...responseData.data.admin,
          isAdmin: true
        };
        const token = responseData.data.token;

        // Save token to localStorage
        setToken(token);

        // Update global context with admin data
        login(adminData, token);

        // Redirect to admin dashboard
        navigate("/admin/dashboard");
      }
    } catch (err) {
      console.error('Admin sign in error:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !loading) {
      handleAdminSignIn(e);
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
            disabled={loading || !username || !password}
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