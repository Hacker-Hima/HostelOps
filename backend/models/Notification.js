import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    message: { type: String, required: true },
    type: { type: String, default: 'info' },
    is_read: { type: Number, default: 0 },
    time: { type: String, default: 'Just now' },
  },
  { timestamps: true }
);

export const Notification = mongoose.models.Notification || mongoose.model('Notification', notificationSchema);
export default Notification;
