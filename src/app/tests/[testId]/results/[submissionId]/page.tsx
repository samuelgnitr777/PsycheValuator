
import { Suspense } from 'react';
import { getTestById, getSubmissionById, updateSubmission } from '@/lib/dataService';
import { analyzeTestResponses, AnalyzeTestResponsesOutput } from '@/ai/flows/analyze-test-responses';
import { ResultsDisplay } from '@/components/test/ResultsDisplay';
import { notFound } from 'next/navigation';
import type { TestSubmission } from '@/types';
import Header from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Home, RefreshCw, AlertTriangle, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface TestResultsPageProps {
  params: { testId: string; submissionId: string };
}

async function ResultsContent({ testId, submissionId }: { testId: string, submissionId: string }) {
  let submission = await getSubmissionById(submissionId);
  const test = await getTestById(testId);

  if (!test || !submission) {
    notFound();
  }
  
  // If AI analysis is pending, attempt it
  if (submission.analysisStatus === 'pending_ai') {
    const responsesString = submission.answers
      .map(ans => {
        const question = test.questions.find(q => q.id === ans.questionId);
        return `Q: ${question?.text || 'Pertanyaan Tidak Diketahui'}\nA: ${ans.value}`;
      })
      .join('\n\n');

    let aiResult: AnalyzeTestResponsesOutput | null = null;
    let currentAiError: string | null = null;

    try {
      aiResult = await analyzeTestResponses({
        responses: responsesString,
        timeTaken: submission.timeTaken,
      });

      if (aiResult.error) { // Error from within the flow (e.g. AI couldn't generate expected output)
        currentAiError = aiResult.error;
        const updatedData = await updateSubmission(submissionId, { 
          analysisStatus: 'ai_failed_pending_manual', 
          aiError: currentAiError 
        });
        if (updatedData) submission = updatedData;
      } else if (aiResult.psychologicalTraits) {
        const updatedData = await updateSubmission(submissionId, { 
          analysisStatus: 'ai_completed', 
          psychologicalTraits: aiResult.psychologicalTraits 
        });
         if (updatedData) submission = updatedData;
      } else { // Unexpected: no error, no traits
        currentAiError = "Analisis AI tidak menghasilkan output yang diharapkan.";
        const updatedData = await updateSubmission(submissionId, { 
            analysisStatus: 'ai_failed_pending_manual', 
            aiError: currentAiError 
        });
        if (updatedData) submission = updatedData;
      }
    } catch (e) { // Catch errors from the analyzeTestResponses call itself (e.g. network, 503)
      console.error("Error during AI analysis call:", e);
      currentAiError = "Gagal menghubungi layanan analisis. Hasil Anda akan ditinjau secara manual.";
      if (e instanceof Error) {
        if (e.message.includes("503 Service Unavailable") || e.message.includes("model is overloaded") || e.message.includes("overloaded")) {
          currentAiError = "Layanan analisis AI sedang kelebihan beban. Hasil Anda akan ditinjau secara manual.";
        } else if (e.message.includes("Deadline exceeded")) {
          currentAiError = "Waktu tunggu untuk layanan analisis AI habis. Hasil Anda akan ditinjau secara manual.";
        }
      }
      const updatedData = await updateSubmission(submissionId, { 
        analysisStatus: 'ai_failed_pending_manual', 
        aiError: currentAiError 
      });
      if (updatedData) submission = updatedData;
    }
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
      <main className="flex-grow container mx-auto px-4 py-8 flex flex-col items-center space-y-8">
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
        <div className="flex gap-4 mt-8">
            <Button asChild variant="outline">
                <Link href="/">
                    <Home className="mr-2 h-4 w-4" /> Kembali ke Beranda
                </Link>
            </Button>
            <Button asChild>
                <Link href={`/tests/${params.testId}`}>
                    <RefreshCw className="mr-2 h-4 w-4" /> Ikuti Tes Lagi
                </Link>
            </Button>
        </div>
      </main>
      <footer className="text-center py-6 border-t text-sm text-muted-foreground">
        Terima kasih telah menggunakan PsycheValuator!
      </footer>
    </div>
  );
}

// This page now depends on submissionId, which changes for each submission.
// It should be dynamic. If AI analysis is involved, it should not be fully static.
export const dynamic = 'force-dynamic'; 
