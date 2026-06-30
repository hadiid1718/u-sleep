import mongoose from 'mongoose';

const supportChatSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    name: { type: String, default: null }, // for guest contact submissions
    email: { type: String, default: null }, // for guest contact submissions
    sender: {
      type: String,
      enum: ['user', 'admin', 'system', 'founder', 'guest'], // added 'guest'
      required: true,
    },
    message: { type: String, required: true },
    read: { type: Boolean, default: false },
    readAt: { type: Date, default: null },
    adminId: { type: String, default: null },
    isAutoReply: { type: Boolean, default: false },
    metadata: { type: Object, default: {} },
    auditTrail: {
      createdBy: { type: String, default: null },
      editedBy: { type: String, default: null },
      editedAt: { type: Date, default: null },
      deletedBy: { type: String, default: null },
      deletedAt: { type: Date, default: null },
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const SupportChat = mongoose.model('SupportChat', supportChatSchema);

export default SupportChat;
