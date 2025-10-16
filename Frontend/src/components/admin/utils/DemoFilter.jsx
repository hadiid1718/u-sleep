import React, { useState, useEffect } from 'react';
import { 
  Filter
} from 'lucide-react';

const DemoFilters = ({ filters, setFilters }) => {
  return (
    <div className="bg-gray-800 p-4 lg:p-6 rounded-lg">
      <div className="flex items-center gap-2 mb-4">
        <Filter className="w-5 h-5 text-lime-400" />
        <h3 className="text-white text-lg font-semibold">Filters</h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-gray-300 text-sm font-medium mb-2">Status</label>
          <select
            value={filters.status}
            onChange={(e) => setFilters({...filters, status: e.target.value})}
            className="w-full bg-gray-700 text-white p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-lime-400"
          >
            <option value="">All Statuses</option>
            <option value="scheduled">Scheduled</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
            <option value="noshow">No Show</option>
          </select>
        </div>
        <div>
          <label className="block text-gray-300 text-sm font-medium mb-2">Date</label>
          <input
            type="date"
            value={filters.date}
            onChange={(e) => setFilters({...filters, date: e.target.value})}
            className="w-full bg-gray-700 text-white p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-lime-400"
          />
        </div>
        <div>
          <label className="block text-gray-300 text-sm font-medium mb-2">Email</label>
          <input
            type="email"
            value={filters.email}
            onChange={(e) => setFilters({...filters, email: e.target.value})}
            placeholder="Search by email..."
            className="w-full bg-gray-700 text-white p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-lime-400"
          />
        </div>
      </div>
      {(filters.status || filters.date || filters.email) && (
        <button
          onClick={() => setFilters({ status: '', date: '', email: '' })}
          className="mt-4 text-sm text-lime-400 hover:text-lime-300 font-medium"
        >
          Clear all filters
        </button>
      )}
    </div>
  );
};
export default DemoFilters