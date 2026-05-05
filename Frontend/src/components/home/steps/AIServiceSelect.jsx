import React, { useContext } from 'react';
import { AppContext } from '../../../context/Context';

const services = [
  {
    id: 'gemini',
    title: 'Gemini',
    description: 'Fast generation and strong results for job matching.',
  },
  {
    id: 'openai',
    title: 'OpenAI (GPT-4 Turbo)',
    description: 'Detailed reasoning and structured matching output.',
  },
];

const AIServiceSelect = () => {
  const { formData, setFormData, nextStep, prevStep } = useContext(AppContext);

  const selectedService = formData.aiService || 'gemini';

  const handleSelect = service => {
    setFormData({
      ...formData,
      aiService: service,
    });
  };

  return (
    <>
      <div className="max-w-4xl mx-auto text-center w-full">
        <h3 className="text-white text-4xl font-bold mb-4">
          <span className="text-lime-400">Step 2</span> - select your AI service
        </h3>
        <p className="text-gray-400 mb-8">
          Choose which AI engine should score and filter your job matches.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {services.map(service => (
            <button
              key={service.id}
              onClick={() => handleSelect(service.id)}
              className={`rounded-xl border p-6 text-left transition ${
                selectedService === service.id
                  ? 'border-lime-400 bg-lime-400/10'
                  : 'border-gray-700 bg-gray-900 hover:border-lime-400/60'
              }`}
            >
              <h4 className="text-white text-2xl font-semibold mb-2">
                {service.title}
              </h4>
              <p className="text-gray-400 text-sm">{service.description}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 flex justify-between">
        <button
          className="text-black py-2 px-6 border rounded-lg font-bold bg-lime-400 hover:bg-lime-300 border-lime-400 cursor-pointer"
          onClick={prevStep}
        >
          Previous Question
        </button>
        <button
          className="text-black py-2 px-6 border rounded-lg font-bold bg-lime-400 hover:bg-lime-300 border-lime-400 cursor-pointer"
          onClick={nextStep}
        >
          Next Question
        </button>
      </div>
    </>
  );
};

export default AIServiceSelect;
