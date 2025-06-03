
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

      if (aiResult.error) { 
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
      } else { 
        currentAiError = "Analisis AI tidak menghasilkan output yang diharapkan.";
        const updatedData = await updateSubmission(submissionId, { 
            analysisStatus: 'ai_failed_pending_manual', 
            aiError: currentAiError 
        });
        if (updatedData) submission = updatedData;
      }
    } catch (e) { 
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
