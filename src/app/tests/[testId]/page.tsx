
import { getPublishedTestById } from '@/lib/dataService'; // Use specific public function
import { TestPlayer } from '@/components/test/TestPlayer';
import { notFound } from 'next/navigation';
import Header from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { AlertTriangle } from 'lucide-react';

export const dynamic = 'force-dynamic'; 

export default async function TestPage({ params }: { params: { testId: string } }) {
  const test = await getPublishedTestById(params.testId); // Fetch only published test

  if (!test) { // This will be true if test doesn't exist or is not published
    notFound();
  }

  // The check for test.isPublished is technically redundant here if getPublishedTestById only returns published tests
  // or undefined. But it's good for explicit clarity if the function's behavior were to change.
  // However, since getPublishedTestById should ensure it's published, we can simplify.
  // if (!test.isPublished) { ... } block can be removed if getPublishedTestById strictly adheres to fetching only published.

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8 flex justify-center items-start">
        <TestPlayer test={test} />
      </main>
       <footer className="text-center py-6 border-t text-sm text-muted-foreground">
        Antarmuka Tes PsycheValuator
      </footer>
    </div>
  );
}
