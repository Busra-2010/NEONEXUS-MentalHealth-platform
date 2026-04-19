import express from 'express';
import { body, query, validationResult } from 'express-validator';
import { authenticate, authorize } from '../middleware/auth';
import { DatabaseConnection } from '../utils/database';
import { z } from 'zod';
import { randomUUID } from 'crypto';
import { MLChatbotService, defaultMLConfig } from '../services/ml-chatbot-service';

const router = express.Router();

// Initialize ML Chatbot Service
const mlChatbotService = new MLChatbotService(defaultMLConfig);

// Helper function to get database connection
const getDb = (req: express.Request): DatabaseConnection => {
  return req.app.locals.db();
};

// Helper function for role-based authorization
const requireRole = (roles: string[]) => authorize(roles);

// Validation schemas
const chatMessageSchema = z.object({
  message: z.string().min(1).max(2000),
  conversation_id: z.string().uuid().optional(),
  context: z.record(z.string(), z.any()).optional()
});

const conversationSchema = z.object({
  title: z.string().max(200).optional(),
  context: z.record(z.string(), z.any()).optional()
});

const feedbackSchema = z.object({
  conversation_id: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  feedback: z.string().max(1000).optional(),
  helpful_responses: z.array(z.string().uuid()).optional(),
  improvement_suggestions: z.string().max(500).optional()
});

// AI Chatbot Response Templates and Logic
class MentalHealthChatbot {
  
  // Crisis keywords that trigger immediate escalation
  private static readonly CRISIS_KEYWORDS = [
    'suicide', 'kill myself', 'end it all', 'hurt myself', 'self harm', 'cutting',
    'overdose', 'worthless', 'hopeless', 'can\'t go on', 'want to die', 'better off dead'
  ];

  // Stress/anxiety keywords for contextual responses
  private static readonly STRESS_KEYWORDS = [
    'stress', 'stressed', 'anxiety', 'anxious', 'worried', 'panic', 'overwhelmed',
    'pressure', 'tense', 'nervous', 'exam', 'test', 'deadline', 'assignment'
  ];

  // Depression keywords for contextual responses  
  private static readonly DEPRESSION_KEYWORDS = [
    'sad', 'depressed', 'down', 'lonely', 'empty', 'tired', 'exhausted',
    'unmotivated', 'hopeless', 'worthless', 'isolated', 'withdrawn'
  ];

  // Sleep-related keywords
  private static readonly SLEEP_KEYWORDS = [
    'sleep', 'insomnia', 'tired', 'exhausted', 'can\'t sleep', 'sleepless',
    'nightmares', 'restless', 'sleep problems', 'wake up'
  ];

  // Relationship keywords
  private static readonly RELATIONSHIP_KEYWORDS = [
    'relationship', 'breakup', 'boyfriend', 'girlfriend', 'partner', 'love',
    'family', 'friends', 'social', 'lonely', 'conflict', 'argument'
  ];

  // Academic keywords
  private static readonly ACADEMIC_KEYWORDS = [
    'grades', 'study', 'exam', 'test', 'assignment', 'professor', 'class',
    'failing', 'academic', 'college', 'university', 'coursework', 'gpa'
  ];

  static detectCrisisIndicators(message: string): boolean {
    const lowerMessage = message.toLowerCase();
    return this.CRISIS_KEYWORDS.some(keyword => lowerMessage.includes(keyword));
  }

  static categorizeMessage(message: string): string[] {
    const lowerMessage = message.toLowerCase();
    const categories: string[] = [];

    if (this.STRESS_KEYWORDS.some(keyword => lowerMessage.includes(keyword))) {
      categories.push('stress_anxiety');
    }
    if (this.DEPRESSION_KEYWORDS.some(keyword => lowerMessage.includes(keyword))) {
      categories.push('depression');
    }
    if (this.SLEEP_KEYWORDS.some(keyword => lowerMessage.includes(keyword))) {
      categories.push('sleep');
    }
    if (this.RELATIONSHIP_KEYWORDS.some(keyword => lowerMessage.includes(keyword))) {
      categories.push('relationships');
    }
    if (this.ACADEMIC_KEYWORDS.some(keyword => lowerMessage.includes(keyword))) {
      categories.push('academic');
    }

    return categories.length > 0 ? categories : ['general'];
  }

