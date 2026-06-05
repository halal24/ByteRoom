const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');

// Language ID map for Judge0 CE
const LANGUAGE_MAP = {
  'javascript': 63,
  'typescript': 74,
  'python': 71,
  'cpp': 54,
  'java': 62,
  'go': 95,
};

router.post('/', protect, async (req, res) => {
  try {
    const { code, language } = req.body;

    if (!code || !language) {
      return res.status(400).json({ message: 'Code and language are required' });
    }

    const languageId = LANGUAGE_MAP[language.toLowerCase()];
    if (!languageId) {
      return res.status(400).json({ message: 'Unsupported language' });
    }

    const apiKey = process.env.JUDGE0_API_KEY;
    const apiUrl = process.env.JUDGE0_URL || 'https://judge0-ce.p.rapidapi.com';

    if (!apiKey) {
       // Return mock data for testing if no key is present, to prevent breaking the flow
       return res.json({
          stdout: "Mock execution successful!\nPlease add JUDGE0_API_KEY to server/.env to enable real execution.",
          stderr: "",
          time: "0.012",
          status: { description: "Accepted" }
       });
    }

    // 1. Submit code
    let result;
    try {
      const submitResponse = await fetch(`${apiUrl}/submissions?base64_encoded=false&wait=true`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'Content-Type': 'application/json',
          'X-RapidAPI-Key': apiKey,
          'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com'
        },
        body: JSON.stringify({
          source_code: code,
          language_id: languageId,
        })
      });

      if (!submitResponse.ok) {
        const errorText = await submitResponse.text();
        throw new Error(`Judge0 API error: ${submitResponse.status} ${errorText}`);
      }

      result = await submitResponse.json();
    } catch (fetchError) {
      console.error('Judge0 Fetch Error:', fetchError.message);
      // Graceful fallback for network issues or API failures
      return res.json({
        stdout: "",
        stderr: `Execution failed due to network or API error.\n\nDetails: ${fetchError.message}\n\nPlease ensure your machine has internet access and your Judge0 RapidAPI subscription is active.`,
        time: "0",
        status: { description: "Network Error" }
      });
    }

    // The result from wait=true contains the final execution state
    res.json({
      stdout: result.stdout || '',
      stderr: result.stderr || result.compile_output || '',
      time: result.time,
      status: result.status
    });

  } catch (error) {
    console.error('Execution error:', error);
    res.status(500).json({ message: 'Error executing code', error: error.message });
  }
});

module.exports = router;
