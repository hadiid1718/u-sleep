import React, { useState } from 'react';
import { 
  BarChart3, 
  Users, 
  MessageSquare, 
  Settings, 
  Activity, 
  DollarSign,
  Shield,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Eye,
  Target,
  Zap,
  Menu,
  X,
  Plus
} from 'lucide-react';

// Mobile Menu Button Component
const MobileMenuButton = ({ isOpen, onClick }) => (
  <button
    onClick={onClick}
    className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-gray-800 text-white rounded-lg shadow-lg"
  >
    {isOpen ? <X size={24} /> : <Menu size={24} />}
  </button>
);

// Modal Component
const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg w-full max-w-md">
        <div className="flex justify-between items-center p-6 border-b border-gray-700">
          <h2 className="text-white text-xl font-bold">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
};

// User Form Component
const UserForm = ({ onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    if (!formData.password.trim()) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    return newErrors;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = validateForm();
    
    if (Object.keys(newErrors).length === 0) {
      onSubmit(formData);
      onClose();
      setFormData({ name: '', email: '', password: '' });
    } else {
      setErrors(newErrors);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-gray-300 text-sm font-medium mb-2">
          Full Name
        </label>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          className={`w-full bg-gray-700 text-white p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-lime-400 ${
            errors.name ? 'border border-red-500' : ''
          }`}
          placeholder="Enter full name"
        />
        {errors.name && <p className="text-red-400 text-sm mt-1">{errors.name}</p>}
      </div>

      <div>
        <label className="block text-gray-300 text-sm font-medium mb-2">
          Email Address
        </label>
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          className={`w-full bg-gray-700 text-white p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-lime-400 ${
            errors.email ? 'border border-red-500' : ''
          }`}
          placeholder="Enter email address"
        />
        {errors.email && <p className="text-red-400 text-sm mt-1">{errors.email}</p>}
      </div>

      <div>
        <label className="block text-gray-300 text-sm font-medium mb-2">
          Password
        </label>
        <input
          type="password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          className={`w-full bg-gray-700 text-white p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-lime-400 ${
            errors.password ? 'border border-red-500' : ''
          }`}
          placeholder="Enter password"
        />
        {errors.password && <p className="text-red-400 text-sm mt-1">{errors.password}</p>}
      </div>

      <div className="flex space-x-3 pt-4">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 bg-gray-600 text-white py-3 rounded-lg hover:bg-gray-700 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="flex-1 bg-lime-600 text-white py-3 rounded-lg hover:bg-lime-700 transition-colors"
        >
          Add User
        </button>
      </div>
    </form>
  );
};

// Sidebar Component (Enhanced for Mobile)
const Sidebar = ({ activeSection, setActiveSection, isOpen, onClose }) => {
  const menuItems = [
    { id: 'analytics', label: 'Analytics & Monitoring', icon: BarChart3 },
    { id: 'users', label: 'User Management', icon: Users },
    { id: 'messages', label: 'Message Management', icon: MessageSquare },
    { id: 'system', label: 'System Health', icon: Activity },
    { id: 'revenue', label: 'Revenue & BI', icon: DollarSign },
    { id: 'compliance', label: 'Compliance & Safety', icon: Shield },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  const handleMenuClick = (itemId) => {
    setActiveSection(itemId);
    // Close sidebar on mobile after selection
    if (window.innerWidth < 1024) {
      onClose();
    }
  };

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <div className={`
        fixed lg:static inset-y-0 left-0 z-40 w-64 bg-gray-800 transform transition-transform duration-300 ease-in-out lg:transform-none
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="flex flex-col h-full">
          <div className="p-4 pt-16 lg:pt-4">
            <h1 className="text-white text-xl font-bold">UNeverSleep</h1>
            <p className="text-gray-400 text-sm">Admin Dashboard</p>
          </div>
          
          <nav className="flex-1 px-4 pb-4">
            <ul className="space-y-2">
              {menuItems.map((item) => {
                const IconComponent = item.icon;
                return (
                  <li key={item.id}>
                    <button
                      onClick={() => handleMenuClick(item.id)}
                      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors duration-200 ${
                        activeSection === item.id 
                          ? 'bg-lime-400 text-gray-900' 
                          : 'text-white hover:bg-lime-400 hover:text-gray-900'
                      }`}
                    >
                      <IconComponent size={20} />
                      <span className="text-sm font-medium">{item.label}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>
      </div>
    </>
  );
};

// Metric Card Component
const MetricCard = ({ title, value, change, icon: Icon, trend = 'up' }) => {
  return (
    <div className="bg-gray-800 p-4 lg:p-6 rounded-lg">
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-gray-400 text-sm truncate">{title}</p>
          <p className="text-white text-xl lg:text-2xl font-bold mt-1">{value}</p>
          {change && (
            <p className={`text-sm mt-1 ${trend === 'up' ? 'text-lime-400' : 'text-red-400'}`}>
              {trend === 'up' ? '+' : ''}{change}
            </p>
          )}
        </div>
        {Icon && (
          <div className="bg-lime-400 p-2 lg:p-3 rounded-lg ml-4 flex-shrink-0">
            <Icon size={20} className="lg:w-6 lg:h-6 text-gray-900" />
          </div>
        )}
      </div>
    </div>
  );
};

// Table Component (Enhanced for Mobile)
const DataTable = ({ headers, data, actions = [] }) => {
  return (
    <div className="bg-gray-800 rounded-lg overflow-hidden">
      {/* Mobile View */}
      <div className="lg:hidden">
        {data.map((row, rowIndex) => (
          <div key={rowIndex} className="p-4 border-b border-gray-700 last:border-b-0">
            {Object.entries(row).map(([key, value], cellIndex) => (
              <div key={cellIndex} className="flex justify-between py-1">
                <span className="text-gray-400 text-sm capitalize">{headers[cellIndex]}:</span>
                <span className="text-white text-sm font-medium">{value}</span>
              </div>
            ))}
            {actions.length > 0 && (
              <div className="flex space-x-2 mt-3 pt-3 border-t border-gray-700">
                {actions.map((action, actionIndex) => (
                  <button
                    key={actionIndex}
                    onClick={() => action.onClick(row)}
                    className={`px-3 py-1 rounded text-xs font-medium flex-1 ${action.className}`}
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Desktop View */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-700">
            <tr>
              {headers.map((header, index) => (
                <th key={index} className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  {header}
                </th>
              ))}
              {actions.length > 0 && (
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {data.map((row, rowIndex) => (
              <tr key={rowIndex} className="hover:bg-gray-700 transition-colors">
                {Object.values(row).map((cell, cellIndex) => (
                  <td key={cellIndex} className="px-6 py-4 whitespace-nowrap text-sm text-white">
                    {cell}
                  </td>
                ))}
                {actions.length > 0 && (
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex space-x-2">
                      {actions.map((action, actionIndex) => (
                        <button
                          key={actionIndex}
                          onClick={() => action.onClick(row)}
                          className={`px-3 py-1 rounded text-xs font-medium ${action.className}`}
                        >
                          {action.label}
                        </button>
                      ))}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Analytics Section
const AnalyticsSection = () => {
  const metrics = [
    { title: 'Total Responses Sent', value: '15,847', change: '+12%', icon: MessageSquare },
    { title: 'Average Open Rate', value: '52.3%', change: '+3.2%', icon: Eye },
    { title: 'Conversion Rate', value: '23.1%', change: '+5.7%', icon: Target },
    { title: 'Avg Response Time', value: '3.2 min', change: '-0.8 min', icon: Clock }
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-white text-xl lg:text-2xl font-bold">Analytics & Monitoring</h2>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-6">
        {metrics.map((metric, index) => (
          <MetricCard key={index} {...metric} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        <div className="bg-gray-800 p-4 lg:p-6 rounded-lg">
          <h3 className="text-white text-lg font-semibold mb-4">Top Performing Templates</h3>
          <div className="space-y-3">
            {[
              { name: 'Professional Introduction', rate: '67%' },
              { name: 'Technical Expertise', rate: '54%' },
              { name: 'Quick Turnaround', rate: '48%' },
              { name: 'Portfolio Showcase', rate: '42%' }
            ].map((template, index) => (
              <div key={index} className="flex justify-between items-center">
                <span className="text-gray-300 text-sm lg:text-base truncate">{template.name}</span>
                <span className="text-lime-400 font-medium ml-2">{template.rate}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gray-800 p-4 lg:p-6 rounded-lg">
          <h3 className="text-white text-lg font-semibold mb-4">Job Category Performance</h3>
          <div className="space-y-3">
            {[
              { category: 'Web Development', responses: '3,241' },
              { category: 'Mobile Apps', responses: '2,876' },
              { category: 'UI/UX Design', responses: '2,103' },
              { category: 'Data Science', responses: '1,892' }
            ].map((cat, index) => (
              <div key={index} className="flex justify-between items-center">
                <span className="text-gray-300 text-sm lg:text-base truncate">{cat.category}</span>
                <span className="text-white font-medium ml-2">{cat.responses}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// User Management Section (Enhanced with Modal)
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

// Message Management Section
const MessageManagementSection = () => {
  const messageMetrics = [
    { title: 'Messages Sent Today', value: '847', change: '+23%', icon: MessageSquare },
    { title: 'Template Success Rate', value: '89.2%', change: '+4.1%', icon: CheckCircle },
    { title: 'Failed Sends', value: '12', change: '-67%', icon: XCircle },
    { title: 'Queue Length', value: '156', change: '+12', icon: Clock }
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-white text-xl lg:text-2xl font-bold">Message & Response Management</h2>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-6">
        {messageMetrics.map((metric, index) => (
          <MetricCard key={index} {...metric} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        <div className="bg-gray-800 p-4 lg:p-6 rounded-lg">
          <h3 className="text-white text-lg font-semibold mb-4">Message Queue Status</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-300">Pending</span>
              <span className="bg-yellow-600 text-white px-2 py-1 rounded text-sm">156</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-300">Processing</span>
              <span className="bg-blue-600 text-white px-2 py-1 rounded text-sm">23</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-300">Completed</span>
              <span className="bg-green-600 text-white px-2 py-1 rounded text-sm">847</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-300">Failed</span>
              <span className="bg-red-600 text-white px-2 py-1 rounded text-sm">12</span>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 p-4 lg:p-6 rounded-lg">
          <h3 className="text-white text-lg font-semibold mb-4">A/B Testing Results</h3>
          <div className="space-y-3">
            {[
              { test: 'Template A vs B', winner: 'Template B', improvement: '+15%' },
              { test: 'Subject Line Test', winner: 'Version 2', improvement: '+8%' },
              { test: 'Send Time Test', winner: '9AM EST', improvement: '+12%' },
              { test: 'Tone Variation', winner: 'Professional', improvement: '+6%' }
            ].map((test, index) => (
              <div key={index} className="flex justify-between items-center">
                <div className="flex-1 min-w-0">
                  <span className="text-gray-300 block text-sm lg:text-base truncate">{test.test}</span>
                  <span className="text-gray-400 text-xs lg:text-sm truncate">Winner: {test.winner}</span>
                </div>
                <span className="text-lime-400 font-medium ml-2">{test.improvement}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// System Health Section
const SystemHealthSection = () => {
  const systemMetrics = [
    { title: 'Uptime', value: '99.94%', change: '+0.02%', icon: CheckCircle },
    { title: 'API Response Time', value: '145ms', change: '-12ms', icon: Zap },
    { title: 'Error Rate', value: '0.06%', change: '-0.03%', icon: AlertTriangle },
    { title: 'Active Connections', value: '1,847', change: '+23', icon: Activity }
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-white text-xl lg:text-2xl font-bold">System Health & Operations</h2>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-6">
        {systemMetrics.map((metric, index) => (
          <MetricCard key={index} {...metric} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        <div className="bg-gray-800 p-4 lg:p-6 rounded-lg">
          <h3 className="text-white text-lg font-semibold mb-4">API Status</h3>
          <div className="space-y-3">
            {[
              { service: 'Upwork API', status: 'Online', latency: '142ms' },
              { service: 'Yelp API', status: 'Online', latency: '98ms' },
              { service: 'Email Service', status: 'Online', latency: '67ms' },
              { service: 'Database', status: 'Online', latency: '23ms' }
            ].map((api, index) => (
              <div key={index} className="flex justify-between items-center">
                <span className="text-gray-300 text-sm lg:text-base truncate">{api.service}</span>
                <div className="flex items-center space-x-2 ml-2">
                  <span className="text-green-400 text-sm">{api.status}</span>
                  <span className="text-gray-400 text-xs lg:text-sm">{api.latency}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gray-800 p-4 lg:p-6 rounded-lg">
          <h3 className="text-white text-lg font-semibold mb-4">Recent Errors</h3>
          <div className="space-y-3">
            <div className="text-sm">
              <div className="text-red-400 truncate">Rate limit exceeded - Upwork API</div>
              <div className="text-gray-400 text-xs">2 minutes ago</div>
            </div>
            <div className="text-sm">
              <div className="text-yellow-400 truncate">Slow response - Database</div>
              <div className="text-gray-400 text-xs">15 minutes ago</div>
            </div>
            <div className="text-sm">
              <div className="text-red-400 truncate">Connection timeout - Email service</div>
              <div className="text-gray-400 text-xs">1 hour ago</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Revenue Section
const RevenueSection = () => {
  const revenueMetrics = [
    { title: 'Monthly Revenue', value: '$47,892', change: '+18%', icon: DollarSign },
    { title: 'New Subscriptions', value: '187', change: '+23%', icon: TrendingUp },
    { title: 'Churn Rate', value: '3.2%', change: '-0.8%', icon: Users, trend: 'down' },
    { title: 'Average LTV', value: '$340', change: '+12%', icon: Target }
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-white text-xl lg:text-2xl font-bold">Revenue & Business Intelligence</h2>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-6">
        {revenueMetrics.map((metric, index) => (
          <MetricCard key={index} {...metric} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        <div className="bg-gray-800 p-4 lg:p-6 rounded-lg">
          <h3 className="text-white text-lg font-semibold mb-4">Subscription Breakdown</h3>
          <div className="space-y-3">
            {[
              { plan: 'Basic ($9.99/mo)', users: '487', revenue: '$4,861' },
              { plan: 'Professional ($24.99/mo)', users: '856', revenue: '$21,399' },
              { plan: 'Premium ($49.99/mo)', users: '743', revenue: '$37,143' },
              { plan: 'Enterprise ($99.99/mo)', users: '94', revenue: '$9,399' }
            ].map((sub, index) => (
              <div key={index} className="flex justify-between items-center">
                <div className="flex-1 min-w-0">
                  <span className="text-gray-300 block text-sm lg:text-base truncate">{sub.plan}</span>
                  <span className="text-gray-400 text-xs lg:text-sm">{sub.users} users</span>
                </div>
                <span className="text-lime-400 font-medium ml-2">{sub.revenue}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gray-800 p-4 lg:p-6 rounded-lg">
          <h3 className="text-white text-lg font-semibold mb-4">Conversion Funnel</h3>
          <div className="space-y-3">
            {[
              { stage: 'Visitors', count: '12,847', rate: '100%' },
              { stage: 'Sign-ups', count: '1,284', rate: '10.0%' },
              { stage: 'Trial Started', count: '964', rate: '75.1%' },
              { stage: 'Converted to Paid', count: '243', rate: '25.2%' }
            ].map((stage, index) => (
              <div key={index} className="flex justify-between items-center">
                <span className="text-gray-300 text-sm lg:text-base truncate">{stage.stage}</span>
                <div className="text-right ml-2">
                  <span className="text-white block text-sm lg:text-base">{stage.count}</span>
                  <span className="text-gray-400 text-xs lg:text-sm">{stage.rate}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// Compliance Section
const ComplianceSection = () => {
  const complianceMetrics = [
    { title: 'Flagged Accounts', value: '23', change: '-5', icon: AlertTriangle, trend: 'down' },
    { title: 'Compliance Score', value: '94.2%', change: '+1.3%', icon: Shield },
    { title: 'Resolved Issues', value: '187', change: '+23', icon: CheckCircle },
    { title: 'Pending Reviews', value: '12', change: '+3', icon: Clock }
  ];

  const flaggedData = [
    { user: 'user@example1.com', reason: 'High frequency sending', severity: 'Medium', status: 'Under Review' },
    { user: 'user@example2.com', reason: 'Template similarity', severity: 'Low', status: 'Resolved' },
    { user: 'user@example3.com', reason: 'Response rate anomaly', severity: 'High', status: 'Suspended' },
    { user: 'user@example4.com', reason: 'Terms violation', severity: 'High', status: 'Under Review' }
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-white text-xl lg:text-2xl font-bold">Compliance & Safety</h2>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-6">
        {complianceMetrics.map((metric, index) => (
          <MetricCard key={index} {...metric} />
        ))}
      </div>

      <div className="bg-gray-800 p-4 lg:p-6 rounded-lg">
        <h3 className="text-white text-lg font-semibold mb-4">Flagged Accounts</h3>
        <DataTable 
          headers={['User', 'Reason', 'Severity', 'Status']}
          data={flaggedData}
          actions={[
            { label: 'Review', className: 'bg-blue-600 text-white hover:bg-blue-700', onClick: (user) => console.log('Review', user) },
            { label: 'Resolve', className: 'bg-green-600 text-white hover:bg-green-700', onClick: (user) => console.log('Resolve', user) }
          ]}
        />
      </div>
    </div>
  );
};

// Settings Section
const SettingsSection = () => {
  return (
    <div className="space-y-6">
      <h2 className="text-white text-xl lg:text-2xl font-bold">Settings</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        <div className="bg-gray-800 p-4 lg:p-6 rounded-lg">
          <h3 className="text-white text-lg font-semibold mb-4">System Configuration</h3>
          <div className="space-y-4">
            <div>
              <label className="text-gray-300 block mb-2 text-sm lg:text-base">Max Response Time (minutes)</label>
              <input type="number" defaultValue="5" className="w-full bg-gray-700 text-white p-2 lg:p-3 rounded focus:outline-none focus:ring-2 focus:ring-lime-400" />
            </div>
            <div>
              <label className="text-gray-300 block mb-2 text-sm lg:text-base">Daily Rate Limit</label>
              <input type="number" defaultValue="1000" className="w-full bg-gray-700 text-white p-2 lg:p-3 rounded focus:outline-none focus:ring-2 focus:ring-lime-400" />
            </div>
            <div>
              <label className="text-gray-300 block mb-2 text-sm lg:text-base">Auto-suspend threshold</label>
              <select className="w-full bg-gray-700 text-white p-2 lg:p-3 rounded focus:outline-none focus:ring-2 focus:ring-lime-400">
                <option>After 5 violations</option>
                <option>After 10 violations</option>
                <option>After 20 violations</option>
              </select>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 p-4 lg:p-6 rounded-lg">
          <h3 className="text-white text-lg font-semibold mb-4">Notification Settings</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-300 text-sm lg:text-base">System alerts</span>
              <input type="checkbox" defaultChecked className="text-lime-400 focus:ring-lime-400" />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-300 text-sm lg:text-base">Daily reports</span>
              <input type="checkbox" defaultChecked className="text-lime-400 focus:ring-lime-400" />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-300 text-sm lg:text-base">User violations</span>
              <input type="checkbox" defaultChecked className="text-lime-400 focus:ring-lime-400" />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-300 text-sm lg:text-base">Revenue milestones</span>
              <input type="checkbox" className="text-lime-400 focus:ring-lime-400" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Main Dashboard Component
const AdminDashboard = () => {
  const [activeSection, setActiveSection] = useState('analytics');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const renderSection = () => {
    switch (activeSection) {
      case 'analytics':
        return <AnalyticsSection />;
      case 'users':
        return <UserManagementSection />;
      case 'messages':
        return <MessageManagementSection />;
      case 'system':
        return <SystemHealthSection />;
      case 'revenue':
        return <RevenueSection />;
      case 'compliance':
        return <ComplianceSection />;
      case 'settings':
        return <SettingsSection />;
      default:
        return <AnalyticsSection />;
    }
  };

  return (
    <div className="flex bg-gray-900 min-h-screen">
      <MobileMenuButton 
        isOpen={isSidebarOpen} 
        onClick={() => setIsSidebarOpen(!isSidebarOpen)} 
      />
      
      <Sidebar 
        activeSection={activeSection} 
        setActiveSection={setActiveSection}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />
      
      <main className="flex-1 p-4 lg:p-8 lg:ml-0">
        <div className="pt-16 lg:pt-0">
          {renderSection()}
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;