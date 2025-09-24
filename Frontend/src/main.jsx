
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { RouterProvider,createBrowserRouter } from 'react-router-dom'
import { ContextProvider } from "./context/Context.jsx"
import HomePage from './pages/HomePage.jsx'
import SignIn from './pages/SignIn.jsx'
import JobSelectionPage from './pages/JobResultPage.jsx'
import SignUp from './pages/SignUp.jsx'
import ScheduleDemo from './components/Demo.jsx'
import UserDashboard from './pages/Dashboard.jsx'
import AdminDashboard from './pages/AdminDashboard.jsx'
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
        path: "/user/sign-up",
        element: <SignUp/>
      },
      {
        path: "/user/dashboard",
        element: <UserDashboard/>
      },
      {
          path: "/admin/dashboard",
          element: <AdminDashboard/>
      },
      {
        path: "/demo-scheduling",
        element: <ScheduleDemo/>
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
