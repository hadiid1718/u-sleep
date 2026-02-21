import Proposal from '../models/proposal.model.js';
import Job from '../models/job.model.js';
import User from '../models/user.model.js';
import aiService from '../services/ai.service.js';

/**
 * Generate proposal for a job
 * Asynchronous operation - returns placeholder immediately
 */
export const generateProposal = async (req, res, next) => {
    try {
        const { jobId } = req.params;
        const { aiService: preferredAIService = 'openai' } = req.body;
        const userId = req.user?.id || req.user?._id;

        if (!userId) {
            const error = new Error('User not authenticated');
            error.statusCode = 401;
            throw error;
        }

        // Get job
        const job = await Job.findById(jobId);
        if (!job) {
            const error = new Error('Job not found');
            error.statusCode = 404;
            throw error;
        }

        // Get user
        const user = await User.findById(userId);
        if (!user) {
            const error = new Error('User not found');
            error.statusCode = 404;
            throw error;
        }

        // Verify user owns this job
        if (job.userId && job.userId.toString() !== userId) {
            const error = new Error('Unauthorized');
            error.statusCode = 403;
            throw error;
        }

        // Check if proposal already exists
        let proposal = await Proposal.findOne({ jobId, userId });

        if (!proposal) {
            // Create draft proposal
            proposal = await Proposal.create({
                userId,
                jobId,
                upworkJobId: job.upworkJobId,
                content: '',
                status: 'draft',
                aiService: preferredAIService,
            });
        }

        // Generate proposal asynchronously (non-blocking)
        generateProposalAsync(proposal._id, job, user, preferredAIService)
            .catch(error => console.error('Background proposal generation error:', error));

        // Return immediately with message
        res.status(200).json({
            success: true,
            message: 'Proposal generation started...',
            data: {
                proposalId: proposal._id,
                status: 'generating',
                jobId,
            },
        });

    } catch (error) {
        next(error);
    }
};

/**
 * Generate proposal in background (non-blocking)
 */
async function generateProposalAsync(proposalId, job, user, aiService) {
    try {
        const generatedContent = await aiService.generateProposal({
            aiService,
            job: job.toObject(),
            user: user.toObject(),
        });

        // Update proposal with generated content
        await Proposal.findByIdAndUpdate(proposalId, {
            $set: {
                content: generatedContent,
                aiModel: aiService === 'gemini' ? 'gemini-2.0-flash' : 'gpt-4-turbo',
                generatedAt: new Date(),
                contentType: 'original',
            }
        });

    } catch (error) {
        console.error('Proposal generation failed:', error);
        // Update proposal status to show error
        await Proposal.findByIdAndUpdate(proposalId, {
            $set: {
                status: 'draft',
                content: `Error generating proposal: ${error.message}. Please try again.`,
            }
        });
    }
}

/**
 * Get proposal by ID
 */
