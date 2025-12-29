import express from 'express';
import cors from 'cors';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import connectDB from './db/connection.js';
import { errorHandler } from './middleware/errorHandler.js';
import authRoutes from './routes/authRoutes.js';
import restaurantRoutes from './routes/restaurantRoutes.js';
import menuRoutes from './routes/menuRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import reviewRoutes from "./routes/reviewRoutes.js";
import walletRoutes from "./routes/walletRoutes.js";
import deliveryRoutes from "./routes/deliveryRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import referralRoutes from "./routes/referralRoutes.js";
import subscriptionRoutes from "./routes/subscriptionRoutes.js";
import { User } from "./models/User.js";

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env file from server directory
config({ path: join(__dirname, '.env') });

// Check for required environment variables
if (!process.env.JWT_SECRET) {
    console.error('ERROR: JWT_SECRET is not set in .env file!');
    console.error(
        'Please add JWT_SECRET to your .env file in the server directory.'
    );
    process.exit(1);
}

const PORT = process.env.PORT || 5050;
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.get('/', (req, res) => {
    res.send('Backend API is running!');
});
app.use('/api/restaurants', restaurantRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/menu', menuRoutes);

app.use('/api/orders', orderRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/wallet", walletRoutes);
app.use("/api/deliveries", deliveryRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/referrals", referralRoutes);
app.use("/api/subscriptions", subscriptionRoutes);

// Error handler middleware (must be last)
app.use(errorHandler);

const ensureSuperAdmin = async () => {
	const email = process.env.SUPER_ADMIN_EMAIL;
	const password = process.env.SUPER_ADMIN_PASSWORD;
	if (!email || !password) return;

	const name = process.env.SUPER_ADMIN_NAME || 'Super Admin';
	const phone = process.env.SUPER_ADMIN_PHONE || '0000000000';

	let admin = await User.findOne({ email }).select('+password');

	if (!admin) {
		admin = await User.create({
			name,
			email,
			phone,
			password,
			role: 'admin',
			isSuperAdmin: true,
			isActive: true,
		});
		return;
	}

	let saveNeeded = false;
	if (admin.role !== 'admin') {
		admin.role = 'admin';
		saveNeeded = true;
	}
	if (admin.isSuperAdmin !== true) {
		admin.isSuperAdmin = true;
		saveNeeded = true;
	}
	if (admin.isActive === false) {
		admin.isActive = true;
		saveNeeded = true;
	}
	if (admin.name !== name) {
		admin.name = name;
		saveNeeded = true;
	}
	if (admin.phone !== phone) {
		admin.phone = phone;
		saveNeeded = true;
	}

	const matches = await admin.comparePassword(password);
	if (!matches) {
		admin.password = password;
		saveNeeded = true;
	}

	if (saveNeeded) {
		await admin.save();
	}
};

connectDB().then(async () => {
	await ensureSuperAdmin();
    app.listen(PORT, () => {
        console.log(`Server listening on port ${PORT}`);
    });
});
