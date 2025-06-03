
import { getSubmissionByIdAdmin, getTestByIdAdmin } from '@/lib/dataService';
import { notFound } from 'next/navigation';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, FileSignature, CheckCircle, Clock, User, Mail, CalendarDays, Activity, AlertTriangle, Info } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { format, parseISO, isValid } from 'date-fns';
import { id as indonesiaLocale } from 'date-fns/locale';
import ManualReviewFormClient from './ManualReviewFormClient';
import { updateManualReviewAction, sendEmailNotificationAction } from '../actions';
import type { TestSubmission, Question, QuestionOption } from '@/types';

export const dynamic = 'force-dynamic';

function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  let timeString = '';
  if (minutes > 0) timeString += `${minutes} menit`;
  if (remainingSeconds > 0) {
    if (minutes > 0) timeString += ' ';
    timeString += `${remainingSeconds} detik`;
  }
  if (timeString === '') return '0 detik';
  return timeString;
}

function formatSubmittedAt(isoString: string | null | undefined): string {
  if (!isoString) return "N/A";
  try {
    const dateObj = parseISO(isoString);
    if (!isValid(dateObj)) return "Tanggal Tidak Valid";
    return format(dateObj, "dd MMMM yyyy, HH:mm:ss", { locale: indonesiaLocale });
  } catch (error) {
    return "Error Format Tanggal";
  }
}

function getStatusDisplay(status: TestSubmission['analysisStatus']): string {
  switch (status) {
    case 'pending_ai': return 'Menunggu Tinjauan'; 
    case 'ai_completed': return 'AI Selesai (Manual)'; 
    case 'ai_failed_pending_manual': return 'AI Gagal (Manual)'; 
    case 'manual_review_completed': return 'Manual Selesai';
    default: return status;
  }
}

const StatusIcon = ({ status }: { status: TestSubmission['analysisStatus'] }) => {
  switch (status) {
    case 'pending_ai': return <Clock className="mr-2 h-4 w-4" />;
    case 'ai_completed':
    case 'manual_review_completed': return <CheckCircle className="mr-2 h-4 w-4 text-green-600" />;
    case 'ai_failed_pending_manual': return <AlertTriangle className="mr-2 h-4 w-4 text-red-600" />;
    default: return <Info className="mr-2 h-4 w-4" />;
  }
};

export default async function ManualReviewDetailPage({ params }: { params: { submissionId: string } }) {
  const { submissionId } = params; // Destructure submissionId here
  const submission = await getSubmissionByIdAdmin(submissionId); // Use the destructured variable

  if (!submission) {
    notFound();
  }

  const test = await getTestByIdAdmin(submission.testId);

  if (!test) {
    console.error(`Test with ID ${submission.testId} not found for submission ${submission.id}`);
    notFound();
  }
  
  const answersMap = new Map(submission.answers?.map(a => [a.questionId, a.value]) || []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FileSignature className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold font-headline">Tinjau Pengiriman: {submission.fullName}</h1>
            <p className="text-muted-foreground">Tes: {test.title}</p>
          </div>
        </div>
        <Button variant="outline" asChild>
          <Link href="/admin/dashboard/manual-reviews">
            <ArrowLeft className="mr-2 h-4 w-4" /> Kembali ke Daftar Pengiriman
          </Link>
        </Button>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center"><User className="mr-2 text-primary"/>Info Pengguna & Tes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p><strong className="font-medium">Nama:</strong> {submission.fullName}</p>
              <p><strong className="font-medium">Email:</strong> {submission.email}</p>
              <p><strong className="font-medium">Tes Diikuti:</strong> {test.title}</p>
              <p><strong className="font-medium">Waktu Pengiriman:</strong> {formatSubmittedAt(submission.submittedAt)}</p>
              <p><strong className="font-medium">Waktu Pengerjaan:</strong> {formatTime(submission.timeTaken)}</p>
              <div className="flex items-center">
                <strong className="font-medium mr-2">Status Analisis Saat Ini:</strong> 
                <Badge variant={submission.analysisStatus === 'ai_completed' || submission.analysisStatus === 'manual_review_completed' ? 'default' : submission.analysisStatus === 'ai_failed_pending_manual' ? 'destructive' : 'secondary'}>
                    <StatusIcon status={submission.analysisStatus} />
                    {getStatusDisplay(submission.analysisStatus)}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center"><Activity className="mr-2 text-primary"/>Jawaban Pengguna</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-72 w-full rounded-md border p-1">
                <div className="p-3 space-y-3">
                {test.questions?.map((q, index) => {
                  const userAnswerValue = answersMap.get(q.id);
                  let displayUserAnswer: string | number | JSX.Element;

                  if (userAnswerValue === undefined || userAnswerValue === null || String(userAnswerValue).trim() === '') {
                      displayUserAnswer = <span className="italic text-muted-foreground">Tidak dijawab</span>;
                  } else {
                      if (q.type === 'multiple-choice' && q.options) {
                          const selectedOption = q.options.find(opt => opt.id === userAnswerValue);
                          if (selectedOption) {
                              displayUserAnswer = selectedOption.text;
                          } else {
                              displayUserAnswer = (
                                  <>
                                      {String(userAnswerValue)}{' '}
                                      <span className="italic text-xs text-muted-foreground">(Opsi tidak ditemukan)</span>
                                  </>
                              );
                          }
                      } else {
                          displayUserAnswer = String(userAnswerValue);
                      }
                  }
                  return (
                    <div key={q.id} className="pb-3 border-b last:border-b-0">
                      <p className="font-medium text-sm">P{index + 1}: {q.text}</p>
                      {q.type === 'multiple-choice' && q.options && (
                          <ul className="mt-1 list-disc list-inside text-xs text-muted-foreground pl-4">
                          {q.options.map((opt: QuestionOption) => (
                              <li key={opt.id} className={userAnswerValue === opt.id ? 'font-semibold text-accent' : ''}>
                              {opt.text}
                              </li>
                          ))}
                          </ul>
                      )}
                      <p className="text-accent-foreground bg-accent/10 p-2 rounded-md mt-1 text-sm">
                        <strong>Jawaban:</strong> {displayUserAnswer}
                      </p>
                    </div>
                  );
                })}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-1">
          <ManualReviewFormClient
            submissionId={submission.id}
            submissionEmail={submission.email}
            submissionFullName={submission.fullName}
            testTitle={test.title}
            initialNotes={submission.manualAnalysisNotes || ''}
            initialStatus={submission.analysisStatus}
            updateAction={updateManualReviewAction}
            sendEmailAction={sendEmailNotificationAction}
          />
        </div>
      </div>
    </div>
  );
}
