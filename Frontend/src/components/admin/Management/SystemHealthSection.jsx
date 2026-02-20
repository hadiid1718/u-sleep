import { Activity, AlertTriangle, CheckCircle, Zap } from "lucide-react";
import MetricCard from "../utils/MatricCard";

const SystemHealthSection = () => {
  const systemMetrics = [
    { title: 'Uptime', value: '99.94%', change: '+0.02%', icon: CheckCircle },
    { title: 'API Response Time', value: '145ms', change: '-12ms', icon: Zap },
    { title: 'Error Rate', value: '0.06%', change: '-0.03%', icon: AlertTriangle },
    { title: 'Active Connections', value: '1,847', change: '+23', icon: Activity }
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-white text-xl lg:text-2xl font-bold">System Health & Operations</h2>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-6">
        {systemMetrics.map((metric, index) => (
          <MetricCard key={index} {...metric} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        <div className="bg-gray-800 p-4 lg:p-6 rounded-lg">
          <h3 className="text-white text-lg font-semibold mb-4">API Status</h3>
          <div className="space-y-3">
            {[
              { service: 'Upwork API', status: 'Online', latency: '142ms' },
              { service: 'Yelp API', status: 'Online', latency: '98ms' },
              { service: 'Email Service', status: 'Online', latency: '67ms' },
              { service: 'Database', status: 'Online', latency: '23ms' }
            ].map((api, index) => (
              <div key={index} className="flex justify-between items-center">
                <span className="text-gray-300 text-sm lg:text-base truncate">{api.service}</span>
                <div className="flex items-center space-x-2 ml-2">
                  <span className="text-green-400 text-sm">{api.status}</span>
                  <span className="text-gray-400 text-xs lg:text-sm">{api.latency}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gray-800 p-4 lg:p-6 rounded-lg">
          <h3 className="text-white text-lg font-semibold mb-4">Recent Errors</h3>
          <div className="space-y-3">
            <div className="text-sm">
              <div className="text-red-400 truncate">Rate limit exceeded - Upwork API</div>
              <div className="text-gray-400 text-xs">2 minutes ago</div>
            </div>
            <div className="text-sm">
              <div className="text-yellow-400 truncate">Slow response - Database</div>
              <div className="text-gray-400 text-xs">15 minutes ago</div>
            </div>
            <div className="text-sm">
              <div className="text-red-400 truncate">Connection timeout - Email service</div>
              <div className="text-gray-400 text-xs">1 hour ago</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default SystemHealthSection