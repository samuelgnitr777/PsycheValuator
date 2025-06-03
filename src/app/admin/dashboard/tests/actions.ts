'use server';

import { revalidatePath } from 'next/cache';
import { createTest as createTestData, deleteTest as deleteTestData, updateTest as updateTestData, addQuestionToTest as addQuestionToTestData, updateQuestionInTest as updateQuestionInTestData, deleteQuestionFromTest as deleteQuestionFromTestData } from '@/lib/dataService';
import type { Test, Question } from '@/types';

export async function createTestAction(data: Omit<Test, 'id' | 'questions'>) {
  try {
    const newTest = await createTestData(data);
    revalidatePath('/admin/dashboard/tests');
    revalidatePath('/'); // Revalidate home page as well
    return { success: true, test: newTest };
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : 'Failed to create test' };
  }
}

export async function updateTestAction(id: string, data: Partial<Omit<Test, 'id' | 'questions'>>) {
  try {
    const updatedTest = await updateTestData(id, data);
    if (!updatedTest) {
      return { success: false, message: 'Test not found' };
    }
    revalidatePath('/admin/dashboard/tests');
    revalidatePath(`/admin/dashboard/tests/${id}/edit`);
    revalidatePath(`/tests/${id}`); // Revalidate public test page
    revalidatePath('/');
    return { success: true, test: updatedTest };
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : 'Failed to update test' };
  }
}

export async function deleteTestAction(id: string) {
  try {
    const success = await deleteTestData(id);
    if (!success) {
      return { success: false, message: 'Test not found or could not be deleted' };
    }
    revalidatePath('/admin/dashboard/tests');
    revalidatePath('/');
    return { success: true };
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : 'Failed to delete test' };
  }
}

export async function addQuestionAction(testId: string, questionData: Omit<Question, 'id'>) {
  try {
    const newQuestion = await addQuestionToTestData(testId, questionData);
    if (!newQuestion) {
      return { success: false, message: 'Test not found or failed to add question' };
    }
    revalidatePath(`/admin/dashboard/tests/${testId}/edit`);
    revalidatePath(`/tests/${testId}`);
    return { success: true, question: newQuestion };
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : 'Failed to add question' };
  }
}

export async function updateQuestionAction(testId: string, questionId: string, questionData: Partial<Omit<Question, 'id'>>) {
   try {
    const updatedQuestion = await updateQuestionInTestData(testId, questionId, questionData);
    if (!updatedQuestion) {
      return { success: false, message: 'Question not found or failed to update' };
    }
    revalidatePath(`/admin/dashboard/tests/${testId}/edit`);
    revalidatePath(`/tests/${testId}`);
    return { success: true, question: updatedQuestion };
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : 'Failed to update question' };
  }
}

export async function deleteQuestionAction(testId: string, questionId: string) {
  try {
    const success = await deleteQuestionFromTestData(testId, questionId);
    if (!success) {
      return { success: false, message: 'Question not found or could not be deleted' };
    }
    revalidatePath(`/admin/dashboard/tests/${testId}/edit`);
    revalidatePath(`/tests/${testId}`);
    return { success: true };
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : 'Failed to delete question' };
  }
}
