import { DollarSign, Target, TrendingUp, Users } from "lucide-react";
import MetricCard from "../utils/MatricCard";

const RevenueSection = () => {
  const revenueMetrics = [
    { title: 'Monthly Revenue', value: '$47,892', change: '+18%', icon: DollarSign },
    { title: 'New Subscriptions', value: '187', change: '+23%', icon: TrendingUp },
    { title: 'Churn Rate', value: '3.2%', change: '-0.8%', icon: Users, trend: 'down' },
    { title: 'Average LTV', value: '$340', change: '+12%', icon: Target }
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-white text-xl lg:text-2xl font-bold">Revenue & Business Intelligence</h2>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-6">
        {revenueMetrics.map((metric, index) => (
          <MetricCard key={index} {...metric} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        <div className="bg-gray-800 p-4 lg:p-6 rounded-lg">
          <h3 className="text-white text-lg font-semibold mb-4">Subscription Breakdown</h3>
          <div className="space-y-3">
            {[
              { plan: 'Basic ($9.99/mo)', users: '487', revenue: '$4,861' },
              { plan: 'Professional ($24.99/mo)', users: '856', revenue: '$21,399' },
              { plan: 'Premium ($49.99/mo)', users: '743', revenue: '$37,143' },
              { plan: 'Enterprise ($99.99/mo)', users: '94', revenue: '$9,399' }
            ].map((sub, index) => (
              <div key={index} className="flex justify-between items-center">
                <div className="flex-1 min-w-0">
                  <span className="text-gray-300 block text-sm lg:text-base truncate">{sub.plan}</span>
                  <span className="text-gray-400 text-xs lg:text-sm">{sub.users} users</span>
                </div>
                <span className="text-lime-400 font-medium ml-2">{sub.revenue}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gray-800 p-4 lg:p-6 rounded-lg">
          <h3 className="text-white text-lg font-semibold mb-4">Conversion Funnel</h3>
          <div className="space-y-3">
            {[
              { stage: 'Visitors', count: '12,847', rate: '100%' },
              { stage: 'Sign-ups', count: '1,284', rate: '10.0%' },
              { stage: 'Trial Started', count: '964', rate: '75.1%' },
              { stage: 'Converted to Paid', count: '243', rate: '25.2%' }
            ].map((stage, index) => (
              <div key={index} className="flex justify-between items-center">
                <span className="text-gray-300 text-sm lg:text-base truncate">{stage.stage}</span>
                <div className="text-right ml-2">
                  <span className="text-white block text-sm lg:text-base">{stage.count}</span>
                  <span className="text-gray-400 text-xs lg:text-sm">{stage.rate}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
export default RevenueSection