import React, { useContext } from 'react';
import { AppContext } from '../../../context/Context';

const platforms = [
  {
    id: 'upwork',
    title: 'Upwork',
    description: 'Use existing Upwork search and proposal workflow',
  },
  {
    id: 'freelancer',
    title: 'Freelancer',
    description: 'Search Freelancer projects, shortlist opportunities, and generate bid-ready proposals',
  },
];

const PlatformSelect = () => {
  const { formData, setFormData, nextStep } = useContext(AppContext);

  const selectedPlatform = formData.selectedPlatform || 'upwork';

  const handleSelect = platform => {
    setFormData({
      ...formData,
      selectedPlatform: platform,
    });
  };

  return (
    <>
      <div className="max-w-4xl mx-auto text-center w-full">
        <h3 className="text-white text-4xl font-bold mb-4">
          <span className="text-lime-400">Step 1</span> - choose your platform
        </h3>
        <p className="text-gray-400 mb-8">
          The next questions will adapt to your selected marketplace.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {platforms.map(platform => (
            <button
              key={platform.id}
              onClick={() => handleSelect(platform.id)}
              className={`rounded-xl border p-6 text-left transition ${
                selectedPlatform === platform.id
                  ? 'border-lime-400 bg-lime-400/10'
                  : 'border-gray-700 bg-gray-900 hover:border-lime-400/60'
              }`}
            >
              <h4 className="text-white text-2xl font-semibold mb-2">
                {platform.title}
              </h4>
              <p className="text-gray-400 text-sm">{platform.description}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 flex justify-end">
        <button
          className="text-black py-2 px-6 border rounded-lg font-bold bg-lime-400 hover:bg-lime-300 border-lime-400 cursor-pointer"
          onClick={nextStep}
        >
          Next 2 questions
        </button>
      </div>
    </>
  );
};

export default PlatformSelect;
