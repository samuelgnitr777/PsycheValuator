
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
import { useEffect } from 'react';

const testFormSchema = z.object({
  title: z.string().min(3, { message: 'Judul minimal 3 karakter.' }).max(100),
  description: z.string().min(10, { message: 'Deskripsi minimal 10 karakter.' }).max(500),
});

type TestFormValues = z.infer<typeof testFormSchema>;

interface TestFormProps {
  initialData?: Test;
  onSubmit: (data: TestFormValues) => Promise<void>;
  isSubmitting: boolean;
  submitButtonText?: string;
}

export function TestForm({ initialData, onSubmit, isSubmitting, submitButtonText = "Simpan Tes" }: TestFormProps) {
  const form = useForm<TestFormValues>({
    resolver: zodResolver(testFormSchema),
    defaultValues: {
      title: initialData?.title || '',
      description: initialData?.description || '',
    },
  });

  useEffect(() => {
    if (initialData) {
      form.reset({
        title: initialData.title,
        description: initialData.description,
      });
    }
  }, [initialData, form]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">{initialData ? 'Edit Detail Tes' : 'Buat Tes Baru'}</CardTitle>
        <CardDescription>{initialData ? 'Perbarui judul dan deskripsi tes.' : 'Masukkan detail untuk tes psikologi baru.'}</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Judul Tes</FormLabel>
                  <FormControl>
                    <Input placeholder="cth., Penilaian Kepribadian" {...field} />
                  </FormControl>
                  <FormDescription>Judul yang jelas dan ringkas untuk tes.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Deskripsi Tes</FormLabel>
                  <FormControl>
                    <Textarea placeholder="cth., Tes ini membantu memahami sifat kepribadian inti Anda..." {...field} rows={4} />
                  </FormControl>
                  <FormDescription>Gambaran singkat tentang apa yang diukur oleh tes.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
              <Save className="mr-2 h-4 w-4" />
              {isSubmitting ? 'Menyimpan...' : submitButtonText}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
