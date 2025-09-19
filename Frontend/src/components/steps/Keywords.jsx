import React, { useContext, useState } from 'react';
import { AppContext } from '../../context/Context';

const Keywords = ({  }) => {
    const { steps, setSteps , prevStep, nextStep} = useContext(AppContext);
      const [keywords, setKeywords] = useState([]);
      const [inputValue, setInputValue] = useState('');
      const handleAdded = () => {
    if (inputValue.trim() && !keywords.includes(inputValue)) {
      setKeywords([...keywords, inputValue.trim()]);
      setInputValue('');
    }
  }

  const handleRemove = (keywordToRemove) => {
    setKeywords(keywords.filter((k) => k !== keywordToRemove));
  };
  
  return (
    <>
    <div>
       <div className="max-w-4xl mx-auto text-center relative z-10 w-full">
              <div className='mb-4'>
                <h3 className="text-white text-4xl  font-bold mb-4"> <span className='text-lime-400'>Step 1</span>- write your keywords</h3>
                <p className='text-gray-500'>Exact the same keywords, which you use in Upwork.</p>
              </div>
              <div className='flex md:flex-row lg:flex-row flex-col  gap-2 items-center'>
                <input
                  type="text"
                  placeholder="Enter your 1 keyword for job. "
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  className="w-full p-1 bg-gray-800 text-white rounded-lg border border-gray-600 focus:border-lime-400 focus:outline-none mb-2"
                />
                <button className="lg:w-[150px] md:w-[150px] w-full bg-lime-400 text-black py-1 p-1 rounded-lg font-bold text-lg hover:bg-lime-300 transition-colors mb-4"
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
                    <button onClick={() => handleRemove(keyword)}>
                      X
                    </button>
                  </span>
                ))}
              </div>

            </div>
    </div>
     <div className='mt-6 flex justify-between items-center '>
          <button className={` text-black py-2 px-6  border  rounded-lg font-bold ${steps === 1 ? "hidden" : "bg-lime-400 hover:bg-lime-300 border-lime-400 cursor-pointer"}`}
            onClick={{prevStep}}>
            Previous Question
          </button>
          <button
            className={`text-black py-2 px-6  border  rounded-lg font-bold
    ${keywords.length === 0
                ? "bg-gray-500 cursor-not-allowed"
                : "bg-lime-400 hover:bg-lime-300 border-lime-400 cursor-pointer"
              }
    ${steps === 1 ? "mt-6 ml-6" : ""}
    `}
            disabled={keywords.length === 0}
            onClick={nextStep}
          >
            Next {steps + 1} questions
          </button>
        </div>
    </>
  )
}

export default Keywords
