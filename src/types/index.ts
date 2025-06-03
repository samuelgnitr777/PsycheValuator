
export type QuestionType = 'multiple-choice' | 'rating-scale' | 'open-ended';

export interface QuestionOption {
  id: string;
  text: string;
}

export interface Question {
  id: string;
  text: string;
  type: QuestionType;
  options?: QuestionOption[]; // For multiple-choice
  scaleMin?: number;         // For rating-scale
  scaleMax?: number;         // For rating-scale
  minLabel?: string;         // For rating-scale (e.g., "Strongly Disagree")
  maxLabel?: string;         // For rating-scale (e.g., "Strongly Agree")
}

export interface Test {
  id: string;
  title: string;
  description: string;
  questions: Question[];
}

export interface UserAnswer {
  questionId: string;
  value: string | number; // Store answer value, could be option ID, rating, or text
}

export interface TestSubmission {
  id: string; // Unique ID for the submission
  testId: string;
  fullName: string; // User's full name
  answers: UserAnswer[];
  timeTaken: number; // in seconds
  submittedAt: string; // ISO string for submission timestamp
  analysisStatus: 'pending_ai' | 'ai_completed' | 'ai_failed_pending_manual' | 'manual_review_completed';
  psychologicalTraits?: string; // From AI or manual review
  aiError?: string; // If AI errored (e.g. 503, or flow error)
  manualAnalysisNotes?: string; // For admin's manual review
}
