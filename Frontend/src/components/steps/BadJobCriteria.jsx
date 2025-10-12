import React, { useContext, useState } from 'react';
import { AppContext } from '../../context/Context';

const BadJobCriteria = () => {
  const { formData, setFormData, prevStep, nextStep, steps } = useContext(AppContext);
  const [selected, setSelected] = useState(formData.badJobCriteria || []);
  
  const criteria = [
    { text: "Looking for employee", icon: "👎" },
    { text: "Quick task", icon: "👎" },
    { text: "Tutoring", icon: "👎" },
    { text: "Urgent task", icon: "👎" },
    { text: "Non english job", icon: "👎" },
    { text: "Startups", icon: "👎" },
    { text: "Not well described", icon: "👎" },
    { text: "Rating less than 4.0", icon: "⭐" },
    { text: "Total spent less than $1,000", icon: "💰" },
    { text: "Low hire rate", icon: "📉" },
  ];

  const handleToggle = (text) => {
    const newSelected = selected.includes(text)
      ? selected.filter((item) => item !== text)
      : [...selected, text];
    setSelected(newSelected);
    setFormData({ ...formData, badJobCriteria: newSelected });
  };

  return (
    <>
      <div>
        <div className="w-full flex flex-col items-center justify-center text-white">
          <div className="w-full p-10 shadow-lg">
            <h2 className="text-2xl font-bold text-lime-300 mb-2">
              Step 3 – bad job criteria
            </h2>
            <p className="text-gray-300 mb-6">
              Write down what you don't like in jobs, to filter them.
            </p>

            <div className="bg-black/80 text-white px-4 py-3 rounded-lg mb-6">
              {selected.length > 0
                ? selected.join(", ")
                : "Which project are bad for you? Just write with commas or choose below"}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {criteria.map((item, index) => (
                <button
                  key={index}
                  onClick={() => handleToggle(item.text)}
                  className={`flex items-center justify-center gap-2 px-1 py-1 rounded-full transition ${
                    selected.includes(item.text)
                      ? "bg-lime-400 text-black font-semibold"
                      : "bg-black/80 text-white hover:bg-lime-400 hover:text-black"
                  }`}
                >
                  <span>{item.icon}</span>
                  <span className="text-sm">{item.text}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className='mt-6 flex justify-between items-center'>
        <button 
          className={`text-black py-2 px-6 border rounded-lg font-bold ${steps === 1 ? "hidden" : "bg-lime-400 hover:bg-lime-300 border-lime-400 cursor-pointer"}`}
          onClick={prevStep}
        >
          Previous Question
        </button>
        <button
          className="bg-lime-400 hover:bg-lime-300 border-lime-400 cursor-pointer py-2 px-6 rounded-lg text-black font-bold"
          onClick={nextStep}
        >
          Next {steps + 1} questions
        </button>
      </div>
    </>
  );
};

export default BadJobCriteria;