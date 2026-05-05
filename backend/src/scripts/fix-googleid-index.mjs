import mongoose from 'mongoose';
import connectToDatabase from '../config/db.js';
import User from '../models/user.model.js';

const fixGoogleIdIndex = async () => {
  try {
    await connectToDatabase();

    const result = await User.updateMany(
      { googleId: null },
      { $unset: { googleId: '' } }
    );

    console.log(
      `Users: removed googleId=null from ${result.modifiedCount} documents`
    );

    const indexes = await User.collection.indexes();
    const googleIndex = indexes.find(index => index.name === 'googleId_1');

    if (googleIndex) {
      await User.collection.dropIndex('googleId_1');
      console.log('Dropped index googleId_1');
    }

    await User.collection.createIndex(
      { googleId: 1 },
      { unique: true, sparse: true }
    );
    console.log('Created index googleId_1 with unique + sparse');
  } catch (error) {
    console.error('Failed to fix googleId index:', error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
};

fixGoogleIdIndex();
