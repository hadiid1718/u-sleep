import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Users, 
  MessageSquare, 
  Settings, 
  Activity, 
  DollarSign,
  Shield,
  Calendar,

} from 'lucide-react';

const Sidebar = ({ activeSection, setActiveSection, isOpen, onClose }) => {
  const menuItems = [
    { id: 'analytics', label: 'Analytics & Monitoring', icon: BarChart3 },
    { id: 'demos', label: 'Demo', icon: Calendar },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'messages', label: 'Messages', icon: MessageSquare },
    { id: 'system', label: 'System Health', icon: Activity },
    { id: 'revenue', label: 'Revenue & BI', icon: DollarSign },
    { id: 'compliance', label: 'Compliance & Safety', icon: Shield },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  const handleMenuClick = (itemId) => {
    setActiveSection(itemId);
    if (window.innerWidth < 1024) {
      onClose();
    }
  };

  return (
    <>
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={onClose}
        />
      )}
      
      <div className={`
        fixed lg:static inset-y-0 left-0 z-40 w-64 bg-gray-800 transform transition-transform duration-300 ease-in-out lg:transform-none
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="flex flex-col h-full overflow-y-auto">
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
export default Sidebar