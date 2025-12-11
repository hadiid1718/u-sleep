import React, { useContext, useState } from 'react';
import Keywords from './steps/Keywords';
import Rates from './steps/Rates';
import BadJobCriteria from './steps/BadJobCriteria';
import RoleSelecting from './steps/RoleSelecting';
import ProfileUrl from './steps/ProfileUrl';
import { AppContext } from '../../context/Context';
import NoUser from './NoUser';
import CountdownTimer from '../../pages/CountDown';
import { Loader2 } from 'lucide-react';
import JobSelectionPage from '../../pages/JobResultPage';
import JobDetails from '../JobDetail';

const HeroSection = () => {
  const { 
    steps, 
    setSteps, 
    user, 
    loading,
    setLoading, 
    error,
    setError,
    jobResults 
  } = useContext(AppContext);

  return (
    <section className="bg-gradient-to-br from-green-900 via-black to-black min-h-screen flex items-center px-6 relative">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-20 w-2 h-2 bg-lime-400 rounded-full"></div>
        <div className="absolute top-40 right-32 w-1 h-1 bg-lime-400 rounded-full"></div>
        <div className="absolute bottom-40 left-1/3 w-1 h-1 bg-lime-400 rounded-full"></div>
      </div>

      <div className="max-w-4xl mx-auto text-center relative z-10 w-full">
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6 leading-tight">
          AI will find relevant <span className="text-lime-400">Upwork</span><br />
          jobs and respond in <span className="text-lime-400">5 min</span>
        </h1>

        <p className="text-gray-400 text-lg md:text-xl mb-12 max-w-2xl mx-auto">
          AI is now 1.250% daily automation with 30 new available tools
        </p>

        {/* Progress Bar */}
        {steps <= 5 && (
          <div className="mb-8 max-w-4xl mx-auto">
            <div className="flex justify-between mb-2">
              {[1, 2, 3, 4, 5].map((s) => (
                <div
                  key={s}
                  className={`w-full h-2 mx-1 rounded-full transition-all ${
                    s <= steps ? 'bg-lime-400' : 'bg-gray-700'
                  }`}
                />
              ))}
            </div>
            <p className="text-center text-gray-400">Step {steps} of 5</p>
          </div>
        )}

        <div className="bg-gray-900/80 backdrop-blur-sm p-8 rounded-2xl max-w-4xl lg:max-w-5xl md:max-w-5xl mx-auto border border-gray-700">
          
          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-900/30 border border-red-500 rounded-lg">
              <p className="text-red-400 text-center">{error}</p>
            </div>
          )}

          {/* Loading State */}
          {loading ? (
            <div className="text-center py-12">
              <Loader2 className="animate-spin h-16 w-16 text-lime-400 mx-auto mb-4" />
              <p className="text-white text-xl">Fetching jobs from Upwork...</p>
              <p className="text-gray-400 mt-2">Analyzing with AI... This may take a few moments</p>
            </div>
          ) : (
            <>
              {/* Step 1 - Keywords */}
              {steps === 1 && <Keywords steps={steps} setSteps={setSteps} />}

              {/* Step 2 - Rates */}
              {steps === 2 && <Rates />}

              {/* Step 3 - Bad Job Criteria */}
              {steps === 3 && <BadJobCriteria />}

              {/* Step 4 - Role Selection */}
              {steps === 4 && <RoleSelecting />}

              {/* Step 5 - Profile URL */}
              {steps === 5 && <ProfileUrl />}

              {/* Step 6 - Results/User Check */}
              {steps === 6 && (
                <div>
                  {!user ? (
                    // Show login/signup if user not logged in
                    <NoUser />
                  ) : loading ? (
                    // Show countdown/loading if waiting for jobs
                    <CountdownTimer />
                  ) : error ? (
                    // Show error message if there was a problem
                    <div className="text-red-400 p-4">
                      {error}
                    </div>
                  ) : (
                    // Show jobs if user is logged in and no errors
                    <JobSelectionPage />
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