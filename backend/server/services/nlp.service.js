/**
 * NLP Service — Rule-based intent classification for MVP.
 *
 * Interface: classifyIntent(message, language) → { intent, confidence }
 *
 * Designed for easy replacement with Rasa, HuggingFace, or any ML backend.
 * To swap: implement the same interface, update the require() in chat.controller.js.
 */

const intentKeywords = {
  greeting: {
    en: ['hello', 'hi', 'hey', 'good morning', 'good evening', 'howdy'],
    hi: ['नमस्ते', 'हेलो', 'नमस्कार', 'सुप्रभात'],
    ur: ['السلام علیکم', 'ہیلو', 'سلام', 'صبح بخیر'],
    ks: ['السلام علیکم', 'ہیلو', 'اسلام و علیکم'],
    doi: ['नमस्ते', 'ہیلو', 'سلام', 'सुप्रभात'],
  },
  stress: {
    en: ['stress', 'stressed', 'pressure', 'overwhelmed', 'burnout', 'workload', 'exam pressure'],
    hi: ['तनाव', 'दबाव', 'बोझ', 'परीक्षा का दबाव', 'थकान'],
    ur: ['دباؤ', 'تناؤ', 'بوجھ', 'امتحان کا دباؤ', 'تھکاوٹ'],
    ks: ['تناؤ', 'دباو', 'بوجھ', 'امتحان ہند دباو'],
    doi: ['तनाव', 'दबाव', 'बोझ', 'امتحان دا دباو'],
  },
  anxiety: {
    en: ['anxiety', 'anxious', 'worried', 'panic', 'nervous', 'fear', 'scared'],
    hi: ['चिंता', 'घबराहट', 'डर', 'बेचैनी', 'पैनिक'],
    ur: ['پریشانی', 'گھبراہٹ', 'ڈر', 'بے چینی', 'پینک'],
    ks: ['پریشانی', 'گھبراہٹ', 'ڈر', 'بے چینی'],
    doi: ['گھبراہٹ', 'چنتا', 'ڈر', 'بے چینی'],
  },
  depression: {
    en: ['depressed', 'depression', 'sad', 'hopeless', 'unhappy', 'empty', 'lonely', 'alone'],
    hi: ['उदास', 'निराश', 'अकेला', 'खाली', 'अवसाद', 'दुखी'],
    ur: ['اداس', 'مایوس', 'اکیلا', 'خالی', 'ڈپریشن', 'دکھی'],
    ks: ['اداس', 'مایوس', 'اکیلہ', 'خالی', 'ڈپریشن'],
    doi: ['اداس', 'مایوس', 'اکیلا', 'ڈپریشن', 'دکھی'],
  },
  help: {
    en: ['help', 'support', 'assist', 'guide', 'what can you do', 'how can you help'],
    hi: ['मदद', 'सहायता', 'मार्गदर्शन', 'क्या कर सकते हो'],
    ur: ['مدد', 'سہارا', 'رہنمائی', 'کیا کر سکتے ہو'],
    ks: ['مدد', 'مددہ', 'رہنمائی'],
    doi: ['مدد', 'سہارا', 'رہنمائی'],
  },
  screening_request: {
    en: ['screening', 'assessment', 'test', 'phq', 'gad', 'ghq', 'check my mental health', 'evaluate'],
    hi: ['जांच', 'परीक्षण', 'मूल्यांकन', 'टेस्ट', 'मानसिक स्वास्थ्य जांच'],
    ur: ['جانچ', 'ٹیسٹ', 'تشخیص', 'ذہنی صحت کی جانچ'],
    ks: ['جانچ', 'ٹیسٹ', 'ذہنی صحت'],
    doi: ['جانچ', 'ٹیسٹ', 'ذہنی صحت دی جانچ'],
  },
};

/**
 * Classify intent from a message.
 * Priority: ML Service (/ml/classify) -> Rule-based keyword matching.
 *
 * @param {string} message
 * @param {string} language
 * @returns {Promise<{ intent: string, confidence: number, model_used?: string, translated_message?: string }>}
 */
async function classifyIntent(message, language = 'en') {
  // 1. Try FastAPI ML Service first
  const mlServiceUrl = process.env.ML_SERVICE_URL;
  if (mlServiceUrl) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000); // 3s timeout

      // Use global fetch (available in Node 18+)
      const response = await fetch(`${mlServiceUrl}/ml/classify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, language }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const mlData = await response.json();
        
        // Accept ML result if confidence is >= 0.5
        if (mlData.confidence >= 0.5) {
          return {
            intent: mlData.intent,
            confidence: mlData.confidence,
            model_used: mlData.model_used,
            translated_message: mlData.translated_message
          };
        }
      }
    } catch (err) {
      console.warn(`ML Service unreachable or failed: ${err.message}. Falling back to rule-based.`);
    }
  }

  // 2. Fallback to Rule-based Keyword Matching
  const messageLower = message.toLowerCase();
  const scores = {};

  for (const [intent, langKeywords] of Object.entries(intentKeywords)) {
    const keywords = langKeywords[language] || langKeywords['en'] || [];
    let matchCount = 0;
    for (const kw of keywords) {
      if (messageLower.includes(kw.toLowerCase())) {
        matchCount++;
      }
    }
    if (matchCount > 0) {
      scores[intent] = matchCount / keywords.length;
    }
  }

  const intents = Object.entries(scores).sort((a, b) => b[1] - a[1]);

  if (intents.length === 0) {
    return { intent: 'unknown', confidence: 0.3, model_used: 'rule-based (fallback)' };
  }

  return {
    intent: intents[0][0],
    confidence: Math.min(intents[0][1] * 2, 1.0), // Normalize to 0-1
    model_used: 'rule-based (fallback)'
  };
}

module.exports = { classifyIntent };

