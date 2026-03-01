import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.development.local' });

await mongoose.connect(process.env.DB_URI);

// Remove coins and coinHistory from all users
const userResult = await mongoose.connection.db
  .collection('users')
  .updateMany({}, { $unset: { coins: '', coinHistory: '' } });
console.log(
  `Users: removed coins & coinHistory from ${userResult.modifiedCount} documents`
);

// Remove coinsAwarded from all payments
const paymentResult = await mongoose.connection.db
  .collection('payments')
  .updateMany({}, { $unset: { coinsAwarded: '' } });
console.log(
  `Payments: removed coinsAwarded from ${paymentResult.modifiedCount} documents`
);

await mongoose.disconnect();
console.log('Done — database cleaned.');
