
import { Suspense } from 'react';
import { getTestById, getSubmissionById, updateSubmission } from '@/lib/dataService';
// Removed: import { analyzeTestResponses, AnalyzeTestResponsesOutput } from '@/ai/flows/analyze-test-responses';
import { ResultsDisplay } from '@/components/test/ResultsDisplay';
import { notFound } from 'next/navigation';
import type { Test, TestSubmission, TestSubmissionUpdatePayload, Question, QuestionOption } from '@/types';
import Header from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Home, RefreshCw, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';


function mapUserAnswerToCamelCase(dbAnswer: any): UserAnswer {
  return {
    questionId: dbAnswer.question_id || dbAnswer.questionId,
    value: dbAnswer.value,
  };
}

function mapLocalSubmissionToCamelCase(dbSubmission: any): TestSubmission {
  if (!dbSubmission) return dbSubmission;
  const mappedSubmission = {
    id: dbSubmission.id,
    testId: dbSubmission.test_id || dbSubmission.testId,
    fullName: dbSubmission.full_name || dbSubmission.fullName,
    email: dbSubmission.email,
    answers: (dbSubmission.answers || []).map(mapUserAnswerToCamelCase),
    timeTaken: dbSubmission.time_taken === undefined ? 0 : Number(dbSubmission.time_taken),
    submittedAt: dbSubmission.submitted_at || dbSubmission.submittedAt,
    analysisStatus: dbSubmission.analysis_status || dbSubmission.analysisStatus,
    psychologicalTraits: dbSubmission.psychological_traits || dbSubmission.psychologicalTraits,
    aiError: dbSubmission.ai_error || dbSubmission.aiError,
    manualAnalysisNotes: dbSubmission.manual_analysis_notes || dbSubmission.manualAnalysisNotes,
  };
  return mappedSubmission;
}

function mapLocalQuestionOptionToCamelCase(dbOption: any): QuestionOption {
 return { id: dbOption.id, text: dbOption.text };
}

function mapLocalQuestionToCamelCase(dbQuestion: any): Question {
 return {
    id: dbQuestion.id,
    testId: dbQuestion.test_id || dbQuestion.testId,
    text: dbQuestion.text,
    type: dbQuestion.type,
    options: dbQuestion.options ? (dbQuestion.options as any[]).map(mapLocalQuestionOptionToCamelCase) : undefined,
    scaleMin: dbQuestion.scale_min,
    scaleMax: dbQuestion.scale_max,
    minLabel: dbQuestion.min_label,
    maxLabel: dbQuestion.max_label,
    order: dbQuestion.order,
 };
}

function mapLocalTestToCamelCase(dbTest: any): Test {
 if (!dbTest) return dbTest;
 const mappedTest = {
    id: dbTest.id,
    title: dbTest.title,
    description: dbTest.description,
    isPublished: dbTest.isPublished || dbTest.is_published,
    questions: (dbTest.questions || []).map(mapLocalQuestionToCamelCase).sort((a: Question, b: Question) => (a.order || 0) - (b.order || 0)),
 };
 return mappedTest;
}


interface TestResultsPageProps {
  params: { testId: string; submissionId: string };
}

async function ResultsContent({ testId, submissionId }: { testId: string, submissionId: string }) {
  let rawSubmission = await getSubmissionById(submissionId);
  let rawTest = await getTestById(testId);

  if (!rawTest || !rawSubmission) {
    notFound();
  }
  
  const test = mapLocalTestToCamelCase(rawTest);
  let submission = mapLocalSubmissionToCamelCase(rawSubmission);

  // AI Analysis block removed.
  // The submission status will remain as 'pending_ai' (or whatever it was set to during creation)
  // until an admin manually reviews and changes it.
  // 'pending_ai' now effectively means 'pending_manual_review'.

  console.log('[ResultsContent] Submission data (no AI processing) (SHOULD BE CAMELCASE):', JSON.stringify(submission, null, 2));
  
  return (
    <ResultsDisplay 
      test={test} 
      submission={submission} 
    />
  );
}


export default async function TestResultsPage({ params }: TestResultsPageProps) {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8 flex flex-col items-center space-y-6">
        <Suspense fallback={
          <Card className="w-full max-w-3xl mx-auto shadow-xl p-8 text-center">
            <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary mb-4" />
            <h2 className="text-2xl font-semibold">Memuat Hasil Anda...</h2>
            <p className="text-muted-foreground">Harap tunggu selagi kami memproses pengiriman Anda.</p>
          </Card>
        }>
          {/* @ts-expect-error Async Server Component */}
          <ResultsContent testId={params.testId} submissionId={params.submissionId} />
        </Suspense>

        <div className="text-center py-4">
          <h2 className="text-2xl font-semibold text-primary mb-6">
            Terima Kasih Telah Mengisi Tes ini
          </h2>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild variant="outline" size="lg">
                  <Link href="/">
                      <Home className="mr-2 h-5 w-5" /> Kembali ke Beranda
                  </Link>
              </Button>
              <Button asChild size="lg">
                  <Link href={`/tests/${params.testId}`}>
                      <RefreshCw className="mr-2 h-5 w-5" /> Ikuti Tes Lagi
                  </Link>
              </Button>
          </div>
        </div>
      </main>
      <footer className="text-center py-6 border-t text-sm text-muted-foreground">
        Terima kasih telah menggunakan PsycheValuator!
      </footer>
    </div>
  );
}

export const dynamic = 'force-dynamic';
