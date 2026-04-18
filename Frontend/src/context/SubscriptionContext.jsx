/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AppContext } from './Context';
import billingService from '../services/billingService';

const SubscriptionContext = createContext(null);

const normalizePercent = (used, limit) => {
  if (!Number.isFinite(limit) || limit <= 0) return 0;
  return Math.min(100, Math.round((used / limit) * 100));
};

export const SubscriptionProvider = ({ children }) => {
  const queryClient = useQueryClient();
  const { user } = useContext(AppContext);

  const rawToken = localStorage.getItem('token');
  const token =
    rawToken && rawToken !== 'undefined' && rawToken !== 'null'
      ? rawToken
      : null;
  const isAuthenticated = Boolean(token && user);

  const plansQuery = useQuery({
    queryKey: ['billing', 'plans'],
    enabled: true,
    queryFn: async () => {
      const response = await billingService.getPlans();
      if (!response.success) {
        throw new Error(response.error?.message || 'Failed to load plans');
      }
      return response.data;
    },
    staleTime: 300000,
  });

  const subscriptionQuery = useQuery({
    queryKey: ['billing', 'subscription', user?._id || user?.id || 'anonymous'],
    enabled: isAuthenticated,
    queryFn: async () => {
      const response = await billingService.getSubscription();
      if (!response.success) {
        throw new Error(response.error?.message || 'Failed to load subscription');
      }
      return response.data;
    },
    refetchOnWindowFocus: false,
  });

  const createCheckoutMutation = useMutation({
    mutationFn: async (planId) => {
      const response = await billingService.createCheckoutSession(planId);
      if (!response.success) {
        throw new Error(response.error?.message || 'Unable to start checkout');
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['billing', 'subscription'] });
    },
  });

  const createPortalMutation = useMutation({
    mutationFn: async () => {
      const response = await billingService.createPortalSession();
      if (!response.success) {
        throw new Error(response.error?.message || 'Unable to open portal');
      }
      return response.data;
    },
  });

  const cancelSubscriptionMutation = useMutation({
    mutationFn: async () => {
      const response = await billingService.cancelSubscription();
      if (!response.success) {
        throw new Error(response.error?.message || 'Unable to cancel subscription');
      }
      return response;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['billing', 'subscription'] });
    },
  });

  const subscription = subscriptionQuery.data || {
    plan: null,
    isActive: false,
    limits: {
      proposalLimit: 0,
      platformLimit: 0,
      autoSendEnabled: false,
    },
    usage: {
      aiProposalsUsed: 0,
      autoSendUsed: 0,
      platformsConnected: [],
      month: null,
    },
    proposalsRemaining: 0,
    nextResetDate: null,
  };

  const proposalLimit = subscription?.limits?.proposalLimit ?? 0;
  const proposalsUsed = subscription?.usage?.aiProposalsUsed ?? 0;
  const usagePercentage = normalizePercent(proposalsUsed, proposalLimit);

  const isStarterPlan = subscription?.plan === 'starter';
  const canDirectSend = Boolean(subscription?.isActive && subscription?.limits?.autoSendEnabled);
  const shouldShowUpgradeWarning =
    isAuthenticated && (usagePercentage >= 80 || !canDirectSend);
  const isQuotaExhausted =
    isAuthenticated && proposalLimit > 0 && subscription?.proposalsRemaining !== null
      ? subscription.proposalsRemaining <= 0
      : false;

  const startCheckout = async (planId) => {
    if (!isAuthenticated) {
      window.location.href = '/user/sign-in';
      return null;
    }

    const session = await createCheckoutMutation.mutateAsync(planId);
    if (session?.checkoutUrl) {
      window.location.href = session.checkoutUrl;
    }
    return session;
  };

  const openPortal = async () => {
    if (!isAuthenticated) {
      window.location.href = '/user/sign-in';
      return null;
    }

    const portal = await createPortalMutation.mutateAsync();
    if (portal?.url) {
      window.location.href = portal.url;
    }
    return portal;
  };

  const cancelAtPeriodEnd = () => {
    if (!isAuthenticated) {
      window.location.href = '/user/sign-in';
      return Promise.resolve(null);
    }

    return cancelSubscriptionMutation.mutateAsync();
  };

  const refreshSubscription = async () => {
    if (!isAuthenticated) return;
    await subscriptionQuery.refetch();
  };

  const contextValue = useMemo(
    () => ({
      plans: plansQuery.data || [],
      subscription,
      proposalLimit,
      proposalsUsed,
      usagePercentage,
      isStarterPlan,
      isAuthenticated,
      canDirectSend,
      shouldShowUpgradeWarning,
      isQuotaExhausted,
      isLoading: plansQuery.isLoading || subscriptionQuery.isLoading,
      isError: plansQuery.isError || subscriptionQuery.isError,
      error:
        plansQuery.error?.message ||
        (isAuthenticated ? subscriptionQuery.error?.message : null) ||
        createCheckoutMutation.error?.message ||
        createPortalMutation.error?.message ||
        cancelSubscriptionMutation.error?.message ||
        null,
      startCheckout,
      openPortal,
      cancelAtPeriodEnd,
      refreshSubscription,
      isProcessingCheckout: createCheckoutMutation.isPending,
      isProcessingPortal: createPortalMutation.isPending,
      isProcessingCancel: cancelSubscriptionMutation.isPending,
    }),
    [
      plansQuery.data,
      plansQuery.isLoading,
      plansQuery.isError,
      plansQuery.error,
      subscription,
      proposalLimit,
      proposalsUsed,
      usagePercentage,
      isStarterPlan,
      isAuthenticated,
      canDirectSend,
      shouldShowUpgradeWarning,
      isQuotaExhausted,
      subscriptionQuery.isLoading,
      subscriptionQuery.isError,
      subscriptionQuery.error,
      createCheckoutMutation.error,
      createCheckoutMutation.isPending,
      createPortalMutation.error,
      createPortalMutation.isPending,
      cancelSubscriptionMutation.error,
      cancelSubscriptionMutation.isPending,
    ]
  );

  return (
    <SubscriptionContext.Provider value={contextValue}>
      {children}
    </SubscriptionContext.Provider>
  );
};

export const useSubscriptionContext = () => {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error('useSubscriptionContext must be used inside SubscriptionProvider');
  }
  return context;
};
