
import mongoose from 'mongoose';

const { Schema } = mongoose;

const ReferralSchema = new Schema(
	{
		referrer: { type: Schema.Types.ObjectId, ref: 'User', required: true },
		referredUser: {
			type: Schema.Types.ObjectId,
			ref: 'User',
			required: true,
			unique: true,
		},
		codeUsed: { type: String, required: true },
		status: {
			type: String,
			enum: ['pending', 'rewarded', 'cancelled'],
			default: 'pending',
		},
		rewardAmount: { type: Number, default: 0 },
		rewardedAt: { type: Date },
	},
	{ timestamps: true }
);

const Referral = mongoose.model('Referral', ReferralSchema);

export default Referral;
