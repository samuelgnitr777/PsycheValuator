
import { getTestById } from '@/lib/dataService';
import { TestPlayer } from '@/components/test/TestPlayer';
import { notFound } from 'next/navigation';
import Header from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { AlertTriangle } from 'lucide-react';

export const dynamic = 'force-dynamic'; // Ensure dynamic rendering

export default async function TestPage({ params }: { params: { testId: string } }) {
  const test = await getTestById(params.testId);

  if (!test) {
    notFound();
  }

  if (!test.isPublished) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-grow container mx-auto px-4 py-8 flex flex-col justify-center items-center text-center">
          <AlertTriangle className="h-16 w-16 text-destructive mb-4" />
          <h1 className="text-2xl font-bold mb-2">Tes Tidak Tersedia</h1>
          <p className="text-muted-foreground mb-6">Tes yang Anda coba akses saat ini tidak dipublikasikan atau telah ditutup oleh admin.</p>
          <Button asChild>
            <Link href="/">Kembali ke Beranda</Link>
          </Button>
        </main>
        <footer className="text-center py-6 border-t text-sm text-muted-foreground">
          PsycheValuator
        </footer>
      </div>
    );
  }

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
