import React, { useContext, useState } from 'react';
import { AppContext } from '../../../context/Context';

const Rates = () => {
  const { formData, setFormData, nextStep, prevStep, steps } = useContext(AppContext);
  const [hourlyRate, setHourlyRate] = useState(formData.hourlyRate || "");
  const [fixedRate, setFixedRate] = useState(formData.fixedRate || "");

  const handleNext = () => {
    setFormData({ ...formData, hourlyRate, fixedRate });
    nextStep();
  };

  return (
    <>
      <div>
        <div className='max-w-4xl mx-auto text-center relative z-10 w-full text-white'>
          <div className='mb-6'>
            <h1 className='text-4xl font-bold'>
              <span className='text-lime-400'>Step 2</span> - Your Rates
            </h1>
            <p className='text-gray-500 mt-6'>Define Your Rates</p>
          </div>
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 mb-6'>
            <div className='bg-black p-6 rounded-xl border border-gray-700'>
              <h2>Your min Hourly rate</h2>
              <div className='flex items-center justify-center text-lg text-white bg-gray-800 px-4 py-2 rounded-lg'>
                <span className='text-lime-400 font-semibold'>$</span>{" "}
                <input 
                  type="number" 
                  placeholder='50' 
                  value={hourlyRate} 
                  onChange={(e) => setHourlyRate(e.target.value)} 
                  className='w-[100px] bg-gray-800 focus:border-lime-400 focus:outline-none'
                />
                /hr
              </div>
            </div>
            <div className='bg-black p-6 rounded-xl border border-gray-700'>
              <h2>Your min fix price rate</h2>
              <div className='flex items-center justify-center text-lg text-white bg-gray-800 px-4 py-2 rounded-lg'>
                <span className='text-lime-400 font-semibold'>$</span>
                <input 
                  type="number" 
                  placeholder='500' 
                  value={fixedRate} 
                  onChange={(e) => setFixedRate(e.target.value)} 
                  className='w-[100px] bg-gray-800 p-2 focus:border-lime-400 focus:outline-none'
                />
                /project
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className='mt-6 flex justify-between items-center'>
        <button 
          className="text-black py-2 px-6 border rounded-lg font-bold bg-lime-400 hover:bg-lime-300 border-lime-400 cursor-pointer"
          onClick={prevStep}
        >
          Previous Question
        </button>
        <button
          className="text-black py-2 px-6 border rounded-lg font-bold bg-lime-400 hover:bg-lime-300 border-lime-400 cursor-pointer"
          onClick={handleNext}
        >
          Next {steps + 1} questions
        </button>
      </div>
    </>
  );
};

export default Rates;