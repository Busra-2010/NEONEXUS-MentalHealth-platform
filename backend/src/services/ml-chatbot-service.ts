import { DatabaseConnection } from '../utils/database';
import { randomUUID } from 'crypto';

// ML Service Configuration
interface MLConfig {
  openaiApiKey?: string;
  model: string;
  maxTokens: number;
  temperature: number;
  enableFallback: boolean;
  enableTraining: boolean;
}

interface ConversationContext {
  userId: number;
  conversationId: string;
  recentMessages: Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
  }>;
  userProfile?: {
    name?: string;
    yearOfStudy?: number;
    major?: string;
  };
  riskFactors: string[];
  sessionMetadata: any;
}

interface MLResponse {
  content: string;
  confidence: number;
  usedML: boolean;
  fallbackReason?: string;
  detectedIntent: string[];
  suggestedActions: string[];
}

interface TrainingData {
  id: string;
  input: string;
  expectedOutput: string;
  actualOutput: string;
  userFeedback: number; // 1-5 rating
  context: any;
  timestamp: Date;
}

export class MLChatbotService {
  private config: MLConfig;
  private fallbackResponses: Map<string, string[]> = new Map();
  
  constructor(config: MLConfig) {
    this.config = config;
    this.initializeFallbackResponses();
  }

  private initializeFallbackResponses(): void {
    this.fallbackResponses = new Map([
      ['stress_anxiety', [
        "I understand you're feeling stressed. Let's try some breathing exercises together. Take a deep breath in for 4 counts, hold for 7, and exhale for 8.",
        "Stress can be overwhelming. Have you tried the 5-4-3-2-1 grounding technique? Name 5 things you can see, 4 you can touch, 3 you can hear, 2 you can smell, and 1 you can taste.",
        "It sounds like you're going through a tough time. Remember that stress is temporary, and there are people who want to help you through this."
      ]],
      ['depression', [
        "I hear that you're struggling right now. Depression can make everything feel harder, but you're not alone in this.",
        "Thank you for sharing how you're feeling. It takes courage to reach out. Have you been able to maintain any daily routines that usually help you feel better?",
        "These feelings are valid, and it's important that you're talking about them. Sometimes just expressing what we're going through can be the first step toward feeling better."
      ]],
      ['crisis', [
        "I'm very concerned about what you've shared with me. Your safety is the most important thing right now. Please know that there are people who care about you and want to help.",
        "Thank you for trusting me with how you're feeling. This takes incredible strength. Right now, I want to connect you with someone who can provide immediate support.",
        "What you're experiencing right now must be incredibly difficult. You deserve support, and there are people trained specifically to help in situations like this."
      ]],
      ['general', [
        "I'm here to listen and support you. What's on your mind today?",
        "Thank you for reaching out. Sometimes talking about what we're experiencing can be really helpful. How are you feeling right now?",
        "I appreciate you taking the time to connect. What brings you here today, and how can I best support you?"
      ]]
    ]);
  }

  /**
   * Generate enhanced response using hybrid ML + rule-based approach
   */
  async generateEnhancedResponse(
    message: string,
    context: ConversationContext,
    db: DatabaseConnection
  ): Promise<MLResponse> {
    try {
      // Step 1: Safety check using rule-based system (always runs first)
      const safetyCheck = this.performSafetyCheck(message, context);
      
      // Step 2: If crisis detected, use rule-based response for safety
      if (safetyCheck.isCrisis) {
        return this.generateCrisisResponse(message, context, safetyCheck);
      }

      // Step 3: Try ML-enhanced response
      let mlResponse: MLResponse | null = null;
      
      if (this.config.openaiApiKey && this.shouldUseMl(context)) {
        mlResponse = await this.generateMLResponse(message, context, db);
      }

      // Step 4: Fallback to enhanced rule-based response if ML fails
      if (!mlResponse || mlResponse.confidence < 0.7) {
        mlResponse = this.generateEnhancedRuleBasedResponse(message, context, safetyCheck);
      }

      // Step 5: Post-process and enhance response
      const finalResponse = await this.postProcessResponse(mlResponse, context, db);

      // Step 6: Log for training data collection
      await this.logInteractionForTraining(message, finalResponse, context, db);

      return finalResponse;

    } catch (error) {
      console.error('Error in ML chatbot service:', error);
      
      // Always fallback to safe rule-based response
      return this.generateEnhancedRuleBasedResponse(message, context, {
        isCrisis: false,
        riskLevel: 'low',
        detectedCategories: ['general'],
        triggers: []
      });
    }
  }

