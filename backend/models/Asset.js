import mongoose from 'mongoose';

const assetSchema = new mongoose.Schema(
  {
    tag: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    category: { type: String, required: true },
    location: { type: String, required: true },
    condition: { type: String, required: true, default: 'Good' },
    last_checked: { type: String, required: true },
    value: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const assetMaintenanceSchema = new mongoose.Schema(
  {
    asset_tag: { type: String, required: true, index: true },
    date: { type: String, required: true },
    action: { type: String, required: true },
    actor: { type: String, required: true },
    color: { type: String, default: 'var(--accent-cyan)' },
  },
  { timestamps: true }
);

export const Asset = mongoose.models.Asset || mongoose.model('Asset', assetSchema);
export const AssetMaintenance = mongoose.models.AssetMaintenance || mongoose.model('AssetMaintenance', assetMaintenanceSchema);

export default Asset;
