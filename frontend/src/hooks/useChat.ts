import { useState, useEffect, useCallback, useRef } from 'react';
import {
  ChatMessage,
  Language,
  Helpline,
  ScreeningType,
  ScreeningStartResponse,
  ScreeningAnswerResponse,
} from '../types';
import * as chatApi from '../services/chatApi';

// ── Keys ────────────────────────────────────────────────────────────────────
const SESSION_KEY = 'neonexus-chat-session-id';

// ── Fallback mock responses (used when backend is unreachable) ──────────────
const mockResponses: Record<Language, Record<string, string>> = {
  en: {
    stress:
      "I understand you're feeling stressed. Try deep breaths for 5 minutes, progressive muscle relaxation, or calming music. Would you like me to guide you through a breathing exercise?",
    anxiety:
      "Anxiety is common, especially for students. Let's try grounding: name 5 things you see, 4 you touch, 3 you hear, 2 you smell, 1 you taste.",
    sad: "I can sense you're feeling sad. Your emotions are valid. Would you like to talk about it, or try some uplifting activities?",
    help: "I'm here to help! You can book a counselor appointment, explore resources, connect with peer support, or keep chatting with me.",
    default:
      "I hear you. Can you tell me more about how you're feeling? I'm here to listen and support you.",
  },
  hi: {
    stress:
      'मैं समझ सकता हूँ कि आप तनाव महसूस कर रहे हैं। 5 मिनट तक गहरी सांस लें, प्रगतिशील मांसपेशी विश्राम करें, या शांत संगीत सुनें।',
    anxiety:
      'चिंता एक सामान्य अनुभव है। आइए कुछ शांत करने वाली तकनीकों को आज़माएं।',
    sad: 'मुझे पता है कि आप उदास महसूस कर रहे हैं। ऐसा महसूस करना ठीक है। क्या आप इसके बारे में बात करना चाहेंगे?',
    help: 'मैं यहाँ आपकी मदद के लिए हूँ। आप काउंसलर से अपॉइंटमेंट बुक कर सकते हैं।',
    default: 'मैं आपकी बात सुन रहा हूँ। आप और बताएं कि आप कैसा महसूस कर रहे हैं?',
  },
  ur: {
    stress:
      'میں سمجھ سکتا ہوں کہ آپ دباؤ میں ہیں۔ 5 منٹ گہری سانس لیں، پٹھوں کو آرام دیں۔',
    anxiety: 'پریشانی ایک عام تجربہ ہے۔ آئیے کچھ سکون بخش تکنیکیں آزمائیں۔',
    sad: 'میں جانتا ہوں کہ آپ اداس محسوس کر رہے ہیں۔ ایسا محسوس کرنا ٹھیک ہے۔',
    help: 'میں یہاں آپ کی مدد کے لیے ہوں۔',
    default: 'میں آپ کی بات سن رہا ہوں۔ آپ اور بتائیں۔',
  },
  ks: {
    stress:
      'بہ سمجھان چھُس کہ توہہ تناؤ محسوس کران چھیو۔ 5 منٹہ گہری سانس نیو۔',
    anxiety: 'پریشانی چھیہ آم تجربہ۔ ذہن آرام کرنہ والی تکنیکہ آزماؤ۔',
    sad: 'بہ سمجھان چھُس کہ توہہ اداس محسوس کران چھیو۔ یہ محسوس کرن چھُ ٹھیک۔',
    help: 'بہ یتھ چھُس تہندی مدد کرنہ خاطرہ۔',
    default: 'بہ تہندی گل بوزان چھُس۔ دسو کہ توہہ کیتھ محسوس کران چھیو؟',
  },
  doi: {
    stress:
      'मैं समझ सकदा हूं कि तुसीं तनाव महसूस करदे ओ۔ 5 मिनट गहरी सांस लो۔',
    anxiety: 'گھبراہٹ عام گل ہے۔ من نوں شانت کرن دیاں تکنیکاں آزماؤ۔',
    sad: 'मैं جاندा हूं कि तुसीं اداسی محسوस करदे ओ۔ اسہ محسوس کرنا ٹھیک ہے۔',
    help: 'मैं تہاڈی مدد लئی اوتھے ہیں۔',
    default: 'میں تہاڈی گل بوندا ہیں۔ دسیک کی محسوس کردے ہو۔',
  },
};

