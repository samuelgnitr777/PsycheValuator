
import { supabase } from './supabaseClient';
import type { Test, Question, QuestionOption, TestSubmission } from '@/types';
import { v4 as uuidv4 } from 'uuid'; // Untuk generate ID untuk QuestionOption jika perlu

// Helper untuk generate ID jika diperlukan (misal untuk QuestionOption)
const generateOptionId = (): string => `opt-${uuidv4()}`;


// Test Management
export async function getTests(): Promise<Test[]> {
  const { data, error } = await supabase
    .from('tests')
    .select(`
      id,
      title,
      description,
      isPublished,
      questions (
        id,
        test_id,
        text,
        type,
        options,
        scale_min,
        scale_max,
        min_label,
        max_label,
        order
      )
    `)
    .order('title', { ascending: true });

  if (error) {
    console.error('Error fetching tests:', error);
    throw error;
  }
  // Supabase client v2 returns questions as an array directly
  return data.map(test => ({
    ...test,
    questions: test.questions || [], // Ensure questions is always an array
  })) as Test[];
}

export async function getTestById(id: string): Promise<Test | undefined> {
  const { data, error } = await supabase
    .from('tests')
    .select(`
      id,
      title,
      description,
      isPublished,
      questions (
        id,
        test_id,
        text,
        type,
        options,
        scale_min,
        scale_max,
        min_label,
        max_label,
        order
      )
    `)
    .eq('id', id)
    .order('order', { foreignTable: 'questions', ascending: true })
    .maybeSingle();

  if (error) {
    console.error(`Error fetching test by id ${id}:`, error);
    throw error;
  }
  if (!data) return undefined;

  return {
    ...data,
    questions: data.questions || [],
  } as Test;
}

