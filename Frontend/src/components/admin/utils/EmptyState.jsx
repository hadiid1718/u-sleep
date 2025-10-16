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

export const EmptyState = () => (
  <div className="bg-gray-800 rounded-lg p-12 text-center">
    <Calendar className="w-16 h-16 text-gray-600 mx-auto mb-4" />
    <h3 className="text-lg font-medium text-white mb-2">No demos found</h3>
    <p className="text-gray-400">No demo appointments match your current filters.</p>
  </div>
);