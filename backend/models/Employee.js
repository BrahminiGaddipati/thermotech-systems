import mongoose from 'mongoose';

const employeeSchema = new mongoose.Schema({
  employeeId: { type: String, unique: true },
  name: { type: String, required: true },
  designation: { type: String, required: true },
  dailyWage: { type: Number, required: true },
  phone: { type: String },
  photo: { type: String },
  joiningDate: { type: String, default: () => new Date().toISOString().split('T')[0] }
}, { timestamps: true });

export default mongoose.model('Employee', employeeSchema);
