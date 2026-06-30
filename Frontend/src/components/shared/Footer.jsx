import { Link } from "react-router-dom";

const Footer = () => {
    return (
  <footer className="bg-gradient-to-br bg-black text-gray-100 py-8 px-6 border-t border-gray-800">
    <div className="max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
        <div className="flex items-center space-x-2">
          <span className="text-gray-700 font-medium text-lg">U sleep</span>
        </div>
        
        <div className="flex items-center space-x-6 text-sm">
          <Link to="/privacy" className="text-gray-500 hover:text-gray-600">
            Privacy Policy
          </Link>
          <Link to="/terms-and-conditions" className="text-gray-500 hover:text-gray-600">
            Terms of Service
          </Link>
          <Link to="/contact" className="text-gray-500 hover:text-gray-600">
            Contact
          </Link>
          <div className="flex items-center space-x-4">
            <div className=" cursor-pointer w-7 h-5 bg-gray-600 rounded flex items-center justify-center text-white hover:bg-lime-400 hover:transition-all hover:text-black">𝕏</div>
            <div className="cursor-pointer w-7 h-5 bg-gray-600 rounded text-white flex items-center justify-center font-bold hover:bg-lime-400 hover:text-black hover:transition-all">in</div>
            <div className="cursor-pointer w-7 h-5 bg-gray-600 rounded flex items-center justify-center text-white font-bold hover:bg-lime-400 hover:text-black hover:transition-all">f</div>
          </div>
        </div>
      </div>
      
      <div className="mt-6 pt-6 border-t border-gray-800 text-center">
        <p className="text-gray-500 text-xs">
          © 2024 U sleep. All rights reserved. Built with love for freelancers who never sleep.
        </p>
      </div>
    </div>
  </footer>
)};
export default Footer;