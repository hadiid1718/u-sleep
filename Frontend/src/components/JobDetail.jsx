import React from 'react';
import { ExternalLink } from 'lucide-react';

const JobDetails = () => {
  return (
    <div className="bg-gray-900 border-2 border-lime-400 rounded-2xl p-8">
      <div className="inline-block bg-lime-400 text-gray-900 px-4 py-1.5 rounded-full text-sm font-bold mb-6">
        AI selected job
      </div>
      
      <h2 className="text-white text-2xl font-bold mb-6 leading-tight">
        Full-Time AI Developer with Expertise in WebRTC,<br />React, and TokBox
      </h2>
      
      <div className="bg-gray-800 border border-gray-700 rounded-lg px-5 py-3 mb-6 inline-block">
        <span className="text-lime-400 font-bold">Fixed: 1500.0 USD</span>
      </div>
      
      <div className="text-gray-300 text-base leading-relaxed space-y-4 mb-8">
        <p>
          We're seeking an AI Developer who is familiar with TokBox (Vonage), Agora, and WebRTC to create and optimize real-time video communication capabilities. You should understand how to manage sessions, handle multi-stream group calls on mobile devices, incorporate AI captions, and ensure safe token management. It helps if you have experience with production analytics, debugging, and network reconnection.
        </p>
        <p>
          This is a full-time role requiring independent work across time zones. Please share your portfolio and relevant experience.
        </p>
      </div>
      
      <div className="space-y-6 mb-8">
        <h3 className="text-white font-bold text-xl">About this client</h3>
        <div className="grid grid-cols-2 gap-x-12 gap-y-3">
          <div className="text-gray-400 text-base">
            Posted jobs: <span className="text-white font-semibold">96</span>
          </div>
          <div className="text-gray-400 text-base">
            Verification: <span className="text-white font-semibold">VERIFIED</span>
          </div>
          <div className="text-gray-400 text-base">
            Reviews: <span className="text-white font-semibold">26</span>
          </div>
          <div className="text-gray-400 text-base">
            Rating: <span className="text-white font-semibold">4.97</span>
          </div>
          <div className="text-gray-400 text-base">
            Total spent: <span className="text-white font-semibold">83425.95</span>
          </div>
          <div className="text-gray-400 text-base">
            Total hires: <span className="text-white font-semibold">48</span>
          </div>
        </div>
      </div>
      
      <div className="space-y-3 mb-8">
        <h3 className="text-white font-bold text-xl">Location preferences</h3>
        <p className="text-gray-400 text-base">
          Location mandatory: <span className="text-white font-semibold">No</span>
        </p>
      </div>
      
      <a href="#" className="text-lime-400 hover:underline flex items-center gap-2 text-base font-medium">
        Link to Upwork job <ExternalLink size={18} />
      </a>
    </div>
  );
};

export default JobDetails;