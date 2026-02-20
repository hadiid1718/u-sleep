import React from 'react';

const LoadingScreen = () => {
  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="text-center">
        <div className="grid grid-cols-3 gap-3 mb-12 mx-auto w-fit">
          {[...Array(9)].map((_, i) => (
            <div
              key={i}
              className="w-6 h-6 rounded-full animate-pulse"
              style={{ 
                backgroundColor: i < 3 ? '#7a8a3a' : i < 6 ? '#9aaa4a' : '#bef264',
                animationDelay: `${i * 0.15}s`,
                animationDuration: '1.5s'
              }}
            />
          ))}
        </div>
        <h1 className="text-white text-5xl font-bold mb-4">
          Generating your job<br />response...
        </h1>
        <p className="text-gray-400 text-lg">
          AI is crafting a personalized response for this<br />job
        </p>
      </div>
    </div>
  );
};

export default LoadingScreen;