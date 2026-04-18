import mongoose from 'mongoose';

const reviewVideoSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Video title is required'],
      trim: true,
      maxlength: [150, 'Title must be at most 150 characters long'],
    },
    videoUrl: {
      type: String,
      required: [true, 'Video URL is required'],
      trim: true,
    },
    thumbnailUrl: {
      type: String,
      trim: true,
      default: '',
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description must be at most 500 characters long'],
      default: '',
    },
    reviewerName: {
      type: String,
      required: [true, 'Reviewer name is required'],
      trim: true,
      maxlength: [100, 'Reviewer name must be at most 100 characters long'],
    },
    reviewerRole: {
      type: String,
      trim: true,
      maxlength: [100, 'Reviewer role must be at most 100 characters long'],
      default: '',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

const ReviewVideo = mongoose.model('ReviewVideo', reviewVideoSchema);

export default ReviewVideo;