  static generateResponse(message: string, categories: string[], userContext: any): {
    response: string;
    suggestions: string[];
    resources: string[];
    followUpQuestions: string[];
    requiresHumanSupport: boolean;
  } {
    const responses = {
      crisis: {
        response: "I'm really concerned about what you've shared with me. Your safety is the most important thing right now. I want to connect you with someone who can provide immediate support.",
        suggestions: [
          "Please reach out to a crisis counselor immediately",
          "Contact the National Suicide Prevention Lifeline: 988",
          "Go to your nearest emergency room if you're in immediate danger"
        ],
        resources: [
          "Crisis Text Line: Text HOME to 741741",
          "National Suicide Prevention Lifeline: 988",
          "Campus Counseling Center: Available 24/7"
        ],
        followUpQuestions: [
          "Would you like me to connect you with a counselor right now?",
          "Do you have someone you trust who can be with you?"
        ],
        requiresHumanSupport: true
      },
      stress_anxiety: {
        response: "It sounds like you're dealing with a lot of stress and anxiety right now. That must feel overwhelming. Remember that these feelings are valid, and there are effective ways to manage them.",
        suggestions: [
          "Try the 4-7-8 breathing technique: Inhale for 4, hold for 7, exhale for 8",
          "Practice grounding: Name 5 things you can see, 4 you can touch, 3 you can hear",
          "Take regular breaks from stressful activities",
          "Consider talking to a counselor about anxiety management techniques"
        ],
        resources: [
          "Guided meditation apps like Headspace or Calm",
          "Campus wellness center stress management workshops",
          "Online anxiety self-help resources"
        ],
        followUpQuestions: [
          "What specific situations tend to trigger your anxiety?",
          "Have you tried any relaxation techniques before?",
          "Would you be interested in scheduling a counseling session?"
        ],
        requiresHumanSupport: false
      },
      depression: {
        response: "I hear that you're going through a difficult time and feeling down. Depression can make everything feel harder, but please know that you're not alone and that these feelings can improve with support.",
        suggestions: [
          "Try to maintain a regular sleep schedule, even if it's difficult",
          "Engage in small, manageable activities that usually bring you joy",
          "Stay connected with supportive friends or family members",
          "Consider speaking with a mental health professional"
        ],
        resources: [
          "Campus counseling services for depression support",
          "Depression support groups",
          "Mental health apps with mood tracking features"
        ],
        followUpQuestions: [
          "How long have you been feeling this way?",
          "Have you been able to maintain your daily routines?",
          "Would you like to explore counseling options?"
        ],
        requiresHumanSupport: false
      },
      sleep: {
        response: "Sleep problems can really impact how we feel and function. Good sleep hygiene is crucial for mental health, and there are several strategies that can help improve your sleep quality.",
        suggestions: [
          "Establish a consistent bedtime routine",
          "Avoid screens for at least 1 hour before bed",
          "Keep your bedroom cool, dark, and quiet",
          "Avoid caffeine after 2 PM",
          "Try relaxation techniques like progressive muscle relaxation"
        ],
        resources: [
          "Sleep hygiene educational materials",
          "Meditation apps with sleep stories",
          "Campus health center sleep disorder resources"
        ],
        followUpQuestions: [
          "How many hours of sleep do you typically get?",
          "What time do you usually go to bed and wake up?",
          "Have you noticed any patterns in your sleep difficulties?"
        ],
        requiresHumanSupport: false
      },
      relationships: {
        response: "Relationship challenges can be really emotionally difficult. Whether it's with friends, family, or a romantic partner, healthy relationships require communication, boundaries, and sometimes professional guidance.",
        suggestions: [
          "Practice active listening and express your feelings clearly",
          "Set healthy boundaries and respect those of others",
          "Take time for self-care and maintain your individual identity",
          "Consider couples or family counseling if appropriate"
        ],
        resources: [
          "Relationship counseling services",
          "Communication skills workshops",
          "Books and articles on healthy relationships"
        ],
        followUpQuestions: [
          "Would you like to talk more about what's happening in your relationships?",
          "Have you been able to communicate your feelings to the other person?",
          "Would relationship counseling be something you'd consider?"
        ],
        requiresHumanSupport: false
      },
      academic: {
        response: "Academic stress is very common and can feel overwhelming. Remember that your worth isn't determined by grades, and there are resources available to help you succeed academically while maintaining your mental health.",
        suggestions: [
          "Break large projects into smaller, manageable tasks",
          "Use time management techniques like the Pomodoro method",
          "Seek help from professors, tutors, or study groups",
          "Remember to balance study time with self-care activities"
        ],
        resources: [
          "Academic support services and tutoring",
          "Time management workshops",
          "Study skills resources",
          "Academic counseling services"
        ],
        followUpQuestions: [
          "What specific academic challenges are you facing?",
          "Have you spoken with your professors about your concerns?",
          "Would you be interested in academic support services?"
        ],
        requiresHumanSupport: false
      },
      general: {
        response: "Thank you for reaching out. I'm here to listen and provide support. Sometimes just talking about what's on your mind can be helpful. Remember that seeking support is a sign of strength.",
        suggestions: [
          "Take some time for self-reflection about your feelings",
          "Practice self-compassion and be kind to yourself",
          "Stay connected with your support network",
          "Consider what specific areas of your life you'd like to focus on"
        ],
        resources: [
          "Mental health self-assessment tools",
          "General wellness resources",
          "Campus counseling services"
        ],
        followUpQuestions: [
          "What brings you here today? I'm here to listen.",
          "How have you been feeling lately?",
          "Is there something specific you'd like to talk about or work on?"
        ],
        requiresHumanSupport: false
      }
    };

    // Check for crisis first
    if (this.detectCrisisIndicators(message)) {
      return responses.crisis;
    }

    // Return response based on primary category
    const primaryCategory = categories[0] || 'general';
    return responses[primaryCategory as keyof typeof responses] || responses.general;
  }

