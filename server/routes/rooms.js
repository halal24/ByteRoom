const express = require('express');
const router = express.Router();
const Room = require('../models/Room');
const { protect } = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');

// @route   POST /api/rooms
// @desc    Create a new room
// @access  Private (Interviewer typically, but allowing all authenticated users for now)
router.post('/', protect, async (req, res) => {
  try {
    const { title, language } = req.body;
    
    const room = await Room.create({
      host: req.user._id,
      title: title || 'Technical Interview',
      language: language || 'javascript'
    });

    res.status(201).json(room);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/rooms/:roomId
// @desc    Get room by UUID
// @access  Private
router.get('/:roomId', protect, async (req, res) => {
  try {
    const room = await Room.findOne({ roomId: req.params.roomId }).populate('host', 'name email');
    
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }
    
    res.json(room);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PATCH /api/rooms/:roomId/evaluation
// @desc    Save evaluation scores for a room
// @access  Private
router.patch('/:roomId/evaluation', protect, async (req, res) => {
  try {
    const { problemSolving, codeQuality, communication, timeComplexity, edgeCases, notes } = req.body;
    const room = await Room.findOneAndUpdate(
      { roomId: req.params.roomId },
      {
        evaluation: { problemSolving, codeQuality, communication, timeComplexity, edgeCases, notes }
      },
      { new: true }
    );
    if (!room) return res.status(404).json({ message: 'Room not found' });
    res.json(room);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
