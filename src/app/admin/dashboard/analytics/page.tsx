
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getAllTestsAdmin, getAllSubmissionsAdminWithTestTitles } from "@/lib/dataService";
import { BarChart3, FileText, Users } from "lucide-react";
import Image from "next/image";

export const dynamic = 'force-dynamic';

export default async function AnalyticsPage() {
  const tests = await getAllTestsAdmin();
  const submissions = await getAllSubmissionsAdminWithTestTitles();

  const totalTests = tests.length;
  const totalSubmissions = submissions.length;
  const averageSubmissionsPerTest = totalTests > 0 ? (totalSubmissions / totalTests).toFixed(1) : 0;

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <BarChart3 className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-2xl font-bold font-headline">Analitik Platform</h1>
          <p className="text-muted-foreground">Tinjauan umum aktivitas dan data PsycheValuator.</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tes</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTests}</div>
            <p className="text-xs text-muted-foreground">Jumlah tes yang tersedia di platform.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pengiriman</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSubmissions}</div>
            <p className="text-xs text-muted-foreground">Jumlah total tes yang telah dikirim.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rata-rata Pengiriman per Tes</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{averageSubmissionsPerTest}</div>
            <p className="text-xs text-muted-foreground">Rata-rata pengiriman untuk setiap tes.</p>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Pengembangan Lebih Lanjut</CardTitle>
          <CardDescription>Fitur analitik yang lebih mendalam sedang dalam pengembangan.</CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <Image
            src="https://placehold.co/600x300.png"
            alt="Grafik Pengembangan"
            width={600}
            height={300}
            className="mx-auto mb-4 rounded-md"
            data-ai-hint="analytics chart development"
          />
          <p className="text-muted-foreground">
            Kami sedang bekerja untuk menyediakan visualisasi data yang lebih kaya,
            tren respons, dan banyak lagi. Pantau terus untuk pembaruan!
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
