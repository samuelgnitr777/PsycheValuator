
'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
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

const DEFAULT_TIMER_SECONDS = 15;
const OPEN_ENDED_TIMER_SECONDS = 30;

export function TestPlayer({ test }: TestPlayerProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<UserAnswer[]>([]);
  const [startTime, setStartTime] = useState<number>(0);
  const router = useRouter();
  const [timeLeft, setTimeLeft] = useState(DEFAULT_TIMER_SECONDS);

  const currentQuestion = test.questions[currentQuestionIndex];

  const resetTimer = useCallback(() => {
    if (currentQuestion) {
      setTimeLeft(currentQuestion.type === 'open-ended' ? OPEN_ENDED_TIMER_SECONDS : DEFAULT_TIMER_SECONDS);
    }
  }, [currentQuestion]);

  useEffect(() => {
    setStartTime(Date.now());
  }, []);
  
  useEffect(() => {
    resetTimer();
  }, [currentQuestionIndex, resetTimer]);

  const handleTimeOut = useCallback(() => {
    // Record as unanswered implicitly (no answer object for this questionId)
    // or explicitly mark as timed_out if needed by downstream logic
    // For now, just move to next.
    if (currentQuestionIndex < test.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      // If it's the last question and time runs out, auto-submit
      handleSubmitTestLogic();
    }
  }, [currentQuestionIndex, test.questions.length]);


  useEffect(() => {
    if (!currentQuestion) return;

    const timer = setInterval(() => {
      setTimeLeft(prevTime => {
        if (prevTime <= 1) {
          clearInterval(timer);
          handleTimeOut();
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [currentQuestionIndex, currentQuestion, handleTimeOut]);


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
    // Optional: reset timer on answer, or just let it run. For now, let it run.
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
  
  const handleSubmitTestLogic = () => {
    const endTime = Date.now();
    const timeTaken = Math.round((endTime - startTime) / 1000);

    const submissionData = {
      testId: test.id,
      answers: answers,
      timeTaken: timeTaken,
    };
    
    const queryParams = new URLSearchParams({
      data: JSON.stringify(submissionData),
    }).toString();

    router.push(`/tests/${test.id}/results?${queryParams}`);
  };

  const isAllAnsweredOrSkipped = useMemo(() => {
    // In this context, "answered" means an answer object exists.
    // Timer skips mean no answer object.
    // The dialog warning should be about any unattempted questions.
    // If all questions have been *seen* (i.e., timer ran out or user navigated past), it's okay.
    // This logic might need refinement based on strict "all must be answered" vs "all seen"
    const answeredQuestionIds = new Set(answers.map(a => a.questionId));
    // For simplicity, we assume if user reaches last question, they've "attempted" all via timer or action.
    // A stricter check would be: `test.questions.every(q => answeredQuestionIds.has(q.id))`
    // But with timers, user might not explicitly answer.
    // The current dialog already handles if not all questions have answers.
    return true; // Let the dialog handle the actual check of answered questions.
  }, [answers, test.questions]);

  const getUnansweredCount = () => {
    const answeredQuestionIds = new Set(answers.map(a => a.questionId));
    return test.questions.filter(q => !answeredQuestionIds.has(q.id) || answers.find(a=>a.questionId === q.id)?.value === '').length;
  }
  
  const unansweredCount = getUnansweredCount();


  if (!currentQuestion) {
    return <div>Memuat tes...</div>; 
  }

  return (
    <div className="max-w-2xl mx-auto w-full space-y-8 p-4 md:p-0">
      <div>
        <h2 className="text-2xl font-bold font-headline mb-2 text-center text-primary">{test.title}</h2>
        <Progress value={progress} className="w-full h-3" />
        <p className="text-sm text-muted-foreground text-center mt-1">
          Pertanyaan {currentQuestionIndex + 1} dari {test.questions.length}
        </p>
      </div>

      <QuestionDisplay
        question={currentQuestion}
        currentAnswer={currentAnswerValue}
        onAnswerChange={handleAnswerChange}
        questionNumber={currentQuestionIndex + 1}
        totalQuestions={test.questions.length}
        timeLeft={timeLeft}
      />

      <div className="flex justify-between items-center pt-4">
        <Button variant="outline" onClick={goToPreviousQuestion} disabled={currentQuestionIndex === 0}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Sebelumnya
        </Button>

        {currentQuestionIndex < test.questions.length - 1 ? (
          <Button onClick={goToNextQuestion}>
            Berikutnya <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        ) : (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="default" className="bg-accent hover:bg-accent/90 text-accent-foreground">
                <CheckCircle className="mr-2 h-4 w-4" /> Kirim Tes
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Konfirmasi Pengiriman</AlertDialogTitle>
                <AlertDialogDescription>
                  {unansweredCount === 0
                    ? "Apakah Anda yakin ingin mengirim jawaban Anda? Anda tidak dapat mengubahnya nanti."
                    : `Anda belum menjawab ${unansweredCount} pertanyaan. Apakah Anda yakin ingin mengirim?`
                  }
                </AlertDialogDescription>
                {unansweredCount > 0 && (
                  <div className="mt-2 p-3 bg-destructive/10 border border-destructive/30 rounded-md text-sm text-destructive flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    <span>Beberapa pertanyaan belum terjawab. Ini mungkin mempengaruhi hasil Anda.</span>
                  </div>
                )}
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Tinjau Jawaban</AlertDialogCancel>
                <AlertDialogAction onClick={handleSubmitTestLogic} className="bg-accent hover:bg-accent/90 text-accent-foreground">
                  Ya, Kirim
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>
    </div>
  );
}

