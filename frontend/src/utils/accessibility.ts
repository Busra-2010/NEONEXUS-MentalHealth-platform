/**
 * Accessibility utility functions for NEONEXUS Mental Health Platform
 * Helps ensure WCAG 2.1 AA compliance and inclusive design
 */

/**
 * Generates a unique ID for form elements and ARIA attributes
 */
export const generateId = (prefix: string = 'neonexus'): string => {
  return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Creates ARIA label for mood ratings in a culturally sensitive way
 */
export const createMoodAriaLabel = (mood: number, language: string = 'en'): string => {
  const moodLabels = {
    en: {
      1: 'Very sad mood - It\'s okay to feel this way, support is available',
      2: 'Sad mood - Your feelings are valid, we\'re here for you',
      3: 'Okay mood - Neutral feeling, that\'s perfectly normal',
      4: 'Good mood - Positive feeling, glad you\'re doing well',
      5: 'Excellent mood - Very positive feeling, wonderful to hear'
    },
    hi: {
      1: 'बहुत उदास - ऐसा महसूस करना ठीक है, सहायता उपलब्ध है',
      2: 'उदास - आपकी भावनाएं सही हैं, हम आपके साथ हैं',
      3: 'ठीक - सामान्य भावना, यह बिल्कुल सामान्य है',
      4: 'अच्छा - सकारात्मक भावना, खुशी है कि आप अच्छा कर रहे हैं',
      5: 'बहुत बेहतरीन - बहुत सकारात्मक भावना, यह सुनकर बहुत अच्छा लगा'
    }
  };
  
  return moodLabels[language as keyof typeof moodLabels]?.[mood as keyof typeof moodLabels.en] || 
         moodLabels.en[mood as keyof typeof moodLabels.en] ||
         `Mood level ${mood}`;
};

/**
 * Creates ARIA description for crisis situations with appropriate urgency
 */
export const createCrisisAriaDescription = (language: string = 'en'): string => {
  const descriptions = {
    en: 'Crisis support detected. This action will connect you with immediate mental health resources and emergency contacts. Your safety is our priority.',
    hi: 'संकट सहायता का पता चला। यह क्रिया आपको तत्काल मानसिक स्वास्थ्य संसाधनों और आपातकालीन संपर्कों से जोड़ेगी। आपकी सुरक्षा हमारी प्राथमिकता है।',
    ur: 'بحرانی مدد کا پتا چل گیا۔ یہ عمل آپ کو فوری ذہنی صحت کے وسائل اور ہنگامی رابطوں سے جوڑے گا۔ آپ کی حفاظت ہماری ترجیح ہے۔'
  };
  
  return descriptions[language as keyof typeof descriptions] || descriptions.en;
};

/**
 * Creates appropriate ARIA labels for mental health resource types
 */
export const createResourceAriaLabel = (resource: {
  title: string;
  type: string;
  duration?: number;
  rating?: number;
  language?: string;
}): string => {
  const { title, type, duration, rating, language = 'en' } = resource;
  
  let label = title;
  
  // Add type information
  const typeLabels = {
    video: language === 'hi' ? 'वीडियो' : 'video',
    audio: language === 'hi' ? 'ऑडियो' : 'audio', 
    pdf: language === 'hi' ? 'पीडीएफ दस्तावेज' : 'PDF document',
    article: language === 'hi' ? 'लेख' : 'article',
    worksheet: language === 'hi' ? 'कार्यपत्रक' : 'worksheet'
  };
  
  label += `, ${typeLabels[type as keyof typeof typeLabels] || type}`;
  
  // Add duration if available
  if (duration) {
    const durationLabel = language === 'hi' ? 'अवधि' : 'duration';
    const minutesLabel = language === 'hi' ? 'मिनट' : 'minutes';
    label += `, ${durationLabel} ${duration} ${minutesLabel}`;
  }
  
  // Add rating if available
  if (rating) {
    const ratingLabel = language === 'hi' ? 'रेटिंग' : 'rating';
    const outOfLabel = language === 'hi' ? '5 में से' : 'out of 5';
    label += `, ${ratingLabel} ${rating} ${outOfLabel}`;
  }
  
  return label;
};

/**
 * Announces important changes to screen readers
 */
export const announceToScreenReader = (message: string, priority: 'polite' | 'assertive' = 'polite'): void => {
  const announcement = document.createElement('div');
  announcement.setAttribute('aria-live', priority);
  announcement.setAttribute('aria-atomic', 'true');
  announcement.setAttribute('class', 'sr-only');
  announcement.textContent = message;
  
  document.body.appendChild(announcement);
  
  // Remove after announcement
  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
};

/**
 * Checks if user prefers reduced motion
 */
export const prefersReducedMotion = (): boolean => {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

/**
 * Checks if user is using high contrast mode
 */
export const prefersHighContrast = (): boolean => {
  return window.matchMedia('(prefers-contrast: high)').matches;
};

/**
 * Creates skip navigation links for keyboard users
 */
export const createSkipLink = (targetId: string, text: string): HTMLElement => {
  const skipLink = document.createElement('a');
  skipLink.href = `#${targetId}`;
  skipLink.textContent = text;
  skipLink.className = 'sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 bg-neon-blue-500 text-white px-4 py-2 rounded-md z-50';
  
  return skipLink;
};

/**
 * Focus management for modals and overlays
 */
export class FocusTrap {
  private element: HTMLElement;
  private previousActiveElement: Element | null;
  
  constructor(element: HTMLElement) {
    this.element = element;
    this.previousActiveElement = document.activeElement;
  }
  
  activate(): void {
    this.element.addEventListener('keydown', this.handleKeyDown.bind(this));
    this.focusFirstElement();
  }
  
  deactivate(): void {
    this.element.removeEventListener('keydown', this.handleKeyDown.bind(this));
    if (this.previousActiveElement && 'focus' in this.previousActiveElement) {
      (this.previousActiveElement as HTMLElement).focus();
    }
  }
  
  private handleKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Tab') {
      const focusableElements = this.getFocusableElements();
      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      
      if (event.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement?.focus();
          event.preventDefault();
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement?.focus();
          event.preventDefault();
        }
      }
    }
    
    if (event.key === 'Escape') {
      this.deactivate();
      // Trigger close event
      this.element.dispatchEvent(new CustomEvent('escape'));
    }
  }
  
  private getFocusableElements(): HTMLElement[] {
    const selector = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
    return Array.from(this.element.querySelectorAll(selector)).filter(
      el => !el.hasAttribute('disabled')
    ) as HTMLElement[];
  }
  
  private focusFirstElement(): void {
    const focusableElements = this.getFocusableElements();
    focusableElements[0]?.focus();
  }
}

