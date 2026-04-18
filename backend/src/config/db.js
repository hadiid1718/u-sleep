import mongoose from 'mongoose';
import { DB_URI, NODE_ENV } from './env.js';

if (!DB_URI) {
  throw new Error('DB_URI is not defined in the current environment file');
}

const connectDB = async () => {
  try {
    await mongoose.connect(DB_URI);
    console.log(`Connected to MongoDB in ${NODE_ENV} environment`);
  } catch (error) {
    console.log('Error connecting to MongoDB', error);
    process.exit(1);
  }
};

export default connectDB;