export const getProposal = async (req, res, next) => {
    try {
        const { proposalId } = req.params;
        const userId = req.user?.id;

        const proposal = await Proposal.findById(proposalId)
            .populate('userId', 'name email')
            .populate('jobId');

        if (!proposal) {
            const error = new Error('Proposal not found');
            error.statusCode = 404;
            throw error;
        }

        // Verify user owns this proposal
        if (proposal.userId._id.toString() !== userId) {
            const error = new Error('Unauthorized');
            error.statusCode = 403;
            throw error;
        }

        res.status(200).json({
            success: true,
            data: proposal,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get all proposals for user
 */
export const getUserProposals = async (req, res, next) => {
    try {
        const { page = 1, limit = 10, status, sortBy = '-createdAt' } = req.query;
        const userId = req.user?.id;

        const skip = (page - 1) * limit;

        // Build filter
        const filter = { userId };
        if (status) {
            filter.status = status;
        }

        const proposals = await Proposal.find(filter)
            .populate('jobId', 'title upworkJobId budgetType budget hourlyRate')
            .sort(sortBy)
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Proposal.countDocuments(filter);

        // Calculate stats
        const stats = {
            draft: await Proposal.countDocuments({ userId, status: 'draft' }),
            sent: await Proposal.countDocuments({ userId, status: 'sent' }),
            accepted: await Proposal.countDocuments({ userId, status: 'accepted' }),
            rejected: await Proposal.countDocuments({ userId, status: 'rejected' }),
            total: total,
        };

        res.status(200).json({
            success: true,
            data: {
                proposals,
                stats,
                pagination: {
                    total,
                    page: parseInt(page),
                    limit: parseInt(limit),
                    pages: Math.ceil(total / limit),
                },
            },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Send proposal to Upwork
 */
export const sendProposal = async (req, res, next) => {
    try {
        const { proposalId } = req.params;
        const { bidAmount, estimatedDuration, deliveryDate } = req.body;
        const userId = req.user?.id;

        const proposal = await Proposal.findById(proposalId);

        if (!proposal) {
            const error = new Error('Proposal not found');
            error.statusCode = 404;
            throw error;
        }

        // Verify ownership
        if (proposal.userId.toString() !== userId) {
            const error = new Error('Unauthorized');
            error.statusCode = 403;
            throw error;
        }

        if (!proposal.content) {
            const error = new Error('Proposal content is empty. Generate proposal first.');
            error.statusCode = 400;
            throw error;
        }

        // In production, send to Upwork API here
        // For now, mark as sent and update status

        // Update proposal
        proposal.status = 'sent';
        proposal.bidAmount = bidAmount || null;
        proposal.estimatedDuration = estimatedDuration || null;
        proposal.deliveryDate = deliveryDate ? new Date(deliveryDate) : null;
        proposal.statusHistory.push({
            status: 'sent',
            timestamp: new Date(),
            notes: 'Proposal sent to client',
        });

        await proposal.save();

        // Update user stats
        await User.findByIdAndUpdate(userId, {
            $inc: { 'stats.proposalsSent': 1 }
        });

        res.status(200).json({
            success: true,
            message: 'Proposal sent successfully',
            data: proposal,
        });

    } catch (error) {
        next(error);
    }
};

/**
 * Update proposal status
 */
export const updateProposalStatus = async (req, res, next) => {
    try {
        const { proposalId } = req.params;
        const { status, notes = '' } = req.body;
        const userId = req.user?.id;

        const validStatuses = ['draft', 'sent', 'received', 'viewed', 'accepted', 'rejected', 'withdrawn'];

        if (!validStatuses.includes(status)) {
            const error = new Error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
            error.statusCode = 400;
            throw error;
        }

        const proposal = await Proposal.findById(proposalId);

        if (!proposal) {
            const error = new Error('Proposal not found');
            error.statusCode = 404;
            throw error;
        }

        // Verify ownership
        if (proposal.userId.toString() !== userId) {
            const error = new Error('Unauthorized');
            error.statusCode = 403;
            throw error;
        }

        const oldStatus = proposal.status;
        proposal.status = status;

        // Add to status history
        proposal.statusHistory.push({
            status,
            timestamp: new Date(),
            notes,
        });

        // Update user stats based on status change
        const statUpdates = {};
        if (oldStatus !== 'accepted' && status === 'accepted') {
            statUpdates['stats.proposalsAccepted'] = 1;
        } else if (oldStatus !== 'rejected' && status === 'rejected') {
            statUpdates['stats.proposalsRejected'] = 1;
        }

        await proposal.save();

        if (Object.keys(statUpdates).length > 0) {
            await User.findByIdAndUpdate(userId, { $inc: statUpdates });
        }

        res.status(200).json({
            success: true,
            message: `Proposal status updated to ${status}`,
            data: proposal,
        });

    } catch (error) {
        next(error);
    }
};

/**
 * Upgrade proposal with case study
 */
export const upgradeProposal = async (req, res, next) => {
    try {
        const { proposalId } = req.params;
        const { caseStudy } = req.body;
        const userId = req.user?.id;

        if (!caseStudy || caseStudy.trim() === '') {
            const error = new Error('Case study is required');
            error.statusCode = 400;
            throw error;
        }

        const proposal = await Proposal.findById(proposalId);

        if (!proposal) {
            const error = new Error('Proposal not found');
            error.statusCode = 404;
            throw error;
        }

        // Verify ownership
        if (proposal.userId.toString() !== userId) {
            const error = new Error('Unauthorized');
            error.statusCode = 403;
            throw error;
        }

        if (!proposal.content) {
            const error = new Error('No proposal content to upgrade');
            error.statusCode = 400;
            throw error;
        }

        // Get job for context
        const job = await Job.findById(proposal.jobId);
        const user = await User.findById(userId);

        // Upgrade proposal asynchronously
        upgradeProposalAsync(proposalId, proposal, job, user, caseStudy)
            .catch(error => console.error('Proposal upgrade error:', error));

        res.status(200).json({
            success: true,
            message: 'Proposal upgrade started...',
            data: {
                proposalId,
                status: 'upgrading',
            },
        });

    } catch (error) {
        next(error);
    }
};

/**
 * Upgrade proposal in background
 */
async function upgradeProposalAsync(proposalId, proposal, job, user, caseStudyText) {
    try {
        const upgradedContent = await aiService.upgradeProposalWithCaseStudy(
            proposal.content,
            job.toObject(),
            user.toObject(),
            caseStudyText,
            proposal.aiService
        );

        // Update proposal
        await Proposal.findByIdAndUpdate(proposalId, {
            $set: {
                content: upgradedContent,
                contentType: 'upgraded_with_case_study',
                caseStudy: {
                    description: caseStudyText,
                },
                status: proposal.status, // Keep current status
            }
        });

    } catch (error) {
        console.error('Proposal upgrade failed:', error);
        await Proposal.findByIdAndUpdate(proposalId, {
            $set: {
                status: 'draft',
            }
        });
    }
}

/**
 * Copy proposal content
 */
export const copyProposal = async (req, res, next) => {
    try {
        const { proposalId } = req.params;
        const userId = req.user?.id;

        const proposal = await Proposal.findById(proposalId);

        if (!proposal) {
            const error = new Error('Proposal not found');
            error.statusCode = 404;
            throw error;
        }

        // Verify ownership
        if (proposal.userId.toString() !== userId) {
            const error = new Error('Unauthorized');
            error.statusCode = 403;
            throw error;
        }

        res.status(200).json({
            success: true,
            message: 'Proposal copied to clipboard',
            data: {
                content: proposal.content,
            },
        });

    } catch (error) {
        next(error);
    }
};

/**
 * Rate proposal quality
 */
export const rateProposal = async (req, res, next) => {
    try {
        const { proposalId } = req.params;
        const { rating, feedback } = req.body;
        const userId = req.user?.id;

        if (!rating || rating < 1 || rating > 5) {
            const error = new Error('Rating must be between 1 and 5');
            error.statusCode = 400;
            throw error;
        }

        const proposal = await Proposal.findByIdAndUpdate(
            proposalId,
            {
                $set: {
                    userRating: rating,
                    userFeedback: feedback || '',
                }
            },
            { new: true }
        );

        if (!proposal) {
            const error = new Error('Proposal not found');
            error.statusCode = 404;
            throw error;
        }

        res.status(200).json({
            success: true,
            message: 'Proposal rated successfully',
            data: proposal,
        });

    } catch (error) {
        next(error);
    }
};

/**
 * Delete proposal
 */
export const deleteProposal = async (req, res, next) => {
    try {
        const { proposalId } = req.params;
        const userId = req.user?.id;

        const proposal = await Proposal.findById(proposalId);

        if (!proposal) {
            const error = new Error('Proposal not found');
            error.statusCode = 404;
            throw error;
        }

        // Verify ownership
        if (proposal.userId.toString() !== userId) {
            const error = new Error('Unauthorized');
            error.statusCode = 403;
            throw error;
        }

        await Proposal.findByIdAndDelete(proposalId);

        res.status(200).json({
            success: true,
            message: 'Proposal deleted successfully',
        });

    } catch (error) {
        next(error);
    }
};

/**
 * Get proposal stats for user
 */
export const getProposalStats = async (req, res, next) => {
    try {
        const userId = req.user?.id;

        const stats = {
            total: await Proposal.countDocuments({ userId }),
            draft: await Proposal.countDocuments({ userId, status: 'draft' }),
            sent: await Proposal.countDocuments({ userId, status: 'sent' }),
            received: await Proposal.countDocuments({ userId, status: 'received' }),
            viewed: await Proposal.countDocuments({ userId, status: 'viewed' }),
            accepted: await Proposal.countDocuments({ userId, status: 'accepted' }),
            rejected: await Proposal.countDocuments({ userId, status: 'rejected' }),
            withdrawn: await Proposal.countDocuments({ userId, status: 'withdrawn' }),
        };

        const acceptanceRate = stats.sent > 0 ?
            ((stats.accepted / stats.sent) * 100).toFixed(2) : 0;

        res.status(200).json({
            success: true,
            data: {
                stats,
                acceptanceRate: `${acceptanceRate}%`,
            },
        });

    } catch (error) {
        next(error);
    }
};
