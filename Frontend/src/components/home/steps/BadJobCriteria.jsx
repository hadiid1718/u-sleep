import React, { useContext, useEffect, useState } from 'react';
import { AppContext } from '../../../context/Context';

const BadJobCriteria = () => {
  const { formData, setFormData, prevStep, nextStep, steps } = useContext(AppContext);
  const [selected, setSelected] = useState(formData.badJobCriteria || []);
    useEffect(() => {
      setSelected(Array.isArray(formData.badJobCriteria) ? formData.badJobCriteria : []);
    }, [formData.badJobCriteria]);

  const selectedPlatform = formData.selectedPlatform || 'upwork';
  
  const criteria = [
    { text: "Looking for employee",  },
    { text: "Quick task", },
    { text: "Tutoring",  },
    { text: "Urgent task", },
    { text: "Non english job",  },
    { text: "Startups",  },
    { text: "Not well described",},
    { text: "Too many bids already" },
    { text: "Rating less than 4",  },
    { text: "Spent less than $1,000"},
    { text: "Low hire rate", },
  ];

  const handleToggle = (text) => {
    const newSelected = selected.includes(text)
      ? selected.filter((item) => item !== text)
      : [...selected, text];
    setSelected(newSelected);
    setFormData(prev => ({ ...prev, badJobCriteria: newSelected }));
  };

  return (
    <>
      <div>
        <div className="w-full flex flex-col items-center justify-center text-white">
          <div className="w-full p-10 shadow-lg">
            <h2 className="text-2xl font-bold text-lime-300 mb-2">
              Step 5 – {selectedPlatform === 'freelancer' ? 'skip risky projects' : 'bad job criteria'}
            </h2>
            <p className="text-gray-300 mb-6">
              {selectedPlatform === 'freelancer'
                ? 'Selected items are treated as red flags and removed from fetched projects.'
                : 'Selected items are treated as red flags and removed from fetched jobs.'}
            </p>

            <div className="bg-black/80 text-white py-2 px-4 mb-6 rounded-lg">
              {selected.length > 0
                ? selected.join(", ")
                : "Which project are bad for you? Just write with commas or choose below"}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {criteria.map((item, index) => (
                <button
                  key={index}
                  onClick={() => handleToggle(item.text)}
                  className={`flex items-center justify-center  gap-2 px-4 py-1 rounded-md transition ${
                    selected.includes(item.text)
                      ? "bg-lime-400 text-black font-semibold"
                      : "bg-black/80 text-white hover:bg-lime-400 hover:text-black"
                  }`}
                >
                  <span className="text-sm">{item.text}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className='mt-6 flex justify-between items-center'>
        <button 
          className={`text-black p-2 lg:py-2 lg:px-6 border rounded-lg font-bold ${steps === 1 ? "hidden" : "bg-lime-400 hover:bg-lime-300 border-lime-400 cursor-pointer"}`}
          onClick={prevStep}
        >
          Previous Question
        </button>
        <button
          className="bg-lime-400 hover:bg-lime-300 border-lime-400 cursor-pointer p-2  lg:py-2 lg:px-6 rounded-lg text-black font-bold"
          onClick={nextStep}
        >
          Next {steps + 1} questions
        </button>
      </div>
    </>
  );
};

export default BadJobCriteria;