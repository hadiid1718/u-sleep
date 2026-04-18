import React, { useContext, useState } from 'react';
import { AppContext } from '../../../context/Context';
import { Building2, Laptop, Check } from 'lucide-react';

const RoleSelecting = () => {
  const { formData, setFormData, nextStep, prevStep, steps } = useContext(AppContext);
  const [selectedOption, setSelectedOption] = useState(formData.accountType || 'agency');
  const selectedPlatform = formData.selectedPlatform || 'upwork';

  const handleNext = () => {
    setFormData({ ...formData, accountType: selectedOption });
    nextStep();
  };

  return (
    <>
      <div>
        <div className="flex items-center justify-center p-6">
          <div className="max-w-4xl w-full">
            <div className="text-center mb-12">
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
                <span className="text-lime-400">Step 5 -</span>{' '}
                {selectedPlatform === 'freelancer'
                  ? 'choose your bidding mode'
                  : 'are you agency founder or freelancer?'}
              </h1>
              <p className="text-gray-300 text-lg">
                {selectedPlatform === 'freelancer'
                  ? 'This helps tailor freelancer-style cover letters and bid positioning.'
                  : 'It helps fine-tune Upwork job filtering.'}
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
              {/* Agency Founder Card */}
              <div
                onClick={() => setSelectedOption('agency')}
                className={`relative p-8 rounded-2xl cursor-pointer transition-all duration-300 transform hover:scale-105 ${
                  selectedOption === 'agency'
                    ? 'bg-gray-800 border-2 border-green-400 shadow-lg shadow-green-400/20'
                    : 'bg-gray-800/50 border-2 border-transparent hover:bg-gray-800/70'
                }`}
              >
                {selectedOption === 'agency' && (
                  <div className="absolute top-4 right-4 w-6 h-6 bg-green-400 rounded-full flex items-center justify-center">
                    <Check className="w-4 h-4 text-gray-900" />
                  </div>
                )}

                <div className="flex justify-center mb-6">
                  <Building2 className="w-16 h-16 text-white" />
                </div>

                <h3 className="text-2xl font-bold text-white text-center">
                  Agency founder
                </h3>
              </div>

              {/* Freelancer Card */}
              <div
                onClick={() => setSelectedOption('freelancer')}
                className={`relative p-8 rounded-2xl cursor-pointer transition-all duration-300 transform hover:scale-105 ${
                  selectedOption === 'freelancer'
                    ? 'bg-gray-800 border-2 border-green-400 shadow-lg shadow-green-400/20'
                    : 'bg-gray-800/50 border-2 border-transparent hover:bg-gray-800/70'
                }`}
              >
                {selectedOption === 'freelancer' && (
                  <div className="absolute top-4 right-4 w-6 h-6 bg-green-400 rounded-full flex items-center justify-center">
                    <Check className="w-4 h-4 text-gray-900" />
                  </div>
                )}

                <div className="flex justify-center mb-6">
                  <Laptop className="w-16 h-16 text-white" />
                </div>

                <h3 className="text-2xl font-bold text-white text-center">
                  Freelancer
                </h3>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className='mt-6 flex justify-between items-center'>
        <button 
          className="text-black p-2 lg:py-2 lg:px-6 border rounded-lg font-bold bg-lime-400 hover:bg-lime-300 border-lime-400 cursor-pointer"
          onClick={prevStep}
        >
          Previous Question
        </button>
        <button
          className="text-black p-2 lg:py-2 lg:px-6 border rounded-lg font-bold bg-lime-400 hover:bg-lime-300 border-lime-400 cursor-pointer"
          onClick={handleNext}
        >
          Next {steps + 1} questions
        </button>
      </div>
    </>
  );
};

export default RoleSelecting;