function generateMockResponse(message: string, language: Language): string {
  const msg = message.toLowerCase();
  const r = mockResponses[language] || mockResponses.en;

  if (msg.includes('stress') || msg.includes('تناو') || msg.includes('तनाव'))
    return r.stress;
  if (
    msg.includes('anxiety') ||
    msg.includes('پریشانی') ||
    msg.includes('चिंता')
  )
    return r.anxiety;
  if (msg.includes('sad') || msg.includes('اداس') || msg.includes('उदास'))
    return r.sad;
  if (msg.includes('help') || msg.includes('مدد') || msg.includes('मदद'))
    return r.help;
  return r.default;
}

// ── Screening state ──────────────────────────────────────────────────────────
export interface ScreeningState {
  active: boolean;
  type: ScreeningType | null;
  name: string;
  questionIndex: number;
  totalQuestions: number;
  question: string;
  options: string[];
  instruction: string;
}

// ── Hook return type ─────────────────────────────────────────────────────────
export interface UseChatReturn {
  messages: ChatMessage[];
  isTyping: boolean;
  isConnected: boolean;
  sessionId: string | null;
  crisisDetected: boolean;
  helplines: Helpline[];
  screening: ScreeningState;
  sendMessage: (text: string) => Promise<void>;
  startScreening: (type: ScreeningType) => Promise<void>;
  submitScreeningAnswer: (answer: number) => Promise<void>;
  dismissCrisis: () => void;
}

