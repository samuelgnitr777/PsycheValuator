
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Save, Loader2 } from 'lucide-react';
import type { TestSubmission } from '@/types';
import type { ManualReviewUpdatePayload } from '../actions';

const manualReviewSchema = z.object({
  manualAnalysisNotes: z.string().optional(),
  analysisStatus: z.enum(['pending_ai', 'ai_completed', 'ai_failed_pending_manual', 'manual_review_completed']),
});

type ManualReviewFormValues = z.infer<typeof manualReviewSchema>;

interface ManualReviewFormClientProps {
  submissionId: string;
  initialNotes: string;
  initialStatus: TestSubmission['analysisStatus'];
  updateAction: (submissionId: string, payload: ManualReviewUpdatePayload) => Promise<{ success: boolean; message?: string; submission?: TestSubmission }>;
}

const availableStatusesForAdmin: { value: TestSubmission['analysisStatus']; label: string }[] = [
  { value: 'manual_review_completed', label: 'Manual Selesai' },
  { value: 'ai_failed_pending_manual', label: 'AI Gagal (Tinjau Ulang)' },
  { value: 'ai_completed', label: 'AI Selesai (Setuju dengan AI)' },
  { value: 'pending_ai', label: 'Menunggu AI (Set Ulang)' }, // Might be useful to reset
];

export default function ManualReviewFormClient({
  submissionId,
  initialNotes,
  initialStatus,
  updateAction,
}: ManualReviewFormClientProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

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


  const onSubmit = async (data: ManualReviewFormValues) => {
    setIsSubmitting(true);
    const payload: ManualReviewUpdatePayload = {
      manualAnalysisNotes: data.manualAnalysisNotes,
      analysisStatus: data.analysisStatus,
    };

    const result = await updateAction(submissionId, payload);
    setIsSubmitting(false);

    if (result.success && result.submission) {
      toast({
        title: 'Tinjauan Disimpan',
        description: `Catatan dan status untuk pengiriman telah diperbarui.`,
      });
      router.refresh(); // Refresh to show updated data on the page
    } else {
      toast({
        title: 'Error Menyimpan Tinjauan',
        description: result.message || 'Tidak dapat menyimpan perubahan.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Card className="sticky top-24">
      <CardHeader>
        <CardTitle>Form Tinjauan Manual</CardTitle>
        <CardDescription>Tambahkan catatan analisis Anda dan perbarui status pengiriman.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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

          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            {isSubmitting ? 'Menyimpan...' : 'Simpan Tinjauan'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
