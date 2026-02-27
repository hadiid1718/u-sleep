import React from 'react';
import { ExternalLink, MapPin, Clock, DollarSign, Users, CheckCircle, XCircle, Send, Star, Zap } from 'lucide-react';

export const JobCard = ({ job, formData, onAction }) => {
  const jobId = job._id || job.id;
  const status = job.matchStatus || job.status || 'pending';
  const matchScore = job.aiAnalysis?.matchScore || job.score || 0;
  const greenFlags = job.aiAnalysis?.greenFlags || [];
  const redFlags = job.aiAnalysis?.redFlags || [];
  const recommendation = job.aiAnalysis?.recommendation || '';
  const skills = job.skills || [];

  const budgetDisplay = job.budgetType === 'fixed'
    ? `$${(job.budget?.amount || 0).toLocaleString()}`
    : job.hourlyRate
      ? `$${job.hourlyRate.min}–$${job.hourlyRate.max}/hr`
      : typeof job.budget === 'string' ? job.budget : 'N/A';

  const timeAgo = (() => {
    const date = job.postedDate || job.createdAt;
    if (!date) return '';
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 30) return `${days}d ago`;
    return new Date(date).toLocaleDateString();
  })();

  const statusConfig = {
    matched: { label: 'Matched', bg: 'bg-green-500/10 border-green-500/30', text: 'text-green-400', icon: CheckCircle },
    applied: { label: 'Applied', bg: 'bg-blue-500/10 border-blue-500/30', text: 'text-blue-400', icon: Send },
    accepted: { label: 'Accepted', bg: 'bg-emerald-500/10 border-emerald-500/30', text: 'text-emerald-400', icon: CheckCircle },
    rejected: { label: 'Rejected', bg: 'bg-red-500/10 border-red-500/30', text: 'text-red-400', icon: XCircle },
    pending: { label: 'Pending', bg: 'bg-yellow-500/10 border-yellow-500/30', text: 'text-yellow-400', icon: Clock },
  };
  const statusInfo = statusConfig[status] || statusConfig.pending;
  const StatusIcon = statusInfo.icon;

  const scoreColor = matchScore >= 75 ? 'from-green-400 to-emerald-500' 
    : matchScore >= 60 ? 'from-yellow-400 to-amber-500' 
    : 'from-red-400 to-rose-500';

  const scoreBorder = matchScore >= 75 ? 'border-green-500/30' 
    : matchScore >= 60 ? 'border-yellow-500/30' 
    : 'border-red-500/30';

  return (
    <div className="group relative bg-gradient-to-br from-gray-800/80 to-gray-900/80 rounded-2xl border border-gray-700/50 hover:border-gray-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-black/20 overflow-hidden">
      {/* Top accent line */}
      <div className={`absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r ${scoreColor} opacity-60 group-hover:opacity-100 transition-opacity`} />

      <div className="p-4 md:p-5">
        {/* Row 1: Title, Status badge, Score */}
        <div className="flex items-start gap-4 mb-3">
          {/* Score circle */}
          <div className={`flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br ${scoreColor} flex items-center justify-center shadow-lg border ${scoreBorder}`}>
            <span className="text-white font-bold text-sm">{matchScore}</span>
          </div>

          {/* Title + meta */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h4 className="text-white font-semibold text-base leading-tight group-hover:text-lime-400 transition-colors truncate">
                {job.title || 'Untitled Job'}
              </h4>
              {recommendation && (
                <span className="flex items-center gap-1 text-[11px] font-semibold bg-lime-400/10 text-lime-400 px-2 py-0.5 rounded-full border border-lime-400/20">
                  <Zap className="w-3 h-3" />
                  {recommendation}
                </span>
              )}
            </div>
            <p className="text-gray-400 text-sm leading-relaxed line-clamp-1">
              {job.shortDescription || job.description?.substring(0, 120) || 'No description available'}
            </p>
          </div>

          {/* Status badge */}
          <div className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold ${statusInfo.bg} ${statusInfo.text}`}>
            <StatusIcon className="w-3.5 h-3.5" />
            {statusInfo.label}
          </div>
        </div>

        {/* Row 2: Meta info pills */}
        <div className="flex items-center gap-3 flex-wrap mb-3 ml-16">
          <span className="flex items-center gap-1.5 text-sm font-semibold text-lime-400">
            <DollarSign className="w-3.5 h-3.5" />
            {budgetDisplay}
          </span>
          {job.clientInfo?.country && (
            <span className="flex items-center gap-1 text-xs text-gray-500">
              <MapPin className="w-3 h-3" />
              {job.clientInfo.country}
            </span>
          )}
          {timeAgo && (
            <span className="flex items-center gap-1 text-xs text-gray-500">
              <Clock className="w-3 h-3" />
              {timeAgo}
            </span>
          )}
          {job.proposalsCount !== undefined && (
            <span className="flex items-center gap-1 text-xs text-gray-500">
              <Users className="w-3 h-3" />
              {job.proposalsCount} proposals
            </span>
          )}
          {job.clientInfo?.paymentVerified && (
            <span className="flex items-center gap-1 text-[11px] text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full">
              <CheckCircle className="w-3 h-3" />
              Verified
            </span>
          )}
          {job.clientInfo?.rating && (
            <span className="flex items-center gap-1 text-[11px] text-yellow-400">
              <Star className="w-3 h-3 fill-yellow-400" />
              {job.clientInfo.rating}
            </span>
          )}
        </div>

        {/* Row 3: Skills + Flags */}
        <div className="flex items-center justify-between gap-4 ml-16">
          <div className="flex items-center gap-1.5 flex-wrap flex-1 min-w-0">
            {skills.slice(0, 4).map((skill, i) => (
              <span key={i} className="text-[11px] font-medium bg-gray-700/60 text-gray-300 px-2 py-0.5 rounded-md border border-gray-600/30">
                {skill}
              </span>
            ))}
            {skills.length > 4 && (
              <span className="text-[11px] text-gray-500">+{skills.length - 4} more</span>
            )}
            {greenFlags.slice(0, 2).map((flag, i) => (
              <span key={`g${i}`} className="text-[11px] bg-green-900/20 text-green-400 px-2 py-0.5 rounded-md border border-green-500/10">
                {flag}
              </span>
            ))}
            {redFlags.slice(0, 1).map((flag, i) => (
              <span key={`r${i}`} className="text-[11px] bg-red-900/20 text-red-400 px-2 py-0.5 rounded-md border border-red-500/10">
                {flag}
              </span>
            ))}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {job.upworkUrl && (
              <a
                href={job.upworkUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-gray-400 hover:text-white bg-gray-700/40 hover:bg-gray-700 px-2.5 py-1.5 rounded-lg border border-gray-600/30 transition-all"
              >
                <ExternalLink className="w-3 h-3" />
                View
              </a>
            )}
            {(status === 'pending') && (
              <button
                onClick={() => onAction(jobId)}
                className="flex items-center gap-1.5 text-xs font-semibold bg-gradient-to-r from-lime-400 to-emerald-500 text-gray-900 px-3.5 py-1.5 rounded-lg shadow-md shadow-lime-400/10 hover:shadow-lime-400/30 hover:scale-105 active:scale-95 transition-all duration-200"
              >
                <CheckCircle className="w-3.5 h-3.5" />
                Match
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};