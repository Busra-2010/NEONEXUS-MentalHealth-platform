const { classifyIntent } = require('../../server/services/nlp.service');

describe('NLP Intent Classification Service', () => {
  describe('English intents', () => {
    it('should classify greetings', () => {
      const result = classifyIntent('Hello, how are you?', 'en');
      expect(result.intent).toBe('greeting');
      expect(result.confidence).toBeGreaterThan(0);
    });

    it('should classify stress', () => {
      const result = classifyIntent('I am really stressed about exams', 'en');
      expect(result.intent).toBe('stress');
    });

    it('should classify anxiety', () => {
      const result = classifyIntent('I feel very anxious and nervous', 'en');
      expect(result.intent).toBe('anxiety');
    });

    it('should classify depression', () => {
      const result = classifyIntent('I feel so depressed and lonely', 'en');
      expect(result.intent).toBe('depression');
    });

    it('should classify help requests', () => {
      const result = classifyIntent('Can you help me?', 'en');
      expect(result.intent).toBe('help');
    });

    it('should classify screening requests', () => {
      const result = classifyIntent('I want to take a PHQ assessment test', 'en');
      expect(result.intent).toBe('screening_request');
    });

    it('should return general for unrecognized messages', () => {
      const result = classifyIntent('The weather is nice today', 'en');
      expect(result.intent).toBe('general');
    });
  });

  describe('Hindi intents', () => {
    it('should classify Hindi stress', () => {
      const result = classifyIntent('मुझे बहुत तनाव हो रहा है', 'hi');
      expect(result.intent).toBe('stress');
    });

    it('should classify Hindi help requests', () => {
      const result = classifyIntent('मुझे मदद चाहिए', 'hi');
      expect(result.intent).toBe('help');
    });
  });

  describe('Urdu intents', () => {
    it('should classify Urdu anxiety', () => {
      const result = classifyIntent('مجھے بہت پریشانی ہو رہی ہے', 'ur');
      expect(result.intent).toBe('anxiety');
    });
  });

  describe('confidence scoring', () => {
    it('should return higher confidence for more keyword matches', () => {
      const low = classifyIntent('stressed', 'en');
      const high = classifyIntent('I am so stressed with all the pressure and burnout', 'en');
      expect(high.confidence).toBeGreaterThanOrEqual(low.confidence);
    });

    it('should cap confidence at 1.0', () => {
      const result = classifyIntent('stressed pressure overwhelmed burnout workload exam pressure', 'en');
      expect(result.confidence).toBeLessThanOrEqual(1.0);
    });
  });
});
