import ReviewVideo from '../models/reviewVideo.model.js';

// Upload / replace the review video (Admin only)
// When a new video is uploaded, all previous videos are deactivated
// so only the latest one is shown on the testimonial section
export const uploadReviewVideo = async (req, res, next) => {
  try {
    const {
      title,
      videoUrl,
      thumbnailUrl,
      description,
      reviewerName,
      reviewerRole,
    } = req.body;

    if (!title || !videoUrl || !reviewerName) {
      const error = new Error(
        'Title, video URL, and reviewer name are required'
      );
      error.statusCode = 400;
      throw error;
    }

    // Deactivate all existing review videos
    await ReviewVideo.updateMany({}, { isActive: false });

    // Create the new review video as the active one
    const reviewVideo = await ReviewVideo.create({
      title,
      videoUrl,
      thumbnailUrl: thumbnailUrl || '',
      description: description || '',
      reviewerName,
      reviewerRole: reviewerRole || '',
      isActive: true,
      uploadedBy: req.adminId,
    });

    res.status(201).json({
      success: true,
      message: 'Review video uploaded successfully',
      data: reviewVideo,
    });
  } catch (error) {
    next(error);
  }
};

// Get the latest active review video (Public)
export const getLatestReviewVideo = async (req, res, next) => {
  try {
    const reviewVideo = await ReviewVideo.findOne({ isActive: true })
      .sort({ createdAt: -1 })
      .lean();

    if (!reviewVideo) {
      return res.status(200).json({
        success: true,
        data: null,
        message: 'No review video available',
      });
    }

    res.status(200).json({
      success: true,
      data: reviewVideo,
    });
  } catch (error) {
    next(error);
  }
};

// Get all review videos (Admin only - for history)
export const getAllReviewVideos = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const [videos, totalCount] = await Promise.all([
      ReviewVideo.find()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('uploadedBy', 'username')
        .lean(),
      ReviewVideo.countDocuments(),
    ]);

    res.status(200).json({
      success: true,
      data: videos,
      page,
      totalPages: Math.ceil(totalCount / limit),
      totalCount,
      limit,
    });
  } catch (error) {
    next(error);
  }
};

// Delete a review video (Admin only)
export const deleteReviewVideo = async (req, res, next) => {
  try {
    const { id } = req.params;

    const video = await ReviewVideo.findByIdAndDelete(id);

    if (!video) {
      const error = new Error('Review video not found');
      error.statusCode = 404;
      throw error;
    }

    // If the deleted video was active, activate the most recent remaining one
    if (video.isActive) {
      const latestVideo = await ReviewVideo.findOne().sort({ createdAt: -1 });
      if (latestVideo) {
        latestVideo.isActive = true;
        await latestVideo.save();
      }
    }

    res.status(200).json({
      success: true,
      message: 'Review video deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// Update a review video (Admin only)
export const updateReviewVideo = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      title,
      videoUrl,
      thumbnailUrl,
      description,
      reviewerName,
      reviewerRole,
    } = req.body;

    const video = await ReviewVideo.findById(id);

    if (!video) {
      const error = new Error('Review video not found');
      error.statusCode = 404;
      throw error;
    }

    if (title) video.title = title;
    if (videoUrl) video.videoUrl = videoUrl;
    if (thumbnailUrl !== undefined) video.thumbnailUrl = thumbnailUrl;
    if (description !== undefined) video.description = description;
    if (reviewerName) video.reviewerName = reviewerName;
    if (reviewerRole !== undefined) video.reviewerRole = reviewerRole;

    await video.save();

    res.status(200).json({
      success: true,
      message: 'Review video updated successfully',
      data: video,
    });
  } catch (error) {
    next(error);
  }
};

// Set a specific video as the active one (Admin only)
export const setActiveReviewVideo = async (req, res, next) => {
  try {
    const { id } = req.params;

    const video = await ReviewVideo.findById(id);

    if (!video) {
      const error = new Error('Review video not found');
      error.statusCode = 404;
      throw error;
    }

    // Deactivate all, then activate the selected one
    await ReviewVideo.updateMany({}, { isActive: false });
    video.isActive = true;
    await video.save();

    res.status(200).json({
      success: true,
      message: 'Review video set as active successfully',
      data: video,
    });
  } catch (error) {
    next(error);
  }
};
