import mongoose from 'mongoose';

const supportChatSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    sender: { type: String, enum: ['user', 'admin', 'system', 'founder'], required: true },
    message: { type: String, required: true },
    read: { type: Boolean, default: false },
    readAt: { type: Date, default: null },
    adminId: { type: String, default: null }, // ID of admin who replied
    isAutoReply: { type: Boolean, default: false }, // Mark auto-replies
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
