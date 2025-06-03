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
  testId: string;
  answers: UserAnswer[];
  timeTaken: number; // in seconds
}
