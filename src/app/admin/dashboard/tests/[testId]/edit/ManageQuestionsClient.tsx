'use client';

import { QuestionList } from '@/components/admin/QuestionList';
import type { QuestionFormValues } from '@/components/admin/QuestionForm';
import type { Test, Question } from '@/types';

interface ManageQuestionsClientProps {
  test: Test;
  addQuestionAction: (testId: string, questionData: QuestionFormValues) => Promise<{ success: boolean; message?: string; question?: Question }>;
  updateQuestionAction: (testId: string, questionId: string, questionData: Partial<QuestionFormValues>) => Promise<{ success: boolean; message?: string; question?: Question }>;
  deleteQuestionAction: (testId: string, questionId: string) => Promise<{ success: boolean; message?: string }>;
}

export default function ManageQuestionsClient({ 
  test, 
  addQuestionAction, 
  updateQuestionAction, 
  deleteQuestionAction 
}: ManageQuestionsClientProps) {
  // The QuestionList component itself handles client-side interactions (modals, submissions)
  // and calls these server actions. The revalidation in server actions should update the UI.
  return (
    <QuestionList
      testId={test.id}
      questions={test.questions}
      onAddQuestion={addQuestionAction}
      onUpdateQuestion={updateQuestionAction}
      onDeleteQuestion={deleteQuestionAction}
    />
  );
}
