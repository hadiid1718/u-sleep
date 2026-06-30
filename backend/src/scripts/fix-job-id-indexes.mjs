import mongoose from 'mongoose';
import connectToDatabase from '../config/db.js';
import Job from '../models/job.model.js';

const INDEXES_TO_DROP = [
  'upworkJobId_1_userId_1',
  'freelancerJobId_1_userId_1',
];

const fixJobIdIndexes = async () => {
  try {
    await connectToDatabase();

    const unsetUpwork = await Job.updateMany(
      { upworkJobId: { $in: [null, ''] } },
      { $unset: { upworkJobId: '' } }
    );
    const unsetFreelancer = await Job.updateMany(
      { freelancerJobId: { $in: [null, ''] } },
      { $unset: { freelancerJobId: '' } }
    );

    console.log(
      `Jobs: removed upworkJobId from ${unsetUpwork.modifiedCount} documents`
    );
    console.log(
      `Jobs: removed freelancerJobId from ${unsetFreelancer.modifiedCount} documents`
    );

    const indexes = await Job.collection.indexes();
    for (const indexName of INDEXES_TO_DROP) {
      const exists = indexes.some(index => index.name === indexName);
      if (exists) {
        await Job.collection.dropIndex(indexName);
        console.log(`Dropped index ${indexName}`);
      }
    }

    await Job.collection.createIndex(
      { upworkJobId: 1, userId: 1 },
      {
        unique: true,
        partialFilterExpression: { upworkJobId: { $type: 'string', $ne: '' } },
      }
    );
    console.log('Created index upworkJobId_1_userId_1 (unique + partial)');

    await Job.collection.createIndex(
      { freelancerJobId: 1, userId: 1 },
      {
        unique: true,
        partialFilterExpression: {
          freelancerJobId: { $type: 'string', $ne: '' },
        },
      }
    );
    console.log('Created index freelancerJobId_1_userId_1 (unique + partial)');
  } catch (error) {
    console.error('Failed to fix job id indexes:', error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
};

fixJobIdIndexes();
