import Subscription from '../models/subscription.model.js';
import UsageRecord from '../models/usageRecord.model.js';
import {
  ACTIVE_SUBSCRIPTION_STATUSES,
  isUnlimitedPlan,
  nextMonthResetDate,
  toMonthKey,
} from '../utils/subscriptionPlans.js';

const getAuthUserId = req =>
  String(
    req.user?._id || req.user?.id || req.admin?._id || req.admin?.id || ''
  );

const shouldBypassSubscription = () =>
  process.env.NODE_ENV === 'development' &&
  process.env.DEV_BYPASS_SUBSCRIPTION === 'true';

const usageMetering = async (req, res, next) => {
  try {
    const userId = getAuthUserId(req);

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    if (shouldBypassSubscription()) {
      req.subscription = req.subscription || {
        status: 'active',
        plan: 'agency',
        proposalLimit: -1,
        platformLimit: 2,
        autoSendEnabled: true,
      };
      req.currentUsageRecord = req.currentUsageRecord || {
        aiProposalsUsed: 0,
        autoSendUsed: 0,
        platformsConnected: [],
      };
      req.usageMonth = req.usageMonth || toMonthKey();
      return next();
    }

    const subscription =
      req.subscription || (await Subscription.findOne({ userId }));

    if (
      !subscription ||
      !ACTIVE_SUBSCRIPTION_STATUSES.includes(subscription.status)
    ) {
      return res.status(403).json({
        message: 'Active subscription required to generate proposals.',
      });
    }

    const month = toMonthKey();

    const usageRecord = await UsageRecord.findOneAndUpdate(
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

    const limit = subscription.proposalLimit;
    const used = usageRecord.aiProposalsUsed || 0;

    if (!isUnlimitedPlan(limit) && used >= limit) {
      return res.status(429).json({
        message: 'Monthly proposal quota exhausted.',
        limit,
        used,
        resetDate: nextMonthResetDate().toISOString(),
      });
    }

    req.subscription = subscription;
    req.currentUsageRecord = usageRecord;
    req.usageMonth = month;

    return next();
  } catch (error) {
    return next(error);
  }
};

export default usageMetering;
