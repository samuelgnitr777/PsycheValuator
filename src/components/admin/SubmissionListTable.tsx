
'use client';

import Link from 'next/link';
import type { TestSubmission } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { format, parseISO, isValid } from 'date-fns';
import { id as indonesiaLocale } from 'date-fns/locale';

interface SubmissionListTableProps {
  submissions: (TestSubmission & { testTitle: string | null })[];
}

function formatSubmittedAt(isoString: string | null | undefined): string {
  if (!isoString) return "N/A";
  try {
    const dateObj = parseISO(isoString);
    if (!isValid(dateObj)) return "Tanggal Tidak Valid";
    return format(dateObj, "dd MMM yyyy, HH:mm", { locale: indonesiaLocale });
  } catch (error) {
    return "Error Format Tanggal";
  }
}

function getStatusBadgeVariant(status: TestSubmission['analysisStatus']): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case 'ai_completed':
    case 'manual_review_completed':
      return 'default'; // Greenish or primary
    case 'pending_ai':
      return 'secondary'; // Yellowish or gray
    case 'ai_failed_pending_manual':
      return 'destructive'; // Reddish
    default:
      return 'outline';
  }
}

function getStatusDisplay(status: TestSubmission['analysisStatus']): string {
  switch (status) {
    case 'pending_ai': return 'Menunggu AI';
    case 'ai_completed': return 'AI Selesai';
    case 'ai_failed_pending_manual': return 'AI Gagal (Manual)';
    case 'manual_review_completed': return 'Manual Selesai';
    default: return status;
  }
}

const StatusIcon = ({ status }: { status: TestSubmission['analysisStatus'] }) => {
  switch (status) {
    case 'pending_ai': return <Clock className="mr-2 h-3 w-3" />;
    case 'ai_completed':
    case 'manual_review_completed': return <CheckCircle className="mr-2 h-3 w-3" />;
    case 'ai_failed_pending_manual': return <AlertTriangle className="mr-2 h-3 w-3" />;
    default: return null;
  }
};


export function SubmissionListTable({ submissions }: SubmissionListTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Judul Tes</TableHead>
          <TableHead>Nama Pengguna</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Waktu Pengiriman</TableHead>
          <TableHead className="text-center">Status Analisis</TableHead>
          <TableHead>Error AI</TableHead>
          <TableHead className="text-right">Tindakan</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {submissions.map((submission) => (
          <TableRow key={submission.id}>
            <TableCell className="font-medium">{submission.testTitle || 'Test Tidak Diketahui'}</TableCell>
            <TableCell>{submission.fullName}</TableCell>
            <TableCell>{submission.email}</TableCell>
            <TableCell>{formatSubmittedAt(submission.submittedAt)}</TableCell>
            <TableCell className="text-center">
              <Badge variant={getStatusBadgeVariant(submission.analysisStatus)} className="text-xs py-1 px-2">
                <StatusIcon status={submission.analysisStatus} />
                {getStatusDisplay(submission.analysisStatus)}
              </Badge>
            </TableCell>
            <TableCell className="max-w-xs truncate text-destructive text-xs">
              {submission.aiError || '-'}
            </TableCell>
            <TableCell className="text-right space-x-1">
              <Button variant="outline" size="sm" asChild title="Tinjau Pengiriman">
                <Link href={`/admin/dashboard/manual-reviews/${submission.id}`}>
                  <Edit className="mr-1 h-4 w-4" /> Tinjau
                </Link>
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
