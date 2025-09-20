import React from 'react'
import { Link } from 'react-router-dom';

const NoUser = () => {
  return (
    <>
         <div className='flex flex-col gap-4'>
            <Link to="/user/sign-in" className='border border-lime-400 bg-lime-400 cursor-pointer hover:bg-lime-300 py-3 px-1 text-xl font-semibold text-black'>Sign In with Email</Link>
            <button className='border border-gray-300 bg-gray-900  py-3 px-1  text-white cursor-pointer'>Sign up with Google</button>
         </div>
    </>
  )
}

export default NoUser