  /**
   * Advanced safety checking with multiple layers
   */
  private performSafetyCheck(message: string, context: ConversationContext): {
    isCrisis: boolean;
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    detectedCategories: string[];
    triggers: string[];
  } {
    const lowerMessage = message.toLowerCase();
    const triggers: string[] = [];
    const categories: string[] = [];
    let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';

    // Crisis indicators (highest priority)
    const crisisKeywords = [
      'suicide', 'kill myself', 'end my life', 'self harm', 'cutting', 'hurt myself',
      'overdose', 'pills', 'razor', 'blade', 'better off dead', 'want to die',
      'can\'t go on', 'no point living', 'end it all'
    ];

    const crisisDetected = crisisKeywords.some(keyword => {
      if (lowerMessage.includes(keyword)) {
        triggers.push(keyword);
        return true;
      }
      return false;
    });

    if (crisisDetected) {
      riskLevel = 'critical';
      categories.push('crisis');
      return { isCrisis: true, riskLevel, detectedCategories: categories, triggers };
    }

    // High-risk indicators
    const highRiskKeywords = [
      'hopeless', 'worthless', 'can\'t cope', 'giving up', 'what\'s the point',
      'everyone would be better off', 'burden', 'useless'
    ];

    const highRiskDetected = highRiskKeywords.some(keyword => {
      if (lowerMessage.includes(keyword)) {
        triggers.push(keyword);
        return true;
      }
      return false;
    });

    if (highRiskDetected) {
      riskLevel = 'high';
    }

    // Category detection
    if (/\b(stress|anxiety|anxious|worried|panic|overwhelmed|pressure)\b/gi.test(lowerMessage)) {
      categories.push('stress_anxiety');
      if (riskLevel === 'low') riskLevel = 'medium';
    }

    if (/\b(sad|depressed|down|lonely|empty|tired|exhausted|unmotivated)\b/gi.test(lowerMessage)) {
      categories.push('depression');
      if (riskLevel === 'low') riskLevel = 'medium';
    }

    if (/\b(sleep|insomnia|can't sleep|sleepless|nightmares|tired)\b/gi.test(lowerMessage)) {
      categories.push('sleep');
    }

    if (/\b(relationship|breakup|family|friends|social|conflict|argument)\b/gi.test(lowerMessage)) {
      categories.push('relationships');
    }

    if (/\b(grades|study|exam|test|assignment|academic|failing|college)\b/gi.test(lowerMessage)) {
      categories.push('academic');
    }

    if (categories.length === 0) {
      categories.push('general');
    }

    return {
      isCrisis: false,
      riskLevel,
      detectedCategories: categories,
      triggers
    };
  }

  /**
   * Generate ML-powered response using external API
   */
  private async generateMLResponse(
    message: string,
    context: ConversationContext,
    db: DatabaseConnection
  ): Promise<MLResponse | null> {
    try {
      const prompt = this.buildMLPrompt(message, context);
      
      // In a real implementation, this would call OpenAI API
      // For now, we'll simulate an enhanced response
      const simulatedMLResponse = await this.simulateMLAPI(prompt, message);
      
      return {
        content: simulatedMLResponse.content,
        confidence: simulatedMLResponse.confidence,
        usedML: true,
        detectedIntent: simulatedMLResponse.intent,
        suggestedActions: simulatedMLResponse.actions
      };
      
    } catch (error) {
      console.error('ML API error:', error);
      return null;
    }
  }

  /**
   * Build contextual prompt for ML model
   */
  private buildMLPrompt(message: string, context: ConversationContext): string {
    const recentHistory = context.recentMessages
      .slice(-3)
      .map(msg => `${msg.role}: ${msg.content}`)
      .join('\n');

    const userInfo = context.userProfile ? 
      `Student: ${context.userProfile.name}, Year ${context.userProfile.yearOfStudy}, Major: ${context.userProfile.major}` : 
      'Student profile not available';

    return `You are a compassionate mental health support chatbot for college students. 

Context:
- ${userInfo}
- Recent conversation:
${recentHistory}

Guidelines:
1. Be empathetic, warm, and non-judgmental
2. Provide evidence-based coping strategies
3. Never provide medical advice or diagnose
4. Encourage professional help when appropriate
5. Keep responses concise but meaningful
6. Use validating language

Current message: "${message}"

Provide a supportive response:`;
  }

  /**
   * Simulate ML API call (replace with actual OpenAI API in production)
   */
  private async simulateMLAPI(prompt: string, message: string): Promise<{
    content: string;
    confidence: number;
    intent: string[];
    actions: string[];
  }> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));

    const lowerMessage = message.toLowerCase();
    let content = '';
    let confidence = 0.8;
    const intent: string[] = [];
    const actions: string[] = [];

    // Enhanced response generation based on detected patterns
    if (lowerMessage.includes('stress') || lowerMessage.includes('anxious')) {
      content = `I can hear that you're feeling really stressed right now, and that makes complete sense given everything you're managing. Stress is our body's natural response to challenges, but when it becomes overwhelming, it can feel impossible to handle.

One technique that many students find helpful is called the "STOP" method: Stop what you're doing, Take a breath, Observe your thoughts and feelings, and then Proceed with intention. Sometimes just pausing can give us the space we need to respond rather than react.

What specific situation is causing you the most stress right now? Sometimes talking through the details can help us find manageable next steps.`;
      
      intent.push('stress_management', 'coping_strategies');
      actions.push('breathing_exercise', 'stress_assessment', 'counselor_referral');
      confidence = 0.9;
      
    } else if (lowerMessage.includes('sad') || lowerMessage.includes('down') || lowerMessage.includes('depressed')) {
      content = `Thank you for sharing how you're feeling with me. It takes real courage to acknowledge when we're struggling, and I want you to know that what you're experiencing is valid and you're not alone in feeling this way.

When we're feeling down, sometimes it can help to focus on very small, manageable things we can do. This might be as simple as stepping outside for a few minutes, listening to a song you enjoy, or reaching out to someone who cares about you.

Have you been able to maintain any of your usual routines lately? Sometimes when we're struggling emotionally, keeping up with basic self-care can feel overwhelming, but even small steps can make a difference.`;
      
      intent.push('depression_support', 'emotional_validation');
      actions.push('self_care_suggestions', 'routine_check', 'counselor_referral');
      confidence = 0.85;
      
    } else if (lowerMessage.includes('sleep') || lowerMessage.includes('tired')) {
      content = `Sleep difficulties can be really challenging and often make everything else feel harder to manage. You're definitely not alone in struggling with this - sleep issues are incredibly common among students.

Good sleep hygiene can make a significant difference. This includes keeping a consistent sleep schedule, creating a relaxing bedtime routine, and avoiding screens for at least an hour before bed. Your sleep environment matters too - keeping your room cool, dark, and quiet can help.

How has your sleep been affecting other areas of your life? Sometimes addressing sleep can have positive effects on mood, stress levels, and academic performance.`;
      
      intent.push('sleep_support', 'sleep_hygiene');
      actions.push('sleep_tips', 'routine_suggestions', 'wellness_resources');
      confidence = 0.82;
      
    } else {
      content = `I'm really glad you reached out today. Sometimes just taking that step to connect and share what's on our mind can be meaningful in itself.

I'm here to listen and support you in whatever way I can. What would be most helpful for you to talk about right now? Whether it's something specific that's been on your mind, or if you're not quite sure where to start, we can figure it out together.

Remember that seeking support is actually a sign of strength and self-awareness, not weakness.`;
      
      intent.push('general_support', 'check_in');
      actions.push('active_listening', 'explore_concerns');
      confidence = 0.75;
    }

    return { content, confidence, intent, actions };
  }

  /**
   * Generate crisis response (always rule-based for safety)
   */
  private generateCrisisResponse(
    message: string,
    context: ConversationContext,
    safetyCheck: any
  ): MLResponse {
    const crisisResponses = [
      `I'm really concerned about what you've shared with me, and I want you to know that your safety is the most important thing right now. What you're feeling is incredibly difficult, but you don't have to face this alone.

Please consider reaching out to someone who can provide immediate support:
• National Suicide Prevention Lifeline: 988
• Crisis Text Line: Text HOME to 741741
• Campus Counseling Center: Available 24/7

Would you like me to help you connect with a counselor right now? I can also help you identify someone you trust who could be with you during this difficult time.`,

      `Thank you for trusting me with how you're feeling right now. It takes incredible courage to share when we're in so much pain. I want you to know that these feelings, as overwhelming as they are, can change with the right support.

Right now, your safety is what matters most. There are people specifically trained to help during times like this:
• Call 988 for the Suicide & Crisis Lifeline
• Text HOME to 741741 for Crisis Text Line
• Contact campus emergency services if you're in immediate danger

You matter, and there are people who want to help you through this. Can we connect you with someone right now?`
    ];

    return {
      content: crisisResponses[Math.floor(Math.random() * crisisResponses.length)],
      confidence: 1.0,
      usedML: false,
      fallbackReason: 'crisis_safety_protocol',
      detectedIntent: ['crisis_intervention'],
      suggestedActions: ['immediate_professional_help', 'crisis_resources', 'safety_planning']
    };
  }

  /**
   * Enhanced rule-based response generation
   */
  private generateEnhancedRuleBasedResponse(
    message: string,
    context: ConversationContext,
    safetyCheck: any
  ): MLResponse {
    const primaryCategory = safetyCheck.detectedCategories[0] || 'general';
    const possibleResponses = this.fallbackResponses.get(primaryCategory) || this.fallbackResponses.get('general')!;
    
    // Select response based on context
    let selectedResponse = possibleResponses[Math.floor(Math.random() * possibleResponses.length)];
    
    // Add contextual enhancement based on user profile
    if (context.userProfile?.name) {
      selectedResponse = this.personalizeResponse(selectedResponse, context);
    }

    return {
      content: selectedResponse,
      confidence: 0.7,
      usedML: false,
      fallbackReason: 'ml_unavailable_or_low_confidence',
      detectedIntent: safetyCheck.detectedCategories,
      suggestedActions: this.getSuggestedActions(primaryCategory)
    };
  }

  /**
   * Post-process response to add helpful elements
   */
  private async postProcessResponse(
    response: MLResponse,
    context: ConversationContext,
    db: DatabaseConnection
  ): Promise<MLResponse> {
    // Add follow-up questions based on context
    const followUpQuestions = this.generateFollowUpQuestions(response.detectedIntent, context);
    
    if (followUpQuestions.length > 0) {
      response.content += '\n\n' + followUpQuestions.join(' ');
    }

    // Add relevant resources
    const resources = await this.getRelevantResources(response.detectedIntent, db);
    if (resources.length > 0) {
      response.suggestedActions.push(...resources);
    }

    return response;
  }

  /**
   * Personalize response based on user context
   */
  private personalizeResponse(response: string, context: ConversationContext): string {
    if (context.userProfile?.major) {
      const major = context.userProfile.major;
      if (major.toLowerCase().includes('engineering')) {
        response += ' Many engineering students face similar challenges with the demanding coursework.';
      } else if (major.toLowerCase().includes('psychology')) {
        response += ' Your psychology background might give you some insight into these patterns.';
      } else if (major.toLowerCase().includes('pre-med') || major.toLowerCase().includes('medical')) {
        response += ' The pressure of pre-med programs can be intense - you\'re not alone in feeling this way.';
      }
    }
    return response;
  }

  /**
   * Generate contextual follow-up questions
   */
  private generateFollowUpQuestions(intents: string[], context: ConversationContext): string[] {
    const questions: string[] = [];
    
    if (intents.includes('stress_anxiety')) {
      questions.push('What specific situations tend to trigger your anxiety the most?');
      questions.push('Have you tried any relaxation techniques before?');
    }
    
    if (intents.includes('depression')) {
      questions.push('How long have you been feeling this way?');
      questions.push('Have you been able to maintain any daily routines that usually help you?');
    }
    
    if (intents.includes('academic')) {
      questions.push('Which classes or assignments are causing you the most concern?');
      questions.push('Have you spoken with your professors about your concerns?');
    }
    
    return questions.slice(0, 2); // Limit to 2 follow-up questions
  }

  /**
   * Get suggested actions based on category
   */
  private getSuggestedActions(category: string): string[] {
    const actionMap: Record<string, string[]> = {
      'stress_anxiety': ['breathing_exercises', 'grounding_techniques', 'mindfulness_resources'],
      'depression': ['self_care_tips', 'social_connection', 'professional_resources'],
      'sleep': ['sleep_hygiene_tips', 'relaxation_techniques', 'wellness_resources'],
      'relationships': ['communication_tips', 'boundary_setting', 'conflict_resolution'],
      'academic': ['study_skills', 'time_management', 'academic_support'],
      'general': ['wellness_check', 'resource_exploration', 'goal_setting']
    };
    
    return actionMap[category] || actionMap['general'];
  }

  /**
   * Get relevant resources from database
   */
  private async getRelevantResources(intents: string[], db: DatabaseConnection): Promise<string[]> {
    try {
      // This would query the resources database based on intents
      // For now, return static relevant resource types
      return ['guided_meditation', 'counseling_services', 'wellness_resources'];
    } catch (error) {
      console.error('Error fetching resources:', error);
      return [];
    }
  }

  /**
   * Determine if we should use ML for this interaction
   */
  private shouldUseMl(context: ConversationContext): boolean {
    // Skip ML for users with high risk factors
    if (context.riskFactors.includes('crisis_history')) {
      return false;
    }
    
    // Use ML for users with sufficient context
    return context.recentMessages.length >= 2;
  }

  /**
   * Log interaction for training data collection
   */
  private async logInteractionForTraining(
    input: string,
    response: MLResponse,
    context: ConversationContext,
    db: DatabaseConnection
  ): Promise<void> {
    if (!this.config.enableTraining) return;

    try {
      const trainingData: TrainingData = {
        id: randomUUID(),
        input,
        expectedOutput: response.content,
        actualOutput: response.content,
        userFeedback: 0, // Will be updated when user provides feedback
        context: {
          categories: response.detectedIntent,
          usedML: response.usedML,
          confidence: response.confidence,
          userProfile: context.userProfile
        },
        timestamp: new Date()
      };

      await db.run(`
        INSERT INTO chatbot_training_data (
          id, conversation_id, user_input, bot_response, 
          response_type, confidence_score, context_data, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `, [
        trainingData.id,
        context.conversationId,
        input,
        response.content,
        response.usedML ? 'ml_enhanced' : 'rule_based',
        response.confidence,
        JSON.stringify(trainingData.context)
      ]);

    } catch (error) {
      console.error('Error logging training data:', error);
    }
  }

  /**
   * Update training data with user feedback
   */
  async updateTrainingDataWithFeedback(
    conversationId: string,
    messageId: string,
    feedback: number,
    db: DatabaseConnection
  ): Promise<void> {
    try {
      await db.run(`
        UPDATE chatbot_training_data 
        SET user_feedback = ?, feedback_timestamp = CURRENT_TIMESTAMP 
        WHERE conversation_id = ? AND id = ?
      `, [feedback, conversationId, messageId]);

      // If feedback is low (1-2), flag for review
      if (feedback <= 2) {
        await db.run(`
          INSERT INTO chatbot_improvement_queue (
            id, training_data_id, feedback_score, 
            requires_review, created_at
          ) VALUES (?, ?, ?, 1, CURRENT_TIMESTAMP)
        `, [randomUUID(), messageId, feedback]);
      }

    } catch (error) {
      console.error('Error updating training feedback:', error);
    }
  }
}

// Export default configuration
export const defaultMLConfig: MLConfig = {
  openaiApiKey: process.env.OPENAI_API_KEY,
  model: 'gpt-3.5-turbo',
  maxTokens: 500,
  temperature: 0.7,
  enableFallback: true,
  enableTraining: true
};