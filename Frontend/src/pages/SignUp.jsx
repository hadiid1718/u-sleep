import React, { useState } from "react";
import summaryApi from "../common";
import { useNavigate } from "react-router-dom";

const SignUp = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);

  const navigate = useNavigate();

  const handleSignUp = async () => {
    try {
      setError(null);

      const res = await fetch(summaryApi.signUp.url, {
        method: summaryApi.signUp.method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Signup failed");
        return;
      }

      navigate("/user/sign-in");
    } catch (err) {
      setError("Network error");
    }
  };

  const handleGoogleSignIn = async (googleToken) => {
    try {
      const res = await fetch(summaryApi.googleLogin.url, {
        method: summaryApi.googleLogin.method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token: googleToken }),
      });

      const data = await res.json();

      if (!data.success) return;

      localStorage.setItem("accessToken", data.data.tokens.accessToken);
      localStorage.setItem("refreshToken", data.data.tokens.refreshToken);
      localStorage.setItem("user", JSON.stringify(data.data.user));

      navigate("/");
    } catch (err) {
      console.log("Google login error", err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-6">
      <div className="bg-gray-800 rounded-lg p-8 w-full max-w-md">

        <h1 className="text-2xl font-bold text-white mb-4">
          Sign Up to your account
        </h1>

        {error && (
          <p className="text-red-400 text-sm mb-4">{error}</p>
        )}

        <div className="mb-6">
          <label className="block text-white mb-2">Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg"
          />
        </div>

        <div className="mb-6">
          <label className="block text-white mb-2">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg"
          />
        </div>

        <div className="mb-8">
          <label className="block text-white mb-2">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg"
          />
        </div>

        <button
          onClick={handleSignUp}
          className="w-full bg-green-400 text-gray-900 py-3 rounded-lg font-medium"
        >
          Sign Up
        </button>
      </div>
    </div>
  );
};

export default SignUp;
