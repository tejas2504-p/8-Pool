import mongoose from 'mongoose';
import { User } from '../server/src/models/User';

async function check() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/8-pool';
  console.log('Connecting to:', uri);
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 2000 });
    console.log('Connected!');
    const users = await User.find({});
    console.log('Users in DB:', users.map(u => ({ username: u.username, email: u.email })));
  } catch (err: any) {
    console.error('Error connecting/querying database:', err.message);
  } finally {
    await mongoose.disconnect();
  }
}

check();
