import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    username: { type: String, required: true, unique: true, index: true, lowercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    initials: { type: String, required: true },
    room: { type: String, default: 'Admin Suite', trim: true },
    block: { type: String, default: 'Admin Block', trim: true },
    floor: { type: String, default: 'Floor 1', trim: true },
    roll_number: { type: String, required: true, trim: true, index: true },
    email: { type: String, required: true, trim: true, lowercase: true, index: true },
    phone: { type: String, required: true, trim: true },
    role: {
      type: String,
      required: true,
      enum: ['admin', 'user', 'student', 'staff', 'technician'],
      default: 'user',
      index: true,
    },
    admin_type: {
      type: String,
      enum: ['superadmin', 'assetadmin', ''],
      default: '',
    },
    avatar_color: { type: String, default: '#7c3aed' },
    password: { type: String, required: true, select: false },
    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        delete ret.password;
        delete ret.__v;
        return ret;
      },
    },
    toObject: {
      transform(doc, ret) {
        delete ret.password;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Pre-save hook: Hash password if modified (Mongoose 8+ async style)
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

// Safe representation method
userSchema.methods.toSafeObject = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.__v;
  return obj;
};

export const User = mongoose.models.User || mongoose.model('User', userSchema);
export default User;
