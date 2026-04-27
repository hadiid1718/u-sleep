import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../context/Context';
import { Sidebar } from '../components/user/layout/Sidebar';
import { MobileHeader } from '../components/user/layout/MobileHeader';
import { DashboardView } from '../components/user/Dashboard/DashboardView';
import { PromptsView } from '../components/user/prompts/PromptsView';
import  NotificationsView  from '../components/user/notifications/NotificationsView';
import  SettingsView  from '../components/user/settings/SettingsView';
import SubscriptionView from '../components/user/subscription/SubscriptionView';
import { userAPI } from '../services/userService';
import { notificationAPI } from '../services/notificationService';
import { showErrorToast, showSuccessToast } from '../utils/toast';

const DEFAULT_PROPOSALS = [
  {
    id: 1,
    title: 'Roles and task:',
    content: 'You are an agency founder helping craft concise winning proposals.',
  },
  {
    id: 2,
    title: 'General rules:',
    content:
      'Keep proposals personalized, concise, and focused on client outcomes.',
  },
  {
    id: 3,
    title: 'Format must be:',
    content: 'Hook, relevance proof, execution plan, CTA.',
  },
];

const toProposalState = proposalPrompts => {
  const source =
    Array.isArray(proposalPrompts) && proposalPrompts.length > 0
      ? proposalPrompts
      : DEFAULT_PROPOSALS;

  return source.map((item, index) => ({
    id: index + 1,
    title: String(item?.title || '').trim(),
    content: String(item?.content || '').trim(),
  }));
};

const toCountryArray = value => {
  if (Array.isArray(value)) return value;
  if (typeof value !== 'string') return [];

  return value
    .split(',')
    .map(item => item.trim())
    .filter(Boolean);
};

