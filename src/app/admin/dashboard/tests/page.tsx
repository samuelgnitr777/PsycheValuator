import Link from 'next/link';
import { getTests } from '@/lib/dataService';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle, ListChecks } from 'lucide-react';
import { TestListTable } from '@/components/admin/TestListTable';
import { deleteTestAction } from './actions';
import Image from 'next/image';

export default async function ManageTestsPage() {
  const tests = await getTests();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ListChecks className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold font-headline">Manage Tests</h1>
            <p className="text-muted-foreground">Create, view, edit, and delete psychology tests.</p>
          </div>
        </div>
        <Button asChild>
          <Link href="/admin/dashboard/tests/create">
            <PlusCircle className="mr-2 h-4 w-4" /> Create New Test
          </Link>
        </Button>
      </div>

      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Existing Tests</CardTitle>
          <CardDescription>
            A list of all psychological tests currently in the system.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {tests.length > 0 ? (
            <TestListTable tests={tests} onDeleteTest={deleteTestAction} />
          ) : (
            <div className="text-center py-10">
              <Image 
                src="https://placehold.co/300x200.png" 
                alt="No tests created" 
                width={300} 
                height={200} 
                className="mx-auto mb-4 rounded-md"
                data-ai-hint="empty state documents"
              />
              <p className="text-muted-foreground text-lg">No tests have been created yet.</p>
              <Button asChild className="mt-4">
                <Link href="/admin/dashboard/tests/create">
                  <PlusCircle className="mr-2 h-4 w-4" /> Create Your First Test
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
