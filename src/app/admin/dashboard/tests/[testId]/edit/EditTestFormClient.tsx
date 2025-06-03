
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { TestForm } from '@/components/admin/TestForm';
import { useToast } from '@/hooks/use-toast';
import type { Test } from '@/types';

interface EditTestFormClientProps {
  initialTest: Test;
  updateTestAction: (id: string, data: Partial<Omit<Test, 'id' | 'questions'>>) => Promise<{ success: boolean; message?: string; test?: Test }>;
}

export default function EditTestFormClient({ initialTest, updateTestAction }: EditTestFormClientProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (data: { title: string; description: string }) => {
    setIsSubmitting(true);
    const result = await updateTestAction(initialTest.id, data);
    setIsSubmitting(false);

    if (result.success && result.test) {
      toast({ title: 'Test Diperbarui', description: `"${result.test.title}" telah berhasil diperbarui.` });
      router.refresh(); 
    } else {
      toast({ title: 'Error Memperbarui Tes', description: result.message || 'Tidak dapat memperbarui tes.', variant: 'destructive' });
    }
  };

  // The TestForm component itself needs to handle re-initialization if its initialData prop changes.
  // We pass initialTest directly to TestForm, which should use useEffect to reset itself.
  return (
    <TestForm 
      initialData={initialTest} 
      onSubmit={handleSubmit} 
      isSubmitting={isSubmitting} 
      submitButtonText="Perbarui Detail Tes"
    />
  );
}
