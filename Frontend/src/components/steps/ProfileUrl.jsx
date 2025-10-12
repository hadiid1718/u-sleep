import React, { useContext, useState } from 'react';
import { AppContext } from '../../context/Context';
import { useNavigate } from 'react-router-dom';

const ProfileUrl = ({ setLoading, setError }) => {
  const { nextStep, prevStep, formData, setFormData, handleSubmit } = useContext(AppContext);
  const [profileLink, setProfileLink] = useState(formData.profileUrl || '');
  const [showError, setShowError] = useState(false);

  const navigate = useNavigate()
  const handleContinue = async () => {

    // Profile URL is optional, so we can proceed even if empty
    if (!profileLink.trim()) {
      // Show warning but allow to continue
      setShowError(true);
    }

    // Update form data with profile URL
    const finalData = { ...formData, profileUrl: profileLink };
    setFormData(finalData);

    // Set loading state in parent
    if (setLoading) setLoading(true);
    if (setError) setError(null);


    try {
      // Call the API through context
      // Don't call nextStep here - handleSubmit will do it after getting jobs
      await handleSubmit(finalData);
      navigate("/job-result")
    } catch (err) {
      console.error('Error in handleContinue:', err);
      if (setError) setError(err.message);
      if (setLoading) setLoading(false);
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
        <div className="flex items-center justify-center p-6">
          <div className="max-w-4xl w-full">
            <div className="text-center mb-12">
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
                <span className="text-green-400">Step 5 -</span> share your Upwork profile link
              </h1>
              <p className="text-gray-300 text-lg max-w-3xl mx-auto leading-relaxed">
                We will scrape info about your services and case studies to teach AI how to create better job responses.
              </p>
            </div>

            <div className="max-w-3xl mx-auto">
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

              {showError && (
                <div className="mb-6 p-4 bg-yellow-900/30 border border-yellow-600/50 rounded-lg">
                  <p className="text-yellow-400">
                    Profile link is optional, but recommended for better AI analysis.
                  </p>
                </div>
              )}

              <div className="text-center mb-8">
                <p className="text-gray-300 text-base">
                  Example: https://www.upwork.com/freelancers/~01234567890
                </p>
              </div>

              <div className="text-center mb-8">
                <button 
                  onClick={() => window.open('https://support.upwork.com/hc/en-us/articles/211068468-Find-Your-Profile-URL', '_blank')}
                  className="bg-transparent border-2 border-green-400 text-green-400 hover:bg-green-400 hover:text-gray-900 font-semibold py-3 px-6 rounded-lg transition-all duration-300 transform hover:scale-105"
                >
                  Watch tip: How to get profile link
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className='mt-6 flex justify-between items-center'>
        <button 
          className="text-black py-2 px-6 border rounded-lg font-bold bg-lime-400 hover:bg-lime-300 border-lime-400 cursor-pointer"
          onClick={prevStep}
        >
          Previous Question
        </button>
        <button
          className="text-black py-2 px-6 border rounded-lg font-bold bg-lime-400 hover:bg-lime-300 border-lime-400 cursor-pointer"
          onClick={handleContinue}
        >
          Find Jobs 🚀
        </button>
      </div>
    </>
  );
};

export default ProfileUrl;