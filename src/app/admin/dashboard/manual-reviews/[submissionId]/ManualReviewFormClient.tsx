
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from '@/hooks/use-toast';
import { Save, Loader2, Send, Mail } from 'lucide-react';
import type { TestSubmission } from '@/types';
import type { ManualReviewUpdatePayload } from '../actions';

const manualReviewSchema = z.object({
  manualAnalysisNotes: z.string().optional(),
  analysisStatus: z.enum(['pending_ai', 'ai_completed', 'ai_failed_pending_manual', 'manual_review_completed']),
});

type ManualReviewFormValues = z.infer<typeof manualReviewSchema>;

interface ManualReviewFormClientProps {
  submissionId: string;
  submissionEmail: string;
  submissionFullName: string;
  testTitle: string;
  initialNotes: string;
  initialStatus: TestSubmission['analysisStatus'];
  updateAction: (submissionId: string, payload: ManualReviewUpdatePayload) => Promise<{ success: boolean; message?: string; submission?: TestSubmission }>;
  sendEmailAction: (submissionId: string) => Promise<{ success: boolean; message?: string }>;
}

const availableStatusesForAdmin: { value: TestSubmission['analysisStatus']; label: string }[] = [
  { value: 'manual_review_completed', label: 'Manual Selesai' },
  { value: 'ai_failed_pending_manual', label: 'AI Gagal (Tinjau Ulang)' },
  { value: 'ai_completed', label: 'AI Selesai (Setuju dengan AI)' },
  { value: 'pending_ai', label: 'Menunggu AI (Set Ulang)' },
];

export default function ManualReviewFormClient({
  submissionId,
  submissionEmail,
  submissionFullName,
  testTitle,
  initialNotes,
  initialStatus,
  updateAction,
  sendEmailAction,
}: ManualReviewFormClientProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmittingForm, setIsSubmittingForm] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  const form = useForm<ManualReviewFormValues>({
    resolver: zodResolver(manualReviewSchema),
    defaultValues: {
      manualAnalysisNotes: initialNotes,
      analysisStatus: initialStatus,
    },
  });
  
  useEffect(() => {
    form.reset({
        manualAnalysisNotes: initialNotes,
        analysisStatus: initialStatus,
    });
  }, [initialNotes, initialStatus, form]);


  const onFormSubmit = async (data: ManualReviewFormValues) => {
    setIsSubmittingForm(true);
    const payload: ManualReviewUpdatePayload = {
      manualAnalysisNotes: data.manualAnalysisNotes,
      analysisStatus: data.analysisStatus,
    };

    const result = await updateAction(submissionId, payload);
    setIsSubmittingForm(false);

    if (result.success && result.submission) {
      toast({
        title: 'Tinjauan Disimpan',
        description: `Catatan dan status untuk pengiriman telah diperbarui.`,
      });
      router.refresh(); 
    } else {
      toast({
        title: 'Error Menyimpan Tinjauan',
        description: result.message || 'Tidak dapat menyimpan perubahan.',
        variant: 'destructive',
      });
    }
  };

  const handleSendEmail = async () => {
    setIsSendingEmail(true);
    const result = await sendEmailAction(submissionId);
    setIsSendingEmail(false);

    if (result.success) {
      toast({
        title: 'Email "Dikirim"',
        description: result.message || `Email notifikasi hasil tinjauan manual untuk ${submissionFullName} telah dicatat untuk dikirim (simulasi).`,
      });
      router.refresh(); // Refresh to potentially reflect any status changes if action modifies submission
    } else {
      toast({
        title: 'Error Mengirim Email',
        description: result.message || 'Tidak dapat mengirim email (simulasi).',
        variant: 'destructive',
      });
    }
  };

  const canSendEmail = initialNotes && initialNotes.trim() !== '' && initialStatus === 'manual_review_completed';

  return (
    <Card className="sticky top-24">
      <CardHeader>
        <CardTitle>Form Tinjauan Manual</CardTitle>
        <CardDescription>Tambahkan catatan analisis Anda dan perbarui status pengiriman. Anda juga dapat mengirim hasil via email setelah catatan disimpan dan status "Manual Selesai".</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onFormSubmit)} className="space-y-6">
          <div>
            <Label htmlFor="manualAnalysisNotes">Catatan Analisis Manual</Label>
            <Textarea
              id="manualAnalysisNotes"
              {...form.register('manualAnalysisNotes')}
              placeholder="Masukkan catatan analisis Anda di sini..."
              rows={10}
              className="mt-1"
            />
            {form.formState.errors.manualAnalysisNotes && (
              <p className="text-sm text-destructive mt-1">{form.formState.errors.manualAnalysisNotes.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="analysisStatus">Status Analisis</Label>
            <Controller
              control={form.control}
              name="analysisStatus"
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger id="analysisStatus" className="mt-1">
                    <SelectValue placeholder="Pilih status baru..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availableStatusesForAdmin.map(status => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {form.formState.errors.analysisStatus && (
              <p className="text-sm text-destructive mt-1">{form.formState.errors.analysisStatus.message}</p>
            )}
          </div>

          <Button type="submit" disabled={isSubmittingForm} className="w-full">
            {isSubmittingForm ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            {isSubmittingForm ? 'Menyimpan...' : 'Simpan Tinjauan'}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex-col items-stretch space-y-3 pt-6 border-t">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button 
                variant="outline" 
                className="w-full" 
                disabled={!canSendEmail || isSendingEmail}
                title={!canSendEmail ? "Simpan catatan dan set status ke 'Manual Selesai' untuk mengaktifkan." : `Kirim email ke ${submissionEmail}`}
              >
                {isSendingEmail ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Send className="mr-2 h-4 w-4" />
                )}
                {isSendingEmail ? 'Mengirim Email...' : 'Kirim Hasil ke Email Peserta'}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Konfirmasi Pengiriman Email</AlertDialogTitle>
                <AlertDialogDescription>
                  Anda akan mengirimkan hasil tinjauan manual untuk tes <span className="font-semibold">{testTitle}</span> kepada <span className="font-semibold">{submissionFullName}</span> (<span className="font-semibold">{submissionEmail}</span>).
                  <br />
                  Catatan yang akan dikirim adalah catatan yang sudah <span className='font-semibold'>tersimpan</span>. Pastikan catatan terbaru sudah disimpan.
                  <br /><br />
                  Apakah Anda yakin ingin melanjutkan? (Ini adalah simulasi pengiriman)
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Batal</AlertDialogCancel>
                <AlertDialogAction onClick={handleSendEmail} disabled={isSendingEmail} className="bg-primary hover:bg-primary/90">
                  Ya, Kirim Email (Simulasi)
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          {!canSendEmail && (
             <p className="text-xs text-muted-foreground text-center">
                Untuk mengirim email, pastikan ada catatan manual yang <span className="font-semibold">tersimpan</span> dan status analisis adalah <span className="font-semibold">"Manual Selesai"</span>.
            </p>
          )}
      </CardFooter>
    </Card>
  );
}
