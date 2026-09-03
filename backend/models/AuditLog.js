import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    action: { type: String, required: true },
    actor: { type: String, required: true },
    target: { type: String, required: true },
    timestamp: { type: String, required: true },
    category: { type: String, required: true },
  },
  { timestamps: true }
);

export const AuditLog = mongoose.models.AuditLog || mongoose.model('AuditLog', auditLogSchema);
export default AuditLog;
