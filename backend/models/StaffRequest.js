import mongoose from 'mongoose';

const staffRequestSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    title: { type: String, required: true },
    dept: { type: String, required: true },
    cost: { type: Number, required: true, default: 0 },
    status: { type: String, required: true, default: 'Pending Res. Warden' },
    time: { type: String, default: 'Submitted today' },
    submitted_by: { type: String, required: true },
    urgency: { type: String, default: 'Normal' },
    note: { type: String, default: '' },
  },
  { timestamps: true }
);

export const StaffRequest = mongoose.models.StaffRequest || mongoose.model('StaffRequest', staffRequestSchema);
export default StaffRequest;
