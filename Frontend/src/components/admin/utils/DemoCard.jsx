import React, { useState, useEffect } from 'react';
import { 
  Clock,
  Calendar,
  Phone,
  Mail,
  Building2,
  FileText,
  
} from 'lucide-react';
const DemoCard = ({ demo, onUpdateStatus, onCancel }) => {
  const getStatusBadge = (status) => {
    const badges = {
      scheduled: 'bg-blue-600 text-white',
      completed: 'bg-green-600 text-white',
      cancelled: 'bg-red-600 text-white',
      noshow: 'bg-gray-600 text-white'
    };
    return badges[status] || 'bg-gray-600 text-white';
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6 hover:bg-gray-750 transition-colors">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h3 className="text-white text-lg font-semibold mb-2">{demo.name || 'N/A'}</h3>
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(demo.status)}`}>
            {demo.status}
          </span>
        </div>
      </div>
      
      <div className="space-y-2 text-sm mb-4">
        <div className="flex items-center gap-2 text-gray-300">
          <Mail className="w-4 h-4 text-lime-400" />
          <span className="truncate">{demo.email}</span>
        </div>
        {demo.company && (
          <div className="flex items-center gap-2 text-gray-300">
            <Building2 className="w-4 h-4 text-lime-400" />
            <span className="truncate">{demo.company}</span>
          </div>
        )}
        {demo.phone && (
          <div className="flex items-center gap-2 text-gray-300">
            <Phone className="w-4 h-4 text-lime-400" />
            <span>{demo.phone}</span>
          </div>
        )}
      </div>
      
      <div className="flex items-center gap-4 text-sm text-gray-300 mb-4 pt-4 border-t border-gray-700">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-lime-400" />
          <span className="font-medium">{demo.date}</span>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-lime-400" />
          <span className="font-medium">{demo.time}</span>
        </div>
      </div>

      {demo.notes && (
        <div className="mb-4 p-3 bg-gray-700 rounded-md">
          <div className="flex items-start gap-2 text-sm">
            <FileText className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
            <p className="text-gray-300">{demo.notes}</p>
          </div>
        </div>
      )}

      <div className="flex gap-2">
        <button
          onClick={() => onUpdateStatus(demo)}
          className="flex-1 px-4 py-2 bg-lime-600 text-white rounded-lg hover:bg-lime-700 transition-colors text-sm font-medium"
        >
          Update Status
        </button>
        {demo.status === 'scheduled' && (
          <button
            onClick={() => onCancel(demo._id)}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  );
};
export default DemoCard