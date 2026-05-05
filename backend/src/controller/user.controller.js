import User from '../models/user.model.js';

const DEFAULT_PROPOSAL_PROMPTS = [
  {
    title: 'Roles and task:',
    content:
      'You are an agency founder helping craft concise winning proposals.',
  },
  {
    title: 'General rules:',
    content:
      'Keep proposals personalized, concise, and focused on client outcomes.',
  },
  {
    title: 'Format must be:',
    content: 'Hook, relevance proof, execution plan, CTA.',
  },
];

const parseNumberOrNull = value => {
  if (value === undefined || value === null || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const normalizeStringArray = value => {
  if (Array.isArray(value)) {
    return value.map(item => String(item || '').trim()).filter(Boolean);
  }

  if (typeof value === 'string') {
    return value
      .split(',')
      .map(item => item.trim())
      .filter(Boolean);
  }

  return [];
};

const parseKeywords = value => {
  if (Array.isArray(value)) {
    return value.map(item => String(item || '').trim()).filter(Boolean);
  }

  if (typeof value === 'string') {
    return value
      .split(/[\n,]/)
      .map(item => item.trim())
      .filter(Boolean);
  }

  return [];
};

const sanitizePrompts = prompts => {
  if (!Array.isArray(prompts)) return DEFAULT_PROPOSAL_PROMPTS;

  const cleaned = prompts
    .map(item => ({
      title: String(item?.title || '').trim(),
      content: String(item?.content || '').trim(),
    }))
    .filter(item => item.title || item.content)
    .slice(0, 20);

  return cleaned.length > 0 ? cleaned : DEFAULT_PROPOSAL_PROMPTS;
};

const getAuthUserId = req =>
  String(
    req.user?._id || req.user?.id || req.admin?._id || req.admin?.id || ''
  );

const mapDashboardPayload = user => {
  const jobPreferences = user?.jobPreferences || {};
  const dashboardConfig = user?.dashboardConfig || {};

  return {
    profile: {
      id: user?._id,
      email: user?.email || '',
      fullName: user?.name || '',
      profilePicture: user?.profilePicture || '',
      companyName: dashboardConfig.companyName || '',
      timezone: dashboardConfig.timezone || 'UTC',
    },
    prompts: {
      feedName: dashboardConfig.feedName || 'Primary Feed',
      feedActive: dashboardConfig.feedActive !== false,
      keywords: (jobPreferences.keywords || []).join(', '),
      keywordsList: jobPreferences.keywords || [],
      speciality: dashboardConfig.speciality || '',
      freelancer: dashboardConfig.freelancer || '',
      minHourlyRate: jobPreferences.hourlyRate ?? '',
      minFixedRate: jobPreferences.fixedRate ?? '',
      clientMinSpend: dashboardConfig.clientMinSpend ?? '',
      clientMinRating: dashboardConfig.clientMinRating ?? '',
      allowNoBudget: dashboardConfig.allowNoBudget !== false,
      excludedCountries: dashboardConfig.excludedCountries || [],
      includedCountries: dashboardConfig.includedCountries || [],
      model: dashboardConfig.model || 'GPT-4o Mini',
      proposalPrompts:
        dashboardConfig.proposalPrompts?.length > 0
          ? dashboardConfig.proposalPrompts
          : DEFAULT_PROPOSAL_PROMPTS,
    },
    notifications: {
      telegramChatId: dashboardConfig.telegramChatId || '',
      preferences: user?.notificationPreferences || {
        emailEnabled: true,
        inAppEnabled: true,
        emailFrequency: 'instant',
        instantHighPriorityOnly: false,
      },
    },
  };
};

export const getUsers = async (req, res, next) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit) || 10, 1), 100);
    const skip = (page - 1) * limit;
    const search = req.query.search || '';

    // Build filter
    const filter = {};
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const [users, totalCount] = await Promise.all([
      User.find(filter)
        .select('-password')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    res.status(200).json({
      success: true,
      totalCount,
      page,
      totalPages,
      limit,
      data: users,
    });
  } catch (error) {
    next(error);
  }
};
export const getUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      const error = new Error('No user found');
      error.statusCode = 404;
      throw error;
    }
    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

export const updateUser = async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!user) {
      const error = new Error('No user found');
      error.statusCode = 404;
      throw error;
    }
    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (e) {
    next(e);
  }
};

export const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      const error = new Error('No user found');
      error.statusCode = 404;
      throw error;
    }
    res.status(200).json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (err) {
    next(err);
  }
};

