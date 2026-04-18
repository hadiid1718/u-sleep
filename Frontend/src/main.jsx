import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { RouterProvider, createBrowserRouter } from 'react-router-dom'
import { ContextProvider } from "./context/Context.jsx"
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { SubscriptionProvider } from './context/SubscriptionContext.jsx'
import HomePage from './pages/HomePage.jsx'
import SignIn from './pages/SignIn.jsx'
import JobSelectionPage from './pages/JobResultPage.jsx'
import SignUp from './pages/SignUp.jsx'
import ScheduleDemo from './components/home/Demo.jsx'
import UserDashboard from './pages/Dashboard.jsx'
import AdminDashboard from './pages/AdminDashboard.jsx'
import RequireJobs from './components/jobs/RequireJobs.jsx'
import AdminSignIn from './pages/AdminSignIn.jsx'
import BillingPage from './pages/Billing/BillingPage.jsx'
import BillingSuccessPage from './pages/Billing/BillingSuccessPage.jsx'
import BillingCancelledPage from './pages/Billing/BillingCancelledPage.jsx'

const queryClient = new QueryClient()

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
        element: <AdminSignIn />,
        // loader: async () => {
        //   const user = JSON.parse(localStorage.getItem("user"));
        //   if (!user || user.role !== "admin") {
        //     throw new Error("Unauthorized");
        //   }
        //   return user;
        // },
        // errorElement: <div>Unauthorized Access</div>,
      },
      {
        path: "/billing",
        element: <BillingPage />,
      },
      {
        path: "/billing/success",
        element: <BillingSuccessPage />,
      },
      {
        path: "/billing/cancelled",
        element: <BillingCancelledPage />,
      },
    ]
  }
])
createRoot(document.getElementById('root')).render(
  <ContextProvider>
    <QueryClientProvider client={queryClient}>
      <SubscriptionProvider>
        <RouterProvider router={router} />
      </SubscriptionProvider>
    </QueryClientProvider>
  </ContextProvider>
)
