const Footer = () => {
    return (
  <footer className="bg-black py-8 px-6 border-t border-gray-800">
    <div className="max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 bg-lime-400 rounded-sm"></div>
          <span className="text-white font-medium text-lg">U never sleep</span>
        </div>
        
        <div className="flex items-center space-x-6 text-sm">
          <a href="#" className="text-gray-400 hover:text-white">Privacy Policy</a>
          <a href="#" className="text-gray-400 hover:text-white">Terms of Service</a>
          <a href="#" className="text-gray-400 hover:text-white">Contact</a>
          <div className="flex items-center space-x-4">
            <div className="w-5 h-5 bg-gray-600 rounded"></div>
            <div className="w-5 h-5 bg-gray-600 rounded"></div>
            <div className="w-5 h-5 bg-gray-600 rounded"></div>
          </div>
        </div>
      </div>
      
      <div className="mt-6 pt-6 border-t border-gray-800 text-center">
        <p className="text-gray-500 text-xs">
          © 2024 U never sleep. All rights reserved. Built with love for freelancers who never sleep.
        </p>
      </div>
    </div>
  </footer>
)};
export default Footer;