
import { Suspense } from 'react';
import { getTestById, getSubmissionById, updateSubmission } from '@/lib/dataService';
import { analyzeTestResponses, AnalyzeTestResponsesOutput } from '@/ai/flows/analyze-test-responses';
import { ResultsDisplay } from '@/components/test/ResultsDisplay';
import { notFound } from 'next/navigation';
import type { Test, TestSubmission, TestSubmissionUpdatePayload, Question, QuestionOption } from '@/types';
import Header from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Home, RefreshCw, AlertTriangle, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Helper functions for mapping (can be moved to a util file if used elsewhere)
// These are simplified versions for direct use here if dataService mapping is still problematic.
// Ideally, dataService provides consistently mapped data.

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
    timeTaken: dbSubmission.time_taken || dbSubmission.timeTaken,
    submittedAt: dbSubmission.submitted_at || dbSubmission.submittedAt,
    analysisStatus: dbSubmission.analysis_status || dbSubmission.analysisStatus,
    psychologicalTraits: dbSubmission.psychological_traits || dbSubmission.psychologicalTraits,
    aiError: dbSubmission.ai_error || dbSubmission.aiError,
    manualAnalysisNotes: dbSubmission.manual_analysis_notes || dbSubmission.manualAnalysisNotes,
  };
  console.log('[ResultsContent] LOCAL MAPPING (submission) - Input:', JSON.stringify(dbSubmission, null, 2), 'Output:', JSON.stringify(mappedSubmission, null, 2));
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
 console.log('[ResultsContent] LOCAL MAPPING (test) - Input:', JSON.stringify(dbTest, null, 2), 'Output:', JSON.stringify(mappedTest, null, 2));
 return mappedTest;
}


interface TestResultsPageProps {
  params: { testId: string; submissionId: string };
}

