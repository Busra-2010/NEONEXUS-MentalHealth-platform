import { apiClient, API_CONFIG } from './api';
import {
  ChatSessionResponse,
  ChatMessageResponse,
  ScreeningStartResponse,
  ScreeningAnswerResponse,
  ScreeningType,
  Language,
} from '../types';

/**
 * Chat API Service
 *
 * Wraps all /api/chat/* backend endpoints with typed calls.
 * Uses the shared apiClient (handles auth headers, timeouts, errors).
 */

const EP = API_CONFIG.ENDPOINTS;

/**
 * Create a new anonymous chat session.
 * Returns a UUID sessionId that must be passed to every subsequent call.
 */
export async function createSession(): Promise<ChatSessionResponse> {
  return apiClient.post<ChatSessionResponse>(EP.CHAT_SESSION);
}

/**
 * Send a user message and receive a bot reply with intent + crisis info.
 */
export async function sendMessage(
  sessionId: string,
  message: string,
  language: Language = 'en'
): Promise<ChatMessageResponse> {
  return apiClient.post<ChatMessageResponse>(EP.CHAT_MESSAGE, {
    sessionId,
    message,
    language,
  });
}

/**
 * Start a standardized screening flow (PHQ9, GAD7, or GHQ12).
 * Returns the first question + metadata.
 */
export async function startScreening(
  sessionId: string,
  screeningType: ScreeningType,
  language: Language = 'en'
): Promise<ScreeningStartResponse> {
  return apiClient.post<ScreeningStartResponse>(EP.CHAT_SCREENING_START, {
    sessionId,
    screeningType,
    language,
  });
}

/**
 * Submit an answer (0-3) for the current screening question.
 * Returns the next question, or the final score + severity when done.
 */
export async function submitScreeningAnswer(
  sessionId: string,
  screeningType: ScreeningType,
  questionIndex: number,
  answer: number,
  language: Language = 'en'
): Promise<ScreeningAnswerResponse> {
  return apiClient.post<ScreeningAnswerResponse>(EP.CHAT_SCREENING_ANSWER, {
    sessionId,
    screeningType,
    questionIndex,
    answer,
    language,
  });
}

/**
 * Retrieve past screening results for the given session.
 */
export async function getScreeningResults(sessionId: string): Promise<any> {
  return apiClient.get(`${EP.CHAT_SCREENING_RESULTS}/${sessionId}`);
}
