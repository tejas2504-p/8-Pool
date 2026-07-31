import mongoose from 'mongoose';
import path from 'path';
import fs from 'fs';

/**
 * Establishes a connection to MongoDB using the configured MONGODB_URI env variable.
 */
export const connectDB = async (): Promise<void> => {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/8-pool';
  try {
    const conn = await mongoose.connect(uri, { serverSelectionTimeoutMS: 2000 });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error: any) {
    console.warn(`⚠️ Local MongoDB connection failed or timed out: ${error.message}`);
    
    if (process.env.NODE_ENV !== 'production') {
      console.log('Starting MongoMemoryServer with persistence for local development fallback...');
      try {
        const { MongoMemoryServer } = await import('mongodb-memory-server');
        
        const baseDir = process.cwd().endsWith('server') ? process.cwd() : path.join(process.cwd(), 'server');
        const dbPath = path.resolve(baseDir, 'db_fallback');
        if (!fs.existsSync(dbPath)) {
          fs.mkdirSync(dbPath, { recursive: true });
        }

        const mongoServer = await MongoMemoryServer.create({
          instance: {
            dbPath,
            storageEngine: 'wiredTiger',
          },
        });
        const memoryUri = mongoServer.getUri();
        const conn = await mongoose.connect(memoryUri);
        console.log(`✅ Connected to persistent in-memory MongoDB successfully at: ${memoryUri}`);
      } catch (memError: any) {
        console.error(`❌ Failed to start MongoMemoryServer fallback: ${memError.message}`);
        process.exit(1);
      }
    } else {
      process.exit(1);
    }
  }
};
