
import { Suspense } from 'react';
import { getTestById } from '@/lib/dataService';
import { analyzeTestResponses, AnalyzeTestResponsesOutput } from '@/ai/flows/analyze-test-responses';
import { ResultsDisplay } from '@/components/test/ResultsDisplay';
import { notFound } from 'next/navigation';
import type { TestSubmission } from '@/types';
import Header from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Home, RefreshCw, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface TestResultsPageProps {
  params: { testId: string };
  searchParams: { data?: string };
}

async function ResultsContent({ testId, submissionDataString }: { testId: string, submissionDataString?: string }) {
  const test = await getTestById(testId);

  if (!test) {
    notFound();
  }

  if (!submissionDataString) {
    return (
       <Card className="w-full max-w-lg mx-auto text-center shadow-lg">
        <CardHeader>
          <AlertTriangle className="mx-auto h-12 w-12 text-destructive mb-4" />
          <CardTitle className="text-2xl font-headline">Error: Data Pengiriman Hilang</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Kami tidak dapat menemukan respons tes Anda. Ini mungkin karena masalah teknis atau tautan yang tidak valid.
          </p>
          <Button asChild>
            <Link href="/">
              <Home className="mr-2 h-4 w-4" /> Kembali ke Beranda
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  let submission: TestSubmission;
  try {
    submission = JSON.parse(submissionDataString);
  } catch (error) {
     return (
       <Card className="w-full max-w-lg mx-auto text-center shadow-lg">
        <CardHeader>
          <AlertTriangle className="mx-auto h-12 w-12 text-destructive mb-4" />
          <CardTitle className="text-2xl font-headline">Error: Data Pengiriman Tidak Valid</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Terjadi masalah saat memproses respons tes Anda. Format data salah.
          </p>
          <Button asChild>
            <Link href={`/tests/${testId}`}>
             <RefreshCw className="mr-2 h-4 w-4" /> Ulangi Tes
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }
  
  const responsesString = submission.answers
    .map(ans => {
      const question = test.questions.find(q => q.id === ans.questionId);
      return `Q: ${question?.text || 'Pertanyaan Tidak Diketahui'}\nA: ${ans.value}`;
    })
    .join('\n\n');

  let analysisResult: AnalyzeTestResponsesOutput | null = null;
  let isLoadingAnalysis = true;
  try {
    analysisResult = await analyzeTestResponses({
      responses: responsesString,
      timeTaken: submission.timeTaken,
    });
  } catch (error) {
    console.error("AI Analysis Error:", error);
  } finally {
    isLoadingAnalysis = false;
  }
  
  return (
    <ResultsDisplay 
      test={test} 
      submission={submission} 
      analysis={analysisResult}
      isLoadingAnalysis={isLoadingAnalysis}
    />
  );
}


export default function TestResultsPage({ params, searchParams }: TestResultsPageProps) {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8 flex flex-col items-center space-y-8">
        <Suspense fallback={
          <Card className="w-full max-w-3xl mx-auto shadow-xl p-8 text-center">
            <RefreshCw className="mx-auto h-12 w-12 animate-spin text-primary mb-4" />
            <h2 className="text-2xl font-semibold">Memuat Hasil Anda...</h2>
            <p className="text-muted-foreground">Harap tunggu selagi kami memproses pengiriman Anda dan membuat analisis.</p>
          </Card>
        }>
          {/* @ts-expect-error Async Server Component */}
          <ResultsContent testId={params.testId} submissionDataString={searchParams.data} />
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

export const dynamic = 'force-dynamic';

