
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { RouterProvider,createBrowserRouter } from 'react-router-dom'
import { ContextProvider } from "./context/Context.jsx"
import HomePage from './pages/HomePage.jsx'
import SignIn from './pages/SignIn.jsx'
import JobSelectionPage from './pages/JobResultPage.jsx'
const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      {
      path: "/",
      element: <HomePage />
      },
      {
        path: "/user/sign-in",
        element: <SignIn/>
      }, 
      {
        path: "/job-result",
        element: <JobSelectionPage/>
      }
    ]
  }
])
createRoot(document.getElementById('root')).render(

  <ContextProvider>
    <RouterProvider router={router} />

  </ContextProvider>



    
    
  
)
