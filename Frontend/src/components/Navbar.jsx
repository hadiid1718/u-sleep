
import { useContext } from "react";
import { Link } from "react-router-dom";
import { AppContext } from "../context/Context";

const Header = () => {
  const { user , logOut, userRole} = useContext(AppContext)

  return (
    <header className="flex justify-between items-center px-6 py-4 bg-black">
      <div className="flex items-center space-x-2">
        <span className="text-white font-medium text-lg"> <span className="text-lime-400">U</span> never sleep</span>
      </div>
      <nav className="hidden md:flex items-center space-x-6">
        {!user ? (
          <>
            <Link to="/demo-scheduling" className="bg-lime-400 text-black px-4 py-2 rounded-md text-sm font-medium hover:bg-lime-300">Shehdule Demo</Link>
            <Link to="/user/sign-up" className="bg-lime-400 text-black px-4 py-2 rounded-md text-sm font-medium hover:bg-lime-300">Sign Up</Link>
            <Link to="/user/sign-in" className="bg-black  text-gray-100 border border-gray-400 px-4 py-2 rounded-md text-sm font-medium hover:border hover:border-lime-400 ">
              Sign In
            </Link>
          </>
        )

          :
          (
            <>
              <Link  onClick={logOut} to="/" className="border border-lime-400 bg-gray-900 px-3 py-1 text-white ">Logout</Link>
              {
                user && userRole === 'user' ? (
                  <>
              <Link   to="/user/dashboard" className="border border-lime-400  bg-lime-400 hover:bg-lime-500 hover:opacity-90 px-3 py-1 text-black ">Dashboard</Link>
                  </>

                ): (
                  <>
              <Link   to="/admin/dashboard" className="border border-lime-400  bg-lime-400 hover:bg-lime-500 hover:opacity-90 px-3 py-1 text-black ">Dashboard</Link>

                  </>
                )
              }
              </>
          )
        }
      </nav>
    </header>
  )
}
export default Header



