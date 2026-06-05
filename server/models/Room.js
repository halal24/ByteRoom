const mongoose = require('mongoose');
const generateShortId = () => {
  // Generates something like 'a7x-9b2-c4m'
  const str = Math.random().toString(36).substring(2, 11);
  return `${str.slice(0,3)}-${str.slice(3,6)}-${str.slice(6,9)}`;
};

const roomSchema = new mongoose.Schema({
  roomId: {
    type: String,
    required: true,
    unique: true,
    default: generateShortId,
  },
  host: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  title: {
    type: String,
    default: 'Technical Interview',
  },
  language: {
    type: String,
    default: 'javascript',
  },
  status: {
    type: String,
    enum: ['active', 'completed'],
    default: 'active',
  },
  evaluation: {
    problemSolving: { type: Number, default: 0 },
    codeQuality: { type: Number, default: 0 },
    communication: { type: Number, default: 0 },
    timeComplexity: { type: Number, default: 0 },
    edgeCases: { type: Number, default: 0 },
    notes: { type: String, default: '' },
  }
}, { timestamps: true });

module.exports = mongoose.model('Room', roomSchema);
