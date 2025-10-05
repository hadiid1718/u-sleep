import React, { useContext, useEffect, useState } from 'react'
import { AppContext } from '../context/Context';
import summaryApi from '../common';
import { useNavigate } from "react-router-dom"
const SignIn = (onBack) => {
 const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
    const [ authenticated, setAuthenticated] = useState(false)
  const  [ error, setError] = useState(null)


  const navigate = useNavigate()


  const { user, setUser,} = useContext(AppContext)

       useEffect(()=> {
    const token = localStorage.getItem("accessToken")
    const savedUser = localStorage.getItem("user")
    if(token && authenticated){
      setAuthenticated(true)
      setUser(JSON.parse(savedUser));


    }
  }, [])

  const handleSignIn = async() => {
    

    try {
       const dataResponse = await fetch(summaryApi.signIn.url, {
        method: summaryApi.signIn.method,
        headers: {
          "Content-Type": "application/json",
        },
        body : JSON.stringify({
          email,
          password
        })

       })
        const data = await dataResponse.json()
        console.log("User Data ", data)

        if(data.success) {
        localStorage.setItem("accessToken", data.data.tokens.accessToken);
        localStorage.setItem("refreshToken", data.data.tokens.refreshToken);
        localStorage.setItem("user", JSON.stringify(data.data.user));
        setUser(data.data.user)
        setAuthenticated(true);
        navigate("/")
        } else {
        setError(data.message);
        console.log(data.message)
      }

    } catch (error) {
       setError("Network error")
    }
  }


  const handleGoogleSignIn = async() => {
    try {
            const googleRes = await fetch(summaryApi.googleLogin.url, {
      method: summaryApi.googleLogin.method,
      headers: {
        "Content-Type" : "application/json"
      },
      body: JSON.stringify({ token: googleToken})
    })

    const data = await googleRes.json()

    if(data.success) {
      localStorage.setItem("access token", data?.data?.tokens.accessToken);
      localStorage.setItem("refress token", data?.data?.tokens?.refreshToken)
      setAuthenticated(true)
      setUser(data.data.user)

    } 
    return data
    } catch (error) {
       console.log("Error:", error)
    }
  };

  const handleBack = () => {
    if (onBack) {
      onBack();
    }
  };


  

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-6">
      <div className="bg-gray-800 rounded-lg p-8 w-full max-w-md relative">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white">Sign in to your account</h1>
        </div>

        {/* Form Fields */}
        <div>
          {/* Email Field */}
          <div className="mb-6">
            <label className="block text-white text-sm font-medium mb-2">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-green-400 focus:ring-1 focus:ring-green-400"
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
              placeholder="Enter your password"
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-green-400 focus:ring-1 focus:ring-green-400"
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-4 mb-6">
      
            <button
              onClick={handleSignIn}
              className="flex-1 bg-green-400 hover:bg-green-500 text-gray-900 py-3 rounded-lg font-medium transition-colors"
            >
              Sign In
            </button>
          </div>
        </div>

        {/* Divider */}
        <div className="text-center mb-6">
          <span className="text-gray-400 text-sm">or continue with</span>
        </div>

        {/* Google Sign In */}
        <button
          onClick={handleGoogleSignIn}
          className="w-full bg-gray-700 border border-gray-600 text-white py-3 rounded-lg font-medium hover:bg-gray-600 transition-colors flex items-center justify-center gap-3"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Sign In with Google
        </button>
      </div>
    </div>
  );
};

export default SignIn
