import React, { useState } from 'react';
import JobResponseGenerator from '../components/JobResponseGenerator';
const JobSelectionPage = () => {
  const [showTooltip, setShowTooltip] = useState(true);

  const [showReasonModel, setShowReasonModel] = useState(false);
  const [reason, setReason] = useState('');
    const [showJobResponse, setShowJobResponse] = useState(false);

    



  const handleDismatch = () => {
    setShowReasonModel(true)
  };
  const closeReasonModel = () => {
    setShowReasonModel(false)
  }
  const handleSubmit = () => {
    if(!reason) {
      alert("PLease provide atleast one reason.")
    } else {
    alert("Your reason submitted successfully, now we are directing to nect job.")
    }
  }

 const handleMatch = () => {
  setShowJobResponse(true);  
};

if (showJobResponse) {
  return <JobResponseGenerator onClose={() => setShowJobResponse(false)} />;
}

  const closeTooltip = () => {
    setShowTooltip(false);
  };

  const handleNextFromTooltip = () => {
    setShowTooltip(false);
    // Add logic for proceeding to next job
  };

  return (
    <div className="min-h-screen bg-gray-900 p-4">
      {/* Header */}
      <div className="flex justify-center flex-col gap-3 items-center mb-6">
        <div className="text-gray-300">Job 1 of 16</div>
        <div className="flex gap-4">
          <button className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors">
            Go to Dashboard
          </button>
          <button className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors">
            Set-up Auto-responder demo
          </button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row lg:flex-row gap-6 max-w-7xl mx-auto">
        {/* Left Panel - Job Details */}
        <div className="flex-1 bg-gray-800 rounded-lg p-6 border-2 border-green-400">
          {/* AI Selected Badge */}
          <div className="mb-4">
            <span className="bg-green-400 text-gray-900 px-3 py-1 rounded-full text-sm font-semibold">
              AI selected job
            </span>
          </div>

          {/* Job Title */}
          <h2 className="text-2xl font-bold text-white mb-4">
            E-commerce Website Development for Electrical Products
          </h2>

          {/* Warning Badge */}
          <div className="bg-orange-600 text-white px-3 py-1 rounded-lg inline-block mb-6 text-sm">
            ⚠️ Attention - this client is new and don't have any reviews!
          </div>

          {/* Job Description */}
          <div className="text-gray-300 mb-6 leading-relaxed">
            We are seeking a skilled web developer to create a shopping website
            focused on selling electrical products. The ideal candidate should have
            experience in e-commerce platforms and be able to design an intuitive
            user interface, implement secure payment gateways, and optimize for
            mobile responsiveness. You will work closely with our team to ensure the
            website meets our branding and functional requirements. If you are
            passionate about creating engaging online shopping experiences, we
            would love to hear from you.
          </div>

          {/* Client Info */}
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

          {/* Location */}
          <div className="mb-6">
            <h3 className="text-white font-semibold mb-2">Location preferences</h3>
            <p className="text-gray-300">Location mandatory: No</p>
          </div>

          {/* Link */}
          <div className="mb-6">
            <a href="#" className="text-green-400 hover:text-green-300 underline flex items-center gap-1 transition-colors">
              Link to Upwork job 🔗
            </a>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <button
              onClick={handleDismatch}
              className="flex-1 bg-gray-600 hover:bg-gray-500 text-white py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
            >
              ⚠️ Dismatch
            </button>
            <button
              onClick={handleMatch}
              className="flex-1 bg-green-400 hover:bg-green-500 text-gray-900 py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
            >
              ✅ Match
            </button>
          </div>
        </div>

        {/* Right Panel - AI Analysis */}
        <div className="flex-1">
          <div className="bg-gray-800 rounded-lg p-6 mb-4">
            <h3 className="text-green-400 font-semibold mb-4">
              AI detected that this is a good fit for you — here's why:
            </h3>
            <p className="text-gray-300 leading-relaxed mb-4">
              This job fits our segment because it requires a skilled web
              developer for a full project focused on e-commerce website
              development. It involves creating a shopping site, which aligns
              with our services in web development, as opposed to being a quick
              task or looking for an employee. This is an appropriate project for our agency.
            </p>

            {/* Swipe Tips */}
            <div className="mb-4">
              <p className="text-yellow-400 font-semibold mb-2">💡 Swipe Tips:</p>
              <ul className="text-gray-300 text-sm space-y-1">
                <li>• Swipe right or tap 🟢 to match</li>
                <li>• Swipe left or tap ⚠️ to dismiss</li>
                <li>• Watch for animations and feedback!</li>
              </ul>
            </div>
          </div>


        </div>



      </div>

      {/* Reason Feedback handle by dismatch button  */}

     { showReasonModel && (
        <section className='max-w-[250px] mx-auto  bg-blur relative inset-0 z-50 bg-black bg-opacity-5'>
        <div className='shadow-xl bg-white border-2 border-gray-100 px-10 py-4 absolute bottom-[250px] lg:bottom-14 lg:right-10' >
          <button
            onClick={closeReasonModel}
            className="absolute -top-2 -right-2 w-6 h-6 bg-gray-700 text-white rounded-full flex items-center justify-center text-sm hover:bg-gray-600 transition-colors"
          >
            ×
          </button>
          <div className='flex flex-col gap-2 justify-center items-center'>
            <h1 className='text-xl font-semibold text-lime-600 mt-3'>
              Why this job did not match
            </h1>
            <textarea  className='resize-none outline-0 border-2 border-gray-900 py-10 px-12   rounded-lg ' type="text" placeholder='Give your reason' name='reason ' value={reason} onChange={(e) => setReason(e.target.value)} />
          </div>
          <div className='flex justify-between items-center  mt-5'>
            <button onClick={closeReasonModel} className='border border-red-600 px-4 py-1 rounded-lg hover:bg-red-600 hover:transition-all hover:text-white'>Cancle</button>
            <button onClick={handleSubmit} className='bg-lime-400 border border-lime-400 px-4 py-1 rounded-lg hover:bg-lime-500 hover:transition-all hover:text-black'>Submit</button>
          </div>
        </div>
      </section>
     )}

      {/* Bottom Tooltip */}
      {showTooltip && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
          <div className="bg-green-400 text-gray-900 p-4 rounded-lg relative max-w-md">
            <button
              onClick={closeTooltip}
              className="absolute -top-2 -right-2 w-6 h-6 bg-gray-700 text-white rounded-full flex items-center justify-center text-sm hover:bg-gray-600 transition-colors"
            >
              ×
            </button>
            <h4 className="font-bold mb-2">Job Selection</h4>
            <p className="text-sm mb-4">
              This is selected Upwork jobs by your criteria. Swipe right if
              you like it and left if not. If you like it - the job respond will be
              generated!
            </p>
            <button
              onClick={handleNextFromTooltip}
              className="bg-gray-900 text-green-400 px-6 py-2 rounded-lg font-semibold w-full hover:bg-gray-800 transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default JobSelectionPage;