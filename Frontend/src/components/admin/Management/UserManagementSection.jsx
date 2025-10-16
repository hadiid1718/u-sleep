import { CheckCircle, Clock, Plus, TrendingUp, Users } from "lucide-react";
import MetricCard from "../utils/MatricCard";
import { useState } from "react";
import { Modal} from "../utils/Model"
import DataTable from "../utils/DataTable";
import UserForm from "../utils/UserForm";

const UserManagementSection = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const userMetrics = [
    { title: 'Total Users', value: '2,847', change: '+187', icon: Users },
    { title: 'Active Users', value: '1,923', change: '+45', icon: CheckCircle },
    { title: 'Trial Users', value: '324', change: '+23', icon: Clock },
    { title: 'Premium Users', value: '1,599', change: '+122', icon: TrendingUp }
  ];

  const userData = [
    { id: '001', email: 'john.doe@email.com', plan: 'Premium', status: 'Active', responses: '1,247', joined: '2024-01-15' },
    { id: '002', email: 'jane.smith@email.com', plan: 'Basic', status: 'Active', responses: '892', joined: '2024-02-03' },
    { id: '003', email: 'mike.johnson@email.com', plan: 'Trial', status: 'Trial', responses: '156', joined: '2024-03-10' },
    { id: '004', email: 'sarah.wilson@email.com', plan: 'Premium', status: 'Suspended', responses: '2,341', joined: '2023-11-22' }
  ];

  const userActions = [
    { label: 'View', className: 'bg-blue-600 text-white hover:bg-blue-700', onClick: (user) => console.log('View', user) },
    { label: 'Edit', className: 'bg-lime-600 text-white hover:bg-lime-700', onClick: (user) => console.log('Edit', user) },
    { label: 'Suspend', className: 'bg-red-600 text-white hover:bg-red-700', onClick: (user) => console.log('Suspend', user) }
  ];

  const handleAddUser = (userData) => {
    console.log('Adding user:', userData);
    // Here you would typically make an API call to add the user
  };

  return (
    <div className="space-y-6">
      <h2 className="text-white text-xl lg:text-2xl font-bold">User Management</h2>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-6">
        {userMetrics.map((metric, index) => (
          <MetricCard key={index} {...metric} />
        ))}
      </div>

      <div className="bg-gray-800 p-4 lg:p-6 rounded-lg">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 space-y-4 sm:space-y-0">
          <h3 className="text-white text-lg font-semibold">Recent Users</h3>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-lime-600 text-white px-4 py-2 rounded-lg hover:bg-lime-700 transition-colors flex items-center space-x-2"
          >
            <Plus size={16} />
            <span>Add User</span>
          </button>
        </div>
        <DataTable 
          headers={['ID', 'Email', 'Plan', 'Status', 'Responses', 'Joined']}
          data={userData}
          actions={userActions}
        />
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title="Add New User"
      >
        <UserForm 
          onClose={() => setIsModalOpen(false)} 
          onSubmit={handleAddUser}
        />
      </Modal>
    </div>
  );
};
export default UserManagementSection