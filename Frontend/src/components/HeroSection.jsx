import React, { useContext, useState } from 'react';
import Keywords from './steps/Keywords';
import Rates from './steps/Rates';
import BadJobCriteria from './steps/BadJobCriteria';
import RoleSelecting from './steps/RoleSelecting';
import ProfileUrl from './steps/ProfileUrl';
import { AppContext } from '../context/Context';
import NoUser from './NoUser';
import CountdownTimer from '../pages/CountDown';

const HeroSection = () => {

  const { steps, setSteps , user, setUser} = useContext(AppContext)

  return (
    <section className="bg-gradient-to-br from-green-900 via-black to-black min-h-screen  flex items-center px-6 relative">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-20 w-2 h-2 bg-lime-400 rounded-full"></div>
        <div className="absolute top-40 right-32 w-1 h-1 bg-lime-400 rounded-full"></div>
        <div className="absolute bottom-40 left-1/3 w-1 h-1 bg-lime-400 rounded-full"></div>
      </div>

      <div className="max-w-4xl mx-auto text-center relative z-10">
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6 leading-tight">
          AI will find relevant <span className="text-lime-400">Upwork</span><br />
          jobs and respond in <span className="text-lime-400">5 min</span>
        </h1>

        <p className="text-gray-400 text-lg md:text-xl mb-12 max-w-2xl mx-auto">
          AI is now 1.250% daily automation with 30 new available tools
        </p>

        <div className="bg-gray-900/80  backdrop-blur-sm p-8 rounded-2xl max-w-4xl lg:max-w-5xl md:max-w-5xl mx-auto border border-gray-700">
          {steps === 1 && (
            <Keywords steps={steps} setSteps={setSteps} />
          )}
          {/* Step 2 */}
          {steps === 2 && (
            <Rates />

          )}

          {/* Step 3 */}
          {steps === 3 && (
            <BadJobCriteria />
          )}
          {/* Step 4 */}
          {steps === 4 && (
            <RoleSelecting />

          )}
          {/* Step 5 */}
          {steps === 5 && (
            <ProfileUrl />
          )}
          {/* Step 6 */}
          {steps === 6 && (
            <div>
               { !user ? (
                 <NoUser/>
               ):(
                <CountdownTimer/>
               )}
            </div>
          )}


        </div>

      </div>
    </section>
  );
};

export default HeroSection;