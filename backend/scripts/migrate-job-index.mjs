import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load env like the app does so DB_URI is available
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const backendRoot = path.resolve(__dirname, '..');
const runtimeNodeEnv = String(process.env.NODE_ENV || 'development')
  .replace(/^['"]|['"]$/g, '')
  .trim();
const envFilePath = path.resolve(backendRoot, `.env.${runtimeNodeEnv}`);
dotenv.config({ path: envFilePath });

import Job from '../src/models/job.model.js';

const DB_URI = process.env.DB_URI || process.env.MONGO_URL;

if (!DB_URI) {
  console.error(
    'No DB URI found in env (DB_URI). Set it in .env.[environment] and retry.'
  );
  process.exit(1);
}

async function run() {
  try {
    console.log('Connecting to MongoDB...');
    // Modern mongoose no longer accepts `useNewUrlParser` and `useUnifiedTopology` options.
    // Use the default connection behavior.
    await mongoose.connect(DB_URI);

    console.log('Connected. Inspecting existing indexes on jobs collection...');
    const indexes = await Job.collection.indexes();
    console.log('Existing indexes:', indexes.map(i => i.name).join(', '));

    // Find and drop any single-field platform id indexes (upworkJobId or freelancerJobId)
    const singlePlatformIndexes = indexes.filter(i => {
      if (!i.key) return false;
      const keys = Object.keys(i.key);
      return keys.length === 1 && (keys[0] === 'upworkJobId' || keys[0] === 'freelancerJobId');
    });

    for (const idx of singlePlatformIndexes) {
      console.log(`Dropping index: ${idx.name}`);
      try {
        await Job.collection.dropIndex(idx.name);
        console.log(`Dropped index ${idx.name}`);
      } catch (err) {
        console.warn('Failed to drop index:', err.message);
      }
    }

    console.log('Creating compound unique indexes for platform ids...');
    try {
      await Job.collection.createIndex({ upworkJobId: 1, userId: 1 }, { unique: true, sparse: true });
      await Job.collection.createIndex({ freelancerJobId: 1, userId: 1 }, { unique: true, sparse: true });
      console.log('Compound unique indexes created.');
    } catch (err) {
      console.error('Failed to create compound indexes:', err.message);
      process.exitCode = 2;
    }
  } catch (error) {
    console.error('Migration failed:', error);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected. Migration complete.');
  }
}

run();
