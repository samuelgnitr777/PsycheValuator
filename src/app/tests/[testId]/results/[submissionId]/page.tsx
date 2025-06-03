
import { Suspense } from 'react';
import { getTestById, getSubmissionById, updateSubmission } from '@/lib/dataService';
import { analyzeTestResponses, AnalyzeTestResponsesOutput } from '@/ai/flows/analyze-test-responses';
import { ResultsDisplay } from '@/components/test/ResultsDisplay';
import { notFound } from 'next/navigation';
import type { TestSubmission, TestSubmissionUpdatePayload } from '@/types';
import Header from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Home, RefreshCw, AlertTriangle, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface TestResultsPageProps {
  params: { testId: string; submissionId: string };
}

async function ResultsContent({ testId, submissionId }: { testId: string, submissionId: string }) {
  let submission = await getSubmissionById(submissionId); // Initial fetch
  const test = await getTestById(testId);

  if (!test || !submission) {
    notFound();
  }
  
  console.log('[ResultsContent] Initial submission data:', JSON.stringify(submission, null, 2));


  // If AI analysis is pending, attempt it
  if (submission.analysisStatus === 'pending_ai') {
    let aiResult: AnalyzeTestResponsesOutput | null = null;
    let currentAiError: string | null = null; 

    try {
      // Step 1: Call AI Analysis
      aiResult = await analyzeTestResponses({
        responses: submission.answers
          .map(ans => {
            const question = test.questions.find(q => q.id === ans.questionId);
            return `Q: ${question?.text || 'Pertanyaan Tidak Diketahui'}\nA: ${ans.value}`;
          })
          .join('\n\n'),
        timeTaken: submission.timeTaken,
      });

      // Step 2: Determine payload based on AI result
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

      // Step 3: Attempt to save the AI outcome to the database
      try {
        const updatedData = await updateSubmission(submissionId, updatePayload);
        if (updatedData) {
          submission = updatedData; // Update local submission state with new data
        } else {
          console.warn(`UpdateSubmission for ${submissionId} with AI results returned no data. Re-fetching to ensure consistency.`);
          const refreshedSubmission = await getSubmissionById(submissionId);
          if (refreshedSubmission) {
            submission = refreshedSubmission;
          } else {
            console.error(`CRITICAL: Failed to re-fetch submission ${submissionId} after AI update attempt returned no data. Current submission state might be stale.`);
            // Potentially set an error on the submission object to reflect this to the user if appropriate
            submission.aiError = submission.aiError ? `${submission.aiError} Gagal menyinkronkan status terbaru.` : "Gagal menyinkronkan status terbaru setelah analisis.";
          }
        }
      } catch (dbUpdateError) {
        console.error(`Error saving AI analysis results to database for submission ${submissionId}:`, dbUpdateError);
        currentAiError = `Gagal menyimpan hasil analisis ke database: ${(dbUpdateError as Error).message}.`;
        
        submission.analysisStatus = 'ai_failed_pending_manual';
        submission.aiError = currentAiError;
      }
    } catch (aiServiceError) { 
      console.error(`Error during AI service call (analyzeTestResponses) for submission ${submissionId}:`, aiServiceError);
      currentAiError = "Gagal menghubungi layanan analisis AI.";
      if (aiServiceError instanceof Error) {
        if (aiServiceError.message.includes("503") || aiServiceError.message.toLowerCase().includes("model is overloaded") || aiServiceError.message.toLowerCase().includes("overloaded")) {
          currentAiError = "Layanan analisis AI sedang kelebihan beban. Hasil Anda akan ditinjau secara manual.";
        } else if (aiServiceError.message.toLowerCase().includes("deadline exceeded")) {
          currentAiError = "Waktu tunggu untuk layanan analisis AI habis. Hasil Anda akan ditinjau secara manual.";
        } else {
          currentAiError = `Layanan AI Error: ${(aiServiceError as Error).message}. Hasil akan ditinjau manual.`;
        }
      }
      
      // Attempt to save this AI service error state to the database, but update local state regardless
      try {
        const errorSavePayload: TestSubmissionUpdatePayload = {
          analysisStatus: 'ai_failed_pending_manual',
          aiError: currentAiError
        };
        const updatedDataOnError = await updateSubmission(submissionId, errorSavePayload);
        if (updatedDataOnError) {
          submission = updatedDataOnError;
        } else {
            console.warn(`UpdateSubmission for ${submissionId} with AI service error returned no data. Using locally updated error state.`);
            submission.analysisStatus = 'ai_failed_pending_manual';
            submission.aiError = currentAiError;
        }
      } catch (updateErrorOnAiServiceFail) {
         console.error(`Error saving AI service failure status to database for ${submissionId}:`, updateErrorOnAiServiceFail);
         submission.analysisStatus = 'ai_failed_pending_manual';
         submission.aiError = `${currentAiError} Selain itu, gagal menyimpan status ini ke DB: ${(updateErrorOnAiServiceFail as Error).message}`;
      }
    }
    console.log('[ResultsContent] Submission data after AI processing attempt:', JSON.stringify(submission, null, 2));
  }
  
  return (
    <ResultsDisplay 
      test={test} 
      submission={submission} 
    />
  );
}


export default function TestResultsPage({ params }: TestResultsPageProps) {
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
