import { getTestById } from '@/lib/dataService';
import { TestPlayer } from '@/components/test/TestPlayer';
import { notFound } from 'next/navigation';
import Header from '@/components/layout/Header';

export default async function TestPage({ params }: { params: { testId: string } }) {
  const test = await getTestById(params.testId);

  if (!test) {
    notFound();
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8 flex justify-center items-start">
        <TestPlayer test={test} />
      </main>
       <footer className="text-center py-6 border-t text-sm text-muted-foreground">
        PsycheValuator Test Interface
      </footer>
    </div>
  );
}