// Flag or unflag a user account
export const flagUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { isFlagged, flagReason } = req.body;

    if (typeof isFlagged !== 'boolean') {
      const error = new Error('isFlagged (boolean) is required');
      error.statusCode = 400;
      throw error;
    }

    const updateData = {
      isFlagged,
      flagReason: isFlagged ? flagReason || 'Terms & conditions violation' : '',
      flaggedAt: isFlagged ? new Date() : null,
    };

    const user = await User.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    }).select('-password');

    if (!user) {
      const error = new Error('No user found');
      error.statusCode = 404;
      throw error;
    }

    res.status(200).json({
      success: true,
      message: isFlagged
        ? 'User account flagged successfully'
        : 'User account unflagged successfully',
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

export const getMyDashboard = async (req, res, next) => {
  try {
    const userId = getAuthUserId(req);
    if (!userId) {
      const error = new Error('Unauthorized');
      error.statusCode = 401;
      throw error;
    }

    const user = await User.findById(userId).select('-password').lean();

    if (!user) {
      const error = new Error('No user found');
      error.statusCode = 404;
      throw error;
    }

    res.status(200).json({
      success: true,
      data: mapDashboardPayload(user),
    });
  } catch (error) {
    next(error);
  }
};

export const updateMySettings = async (req, res, next) => {
  try {
    const userId = getAuthUserId(req);
    if (!userId) {
      const error = new Error('Unauthorized');
      error.statusCode = 401;
      throw error;
    }

    const { fullName, companyName, timezone, profilePicture } = req.body || {};

    const updates = {};
    if (typeof fullName === 'string' && fullName.trim()) {
      updates.name = fullName.trim();
    }
    if (typeof profilePicture === 'string') {
      updates.profilePicture = profilePicture.trim();
    }
    if (typeof companyName === 'string') {
      updates['dashboardConfig.companyName'] = companyName.trim();
    }
    if (typeof timezone === 'string' && timezone.trim()) {
      updates['dashboardConfig.timezone'] = timezone.trim();
    }

    if (Object.keys(updates).length === 0) {
      const error = new Error('No valid settings values provided');
      error.statusCode = 400;
      throw error;
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: updates },
      { new: true, runValidators: true }
    )
      .select('-password')
      .lean();

    res.status(200).json({
      success: true,
      message: 'Settings updated successfully',
      data: mapDashboardPayload(user),
    });
  } catch (error) {
    next(error);
  }
};

export const updateMyPrompts = async (req, res, next) => {
  try {
    const userId = getAuthUserId(req);
    if (!userId) {
      const error = new Error('Unauthorized');
      error.statusCode = 401;
      throw error;
    }

    const {
      feedName,
      feedActive,
      keywords,
      speciality,
      freelancer,
      minHourlyRate,
      minFixedRate,
      clientMinSpend,
      clientMinRating,
      allowNoBudget,
      excludedCountries,
      includedCountries,
      model,
      proposalPrompts,
    } = req.body || {};

    const updates = {};

    if (typeof feedName === 'string') {
      updates['dashboardConfig.feedName'] = feedName.trim() || 'Primary Feed';
    }
    if (typeof feedActive === 'boolean') {
      updates['dashboardConfig.feedActive'] = feedActive;
    }

    if (keywords !== undefined) {
      updates['jobPreferences.keywords'] = parseKeywords(keywords);
    }

    if (typeof speciality === 'string') {
      updates['dashboardConfig.speciality'] = speciality.trim();
    }
    if (typeof freelancer === 'string') {
      updates['dashboardConfig.freelancer'] = freelancer.trim();
    }

    if (minHourlyRate !== undefined) {
      updates['jobPreferences.hourlyRate'] = parseNumberOrNull(minHourlyRate);
    }
    if (minFixedRate !== undefined) {
      updates['jobPreferences.fixedRate'] = parseNumberOrNull(minFixedRate);
    }
    if (clientMinSpend !== undefined) {
      updates['dashboardConfig.clientMinSpend'] =
        parseNumberOrNull(clientMinSpend) ?? 0;
    }
    if (clientMinRating !== undefined) {
      updates['dashboardConfig.clientMinRating'] =
        parseNumberOrNull(clientMinRating) ?? 0;
    }

    if (typeof allowNoBudget === 'boolean') {
      updates['dashboardConfig.allowNoBudget'] = allowNoBudget;
    }

    if (excludedCountries !== undefined) {
      updates['dashboardConfig.excludedCountries'] =
        normalizeStringArray(excludedCountries);
    }
    if (includedCountries !== undefined) {
      updates['dashboardConfig.includedCountries'] =
        normalizeStringArray(includedCountries);
    }

    if (typeof model === 'string' && model.trim()) {
      updates['dashboardConfig.model'] = model.trim();
    }

    if (proposalPrompts !== undefined) {
      updates['dashboardConfig.proposalPrompts'] =
        sanitizePrompts(proposalPrompts);
    }

    if (Object.keys(updates).length === 0) {
      const error = new Error('No valid prompt values provided');
      error.statusCode = 400;
      throw error;
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: updates },
      { new: true, runValidators: true }
    )
      .select('-password')
      .lean();

    res.status(200).json({
      success: true,
      message: 'Prompt configuration updated successfully',
      data: mapDashboardPayload(user),
    });
  } catch (error) {
    next(error);
  }
};

export const updateMyNotificationMeta = async (req, res, next) => {
  try {
    const userId = getAuthUserId(req);
    if (!userId) {
      const error = new Error('Unauthorized');
      error.statusCode = 401;
      throw error;
    }

    const { telegramChatId } = req.body || {};
    if (typeof telegramChatId !== 'string') {
      const error = new Error('telegramChatId must be a string');
      error.statusCode = 400;
      throw error;
    }

    const user = await User.findByIdAndUpdate(
      userId,
      {
        $set: {
          'dashboardConfig.telegramChatId': telegramChatId.trim(),
        },
      },
      { new: true, runValidators: true }
    )
      .select('-password')
      .lean();

    res.status(200).json({
      success: true,
      message: 'Notification settings updated successfully',
      data: mapDashboardPayload(user),
    });
  } catch (error) {
    next(error);
  }
};
