
'use server';

import { revalidatePath } from 'next/cache';
import { 
  createTest as createTestData, 
  deleteTest as deleteTestData, 
  updateTest as updateTestData, 
  addQuestionToTest as addQuestionToTestData, 
  updateQuestionInTest as updateQuestionInTestData, 
  deleteQuestionFromTest as deleteQuestionFromTestData,
  updateTestPublicationStatus 
} from '@/lib/dataService';
import type { Test, Question } from '@/types';

export async function createTestAction(data: Omit<Test, 'id' | 'questions' | 'isPublished'>) {
  try {
    const newTest = await createTestData(data);
    revalidatePath('/admin/dashboard/tests');
    revalidatePath('/'); 
    // Navigating to the edit page, which is force-dynamic, should fetch fresh data.
    return { success: true, test: newTest };
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : 'Gagal membuat tes' };
  }
}

export async function updateTestAction(id: string, data: Partial<Omit<Test, 'id' | 'questions' | 'isPublished'>>) {
  try {
    const updatedTest = await updateTestData(id, data);
    if (!updatedTest) {
      return { success: false, message: 'Tes tidak ditemukan' };
    }
    revalidatePath('/admin/dashboard/tests'); // Revalidate the list page
    revalidatePath(`/admin/dashboard/tests/${id}/edit`); // Revalidate the current edit page
    revalidatePath(`/tests/${id}`); // Revalidate the public test page
    revalidatePath('/'); // Revalidate the homepage
    return { success: true, test: updatedTest };
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : 'Gagal memperbarui tes' };
  }
}

export async function deleteTestAction(id: string) {
  try {
    const success = await deleteTestData(id);
    if (!success) {
      return { success: false, message: 'Tes tidak ditemukan atau tidak dapat dihapus' };
    }
    revalidatePath('/admin/dashboard/tests');
    revalidatePath('/');
    // Also revalidate any specific test pages if they were cached, though deletion makes them 404.
    return { success: true };
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : 'Gagal menghapus tes' };
  }
}

export async function toggleTestPublicationAction(testId: string, newStatus: boolean) {
  try {
    const updatedTest = await updateTestPublicationStatus(testId, newStatus);
    if (!updatedTest) {
      return { success: false, message: 'Tes tidak ditemukan' };
    }
    revalidatePath('/admin/dashboard/tests'); // Revalidate the list page
    revalidatePath('/'); // Revalidate homepage
    revalidatePath(`/tests/${testId}`); // Revalidate the public test page
    return { success: true, test: updatedTest };
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : 'Gagal memperbarui status publikasi tes' };
  }
}

export async function addQuestionAction(testId: string, questionData: Omit<Question, 'id'>) {
  try {
    const newQuestion = await addQuestionToTestData(testId, questionData);
    if (!newQuestion) {
      return { success: false, message: 'Tes tidak ditemukan atau gagal menambah pertanyaan' };
    }
    revalidatePath(`/admin/dashboard/tests/${testId}/edit`); // Revalidate the edit page (questions tab)
    revalidatePath(`/tests/${testId}`); // Revalidate public test page as question count changes
    return { success: true, question: newQuestion };
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : 'Gagal menambah pertanyaan' };
  }
}

export async function updateQuestionAction(testId: string, questionId: string, questionData: Partial<Omit<Question, 'id'>>) {
   try {
    const updatedQuestion = await updateQuestionInTestData(testId, questionId, questionData);
    if (!updatedQuestion) {
      return { success: false, message: 'Pertanyaan tidak ditemukan atau gagal memperbarui' };
    }
    revalidatePath(`/admin/dashboard/tests/${testId}/edit`);
    revalidatePath(`/tests/${testId}`);
    return { success: true, question: updatedQuestion };
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : 'Gagal memperbarui pertanyaan' };
  }
}

export async function deleteQuestionAction(testId: string, questionId: string) {
  try {
    const success = await deleteQuestionFromTestData(testId, questionId);
    if (!success) {
      return { success: false, message: 'Pertanyaan tidak ditemukan atau tidak dapat dihapus' };
    }
    revalidatePath(`/admin/dashboard/tests/${testId}/edit`);
    revalidatePath(`/tests/${testId}`);
    return { success: true };
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : 'Gagal menghapus pertanyaan' };
  }
}
