import React, { useState, useEffect } from 'react';
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
  Plus,
  Calendar,
  Phone,
  Mail,
  Building2,
  FileText,
  Filter
} from 'lucide-react';
import { LoadingState } from '../utils/LoadingState';
import { EmptyState } from '../utils/EmptyState';
import DemoFilters from '../utils/DemoFilter';
import DemoCard from '../utils/DemoCard';
import { Modal } from '../utils/Model';
import DemoStatusForm from '../utils/DemoStatusform';
import MetricCard from '../utils/MatricCard';

const DemoManagementSection = () => {
  const [demos, setDemos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedDemo, setSelectedDemo] = useState(null);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    date: '',
    email: ''
  });
const API_BASE_URL = 'http://localhost:8080/api/user/demo-scheduling';


  useEffect(() => {
    fetchDemos();
  }, [filters]);

  const fetchDemos = async () => {
  setLoading(true);
  try {
    const queryParams = new URLSearchParams();
    if (filters.status) queryParams.append('status', filters.status);
    if (filters.date) queryParams.append('date', filters.date);
    if (filters.email) queryParams.append('email', filters.email);

    const queryString = queryParams.toString();
    const url = queryString ? `${API_BASE_URL}?${queryString}` : API_BASE_URL;
    
    console.log('Fetching from URL:', url); // Debug log
    
    const response = await fetch(url);
    
    console.log('Response status:', response.status); // Debug log
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    console.log('Response data:', data); // Debug log
    
    if (data.success) {
      setDemos(data.data);
    }
  } catch (error) {
    console.error('Error fetching demos:', error);
  } finally {
    setLoading(false);
  }

  };

  const updateDemoStatus = async (id, status, notes = '') => {
    try {
      const response = await fetch(`${API_BASE_URL}/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status, notes }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        fetchDemos();
        setIsStatusModalOpen(false);
        setSelectedDemo(null);
        alert('Demo updated successfully!');
      }
    } catch (error) {
      console.error('Error updating demo:', error);
      alert('Error updating demo');
    }
  };

  const cancelDemo = async (id) => {
    if (!confirm('Are you sure you want to cancel this demo?')) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/${id}/cancel`, {
        method: 'PUT',
      });
      
      const data = await response.json();
      
      if (data.success) {
        fetchDemos();
        alert('Demo cancelled successfully!');
      }
    } catch (error) {
      console.error('Error cancelling demo:', error);
      alert('Error cancelling demo');
    }
  };

  const handleUpdateStatus = (demo) => {
    setSelectedDemo(demo);
    setIsStatusModalOpen(true);
  };

  const stats = {
    total: demos.length,
    scheduled: demos.filter(d => d.status === 'scheduled').length,
    completed: demos.filter(d => d.status === 'completed').length,
    cancelled: demos.filter(d => d.status === 'cancelled').length,
  };

  const demoMetrics = [
    { title: 'Total Demos', value: stats.total.toString(), change: '+12', icon: Calendar },
    { title: 'Scheduled', value: stats.scheduled.toString(), change: '+5', icon: Clock },
    { title: 'Completed', value: stats.completed.toString(), change: '+8', icon: CheckCircle },
    { title: 'Cancelled', value: stats.cancelled.toString(), change: '-2', icon: XCircle, trend: 'down' }
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-white text-xl lg:text-2xl font-bold">Demo Management</h2>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-6">
        {demoMetrics.map((metric, index) => (
          <MetricCard API_BASE_URLkey={index} {...metric} />
        ))}
      </div>

      <DemoFilters filters={filters} setFilters={setFilters} />

      {loading ? (
        <LoadingState />
      ) : demos.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
          {demos.map(demo => (
            <DemoCard 
              key={demo._id} 
              demo={demo}
              onUpdateStatus={handleUpdateStatus}
              onCancel={cancelDemo}
            />
          ))}
        </div>
      )}

      <Modal 
        isOpen={isStatusModalOpen} 
        onClose={() => {
          setIsStatusModalOpen(false);
          setSelectedDemo(null);
        }} 
        title="Update Demo Status"
      >
        {selectedDemo && (
          <DemoStatusForm 
            demo={selectedDemo}
            onClose={() => {
              setIsStatusModalOpen(false);
              setSelectedDemo(null);
            }} 
            onSubmit={updateDemoStatus}
          />
        )}
      </Modal>
    </div>
  );
};
export default DemoManagementSection