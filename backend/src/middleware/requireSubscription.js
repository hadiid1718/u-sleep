import Subscription from '../models/subscription.model.js';
import UsageRecord from '../models/usageRecord.model.js';
import {
  ACTIVE_SUBSCRIPTION_STATUSES,
  toMonthKey,
} from '../utils/subscriptionPlans.js';

const getAuthUserId = req =>
  String(
    req.user?._id || req.user?.id || req.admin?._id || req.admin?.id || ''
  );

const normalizePlatform = platform => {
  const normalized = String(platform || '').toLowerCase();
  return normalized === 'freelancer' ? 'freelancer' : 'upwork';
};

const requireSubscription =
  ({ action = 'generic', checkPlatformLimit = false } = {}) =>
  async (req, res, next) => {
    try {
      const userId = getAuthUserId(req);

      if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const subscription =
        req.subscription || (await Subscription.findOne({ userId }));

      if (
        !subscription ||
        !ACTIVE_SUBSCRIPTION_STATUSES.includes(subscription.status)
      ) {
        return res.status(403).json({
          message: 'Active subscription is required to access this action.',
        });
      }

      if (action === 'direct-send' && !subscription.autoSendEnabled) {
        return res.status(403).json({
          message:
            'Direct send is available on Pro and Agency plans only. Please upgrade your plan.',
        });
      }

      if (checkPlatformLimit) {
        const month = toMonthKey();
        const currentPlatform = normalizePlatform(
          req.body?.platform ||
            req.user?.jobPreferences?.selectedPlatform ||
            'upwork'
        );

        const usage = await UsageRecord.findOneAndUpdate(
          { userId, month },
          {
            $setOnInsert: {
              orgId: null,
              aiProposalsUsed: 0,
              autoSendUsed: 0,
              platformsConnected: [],
            },
          },
          {
            upsert: true,
            new: true,
            setDefaultsOnInsert: true,
          }
        );

        const connectedPlatforms = usage.platformsConnected || [];
        const platformLimit = subscription.platformLimit || 1;

        if (
          !connectedPlatforms.includes(currentPlatform) &&
          connectedPlatforms.length >= platformLimit
        ) {
          return res.status(403).json({
            message: 'Platform connection limit reached for your plan.',
            platformLimit,
            connectedPlatforms,
            attemptedPlatform: currentPlatform,
          });
        }

        req.currentPlatform = currentPlatform;
        req.currentUsageRecord = usage;
      }

      req.subscription = subscription;
      return next();
    } catch (error) {
      return next(error);
    }
  };

export default requireSubscription;
