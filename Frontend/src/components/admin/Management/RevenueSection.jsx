import { DollarSign, AlertTriangle } from "lucide-react";
import MetricCard from "../utils/MatricCard";

const RevenueSection = () => {
  const revenueMetrics = [
    {
      title: 'Monthly Revenue',
      value: '$0.00',
      change: 'Payments disabled',
      icon: DollarSign,
    },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-white text-xl lg:text-2xl font-bold">Revenue & Business Intelligence</h2>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-6">
        {revenueMetrics.map((metric, index) => (
          <MetricCard key={index} {...metric} />
        ))}
      </div>

      <div className="bg-gray-800 p-4 lg:p-6 rounded-lg">
        <div className="flex items-center gap-3 mb-3">
          <AlertTriangle className="w-5 h-5 text-amber-400" />
          <h3 className="text-white text-lg font-semibold">Payment Module Removed</h3>
        </div>
        <p className="text-gray-300 text-sm">
          Revenue data is unavailable because the frontend payment service and backend payment routes were removed.
        </p>
      </div>
    </div>
  );
};
export default RevenueSection