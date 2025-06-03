
import { supabase } from './supabaseClient';
import type { Test, Question, QuestionOption, UserAnswer, TestSubmission } from '@/types';
import { v4 as uuidv4 } from 'uuid';

// Helper to generate ID for QuestionOption
const generateOptionId = (): string => `opt-${uuidv4()}`;

// --- Test Management ---
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
    console.error('Supabase error fetching tests:', error);
    throw new Error(error.message || 'Failed to fetch tests from Supabase. Check server logs, RLS policies, and ensure tables exist.');
  }
  return (data || []).map(test => ({
    ...test,
    questions: test.questions || [],
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
    console.error(`Supabase error fetching test by id ${id}:`, error);
    throw new Error(error.message || `Failed to fetch test ${id}. Check RLS policies.`);
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
    console.error('Supabase error creating test:', error);
    throw new Error(error.message || 'Failed to create test. Check RLS policies for insert.');
  }
  if (!data) {
    throw new Error('Failed to create test: No data returned from Supabase.');
  }
  return { ...data, questions: [] } as Test;
}

export async function updateTest(id: string, testData: Partial<Omit<Test, 'id' | 'questions' | 'isPublished'>>): Promise<Test | undefined> {
  const { data, error } = await supabase
    .from('tests')
    .update({
      title: testData.title,
      description: testData.description,
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
    console.error(`Supabase error updating test ${id}:`, error);
    throw new Error(error.message || `Failed to update test ${id}. Check RLS policies for update.`);
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
    console.error(`Supabase error updating test publication status ${testId}:`, error);
    throw new Error(error.message || `Failed to update test publication status for ${testId}. Check RLS policies.`);
  }
  if (!data) return undefined;
  return getTestById(data.id); // Fetch full test data
}

export async function deleteTest(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('tests')
    .delete()
    .eq('id', id);

  if (error) {
    console.error(`Supabase error deleting test ${id}:`, error);
    // Consider throwing new Error(error.message || `Failed to delete test ${id}. Check RLS policies.`);
    return false; 
  }
  return true;
}

// --- Question Management ---
export async function addQuestionToTest(testId: string, questionData: Omit<Question, 'id'>): Promise<Question | undefined> {
  const { data: existingQuestions, error: countError } = await supabase
    .from('questions')
    .select('order', { count: 'exact' })
    .eq('test_id', testId)
    .order('order', { ascending: false })
    .limit(1);

  if (countError) {
    console.error('Supabase error fetching question count for ordering:', countError);
    throw new Error(countError.message || 'Failed to determine question order. Check RLS policies.');
  }
  const maxOrder = existingQuestions && existingQuestions.length > 0 ? (existingQuestions[0].order || 0) : 0;
  const newOrder = maxOrder + 1;

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
      options: optionsWithIds,
      scale_min: questionData.scaleMin,
      scale_max: questionData.scaleMax,
      min_label: questionData.minLabel,
      max_label: questionData.maxLabel,
      order: newOrder,
    })
    .select()
    .single();

  if (error) {
    console.error(`Supabase error adding question to test ${testId}:`, error);
    throw new Error(error.message || 'Failed to add question. Check RLS policies for insert.');
  }
  return data as Question | undefined;
}

export async function updateQuestionInTest(testId: string, questionId: string, questionData: Partial<Omit<Question, 'id'>>): Promise<Question | undefined> {
  let optionsWithIds: QuestionOption[] | undefined = undefined;
  if (questionData.type === 'multiple-choice' && questionData.options) {
    optionsWithIds = questionData.options.map(opt => ({
      id: opt.id || generateOptionId(),
      text: opt.text,
    }));
  }

  const updatePayload: any = { ...questionData };
  if (optionsWithIds !== undefined) { // only update if options were processed
    updatePayload.options = optionsWithIds;
  }

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
    .eq('test_id', testId)
    .select()
    .single();

  if (error) {
    console.error(`Supabase error updating question ${questionId} in test ${testId}:`, error);
    throw new Error(error.message || `Failed to update question ${questionId}. Check RLS policies for update.`);
  }
  return data as Question | undefined;
}

export async function deleteQuestionFromTest(testId: string, questionId: string): Promise<boolean> {
  const { error } = await supabase
    .from('questions')
    .delete()
    .eq('id', questionId)
    .eq('test_id', testId);

  if (error) {
    console.error(`Supabase error deleting question ${questionId} from test ${testId}:`, error);
    return false;
  }
  return true;
}

// --- Submission Management ---
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
    console.error('Supabase error creating initial submission:', error);
    throw new Error(error.message || 'Failed to create initial submission. Check RLS policies for insert.');
  }
  if (!data) {
    throw new Error('Failed to create initial submission: No data returned from Supabase.');
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
    console.error(`Supabase error updating submission ${submissionId}:`, error);
    throw new Error(error.message || `Failed to update submission ${submissionId}. Check RLS policies for update.`);
  }
  return data as TestSubmission | undefined;
}

export async function getSubmissionById(submissionId: string): Promise<TestSubmission | undefined> {
  const { data, error } = await supabase
    .from('submissions')
    .select('*')
    .eq('id', submissionId)
    .maybeSingle();

  if (error) {
    console.error(`Supabase error fetching submission ${submissionId}:`, error);
    throw new Error(error.message || `Failed to fetch submission ${submissionId}. Check RLS policies.`);
  }
  return data as TestSubmission | undefined;
}

export async function getAllSubmissions(): Promise<TestSubmission[]> {
  const { data, error } = await supabase
    .from('submissions')
    .select('*')
    .order('submitted_at', { ascending: false });

  if (error) {
    console.error('Supabase error fetching all submissions:', error);
    throw new Error(error.message || 'Failed to fetch all submissions. Check RLS policies.');
  }
  return (data || []) as TestSubmission[];
}
    