'use client';

import Link from 'next/link';
import { Test } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Edit, Trash2, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface TestListTableProps {
  tests: Test[];
  onDeleteTest: (testId: string) => Promise<void>;
}

export function TestListTable({ tests, onDeleteTest }: TestListTableProps) {
  const { toast } = useToast();

  const handleDelete = async (testId: string) => {
    try {
      await onDeleteTest(testId);
      toast({ title: 'Test Deleted', description: 'The test has been successfully deleted.' });
    } catch (error) {
      toast({ title: 'Error Deleting Test', description: 'Could not delete the test.', variant: 'destructive' });
    }
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Title</TableHead>
          <TableHead>Description</TableHead>
          <TableHead className="text-center">Questions</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {tests.map((test) => (
          <TableRow key={test.id}>
            <TableCell className="font-medium">{test.title}</TableCell>
            <TableCell className="max-w-xs truncate">{test.description}</TableCell>
            <TableCell className="text-center">{test.questions.length}</TableCell>
            <TableCell className="text-right space-x-2">
              <Button variant="outline" size="icon" asChild title="View Test">
                <Link href={`/tests/${test.id}`} target="_blank">
                  <Eye className="h-4 w-4 text-[hsl(var(--accent))]" />
                </Link>
              </Button>
              <Button variant="outline" size="icon" asChild title="Edit Test">
                <Link href={`/admin/dashboard/tests/${test.id}/edit`}>
                  <Edit className="h-4 w-4" />
                </Link>
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="icon" title="Delete Test">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete the test
                      and all its associated questions.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => handleDelete(test.id)}>
                      Delete
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
