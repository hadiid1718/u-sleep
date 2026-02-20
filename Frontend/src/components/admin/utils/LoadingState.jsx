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

export const LoadingState = () => (
  <div className="flex justify-center items-center py-12 bg-gray-800 rounded-lg">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-lime-400"></div>
  </div>
);