import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from './models/User.js';

dotenv.config();

async function seedRestaurants() {
	try {
		const uri = process.env.ATLAS_URI;
		if (!uri) throw new Error('ATLAS_URI is missing in .env');

		await mongoose.connect(uri);
		console.log('🌿 Connected to MongoDB Atlas');

		// Clear old restaurants
		await User.deleteMany({ role: 'restaurant' });
		console.log('🗑 Cleared previous restaurant documents');

		const restaurantData = [
			{
				restaurantName: 'Kacchi Bhai',
				location: {
					address: 'Banani 11',
					area: 'Banani',
					city: 'Dhaka',
				},
				cuisineTypes: ['Kacchi', 'Deshi'],
			},
			{
				restaurantName: 'Herfy Bangladesh',
				location: {
					address: 'Gulshan 1',
					area: 'Gulshan',
					city: 'Dhaka',
				},
				cuisineTypes: ['Fast Food', 'Burgers'],
			},
			{
				restaurantName: 'Star Kabab & Restaurant',
				location: {
					address: 'Dhanmondi 27',
					area: 'Dhanmondi',
					city: 'Dhaka',
				},
				cuisineTypes: ['Kabab', 'Deshi'],
			},
			{
				restaurantName: 'Panshi Restaurant',
				location: {
					address: 'Zindabazar',
					area: 'Zindabazar',
					city: 'Sylhet',
				},
				cuisineTypes: ['Sylheti', 'Deshi'],
			},
			{
				restaurantName: 'Haandi',
				location: {
					address: 'Dampara',
					area: 'Dampara',
					city: 'Chattogram',
				},
				cuisineTypes: ['Indian', 'Deshi'],
			},
			{
				restaurantName: 'Bamboo Shoot',
				location: {
					address: 'Bir Uttam Mir Shawkat Sarak',
					area: 'Gulshan',
					city: 'Dhaka',
				},
				cuisineTypes: ['Chinese', 'Thai'],
			},
			{
				restaurantName: 'Pitstop Bangladesh',
				location: {
					address: 'Chowkbazar',
					area: 'Chowkbazar',
					city: 'Chattogram',
				},
				cuisineTypes: ['Fast Food'],
			},
			{
				restaurantName: "Sultan's Dine",
				location: {
					address: 'Bashundhara R/A',
					area: 'Bashundhara',
					city: 'Dhaka',
				},
				cuisineTypes: ['Kacchi'],
			},
			{
				restaurantName: 'Chillox',
				location: {
					address: 'Mirpur 1',
					area: 'Mirpur',
					city: 'Dhaka',
				},
				cuisineTypes: ['Burgers', 'Fast Food'],
			},
			{
				restaurantName: 'Kutumbari Restaurant',
				location: {
					address: 'Rajarhat',
					area: 'Rajarhat',
					city: 'Rangpur',
				},
				cuisineTypes: ['Deshi', 'North Bengal'],
			},
		];

		const dataWithUserFields = restaurantData.map((r, index) => ({
			...r,
			name: r.restaurantName,
			phone: `01700000${index}`,
			email: `${r.restaurantName
				.toLowerCase()
				.replace(/\s+/g, '')}@example.com`,
			password: 'password123',
			role: 'restaurant',
		}));

		await User.insertMany(dataWithUserFields);
		console.log('✅ Inserted 10 restaurant dummy records');

		process.exit(0);
	} catch (err) {
		console.error('❌ Error seeding restaurants:', err);
		process.exit(1);
	}
}

seedRestaurants();
