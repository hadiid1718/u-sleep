import React from 'react'
import HeroSection from "../components/home/HeroSection"
import HowItWorks from "../components/home/Working"
import TestimonialSection from "../components/home/TestimonialSection"
import ComparisonTable from "../components/home/CamparisonTable"
import FeaturesSection from "../components/home/FeatureSection"
import ScheduleDemo from "../components/home/Demo"
import BuiltInPublic from "../components/home/BuiltInPublic"


const HomePage = () => {
  return (
    <div> 
      
       
       <HeroSection/>
       <HowItWorks/>
       <TestimonialSection/>
       <ComparisonTable/>
       <FeaturesSection/>
         <ScheduleDemo/>
         <BuiltInPublic/>
         
    </div>
  )
}

export default HomePage
