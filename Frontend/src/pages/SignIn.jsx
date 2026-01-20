import React, { useContext, useState } from "react";
import { AppContext } from "../context/Context";
import summaryApi from "../common";
import { Link, useNavigate } from "react-router-dom";

const SignIn = ({ onBack }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { setUser } = useContext(AppContext);

  const handleSignIn = async () => {
    if (!email || !password) {
      setError("Please enter email and password");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(summaryApi.signIn.url, {
        method: summaryApi.signIn.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to sign in");
      }

      

      // Update context (THIS FIXES HEADER)
      setUser(data.user);

      // Navigate by role
      if (data.user?.role === "admin") {
        navigate("/admin/dashboard", { replace: true });
      } else {
        navigate("/user/dashboard", { replace: true });
      }
    } catch (err) {
      setError(err.message || "Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-6">
      <div className="bg-gray-800 rounded-lg p-8 w-full max-w-md">

        <h1 className="text-2xl font-bold text-white mb-6">
          Sign in to your account
        </h1>

        {error && (
          <div className="mb-6 p-4 bg-red-900 border border-red-700 rounded-lg">
            <p className="text-red-200 text-sm">{error}</p>
          </div>
        )}

        <div className="mb-6">
          <label className="block text-white text-sm mb-2">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white"
          />
        </div>

        <div className="mb-8">
          <label className="block text-white text-sm mb-2">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white"
          />
        </div>

        <button
          onClick={handleSignIn}
          disabled={loading}
          className="w-full bg-green-400 hover:bg-green-500 text-gray-900 py-3 rounded-lg font-medium"
        >
          {loading ? "Signing In..." : "Sign In"}
        </button>

        <div className="text-center mt-6">
          <p className="text-gray-400 text-sm">
            Admin?
            <Link
              to="/admin/sign-in"
              className="text-green-400 hover:text-green-300 ml-1"
            >
              Admin Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignIn;
