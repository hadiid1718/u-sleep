import { Clock, Eye, MessageSquare, Target } from "lucide-react";
import MetricCard from "../utils/MatricCard";

const AnalyticsSection = () => {
  const metrics = [
    { title: 'Total Responses Sent', value: '15,847', change: '+12%', icon: MessageSquare },
    { title: 'Average Open Rate', value: '52.3%', change: '+3.2%', icon: Eye },
    { title: 'Conversion Rate', value: '23.1%', change: '+5.7%', icon: Target },
    { title: 'Avg Response Time', value: '3.2 min', change: '-0.8 min', icon: Clock }
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-white text-xl lg:text-2xl font-bold">Analytics & Monitoring</h2>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-6">
        {metrics.map((metric, index) => (
          <MetricCard key={index} {...metric} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        <div className="bg-gray-800 p-4 lg:p-6 rounded-lg">
          <h3 className="text-white text-lg font-semibold mb-4">Top Performing Templates</h3>
          <div className="space-y-3">
            {[
              { name: 'Professional Introduction', rate: '67%' },
              { name: 'Technical Expertise', rate: '54%' },
              { name: 'Quick Turnaround', rate: '48%' },
              { name: 'Portfolio Showcase', rate: '42%' }
            ].map((template, index) => (
              <div key={index} className="flex justify-between items-center">
                <span className="text-gray-300 text-sm lg:text-base truncate">{template.name}</span>
                <span className="text-lime-400 font-medium ml-2">{template.rate}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gray-800 p-4 lg:p-6 rounded-lg">
          <h3 className="text-white text-lg font-semibold mb-4">Job Category Performance</h3>
          <div className="space-y-3">
            {[
              { category: 'Web Development', responses: '3,241' },
              { category: 'Mobile Apps', responses: '2,876' },
              { category: 'UI/UX Design', responses: '2,103' },
              { category: 'Data Science', responses: '1,892' }
            ].map((cat, index) => (
              <div key={index} className="flex justify-between items-center">
                <span className="text-gray-300 text-sm lg:text-base truncate">{cat.category}</span>
                <span className="text-white font-medium ml-2">{cat.responses}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
export default AnalyticsSection

