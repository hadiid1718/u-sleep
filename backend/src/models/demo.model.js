import mongoose from 'mongoose';

const demoSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      trim: true,
      lowercase: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Please enter a valid email',
      ],
    },
    name: {
      type: String,
      trim: true,
      maxlength: [50, 'Name must be at most 50 characters long'],
    },
    company: {
      type: String,
      trim: true,
      maxlength: [100, 'Company name must be at most 100 characters long'],
    },
    phone: {
      type: String,
      trim: true,
    },
    demoDate: {
      type: Date,
      required: [true, 'Demo date is required'],
    },
    timeSlot: {
      type: String,
      required: [true, 'Time slot is required'],
      enum: {
        values: [
          '09:00 AM',
          '10:00 AM',
          '11:00 AM',
          '12:00 PM',
          '01:00 PM',
          '02:00 PM',
          '03:00 PM',
          '04:00 PM',
          '05:00 PM',
        ],
        message: 'Invalid time slot',
      },
    },
    status: {
      type: String,
      enum: ['scheduled', 'completed', 'cancelled', 'no-show'],
      default: 'scheduled',
    },
    notes: {
      type: String,
      maxlength: [500, 'Notes must be at most 500 characters long'],
    },
  },
  { timestamps: true }
);

const Demo = mongoose.model('Demo', demoSchema);

export default Demo;
