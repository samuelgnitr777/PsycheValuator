

import Link from 'next/link';
import { getTests } from '@/lib/dataService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, CheckSquare } from 'lucide-react';
import Header from '@/components/layout/Header';
import Image from 'next/image';

export const dynamic = 'force-dynamic'; // Ensure fresh data on each load

export default async function HomePage() {
  const allTests = await getTests();
  const publishedTests = allTests.filter(test => test.isPublished);

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        <section className="text-center mb-12">
          <h1 className="text-4xl font-bold font-headline mb-4 text-primary">Selamat Datang di PsycheValuator</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Temukan wawasan tentang diri Anda melalui penilaian psikologis kami yang dirancang dengan cermat.
            Pilih tes di bawah ini untuk memulai.
          </p>
        </section>

        {publishedTests.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {publishedTests.map((test) => (
              <Card key={test.id} className="flex flex-col overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 rounded-lg">
                <CardHeader>
                  <div className="flex items-center mb-2">
                    <CheckSquare className="h-6 w-6 text-[hsl(var(--accent))] mr-3" />
                    <CardTitle className="font-headline text-xl">{test.title}</CardTitle>
                  </div>
                  <CardDescription className="text-sm h-20 overflow-hidden text-ellipsis">{test.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex-grow flex flex-col justify-end">
                    <Image 
                        src={`https://placehold.co/600x400.png?text=${encodeURIComponent(test.title)}`} 
                        alt={test.title} 
                        width={600} 
                        height={400} 
                        className="rounded-md mb-4 object-cover aspect-video"
                        data-ai-hint="abstract psychology"
                    />
                  <Button asChild className="w-full mt-auto bg-primary hover:bg-primary/90 text-primary-foreground">
                    <Link href={`/tests/${test.id}`}>
                      Mulai Tes <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-10">
            <Image 
              src="https://placehold.co/300x200.png" 
              alt="Tidak ada tes tersedia" 
              width={300} 
              height={200} 
              className="mx-auto mb-4 rounded-md"
              data-ai-hint="empty state folder"
            />
            <p className="text-muted-foreground text-lg">Tidak ada tes yang tersedia saat ini. Silakan periksa kembali nanti.</p>
          </div>
        )}
      </main>
      <footer className="text-center py-6 border-t text-sm text-muted-foreground">
        © {new Date().getFullYear()} PsycheValuator. Hak cipta dilindungi.
      </footer>
    </div>
  );
}

