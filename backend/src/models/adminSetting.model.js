import mongoose from 'mongoose';

const adminSettingSchema = new mongoose.Schema(
  {
    violationLimit: {
      type: Number,
      default: 3,
      min: 1,
    },
    autoSuspendEnabled: {
      type: Boolean,
      default: true,
    },
    updatedBy: {
      type: String,
      default: null,
    },
    updatedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

const AdminSetting = mongoose.model('AdminSetting', adminSettingSchema);

export default AdminSetting;
