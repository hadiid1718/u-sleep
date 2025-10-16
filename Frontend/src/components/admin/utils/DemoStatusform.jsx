import React, { useState, useEffect } from 'react';


const DemoStatusForm = ({ demo, onClose, onSubmit }) => {
  const [status, setStatus] = useState(demo?.status || 'scheduled');
  const [notes, setNotes] = useState(demo?.notes || '');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(demo._id, status, notes);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-gray-300 text-sm font-medium mb-2">
          Demo Status
        </label>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="w-full bg-gray-700 text-white p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-lime-400"
        >
          <option value="scheduled">Scheduled</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
          <option value="noshow">No Show</option>
        </select>
      </div>

      <div>
        <label className="block text-gray-300 text-sm font-medium mb-2">
          Notes
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows="4"
          className="w-full bg-gray-700 text-white p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-lime-400"
          placeholder="Add notes about this demo..."
        />
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
          Update Demo
        </button>
      </div>
    </form>
  );
};
export default DemoStatusForm