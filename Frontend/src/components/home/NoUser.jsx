import React, { useContext } from 'react'
import { Link } from 'react-router-dom';
import { authAPI } from '../../utils/api';
import { AppContext } from '../../context/Context';

const NoUser = () => {
  const { formData } = useContext(AppContext);
  const selectedPlatform = formData?.selectedPlatform || 'upwork';

  const handleGoogleSignIn = () => {
    window.location.href = authAPI.getGoogleOAuthUrl('signin');
  }

  const handleFreelancerOAuth = () => {
    window.location.href = authAPI.getFreelancerOAuthUrl('signin');
  }

  return (
    <>
         <div className='flex flex-col gap-4'>
            <Link to="/user/sign-in" className='border border-lime-400 bg-lime-400 cursor-pointer hover:bg-lime-300 py-3 px-1 text-xl font-semibold text-black'>Sign In with Email</Link>
            <button onClick={handleGoogleSignIn} className='border border-gray-300 bg-gray-900  py-3 px-1  text-white cursor-pointer'>Sign up with Google</button>
            {selectedPlatform === 'freelancer' && (
              <button onClick={handleFreelancerOAuth} className='border border-cyan-300 bg-gray-900 py-3 px-1 text-white cursor-pointer'>Continue with Freelancer OAuth</button>
            )}
         </div>
    </>
  )
}

export default NoUser
