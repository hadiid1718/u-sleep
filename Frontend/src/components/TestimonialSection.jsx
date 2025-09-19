const TestimonialSection = () => (
  <section className="bg-black py-20 px-6">
    <div className="max-w-4xl mx-auto">
      <h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-16">
        What our users say
      </h2>
      
      <div className="bg-gray-900 p-8 rounded-xl border border-gray-800">
        <div className="flex items-start space-x-4">
          <div className="w-16 h-16 bg-red-500 rounded-lg flex-shrink-0 flex items-center justify-center">
            <span className="text-white font-bold">👨</span>
          </div>
          <div className="flex-1">
            <p className="text-white text-lg mb-4">
              "Finally, I found a system that actually works. Save money with Al<br/>
              solutions."
            </p>
            <div className="flex items-center space-x-4">
              <button className="bg-lime-400 text-black px-6 py-2 rounded-lg text-sm font-medium">
                Start your free trial
              </button>
              <button className="text-lime-400 text-sm hover:underline">
                View video case study →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
);
export default TestimonialSection;
