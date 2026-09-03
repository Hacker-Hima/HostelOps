import mongoose from 'mongoose';

const budgetSchema = new mongoose.Schema(
  {
    id: { type: Number, default: 1, unique: true },
    total: { type: Number, default: 500000 },
    spent: { type: Number, default: 340000 },
    pending: { type: Number, default: 115000 },
  },
  { timestamps: true }
);

const budgetCategorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    spent: { type: Number, default: 0 },
    budget: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const Budget = mongoose.models.Budget || mongoose.model('Budget', budgetSchema);
export const BudgetCategory = mongoose.models.BudgetCategory || mongoose.model('BudgetCategory', budgetCategorySchema);

export default Budget;
