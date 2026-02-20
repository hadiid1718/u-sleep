

const BuiltInPublic = () => {
return(

  <section className="bg-black py-20 px-6">
    <div className="max-w-4xl mx-auto text-center">
      <h2 className="text-3xl md:text-4xl font-bold text-white mb-8">
        Built in public
      </h2>
      <p className="text-gray-400 mb-12 max-w-2xl mx-auto">
        We're a company on a mission to save everyone 5+ working hours per day.
      </p>
      
      <div className="flex justify-center items-center space-x-12 mb-12">
        <div className="text-center">
          <div className="w-12 h-12 bg-gray-700 rounded-full mx-auto mb-3 flex items-center justify-center">
            <span className="text-white text-xl">𝕏</span>
          </div>
          <p className="text-gray-400 text-sm">Follow</p>
        </div>
        <div className="text-center">
          <div className="w-12 h-12 bg-gray-700 rounded-full mx-auto mb-3 flex items-center justify-center">
            <span className="text-white text-xl">in</span>
          </div>
          <p className="text-gray-400 text-sm">Follow</p>
        </div>
      </div>
      
      <div>
        <h3 className="text-white text-xl font-medium mb-6">Join my community</h3>
        <div className="flex justify-center space-x-4">
          <button className="bg-gray-800 text-white px-8 py-3 rounded-lg hover:bg-gray-700 transition-colors border border-gray-700">
            Discord
          </button>
          <button className="bg-gray-800 text-white px-8 py-3 rounded-lg hover:bg-gray-700 transition-colors border border-gray-700">
            Telegram  
          </button>
        </div>
      </div>
    </div>
  </section>
)}
;
export default BuiltInPublic;