const Dashboard = () => {
  const { 
    user, 
    handleLogout, 
    dashboardJobs, 
    dashboardLoading, 
    fetchDashboardJobs,
    matchJob,
    rejectJob,
    setJobResults,
    fetchProposalStats,
  } = useContext(AppContext);
  const navigate = useNavigate();

  const [activeMenu, setActiveMenu] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  const [formData, setFormData] = useState({
    email: user?.email || '',
    fullName: user?.name || '',
    profilePicture: user?.profilePicture || '',
    companyName: '',
    timezone: 'UTC',
    feedName: 'Primary Feed',
    keywords: '',
    speciality: '',
    freelancer: '',
    minHourlyRate: '',
    minFixedRate: '',
    clientMinSpend: '',
    clientMinRating: '',
    excludedCountries: '',
    includedCountries: '',
    model: 'GPT-4o Mini',
    telegramChatId: '',
  });
  const [feedActive, setFeedActive] = useState(true);
  const [allowNoBudget, setAllowNoBudget] = useState(true);
  const [proposals, setProposals] = useState(DEFAULT_PROPOSALS);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [notificationPreferences, setNotificationPreferences] = useState({
    inAppEnabled: true,
    emailFrequency: 'instant',
    instantHighPriorityOnly: false,
  });

  const [formStates, setFormStates] = useState({
    profileSaved: true,
    companySaved: true,
    feedSaved: true,
    proposalsSaved: true,
    telegramSaved: true,
  });

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) {
        setIsSidebarOpen(false);
      }
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const applyDashboardPayload = payload => {
    const profile = payload?.profile || {};
    const prompts = payload?.prompts || {};
    const notifications = payload?.notifications || {};
    const preferences = notifications?.preferences || {};

    setFormData(prev => ({
      ...prev,
      email: profile.email || user?.email || '',
      fullName: profile.fullName || user?.name || '',
      profilePicture: profile.profilePicture || '',
      companyName: profile.companyName || '',
      timezone: profile.timezone || 'UTC',
      feedName: prompts.feedName || 'Primary Feed',
      keywords: prompts.keywords || '',
      speciality: prompts.speciality || '',
      freelancer: prompts.freelancer || '',
      minHourlyRate:
        prompts.minHourlyRate === null || prompts.minHourlyRate === undefined
          ? ''
          : String(prompts.minHourlyRate),
      minFixedRate:
        prompts.minFixedRate === null || prompts.minFixedRate === undefined
          ? ''
          : String(prompts.minFixedRate),
      clientMinSpend:
        prompts.clientMinSpend === null || prompts.clientMinSpend === undefined
          ? ''
          : String(prompts.clientMinSpend),
      clientMinRating:
        prompts.clientMinRating === null || prompts.clientMinRating === undefined
          ? ''
          : String(prompts.clientMinRating),
      excludedCountries: Array.isArray(prompts.excludedCountries)
        ? prompts.excludedCountries.join(', ')
        : '',
      includedCountries: Array.isArray(prompts.includedCountries)
        ? prompts.includedCountries.join(', ')
        : '',
      model: prompts.model || 'GPT-4o Mini',
      telegramChatId: notifications.telegramChatId || '',
    }));

    setFeedActive(prompts.feedActive !== false);
    setAllowNoBudget(prompts.allowNoBudget !== false);
    setProposals(toProposalState(prompts.proposalPrompts));

    setEmailNotifications(preferences.emailEnabled !== false);
    setNotificationPreferences({
      inAppEnabled: preferences.inAppEnabled !== false,
      emailFrequency: preferences.emailFrequency || 'instant',
      instantHighPriorityOnly: Boolean(preferences.instantHighPriorityOnly),
    });

    setFormStates({
      profileSaved: true,
      companySaved: true,
      feedSaved: true,
      proposalsSaved: true,
      telegramSaved: true,
    });
  };

  const loadDashboardConfig = async () => {
    const response = await userAPI.getDashboardData();

    if (!response.success) {
      showErrorToast(response.error?.message || 'Failed to load dashboard settings');
      return;
    }

    applyDashboardPayload(response.data?.data);
  };

  useEffect(() => {
    if (user) {
      fetchDashboardJobs({ status: 'all' });
      fetchProposalStats();
      loadDashboardConfig();
    }
  }, [user]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    if (field === 'fullName' || field === 'profilePicture') {
      setFormStates(prev => ({ ...prev, profileSaved: false }));
      return;
    }

    if (field === 'companyName' || field === 'timezone') {
      setFormStates(prev => ({ ...prev, companySaved: false }));
      return;
    }

    if (field === 'telegramChatId') {
      setFormStates(prev => ({ ...prev, telegramSaved: false }));
      return;
    }

    setFormStates(prev => ({ ...prev, feedSaved: false }));
  };

  const handleFeedActiveChange = value => {
    setFeedActive(Boolean(value));
    setFormStates(prev => ({ ...prev, feedSaved: false }));
  };

  const handleAllowNoBudgetChange = value => {
    setAllowNoBudget(Boolean(value));
    setFormStates(prev => ({ ...prev, feedSaved: false }));
  };

  const handleEmailNotificationsChange = value => {
    setEmailNotifications(Boolean(value));
    setFormStates(prev => ({ ...prev, telegramSaved: false }));
  };

  const handleAddProposal = () => {
    setProposals(prev => {
      const nextId = prev.reduce((max, item) => Math.max(max, item.id), 0) + 1;
      return [...prev, { id: nextId, title: '', content: '' }];
    });
    setFormStates(prev => ({ ...prev, proposalsSaved: false }));
  };

  const handleUpdateProposal = (proposalId, field, value) => {
    setProposals(prev =>
      prev.map(item => (item.id === proposalId ? { ...item, [field]: value } : item))
    );
    setFormStates(prev => ({ ...prev, proposalsSaved: false }));
  };

  const handleRemoveProposal = proposalId => {
    setProposals(prev => prev.filter(item => item.id !== proposalId));
    setFormStates(prev => ({ ...prev, proposalsSaved: false }));
  };

  const savePromptConfiguration = async () => {
    const payload = {
      feedName: formData.feedName,
      feedActive,
      keywords: formData.keywords,
      speciality: formData.speciality,
      freelancer: formData.freelancer,
      minHourlyRate: formData.minHourlyRate,
      minFixedRate: formData.minFixedRate,
      clientMinSpend: formData.clientMinSpend,
      clientMinRating: formData.clientMinRating,
      allowNoBudget,
      excludedCountries: toCountryArray(formData.excludedCountries),
      includedCountries: toCountryArray(formData.includedCountries),
      model: formData.model,
      proposalPrompts: proposals.map(({ title, content }) => ({
        title: String(title || '').trim(),
        content: String(content || '').trim(),
      })),
    };

    const response = await userAPI.updatePromptSettings(payload);
    if (!response.success) {
      showErrorToast(response.error?.message || 'Failed to save prompts configuration');
      return false;
    }

    applyDashboardPayload(response.data?.data);
    return true;
  };

  const handleSave = async saveKey => {
    if (!saveKey) return;

    if (saveKey === 'profileSaved') {
      const response = await userAPI.updateDashboardSettings({
        fullName: formData.fullName,
        profilePicture: formData.profilePicture,
      });

      if (!response.success) {
        showErrorToast(response.error?.message || 'Failed to save profile settings');
        return;
      }

      applyDashboardPayload(response.data?.data);
      showSuccessToast('Profile settings updated successfully');
      return;
    }

    if (saveKey === 'companySaved') {
      const response = await userAPI.updateDashboardSettings({
        companyName: formData.companyName,
        timezone: formData.timezone,
      });

      if (!response.success) {
        showErrorToast(response.error?.message || 'Failed to save company settings');
        return;
      }

      applyDashboardPayload(response.data?.data);
      showSuccessToast('Company settings updated successfully');
      return;
    }

    if (saveKey === 'feedSaved') {
      const success = await savePromptConfiguration();
      if (success) showSuccessToast('Feed configuration updated successfully');
      return;
    }

    if (saveKey === 'proposalsSaved') {
      const success = await savePromptConfiguration();
      if (success) showSuccessToast('Proposal prompts updated successfully');
      return;
    }

    if (saveKey === 'telegramSaved') {
      const telegramResponse = await userAPI.updateNotificationMeta({
        telegramChatId: formData.telegramChatId,
      });

      if (!telegramResponse.success) {
        showErrorToast(
          telegramResponse.error?.message || 'Failed to save Telegram settings'
        );
        return;
      }

      const preferencesResponse = await notificationAPI.updatePreferences({
        emailEnabled: emailNotifications,
        inAppEnabled: notificationPreferences.inAppEnabled,
        emailFrequency: notificationPreferences.emailFrequency,
        instantHighPriorityOnly: notificationPreferences.instantHighPriorityOnly,
      });

      if (!preferencesResponse.success) {
        showErrorToast(
          preferencesResponse.error?.message ||
            'Telegram saved, but email notification preferences failed to update'
        );
        await loadDashboardConfig();
        return;
      }

      await loadDashboardConfig();
      showSuccessToast('Notification settings updated successfully');
    }
  };

  const extractJobPrefill = (job) => {
    const minHourlyRate =
      job?.hourlyRate?.min ??
      (job?.budgetType === 'hourly' ? job?.budget?.min : null) ??
      '';
    const minFixedRate =
      job?.budgetType === 'fixed' ? (job?.budget?.amount ?? '') : '';

    return {
      minHourlyRate: minHourlyRate === null ? '' : String(minHourlyRate),
      minFixedRate: minFixedRate === null ? '' : String(minFixedRate),
      clientMinSpend:
        job?.clientInfo?.totalSpent !== null &&
        job?.clientInfo?.totalSpent !== undefined
          ? String(job.clientInfo.totalSpent)
          : '',
      clientMinRating:
        job?.clientInfo?.rating !== null &&
        job?.clientInfo?.rating !== undefined
          ? String(job.clientInfo.rating)
          : '',
    };
  };

  const handleJobAction = async (job, action = 'match') => {
    const jobId = job?._id || job?.id || job?.upworkJobId || job?.sourceJobId;
    if (!jobId) return;

    if (action === 'review') {
      setJobResults([job]);
      navigate('/job-result');
      return;
    }

    if (action === 'reject') {
      await rejectJob(jobId);
    } else {
      const result = await matchJob(jobId);
      if (result?.success) {
        setFormData(prev => ({
          ...prev,
          ...extractJobPrefill(job),
        }));
        setFormStates(prev => ({ ...prev, feedSaved: false }));
        setActiveMenu('prompts');
      }
    }

    // Refresh the job list
    await fetchDashboardJobs({ status: 'all' });
  };

  const handleMenuClick = (menuId) => {
    setActiveMenu(menuId);
    if (isMobile) {
      setIsSidebarOpen(false);
    }
  };

  const renderContent = () => {
    switch (activeMenu) {
      case 'dashboard':
        return (
          <DashboardView
            dashboardJobs={dashboardJobs}
            dashboardLoading={dashboardLoading}
            formStates={formStates}
            user={user}
            onMenuClick={handleMenuClick}
            handleJobAction={handleJobAction}
            formData={formData}
          />
        );
      case 'prompts':
        return (
          <PromptsView
            formData={formData}
            onInputChange={handleInputChange}
            formStates={formStates}
            feedActive={feedActive}
            onFeedActiveChange={handleFeedActiveChange}
            allowNoBudget={allowNoBudget}
            onAllowNoBudgetChange={handleAllowNoBudgetChange}
            proposals={proposals}
            onAddProposal={handleAddProposal}
            onUpdateProposal={handleUpdateProposal}
            onRemoveProposal={handleRemoveProposal}
            onSaveFeed={() => handleSave('feedSaved')}
            onSaveProposals={() => handleSave('proposalsSaved')}
          />
        );
      case 'notifications':
        return (
          <NotificationsView
            emailNotifications={emailNotifications}
            setEmailNotifications={handleEmailNotificationsChange}
            formData={formData}
            handleInputChange={handleInputChange}
            formStates={formStates}
            handleSave={handleSave}
          />
        );
      case 'settings':
        return (
          <SettingsView
            formData={formData}
            handleInputChange={handleInputChange}
            formStates={formStates}
            handleSave={handleSave}
          />
        );
      case 'subscription':
        return <SubscriptionView />;
      default:
        return (
          <DashboardView
            dashboardJobs={dashboardJobs}
            dashboardLoading={dashboardLoading}
            formStates={formStates}
            user={user}
            onMenuClick={handleMenuClick}
            handleJobAction={handleJobAction}
            formData={formData}
          />
        );
    }
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-900 to-black">
      {/* Mobile Header */}
      {isMobile && <MobileHeader onMenuToggle={() => setIsSidebarOpen(!isSidebarOpen)} />}

      {/* Mobile Overlay */}
      {isMobile && isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40" 
          onClick={() => setIsSidebarOpen(false)} 
        />
      )}

      {/* Sidebar */}
      <Sidebar
        user={user}
        activeMenu={activeMenu}
        onMenuClick={handleMenuClick}
        onLogout={handleLogout}
        isMobile={isMobile}
        isSidebarOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        formData={formData}
      />

      {/* Main Content */}
      <div className={`flex-1 overflow-auto ${isMobile ? 'pt-16' : ''}`}>
        <div className="p-4 md:p-6 lg:p-8 min-h-full">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;