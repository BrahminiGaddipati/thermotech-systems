import mongoose from 'mongoose';

const ledgerSchema = new mongoose.Schema({
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true, index: true },
  date: { type: String, required: true, index: true },
  amount: { type: Number, default: 0 },
  hours: { type: Number, default: 0 },
  type: { type: String, enum: ['advance', 'overtime'], required: true },
  note: String
}, { timestamps: true });

export default mongoose.model('Ledger', ledgerSchema);
