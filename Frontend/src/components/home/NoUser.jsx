import React from 'react'
import { Link } from 'react-router-dom';

const NoUser = () => {
  const handleGoogleSignIn = async()=> {
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
      
    } 
    return data
    } catch (error) {
       console.log("Error:", error)
    }
  }
  return (
    <>
         <div className='flex flex-col gap-4'>
            <Link to="/user/sign-in" className='border border-lime-400 bg-lime-400 cursor-pointer hover:bg-lime-300 py-3 px-1 text-xl font-semibold text-black'>Sign In with Email</Link>
            <button onClick={handleGoogleSignIn} className='border border-gray-300 bg-gray-900  py-3 px-1  text-white cursor-pointer'>Sign up with Google</button>
         </div>
    </>
  )
}

export default NoUser
