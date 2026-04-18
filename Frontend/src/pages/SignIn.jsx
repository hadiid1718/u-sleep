import React, { useState, useContext, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AppContext } from "../context/Context";
import {
  authAPI,
  parseOAuthUserPayload,
} from '../services/authService';
import { getErrorMessage, setToken } from '../services/core/apiClient';

const SignIn = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [localError, setLocalError] = useState(null);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login } = useContext(AppContext);

  useEffect(() => {
    const oauthStatus = searchParams.get("oauth");

    if (!oauthStatus) return;

    if (oauthStatus === "success") {
      const token = searchParams.get("token");
      const user = parseOAuthUserPayload(searchParams.get("user"));

      if (token && user) {
        setToken(token);
        login(user, token);
        window.location.replace("/user/dashboard");
        return;
      }

      setLocalError("OAuth login succeeded but user session could not be initialized.");
      return;
    }

    if (oauthStatus === "failed") {
      const message = searchParams.get("message");
      setLocalError(message || "OAuth login failed. Please try again.");
    }
  }, [login, navigate, searchParams]);

  const handleSignIn = async (e) => {
    e.preventDefault();
    
    if (!email.trim() || !password.trim()) {
      setLocalError("Please fill in all fields");
      return;
    }

    setLoading(true);
    setLocalError(null);

    try {
      const response = await authAPI.signIn(email, password);

      if (!response.success) {
        setLocalError(getErrorMessage(response));
        return;
      }

      // Handle successful sign in
      const { data: responseData } = response;
      if (responseData.data) {
        const userData = responseData.data.user || responseData.data;
        const token = responseData.data.token;

        // Save token to localStorage
        setToken(token);

        // Update global context
        login(userData, token);

        // Redirect to dashboard
        navigate("/user/dashboard");
      }
    } catch (error) {
      setLocalError("An unexpected error occurred. Please try again.");
      console.error("Sign in error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && email && password) {
      handleSignIn(e);
    }
  };

  const handleGoogleSignIn = () => {
    window.location.href = authAPI.getGoogleOAuthUrl("signin");
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-6">
      <div className="bg-gray-800 rounded-lg p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold text-white mb-6">
          Sign in to your account
        </h1>

        {localError && (
          <div className="mb-4 p-3 bg-red-900/20 border border-red-500 rounded-lg">
            <p className="text-red-400 text-sm">{localError}</p>
          </div>
        )}

        <form onSubmit={handleSignIn}>
          <div className="mb-4">
            <label className="block text-white mb-2 text-sm font-medium">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyPress={handleKeyPress}
              className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-lime-400 transition"
              placeholder="Enter your email"
              required
            />
          </div>

          <div className="mb-6">
            <label className="block text-white mb-2 text-sm font-medium">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyPress={handleKeyPress}
              className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-lime-400 transition"
              placeholder="Enter your password"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading || !email || !password}
            className="w-full bg-lime-400 text-gray-900 py-3 rounded-lg font-semibold hover:bg-lime-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Signing in...
              </span>
            ) : (
              "Sign In"
            )}
          </button>
        </form>

        <div className="my-4 flex items-center gap-3">
          <div className="h-px flex-1 bg-gray-700"></div>
          <span className="text-xs uppercase tracking-wide text-gray-400">or</span>
          <div className="h-px flex-1 bg-gray-700"></div>
        </div>

        <button
          type="button"
          onClick={handleGoogleSignIn}
          className="w-full border border-gray-600 bg-gray-700 text-white py-3 rounded-lg font-semibold hover:bg-gray-600 transition-colors"
        >
          Continue with Google
        </button>

        <div className="mt-6 text-center">
          <p className="text-gray-400 text-sm">
            Don't have an account?{" "}
            <button
              onClick={() => navigate("/user/sign-up")}
              className="text-lime-400 hover:text-lime-500 font-medium hover:underline"
            >
              Sign Up
            </button>
          </p>
        </div>

        <div className="mt-4 text-center">
          <button
            onClick={() => navigate("/")}
            className="text-gray-400 hover:text-gray-300 text-sm"
          >
            ← Back to Home
          </button>
        </div>
      </div>
    </div>
  );
};

export default SignIn;