export async function createTest(testData: Omit<Test, 'id' | 'questions' | 'isPublished'>): Promise<Test> {
  const { data, error } = await supabase
    .from('tests')
    .insert({
      title: testData.title,
      description: testData.description,
      isPublished: false, // Default to not published
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating test:', error);
    throw error;
  }
  return { ...data, questions: [] } as Test; // New test has no questions yet
}

export async function updateTest(id: string, testData: Partial<Omit<Test, 'id' | 'questions' | 'isPublished'>>): Promise<Test | undefined> {
  const { data, error } = await supabase
    .from('tests')
    .update({
      title: testData.title,
      description: testData.description,
      // isPublished is handled by updateTestPublicationStatus
    })
    .eq('id', id)
    .select(`
      id,
      title,
      description,
      isPublished,
      questions (
        id,
        test_id,
        text,
        type,
        options,
        scale_min,
        scale_max,
        min_label,
        max_label,
        order
      )
    `)
    .order('order', { foreignTable: 'questions', ascending: true })
    .maybeSingle();
    
  if (error) {
    console.error(`Error updating test ${id}:`, error);
    throw error;
  }
  if (!data) return undefined;
  return { ...data, questions: data.questions || [] } as Test;
}

export async function updateTestPublicationStatus(testId: string, isPublished: boolean): Promise<Test | undefined> {
  const { data, error } = await supabase
    .from('tests')
    .update({ isPublished })
    .eq('id', testId)
    .select()
    .single();

  if (error) {
    console.error(`Error updating test publication status ${testId}:`, error);
    throw error;
  }
  if (!data) return undefined;
   // Fetch the full test data with questions to match the return type
  return getTestById(data.id);
}

export async function deleteTest(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('tests')
    .delete()
    .eq('id', id);

  if (error) {
    console.error(`Error deleting test ${id}:`, error);
    // return false or throw error based on how you want to handle it
    return false; 
  }
  return true;
}

// Question Management
export async function addQuestionToTest(testId: string, questionData: Omit<Question, 'id'>): Promise<Question | undefined> {
  // Determine order for the new question
  const { data: existingQuestions, error: countError } = await supabase
    .from('questions')
    .select('order')
    .eq('test_id', testId)
    .order('order', { ascending: false })
    .limit(1);

  if (countError) {
    console.error('Error fetching question count for ordering:', countError);
    throw countError;
  }
  const newOrder = existingQuestions && existingQuestions.length > 0 ? (existingQuestions[0].order || 0) + 1 : 1;

  // Ensure options have IDs if it's a multiple-choice question
  let optionsWithIds: QuestionOption[] | undefined = undefined;
  if (questionData.type === 'multiple-choice' && questionData.options) {
    optionsWithIds = questionData.options.map(opt => ({
      id: opt.id || generateOptionId(),
      text: opt.text,
    }));
  }

  const { data, error } = await supabase
    .from('questions')
    .insert({
      test_id: testId,
      text: questionData.text,
      type: questionData.type,
      options: optionsWithIds, // Store options as JSONB
      scale_min: questionData.scaleMin,
      scale_max: questionData.scaleMax,
      min_label: questionData.minLabel,
      max_label: questionData.maxLabel,
      order: newOrder,
    })
    .select()
    .single();

  if (error) {
    console.error(`Error adding question to test ${testId}:`, error);
    throw error;
  }
  return data as Question;
}

export async function updateQuestionInTest(testId: string, questionId: string, questionData: Partial<Omit<Question, 'id'>>): Promise<Question | undefined> {
   // Ensure options have IDs if it's a multiple-choice question and options are being updated
  let optionsWithIds: QuestionOption[] | undefined = undefined;
  if (questionData.type === 'multiple-choice' && questionData.options) {
    optionsWithIds = questionData.options.map(opt => ({
      id: opt.id || generateOptionId(),
      text: opt.text,
    }));
  }

  const updatePayload: any = { ...questionData };
  if (optionsWithIds) {
    updatePayload.options = optionsWithIds;
  }


  // Clear fields not relevant to the new type if type is changing
  if (questionData.type) {
    if (questionData.type !== 'multiple-choice') {
      updatePayload.options = null;
    }
    if (questionData.type !== 'rating-scale') {
      updatePayload.scale_min = null;
      updatePayload.scale_max = null;
      updatePayload.min_label = null;
      updatePayload.max_label = null;
    }
  }


  const { data, error } = await supabase
    .from('questions')
    .update(updatePayload)
    .eq('id', questionId)
    .eq('test_id', testId) // Ensure it's for the correct test
    .select()
    .single();

  if (error) {
    console.error(`Error updating question ${questionId} in test ${testId}:`, error);
    throw error;
  }
  return data as Question;
}

export async function deleteQuestionFromTest(testId: string, questionId: string): Promise<boolean> {
  const { error } = await supabase
    .from('questions')
    .delete()
    .eq('id', questionId)
    .eq('test_id', testId); // Ensure it's for the correct test

  if (error) {
    console.error(`Error deleting question ${questionId} from test ${testId}:`, error);
    return false;
  }
  return true;
}


// Submission Management
export async function createInitialSubmission(testId: string, fullName: string): Promise<TestSubmission> {
  const { data, error } = await supabase
    .from('submissions')
    .insert({
      test_id: testId,
      full_name: fullName,
      answers: [],
      time_taken: 0,
      submitted_at: new Date().toISOString(),
      analysis_status: 'pending_ai',
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating initial submission:', error);
    throw error;
  }
  return data as TestSubmission;
}

export async function updateSubmission(submissionId: string, submissionData: Partial<Omit<TestSubmission, 'id' | 'testId' | 'fullName'>>): Promise<TestSubmission | undefined> {
  const { data, error } = await supabase
    .from('submissions')
    .update({
      answers: submissionData.answers,
      time_taken: submissionData.timeTaken,
      submitted_at: submissionData.submittedAt,
      analysis_status: submissionData.analysisStatus,
      psychological_traits: submissionData.psychologicalTraits,
      ai_error: submissionData.aiError,
      manual_analysis_notes: submissionData.manualAnalysisNotes,
    })
    .eq('id', submissionId)
    .select()
    .single();

  if (error) {
    console.error(`Error updating submission ${submissionId}:`, error);
    throw error;
  }
  return data as TestSubmission;
}

export async function getSubmissionById(submissionId: string): Promise<TestSubmission | undefined> {
  const { data, error } = await supabase
    .from('submissions')
    .select('*')
    .eq('id', submissionId)
    .maybeSingle();

  if (error) {
    console.error(`Error fetching submission ${submissionId}:`, error);
    throw error;
  }
  return data as TestSubmission | undefined;
}

export async function getAllSubmissions(): Promise<TestSubmission[]> {
  const { data, error } = await supabase
    .from('submissions')
    .select('*')
    .order('submitted_at', { ascending: false });

  if (error) {
    console.error('Error fetching all submissions:', error);
    throw error;
  }
  return data as TestSubmission[];
}
