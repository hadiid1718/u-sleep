import AnalyticsSection from "../components/admin/Management/AnalyticsSection";
import ComplianceSection from "../components/admin/Management/ComplianceSection";
import MessageManagementSection from "../components/admin/Management/MessageManagementSection";
import SystemHealthSection from "../components/admin/Management/SystemHealthSection";
import UserManagementSection from "../components/admin/Management/UserManagementSection";
import DemoManagementSection from "../components/admin/Management/DemoManagementSection"
import RevenueSection from "../components/admin/Management/RevenueSection"
import SettingsSection from "../components/admin/Management/SettingsSection"
import { useState } from "react";

import { MobileMenuButton } from "../components/admin/utils/MobileMenuButton"
import Sidebar from "../components/admin/utils/Sidebar"

const AdminDashboard = () => {
  const [activeSection, setActiveSection] = useState('analytics');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const renderSection = () => {
    switch (activeSection) {
      case 'analytics':
        return <AnalyticsSection />;
      case 'demos':
        return <DemoManagementSection />;
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