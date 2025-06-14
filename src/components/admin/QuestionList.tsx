
'use client';

import type { Question, QuestionOption } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogClose, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { QuestionForm, QuestionFormValues } from './QuestionForm';
import { useState } from 'react';
import { Edit, Trash2, PlusCircle, ListOrdered, HelpCircle, SlidersHorizontal, MessageSquare } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';

interface QuestionListProps {
  testId: string;
  questions: Question[];
  onAddQuestion: (testId: string, data: QuestionFormValues) => Promise<{ success: boolean; message?: string; question?: Question }>;
  onUpdateQuestion: (testId: string, questionId: string, data: QuestionFormValues) => Promise<{ success: boolean; message?: string; question?: Question }>;
  onDeleteQuestion: (testId: string, questionId: string) => Promise<{ success: boolean; message?: string }>;
}

const QuestionTypeIcon = ({ type }: { type: Question['type'] }) => {
  switch (type) {
    case 'multiple-choice': return <ListOrdered className="h-4 w-4 text-primary" />;
    case 'rating-scale': return <SlidersHorizontal className="h-4 w-4 text-primary" />;
    case 'open-ended': return <MessageSquare className="h-4 w-4 text-primary" />;
    default: return <HelpCircle className="h-4 w-4 text-muted-foreground" />;
  }
};

const getQuestionTypeDisplay = (type: Question['type']) => {
  switch(type) {
    case 'multiple-choice': return 'Pilihan Ganda';
    case 'rating-scale': return 'Skala Peringkat';
    case 'open-ended': return 'Jawaban Terbuka';
    default: return type;
  }
}

export function QuestionList({ testId, questions, onAddQuestion, onUpdateQuestion, onDeleteQuestion }: QuestionListProps) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleAddSubmit = async (data: QuestionFormValues) => {
    setIsSubmitting(true);
    const result = await onAddQuestion(testId, data);
    if (result.success) {
      toast({ title: 'Pertanyaan Ditambahkan', description: 'Pertanyaan baru telah ditambahkan ke tes.' });
      setIsAddModalOpen(false);
      // router.refresh() is called in ManageQuestionsClient
    } else {
      toast({ title: 'Error Menambah Pertanyaan', description: result.message || 'Tidak dapat menambahkan pertanyaan.', variant: 'destructive' });
    }
    setIsSubmitting(false);
  };

  const handleEditSubmit = async (data: QuestionFormValues) => {
    if (!editingQuestion) return;
    setIsSubmitting(true);
    const result = await onUpdateQuestion(testId, editingQuestion.id, data);
    if (result.success) {
      toast({ title: 'Pertanyaan Diperbarui', description: 'Pertanyaan telah diperbarui.' });
      setIsEditModalOpen(false);
      setEditingQuestion(undefined);
      // router.refresh() is called in ManageQuestionsClient
    } else {
      toast({ title: 'Error Memperbarui Pertanyaan', description: result.message || 'Tidak dapat memperbarui pertanyaan.', variant: 'destructive' });
    }
    setIsSubmitting(false);
  };

  const handleDelete = async (questionId: string) => {
    // No need to set submitting state for delete as it's usually quick
    const result = await onDeleteQuestion(testId, questionId);
    if (result.success) {
      toast({ title: 'Pertanyaan Dihapus', description: 'Pertanyaan telah dihapus dari tes.' });
      // router.refresh() is called in ManageQuestionsClient
    } else {
      toast({ title: 'Error Menghapus Pertanyaan', description: result.message || 'Tidak dapat menghapus pertanyaan.', variant: 'destructive' });
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="font-headline">Pertanyaan Tes</CardTitle>
          <CardDescription>Kelola pertanyaan untuk tes ini.</CardDescription>
        </div>
        <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
          <DialogTrigger asChild>
            <Button><PlusCircle className="mr-2 h-4 w-4" /> Tambah Pertanyaan</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>Tambah Pertanyaan Baru</DialogTitle>
              <DialogDescription>Konfigurasikan detail untuk pertanyaan baru.</DialogDescription>
            </DialogHeader>
            <QuestionForm onSubmit={handleAddSubmit} isSubmitting={isSubmitting} submitButtonText="Tambah Pertanyaan" />
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {questions.length > 0 ? (
          <ul className="space-y-4">
            {questions.map((q, index) => (
              <li key={q.id} className="p-4 border rounded-md flex justify-between items-start hover:bg-muted/50 transition-colors">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                     <QuestionTypeIcon type={q.type} />
                    <span className="font-semibold">P{index + 1}: {q.text}</span>
                  </div>
                  <Badge variant="secondary" className="capitalize text-xs">{getQuestionTypeDisplay(q.type)}</Badge>
                  {q.type === 'multiple-choice' && q.options && (
                    <ul className="mt-1 list-disc list-inside text-sm text-muted-foreground">
                      {q.options.map((opt: QuestionOption) => <li key={opt.id}>{opt.text}</li>)}
                    </ul>
                  )}
                   {q.type === 'rating-scale' && (
                    <p className="text-sm text-muted-foreground mt-1">
                      Skala: {q.scaleMin} ({q.minLabel || 'Min'}) sampai {q.scaleMax} ({q.maxLabel || 'Max'})
                    </p>
                  )}
                </div>
                <div className="space-x-2 flex-shrink-0 ml-4">
                  <Dialog open={isEditModalOpen && editingQuestion?.id === q.id} onOpenChange={(open) => {
                      if (!open) {
                        setEditingQuestion(undefined);
                        setIsEditModalOpen(false);
                      } else {
                        setEditingQuestion(q);
                        setIsEditModalOpen(true);
                      }
                    }}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="icon" onClick={() => { setEditingQuestion(q); setIsEditModalOpen(true); }}>
                        <Edit className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Edit Pertanyaan</DialogTitle>
                      </DialogHeader>
                      {editingQuestion && <QuestionForm initialData={editingQuestion} onSubmit={handleEditSubmit} isSubmitting={isSubmitting} submitButtonText="Perbarui Pertanyaan" />}
                       <DialogFooter>
                          <DialogClose asChild>
                            <Button type="button" variant="outline">
                              Batal
                            </Button>
                          </DialogClose>
                        </DialogFooter>
                    </DialogContent>
                  </Dialog>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="icon">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Apakah Anda yakin?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Ini akan menghapus pertanyaan ini secara permanen.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Batal</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(q.id)}>Hapus</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-center py-10">
            <Image 
              src="https://placehold.co/300x200.png" 
              alt="Belum ada pertanyaan ditambahkan" 
              width={300} 
              height={200} 
              className="mx-auto mb-4 rounded-md"
              data-ai-hint="empty list question"
            />
            <p className="text-muted-foreground text-lg">Belum ada pertanyaan yang ditambahkan ke tes ini.</p>
            <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
              <DialogTrigger asChild>
                <Button className="mt-4"><PlusCircle className="mr-2 h-4 w-4" /> Tambah Pertanyaan Pertama</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Tambah Pertanyaan Baru</DialogTitle>
                </DialogHeader>
                <QuestionForm onSubmit={handleAddSubmit} isSubmitting={isSubmitting} />
              </DialogContent>
            </Dialog>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

