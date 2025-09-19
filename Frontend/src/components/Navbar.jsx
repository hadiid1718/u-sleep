

// Header Component
const Header = () => {
    return(
  <header className="flex justify-between items-center px-6 py-4 bg-black">
    <div className="flex items-center space-x-2">
      <span className="text-white font-medium text-lg"> <span className="text-lime-400">U</span> never sleep</span>
    </div>
    <nav className="hidden md:flex items-center space-x-6">
      <a href="#" className="bg-lime-400 text-black px-4 py-2 rounded-md text-sm font-medium hover:bg-lime-300">Shehdule Demo</a>
      <a href="#" className="bg-lime-400 text-black px-4 py-2 rounded-md text-sm font-medium hover:bg-lime-300">Sign Up</a>
      <button className="bg-black  text-gray-100 border border-gray-400 px-4 py-2 rounded-md text-sm font-medium hover:border hover:border-lime-400 ">
        Sign In
      </button>
    </nav>
  </header>
    )
}
export default Header



