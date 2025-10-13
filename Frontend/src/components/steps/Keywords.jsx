import React, { useContext, useState } from 'react';
import { AppContext } from '../../context/Context';

const Keywords = () => {
  const { formData, setFormData, nextStep, steps } = useContext(AppContext);
  const [keywords, setKeywords] = useState(formData.keywords || []);
  const [inputValue, setInputValue] = useState('');

  const handleAdded = () => {
    if (inputValue.trim() && !keywords.includes(inputValue.trim())) {
      const newKeywords = [...keywords, inputValue.trim()];
      setKeywords(newKeywords);
      setFormData({ ...formData, keywords: newKeywords });
      setInputValue('');
    }
  };

  const handleRemove = (keywordToRemove) => {
    const newKeywords = keywords.filter((k) => k !== keywordToRemove);
    setKeywords(newKeywords);
    setFormData({ ...formData, keywords: newKeywords });
  };

  return (
    <>
      <div>
        <div className="max-w-4xl mx-auto text-center relative z-10 w-full">
          <div className='mb-4'>
            <h3 className="text-white text-4xl font-bold mb-4">
              <span className='text-lime-400'>Step 1</span> - write your keywords
            </h3>
            <p className='text-gray-500'>Exact the same keywords, which you use in Upwork.</p>
          </div>
          <div className='flex justify-center items-center md:flex-row lg:flex-row flex-col gap-2 mt-5'>
            <input
              type="text"
              placeholder="Enter your 1 keyword for job."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAdded()}
              className="w-[400px] p-1 bg-gray-800 text-white rounded-lg border border-gray-600 focus:border-lime-400 focus:outline-none mb-2"
            />
            <button 
              className="lg:w-[100px] md:w-[100px] w-full bg-lime-400 text-black rounded-lg font-bold text-lg hover:bg-lime-300 transition-colors mb-4"
              onClick={handleAdded}
            >
              Add
            </button>
          </div>
          <div>
            {keywords.map((keyword, index) => (
              <span
                key={index}
                className='bg-lime-400 text-black py-1 px-3 rounded-full text-sm font-semibold mr-2 mb-2 inline-flex items-center gap-2'
              >
                {keyword}
                <button onClick={() => handleRemove(keyword)}>X</button>
              </span>
            ))}
          </div>
        </div>
      </div>
      <div className='mt-6 flex justify-between items-center'>
        <button 
          className={`text-black py-2 px-6 border rounded-lg font-bold ${steps === 1 ? "hidden" : "bg-lime-400 hover:bg-lime-300 border-lime-400 cursor-pointer"}`}
          onClick={() => {}}
        >
          Previous Question
        </button>
        <button
          className={`text-black py-2 px-6 border rounded-lg font-bold ${keywords.length === 0 ? "bg-gray-500 cursor-not-allowed" : "bg-lime-400 hover:bg-lime-300 border-lime-400 cursor-pointer"} ${steps === 1 ? "mt-6 ml-6" : ""}`}
          disabled={keywords.length === 0}
          onClick={nextStep}
        >
          Next {steps + 1} questions
        </button>
      </div>
    </>
  );
};

export default Keywords;