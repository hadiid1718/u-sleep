import React, { useContext, useState, useEffect } from 'react';
import PlatformSelect from './steps/PlatformSelect';
import AIServiceSelect from './steps/AIServiceSelect';
import Keywords from './steps/Keywords';
import Rates from './steps/Rates';
import BadJobCriteria from './steps/BadJobCriteria';
import RoleSelecting from './steps/RoleSelecting';
import ProfileUrl from './steps/ProfileUrl';
import { AppContext } from '../../context/Context';
import NoUser from './NoUser';
import CountdownTimer from '../../pages/CountDown';
import { Loader2 } from 'lucide-react';
import JobResultPage from "../../pages/JobResultPage";

const HeroSection = () => {
  const { 
    steps, 
    setSteps, 
    user, 
    error,
    jobSearching,
    formData,
  } = useContext(AppContext);

  const [timeLeft, setTimeLeft] = useState(60);
  const selectedPlatform = formData?.selectedPlatform || 'upwork';
  const platformLabel = selectedPlatform === 'freelancer' ? 'Freelancer' : 'Upwork';

  // Detect OAuth callback and navigate to step 7
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const freelancerConnected = params.get('freelancer_connected');
    const oauthProvider = params.get('provider');
    const oauthSuccess = params.get('oauth');

    if (freelancerConnected === 'true' && oauthProvider === 'freelancer' && oauthSuccess === 'success') {
      // Set wizard to step 7 (Profile URL step)
      setSteps(7);
      
      // Clean OAuth params from URL without reloading
      const cleanUrl = window.location.pathname + window.location.hash;
      window.history.replaceState({}, document.title, cleanUrl);
    }
  }, [setSteps]);

  // Countdown timer effect
  useEffect(() => {
    if (!jobSearching) {
      setTimeLeft(60);
      return;
    }

    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft((prev) => prev - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [timeLeft, jobSearching]);

  // Format time as MM:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const stepLabels =
    selectedPlatform === 'freelancer'
      ? [
          'Platform',
          'AI service',
          'Project keywords',
          'Bid guardrails',
          'Risk filters',
          'Bidder mode',
          'Profile + connect',
        ]
      : [
          'Platform',
          'AI service',
          'Keywords',
          'Rates',
          'Bad job filters',
          'Role',
          'Profile URL',
        ];

  return (
    <section className="bg-gradient-to-br bg-black min-h-screen flex items-center px-6 relative">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-20 w-2 h-2 bg-lime-400 rounded-full"></div>
        <div className="absolute top-40 right-32 w-1 h-1 bg-lime-400 rounded-full"></div>
        <div className="absolute bottom-40 left-1/3 w-1 h-1 bg-lime-400 rounded-full"></div>
      </div>

      <div className="max-w-4xl mx-auto text-center relative z-10 w-full">
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6 leading-tight">
          AI will find relevant <span className="text-lime-400">{platformLabel}</span><br />
          jobs and respond in <span className="text-lime-400">5 min</span>
        </h1>

        <p className="text-gray-400 text-lg md:text-xl mb-12 max-w-2xl mx-auto">
          AI is now 1.250% daily automation with 30 new available tools
        </p>

        {/* Progress Bar */}
        {steps <= 7 && (
          <div className="mb-8 max-w-4xl mx-auto">
            <div className="flex justify-between mb-2">
              {[1, 2, 3, 4, 5, 6, 7].map((s) => (
                <div
                  key={s}
                  className={`w-full h-2 mx-1 rounded-full transition-all ${
                    s <= steps ? 'bg-lime-400' : 'bg-gray-700'
                  }`}
                />
              ))}
            </div>
            <p className="text-center text-gray-400">
              Step {steps} of 7 • {stepLabels[steps - 1]}
            </p>
          </div>
        )}

        <div className="bg-gray-900/80 backdrop-blur-sm p-8 rounded-2xl max-w-4xl lg:max-w-5xl md:max-w-5xl mx-auto border border-gray-700">
          
          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-900/30 border border-red-500 rounded-lg">
              <p className="text-red-400 text-center">{error}</p>
            </div>
          )}

          {/* Loading State with Countdown */}
          {jobSearching ? (
            <div className="text-center py-12">
              {/* Countdown Timer Circle */}
              <div className="w-40 h-40 mx-auto mb-8 border-4 border-lime-400 rounded-full flex items-center justify-center bg-gray-800/50">
                <span className="text-5xl font-mono text-lime-400 font-bold">
                  {formatTime(timeLeft)}
                </span>
              </div>
              
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
                Preparing your job search...
              </h2>
              
              {/* Platform-specific message */}
              <p className="text-lime-400 text-lg font-semibold mb-2">
                Jobs will be fetched from <span className="font-bold">{platformLabel}</span> within one minute
              </p>
              
              <p className="text-gray-400 mt-3">
                AI is analyzing your profile and finding the best matches
              </p>
            </div>
          ) : (
            <>
              {/* Step 1 - Platform */}
              {steps === 1 && <PlatformSelect />}

              {/* Step 2 - AI Service */}
              {steps === 2 && <AIServiceSelect />}

              {/* Step 3 - Keywords */}
              {steps === 3 && <Keywords steps={steps} setSteps={setSteps} />}

              {/* Step 4 - Rates */}
              {steps === 4 && <Rates />}

              {/* Step 5 - Bad Job Criteria */}
              {steps === 5 && <BadJobCriteria />}

              {/* Step 6 - Role Selection */}
              {steps === 6 && <RoleSelecting />}

              {/* Step 7 - Profile URL */}
              {steps === 7 && <ProfileUrl />}

              {/* Step 8 - Results/User Check */}
              {steps === 8 && (
                <div>
                  {!user ? (
                    // Show login/signup if user not logged in
                    <NoUser />
                  ) : jobSearching ? (
                    // Show countdown/loading if waiting for jobs
                    <CountdownTimer />
                  ) : error ? (
                    // Show error message if there was a problem
                    <div className="text-red-400 p-4">
                      {error}
                    </div>
                  ) : (
                    // Show jobs if user is logged in and no errors
                    <JobResultPage />
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </section>
  );
};

export default HeroSection;