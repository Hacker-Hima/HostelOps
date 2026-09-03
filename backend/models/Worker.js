import mongoose from 'mongoose';

const workerSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true, index: true },
    skill: { type: String, required: true },
    phone: { type: String, required: true },
    availability: { type: String, required: true, default: 'Available' },
    jobs: { type: Number, default: 0 },
    rating: { type: Number, default: 5.0 },
    completed_jobs: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const Worker = mongoose.models.Worker || mongoose.model('Worker', workerSchema);
export default Worker;
