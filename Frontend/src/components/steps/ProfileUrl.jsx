import React, { useContext, useState } from 'react'
import { AppContext } from '../../context/Context';

const ProfileUrl = () => {
    const { nextStep, prevStep,} = useContext(AppContext);
    
   const [profileLink, setProfileLink] = useState('');
     const [showError, setShowError] = useState(false);
      const handleContinue = () => {
    if (!profileLink.trim()) {
      setShowError(true);
    } else {
      setShowError(false);
      // Continue with the flow
      console.log('Profile link submitted:', profileLink);
    }
  };

  const handleInputChange = (e) => {
    setProfileLink(e.target.value);
    if (showError && e.target.value.trim()) {
      setShowError(false);
    }
  };
  return (
    <>
    <div>
          <div className=" flex items-center justify-center p-6">
      <div className="max-w-4xl w-full">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
            <span className="text-green-400">Step 5 -</span> share your Upwork profile link
          </h1>
          <p className="text-gray-300 text-lg max-w-3xl mx-auto leading-relaxed">
            We will scrape info about your services and case studies to teach AI how to create better job responses.
          </p>
        </div>

        {/* Form Container */}
        <div className="max-w-3xl mx-auto">
          {/* Input Field */}
          <div className="mb-6">
            <input
              type="url"
              value={profileLink}
              onChange={handleInputChange}
              placeholder="Your Upwork profile link"
              className={`w-full px-6 py-4 bg-gray-800 border-2 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent text-lg ${
                showError ? 'border-red-500' : 'border-green-400'
              }`}
            />
          </div>

          {/* Error Message */}
          {showError && (
            <div className="mb-6 p-4 bg-yellow-900/30 border border-yellow-600/50 rounded-lg">
              <p className="text-red-400">
                Profile link is required{' '}
                <span className="text-green-400 underline cursor-pointer hover:text-green-300">
                  Watch this tip video
                </span>
              </p>
            </div>
          )}

          {/* Example Text */}
          <div className="text-center mb-8">
            <p className="text-gray-300 text-base">
              Example: https://www.upwork.com/freelancers/~01234567890
            </p>
          </div>

          {/* Watch Tip Button */}
          <div className="text-center mb-8">
            <button className="bg-transparent border-2 border-green-400 text-green-400 hover:bg-green-400 hover:text-gray-900 font-semibold py-3 px-6 rounded-lg transition-all duration-300 transform hover:scale-105">
              Watch tip: How to get profile link
            </button>
          </div>

        </div>
      </div>
    </div>
    </div>
       <div className='mt-6 flex justify-between items-center '>
          <button className=" text-black py-2 px-6  border  rounded-lg font-bold bg-lime-400 hover:bg-lime-300 border-lime-400 cursor-pointer"
            onClick={{prevStep}}>
            Previous Question
          </button>
          <button
            className="text-black py-2 px-6  border  rounded-lg font-bold bg-lime-400 hover:bg-lime-300 border-lime-400 cursor-pointer"
    
            onClick={nextStep}
          >
            Next questions
          </button>
        </div>
    </>
  )
}

export default ProfileUrl
