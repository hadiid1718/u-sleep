import React, { useContext, useState } from 'react';
import { AppContext } from '../../../context/Context';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../../../services/authService';

const ProfileUrl = () => {
  const {
    nextStep,
    prevStep,
    formData,
    setFormData,
    error,
    user,
    searchJobsWithAI,
  } = useContext(AppContext);

  const [profileLink, setProfileLink] = useState(formData.profileUrl || '');
  const [selectedLanguage, setSelectedLanguage] = useState(
    formData.selectedLanguage || 'English'
  );
  const [autoTranslateDescription, setAutoTranslateDescription] = useState(
    Boolean(formData.autoTranslateDescription)
  );
  const [showError, setShowError] = useState(false);
  const selectedPlatform = formData.selectedPlatform || 'upwork';

  const navigate = useNavigate();

  const buildSearchPayload = (data) => {
    const jobHourly = data.hourlyRate ? Number(data.hourlyRate) : null;
    const projectFixedRate = data.fixedRate ? Number(data.fixedRate) : null;
    const platform = data.selectedPlatform || 'upwork';
    const isFreelancer = platform === 'freelancer';
    const profileUrl = data.profileUrl || '';

    let rateType = null;
    if (jobHourly && !projectFixedRate) rateType = 'hourly';
    if (projectFixedRate && !jobHourly) rateType = 'fixed';

    const payload = {
      selectedPlatform: platform,
      aiService: data.aiService || 'gemini',
      keywords: data.keywords || [],
      jobHourly,
      projectFixedRate,
      badJobCriteria: data.badJobCriteria || [],
      selectedRole: data.accountType || null,
      ...(isFreelancer
        ? { freelancerProfileUrl: profileUrl }
        : { upworkProfileUrl: profileUrl }),
      selectedLanguage: data.selectedLanguage || 'English',
      autoTranslateDescription: Boolean(data.autoTranslateDescription),
    };

    if (rateType) payload.rateType = rateType;
    if (jobHourly) payload.hourlyRateRange = { min: jobHourly };
    if (projectFixedRate) payload.fixedRateRange = { min: projectFixedRate };

    return payload;
  };

  const handleContinue = async () => {
    const updatedData = {
      ...formData,
      profileUrl: profileLink,
      selectedLanguage,
      autoTranslateDescription,
    };
    setFormData(updatedData);

    if (!user) {
      nextStep();
      return;
    }

    const filters = {};
    if (updatedData.hourlyRate) {
      filters.minRate = Number(updatedData.hourlyRate);
    }
    if (updatedData.fixedRate) {
      filters.minBudget = Number(updatedData.fixedRate);
    }

    const payload = buildSearchPayload(updatedData);
    const result = await searchJobsWithAI(payload, filters);

    if (result.success && (result.data?.data?.jobs || []).length > 0) {
      nextStep();
      navigate('/job-result', { replace: true });
    }
  };

  const handleInputChange = (e) => {
    setProfileLink(e.target.value);
    if (showError && e.target.value.trim()) {
      setShowError(false);
    }
  };

  const handleFreelancerConnect = () => {
    window.location.href = authAPI.getFreelancerOAuthUrl('connect-freelancer');
  };

  return (
    <>
      <div className="flex items-center justify-center p-6">
        <div className="max-w-4xl w-full">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
              <span className="text-green-400">Step 7 -</span>{' '}
              {selectedPlatform === 'freelancer'
                ? 'connect profile and launch project fetch'
                : `share your ${selectedPlatform === 'freelancer' ? 'Freelancer.com' : 'Upwork'} profile link`}
            </h1>
            <p className="text-gray-300 text-lg max-w-3xl mx-auto leading-relaxed">
              {selectedPlatform === 'freelancer'
                ? 'This helps AI generate bid-ready cover letters aligned to your Freelancer profile.'
                : 'This helps AI understand your services and generate better job responses.'}
            </p>
          </div>

          <div className="max-w-3xl mx-auto">
            <div className="mb-6">
              <input
                type="url"
                value={profileLink}
                onChange={handleInputChange}
                placeholder={`Your ${selectedPlatform === 'freelancer' ? 'Freelancer.com' : 'Upwork'} profile link`}
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
                {selectedPlatform === 'freelancer'
                  ? 'Example: https://www.freelancer.com/u/yourusername'
                  : 'Example: https://www.upwork.com/freelancers/~01234567890'}
              </p>
            </div>

            {selectedPlatform === 'freelancer' && (
              <div className="mb-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5 text-left">
                  <div>
                    <label className="block text-gray-300 text-sm mb-2">
                      Preferred freelancer language
                    </label>
                    <select
                      value={selectedLanguage}
                      onChange={e => setSelectedLanguage(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-800 border-2 border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-lime-400 focus:border-lime-400"
                    >
                      <option>English</option>
                      <option>Indonesian</option>
                      <option>Spanish</option>
                      <option>French</option>
                      <option>German</option>
                      <option>Portuguese</option>
                      <option>Arabic</option>
                      <option>Hindi</option>
                    </select>
                  </div>

                  <div className="flex items-end">
                    <label className="flex items-center gap-3 text-sm text-gray-300 bg-gray-800/70 border border-gray-700 rounded-lg px-4 py-3 w-full">
                      <input
                        type="checkbox"
                        checked={autoTranslateDescription}
                        onChange={e =>
                          setAutoTranslateDescription(e.target.checked)
                        }
                        className="h-4 w-4 rounded border-gray-600 bg-gray-900 text-lime-400 focus:ring-lime-400"
                      />
                      Auto-translate project descriptions during search
                    </label>
                  </div>
                </div>

                <div className="text-center text-sm">
                  <button
                    onClick={handleFreelancerConnect}
                    className="border-2 border-lime-400 text-lime-400 hover:bg-lime-400 hover:text-gray-900 font-semibold py-3 px-6 rounded-lg transition"
                  >
                    {user ? 'Connect Freelancer Account (OAuth)' : 'Sign in with Freelancer OAuth'}
                  </button>
                </div>
              </div>
            )}

            <div className="text-center mb-8 text-sm">
              <button
                onClick={() =>
                  window.open(
                    selectedPlatform === 'freelancer'
                      ? 'https://www.freelancer.com/support'
                      : 'https://support.upwork.com/hc/en-us/articles/211068468-Find-Your-Profile-URL',
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
          {selectedPlatform === 'freelancer' ? 'Fetch Freelancer Projects' : 'Continue'}
        </button>
      </div>
    </>
  );
};

export default ProfileUrl;
