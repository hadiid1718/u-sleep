import React from 'react'
import HeroSection from '../components/HeroSection'
import HowItWorks from '../components/Working'
import PricingSection from '../components/PricingSection'
import TestimonialSection from '../components/TestimonialSection'
import FeaturesSection from '../components/FeatureSection'
import ComparisonTable from '../components/CamparisonTable'
import ScheduleDemo from '../components/Demo'
import BuiltInPublic from '../components/BuiltInPublic'
import Footer from '../components/Footer'
import Header from '../components/Navbar'

const HomePage = () => {
  return (
    <div> 
      
       
       <HeroSection/>
       <HowItWorks/>
       <PricingSection/>
       <TestimonialSection/>
       <ComparisonTable/>
       <FeaturesSection/>
         <ScheduleDemo/>
         <BuiltInPublic/>
         
    </div>
  )
}

export default HomePage
