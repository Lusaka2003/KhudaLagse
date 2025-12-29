import mongoose from 'mongoose';
import { config } from 'dotenv';
config({ path: './.env' });

const uri = process.env.ATLAS_URI || '';

const connectDB = async () => {
	try {
		await mongoose.connect(uri);
		console.log('MongoDB connected successfully with Mongoose!');
	} catch (err) {
		console.error('MongoDB connection error:', err.message);
		process.exit(1);
	}
};

export default connectDB;
