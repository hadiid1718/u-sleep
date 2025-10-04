import { createContext, useEffect, useState } from "react";
import summaryApi from "../common";

export const AppContext = createContext()

export const ContextProvider = ({children}) => {

 const  [steps, setSteps] = useState(1);

 
 const [ user, setUser] = useState(null);
  const [ userRole, setUserRole] = useState("")
  const [ authenticated, setAuthenticated] = useState(false)
  const  [ error, setError] = useState(null)



  //Token saving
 








 const nextStep = () => setSteps((prev) => Math.min(prev + 1, 6));
  const prevStep = () => setSteps((prev) => Math.max(prev - 1, 1));

  const logOut = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    setUser(null);
    setAuthenticated(false);
  }

 const value = {
   user,
   setUser,
    userRole, 
    setUserRole,
   logOut,
    steps,
    setSteps,
    nextStep,
    prevStep


 }
  
 return (
   <AppContext.Provider value={value}>
      {children}
   </AppContext.Provider>
 )

}