// ── Hook ──────────────────────────────────────────────────────────────────────
export function useChat(
  language: Language,
  userName?: string
): UseChatReturn {
  // State
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [isConnected, setIsConnected] = useState(true);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [crisisDetected, setCrisisDetected] = useState(false);
  const [helplines, setHelplines] = useState<Helpline[]>([]);
  const [screening, setScreening] = useState<ScreeningState>({
    active: false,
    type: null,
    name: '',
    questionIndex: 0,
    totalQuestions: 0,
    question: '',
    options: [],
    instruction: '',
  });

  // Refs to avoid stale closures
  const sessionIdRef = useRef<string | null>(null);
  const languageRef = useRef<Language>(language);

  useEffect(() => {
    languageRef.current = language;
  }, [language]);

  // ── Helpers ──────────────────────────────────────────────────────────────
  const addBotMessage = useCallback(
    (content: string, metadata?: Record<string, any>) => {
      const msg: ChatMessage = {
        id: `bot-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        role: 'assistant',
        content,
        timestamp: new Date().toISOString(),
        metadata,
      };
      setMessages((prev) => [...prev, msg]);
      return msg;
    },
    []
  );

  const addUserMessage = useCallback((content: string) => {
    const msg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, msg]);
    return msg;
  }, []);

  // ── Session initialisation ───────────────────────────────────────────────
  useEffect(() => {
    async function init() {
      // Check sessionStorage first
      const stored = sessionStorage.getItem(SESSION_KEY);
      if (stored) {
        setSessionId(stored);
        sessionIdRef.current = stored;
      }

      try {
        const res = await chatApi.createSession();
        if (res.success && res.sessionId) {
          setSessionId(res.sessionId);
          sessionIdRef.current = res.sessionId;
          sessionStorage.setItem(SESSION_KEY, res.sessionId);
          setIsConnected(true);
        }
      } catch {
        setIsConnected(false);
        // Use a fallback session ID if backend is down
        if (!stored) {
          const fallback = `local-${Date.now()}`;
          setSessionId(fallback);
          sessionIdRef.current = fallback;
          sessionStorage.setItem(SESSION_KEY, fallback);
        }
      }

      // Welcome message
      const greeting = userName
        ? `Hello ${userName.split(' ')[0]}! I'm here to provide you with mental health support and guidance. How are you feeling today?`
        : "Hello there! I'm here to provide you with mental health support and guidance. How are you feeling today?";
      addBotMessage(greeting);
    }

    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Send message ─────────────────────────────────────────────────────────
  const sendMessageFn = useCallback(
    async (text: string) => {
      if (!text.trim()) return;

      addUserMessage(text);
      setIsTyping(true);

      const sid = sessionIdRef.current || 'unknown';
      const lang = languageRef.current;

      try {
        const res = await chatApi.sendMessage(sid, text, lang);

        if (res.success && res.reply) {
          setIsConnected(true);
          addBotMessage(res.reply, {
            intent: res.intent,
            confidence: res.confidence,
          });

          // Crisis handling
          if (res.crisisDetected) {
            setCrisisDetected(true);
            setHelplines(res.helplines || []);
          }
        } else {
          throw new Error('Invalid response');
        }
      } catch {
        // Fallback to local mock
        setIsConnected(false);
        const fallbackReply = generateMockResponse(text, lang);
        addBotMessage(fallbackReply);
      } finally {
        setIsTyping(false);
      }
    },
    [addUserMessage, addBotMessage]
  );

  // ── Screening: start ────────────────────────────────────────────────────
  const startScreeningFn = useCallback(
    async (type: ScreeningType) => {
      const sid = sessionIdRef.current || 'unknown';
      const lang = languageRef.current;

      setIsTyping(true);

      try {
        const res: ScreeningStartResponse = await chatApi.startScreening(
          sid,
          type,
          lang
        );

        if (res.success) {
          setIsConnected(true);
          setScreening({
            active: true,
            type,
            name: res.screeningName,
            questionIndex: res.questionIndex,
            totalQuestions: res.totalQuestions,
            question: res.question,
            options: res.options,
            instruction: res.instruction,
          });

          // Show the screening as bot messages
          addBotMessage(
            `📋 **${res.screeningName}**\n\n${res.instruction}`
          );
          addBotMessage(
            `Question ${res.questionIndex + 1}/${res.totalQuestions}: ${res.question}`,
            { screening: true, options: res.options }
          );
        }
      } catch {
        setIsConnected(false);
        addBotMessage(
          'Sorry, I could not start the screening right now. The service appears to be offline. Please try again later.'
        );
      } finally {
        setIsTyping(false);
      }
    },
    [addBotMessage]
  );

  // ── Screening: answer ────────────────────────────────────────────────────
  const submitScreeningAnswerFn = useCallback(
    async (answer: number) => {
      if (!screening.active || !screening.type) return;

      const sid = sessionIdRef.current || 'unknown';
      const lang = languageRef.current;

      // Show the user's chosen answer
      const optionLabel = screening.options[answer] || `Option ${answer}`;
      addUserMessage(optionLabel);
      setIsTyping(true);

      try {
        const res: ScreeningAnswerResponse =
          await chatApi.submitScreeningAnswer(
            sid,
            screening.type,
            screening.questionIndex,
            answer,
            lang
          );

        if (res.success) {
          if (res.done) {
            // Screening complete — show results
            setScreening((prev) => ({
              ...prev,
              active: false,
            }));

            addBotMessage(
              `✅ **Screening Complete**\n\nYour ${screening.name} score: **${res.score}**\nSeverity: **${res.severity}**\n\nThis is a preliminary assessment. For a professional evaluation, please consider booking a session with one of our counselors.`,
              { screeningResult: true, score: res.score, severity: res.severity }
            );
          } else if (res.question) {
            // Next question
            setScreening((prev) => ({
              ...prev,
              questionIndex: res.questionIndex ?? prev.questionIndex + 1,
              question: res.question!,
              totalQuestions: res.totalQuestions ?? prev.totalQuestions,
              options: res.options ?? prev.options,
            }));

            addBotMessage(
              `Question ${(res.questionIndex ?? 0) + 1}/${res.totalQuestions ?? screening.totalQuestions}: ${res.question}`,
              { screening: true, options: res.options ?? screening.options }
            );
          }
        }
      } catch {
        setIsConnected(false);
        addBotMessage(
          'Sorry, something went wrong submitting your answer. Please try again.'
        );
      } finally {
        setIsTyping(false);
      }
    },
    [screening, addUserMessage, addBotMessage]
  );

  // ── Crisis dismiss ──────────────────────────────────────────────────────
  const dismissCrisis = useCallback(() => {
    setCrisisDetected(false);
    setHelplines([]);
  }, []);

  return {
    messages,
    isTyping,
    isConnected,
    sessionId,
    crisisDetected,
    helplines,
    screening,
    sendMessage: sendMessageFn,
    startScreening: startScreeningFn,
    submitScreeningAnswer: submitScreeningAnswerFn,
    dismissCrisis,
  };
}
