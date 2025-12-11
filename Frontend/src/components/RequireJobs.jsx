import { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AppContext } from '../context/Context';

const RequireJobs = ({ children }) => {
  const { jobResults, loading } = useContext(AppContext);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-white text-2xl mb-4">Loading jobs...</h2>
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-lime-400 mx-auto"></div>
        </div>
      </div>
    );
  }

  if (!Array.isArray(jobResults) || jobResults.length === 0) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default RequireJobs;