import TermsAndConditions from '../models/termsAndConditions.model.js';
import User from '../models/user.model.js';

/**
 * Get active Terms and Conditions
 */
export const getActiveTerms = async (req, res) => {
  try {
    const terms = await TermsAndConditions.findOne({ isActive: true });

    if (!terms) {
      return res.status(404).json({
        success: false,
        message: 'No active terms and conditions found',
      });
    }

    res.status(200).json({
      success: true,
      terms,
    });
  } catch (error) {
    console.error('Error fetching terms:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching terms',
      error: error.message,
    });
  }
};

/**
 * Get Terms and Conditions by version
 */
export const getTermsByVersion = async (req, res) => {
  try {
    const { version } = req.params;

    const terms = await TermsAndConditions.findOne({ version });

    if (!terms) {
      return res.status(404).json({
        success: false,
        message: 'Terms version not found',
      });
    }

    res.status(200).json({
      success: true,
      terms,
    });
  } catch (error) {
    console.error('Error fetching terms:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching terms',
      error: error.message,
    });
  }
};

/**
 * Accept Terms and Conditions (User)
 */
export const acceptTerms = async (req, res) => {
  try {
    const userId = req.user._id;
    const { version } = req.body;

    const activeTerms = await TermsAndConditions.findOne({ isActive: true });

    if (!activeTerms) {
      return res.status(400).json({
        success: false,
        message: 'No active terms and conditions found',
      });
    }

    // Verify version matches active terms
    if (version && version !== activeTerms.version) {
      return res.status(400).json({
        success: false,
        message: 'Invalid terms version',
      });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      {
        termsAccepted: true,
        termsVersion: activeTerms.version,
        termsAcceptedAt: new Date(),
      },
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: 'Terms accepted successfully',
      user: {
        _id: user._id,
        email: user.email,
        termsAccepted: user.termsAccepted,
        termsVersion: user.termsVersion,
        termsAcceptedAt: user.termsAcceptedAt,
      },
    });
  } catch (error) {
    console.error('Error accepting terms:', error);
    res.status(500).json({
      success: false,
      message: 'Error accepting terms',
      error: error.message,
    });
  }
};

/**
 * Check if user has accepted latest terms
 */
export const checkTermsAcceptance = async (req, res) => {
  try {
    const userId = req.user._id;

    const user = await User.findById(userId);
    const activeTerms = await TermsAndConditions.findOne({ isActive: true });

    if (!activeTerms) {
      return res.status(200).json({
        success: true,
        hasAccepted: true,
        needsAcceptance: false,
        reason: 'No active terms',
      });
    }

    const hasAccepted =
      user.termsAccepted && user.termsVersion === activeTerms.version;

    res.status(200).json({
      success: true,
      hasAccepted,
      needsAcceptance: !hasAccepted,
      currentVersion: activeTerms.version,
      userVersion: user.termsVersion,
      termsAcceptedAt: user.termsAcceptedAt,
    });
  } catch (error) {
    console.error('Error checking terms acceptance:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking terms',
      error: error.message,
    });
  }
};

/**
 * [ADMIN] Create or Update Terms and Conditions
 */
export const createUpdateTerms = async (req, res) => {
  try {
    const {
      version,
      title,
      content,
      violationRules,
      suspensionPolicy,
      isActive,
    } = req.body;

    if (!version || !title || !content) {
      return res.status(400).json({
        success: false,
        message: 'Version, title, and content are required',
      });
    }

    // If setting as active, deactivate all others
    if (isActive) {
      await TermsAndConditions.updateMany(
        { isActive: true },
        { isActive: false }
      );
    }

    const existingTerms = await TermsAndConditions.findOne({ version });

    let terms;
    if (existingTerms) {
      // Update existing
      terms = await TermsAndConditions.findByIdAndUpdate(
        existingTerms._id,
        {
          title,
          content,
          violationRules: violationRules || existingTerms.violationRules,
          suspensionPolicy: suspensionPolicy || existingTerms.suspensionPolicy,
          isActive: isActive !== undefined ? isActive : existingTerms.isActive,
          lastUpdatedBy: String(req.user._id),
        },
        { new: true }
      );
    } else {
      // Create new
      terms = await TermsAndConditions.create({
        version,
        title,
        content,
        violationRules: violationRules || [],
        suspensionPolicy: suspensionPolicy || {
          warningThreshold: 1,
          suspensionThreshold: 3,
          warningCount: 2,
          suspensionDuration: 7,
        },
        isActive: isActive !== undefined ? isActive : false,
        createdBy: 'admin',
        lastUpdatedBy: String(req.user._id),
      });
    }

    res.status(201).json({
      success: true,
      message: existingTerms
        ? 'Terms updated successfully'
        : 'Terms created successfully',
      terms,
    });
  } catch (error) {
    console.error('Error creating/updating terms:', error);
    res.status(500).json({
      success: false,
      message: 'Error managing terms',
      error: error.message,
    });
  }
};

/**
 * [ADMIN] Get all Terms and Conditions versions
 */
export const getAllTermsVersions = async (req, res) => {
  try {
    const terms = await TermsAndConditions.find().sort({ version: -1 });

    res.status(200).json({
      success: true,
      terms,
      count: terms.length,
    });
  } catch (error) {
    console.error('Error fetching terms versions:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching terms',
      error: error.message,
    });
  }
};

/**
 * [ADMIN] Add violation rule
 */
export const addViolationRule = async (req, res) => {
  try {
    const { version } = req.params;
    const { ruleId, ruleName, description, severity } = req.body;

    if (!ruleId || !ruleName || !description) {
      return res.status(400).json({
        success: false,
        message: 'Rule ID, name, and description are required',
      });
    }

    const terms = await TermsAndConditions.findOne({ version });

    if (!terms) {
      return res.status(404).json({
        success: false,
        message: 'Terms version not found',
      });
    }

    // Check if rule already exists
    const ruleExists = terms.violationRules.some(r => r.ruleId === ruleId);
    if (ruleExists) {
      return res.status(400).json({
        success: false,
        message: 'Rule already exists',
      });
    }

    terms.violationRules.push({
      ruleId,
      ruleName,
      description,
      severity: severity || 'medium',
    });

    await terms.save();

    res.status(200).json({
      success: true,
      message: 'Violation rule added successfully',
      terms,
    });
  } catch (error) {
    console.error('Error adding violation rule:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding rule',
      error: error.message,
    });
  }
};
