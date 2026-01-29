import { useContext, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AppContext } from "../../context/Context";


const Header = () => {
  const { user, handleLogout } = useContext(AppContext);
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogoutClick = () => {
    handleLogout();
    navigate("/");
    setIsMobileMenuOpen(false); // Close mobile menu after logout
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      <header className="flex justify-between items-center px-6 py-4 bg-black relative z-50">
        <Link to="/" className="text-white font-medium text-lg">
          <span className="text-lime-400">U</span> sleep
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-6">
          {!user ? (
            <>
              <Link
                to="/demo-scheduling"
                className="bg-lime-400 text-black px-4 py-2 rounded-md hover:bg-lime-500 transition"
              >
                Schedule Demo
              </Link>

              <Link
                to="/user/sign-up"
                className="bg-lime-400 text-black px-4 py-2 rounded-md hover:bg-lime-500 transition"
              >
                Sign Up
              </Link>

              <Link
                to="/user/sign-in"
                className="border border-gray-400 bg-gray-200 text-gray-900 px-4 py-2 rounded-md hover:bg-gray-300 transition"
              >
                Sign In
              </Link>
            </>
          ) : (
            <>
              <span className="text-white">
                Welcome, {user.name || user.username || user.email || "User"}!
              </span>

              <Link
                to="/demo-scheduling"
                className="bg-lime-400 text-black px-4 py-2 rounded-md hover:bg-lime-500 transition"
              >
                Schedule Demo
              </Link>

              <Link
                to={user.role === "admin" ? "/admin/dashboard" : "/user/dashboard"}
                className="bg-lime-400 text-black px-3 py-1 rounded hover:bg-lime-500 transition"
              >
                Dashboard
              </Link>

              <button
                onClick={handleLogoutClick}
                className="border border-lime-400 px-3 py-1 text-white hover:bg-lime-400 hover:text-black transition rounded"
              >
                Logout
              </button>
            </>
          )}
        </nav>

        {/* Mobile Menu Button */}
        
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden text-white focus:outline-none"
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? (
              // Close Icon
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            ) : (
              // Hamburger Icon
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            )}
          </button>
      </header>

      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={closeMobileMenu}
        />
      )}

      {/* Mobile Sidebar */}
      <aside
        className={`fixed top-0 right-0 h-full w-64 bg-gray-800 text-white transform transition-transform duration-300 ease-in-out z-50 md:hidden ${isMobileMenuOpen ? "translate-x-0" : "translate-x-full"
          }`}
      >
        <div className="flex flex-col h-full">
          {/* Sidebar Header */}

          <button
            onClick={closeMobileMenu}
            className="text-white focus:outline-none"
            aria-label="Close menu"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>

          {/* User Info Section */}
          {user && (
            <div className="px-6 py-4 bg-gray-700 border-b border-gray-600">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-lime-400 rounded-full flex items-center justify-center text-black font-bold">
                  {(user.name || user.username || user.email || 'U').charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-medium">{user.name || user.username || "User"}</p>
                  <p className="text-sm text-gray-400">
                    {user.username || (user.role === 'admin' ? 'Administrator' : '')}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Links */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {!user ? (
              <>
                <Link
                  to="/demo-scheduling"
                  onClick={closeMobileMenu}
                  className="block px-4 py-3 rounded-md bg-gray-700 hover:bg-gray-600 transition"
                >
                  Schedule Demo
                </Link>

                <Link
                  to="/user/sign-up"
                  onClick={closeMobileMenu}
                  className="block px-4 py-3 rounded-md bg-lime-400 text-black hover:bg-lime-500 transition font-medium"
                >
                  Sign Up
                </Link>

                <Link
                  to="/user/sign-in"
                  onClick={closeMobileMenu}
                  className="block px-4 py-3 rounded-md border border-gray-600 hover:bg-gray-700 transition"
                >
                  Sign In
                </Link>
              </>
            ) : (
              <>
                <Link
                  to={user.role === "admin" ? "/admin/dashboard" : "/user/dashboard"}
                  onClick={closeMobileMenu}
                  className="block px-4 py-3 rounded-md bg-lime-400 text-black hover:bg-lime-500 transition font-medium"
                >
                  Dashboard
                </Link>

                <Link
                  to="/demo-scheduling"
                  onClick={closeMobileMenu}
                  className="block px-4 py-3 rounded-md bg-gray-700 hover:bg-gray-600 transition"
                >
                  Schedule Demo
                </Link>

                <button
                  onClick={handleLogoutClick}
                  className="w-full text-left px-4 py-3 rounded-md border border-red-500 text-red-400 hover:bg-red-500 hover:text-white transition"
                >
                  Logout
                </button>
              </>
            )}
          </nav>


        </div>
      </aside>
    </>
  );
};

export default Header;