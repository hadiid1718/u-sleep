import React from 'react';

const DataTable = ({ headers, data, actions = [] }) => {
  return (
    <div className="bg-gray-800 rounded-lg overflow-hidden">
      {/* Mobile View */}
      <div className="lg:hidden">
        {data.map((row, rowIndex) => (
          <div key={rowIndex} className="p-4 border-b border-gray-700 last:border-b-0">
            {Object.entries(row).map(([key, value], cellIndex) => (
              <div key={cellIndex} className="flex justify-between py-1">
                <span className="text-gray-400 text-sm capitalize">{headers[cellIndex]}:</span>
                <span className="text-white text-sm font-medium">{value}</span>
              </div>
            ))}
            {actions.length > 0 && (
              <div className="flex space-x-2 mt-3 pt-3 border-t border-gray-700">
                {actions.map((action, actionIndex) => (
                  <button
                    key={actionIndex}
                    onClick={() => action.onClick(row)}
                    className={`px-3 py-1 rounded text-xs font-medium flex-1 ${action.className}`}
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Desktop View */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-700">
            <tr>
              {headers.map((header, index) => (
                <th 
                  key={index} 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider"
                >
                  {header}
                </th>
              ))}
              {actions.length > 0 && (
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {data.map((row, rowIndex) => (
              <tr key={rowIndex} className="hover:bg-gray-700 transition-colors">
                {Object.values(row).map((cell, cellIndex) => (
                  <td key={cellIndex} className="px-6 py-4 whitespace-nowrap text-sm text-white">
                    {cell}
                  </td>
                ))}
                {actions.length > 0 && (
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex space-x-2">
                      {actions.map((action, actionIndex) => (
                        <button
                          key={actionIndex}
                          onClick={() => action.onClick(row)}
                          className={`px-3 py-1 rounded text-xs font-medium ${action.className}`}
                        >
                          {action.label}
                        </button>
                      ))}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DataTable;