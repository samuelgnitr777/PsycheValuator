
'use client';

import { Test, TestSubmission } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Clock, Brain, FileText, Activity, AlertTriangle, User, CalendarDays, Info, Mail } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';
import { id as indonesiaLocale } from 'date-fns/locale';


interface ResultsDisplayProps {
  test: Test;
  submission: TestSubmission;
}

function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  let timeString = '';
  if (minutes > 0) {
    timeString += `${minutes} menit`;
  }
  if (remainingSeconds > 0) {
    if (minutes > 0) timeString += ' '; 
    timeString += `${remainingSeconds} detik`;
  }
  if (timeString === '') return '0 detik';
  return timeString;
}

function formatSubmittedAt(isoString: string): string {
  try {
    return format(new Date(isoString), "dd MMMM yyyy, HH:mm:ss", { locale: indonesiaLocale });
  } catch (error) {
    return "Tanggal tidak valid";
  }
}


export function ResultsDisplay({ test, submission }: ResultsDisplayProps) {
  const answersMap = new Map(submission.answers.map(a => [a.questionId, a.value]));

  const isLoadingAnalysis = submission.analysisStatus === 'pending_ai';

  return (
    <Card className="w-full max-w-3xl mx-auto shadow-xl">
      <CardHeader className="text-center bg-muted/30 rounded-t-lg p-6">
        <CheckCircle className="mx-auto h-12 w-12 text-green-500 mb-3" />
        <CardTitle className="text-3xl font-headline text-primary">Tes Selesai: {test.title}</CardTitle>
        <CardDescription className="text-lg text-muted-foreground">Berikut adalah hasil dan analisis Anda.</CardDescription>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        <Card className="p-4 bg-secondary/30">
            <CardHeader className="p-2 pb-0">
                 <CardTitle className="text-xl font-semibold flex items-center"><User className="mr-2 h-5 w-5 text-primary"/> Detail Pengguna</CardTitle>
            </CardHeader>
            <CardContent className="p-2 grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <div className="flex items-center">
                    <User className="h-4 w-4 mr-2 text-muted-foreground"/> 
                    <span className="font-medium mr-1">Nama:</span> {submission.fullName}
                </div>
                 <div className="flex items-center">
                    <Mail className="h-4 w-4 mr-2 text-muted-foreground"/> 
                    <span className="font-medium mr-1">Email:</span> {submission.email}
                </div>
                <div className="flex items-center md:col-span-2">
                    <CalendarDays className="h-4 w-4 mr-2 text-muted-foreground"/> 
                    <span className="font-medium mr-1">Dikirim:</span> {formatSubmittedAt(submission.submittedAt)}
                </div>
            </CardContent>
        </Card>


        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-center">
            <Card className="p-4 bg-secondary/50">
                <CardHeader className="p-2">
                    <Clock className="mx-auto h-8 w-8 text-primary mb-2" />
                    <CardTitle className="text-lg font-semibold">Waktu Pengerjaan</CardTitle>
                </CardHeader>
                <CardContent className="p-2">
                    <p className="text-2xl font-bold">{formatTime(submission.timeTaken)}</p>
                </CardContent>
            </Card>
            <Card className="p-4 bg-secondary/50">
                <CardHeader className="p-2">
                    <FileText className="mx-auto h-8 w-8 text-primary mb-2" />
                    <CardTitle className="text-lg font-semibold">Pertanyaan Dijawab</CardTitle>
                </CardHeader>
                <CardContent className="p-2">
                    <p className="text-2xl font-bold">{submission.answers.length} / {test.questions.length}</p>
                </CardContent>
            </Card>
        </div>
        
        <Separator />

        <div>
          <h3 className="text-xl font-semibold mb-3 flex items-center text-primary">
            <Brain className="mr-2 h-6 w-6 text-[hsl(var(--accent))]" />
            Analisis Sifat Psikologis
          </h3>
          {isLoadingAnalysis ? (
            <Card className="bg-muted/20 border">
                <CardContent className="p-4 text-center space-y-2">
                    <svg className="animate-spin h-8 w-8 text-primary mx-auto mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <p className="font-semibold text-primary">Menganalisis hasil Anda...</p>
                    <p className="text-sm text-muted-foreground">Harap tunggu sebentar.</p>
                </CardContent>
            </Card>
          ) : submission.analysisStatus === 'ai_failed_pending_manual' ? ( 
            <Card className="bg-yellow-50 border-yellow-300">
              <CardContent className="p-4 text-center">
                <Info className="mx-auto h-8 w-8 text-yellow-500 mb-2" />
                <p className="text-yellow-700 font-semibold">Analisis Tertunda</p>
                <p className="text-yellow-600 text-sm">
                  {submission.aiError || "Terjadi masalah saat membuat analisis otomatis."} 
                  Hasil Anda akan ditinjau secara manual oleh tim kami. Terima kasih atas kesabaran Anda.
                </p>
              </CardContent>
            </Card>
          ) : submission.analysisStatus === 'ai_completed' && submission.psychologicalTraits ? (
            <Card className="bg-background border-primary/30">
                <CardContent className="p-4">
                    <p className="whitespace-pre-wrap leading-relaxed text-foreground/90">{submission.psychologicalTraits}</p>
                </CardContent>
            </Card>
          ) : (
             <Card className="bg-muted/20 border">
              <CardContent className="p-4 text-center">
                 <AlertTriangle className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                 <p className="text-muted-foreground">
                  Analisis tidak tersedia saat ini.
                  {submission.analysisStatus === 'manual_review_completed' && !submission.psychologicalTraits && " Hasil tinjauan manual belum menyertakan catatan analisis."}
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        <Separator />

        <div>
          <h3 className="text-xl font-semibold mb-3 flex items-center text-primary">
            <Activity className="mr-2 h-6 w-6 text-[hsl(var(--accent))]" />
            Jawaban Anda
          </h3>
          <ScrollArea className="h-72 w-full rounded-md border p-1">
            <div className="p-3 space-y-3">
            {test.questions.map((q, index) => (
              <div key={q.id} className="pb-3 border-b last:border-b-0">
                <p className="font-medium text-foreground/80">P{index + 1}: {q.text}</p>
                <p className="text-accent-foreground bg-accent/10 p-2 rounded-md mt-1 text-sm">
                  <strong>Jawaban Anda:</strong> {answersMap.get(q.id)?.toString() || <span className="italic text-muted-foreground">Tidak dijawab</span>}
                </p>
              </div>
            ))}
            </div>
          </ScrollArea>
        </div>
      </CardContent>
    </Card>
  );
}

