import React  from 'react'
import './App.css'
import Header from './components/shared/Navbar'
import Footer from './components/shared/Footer'
import { Outlet } from 'react-router-dom'

function App() {
  return (
    <>
    <Header />
    <Outlet/>
    <Footer/>
    </>
  )
}

export default App
