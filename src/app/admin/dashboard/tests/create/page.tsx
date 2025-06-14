
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { TestForm } from '@/components/admin/TestForm';
import { createTestAction } from '../actions';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, PlusCircle } from 'lucide-react';

export default function CreateTestPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (data: { title: string; description: string }) => {
    setIsSubmitting(true);
    const result = await createTestAction(data);
    setIsSubmitting(false);

    if (result.success && result.test) {
      toast({ title: 'Tes Dibuat', description: `"${result.test.title}" berhasil dibuat.` });
      router.push(`/admin/dashboard/tests/${result.test.id}/edit`); 
    } else {
      toast({ title: 'Error Membuat Tes', description: result.message || 'Tidak dapat membuat tes.', variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <PlusCircle className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold font-headline">Buat Tes Baru</h1>
            <p className="text-muted-foreground">Tentukan informasi dasar untuk tes psikologi baru Anda.</p>
          </div>
        </div>
        <Button variant="outline" asChild>
          <Link href="/admin/dashboard/tests">
            <ArrowLeft className="mr-2 h-4 w-4" /> Kembali ke Daftar Tes
          </Link>
        </Button>
      </div>
      <TestForm onSubmit={handleSubmit} isSubmitting={isSubmitting} submitButtonText="Buat Tes dan Tambah Pertanyaan" />
    </div>
  );
}

