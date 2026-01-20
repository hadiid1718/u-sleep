import React from 'react';
import { Menu } from 'lucide-react';

export const MobileHeader = ({ onMenuToggle }) => (
  <div className="fixed top-0 left-0 right-0 z-50 bg-black/95 backdrop-blur border-b border-gray-800 px-4 py-3">
    <div className="flex items-center justify-between">
      <h1 className="text-lg font-bold text-slate-200">U never sleep</h1>
      <button
        onClick={onMenuToggle}
        className="text-white p-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors"
      >
        <Menu className="w-5 h-5" />
      </button>
    </div>
  </div>
);