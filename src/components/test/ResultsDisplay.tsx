
'use client';

import { Test, TestSubmission } from '@/types';
import type { AnalyzeTestResponsesOutput } from '@/ai/flows/analyze-test-responses'; // Use 'type' import
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Clock, Brain, FileText, Activity, AlertTriangle } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ResultsDisplayProps {
  test: Test;
  submission: TestSubmission;
  analysisResult: AnalyzeTestResponsesOutput | null; 
  analysisCallError: string | null;
  isLoadingAnalysis: boolean;
}

function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  let timeString = '';
  if (minutes > 0) {
    timeString += `${minutes} menit`;
  }
  if (remainingSeconds > 0) {
    if (minutes > 0) timeString += ' dan ';
    timeString += `${remainingSeconds} detik`;
  }
  if (timeString === '') return '0 detik';
  return timeString;
}


export function ResultsDisplay({ test, submission, analysisResult, analysisCallError, isLoadingAnalysis }: ResultsDisplayProps) {
  const answersMap = new Map(submission.answers.map(a => [a.questionId, a.value]));

  return (
    <Card className="w-full max-w-3xl mx-auto shadow-xl">
      <CardHeader className="text-center bg-muted/30 rounded-t-lg">
        <CheckCircle className="mx-auto h-16 w-16 text-accent mb-3" />
        <CardTitle className="text-3xl font-headline text-primary">Tes Selesai: {test.title}</CardTitle>
        <CardDescription className="text-lg">Berikut adalah hasil dan analisis Anda.</CardDescription>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-center">
            <Card className="p-4 bg-secondary/50">
                <CardHeader className="p-2">
                    <Clock className="mx-auto h-8 w-8 text-primary mb-2" />
                    <CardTitle className="text-lg font-semibold">Waktu yang Digunakan</CardTitle>
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
            <div className="space-y-2 p-4 border rounded-md bg-muted/50">
              <div className="h-4 bg-muted rounded w-3/4 animate-pulse"></div>
              <div className="h-4 bg-muted rounded w-1/2 animate-pulse"></div>
              <div className="h-4 bg-muted rounded w-5/6 animate-pulse"></div>
              <p className="text-sm text-muted-foreground mt-2">Membuat analisis, harap tunggu...</p>
            </div>
          ) : analysisCallError ? ( 
            <Card className="bg-destructive/10 border-destructive/30">
              <CardContent className="p-4 text-center">
                <AlertTriangle className="mx-auto h-8 w-8 text-destructive mb-2" />
                <p className="text-destructive font-semibold">Gagal Memuat Analisis</p>
                <p className="text-destructive/80 text-sm">{analysisCallError}</p>
              </CardContent>
            </Card>
          ) : analysisResult?.error ? ( 
            <Card className="bg-destructive/10 border-destructive/30">
              <CardContent className="p-4 text-center">
                <AlertTriangle className="mx-auto h-8 w-8 text-destructive mb-2" />
                <p className="text-destructive font-semibold">Analisis Tidak Berhasil</p>
                <p className="text-destructive/80 text-sm">{analysisResult.error}</p>
              </CardContent>
            </Card>
          ) : analysisResult?.psychologicalTraits ? (
            <Card className="bg-background border-primary/30">
                <CardContent className="p-4">
                    <p className="whitespace-pre-wrap leading-relaxed text-foreground/90">{analysisResult.psychologicalTraits}</p>
                </CardContent>
            </Card>
          ) : (
            <Card className="bg-muted/20 border">
              <CardContent className="p-4 text-center">
                 <p className="text-muted-foreground">
                  Analisis tidak tersedia saat ini atau tidak dapat dibuat untuk pengiriman ini.
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
