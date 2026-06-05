const express = require('express');
const router = express.Router();
const Schedule = require('../models/Schedule');
const Room = require('../models/Room');
const { protect } = require('../middleware/auth');
const sendEmail = require('../utils/sendEmail');

// Create a new scheduled interview
router.post('/', protect, async (req, res) => {
  try {
    const { title, candidateEmail, scheduledAt, duration } = req.body;

    // First, automatically generate a dedicated room for this session
    const room = await Room.create({
      host: req.user._id,
      title: title || 'Scheduled Interview',
    });

    // Create the schedule linked to that room
    const schedule = await Schedule.create({
      title,
      interviewer: req.user._id,
      candidateEmail,
      scheduledAt,
      duration,
      roomId: room.roomId // The short string ID
    });

    // Send email to candidate
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const roomLink = `${clientUrl}/room/${room.roomId}`;
    const emailSubject = `Interview Scheduled: ${title}`;
    
    // Format dates for the email
    const scheduledDateObj = new Date(scheduledAt);
    const dateOptions = { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' };
    const timeOptions = { hour: '2-digit', minute: '2-digit' };
    const formattedDate = scheduledDateObj.toLocaleDateString('en-US', dateOptions);
    const formattedTime = scheduledDateObj.toLocaleTimeString('en-US', timeOptions);

    const emailText = `Hello,\n\nYour interview "${title}" has been scheduled for ${formattedDate} at ${formattedTime}.\nDuration: ${duration} minutes.\n\nPlease join the collaborative interview room at the scheduled time using this link:\n${roomLink}\n\nInterviewer: ${req.user.name}\n\nBest,\nByteRoom Team`;
    
    const emailHtml = `
      <div style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #111111; color: #e5e7eb; padding: 40px 20px; text-align: center; min-height: 100vh; margin: 0;">
        <div style="max-width: 500px; margin: 0 auto; background-color: #0a0a0a; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.8); border: 1px solid #262626;">
          
          <!-- Header -->
          <div style="padding: 40px 20px 20px;">
            <div style="background-color: #ffffff; color: #000000; width: 48px; height: 48px; line-height: 48px; border-radius: 8px; font-size: 24px; font-weight: 800; margin: 0 auto 20px;">B</div>
            <h1 style="color: #ffffff; font-size: 24px; margin: 0; font-weight: 700;">Interview Scheduled</h1>
          </div>
          
          <!-- Body -->
          <div style="padding: 20px 40px 40px;">
            <p style="font-size: 15px; margin-bottom: 30px; color: #a3a3a3;">You've been invited to a technical interview on <span style="color: #ecc369; font-weight: 600;">ByteRoom</span>.</p>
            
            <!-- Details Box -->
            <div style="background-color: #000000; border-radius: 12px; padding: 24px; border: 1px solid #262626; margin-bottom: 30px;">
              <table style="width: 100%; text-align: left; font-size: 14px; border-collapse: separate; border-spacing: 0 16px; margin: -16px 0;">
                <tr>
                  <td style="color: #737373;">Title</td>
                  <td style="color: #ffffff; text-align: right; font-weight: 600;">${title}</td>
                </tr>
                <tr>
                  <td style="color: #737373;">Interviewer</td>
                  <td style="color: #ffffff; text-align: right; font-weight: 600;">${req.user.name}</td>
                </tr>
                <tr>
                  <td style="color: #737373;">Date</td>
                  <td style="color: #ffffff; text-align: right; font-weight: 600;">${formattedDate}</td>
                </tr>
                <tr>
                  <td style="color: #737373;">Time</td>
                  <td style="color: #ffffff; text-align: right; font-weight: 600;">${formattedTime}</td>
                </tr>
                <tr>
                  <td style="color: #737373;">Duration</td>
                  <td style="color: #ffffff; text-align: right; font-weight: 600;">${duration} minutes</td>
                </tr>
                <tr>
                  <td style="color: #737373;">Room ID</td>
                  <td style="color: #00ffcc; text-align: right; font-family: 'JetBrains Mono', monospace; font-weight: 600; letter-spacing: 0.5px;">${room.roomId}</td>
                </tr>
              </table>
            </div>

            <!-- Action Button -->
            <a href="${roomLink}" style="display: block; width: 100%; box-sizing: border-box; background-color: #00ffcc; color: #000000; text-align: center; padding: 16px; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 16px; margin-bottom: 24px; transition: background-color 0.2s;">
              Join Interview Room &rarr;
            </a>

            <!-- Footer Link -->
            <p style="font-size: 12px; color: #737373; margin: 0;">
              Or paste this link: <br/><a href="${roomLink}" style="color: #3b82f6; text-decoration: none; margin-top: 8px; display: inline-block;">${roomLink}</a>
            </p>
          </div>
        </div>
      </div>
    `;
    
    await sendEmail({
      to: candidateEmail,
      subject: emailSubject,
      text: emailText,
      html: emailHtml
    });

    res.status(201).json(schedule);
  } catch (error) {
    console.error('Schedule creation error:', error);
    res.status(500).json({ message: 'Server error creating schedule' });
  }
});

// Get all schedules for the logged in user
router.get('/', protect, async (req, res) => {
  try {
    // Fetch where user is interviewer OR user's email is the candidate email
    const schedules = await Schedule.find({
      $or: [
        { interviewer: req.user._id },
        { candidateEmail: { $regex: new RegExp(`^${req.user.email}$`, 'i') } }
      ]
    })
    .populate('interviewer', 'name email')
    .sort({ scheduledAt: 1 });

    res.json(schedules);
  } catch (error) {
    console.error('Schedule fetch error:', error);
    res.status(500).json({ message: 'Server error fetching schedules' });
  }
});

module.exports = router;
