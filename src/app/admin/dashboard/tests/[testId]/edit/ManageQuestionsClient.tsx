
'use client';

import { useRouter } from 'next/navigation';
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
  const router = useRouter();

  const handleAddQuestion = async (testId: string, data: QuestionFormValues) => {
    const result = await addQuestionAction(testId, data);
    if (result.success) {
      router.refresh(); // Force refresh to get new question list
    }
    return result; // Return result for QuestionList to handle toast
  };

  const handleUpdateQuestion = async (testId: string, questionId: string, data: Partial<QuestionFormValues>) => {
    const result = await updateQuestionAction(testId, questionId, data);
    if (result.success) {
      router.refresh(); // Force refresh
    }
    return result;
  };

  const handleDeleteQuestion = async (testId: string, questionId: string) => {
    const result = await deleteQuestionAction(testId, questionId);
    if (result.success) {
      router.refresh(); // Force refresh
    }
    return result;
  };

  return (
    <QuestionList
      testId={test.id}
      questions={test.questions}
      onAddQuestion={handleAddQuestion}
      onUpdateQuestion={handleUpdateQuestion}
      onDeleteQuestion={handleDeleteQuestion}
    />
  );
}

