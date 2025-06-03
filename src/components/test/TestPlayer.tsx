'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Test, UserAnswer, TestSubmission } from '@/types';
import { QuestionDisplay } from './QuestionDisplay';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, ArrowRight, CheckCircle, AlertTriangle, User, PlayCircle, Mail, LogOut, ShieldAlert } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { createInitialSubmission, updateSubmission } from '@/lib/dataService'; 
import { useToast } from '@/hooks/use-toast';
import { useAuthContext } from '@/components/AppProviders'; // Import useAuthContext

interface TestPlayerProps {
  test: Test;
}

const DEFAULT_TIMER_SECONDS = 30;
const OPEN_ENDED_TIMER_SECONDS = 120;

export function TestPlayer({ test }: TestPlayerProps) {
  const { isLoggedIn: isAdminLoggedIn } = useAuthContext(); // Get admin login state
  const [currentScreen, setCurrentScreen] = useState<'nameInput' | 'playing' | 'submitting'>('nameInput');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [submissionId, setSubmissionId] = useState<string | null>(null);
  const [formError, setFormError] = useState('');
  const [showRlsErrorDialog, setShowRlsErrorDialog] = useState(false);
  const [rlsErrorMessage, setRlsErrorMessage] = useState('');

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<UserAnswer[]>([]);
  const [testStartTime, setTestStartTime] = useState<number>(0); 
  const router = useRouter();
  const [timeLeft, setTimeLeft] = useState(DEFAULT_TIMER_SECONDS);
  const { toast } = useToast();

  const currentQuestion = test.questions[currentQuestionIndex];

  const resetTimer = useCallback(() => {
    if (currentQuestion) {
      setTimeLeft(currentQuestion.type === 'open-ended' ? OPEN_ENDED_TIMER_SECONDS : DEFAULT_TIMER_SECONDS);
    }
  }, [currentQuestion]);

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleStartTest = async () => {
    if (isAdminLoggedIn) {
        setFormError('Admin tidak dapat memulai tes publik saat login. Silakan logout terlebih dahulu atau gunakan mode incognito.');
        return;
    }
    if (!fullName.trim()) {
      setFormError('Nama lengkap tidak boleh kosong.');
      return;
    }
    if (!email.trim()) {
      setFormError('Email tidak boleh kosong.');
      return;
    }
    if (!validateEmail(email)) {
      setFormError('Format email tidak valid.');
      return;
    }
    setFormError('');
    setCurrentScreen('submitting'); 
    try {
      console.log(`[TestPlayer] Attempting to create initial submission for: ${fullName}, ${email}`);
      const initialSubmission = await createInitialSubmission(test.id, fullName, email);
      console.log(`[TestPlayer] Initial submission created with ID: ${initialSubmission.id}`);
      setSubmissionId(initialSubmission.id);
      setTestStartTime(Date.now());
      setCurrentScreen('playing');
      resetTimer(); 
    } catch (error) {
      const err = error as Error;
      console.error("[TestPlayer] Gagal memulai tes:", err.message, err.stack);
      const displayMessage = err.message || "Gagal memulai tes. Silakan coba lagi.";
      
      if (displayMessage.includes("RLS VIOLATION")) {
        setRlsErrorMessage(displayMessage);
        setShowRlsErrorDialog(true);
      } else {
        setFormError(displayMessage); 
        toast({ 
          title: 'Gagal Memulai Tes',
          description: <div className="whitespace-pre-wrap">{displayMessage}</div>,
          variant: 'destructive',
          duration: 20000 
        });
      }
      setCurrentScreen('nameInput');
    }
  };
  
  useEffect(() => {
    if (currentScreen === 'playing') {
      resetTimer();
    }
  }, [currentQuestionIndex, currentScreen, resetTimer]);

  const handleSubmitTestLogic = async () => {
    if (!submissionId) {
      console.error("Submission ID tidak ada saat mengirim tes.");
      toast({ title: 'Error', description: 'ID Submission tidak ditemukan. Tidak dapat mengirim tes.', variant: 'destructive' });
      setCurrentScreen('playing'); 
      return;
    }
    setCurrentScreen('submitting');
    const endTime = Date.now();
    const timeTaken = Math.round((endTime - testStartTime) / 1000);

    console.log('[TestPlayer] Answers being submitted:', JSON.stringify(answers, null, 2));
    console.log(`[TestPlayer] Time taken: ${timeTaken}`);

    const submissionUpdateData = {
      answers: answers, 
      timeTaken: timeTaken,
      submittedAt: new Date().toISOString(),
      analysisStatus: 'pending_ai' as const,
    };
    
    try {
      const updatedSubmission = await updateSubmission(submissionId, submissionUpdateData);
      if (!updatedSubmission) {
        // This case implies update failed to return data, error is thrown from updateSubmission
      }
      router.push(`/tests/${test.id}/results/${submissionId}`);
    } catch (error) {
      console.error("[TestPlayer] Gagal mengirim tes:", error);
      toast({ title: 'Error Mengirim Tes', description: (error as Error).message || 'Terjadi kesalahan. Silakan coba lagi.', variant: 'destructive' });
      setCurrentScreen('playing'); 
    }
  };

  const handleTimeOut = useCallback(() => {
    if (currentQuestionIndex < test.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      handleSubmitTestLogic();
    }
  }, [currentQuestionIndex, test.questions.length, handleSubmitTestLogic]);


  useEffect(() => {
    if (currentScreen !== 'playing' || !currentQuestion) return;

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
  }, [currentScreen, currentQuestionIndex, currentQuestion, handleTimeOut]);


  const progress = test.questions.length > 0 ? ((currentQuestionIndex + 1) / test.questions.length) * 100 : 0;

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
    
  const getUnansweredCount = () => {
    if (!currentQuestion) return test.questions.length; 
    const answeredQuestionIds = new Set(answers.map(a => a.questionId));
    return test.questions.filter(q => !answeredQuestionIds.has(q.id) || answers.find(a=>a.questionId === q.id)?.value === '').length;
  }
  
  const unansweredCount = getUnansweredCount();

  if (currentScreen === 'nameInput') {
    return (
      <>
        <Card className="w-full max-w-md mx-auto shadow-xl">
          <CardHeader className="text-center">
            {isAdminLoggedIn ? (
              <ShieldAlert className="mx-auto h-12 w-12 text-orange-500 mb-3" />
            ) : (
              <User className="mx-auto h-12 w-12 text-primary mb-3" />
            )}
            <CardTitle className="text-2xl font-headline">Mulai Tes: {test.title}</CardTitle>
            {isAdminLoggedIn ? (
                 <CardDescription className="text-orange-600">
                 Anda login sebagai Admin. Untuk mengambil tes sebagai pengguna, silakan <Button variant="link" className="p-0 h-auto text-orange-600 underline" onClick={() => {
                     const { logout } = useAuthContext(); // This won't work here directly, need to call context hook at top level
                     if (typeof window !== 'undefined') {
                         localStorage.removeItem('isAdminLoggedIn'); // Direct logout action
                         router.refresh(); // Refresh to reflect logged out state
                     }
                 }}>logout</Button> terlebih dahulu atau gunakan mode penyamaran.
               </CardDescription>
            ) : (
              <CardDescription>Silakan masukkan nama lengkap dan email Anda untuk memulai.</CardDescription>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            {!isAdminLoggedIn && (
              <>
                <div>
                  <Label htmlFor="fullName">Nama Lengkap</Label>
                  <div className="relative mt-1">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="fullName"
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Masukkan nama lengkap Anda"
                      className="pl-9"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <div className="relative mt-1">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="cth: email@example.com"
                        className="pl-9"
                      />
                    </div>
                </div>
              </>
            )}
            {formError && <p className="text-sm text-destructive mt-1 whitespace-pre-wrap">{formError}</p>}
            <Button onClick={handleStartTest} className="w-full" disabled={isAdminLoggedIn}>
              {isAdminLoggedIn ? <><ShieldAlert className="mr-2 h-5 w-5" /> Admin Tidak Dapat Memulai</> : <><PlayCircle className="mr-2 h-5 w-5" /> Mulai Tes</>}
            </Button>
          </CardContent>
        </Card>

        <AlertDialog open={showRlsErrorDialog} onOpenChange={setShowRlsErrorDialog}>
          <AlertDialogContent className="max-w-xl">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-destructive flex items-center">
                <AlertTriangle className="mr-2 h-6 w-6" />
                Konfigurasi Database Diperlukan (RLS Policy)
              </AlertDialogTitle>
              <AlertDialogDescription className="text-left max-h-[60vh] overflow-y-auto text-sm">
                <div className="whitespace-pre-wrap">{rlsErrorMessage}</div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogAction onClick={() => setShowRlsErrorDialog(false)}>Saya Mengerti</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </>
    );
  }

  if (currentScreen === 'submitting') {
     return (
        <div className="flex flex-col items-center justify-center min-h-[300px] text-center">
            <svg className="animate-spin h-10 w-10 text-primary mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="text-lg text-muted-foreground">{submissionId ? 'Mengirim tes...' : 'Mempersiapkan tes...'}</p>
        </div>
    );
  }


  if (!currentQuestion) {
    return (
        <div className="flex flex-col items-center justify-center min-h-[300px] text-center">
            <svg className="animate-spin h-10 w-10 text-primary mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="text-lg text-muted-foreground">Memuat pertanyaan...</p>
        </div>
    );
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
                    : `Anda memiliki ${unansweredCount} pertanyaan yang belum terjawab. Apakah Anda yakin ingin mengirim?`
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
