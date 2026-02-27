import { Clock, Eye, MessageSquare, Target, Briefcase, FileText, Loader2 } from "lucide-react";
import MetricCard from "../utils/MatricCard";
import { useEffect, useState } from "react";
import { proposalAPI, jobAPI } from "../../../utils/api";

const AnalyticsSection = () => {
  const [stats, setStats] = useState(null);
  const [jobCount, setJobCount] = useState(0);
  const [topTemplates, setTopTemplates] = useState([]);
  const [categoryPerformance, setCategoryPerformance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [chartsLoading, setChartsLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      setChartsLoading(true);
      try {
        const [proposalResult, jobResult, templatesResult, categoryResult] = await Promise.all([
          proposalAPI.getProposalStats(),
          jobAPI.getFilteredJobs({ limit: 1 }),
          proposalAPI.getTopTemplates(),
          proposalAPI.getJobCategoryPerformance(),
        ]);
        if (proposalResult.success) {
          setStats(proposalResult.data?.data || null);
        }
        if (jobResult.success) {
          setJobCount(jobResult.data?.data?.pagination?.total || 0);
        }
        if (templatesResult.success) {
          setTopTemplates(templatesResult.data?.data || []);
        }
        if (categoryResult.success) {
          setCategoryPerformance(categoryResult.data?.data || []);
        }
      } catch (err) {
        console.error('Analytics fetch error:', err);
      } finally {
        setLoading(false);
        setChartsLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  const proposalStats = stats?.stats || {};
  const acceptanceRate = stats?.acceptanceRate || '0%';

  const metrics = [
    { title: 'Total Proposals', value: String(proposalStats.total || 0), change: `${proposalStats.sent || 0} sent`, icon: FileText },
    { title: 'Acceptance Rate', value: acceptanceRate, change: `${proposalStats.accepted || 0} accepted`, icon: Target },
    { title: 'Jobs Tracked', value: String(jobCount), change: `${proposalStats.draft || 0} drafts`, icon: Briefcase },
    { title: 'Proposals Rejected', value: String(proposalStats.rejected || 0), change: `${proposalStats.withdrawn || 0} withdrawn`, icon: Clock }
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
          {chartsLoading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="w-6 h-6 text-lime-400 animate-spin" />
            </div>
          ) : topTemplates.length === 0 ? (
            <p className="text-gray-400 text-sm">No proposal data available yet.</p>
          ) : (
            <div className="space-y-3">
              {topTemplates.map((template, index) => (
                <div key={index} className="flex justify-between items-center">
                  <span className="text-gray-300 text-sm lg:text-base truncate">{template.name}</span>
                  <span className="text-lime-400 font-medium ml-2">{template.rate}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-gray-800 p-4 lg:p-6 rounded-lg">
          <h3 className="text-white text-lg font-semibold mb-4">Job Category Performance</h3>
          {chartsLoading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="w-6 h-6 text-lime-400 animate-spin" />
            </div>
          ) : categoryPerformance.length === 0 ? (
            <p className="text-gray-400 text-sm">No job data available yet.</p>
          ) : (
            <div className="space-y-3">
              {categoryPerformance.map((cat, index) => (
                <div key={index} className="flex justify-between items-center">
                  <span className="text-gray-300 text-sm lg:text-base truncate">{cat.category}</span>
                  <span className="text-white font-medium ml-2">{cat.responses.toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
export default AnalyticsSection

