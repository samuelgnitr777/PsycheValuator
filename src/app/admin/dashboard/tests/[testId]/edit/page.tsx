
import { getTestById } from '@/lib/dataService';
import { TestForm } from '@/components/admin/TestForm';
import { QuestionList } from '@/components/admin/QuestionList';
import { updateTestAction, addQuestionAction, updateQuestionAction, deleteQuestionAction } from '../../actions';
import { notFound } from 'next/navigation';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, Edit3 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import EditTestFormClient from './EditTestFormClient'; 
import ManageQuestionsClient from './ManageQuestionsClient'; 

export default async function EditTestPage({ params }: { params: { testId: string } }) {
  const test = await getTestById(params.testId);

  if (!test) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Edit3 className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold font-headline">Edit Tes: {test.title}</h1>
            <p className="text-muted-foreground">Ubah detail tes dan kelola pertanyaannya.</p>
          </div>
        </div>
        <Button variant="outline" asChild>
          <Link href="/admin/dashboard/tests">
            <ArrowLeft className="mr-2 h-4 w-4" /> Kembali ke Daftar Tes
          </Link>
        </Button>
      </div>

      <Tabs defaultValue="details" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:w-[400px]">
          <TabsTrigger value="details">Detail Tes</TabsTrigger>
          <TabsTrigger value="questions">Kelola Pertanyaan</TabsTrigger>
        </TabsList>
        <TabsContent value="details" className="mt-6">
          <EditTestFormClient initialTest={test} updateTestAction={updateTestAction} />
        </TabsContent>
        <TabsContent value="questions" className="mt-6">
          <ManageQuestionsClient 
            test={test} 
            addQuestionAction={addQuestionAction}
            updateQuestionAction={updateQuestionAction}
            deleteQuestionAction={deleteQuestionAction}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

