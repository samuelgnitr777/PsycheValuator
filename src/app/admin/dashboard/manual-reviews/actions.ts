
'use server';

import { revalidatePath } from 'next/cache';
import { updateSubmissionAdmin, getSubmissionByIdAdmin, getTestByIdAdmin } from '@/lib/dataService';
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
    revalidatePath(`/tests/${updatedSubmission.testId}/results/${submissionId}`, 'page'); 
    return { success: true, submission: updatedSubmission };
  } catch (error) {
    console.error("Error in updateManualReviewAction:", error);
    return { success: false, message: error instanceof Error ? error.message : 'Gagal memperbarui tinjauan manual.' };
  }
}

export async function sendEmailNotificationAction(submissionId: string) {
  try {
    const submission = await getSubmissionByIdAdmin(submissionId);
    if (!submission) {
      return { success: false, message: 'Pengiriman tidak ditemukan untuk mengirim email.' };
    }
    if (!submission.manualAnalysisNotes || submission.manualAnalysisNotes.trim() === '') {
        return { success: false, message: 'Tidak ada catatan analisis manual untuk dikirim. Silakan tulis dan simpan catatan terlebih dahulu.' };
    }
    if (submission.analysisStatus !== 'manual_review_completed') {
        return { success: false, message: 'Status analisis harus "Manual Selesai" untuk mengirim email. Harap perbarui dan simpan statusnya.' };
    }


    const test = await getTestByIdAdmin(submission.testId);
    if (!test) {
        return { success: false, message: `Tes dengan ID ${submission.testId} tidak ditemukan.` };
    }

    const emailRecipient = submission.email;
    const emailSubject = `Hasil Tinjauan Manual Tes Anda: ${test.title}`;
    const emailBody = `
Halo ${submission.fullName},

Berikut adalah hasil tinjauan manual untuk tes "${test.title}" yang telah Anda ikuti:

---
${submission.manualAnalysisNotes}
---

Jika Anda memiliki pertanyaan lebih lanjut, silakan hubungi administrator.

Terima kasih,
Tim PsycheValuator
    `;

    // SIMULASI PENGIRIMAN EMAIL
    console.log("--- SIMULASI PENGIRIMAN EMAIL ---");
    console.log("Kepada:", emailRecipient);
    console.log("Subjek:", emailSubject);
    console.log("Isi Email:\n", emailBody);
    console.log("--- AKHIR SIMULASI PENGIRIMAN EMAIL ---");

    // Di sini Anda akan mengintegrasikan layanan pengiriman email sebenarnya (misalnya, Nodemailer, SendGrid, dll.)
    // Untuk sekarang, kita anggap berhasil jika logging berhasil.

    // Anda mungkin ingin menandai bahwa email telah dikirim, misalnya dengan field baru di tabel submissions
    // atau hanya mengandalkan status 'manual_review_completed'. Untuk saat ini, tidak ada pembaruan DB tambahan.

    revalidatePath(`/admin/dashboard/manual-reviews/${submissionId}`, 'page');
    return { success: true, message: `Simulasi pengiriman email ke ${emailRecipient} berhasil dicatat di konsol server.` };

  } catch (error) {
    console.error("Error in sendEmailNotificationAction:", error);
    const errorMessage = error instanceof Error ? error.message : 'Gagal mengirim notifikasi email (simulasi).';
    // Tambahkan logging spesifik jika error berasal dari fetch data
    if (errorMessage.includes('Pengiriman tidak ditemukan') || errorMessage.includes('Tes dengan ID') || errorMessage.includes('catatan analisis manual')) {
        // Error ini sudah cukup deskriptif dari pemeriksaan di atas
    } else {
        // Error umum
        console.error("Detail error:", JSON.stringify(error, Object.getOwnPropertyNames(error)));
    }
    return { success: false, message: errorMessage };
  }
}
