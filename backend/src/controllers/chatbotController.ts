import { Request, Response } from 'express';
import { GoogleGenAI } from '@google/genai';

// Initialize the Gemini client
// Note: This requires GEMINI_API_KEY in the .env file
const ai = new GoogleGenAI({});

// System instructions to ensure the bot acts appropriately as a student counselor
const SYSTEM_INSTRUCTION = `You are Neo, an empathetic, supportive AI assistant for university students in India. 
Your goal is to provide a safe space for students to express their feelings, offer grounding exercises, and suggest study or stress-management tips.
You must be culturally aware of the Indian higher education context (e.g. pressure from exams like JEE/NEET/University boards, family expectations, placement stress).

CRITICAL SAFETY RULES:
1. You are NOT a licensed medical professional, doctor, or therapist. Do not attempt to diagnose mental health conditions.
2. If a user explicitly mentions self-harm, suicide, severe depression, or wanting to end their life, you MUST gently but firmly encourage them to reach out to a professional or helpline. Provide the Indian national helpline (KIRAN: 1800-599-0019) or suggest speaking to a campus counselor.
3. Keep responses concise, warm, and conversational. Do not output massive walls of text unless explicitly asked for a detailed guide.`;

/**
 * Handle incoming chat messages and stream/return Gemini response
 */
export const handleChatMessage = async (req: Request, res: Response): Promise<void> => {
  try {
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages)) {
      res.status(400).json({ success: false, message: 'Invalid messages format' });
      return;
    }

    // Verify API key is present
    if (!process.env.GEMINI_API_KEY) {
      console.warn('GEMINI_API_KEY is missing. Falling back to mock response.');
      return sendMockResponse(res);
    }

    // Format messages for Gemini API
    // Gemini expects { role: 'user' | 'model', parts: [{ text: string }] }
    // The frontend sends { text: string, isBot: boolean }
    const history = messages.map((msg: any) => ({
      role: msg.isBot ? 'model' : 'user',
      parts: [{ text: msg.text }]
    }));

    // Generate response using gemini-2.5-flash for speed and cost-effectiveness
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: history,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.7,
      }
    });

    const replyText = response.text || "I'm sorry, I couldn't process that right now.";

    res.json({
      success: true,
      message: {
        text: replyText,
        isBot: true,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Gemini API Error:', error);
    
    // Fallback to mock if API fails (e.g. rate limit, network issue)
    sendMockResponse(res);
  }
};

/**
 * Fallback mechanism if the API key is missing or the API call fails
 */
function sendMockResponse(res: Response) {
  const responses = [
    "I hear you. Balancing academics and personal life can be really tough. Have you tried taking a 5-minute breather?",
    "That sounds challenging. Remember, it's okay to ask for help when you need it. Would you like to check our resources section?",
    "I'm sorry you're feeling this way. Sometimes breaking a large task into smaller 20-minute chunks can make it feel less overwhelming."
  ];
  
  const randomResponse = responses[Math.floor(Math.random() * responses.length)];
  
  res.json({
    success: true,
    message: {
      text: `[Mock Mode] ${randomResponse}`,
      isBot: true,
      timestamp: new Date().toISOString()
    }
  });
}
