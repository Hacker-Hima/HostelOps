import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    initials: { type: String, required: true },
    room: { type: String, required: true },
    block: { type: String, required: true },
    floor: { type: String, required: true },
    roll_number: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    role: { type: String, required: true, default: 'student' },
  },
  { timestamps: true }
);

export const User = mongoose.models.User || mongoose.model('User', userSchema);
export default User;
