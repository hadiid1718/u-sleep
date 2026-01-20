import React from 'react';
import { Home, Heart, MessageSquare, Bell, Settings, ChevronLeft, LogOut } from 'lucide-react';

export const Sidebar = ({ 
  user, 
  activeMenu, 
  onMenuClick, 
  onLogout, 
  isMobile, 
  isSidebarOpen, 
  onClose,
  formData 
}) => {
  const menuItems = [
    { id: 'dashboard', icon: Home, label: 'Dashboard' },
    { id: 'tinder', icon: Heart, label: 'Tinder' },
    { id: 'prompts', icon: MessageSquare, label: 'Prompts' },
    { id: 'notifications', icon: Bell, label: 'Notifications' },
    { id: 'settings', icon: Settings, label: 'Settings' }
  ];

  return (
    <div className={`${
      isMobile
        ? `fixed left-0 top-0 h-full z-50 transform transition-transform duration-300 ${
            isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`
        : 'relative'
    } w-64 lg:w-72 bg-gray-900 text-white flex flex-col border-r border-gray-800 shadow-2xl`}>
      
      {/* Mobile Header */}
      {isMobile && (
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <div className="flex justify-center items-center gap-2">
            <LogOut className='cursor-pointer' onClick={onLogout}/>
            <h1 className="text-xl font-bold bg-clip-text bg-lime-400 text-transparent">
              {user?.name || 'user'}
            </h1>
          </div>
          <button onClick={onClose} className="text-white p-1 rounded hover:bg-gray-800 transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Desktop Header */}
      {!isMobile && (
        <div className="p-4 lg:p-6 border-b border-gray-800">
          <div className='flex justify-center items-center gap-6'>
            <LogOut className='cursor-pointer' onClick={onLogout}/>
            <h1 className="text-xl lg:text-2xl font-bold bg-lime-400 bg-clip-text text-transparent">
              {user?.name || 'User'}
            </h1>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-3 lg:px-4 py-4 lg:py-6 overflow-y-auto">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.id}>
                <button
                  onClick={() => onMenuClick(item.id)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-left transition-all duration-200 font-medium hover:scale-[1.02] active:scale-[0.98] ${
                    activeMenu === item.id || (activeMenu === 'job-result' && item.id === 'tinder')
                      ? 'bg-lime-400 text-black border border-yellow-400/30 shadow-lg'
                      : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User Profile */}
      <div className="p-4 lg:p-6 border-t border-gray-800">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-red-500 to-orange-500 flex items-center justify-center flex-shrink-0 shadow-lg">
            <span className="text-white font-bold">
              {formData?.fullName?.charAt(0) || 'U'}
            </span>
          </div>
          <div className="min-w-0">
            <p className="text-white font-medium truncate">{formData?.fullName || 'User'}</p>
            <p className="text-gray-400 text-sm">Trial Account</p>
          </div>
        </div>
      </div>
    </div>
  );
};