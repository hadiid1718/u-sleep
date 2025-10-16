import { CheckCircle, Clock, MessageSquare, XCircle } from "lucide-react";
import MetricCard from "../utils/MatricCard";

const MessageManagementSection = () => {
  const messageMetrics = [
    { title: 'Messages Sent Today', value: '847', change: '+23%', icon: MessageSquare },
    { title: 'Template Success Rate', value: '89.2%', change: '+4.1%', icon: CheckCircle },
    { title: 'Failed Sends', value: '12', change: '-67%', icon: XCircle },
    { title: 'Queue Length', value: '156', change: '+12', icon: Clock }
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-white text-xl lg:text-2xl font-bold">Message & Response Management</h2>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-6">
        {messageMetrics.map((metric, index) => (
          <MetricCard key={index} {...metric} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        <div className="bg-gray-800 p-4 lg:p-6 rounded-lg">
          <h3 className="text-white text-lg font-semibold mb-4">Message Queue Status</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-300">Pending</span>
              <span className="bg-yellow-600 text-white px-2 py-1 rounded text-sm">156</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-300">Processing</span>
              <span className="bg-blue-600 text-white px-2 py-1 rounded text-sm">23</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-300">Completed</span>
              <span className="bg-green-600 text-white px-2 py-1 rounded text-sm">847</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-300">Failed</span>
              <span className="bg-red-600 text-white px-2 py-1 rounded text-sm">12</span>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 p-4 lg:p-6 rounded-lg">
          <h3 className="text-white text-lg font-semibold mb-4">A/B Testing Results</h3>
          <div className="space-y-3">
            {[
              { test: 'Template A vs B', winner: 'Template B', improvement: '+15%' },
              { test: 'Subject Line Test', winner: 'Version 2', improvement: '+8%' },
              { test: 'Send Time Test', winner: '9AM EST', improvement: '+12%' },
              { test: 'Tone Variation', winner: 'Professional', improvement: '+6%' }
            ].map((test, index) => (
              <div key={index} className="flex justify-between items-center">
                <div className="flex-1 min-w-0">
                  <span className="text-gray-300 block text-sm lg:text-base truncate">{test.test}</span>
                  <span className="text-gray-400 text-xs lg:text-sm truncate">Winner: {test.winner}</span>
                </div>
                <span className="text-lime-400 font-medium ml-2">{test.improvement}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessageManagementSection;