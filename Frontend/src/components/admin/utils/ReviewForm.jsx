import React, { useState } from 'react';
import { AlertTriangle, User, FileText, Shield } from 'lucide-react';

const ReviewForm = ({ account, onClose, onSubmit }) => {
  const [reviewData, setReviewData] = useState({
    action: 'noaction',
    notes: '',
    severity: account.severity || 'Medium'
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setReviewData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...reviewData,
      user: account.user,
      reason: account.reason
    });
  };

  const getSeverityColor = (severity) => {
    const colors = {
      'High': 'text-red-400',
      'Medium': 'text-yellow-400',
      'Low': 'text-green-400'
    };
    return colors[severity] || 'text-gray-400';
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Account Information */}
      <div className="bg-gray-700 p-4 rounded-lg space-y-3">
        <div className="flex items-center gap-2">
          <User className="w-4 h-4 text-lime-400" />
          <span className="text-gray-300 text-sm">User:</span>
          <span className="text-white font-medium">{account.user}</span>
        </div>
        
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-lime-400" />
          <span className="text-gray-300 text-sm">Reason:</span>
          <span className="text-white">{account.reason}</span>
        </div>
        
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-lime-400" />
          <span className="text-gray-300 text-sm">Severity:</span>
          <span className={`font-semibold ${getSeverityColor(account.severity)}`}>
            {account.severity}
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-lime-400" />
          <span className="text-gray-300 text-sm">Current Status:</span>
          <span className="text-white">{account.status}</span>
        </div>
      </div>

      {/* Action Selection */}
      <div>
        <label className="block text-gray-300 text-sm font-medium mb-2">
          Action to Take
        </label>
        <select
          name="action"
          value={reviewData.action}
          onChange={handleChange}
          className="w-full bg-gray-700 text-white p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-lime-400"
        >
          <option value="noaction">No Action</option>
          <option value="warning">Send Warning</option>
          <option value="resolve">Resolve & Close</option>
          <option value="suspend">Suspend Account</option>
          <option value="investigate">Further Investigation</option>
        </select>
      </div>

      {/* Severity Update */}
      <div>
        <label className="block text-gray-300 text-sm font-medium mb-2">
          Update Severity Level
        </label>
        <select
          name="severity"
          value={reviewData.severity}
          onChange={handleChange}
          className="w-full bg-gray-700 text-white p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-lime-400"
        >
          <option value="Low">Low</option>
          <option value="Medium">Medium</option>
          <option value="High">High</option>
        </select>
      </div>

      {/* Review Notes */}
      <div>
        <label className="block text-gray-300 text-sm font-medium mb-2">
          Review Notes
        </label>
        <textarea
          name="notes"
          value={reviewData.notes}
          onChange={handleChange}
          rows="4"
          className="w-full bg-gray-700 text-white p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-lime-400"
          placeholder="Add detailed notes about your review and decision..."
        />
      </div>

      {/* Action Buttons */}
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
          Submit Review
        </button>
      </div>
    </form>
  );
};

export default ReviewForm;