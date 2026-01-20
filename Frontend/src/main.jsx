import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { RouterProvider, createBrowserRouter } from 'react-router-dom'
import { ContextProvider } from "./context/Context.jsx"
import ToastProvider from './components/ToastProvider.jsx'
import HomePage from './pages/HomePage.jsx'
import SignIn from './pages/SignIn.jsx'
import JobSelectionPage from './pages/JobResultPage.jsx'
import SignUp from './pages/SignUp.jsx'
import ScheduleDemo from './components/home/Demo.jsx'
import UserDashboard from './pages/Dashboard.jsx'
import AdminDashboard from './pages/AdminDashboard.jsx'
import RequireJobs from './components/jobs/RequireJobs.jsx'
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
        element: <SignIn />
      },
      {
        path: "/user/sign-up",
        element: <SignUp />
      },
      {
        path: "/user/dashboard",
        element: <UserDashboard />
      },
      {
        path: "/admin/dashboard",
        element: <AdminDashboard />
      },
      {
        path: "/demo-scheduling",
        element: <ScheduleDemo />
      },
      {
        path: "/job-result",
        element: <RequireJobs><JobSelectionPage /></RequireJobs>
      },
      {
        path: "/admin/sign-in",
        element: <SignIn />,
        loader: async () => {
          const user = JSON.parse(localStorage.getItem("user"));
          if (!user || user.role !== "admin") {
            throw new Error("Unauthorized");
          }
          return user;
        },
        errorElement: <div>Unauthorized Access</div>,
      },
    ]
  }
])
createRoot(document.getElementById('root')).render(
  <ContextProvider>

    <RouterProvider router={router} />

  </ContextProvider>
)
