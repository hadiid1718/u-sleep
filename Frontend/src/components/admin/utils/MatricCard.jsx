import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Users, 
  MessageSquare, 
  Settings, 
  Activity, 
  DollarSign,
  Shield,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Eye,
  Target,
  Zap,
  Menu,
  X,
  Plus,
  Calendar,
  Phone,
  Mail,
  Building2,
  FileText,
  Filter
} from 'lucide-react';

const MetricCard = ({ title, value, change, icon: Icon, trend = 'up' }) => {
  return (
    <div className="bg-gray-800 p-4 lg:p-6 rounded-lg">
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-gray-400 text-sm truncate">{title}</p>
          <p className="text-white text-xl lg:text-2xl font-bold mt-1">{value}</p>
          {change && (
            <p className={`text-sm mt-1 ${trend === 'up' ? 'text-lime-400' : 'text-red-400'}`}>
              {trend === 'up' ? '+' : ''}{change}
            </p>
          )}
        </div>
        {Icon && (
          <div className="bg-lime-400 p-2 lg:p-3 rounded-lg ml-4 flex-shrink-0">
            <Icon size={20} className="lg:w-6 lg:h-6 text-gray-900" />
          </div>
        )}
      </div>
    </div>
  );
};

export default MetricCard