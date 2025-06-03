
'use client';

import { useState, useEffect } from 'react';
import type { Test, TestSubmission } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Clock, Brain, FileText, Activity, User, CalendarDays, Info, Mail, FileSignature } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format, isValid, parseISO } from 'date-fns';
import { id as indonesiaLocale } from 'date-fns/locale';


interface ResultsDisplayProps {
  test: Test;
  submission: TestSubmission;
}

function formatSubmittedAtClient(isoStringInput: string | null | undefined): string {
  if (!isoStringInput || typeof isoStringInput !== 'string' || isoStringInput.trim() === '') {
    return "Tanggal tidak tersedia";
  }
  try {
    const dateObj = parseISO(isoStringInput);
    if (!isValid(dateObj)) {
        return "Format tanggal tidak valid";
    }
    return format(dateObj, "dd MMMM yyyy, HH:mm:ss", { locale: indonesiaLocale });
  } catch (error) {
    return "Error format tanggal";
  }
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


export function ResultsDisplay({ test, submission }: ResultsDisplayProps) {
  const [submittedDateStringToRender, setSubmittedDateStringToRender] = useState<string>("Memuat tanggal...");

  useEffect(() => {
    if (submission && submission.submittedAt) {
      setSubmittedDateStringToRender(formatSubmittedAtClient(submission.submittedAt));
    } else {
      setSubmittedDateStringToRender("Tanggal tidak tersedia");
    }
  }, [submission]);


  let fullNameDisplay = "Nama tidak diisi";
  if (submission && submission.fullName && String(submission.fullName).trim() !== '') {
    fullNameDisplay = String(submission.fullName);
  }

  const answersMap = new Map(submission?.answers?.map(a => [a.questionId, a.value]) || []);
  // AI loading state is no longer needed
  // const isLoadingAnalysis = submission?.analysisStatus === 'pending_ai';

  if (!submission || !test) {
    return (
        <Card className="w-full max-w-3xl mx-auto shadow-xl">
            <CardHeader>
                <CardTitle>Data Hasil Tidak Lengkap</CardTitle>
            </CardHeader>
            <CardContent>
                <p>Informasi tes atau pengiriman tidak dapat dimuat. Silakan coba lagi.</p>
            </CardContent>
        </Card>
    );
  }

  return (
    <Card className="w-full max-w-3xl mx-auto shadow-xl">
      <CardHeader className="text-center bg-muted/30 rounded-t-lg p-6">
        <CheckCircle className="mx-auto h-12 w-12 text-green-500 mb-3" />
        <CardTitle className="text-3xl font-headline text-primary">Tes Selesai: {test?.title || "Judul Tes Tidak Ada"}</CardTitle>
        <CardDescription className="text-lg text-muted-foreground">Terima kasih telah menyelesaikan tes ini. Berikut adalah ringkasan pengiriman Anda.</CardDescription>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        <Card className="p-4 bg-secondary/30">
            <CardHeader className="p-2 pb-0">
                 <CardTitle className="text-xl font-semibold flex items-center"><User className="mr-2 h-5 w-5 text-primary"/> Detail Pengguna</CardTitle>
            </CardHeader>
            <CardContent className="p-2 grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <div className="flex items-center">
                    <User className="h-4 w-4 mr-2 text-muted-foreground"/>
                    <span className="font-medium mr-1">Nama:</span>
                    <span>{fullNameDisplay}</span>
                </div>
                 <div className="flex items-center">
                    <Mail className="h-4 w-4 mr-2 text-muted-foreground"/>
                    <span className="font-medium mr-1">Email:</span>
                    <span>{submission?.email || "Email tidak diisi"}</span>
                </div>
                <div className="flex items-center md:col-span-2">
                    <CalendarDays className="h-4 w-4 mr-2 text-muted-foreground"/>
                    <span className="font-medium mr-1">Dikirim:</span>
                    <span>{submittedDateStringToRender}</span>
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
                    <p className="text-2xl font-bold">{formatTime(submission.timeTaken || 0)}</p>
                </CardContent>
            </Card>
            <Card className="p-4 bg-secondary/50">
                <CardHeader className="p-2">
                    <FileText className="mx-auto h-8 w-8 text-primary mb-2" />
                    <CardTitle className="text-lg font-semibold">Pertanyaan Dijawab</CardTitle>
                </CardHeader>
                <CardContent className="p-2">
                    <p className="text-2xl font-bold">{submission.answers?.length || 0} / {test.questions?.length || 0}</p>
                </CardContent>
            </Card>
        </div>

        <Separator />
        
        {/* AI Analysis Section Removed */}
        {/* The section for AI psychological traits and AI errors has been removed. */}
        {/* The status 'pending_ai' now implies waiting for manual review. */}

        <div>
          <h3 className="text-xl font-semibold mb-3 flex items-center text-primary">
            <FileSignature className="mr-2 h-6 w-6 text-[hsl(var(--accent))]" />
            Hasil Tinjauan Manual & Pemberitahuan
          </h3>
          <Card className="bg-blue-50 border-blue-300">
              <CardContent className="p-4 text-center space-y-2">
                  <Mail className="mx-auto h-8 w-8 text-blue-500 mb-2" />
                  <p className="text-blue-700 font-semibold">Hasil Akhir via Email</p>
                  <p className="text-blue-600 text-sm">
                    Status pengiriman Anda saat ini adalah: <span className="font-bold">{submission.analysisStatus === 'pending_ai' ? 'Menunggu Tinjauan' : submission.analysisStatus === 'manual_review_completed' ? 'Tinjauan Manual Selesai' : 'Dalam Proses'}.</span>
                    <br/>
                    Hasil akhir yang telah ditinjau secara komprehensif oleh administrator kami akan diproses dan dikirimkan ke alamat email Anda ({submission?.email || "email Anda"}). Mohon periksa email Anda secara berkala untuk pemberitahuan selanjutnya.
                  </p>
                  {submission.analysisStatus === 'manual_review_completed' && submission.manualAnalysisNotes && (
                     <div className="mt-4 pt-3 border-t border-blue-200">
                        <p className="text-sm text-blue-700 italic">Catatan dari admin mungkin telah disertakan dalam email Anda.</p>
                     </div>
                  )}
              </CardContent>
          </Card>
        </div>

        <Separator />

        <div>
          <h3 className="text-xl font-semibold mb-3 flex items-center text-primary">
            <Activity className="mr-2 h-6 w-6 text-[hsl(var(--accent))]" />
            Jawaban Anda
          </h3>
          <ScrollArea className="h-72 w-full rounded-md border p-1">
            <div className="p-3 space-y-3">
            {test.questions?.map((q, index) => (
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
