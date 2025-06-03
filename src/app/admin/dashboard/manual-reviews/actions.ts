
'use server';

import { revalidatePath } from 'next/cache';
import { updateSubmissionAdmin } from '@/lib/dataService';
import type { TestSubmission } from '@/types';

export type ManualReviewUpdatePayload = {
  manualAnalysisNotes?: string | null;
  analysisStatus?: TestSubmission['analysisStatus'];
};

export async function updateManualReviewAction(submissionId: string, payload: ManualReviewUpdatePayload) {
  try {
    const updatedSubmission = await updateSubmissionAdmin(submissionId, payload);
    if (!updatedSubmission) {
      return { success: false, message: 'Pengiriman tidak ditemukan atau gagal diperbarui.' };
    }
    revalidatePath('/admin/dashboard/manual-reviews', 'page');
    revalidatePath(`/admin/dashboard/manual-reviews/${submissionId}`, 'page');
    revalidatePath(`/tests/${updatedSubmission.testId}/results/${submissionId}`, 'page'); // Revalidate public results page
    return { success: true, submission: updatedSubmission };
  } catch (error) {
    console.error("Error in updateManualReviewAction:", error);
    return { success: false, message: error instanceof Error ? error.message : 'Gagal memperbarui tinjauan manual.' };
  }
}
