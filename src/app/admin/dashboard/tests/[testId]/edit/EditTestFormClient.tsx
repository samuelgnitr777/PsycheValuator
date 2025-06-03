
'use client';

import { useState } from 'react';
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
      toast({ title: 'Test Updated', description: `"${result.test.title}" has been successfully updated.` });
      router.refresh(); // Refresh to ensure title updates if displayed higher up or for consistency
    } else {
      toast({ title: 'Error Updating Test', description: result.message || 'Could not update the test.', variant: 'destructive' });
    }
  };

  return (
    <TestForm 
      initialData={initialTest} 
      onSubmit={handleSubmit} 
      isSubmitting={isSubmitting} 
      submitButtonText="Update Test Details"
    />
  );
}

