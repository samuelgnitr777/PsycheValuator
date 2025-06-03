
'use server';

import { revalidatePath } from 'next/cache';
import { 
  createTestAdmin, 
  deleteTestAdmin, 
  updateTestAdmin, 
  addQuestionToTestAdmin, 
  updateQuestionInTestAdmin, 
  deleteQuestionFromTestAdmin,
  updateTestPublicationStatusAdmin 
} from '@/lib/dataService'; // Updated to use Admin functions
import type { Test, Question } from '@/types';

export async function createTestAction(data: Omit<Test, 'id' | 'questions' | 'isPublished'>) {
  try {
    const newTest = await createTestAdmin(data); // Use admin function
    revalidatePath('/admin/dashboard/tests', 'layout');
    revalidatePath('/', 'layout'); 
    return { success: true, test: newTest };
  } catch (error) {
    console.error("Error in createTestAction:", error);
    return { success: false, message: error instanceof Error ? error.message : 'Gagal membuat tes' };
  }
}

export async function updateTestAction(id: string, data: Partial<Omit<Test, 'id' | 'questions' | 'isPublished'>>) {
  try {
    const updatedTest = await updateTestAdmin(id, data); // Use admin function
    if (!updatedTest) {
      return { success: false, message: 'Tes tidak ditemukan' };
    }
    revalidatePath('/admin/dashboard/tests', 'page'); 
    revalidatePath(`/admin/dashboard/tests/${id}/edit`, 'page'); 
    revalidatePath(`/tests/${id}`, 'page'); 
    revalidatePath('/', 'page');
    return { success: true, test: updatedTest };
  } catch (error) {
    console.error("Error in updateTestAction:", error);
    return { success: false, message: error instanceof Error ? error.message : 'Gagal memperbarui tes' };
  }
}

export async function deleteTestAction(id: string) {
  try {
    const success = await deleteTestAdmin(id); // Use admin function
    if (!success) {
      return { success: false, message: 'Tes tidak ditemukan atau tidak dapat dihapus' };
    }
    revalidatePath('/admin/dashboard/tests', 'layout');
    revalidatePath('/', 'layout');
    return { success: true };
  } catch (error) {
    console.error("Error in deleteTestAction:", error);
    return { success: false, message: error instanceof Error ? error.message : 'Gagal menghapus tes' };
  }
}

export async function toggleTestPublicationAction(testId: string, newStatus: boolean) {
  try {
    const updatedTest = await updateTestPublicationStatusAdmin(testId, newStatus); // Use admin function
    if (!updatedTest) {
      return { success: false, message: 'Tes tidak ditemukan' };
    }
    revalidatePath('/admin/dashboard/tests', 'layout'); 
    revalidatePath('/', 'layout'); 
    revalidatePath(`/tests/${testId}`, 'page');
    return { success: true, test: updatedTest };
  } catch (error) {
    console.error("Error in toggleTestPublicationAction:", error);
    return { success: false, message: error instanceof Error ? error.message : 'Gagal memperbarui status publikasi tes' };
  }
}

export async function addQuestionAction(testId: string, questionData: Omit<Question, 'id'>) {
  try {
    const newQuestion = await addQuestionToTestAdmin(testId, questionData); // Use admin function
    if (!newQuestion) {
      return { success: false, message: 'Tes tidak ditemukan atau gagal menambah pertanyaan' };
    }
    revalidatePath(`/admin/dashboard/tests/${testId}/edit`, 'page'); 
    revalidatePath(`/tests/${testId}`, 'page'); 
    return { success: true, question: newQuestion };
  } catch (error) {
    console.error("Error in addQuestionAction:", error);
    return { success: false, message: error instanceof Error ? error.message : 'Gagal menambah pertanyaan' };
  }
}

export async function updateQuestionAction(testId: string, questionId: string, questionData: Partial<Omit<Question, 'id'>>) {
   try {
    const updatedQuestion = await updateQuestionInTestAdmin(testId, questionId, questionData); // Use admin function
    if (!updatedQuestion) {
      return { success: false, message: 'Pertanyaan tidak ditemukan atau gagal memperbarui' };
    }
    revalidatePath(`/admin/dashboard/tests/${testId}/edit`, 'page');
    revalidatePath(`/tests/${testId}`, 'page');
    return { success: true, question: updatedQuestion };
  } catch (error)
{
    console.error("Error in updateQuestionAction:", error);
    return { success: false, message: error instanceof Error ? error.message : 'Gagal memperbarui pertanyaan' };
  }
}

export async function deleteQuestionAction(testId: string, questionId: string) {
  try {
    const success = await deleteQuestionFromTestAdmin(testId, questionId); // Use admin function
    if (!success) {
      return { success: false, message: 'Pertanyaan tidak ditemukan atau tidak dapat dihapus' };
    }
    revalidatePath(`/admin/dashboard/tests/${testId}/edit`, 'page');
    revalidatePath(`/tests/${testId}`, 'page');
    return { success: true };
  } catch (error) {
    console.error("Error in deleteQuestionAction:", error);
    return { success: false, message: error instanceof Error ? error.message : 'Gagal menghapus pertanyaan' };
  }
}
