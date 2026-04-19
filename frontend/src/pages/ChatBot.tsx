import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Send,
  Bot,
  User,
  Globe,
  AlertCircle,
  Heart,
  Phone,
  MessageCircle,
  ChevronDown,
  Wifi,
  WifiOff,
  ClipboardList,
} from 'lucide-react';
import { Navigation, Card, Button, ToastContainer } from '../components/ui';
import { User as UserType, Language, Helpline, ScreeningType } from '../types';
import { useToast } from '../hooks/useToast';
import { useChat } from '../hooks/useChat';

interface ChatBotProps {
  user?: UserType;
  onLogout?: () => void;
}

const ChatBot: React.FC<ChatBotProps> = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const [inputMessage, setInputMessage] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState<Language>('en');
  const [showScrollButton, setShowScrollButton] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const toast = useToast();

  // ── Chat hook — all API logic lives here ─────────────────────────────
  const chat = useChat(selectedLanguage, user?.profile?.fullName);

  const languages = [
    { code: 'en' as Language, name: 'English', flag: '🇺🇸' },
    { code: 'hi' as Language, name: 'हिन्दी', flag: '🇮🇳' },
    { code: 'ur' as Language, name: 'اردو', flag: '🇵🇰' },
    { code: 'ks' as Language, name: 'कॉशुर', flag: '🏔️' },
    { code: 'doi' as Language, name: 'डोगरी', flag: '🏔️' },
  ];

  // ── Scroll helpers ───────────────────────────────────────────────────
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleScroll = () => {
    if (messagesContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } =
        messagesContainerRef.current;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 50;
      setShowScrollButton(!isNearBottom && chat.messages.length > 1);
    }
  };

  useEffect(() => {
    if (chat.messages.length > 1 && messagesContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } =
        messagesContainerRef.current;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
      if (isNearBottom) {
        setTimeout(scrollToBottom, 100);
      }
    }
  }, [chat.messages]);

  // ── Crisis toast ─────────────────────────────────────────────────────
  useEffect(() => {
    if (chat.crisisDetected) {
      toast.warning(
        'Crisis Detected',
        "We're here to help. Please consider reaching out to a professional immediately."
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chat.crisisDetected]);

  // ── Send handler ─────────────────────────────────────────────────────
  const handleSendMessage = async () => {
    if (!inputMessage.trim() || chat.isTyping) return;
    const text = inputMessage;
    setInputMessage('');
    await chat.sendMessage(text);
  };

  // ── Quick replies ────────────────────────────────────────────────────
  const quickReplies: Record<Language, string[]> = {
    en: [
      "I'm feeling stressed about exams",
      'I need help with anxiety',
      "I'm feeling lonely",
      'Can you help me sleep better?',
    ],
    hi: [
      'मैं परीक्षा को लेकर तनाव में हूं',
      'मुझे चिंता से मदद चाहिए',
      'मैं अकेलापन महसूस कर रहा हूं',
      'क्या आप बेहतर नींद में मदद कर सकते हैं?',
    ],
    ur: [
      'امتحان کے لیے پریشان ہوں',
      'پریشانی میں مدد چاہیے',
      'تنہائی محسوس کر رہا ہوں',
      'بہتر نیند کے لیے مدد چاہیے',
    ],
    ks: [
      'بہ امتحانو کہ بارے میں تناؤ محسوس کران چھُس',
      'بہ پریشانی کہ بارے میں مدد لوٹان',
      'بہ اکیلہ محسوس کران چھُس',
      'کیا تو بہتر نیند لینہ میں مدد کرہ ہیکہ۔',
    ],
    doi: [
      'मیں امتحاناں دی وجہ کن تناع محسوس کردا ओ',
      'मیں گھبراہٹ لئی مدد لوڑدا ہیں',
      'मیں اکیلپن محسوس کردا ओ',
      'کی توں بہتر نیند لئی مدد کر ساکدا ہیں؟',
    ],
  };

  // ── Screening options ────────────────────────────────────────────────
  const screeningTypes: { type: ScreeningType; label: string; desc: string }[] =
    [
      { type: 'PHQ9', label: 'PHQ-9', desc: 'Depression' },
      { type: 'GAD7', label: 'GAD-7', desc: 'Anxiety' },
      { type: 'GHQ12', label: 'GHQ-12', desc: 'General Health' },
    ];

  // ── Crisis Modal ─────────────────────────────────────────────────────
  const CrisisModal: React.FC = () => {
    if (!chat.crisisDetected) return null;

    // Use helplines from API if available, otherwise fall back
    const displayHelplines: Helpline[] =
      chat.helplines.length > 0
        ? chat.helplines
        : [
            {
              name: 'Emergency Helpline',
              number: '102',
              available: '24/7',
            },
            {
              name: 'KIRAN Mental Health Helpline',
              number: '1800-599-0019',
              available: '24/7, Toll-Free',
            },
          ];

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <Card padding="lg" className="max-w-md w-full bg-red-50 border-red-200">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <h3 className="text-xl font-semibold text-red-800 mb-4">
              We're Here for You
            </h3>
            <p className="text-red-700 mb-6">
              It sounds like you're going through a really difficult time.
              Please reach out for immediate support.
            </p>

            <div className="space-y-3 mb-6">
              {displayHelplines.map((hl, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-3 bg-white rounded-lg border"
                >
                  <div className="flex items-center space-x-3">
                    <Phone className="w-5 h-5 text-red-600" />
                    <div className="text-left">
                      <span className="font-medium block">{hl.name}</span>
                      {hl.available && (
                        <span className="text-xs text-gray-500">
                          {hl.available}
                        </span>
                      )}
                    </div>
                  </div>
                  <a
                    href={`tel:${hl.number}`}
                    className="font-semibold text-red-600 hover:underline"
                  >
                    {hl.number}
                  </a>
                </div>
              ))}
            </div>

            <div className="flex space-x-3">
              <Button
                variant="primary"
                className="flex-1 bg-red-600 hover:bg-red-700"
                onClick={() => navigate('/appointments')}
              >
                Talk to Counselor Now
              </Button>
              <Button variant="outline" onClick={chat.dismissCrisis}>
                Continue Chat
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  };

  // ── Screening answer buttons (rendered inline in message area) ───────
  const ScreeningOptions: React.FC = () => {
    if (!chat.screening.active) return null;

    return (
      <div className="flex justify-start mb-2">
        <div className="flex items-start space-x-2 max-w-xs lg:max-w-md">
          <div className="w-8 h-8 rounded-full bg-neon-lavender-500 flex items-center justify-center flex-shrink-0">
            <ClipboardList className="w-4 h-4 text-white" />
          </div>
          <div className="bg-gray-100 px-4 py-3 rounded-lg rounded-bl-none">
            <p className="text-xs text-gray-500 mb-2 font-medium">
              Select your answer:
            </p>
            <div className="space-y-2">
              {chat.screening.options.map((option, idx) => (
                <button
                  key={idx}
                  onClick={() => chat.submitScreeningAnswer(idx)}
                  disabled={chat.isTyping}
                  className="w-full text-left px-3 py-2 text-sm bg-white hover:bg-neon-lavender-50 border border-gray-200 hover:border-neon-lavender-300 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="font-medium text-neon-lavender-600 mr-2">
                    {idx}.
                  </span>
                  {option}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ── Render ────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation
        userRole="student"
        userName={user?.profile?.fullName || 'Student'}
        onLogout={onLogout}
      />

      <div className="max-w-4xl mx-auto py-6 px-4">
        {/* Header */}
        <div className="bg-gradient-to-r from-neon-lavender-500 to-neon-blue-500 rounded-xl p-6 text-white mb-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center animate-pulse">
                <Bot className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">AI Chat Support</h1>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                  <p className="text-blue-100">Online - Ready to help you</p>
                  {/* Connection indicator */}
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      chat.isConnected
                        ? 'bg-green-100 bg-opacity-20 text-green-200'
                        : 'bg-yellow-100 bg-opacity-20 text-yellow-200'
                    }`}
                  >
                    {chat.isConnected ? (
                      <>
                        <Wifi className="w-3 h-3 mr-1" />
                        Connected
                      </>
                    ) : (
                      <>
                        <WifiOff className="w-3 h-3 mr-1" />
                        Local Mode
                      </>
                    )}
                  </span>
                </div>
              </div>
            </div>

            {/* Language Selector */}
            <div className="flex space-x-2">
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => setSelectedLanguage(lang.code)}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all ${
                    selectedLanguage === lang.code
                      ? 'bg-white bg-opacity-20 text-white'
                      : 'bg-white bg-opacity-10 text-blue-100 hover:bg-white hover:bg-opacity-20'
                  }`}
                >
                  <span>{lang.flag}</span>
                  <span className="text-sm font-medium">{lang.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Chat Container */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 animate-fade-in">
          {/* Chat Messages */}
          <div className="lg:col-span-3">
            <Card
              padding="sm"
              className="h-[calc(100vh-300px)] min-h-[500px] flex flex-col transform transition-all duration-300"
            >
              {/* Messages */}
              <div
                ref={messagesContainerRef}
                onScroll={handleScroll}
                className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth relative"
              >
                {chat.messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${
                      message.role === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    <div
                      className={`flex items-start space-x-2 max-w-xs lg:max-w-md ${
                        message.role === 'user'
                          ? 'flex-row-reverse space-x-reverse'
                          : ''
                      }`}
                    >
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                          message.role === 'user'
                            ? 'bg-neon-blue-500 text-white'
                            : 'bg-neon-lavender-500 text-white'
                        }`}
                      >
                        {message.role === 'user' ? (
                          <User className="w-4 h-4" />
                        ) : (
                          <Bot className="w-4 h-4" />
                        )}
                      </div>
                      <div
                        className={`px-4 py-2 rounded-lg ${
                          message.role === 'user'
                            ? 'bg-neon-blue-500 text-white rounded-br-none'
                            : 'bg-gray-100 text-gray-900 rounded-bl-none'
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">
                          {message.content}
                        </p>
                        <p className="text-xs opacity-70 mt-1">
                          {new Date(message.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Screening answer buttons (inline) */}
                <ScreeningOptions />

                {/* Typing indicator */}
                {chat.isTyping && (
                  <div className="flex justify-start">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 rounded-full bg-neon-lavender-500 flex items-center justify-center">
                        <Bot className="w-4 h-4 text-white" />
                      </div>
                      <div className="bg-gray-100 px-4 py-2 rounded-lg rounded-bl-none">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                          <div
                            className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                            style={{ animationDelay: '0.1s' }}
                          />
                          <div
                            className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                            style={{ animationDelay: '0.2s' }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Scroll-to-bottom button */}
                {showScrollButton && (
                  <div className="sticky bottom-4 right-4 flex justify-end">
                    <button
                      onClick={scrollToBottom}
                      className="bg-neon-blue-500 text-white p-2 rounded-full shadow-lg hover:bg-neon-blue-600 transition-all duration-200 animate-bounce"
                      title="Scroll to bottom"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="p-4 border-t border-gray-200">
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={(e) =>
                      e.key === 'Enter' && handleSendMessage()
                    }
                    placeholder="Type your message here..."
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neon-lavender-200 focus:border-neon-lavender-500"
                    disabled={chat.isTyping || chat.screening.active}
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={
                      !inputMessage.trim() ||
                      chat.isTyping ||
                      chat.screening.active
                    }
                    className="px-4"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
                {chat.screening.active && (
                  <p className="text-xs text-amber-600 mt-1">
                    ⚠ Please answer the screening question above before sending
                    a new message.
                  </p>
                )}
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Replies */}
            <Card padding="md">
              <h3 className="font-semibold text-gray-900 mb-4">
                Quick Replies
              </h3>
              <div className="space-y-2">
                {quickReplies[selectedLanguage].map(
                  (reply: string, index: number) => (
                    <button
                      key={index}
                      onClick={() => setInputMessage(reply)}
                      className="w-full text-left p-3 text-sm bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"
                    >
                      {reply}
                    </button>
                  )
                )}
              </div>
            </Card>

            {/* Mental Health Screening */}
            <Card padding="md">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                <ClipboardList className="w-4 h-4 mr-2 text-neon-lavender-500" />
                Self-Assessment
              </h3>
              <p className="text-xs text-gray-500 mb-3">
                Take a quick standardized screening:
              </p>
              <div className="space-y-2">
                {screeningTypes.map((s) => (
                  <button
                    key={s.type}
                    onClick={() => chat.startScreening(s.type)}
                    disabled={chat.screening.active || chat.isTyping}
                    className="w-full text-left p-3 text-sm bg-neon-lavender-50 hover:bg-neon-lavender-100 rounded-lg transition-colors border border-neon-lavender-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="font-medium text-neon-lavender-700">
                      {s.label}
                    </span>
                    <span className="text-gray-500 ml-2">— {s.desc}</span>
                  </button>
                ))}
              </div>
            </Card>

            {/* Help Options */}
            <Card padding="md">
              <h3 className="font-semibold text-gray-900 mb-4">
                Need More Help?
              </h3>
              <div className="space-y-3">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => navigate('/appointments')}
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Book Counselor Session
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => navigate('/resources')}
                >
                  <Heart className="w-4 h-4 mr-2" />
                  Browse Resources
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => navigate('/forum')}
                >
                  <Globe className="w-4 h-4 mr-2" />
                  Join Community
                </Button>
              </div>
            </Card>

            {/* Safety Notice */}
            <Card padding="md" className="bg-blue-50 border-blue-200">
              <div className="text-center">
                <AlertCircle className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                <h4 className="font-medium text-blue-800 mb-2">Remember</h4>
                <p className="text-sm text-blue-700">
                  This AI is here to provide support, but in case of emergency,
                  please contact professional help immediately.
                </p>
              </div>
            </Card>
          </div>
        </div>
      </div>

      <CrisisModal />
      <ToastContainer toasts={toast.toasts} onRemove={toast.removeToast} />
    </div>
  );
};

export default ChatBot;