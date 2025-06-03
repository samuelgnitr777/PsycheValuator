'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import type { Test } from '@/types';
import { Save } from 'lucide-react';

const testFormSchema = z.object({
  title: z.string().min(3, { message: 'Title must be at least 3 characters long.' }).max(100),
  description: z.string().min(10, { message: 'Description must be at least 10 characters long.' }).max(500),
});

type TestFormValues = z.infer<typeof testFormSchema>;

interface TestFormProps {
  initialData?: Test;
  onSubmit: (data: TestFormValues) => Promise<void>;
  isSubmitting: boolean;
  submitButtonText?: string;
}

export function TestForm({ initialData, onSubmit, isSubmitting, submitButtonText = "Save Test" }: TestFormProps) {
  const form = useForm<TestFormValues>({
    resolver: zodResolver(testFormSchema),
    defaultValues: {
      title: initialData?.title || '',
      description: initialData?.description || '',
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">{initialData ? 'Edit Test Details' : 'Create New Test'}</CardTitle>
        <CardDescription>{initialData ? 'Update the title and description of the test.' : 'Enter the details for the new psychology test.'}</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Test Title</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Personality Assessment" {...field} />
                  </FormControl>
                  <FormDescription>A clear and concise title for the test.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Test Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder="e.g., This test helps understand your core personality traits..." {...field} rows={4} />
                  </FormControl>
                  <FormDescription>A brief overview of what the test measures.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
              <Save className="mr-2 h-4 w-4" />
              {isSubmitting ? 'Saving...' : submitButtonText}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