  static async logConversationAnalytics(db: DatabaseConnection, conversationId: string, analysis: any): Promise<void> {
    try {
      await db.run(`
        INSERT INTO chatbot_analytics (
          conversation_id, categories, crisis_indicators, response_type, 
          user_satisfaction_predicted, created_at
        ) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `, [
        conversationId,
        JSON.stringify(analysis.categories),
        analysis.crisisDetected ? 1 : 0,
        analysis.responseType,
        analysis.predictedSatisfaction || 0.5
      ]);
    } catch (error) {
      console.error('Error logging chatbot analytics:', error);
    }
  }
}

// Start a new conversation
router.post('/conversations', authenticate, async (req: express.Request, res: express.Response) => {
  try {
    const validation = conversationSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: 'Invalid conversation data',
        errors: validation.error.issues
      });
    }

    const user = req.user!;
    const db = getDb(req);
    const data = validation.data;

    // Create new conversation
    const result = await db.run(`
      INSERT INTO chatbot_conversations (
        id, user_id, title, context, status, created_at
      ) VALUES (?, ?, ?, ?, 'active', CURRENT_TIMESTAMP)
    `, [
      randomUUID(),
      user.userId,
      data.title || 'New Conversation',
      JSON.stringify(data.context || {})
    ]);

    // Get the created conversation
    const conversation = await db.get(`
      SELECT id, title, status, created_at 
      FROM chatbot_conversations 
      WHERE id = ?
    `, [result.lastID]);

    res.status(201).json({
      success: true,
      message: 'Conversation started successfully',
      data: conversation
    });

  } catch (error) {
    console.error('Create conversation error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Send a message to the chatbot
router.post('/chat', authenticate, async (req: express.Request, res: express.Response) => {
  try {
    const validation = chatMessageSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: 'Invalid message data',
        errors: validation.error.issues
      });
    }

    const user = req.user!;
    const db = getDb(req);
    const data = validation.data;

    let conversationId = data.conversation_id;

    // Create new conversation if none provided
    if (!conversationId) {
      const newConversationId = randomUUID();
      const newConversation = await db.run(`
        INSERT INTO chatbot_conversations (
          id, user_id, title, context, status, created_at
        ) VALUES (?, ?, ?, ?, 'active', CURRENT_TIMESTAMP)
      `, [
        newConversationId,
        user.userId,
        'Chat Session',
        JSON.stringify({})
      ]);
      conversationId = newConversationId;
    }

    // Verify conversation belongs to user
    const conversation = await db.get(`
      SELECT id, context FROM chatbot_conversations 
      WHERE id = ? AND user_id = ?
    `, [conversationId, user.userId]);

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    // Get user context for personalized responses
    const userProfile = await db.get(`
      SELECT sp.name, sp.year_of_study, sp.major 
      FROM student_profiles sp 
      WHERE sp.user_id = ?
    `, [user.userId]);

    // Get recent conversation messages for context
    const recentMessages = await db.all(`
      SELECT sender_type, content, created_at
      FROM chatbot_messages 
      WHERE conversation_id = ? 
      ORDER BY created_at DESC 
      LIMIT 5
    `, [conversationId]);

    // Build context for ML service
    const mlContext = {
      userId: user.userId,
      conversationId: conversationId!,
      recentMessages: recentMessages.map(msg => ({
        role: msg.sender_type === 'user' ? 'user' as const : 'assistant' as const,
        content: msg.content,
        timestamp: new Date(msg.created_at)
      })),
      userProfile: {
        name: userProfile?.name,
        yearOfStudy: userProfile?.year_of_study,
        major: userProfile?.major
      },
      riskFactors: [], // Could be enhanced with user history
      sessionMetadata: JSON.parse(conversation.context || '{}')
    };

    // Generate enhanced ML response
    const mlResponse = await mlChatbotService.generateEnhancedResponse(
      data.message,
      mlContext,
      db
    );

    // For backward compatibility, map ML response to original format
    const aiResponse = {
      response: mlResponse.content,
      suggestions: mlResponse.suggestedActions.slice(0, 4), // Limit suggestions
      resources: [], // Will be populated by ML service
      followUpQuestions: [], // Embedded in response content
      requiresHumanSupport: mlResponse.detectedIntent.includes('crisis_intervention') || 
                           mlResponse.detectedIntent.includes('high_risk')
    };
    
    // Extract categories for backward compatibility
    const categories = mlResponse.detectedIntent;
    const crisisDetected = mlResponse.detectedIntent.includes('crisis_intervention');

    // Store user message
    const userMessageResult = await db.run(`
      INSERT INTO chatbot_messages (
        id, conversation_id, sender_type, content, message_type, 
        categories, created_at
      ) VALUES (?, ?, 'user', ?, 'text', ?, CURRENT_TIMESTAMP)
    `, [
      randomUUID(),
      conversationId,
      data.message,
      JSON.stringify(categories)
    ]);

    // Store bot response
    const botMessageResult = await db.run(`
      INSERT INTO chatbot_messages (
        id, conversation_id, sender_type, content, message_type,
        categories, metadata, created_at
      ) VALUES (?, ?, 'bot', ?, 'response', ?, ?, CURRENT_TIMESTAMP)
    `, [
      randomUUID(),
      conversationId,
      aiResponse.response,
      JSON.stringify(categories),
      JSON.stringify({
        suggestions: aiResponse.suggestions,
        resources: aiResponse.resources,
        followUpQuestions: aiResponse.followUpQuestions,
        requiresHumanSupport: aiResponse.requiresHumanSupport
      })
    ]);

    // Handle crisis situation
    if (crisisDetected || aiResponse.requiresHumanSupport) {
      // Mark conversation as requiring human support
      await db.run(`
        UPDATE chatbot_conversations 
        SET status = 'needs_human_support', requires_counselor_attention = 1 
        WHERE id = ?
      `, [conversationId]);

      // Create crisis alert if crisis detected
      if (crisisDetected) {
        await db.run(`
          INSERT INTO crisis_alerts (
            user_id, risk_level, risk_score, trigger_type, trigger_data,
            factors, recommendations, requires_immediate_attention,
            detected_by_user_id, status, created_at
          ) VALUES (?, 'critical', 80, 'manual', ?, ?, ?, 1, ?, 'new', CURRENT_TIMESTAMP)
        `, [
          user.userId,
          JSON.stringify({ source: 'chatbot', message: data.message }),
          JSON.stringify(['Crisis language detected in chatbot conversation']),
          JSON.stringify(['Immediate counselor intervention required']),
          user.userId
        ]);
      }
    }

    // Log analytics
    await MentalHealthChatbot.logConversationAnalytics(db, conversationId!, {
      categories,
      crisisDetected,
      responseType: aiResponse.requiresHumanSupport ? 'escalation' : 'support',
      predictedSatisfaction: 0.8 // Could be enhanced with ML
    });

    res.json({
      success: true,
      data: {
        conversationId,
        botResponse: {
          message: aiResponse.response,
          suggestions: aiResponse.suggestions,
          resources: aiResponse.resources,
          followUpQuestions: aiResponse.followUpQuestions,
          requiresHumanSupport: aiResponse.requiresHumanSupport
        },
        analysisResults: {
          categories,
          crisisDetected,
          humanSupportRecommended: aiResponse.requiresHumanSupport
        }
      }
    });

  } catch (error) {
    console.error('Chat message error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get conversation history
router.get('/conversations/:conversationId', authenticate, async (req: express.Request, res: express.Response) => {
  try {
    const { conversationId } = req.params;
    const user = req.user!;
    const db = getDb(req);
    const { include_messages = 'true', limit = '50' } = req.query;

    // Get conversation details
    const conversation = await db.get(`
      SELECT id, title, status, requires_counselor_attention, created_at, updated_at
      FROM chatbot_conversations 
      WHERE id = ? AND user_id = ?
    `, [conversationId, user.userId]);

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    let messages = [];
    if (include_messages === 'true') {
      // Get conversation messages
      messages = await db.all(`
        SELECT id, sender_type, content, message_type, categories, metadata, created_at
        FROM chatbot_messages 
        WHERE conversation_id = ? 
        ORDER BY created_at ASC 
        LIMIT ?
      `, [conversationId, parseInt(limit as string)]);

      // Parse JSON fields
      messages = messages.map((msg: any) => ({
        ...msg,
        categories: msg.categories ? JSON.parse(msg.categories) : [],
        metadata: msg.metadata ? JSON.parse(msg.metadata) : null
      }));
    }

    res.json({
      success: true,
      data: {
        conversation,
        messages,
        messageCount: messages.length
      }
    });

  } catch (error) {
    console.error('Get conversation error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get user's conversation list
router.get('/conversations', authenticate, async (req: express.Request, res: express.Response) => {
  try {
    const user = req.user!;
    const db = getDb(req);
    const { 
      page = '1', 
      limit = '10', 
      status,
      sort_by = 'updated_at',
      sort_order = 'desc'
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const offset = (pageNum - 1) * limitNum;

    // Build query conditions
    let whereClause = 'WHERE user_id = ?';
    const params: any[] = [user.userId];

    if (status) {
      whereClause += ' AND status = ?';
      params.push(status);
    }

    // Validate sort parameters
    const allowedSortFields = ['created_at', 'updated_at', 'title'];
    const sortField = allowedSortFields.includes(sort_by as string) ? sort_by : 'updated_at';
    const sortDir = sort_order === 'asc' ? 'ASC' : 'DESC';

    // Get total count
    const countResult = await db.get(`
      SELECT COUNT(*) as total FROM chatbot_conversations ${whereClause}
    `, params);

    // Get conversations
    const conversations = await db.all(`
      SELECT 
        id, title, status, requires_counselor_attention,
        created_at, updated_at,
        (SELECT COUNT(*) FROM chatbot_messages WHERE conversation_id = chatbot_conversations.id) as message_count,
        (SELECT content FROM chatbot_messages WHERE conversation_id = chatbot_conversations.id ORDER BY created_at DESC LIMIT 1) as last_message
      FROM chatbot_conversations 
      ${whereClause}
      ORDER BY ${sortField} ${sortDir}
      LIMIT ? OFFSET ?
    `, [...params, limitNum, offset]);

    res.json({
      success: true,
      data: {
        conversations,
        pagination: {
          currentPage: pageNum,
          totalPages: Math.ceil(countResult.total / limitNum),
          totalConversations: countResult.total,
          limit: limitNum
        }
      }
    });

  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Submit feedback for a conversation
router.post('/feedback', authenticate, async (req: express.Request, res: express.Response) => {
  try {
    const validation = feedbackSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: 'Invalid feedback data',
        errors: validation.error.issues
      });
    }

    const user = req.user!;
    const db = getDb(req);
    const data = validation.data;

    // Verify conversation belongs to user
    const conversation = await db.get(`
      SELECT id FROM chatbot_conversations 
      WHERE id = ? AND user_id = ?
    `, [data.conversation_id, user.userId]);

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    // Store feedback
    await db.run(`
      INSERT INTO chatbot_feedback (
        id, conversation_id, user_id, rating, feedback, 
        helpful_responses, improvement_suggestions, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `, [
      randomUUID(),
      data.conversation_id,
      user.userId,
      data.rating,
      data.feedback || null,
      JSON.stringify(data.helpful_responses || []),
      data.improvement_suggestions || null
    ]);

    res.json({
      success: true,
      message: 'Feedback submitted successfully'
    });

  } catch (error) {
    console.error('Submit feedback error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get chatbot analytics (admin/counselor only)
router.get('/analytics', authenticate, requireRole(['admin', 'counselor']), async (req: express.Request, res: express.Response) => {
  try {
    const user = req.user!;
    const db = getDb(req);
    const { period = '30' } = req.query;
    const days = parseInt(period as string);

    // Overall usage statistics
    const usageStats = await db.get(`
      SELECT 
        COUNT(DISTINCT cc.id) as total_conversations,
        COUNT(DISTINCT cc.user_id) as unique_users,
        COUNT(cm.id) as total_messages,
        AVG(
          (SELECT COUNT(*) FROM chatbot_messages WHERE conversation_id = cc.id)
        ) as avg_messages_per_conversation
      FROM chatbot_conversations cc
      LEFT JOIN chatbot_messages cm ON cc.id = cm.conversation_id
      JOIN users u ON cc.user_id = u.id
      WHERE cc.created_at > datetime('now', '-${days} days')
        AND u.institution_id = ?
    `, [user.institutionId]);

    // Crisis detection statistics
    const crisisStats = await db.get(`
      SELECT 
        COUNT(*) as conversations_with_crisis,
        COUNT(DISTINCT ca.conversation_id) as escalated_conversations
      FROM chatbot_analytics ca
      WHERE ca.crisis_indicators = 1 
        AND ca.created_at > datetime('now', '-${days} days')
    `);

    // Category breakdown
    const categoryStats = await db.all(`
      SELECT 
        categories,
        COUNT(*) as frequency
      FROM chatbot_analytics 
      WHERE created_at > datetime('now', '-${days} days')
      GROUP BY categories
      ORDER BY frequency DESC
      LIMIT 10
    `);

    // Daily usage trends
    const dailyTrends = await db.all(`
      SELECT 
        DATE(cc.created_at) as date,
        COUNT(cc.id) as conversations_started,
        COUNT(cm.id) as messages_sent
      FROM chatbot_conversations cc
      LEFT JOIN chatbot_messages cm ON cc.id = cm.conversation_id AND DATE(cm.created_at) = DATE(cc.created_at)
      JOIN users u ON cc.user_id = u.id
      WHERE cc.created_at > datetime('now', '-${days} days')
        AND u.institution_id = ?
      GROUP BY DATE(cc.created_at)
      ORDER BY date DESC
      LIMIT 30
    `, [user.institutionId]);

    // User satisfaction metrics
    const satisfactionStats = await db.get(`
      SELECT 
        AVG(rating) as average_rating,
        COUNT(*) as total_feedback,
        COUNT(CASE WHEN rating >= 4 THEN 1 END) as positive_feedback
      FROM chatbot_feedback cf
      JOIN chatbot_conversations cc ON cf.conversation_id = cc.id
      JOIN users u ON cc.user_id = u.id
      WHERE cf.created_at > datetime('now', '-${days} days')
        AND u.institution_id = ?
    `, [user.institutionId]);

    res.json({
      success: true,
      data: {
        period: `${days} days`,
        usageStatistics: usageStats,
        crisisDetection: crisisStats,
        topCategories: categoryStats.map((cat: any) => ({
          categories: cat.categories ? JSON.parse(cat.categories) : [],
          frequency: cat.frequency
        })),
        dailyTrends: dailyTrends.reverse(),
        userSatisfaction: {
          averageRating: satisfactionStats.average_rating ? 
            parseFloat(satisfactionStats.average_rating).toFixed(1) : null,
          totalFeedback: satisfactionStats.total_feedback || 0,
          positiveFeedback: satisfactionStats.positive_feedback || 0,
          satisfactionRate: satisfactionStats.total_feedback > 0 ?
            ((satisfactionStats.positive_feedback / satisfactionStats.total_feedback) * 100).toFixed(1) : null
        }
      }
    });

  } catch (error) {
    console.error('Get chatbot analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get conversations requiring human support (counselor/admin only)
router.get('/support-requests', authenticate, requireRole(['admin', 'counselor']), async (req: express.Request, res: express.Response) => {
  try {
    const user = req.user!;
    const db = getDb(req);
    const { 
      page = '1', 
      limit = '10',
      status = 'needs_human_support',
      priority = 'all'
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const offset = (pageNum - 1) * limitNum;

    // Build query conditions
    let whereClause = 'WHERE cc.requires_counselor_attention = 1 AND u.institution_id = ?';
    const params: any[] = [user.institutionId];

    if (status !== 'all') {
      whereClause += ' AND cc.status = ?';
      params.push(status);
    }

    // Get total count
    const countResult = await db.get(`
      SELECT COUNT(*) as total 
      FROM chatbot_conversations cc
      JOIN users u ON cc.user_id = u.id
      ${whereClause}
    `, params);

    // Get support requests
    const requests = await db.all(`
      SELECT 
        cc.id, cc.title, cc.status, cc.created_at, cc.updated_at,
        u.username, sp.name as student_name,
        (SELECT COUNT(*) FROM chatbot_messages WHERE conversation_id = cc.id) as message_count,
        (SELECT COUNT(*) FROM crisis_alerts WHERE user_id = cc.user_id AND created_at > cc.created_at) as related_alerts
      FROM chatbot_conversations cc
      JOIN users u ON cc.user_id = u.id
      LEFT JOIN student_profiles sp ON u.id = sp.user_id
      ${whereClause}
      ORDER BY cc.updated_at DESC
      LIMIT ? OFFSET ?
    `, [...params, limitNum, offset]);

    res.json({
      success: true,
      data: {
        requests,
        pagination: {
          currentPage: pageNum,
          totalPages: Math.ceil(countResult.total / limitNum),
          totalRequests: countResult.total,
          limit: limitNum
        }
      }
    });

  } catch (error) {
    console.error('Get support requests error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

export default router;