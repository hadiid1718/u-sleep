import React, { useState, useContext, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AppContext } from "../context/Context";
import {
  authAPI,
  parseOAuthUserPayload,
} from '../services/authService';
import { getErrorMessage, setToken } from '../services/core/apiClient';

const SignUp = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [localError, setLocalError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showVerifyDialog, setShowVerifyDialog] = useState(false);
  const [verifyEmail, setVerifyEmail] = useState("");
  const [resendStatus, setResendStatus] = useState(null);
  const [resendLoading, setResendLoading] = useState(false);

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

      setLocalError("OAuth sign-up succeeded but user session could not be initialized.");
      return;
    }

    if (oauthStatus === "failed") {
      const message = searchParams.get("message");
      setLocalError(message || "OAuth sign-up failed. Please try again.");
    }
  }, [login, navigate, searchParams]);

  const handleSignUp = async (e) => {
    e.preventDefault();

    if (!name.trim() || !email.trim() || !password.trim()) {
      setLocalError("Please fill in all fields");
      return;
    }

    if (password.length < 6) {
      setLocalError("Password must be at least 6 characters long");
      return;
    }

    setLoading(true);
    setLocalError(null);

    try {
      const response = await authAPI.signUp(name, email, password);

      if (!response.success) {
        setLocalError(getErrorMessage(response));
        return;
      }

      // Handle successful sign up
      const { data: responseData } = response;
      const payload = responseData?.data || {};

      if (payload.verificationRequired) {
        setVerifyEmail(payload.email || email);
        setShowVerifyDialog(true);
        return;
      }

      if (payload.token && payload.user) {
        // Save token to localStorage
        setToken(payload.token);

        // Update global context
        login(payload.user, payload.token);

        // Redirect to dashboard
        navigate("/user/dashboard");
      }
    } catch (error) {
      setLocalError("An unexpected error occurred. Please try again.");
      console.error("Sign up error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && name && email && password) {
      handleSignUp(e);
    }
  };

  const handleGoogleSignUp = () => {
    window.location.href = authAPI.getGoogleOAuthUrl("signup");
  };

  const handleResendVerification = async () => {
    const targetEmail = (verifyEmail || email || "").trim();
    if (!targetEmail) {
      setResendStatus({
        type: "error",
        message: "Please enter a valid email address.",
      });
      return;
    }

    setResendLoading(true);
    setResendStatus(null);

    try {
      const response = await authAPI.resendVerification(targetEmail);
      if (!response.success) {
        setResendStatus({
          type: "error",
          message: getErrorMessage(response),
        });
        return;
      }

      const message =
        response.data?.message ||
        "Verification link sent. Please check your email.";
      setResendStatus({ type: "success", message });
    } catch (error) {
      setResendStatus({
        type: "error",
        message: "Unable to resend verification link. Please try again.",
      });
      console.error("Resend verification error:", error);
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-6">
      {showVerifyDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-sm rounded-lg border border-gray-200 bg-white p-6 text-gray-900 shadow-xl">
            <h2 className="text-lg font-semibold">Verify your email</h2>
            <p className="mt-2 text-sm text-gray-600">
              Please verify your email to continue. We sent a verification link to
              {" "}
              <span className="font-medium text-gray-900">
                {verifyEmail || email}
              </span>
              .
            </p>

            {resendStatus && (
              <div
                className={`mt-3 rounded-md border px-3 py-2 text-xs ${
                  resendStatus.type === "error"
                    ? "border-red-200 bg-red-50 text-red-700"
                    : "border-emerald-200 bg-emerald-50 text-emerald-700"
                }`}
              >
                {resendStatus.message}
              </div>
            )}

            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={() => setShowVerifyDialog(false)}
                className="flex-1 rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleResendVerification}
                disabled={resendLoading}
                className="flex-1 rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-60"
              >
                {resendLoading ? "Sending..." : "Resend verification link"}
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="bg-gray-800 rounded-lg p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold text-white mb-6">
          Create your account
        </h1>

        {localError && (
          <div className="mb-4 p-3 bg-red-900/20 border border-red-500 rounded-lg">
            <p className="text-red-400 text-sm">{localError}</p>
          </div>
        )}

        <form onSubmit={handleSignUp}>
          <div className="mb-4">
            <label className="block text-white mb-2 text-sm font-medium">
              Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyPress={handleKeyPress}
              className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-lime-400 transition"
              placeholder="Enter your name"
              required
            />
          </div>

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
              minLength={6}
            />
            <p className="text-gray-400 text-xs mt-1">
              Minimum 6 characters
            </p>
          </div>

          <button
            type="submit"
            disabled={loading || !name || !email || !password}
            className="w-full bg-lime-400 text-gray-900 py-3 rounded-lg font-semibold hover:bg-lime-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Creating account...
              </span>
            ) : (
              "Sign Up"
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
          onClick={handleGoogleSignUp}
          className="w-full border border-gray-600 bg-gray-700 text-white py-3 rounded-lg font-semibold hover:bg-gray-600 transition-colors"
        >
          Continue with Google
        </button>

        <div className="mt-6 text-center">
          <p className="text-gray-400 text-sm">
            Already have an account?{" "}
            <button
              onClick={() => navigate("/user/sign-in")}
              className="text-lime-400 hover:text-lime-500 font-medium hover:underline"
            >
              Sign In
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignUp;