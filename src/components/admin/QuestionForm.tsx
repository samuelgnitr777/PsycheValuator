
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useFieldArray } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Question, QuestionType } from '@/types';
import { PlusCircle, Trash2, Save } from 'lucide-react';

const questionOptionSchema = z.object({
  id: z.string().optional(), 
  text: z.string().min(1, { message: "Teks opsi tidak boleh kosong." }),
});

const questionFormSchema = z.object({
  text: z.string().min(5, { message: 'Teks pertanyaan minimal 5 karakter.' }),
  type: z.enum(['multiple-choice', 'rating-scale', 'open-ended']),
  options: z.array(questionOptionSchema).optional(),
  scaleMin: z.number().optional(),
  scaleMax: z.number().optional(),
  minLabel: z.string().optional(),
  maxLabel: z.string().optional(),
}).refine(data => {
  if (data.type === 'multiple-choice') {
    return data.options && data.options.length >= 2;
  }
  return true;
}, {
  message: 'Pertanyaan pilihan ganda harus memiliki setidaknya 2 opsi.',
  path: ['options'],
}).refine(data => {
  if (data.type === 'rating-scale') {
    return data.scaleMin !== undefined && data.scaleMax !== undefined && data.scaleMin < data.scaleMax;
  }
  return true;
}, {
  message: 'Untuk skala peringkat, nilai min harus kurang dari nilai maks.',
  path: ['scaleMax'],
});

export type QuestionFormValues = z.infer<typeof questionFormSchema>;

interface QuestionFormProps {
  initialData?: Question;
  onSubmit: (data: QuestionFormValues) => Promise<void>;
  isSubmitting: boolean;
  submitButtonText?: string;
}

export function QuestionForm({ initialData, onSubmit, isSubmitting, submitButtonText = "Simpan Pertanyaan" }: QuestionFormProps) {
  const form = useForm<QuestionFormValues>({
    resolver: zodResolver(questionFormSchema),
    defaultValues: {
      text: initialData?.text || '',
      type: initialData?.type || 'multiple-choice',
      options: initialData?.type === 'multiple-choice' ? (initialData.options || [{ text: '' }, { text: '' }]) : [],
      scaleMin: initialData?.type === 'rating-scale' ? initialData.scaleMin : 1,
      scaleMax: initialData?.type === 'rating-scale' ? initialData.scaleMax : 5,
      minLabel: initialData?.type === 'rating-scale' ? initialData.minLabel : 'Sangat Tidak Setuju',
      maxLabel: initialData?.type === 'rating-scale' ? initialData.maxLabel : 'Sangat Setuju',
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "options",
  });

  const questionType = form.watch('type');

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="text"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Teks Pertanyaan</FormLabel>
              <FormControl>
                <Textarea placeholder="Masukkan teks pertanyaan..." {...field} rows={3}/>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipe Pertanyaan</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih tipe pertanyaan" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="multiple-choice">Pilihan Ganda</SelectItem>
                  <SelectItem value="rating-scale">Skala Peringkat</SelectItem>
                  <SelectItem value="open-ended">Jawaban Terbuka</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {questionType === 'multiple-choice' && (
          <div className="space-y-4 p-4 border rounded-md">
            <FormLabel>Opsi Jawaban</FormLabel>
            {fields.map((field, index) => (
              <FormField
                key={field.id}
                control={form.control}
                name={`options.${index}.text`}
                render={({ field: optionField }) => (
                  <FormItem>
                    <div className="flex items-center gap-2">
                      <FormControl>
                        <Input placeholder={`Opsi ${index + 1}`} {...optionField} />
                      </FormControl>
                      {fields.length > 2 && (
                        <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ))}
            <Button type="button" variant="outline" size="sm" onClick={() => append({ text: '' })}>
              <PlusCircle className="mr-2 h-4 w-4" /> Tambah Opsi
            </Button>
             {form.formState.errors.options && <FormMessage>{form.formState.errors.options.message}</FormMessage>}
          </div>
        )}

        {questionType === 'rating-scale' && (
          <div className="space-y-4 p-4 border rounded-md">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="scaleMin"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nilai Min</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value,10))}/>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="scaleMax"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nilai Maks</FormLabel>
                    <FormControl>
                       <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value,10))}/>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
                control={form.control}
                name="minLabel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Label Min (Opsional)</FormLabel>
                    <FormControl>
                      <Input placeholder="cth., Sangat Tidak Setuju" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="maxLabel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Label Maks (Opsional)</FormLabel>
                    <FormControl>
                      <Input placeholder="cth., Sangat Setuju" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {form.formState.errors.scaleMax && <FormMessage>{form.formState.errors.scaleMax.message}</FormMessage>}
          </div>
        )}

        <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
           <Save className="mr-2 h-4 w-4" />
          {isSubmitting ? 'Menyimpan...' : submitButtonText}
        </Button>
      </form>
    </Form>
  );
}

