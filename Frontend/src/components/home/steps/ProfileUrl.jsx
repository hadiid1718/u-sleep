import React, { useContext, useState } from 'react';
import { AppContext } from '../../../context/Context';
import { useNavigate } from 'react-router-dom';

const ProfileUrl = () => {
  const {
    nextStep,
    prevStep,
    formData,
    setFormData,
    error,
    setError,
  } = useContext(AppContext);

  const [profileLink, setProfileLink] = useState(formData.profileUrl || '');
  const [showError, setShowError] = useState(false);

  const navigate = useNavigate();

  const handleContinue = () => {
    if (!profileLink.trim()) {
      setShowError(true);
      return;
    }

    // ✅ Only update state — no API call
    const updatedData = { ...formData, profileUrl: profileLink };
    setFormData(updatedData);

    // ✅ Move to next step / page
    nextStep();
    navigate('/job-result', { replace: true });
  };

  const handleInputChange = (e) => {
    setProfileLink(e.target.value);
    if (showError && e.target.value.trim()) {
      setShowError(false);
    }
  };

  return (
    <>
      <div className="flex items-center justify-center p-6">
        <div className="max-w-4xl w-full">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
              <span className="text-green-400">Step 5 -</span> share your Upwork profile link
            </h1>
            <p className="text-gray-300 text-lg max-w-3xl mx-auto leading-relaxed">
              This helps AI understand your services and generate better job responses.
            </p>
          </div>

          <div className="max-w-3xl mx-auto">
            <div className="mb-6">
              <input
                type="url"
                value={profileLink}
                onChange={handleInputChange}
                placeholder="Your Upwork profile link"
                className={`w-full px-6 py-4 bg-gray-800 border-2 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-400 ${
                  showError ? 'border-red-500' : 'border-green-400'
                }`}
              />
            </div>

            {showError && (
              <div className="mb-6 p-4 bg-yellow-900/30 border border-yellow-600/50 rounded-lg">
                <p className="text-yellow-400">
                  Profile link is optional, but recommended.
                </p>
              </div>
            )}

            {error && (
              <div className="mb-6 p-4 bg-red-900/30 border border-red-600/50 rounded-lg">
                <p className="text-red-400">{error}</p>
              </div>
            )}

            <div className="flex flex-col lg:flex-row md:flex-row items-center justify-center mb-8">
              <p className="text-gray-300 text-sm  ">
                Example: https://www.upwork.com/freelancers/~01234567890
              </p>
            </div>

            <div className="text-center mb-8 text-sm">
              <button
                onClick={() =>
                  window.open(
                    'https://support.upwork.com/hc/en-us/articles/211068468-Find-Your-Profile-URL',
                    '_blank'
                  )
                }
                className="border-2 border-green-400 text-green-400 hover:bg-green-400 hover:text-gray-900 font-semibold py-3 px-6 rounded-lg transition"
              >
                How to get profile link
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom navigation */}
      <div className="mt-6 flex justify-between">
        <button
          onClick={prevStep}
          className="bg-lime-400 hover:bg-lime-300 text-black p-2  lg:px-6 lg:py-2 rounded-lg font-bold"
        >
          Previous Question
        </button>

        <button
          onClick={handleContinue}
          className="bg-lime-400 hover:bg-lime-300 text-black p-2 lg:px-6 lg:py-2 rounded-lg font-bold"
        >
          Continue 
        </button>
      </div>
    </>
  );
};

export default ProfileUrl;
