import React  from 'react'
import './App.css'
import Header from './components/shared/Navbar'
import Footer from './components/shared/Footer'
import { Outlet } from 'react-router-dom'
import FounderChatWidget from './components/shared/FounderChatWidget'

function App() {
  return (
    <>
    <Header />
    <Outlet/>
    <FounderChatWidget />
    <Footer/>
    </>
  )
}

export default App
