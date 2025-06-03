'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Test, UserAnswer } from '@/types';
import { QuestionDisplay } from './QuestionDisplay';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, ArrowRight, CheckCircle, AlertTriangle } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

interface TestPlayerProps {
  test: Test;
}

export function TestPlayer({ test }: TestPlayerProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<UserAnswer[]>([]);
  const [startTime, setStartTime] = useState<number>(0);
  const router = useRouter();

  useEffect(() => {
    setStartTime(Date.now());
  }, []);

  const currentQuestion = test.questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / test.questions.length) * 100;

  const handleAnswerChange = (value: string | number) => {
    setAnswers(prevAnswers => {
      const existingAnswerIndex = prevAnswers.findIndex(a => a.questionId === currentQuestion.id);
      if (existingAnswerIndex > -1) {
        const updatedAnswers = [...prevAnswers];
        updatedAnswers[existingAnswerIndex] = { ...updatedAnswers[existingAnswerIndex], value };
        return updatedAnswers;
      }
      return [...prevAnswers, { questionId: currentQuestion.id, value }];
    });
  };

  const currentAnswerValue = useMemo(() => {
    return answers.find(a => a.questionId === currentQuestion?.id)?.value;
  }, [answers, currentQuestion]);


  const goToNextQuestion = () => {
    if (currentQuestionIndex < test.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const goToPreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleSubmitTest = () => {
    const endTime = Date.now();
    const timeTaken = Math.round((endTime - startTime) / 1000); // in seconds

    // Ensure all questions have an answer (basic validation)
    // For open-ended, an empty string can be a valid "skipped" answer if allowed
    // For MC/Rating, an answer must be selected.
    // This simplified check assumes any entry in `answers` map is an attempt.
    const answeredQuestions = new Set(answers.map(a => a.questionId));
    const allAnswered = test.questions.every(q => {
      const answer = answers.find(a => a.questionId === q.id);
      if (!answer) return false;
      if (q.type === 'open-ended') return true; // Empty string is an answer
      return answer.value !== undefined && (typeof answer.value === 'number' || answer.value.trim() !== '');
    });


    if (!allAnswered && answers.length < test.questions.length) {
       // This alert dialog will be triggered by the button, so this logic is for a programmatic check
       // The actual dialog trigger is part of the submit button.
      return;
    }

    const submissionData = {
      testId: test.id,
      answers: answers,
      timeTaken: timeTaken,
    };
    
    // Navigate to results page with data. Using query params for simplicity.
    // For larger data, consider POST or client-side state management like Zustand/Redux for transfer.
    const queryParams = new URLSearchParams({
      data: JSON.stringify(submissionData), // Be mindful of URL length limits
    }).toString();

    router.push(`/tests/${test.id}/results?${queryParams}`);
  };

  const isAllAnswered = useMemo(() => {
    return test.questions.every(q => {
      const answer = answers.find(a => a.questionId === q.id);
      if (!answer) return false;
      if (q.type === 'open-ended') return true; // Empty string counts as "answered"
      return answer.value !== undefined && (typeof answer.value === 'number' || (typeof answer.value === 'string' && answer.value.trim() !== ''));
    });
  }, [answers, test.questions]);

  if (!currentQuestion) {
    return <div>Loading test...</div>; // Or some error state
  }

  return (
    <div className="max-w-2xl mx-auto w-full space-y-8 p-4 md:p-0">
      <div>
        <h2 className="text-2xl font-bold font-headline mb-2 text-center text-primary">{test.title}</h2>
        <Progress value={progress} className="w-full h-3" />
        <p className="text-sm text-muted-foreground text-center mt-1">
          Question {currentQuestionIndex + 1} of {test.questions.length}
        </p>
      </div>

      <QuestionDisplay
        question={currentQuestion}
        currentAnswer={currentAnswerValue}
        onAnswerChange={handleAnswerChange}
        questionNumber={currentQuestionIndex + 1}
        totalQuestions={test.questions.length}
      />

      <div className="flex justify-between items-center pt-4">
        <Button variant="outline" onClick={goToPreviousQuestion} disabled={currentQuestionIndex === 0}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Previous
        </Button>

        {currentQuestionIndex < test.questions.length - 1 ? (
          <Button onClick={goToNextQuestion}>
            Next <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        ) : (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="default" className="bg-accent hover:bg-accent/90 text-accent-foreground">
                <CheckCircle className="mr-2 h-4 w-4" /> Submit Test
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Confirm Submission</AlertDialogTitle>
                <AlertDialogDescription>
                  {isAllAnswered 
                    ? "Are you sure you want to submit your answers? You cannot change them later."
                    : "You have not answered all questions. Are you sure you want to submit?"
                  }
                </AlertDialogDescription>
                {!isAllAnswered && (
                  <div className="mt-2 p-3 bg-destructive/10 border border-destructive/30 rounded-md text-sm text-destructive flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    <span>Some questions are unanswered. This might affect your results.</span>
                  </div>
                )}
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Review Answers</AlertDialogCancel>
                <AlertDialogAction onClick={handleSubmitTest} className="bg-accent hover:bg-accent/90 text-accent-foreground">
                  Yes, Submit
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>
    </div>
  );
}
