'use client';

import type { Question } from '@/types';
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
      toast({ title: 'Question Added', description: 'The new question has been added to the test.' });
      setIsAddModalOpen(false);
    } else {
      toast({ title: 'Error Adding Question', description: result.message || 'Could not add question.', variant: 'destructive' });
    }
    setIsSubmitting(false);
  };

  const handleEditSubmit = async (data: QuestionFormValues) => {
    if (!editingQuestion) return;
    setIsSubmitting(true);
    const result = await onUpdateQuestion(testId, editingQuestion.id, data);
    if (result.success) {
      toast({ title: 'Question Updated', description: 'The question has been updated.' });
      setIsEditModalOpen(false);
      setEditingQuestion(undefined);
    } else {
      toast({ title: 'Error Updating Question', description: result.message || 'Could not update question.', variant: 'destructive' });
    }
    setIsSubmitting(false);
  };

  const handleDelete = async (questionId: string) => {
    const result = await onDeleteQuestion(testId, questionId);
    if (result.success) {
      toast({ title: 'Question Deleted', description: 'The question has been removed from the test.' });
    } else {
      toast({ title: 'Error Deleting Question', description: result.message || 'Could not delete question.', variant: 'destructive' });
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="font-headline">Test Questions</CardTitle>
          <CardDescription>Manage the questions for this test.</CardDescription>
        </div>
        <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
          <DialogTrigger asChild>
            <Button><PlusCircle className="mr-2 h-4 w-4" /> Add Question</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New Question</DialogTitle>
              <DialogDescription>Configure the details for the new question.</DialogDescription>
            </DialogHeader>
            <QuestionForm onSubmit={handleAddSubmit} isSubmitting={isSubmitting} submitButtonText="Add Question" />
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
                    <span className="font-semibold">Q{index + 1}: {q.text}</span>
                  </div>
                  <Badge variant="secondary" className="capitalize text-xs">{q.type.replace('-', ' ')}</Badge>
                  {q.type === 'multiple-choice' && q.options && (
                    <ul className="mt-1 list-disc list-inside text-sm text-muted-foreground">
                      {q.options.map(opt => <li key={opt.id || opt.text}>{opt.text}</li>)}
                    </ul>
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
                        <DialogTitle>Edit Question</DialogTitle>
                      </DialogHeader>
                      {editingQuestion && <QuestionForm initialData={editingQuestion} onSubmit={handleEditSubmit} isSubmitting={isSubmitting} submitButtonText="Update Question" />}
                       <DialogFooter>
                          <DialogClose asChild>
                            <Button type="button" variant="outline">
                              Cancel
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
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently delete this question.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(q.id)}>Delete</AlertDialogAction>
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
              alt="No questions added" 
              width={300} 
              height={200} 
              className="mx-auto mb-4 rounded-md"
              data-ai-hint="empty list question"
            />
            <p className="text-muted-foreground text-lg">No questions have been added to this test yet.</p>
            <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
              <DialogTrigger asChild>
                <Button className="mt-4"><PlusCircle className="mr-2 h-4 w-4" /> Add First Question</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Add New Question</DialogTitle>
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
