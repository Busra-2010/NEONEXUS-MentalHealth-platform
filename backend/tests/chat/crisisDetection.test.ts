const { scanForCrisis } = require('../../server/services/crisisDetection.service');

describe('Crisis Detection Service', () => {
  describe('English keywords', () => {
    it('should detect suicide-related keywords', () => {
      const result = scanForCrisis('I want to kill myself', 'en');
      expect(result.crisisDetected).toBe(true);
      expect(result.matchedKeywords).toContain('kill myself');
      expect(result.helplines.length).toBeGreaterThan(0);
    });

    it('should detect self-harm keywords', () => {
      const result = scanForCrisis('I want to hurt myself badly', 'en');
      expect(result.crisisDetected).toBe(true);
      expect(result.matchedKeywords).toContain('hurt myself');
    });

    it('should NOT flag benign messages', () => {
      const result = scanForCrisis('I had a good day today', 'en');
      expect(result.crisisDetected).toBe(false);
      expect(result.matchedKeywords).toHaveLength(0);
      expect(result.helplines).toHaveLength(0);
    });

    it('should be case-insensitive', () => {
      const result = scanForCrisis('I want to END IT ALL', 'en');
      expect(result.crisisDetected).toBe(true);
    });
  });

  describe('Hindi keywords', () => {
    it('should detect Hindi crisis keywords', () => {
      const result = scanForCrisis('मैं आत्महत्या करना चाहता हूं', 'hi');
      expect(result.crisisDetected).toBe(true);
      expect(result.matchedKeywords).toContain('आत्महत्या');
    });

    it('should return Hindi helplines', () => {
      const result = scanForCrisis('मरना चाहता हूं', 'hi');
      expect(result.crisisDetected).toBe(true);
      expect(result.helplines.length).toBeGreaterThan(0);
      expect(result.helplines[0].name).toContain('किरण');
    });
  });

  describe('Urdu keywords', () => {
    it('should detect Urdu crisis keywords', () => {
      const result = scanForCrisis('میں خودکشی کرنا چاہتا ہوں', 'ur');
      expect(result.crisisDetected).toBe(true);
      expect(result.matchedKeywords).toContain('خودکشی');
    });
  });

  describe('Kashmiri keywords', () => {
    it('should detect Kashmiri crisis keywords', () => {
      const result = scanForCrisis('بہ ختم کرُن چھان', 'ks');
      expect(result.crisisDetected).toBe(true);
    });
  });

  describe('Dogri keywords', () => {
    it('should detect Dogri crisis keywords', () => {
      const result = scanForCrisis('मैं मरना चहुंदा हूं', 'doi');
      expect(result.crisisDetected).toBe(true);
    });
  });

  describe('unknown language fallback', () => {
    it('should fall back to English for unknown language codes', () => {
      const result = scanForCrisis('I want to end my life', 'xx');
      expect(result.crisisDetected).toBe(true);
    });
  });
});
