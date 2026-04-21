import mongoose from 'mongoose';

const attendanceSchema = new mongoose.Schema({
  date: { type: String, required: true, index: true },
  attendance: {
    type: Map,
    of: String // employeeId: 'present' | 'half' | 'absent'
  }
}, { timestamps: true });

export default mongoose.model('Attendance', attendanceSchema);
