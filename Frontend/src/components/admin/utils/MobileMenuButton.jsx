import { Menu, X } from 'lucide-react';
import React, { useState, useEffect } from 'react';


export const MobileMenuButton = ({ isOpen, onClick }) => (
  <button
    onClick={onClick}
    className="lg:hidden fixed top-16 left-4 z-50 p-2 bg-gray-800 text-white rounded-lg shadow-lg"
  >
    {isOpen ? <X size={24}  /> : <Menu size={24} />}
  </button>
);