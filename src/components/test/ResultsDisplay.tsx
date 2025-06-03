'use client';

import { Test, TestSubmission } from '@/types';
import { AnalyzeTestResponsesOutput } from '@/ai/flows/analyze-test-responses';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Clock, Brain, FileText, Activity } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ResultsDisplayProps {
  test: Test;
  submission: TestSubmission;
  analysis: AnalyzeTestResponsesOutput | null; // Can be null if AI call fails or is pending
  isLoadingAnalysis: boolean;
}

function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  let timeString = '';
  if (minutes > 0) {
    timeString += `${minutes} minute${minutes > 1 ? 's' : ''}`;
  }
  if (remainingSeconds > 0) {
    if (minutes > 0) timeString += ' and ';
    timeString += `${remainingSeconds} second${remainingSeconds > 1 ? 's' : ''}`;
  }
  if (timeString === '') return '0 seconds';
  return timeString;
}


export function ResultsDisplay({ test, submission, analysis, isLoadingAnalysis }: ResultsDisplayProps) {
  const answersMap = new Map(submission.answers.map(a => [a.questionId, a.value]));

  return (
    <Card className="w-full max-w-3xl mx-auto shadow-xl">
      <CardHeader className="text-center bg-muted/30 rounded-t-lg">
        <CheckCircle className="mx-auto h-16 w-16 text-accent mb-3" />
        <CardTitle className="text-3xl font-headline text-primary">Test Completed: {test.title}</CardTitle>
        <CardDescription className="text-lg">Here are your results and analysis.</CardDescription>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-center">
            <Card className="p-4 bg-secondary/50">
                <CardHeader className="p-2">
                    <Clock className="mx-auto h-8 w-8 text-primary mb-2" />
                    <CardTitle className="text-lg font-semibold">Time Taken</CardTitle>
                </CardHeader>
                <CardContent className="p-2">
                    <p className="text-2xl font-bold">{formatTime(submission.timeTaken)}</p>
                </CardContent>
            </Card>
            <Card className="p-4 bg-secondary/50">
                <CardHeader className="p-2">
                    <FileText className="mx-auto h-8 w-8 text-primary mb-2" />
                    <CardTitle className="text-lg font-semibold">Questions Answered</CardTitle>
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
            Psychological Trait Analysis
          </h3>
          {isLoadingAnalysis ? (
            <div className="space-y-2 p-4 border rounded-md bg-muted/50">
              <div className="h-4 bg-muted rounded w-3/4 animate-pulse"></div>
              <div className="h-4 bg-muted rounded w-1/2 animate-pulse"></div>
              <div className="h-4 bg-muted rounded w-5/6 animate-pulse"></div>
              <p className="text-sm text-muted-foreground mt-2">Generating analysis, please wait...</p>
            </div>
          ) : analysis?.psychologicalTraits ? (
            <Card className="bg-background border-primary/30">
                <CardContent className="p-4">
                    <p className="whitespace-pre-wrap leading-relaxed text-foreground/90">{analysis.psychologicalTraits}</p>
                </CardContent>
            </Card>
          ) : (
            <p className="text-muted-foreground p-4 border rounded-md bg-muted/20">
              Analysis could not be generated at this time.
            </p>
          )}
        </div>

        <Separator />

        <div>
          <h3 className="text-xl font-semibold mb-3 flex items-center text-primary">
            <Activity className="mr-2 h-6 w-6 text-[hsl(var(--accent))]" />
            Your Responses
          </h3>
          <ScrollArea className="h-72 w-full rounded-md border p-1">
            <div className="p-3 space-y-3">
            {test.questions.map((q, index) => (
              <div key={q.id} className="pb-3 border-b last:border-b-0">
                <p className="font-medium text-foreground/80">Q{index + 1}: {q.text}</p>
                <p className="text-accent-foreground bg-accent/10 p-2 rounded-md mt-1 text-sm">
                  <strong>Your Answer:</strong> {answersMap.get(q.id)?.toString() || <span className="italic text-muted-foreground">Not answered</span>}
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