/**
 * Color contrast checker for accessibility compliance
 */
export const checkColorContrast = (foreground: string, background: string): {
  ratio: number;
  wcagAA: boolean;
  wcagAAA: boolean;
} => {
  const getLuminance = (color: string): number => {
    // Simplified luminance calculation
    // In a real implementation, this would be more comprehensive
    const rgb = color.match(/\d+/g);
    if (!rgb) return 0;
    
    const [r, g, b] = rgb.map(val => {
      const c = parseInt(val) / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  
  const l1 = getLuminance(foreground);
  const l2 = getLuminance(background);
  const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
  
  return {
    ratio,
    wcagAA: ratio >= 4.5,
    wcagAAA: ratio >= 7
  };
};

/**
 * Mental health specific accessibility helpers
 */
export const mentalHealthA11y = {
  /**
   * Creates calming focus styles for anxiety-sensitive users
   */
  calmFocusStyle: 'focus:outline-none focus:ring-2 focus:ring-neon-blue-300 focus:ring-opacity-50 transition-all duration-200',
  
  /**
   * Creates gentle hover effects
   */
  gentleHoverStyle: 'hover:bg-opacity-80 transition-colors duration-300',
  
  /**
   * Screen reader text for crisis situations
   */
  crisisScreenReaderText: (language: string = 'en') => {
    const texts = {
      en: 'Crisis support activated. Immediate help resources are being displayed.',
      hi: 'संकट सहायता सक्रिय। तत्काल सहायता संसाधन दिखाए जा रहे हैं।',
      ur: 'بحرانی مدد فعال۔ فوری مدد کے وسائل دکھائے جا رہے ہیں۔'
    };
    
    return texts[language as keyof typeof texts] || texts.en;
  }
};