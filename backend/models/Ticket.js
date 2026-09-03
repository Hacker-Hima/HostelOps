import mongoose from 'mongoose';

const ticketSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    title: { type: String, required: true },
    student: { type: String, required: true },
    room: { type: String, required: true },
    category: { type: String, required: true },
    priority: { type: String, required: true, enum: ['Low', 'Medium', 'High'] },
    status: { type: String, required: true, default: 'Pending' },
    assigned_worker: { type: String, default: 'Unassigned' },
    asset_tag: { type: String, default: '' },
    created_at: { type: String, default: 'Just now' },
    creator_role: { type: String, default: 'Student' },
    description: { type: String, default: '' },
  },
  { timestamps: true }
);

const commentSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    ticket_id: { type: String, required: true, index: true },
    author: { type: String, required: true },
    role: { type: String, required: true },
    text: { type: String, required: true },
    time: { type: String, required: true },
    created_timestamp: { type: Number, default: Date.now },
  },
  { timestamps: true }
);

const ratingSchema = new mongoose.Schema(
  {
    ticket_id: { type: String, required: true, unique: true, index: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    created_timestamp: { type: Number, default: Date.now },
  },
  { timestamps: true }
);

export const Ticket = mongoose.models.Ticket || mongoose.model('Ticket', ticketSchema);
export const TicketComment = mongoose.models.TicketComment || mongoose.model('TicketComment', commentSchema);
export const TicketRating = mongoose.models.TicketRating || mongoose.model('TicketRating', ratingSchema);

export default Ticket;