async function ResultsContent({ testId, submissionId }: { testId: string, submissionId: string }) {
  let rawSubmission = await getSubmissionById(submissionId); 
  let rawTest = await getTestById(testId); 

  console.log('[ResultsContent] Data received from getSubmissionById (SHOULD BE CAMELCASE):', JSON.stringify(rawSubmission, null, 2));
  console.log('[ResultsContent] Data received from getTestById (SHOULD BE CAMELCASE):', JSON.stringify(rawTest, null, 2));

  if (!rawTest || !rawSubmission) {
    notFound();
  }
  
  // Defensive re-mapping in ResultsContent, just in case dataService didn't map
  const test = mapLocalTestToCamelCase(rawTest); 
  let submission = mapLocalSubmissionToCamelCase(rawSubmission);

  console.log('[ResultsContent] Data after LOCAL MAPPING in ResultsContent (submission):', JSON.stringify(submission, null, 2));
  console.log('[ResultsContent] Data after LOCAL MAPPING in ResultsContent (test):', JSON.stringify(test, null, 2));


  if (submission.analysisStatus === 'pending_ai') {
    let aiResult: AnalyzeTestResponsesOutput | null = null;
    let currentAiError: string | null = null; 

    try {
      aiResult = await analyzeTestResponses({
        responses: submission.answers
          .map(ans => {
            const question = test.questions.find(q => q.id === ans.questionId);
            return `Q: ${question?.text || 'Pertanyaan Tidak Diketahui'}\nA: ${ans.value}`;
          })
          .join('\n\n'),
        timeTaken: submission.timeTaken,
      });

      let updatePayload: TestSubmissionUpdatePayload = {};
      if (aiResult.error) {
        currentAiError = aiResult.error; 
        updatePayload = {
          analysisStatus: 'ai_failed_pending_manual',
          aiError: currentAiError
        };
      } else if (aiResult.psychologicalTraits) {
        updatePayload = {
          analysisStatus: 'ai_completed',
          psychologicalTraits: aiResult.psychologicalTraits
        };
      } else {
        currentAiError = "Analisis AI tidak menghasilkan output yang diharapkan.";
        updatePayload = {
            analysisStatus: 'ai_failed_pending_manual',
            aiError: currentAiError
        };
      }

      try {
        const updatedData = await updateSubmission(submissionId, updatePayload);
        if (updatedData) {
          submission = mapLocalSubmissionToCamelCase(updatedData); // Ensure updated data is also mapped
        } else {
          console.warn(`UpdateSubmission for ${submissionId} with AI results returned no data. Re-fetching to ensure consistency.`);
          const refreshedSubmission = await getSubmissionById(submissionId);
          if (refreshedSubmission) {
            submission = mapLocalSubmissionToCamelCase(refreshedSubmission);
          } else {
            console.error(`CRITICAL: Failed to re-fetch submission ${submissionId} after AI update attempt returned no data. Current submission state might be stale.`);
            submission.aiError = (submission.aiError ? `${submission.aiError} ` : "") + "Gagal menyinkronkan status terbaru.";
          }
        }
      } catch (dbUpdateError) {
        console.error(`Error saving AI analysis results to database for submission ${submissionId}:`, dbUpdateError);
        currentAiError = `Gagal menyimpan hasil analisis ke database: ${(dbUpdateError as Error).message}.`;
        
        submission.analysisStatus = 'ai_failed_pending_manual';
        submission.aiError = currentAiError; // Update local submission state
      }
    } catch (aiServiceError) { 
      console.error(
        `Error during AI service call (analyzeTestResponses) for submission ${submissionId}. Error details:`,
        typeof aiServiceError === 'object' && aiServiceError !== null ? JSON.stringify(aiServiceError, null, 2) : aiServiceError
      );
      if (aiServiceError instanceof Error && aiServiceError.stack) {
         console.error("Stack trace:", aiServiceError.stack);
      }

      currentAiError = "Gagal menghubungi layanan analisis AI."; // Default
      if (aiServiceError instanceof Error) {
        const msg = aiServiceError.message.toLowerCase();
        if (msg.includes("503") || msg.includes("model is overloaded") || msg.includes("overloaded")) {
          currentAiError = "Layanan analisis AI sedang kelebihan beban. Hasil Anda akan ditinjau secara manual.";
        } else if (msg.includes("deadline exceeded")) {
          currentAiError = "Waktu tunggu untuk layanan analisis AI habis. Hasil Anda akan ditinjau secara manual.";
        } else {
          currentAiError = `Layanan AI Error: ${aiServiceError.message}. Hasil akan ditinjau manual.`;
        }
      } else if (typeof aiServiceError === 'string' && aiServiceError.trim() !== '') {
        currentAiError = `Layanan AI mengembalikan pesan: ${aiServiceError}. Hasil akan ditinjau manual.`;
      } else if (typeof aiServiceError === 'object' && aiServiceError !== null) {
        const objMsg = (aiServiceError as any).message || (aiServiceError as any).error || (aiServiceError as any).details;
        if (objMsg && typeof objMsg === 'string') {
            currentAiError = `Kesalahan layanan AI: ${objMsg}. Hasil akan ditinjau manual.`;
        } else {
             currentAiError = "Terjadi kesalahan tidak terduga dengan layanan AI. Hasil akan ditinjau secara manual.";
        }
      }
      
      try {
        const errorSavePayload: TestSubmissionUpdatePayload = {
          analysisStatus: 'ai_failed_pending_manual',
          aiError: currentAiError
        };
        const updatedDataOnError = await updateSubmission(submissionId, errorSavePayload);
        if (updatedDataOnError) {
          submission = mapLocalSubmissionToCamelCase(updatedDataOnError);
        } else {
            console.warn(`UpdateSubmission for ${submissionId} with AI service error returned no data. Using locally updated error state.`);
            submission.analysisStatus = 'ai_failed_pending_manual'; // Update local state directly
            submission.aiError = currentAiError;
        }
      } catch (updateErrorOnAiServiceFail) {
         console.error(`Error saving AI service failure status to database for ${submissionId}:`, updateErrorOnAiServiceFail);
         submission.analysisStatus = 'ai_failed_pending_manual';
         submission.aiError = (currentAiError ? `${currentAiError} ` : "") + `Selain itu, gagal menyimpan status ini ke DB: ${(updateErrorOnAiServiceFail as Error).message}`;
      }
    }
    console.log('[ResultsContent] Submission data after AI processing attempt (SHOULD BE CAMELCASE):', JSON.stringify(submission, null, 2));
  }
  
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
            <p className="text-muted-foreground">Harap tunggu selagi kami memproses pengiriman Anda dan membuat analisis.</p>
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

    
