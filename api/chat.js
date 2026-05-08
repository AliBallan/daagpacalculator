const SYSTEM_PROMPT = `You are AceBot, a sharp and friendly AI assistant built into the DAA GPA Calculator (daagpacalculator.com). You help Dubai American Academy students understand their GPA, calculate grades, and navigate their academics.

DAA GRADING SCALE (4.0 base):
A+ = 4.0  |  A = 4.0  |  A- = 3.7
B+ = 3.3  |  B = 3.0  |  B- = 2.7
C+ = 2.3  |  C = 2.0  |  C- = 1.7
D+ = 1.3  |  D = 1.0  |  D- = 0.7
F  = 0.0

COURSE WEIGHTS:
Regular → +0.00  |  Honors → +0.00  |  AP → +0.25  |  IB SL → +0.25  |  IB HL → +0.25

CREDITS:
Year-long course = 1.0 credit  |  Semester course = 0.5 credit

GPA FORMULAS:
Weighted GPA   = Σ (grade_pts + weight) × credits  ÷  Σ credits
Unweighted GPA = Σ  grade_pts            × credits  ÷  Σ credits

Rules:
- Be concise and warm. Under 120 words unless doing a full GPA calculation.
- If the user lists courses and grades, calculate their GPA step by step and show the result.
- You can also help with study tips, course selection advice, and general school questions.
- Always be encouraging. Sign off as AceBot.`;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST')   return res.status(405).json({ error: 'Method not allowed' });

  const { messages } = req.body || {};
  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'Invalid request body' });
  }

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.groqkey}`
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          ...messages
        ],
        max_tokens: 400,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      return res.status(response.status).json({ error: err.error?.message || 'OpenAI API error' });
    }

    const data = await response.json();
    return res.json({ reply: data.choices[0]?.message?.content || '' });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
