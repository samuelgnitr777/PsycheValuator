
import Link from 'next/link';
import { getAllSubmissionsAdminWithTestTitles } from '@/lib/dataService';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ClipboardCheck, Edit } from 'lucide-react';
import { SubmissionListTable } from '@/components/admin/SubmissionListTable';
import Image from 'next/image';

export const dynamic = 'force-dynamic';

export default async function ManualReviewsPage() {
  const submissions = await getAllSubmissionsAdminWithTestTitles();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <ClipboardCheck className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-2xl font-bold font-headline">Tinjauan Manual Pengiriman Tes</h1>
          <p className="text-muted-foreground">Lihat, tinjau, dan tambahkan catatan pada pengiriman tes pengguna.</p>
        </div>
      </div>

      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Daftar Pengiriman Tes</CardTitle>
          <CardDescription>
            Berikut adalah semua pengiriman tes yang tercatat di sistem.
            Klik "Tinjau" untuk melihat detail dan menambahkan catatan manual.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {submissions.length > 0 ? (
            <SubmissionListTable submissions={submissions} />
          ) : (
            <div className="text-center py-10">
              <Image 
                src="https://placehold.co/300x200.png" 
                alt="Belum ada pengiriman tes" 
                width={300} 
                height={200} 
                className="mx-auto mb-4 rounded-md"
                data-ai-hint="empty inbox list"
              />
              <p className="text-muted-foreground text-lg">Belum ada pengiriman tes yang tercatat.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
