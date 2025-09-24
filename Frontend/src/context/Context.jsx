import { createContext, useState } from "react";

export const AppContext = createContext()

export const ContextProvider = ({children}) => {

 const  [steps, setSteps] = useState(1);

 
 const [ user, setUser] = useState(true);
  const [ userRole, setUserRole] = useState("admin")
 const nextStep = () => setSteps((prev) => Math.min(prev + 1, 6));
  const prevStep = () => setSteps((prev) => Math.max(prev - 1, 1));

  const logOut = () => {
    setUser(null);
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