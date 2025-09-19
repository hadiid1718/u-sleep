import React, { useContext, useState } from 'react'
import { AppContext } from '../../context/Context';

const RoleSelecting = () => {
    const { nextStep, prevStep, steps } = useContext(AppContext);
    const [selectedOption, setSelectedOption] = useState('agency');
    return (

        <>
            <div>
                <div className=" flex items-center justify-center p-6">
                    <div className="max-w-4xl w-full">
                        {/* Header */}
                        <div className="text-center mb-12">
                            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
                                <span className="text-lime-400">Step 4 -</span> are you agency founder or freelancer?
                            </h1>
                            <p className="text-gray-300 text-lg">
                                It will help to set up Upwork jobs validation algorithm
                            </p>
                        </div>

                        {/* Card Selection */}
                        <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
                            {/* Agency Founder Card */}
                            <div
                                onClick={() => setSelectedOption('agency')}
                                className={`relative p-8 rounded-2xl cursor-pointer transition-all duration-300 transform hover:scale-105 ${selectedOption === 'agency'
                                        ? 'bg-gray-800 border-2 border-green-400 shadow-lg shadow-green-400/20'
                                        : 'bg-gray-800/50 border-2 border-transparent hover:bg-gray-800/70'
                                    }`}
                            >
                                {/* Selection indicator */}
                                {selectedOption === 'agency' && (
                                    <div className="absolute top-4 right-4 w-6 h-6 bg-green-400 rounded-full flex items-center justify-center">
                                        <span className="text-gray-900 text-sm">✓</span>
                                    </div>
                                )}

                                {/* Building Icon */}
                                <div className="flex justify-center mb-6">
                                    <div className="text-6xl">🏢</div>
                                </div>

                                <h3 className="text-2xl font-bold text-white text-center">
                                    Agency founder
                                </h3>
                            </div>

                            {/* Freelancer Card */}
                            <div
                                onClick={() => setSelectedOption('freelancer')}
                                className={`relative p-8 rounded-2xl cursor-pointer transition-all duration-300 transform hover:scale-105 ${selectedOption === 'freelancer'
                                        ? 'bg-gray-800 border-2 border-green-400 shadow-lg shadow-green-400/20'
                                        : 'bg-gray-800/50 border-2 border-transparent hover:bg-gray-800/70'
                                    }`}
                            >
                                {/* Selection indicator */}
                                {selectedOption === 'freelancer' && (
                                    <div className="absolute top-4 right-4 w-6 h-6 bg-green-400 rounded-full flex items-center justify-center">
                                        <span className="text-gray-900 text-sm">✓</span>
                                    </div>
                                )}

                                {/* Laptop Icon */}
                                <div className="flex justify-center mb-6">
                                    <div className="text-6xl">💻</div>
                                </div>

                                <h3 className="text-2xl font-bold text-white text-center">
                                    Freelancer
                                </h3>
                            </div>
                        </div>


                    </div>
                </div>
            </div>
            <div className='mt-6 flex justify-between items-center '>
                <button className="text-black py-2 px-6  border  rounded-lg font-bold bg-lime-400 hover:bg-lime-300 border-lime-400 cursor-pointer"
                    onClick={{ prevStep }}>
                    Previous Question
                </button>
                <button
                    className="text-black py-2 px-6  border  rounded-lg font-bold bg-lime-400 hover:bg-lime-300 border-lime-400 cursor-pointer"


                    onClick={nextStep}
                >
                    Next {steps + 1} questions
                </button>
            </div>
        </>
    )
}


export default RoleSelecting
