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
          <CardTitle className="text-2xl font-headline">Error: Missing Submission Data</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            We couldn't find your test responses. This might be due to a technical issue or an invalid link.
          </p>
          <Button asChild>
            <Link href="/">
              <Home className="mr-2 h-4 w-4" /> Go to Homepage
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
          <CardTitle className="text-2xl font-headline">Error: Invalid Submission Data</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            There was an issue processing your test responses. The data format is incorrect.
          </p>
          <Button asChild>
            <Link href={`/tests/${testId}`}>
             <RefreshCw className="mr-2 h-4 w-4" /> Retake Test
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }
  
  // Prepare responses string for AI
  const responsesString = submission.answers
    .map(ans => {
      const question = test.questions.find(q => q.id === ans.questionId);
      return `Q: ${question?.text || 'Unknown Question'}\nA: ${ans.value}`;
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
    // analysisResult remains null
  } finally {
    isLoadingAnalysis = false;
  }
  
  return (
    <ResultsDisplay 
      test={test} 
      submission={submission} 
      analysis={analysisResult}
      isLoadingAnalysis={isLoadingAnalysis} // This will be false by the time it renders here.
                                          // For true loading state, this needs to be client-side or suspense boundary.
                                          // The provided design makes this server component, so AI call is blocking.
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
            <h2 className="text-2xl font-semibold">Loading Your Results...</h2>
            <p className="text-muted-foreground">Please wait while we process your submission and generate analysis.</p>
          </Card>
        }>
          {/* @ts-expect-error Async Server Component */}
          <ResultsContent testId={params.testId} submissionDataString={searchParams.data} />
        </Suspense>
        <div className="flex gap-4 mt-8">
            <Button asChild variant="outline">
                <Link href="/">
                    <Home className="mr-2 h-4 w-4" /> Back to Homepage
                </Link>
            </Button>
            <Button asChild>
                <Link href={`/tests/${params.testId}`}>
                    <RefreshCw className="mr-2 h-4 w-4" /> Take Test Again
                </Link>
            </Button>
        </div>
      </main>
      <footer className="text-center py-6 border-t text-sm text-muted-foreground">
        Thank you for using PsycheValuator!
      </footer>
    </div>
  );
}

export const dynamic = 'force-dynamic'; // Ensure AI call is fresh if it were client-side triggered
