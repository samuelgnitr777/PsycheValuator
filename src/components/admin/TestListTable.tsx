
'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Test } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Edit, Trash2, Eye, Power, PowerOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { toggleTestPublicationAction } from '@/app/admin/dashboard/tests/actions';
import { Badge } from '@/components/ui/badge';

interface TestListTableProps {
  tests: Test[];
  onDeleteTest: (testId: string) => Promise<{ success: boolean; message?: string; }>;
}

export function TestListTable({ tests, onDeleteTest }: TestListTableProps) {
  const { toast } = useToast();
  const router = useRouter();

  const handleDelete = async (testId: string, testTitle: string) => {
    const result = await onDeleteTest(testId);
    if (result.success) {
      toast({ title: 'Tes Dihapus', description: `Tes "${testTitle}" telah berhasil dihapus.` });
      router.refresh(); // Force refresh
    } else {
      toast({ title: 'Error Menghapus Tes', description: result.message || 'Tidak dapat menghapus tes.', variant: 'destructive' });
    }
  };

  const handleTogglePublication = async (testId: string, currentIsPublished: boolean, testTitle: string) => {
    const result = await toggleTestPublicationAction(testId, !currentIsPublished);
    if (result.success && result.test) {
      toast({ 
        title: 'Status Publikasi Diperbarui', 
        description: `Tes "${testTitle}" sekarang ${result.test.isPublished ? 'diterbitkan' : 'draft'}.` 
      });
      router.refresh(); // Force refresh to reflect publication status change
    } else {
      toast({ title: 'Error', description: result.message || 'Tidak dapat memperbarui status publikasi.', variant: 'destructive' });
    }
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Judul</TableHead>
          <TableHead>Deskripsi</TableHead>
          <TableHead className="text-center">Pertanyaan</TableHead>
          <TableHead className="text-center">Status</TableHead>
          <TableHead className="text-right">Tindakan</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {tests.map((test) => (
          <TableRow key={test.id}>
            <TableCell className="font-medium">{test.title}</TableCell>
            <TableCell className="max-w-xs truncate">{test.description}</TableCell>
            <TableCell className="text-center">{test.questions.length}</TableCell>
            <TableCell className="text-center">
              <div className="flex items-center justify-center space-x-2">
                <Switch
                  id={`publish-switch-${test.id}`}
                  checked={test.isPublished}
                  onCheckedChange={() => handleTogglePublication(test.id, test.isPublished, test.title)}
                  aria-label={test.isPublished ? "Batalkan publikasi tes" : "Publikasikan tes"}
                />
                 <Badge variant={test.isPublished ? 'default' : 'secondary'} className="text-xs py-1 px-2">
                  {test.isPublished ? <Power className="h-3 w-3 mr-1"/> : <PowerOff className="h-3 w-3 mr-1"/>}
                  {test.isPublished ? "Diterbitkan" : "Draft"}
                </Badge>
              </div>
            </TableCell>
            <TableCell className="text-right space-x-1">
              <Button variant="outline" size="icon" asChild title="Lihat Tes (Publik)">
                <Link href={`/tests/${test.id}`} target="_blank">
                  <Eye className="h-4 w-4 text-[hsl(var(--accent))]" />
                </Link>
              </Button>
              <Button variant="outline" size="icon" asChild title="Edit Tes">
                <Link href={`/admin/dashboard/tests/${test.id}/edit`}>
                  <Edit className="h-4 w-4" />
                </Link>
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="icon" title="Hapus Tes">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Apakah Anda yakin?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Tindakan ini tidak dapat dibatalkan. Ini akan menghapus tes secara permanen
                      beserta semua pertanyaan terkait.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Batal</AlertDialogCancel>
                    <AlertDialogAction onClick={() => handleDelete(test.id, test.title)}>
                      Hapus
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

