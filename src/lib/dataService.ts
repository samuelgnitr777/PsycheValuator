
import { supabase as anonSupabaseClient, createSupabaseServiceRoleClient, type SupabaseClient } from './supabaseClient';
import type { Test, Question, QuestionOption, UserAnswer, TestSubmission } from '@/types';
import { v4 as uuidv4 } from 'uuid';

// Helper to generate ID for QuestionOption
const generateOptionId = (): string => `opt-${uuidv4()}`;

// Helper function for improved error handling in admin operations
function handleAdminSupabaseError(error: any, context: string): Error {
  const baseMessage = `Supabase admin error ${context}:`;
  console.error(baseMessage, error); // Log the raw error object first

  let detailedMessage = `Failed ${context}.`;
  if (typeof error === 'object' && error !== null) {
    if ('message' in error && error.message) {
      detailedMessage = String(error.message);
    } else {
      try {
        detailedMessage = `Received non-standard error: ${JSON.stringify(error)}. Check server logs for full details.`;
      } catch (e) {
        detailedMessage = `Received non-standard, non-serializable error. Check server logs for full details.`;
      }
    }
    if ('name' in error) console.error(`${baseMessage} Error Name: ${error.name}`);
    if ('code' in error) console.error(`${baseMessage} Error Code: ${error.code}`);
    if ('details' in error) console.error(`${baseMessage} Error Details: ${error.details}`);
    if ('hint' in error) console.error(`${baseMessage} Error Hint: ${error.hint}`);
  } else {
    detailedMessage = `Received an unexpected error type: ${String(error)}.`;
  }
  return new Error(detailedMessage);
}


// --- PUBLIC READ OPERATIONS (using anon client) ---

export async function getPublishedTests(): Promise<Test[]> {
  const { data, error } = await anonSupabaseClient
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
    .eq('isPublished', true)
    .order('title', { ascending: true });

  if (error) {
    console.error('Supabase error fetching published tests:', error);
    throw new Error(error.message || 'Failed to fetch published tests. Check RLS policies for anon role on "tests" and "questions" tables for SELECT, ensuring "isPublished" filter is allowed.');
  }
  return (data || []).map(test => ({
    ...test,
    questions: (test.questions || []).sort((a, b) => (a.order || 0) - (b.order || 0)),
  })) as Test[];
}

export async function getPublishedTestById(id: string): Promise<Test | undefined> {
  const { data, error } = await anonSupabaseClient
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
    .eq('isPublished', true) 
    .order('order', { foreignTable: 'questions', ascending: true })
    .maybeSingle();

  if (error) {
    console.error(`Supabase error fetching published test by id ${id}:`, error);
    throw new Error(error.message || `Failed to fetch published test ${id}. Check RLS policies.`);
  }
  if (!data) return undefined;

  return {
    ...data,
    questions: (data.questions || []).sort((a, b) => (a.order || 0) - (b.order || 0)),
  } as Test;
}

// --- ADMIN OPERATIONS (using service_role client) ---

export async function getAllTestsAdmin(): Promise<Test[]> {
  const supabaseAdmin = createSupabaseServiceRoleClient();
  const { data, error } = await supabaseAdmin
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
    throw handleAdminSupabaseError(error, 'fetching all tests');
  }
  return (data || []).map(test => ({
    ...test,
    questions: (test.questions || []).sort((a, b) => (a.order || 0) - (b.order || 0)),
  })) as Test[];
}

export async function getTestByIdAdmin(id: string): Promise<Test | undefined> {
  const supabaseAdmin = createSupabaseServiceRoleClient();
  const { data, error } = await supabaseAdmin
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
     console.error(`Supabase admin error fetching test by id ${id}:`, error);
    throw new Error( (error as any).message || `Failed to fetch test ${id} for admin.`);
  }
  if (!data) return undefined;

  return {
    ...data,
    questions: (data.questions || []).sort((a, b) => (a.order || 0) - (b.order || 0)),
  } as Test;
}


export async function createTestAdmin(testData: Omit<Test, 'id' | 'questions' | 'isPublished'>): Promise<Test> {
  const supabaseAdmin = createSupabaseServiceRoleClient();
  const { data, error } = await supabaseAdmin
    .from('tests')
    .insert({
      title: testData.title,
      description: testData.description,
      isPublished: false, 
    })
    .select()
    .single();

  if (error) {
    throw handleAdminSupabaseError(error, 'creating test');
  }
  if (!data) {
    throw new Error('Failed to create test (admin): No data returned.');
  }
  return { ...data, questions: [] } as Test;
}

export async function updateTestAdmin(id: string, testData: Partial<Omit<Test, 'id' | 'questions' | 'isPublished'>>): Promise<Test | undefined> {
  const supabaseAdmin = createSupabaseServiceRoleClient();
  const { data, error } = await supabaseAdmin
    .from('tests')
    .update({
      title: testData.title,
      description: testData.description,
    })
    .eq('id', id)
    .select(`id, title, description, isPublished, questions (id, text, type, options, scale_min, scale_max, min_label, max_label, order)`)
    .order('order', { foreignTable: 'questions', ascending: true })
    .maybeSingle();
    
  if (error) {
    throw handleAdminSupabaseError(error, `updating test ${id}`);
  }
  if (!data) return undefined;
  return { ...data, questions: (data.questions || []).sort((a,b) => (a.order || 0) - (b.order || 0)) } as Test;
}

export async function updateTestPublicationStatusAdmin(testId: string, isPublished: boolean): Promise<Test | undefined> {
  const supabaseAdmin = createSupabaseServiceRoleClient();
  const { data, error } = await supabaseAdmin
    .from('tests')
    .update({ isPublished })
    .eq('id', testId)
    .select()
    .single();

  if (error) {
    throw handleAdminSupabaseError(error, `updating test publication status ${testId}`);
  }
  if (!data) return undefined;
  return getTestByIdAdmin(data.id); 
}

export async function deleteTestAdmin(id: string): Promise<boolean> {
  const supabaseAdmin = createSupabaseServiceRoleClient();
  
  const { error: questionDeleteError } = await supabaseAdmin
    .from('questions')
    .delete()
    .eq('test_id', id);

  if (questionDeleteError) {
    console.error(handleAdminSupabaseError(questionDeleteError, `deleting questions for test ${id} (non-fatal)`));
  }
  
  const { error } = await supabaseAdmin
    .from('tests')
    .delete()
    .eq('id', id);

  if (error) {
    throw handleAdminSupabaseError(error, `deleting test ${id}`);
  }
  return true;
}

export async function addQuestionToTestAdmin(testId: string, questionData: Omit<Question, 'id'>): Promise<Question | undefined> {
  const supabaseAdmin = createSupabaseServiceRoleClient();
  const { data: existingQuestions, error: countError } = await supabaseAdmin
    .from('questions')
    .select('order', { count: 'exact' })
    .eq('test_id', testId)
    .order('order', { ascending: false })
    .limit(1);

  if (countError) {
    throw handleAdminSupabaseError(countError, 'fetching question count for ordering');
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

  const { data, error } = await supabaseAdmin
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
    throw handleAdminSupabaseError(error, `adding question to test ${testId}`);
  }
  return data as Question | undefined;
}

export async function updateQuestionInTestAdmin(testId: string, questionId: string, questionData: Partial<Omit<Question, 'id'>>): Promise<Question | undefined> {
  const supabaseAdmin = createSupabaseServiceRoleClient();
  let optionsWithIds: QuestionOption[] | undefined = undefined;
  if (questionData.type === 'multiple-choice' && questionData.options) {
    optionsWithIds = questionData.options.map(opt => ({
      id: opt.id || generateOptionId(),
      text: opt.text,
    }));
  }

  const updatePayload: any = { ...questionData };
  if (optionsWithIds !== undefined) { 
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

  const { data, error } = await supabaseAdmin
    .from('questions')
    .update(updatePayload)
    .eq('id', questionId)
    .eq('test_id', testId)
    .select()
    .single();

  if (error) {
    throw handleAdminSupabaseError(error, `updating question ${questionId} in test ${testId}`);
  }
  return data as Question | undefined;
}

export async function deleteQuestionFromTestAdmin(testId: string, questionId: string): Promise<boolean> {
  const supabaseAdmin = createSupabaseServiceRoleClient();
  const { error } = await supabaseAdmin
    .from('questions')
    .delete()
    .eq('id', questionId)
    .eq('test_id', testId);

  if (error) {
    throw handleAdminSupabaseError(error, `deleting question ${questionId} from test ${testId}`);
  }
  return true;
}

// --- Submission Management (using anon client for public, admin client for admin views if needed) ---
export async function createInitialSubmission(testId: string, fullName: string, email: string): Promise<TestSubmission> {
  const { data, error } = await anonSupabaseClient 
    .from('submissions')
    .insert({
      test_id: testId,
      full_name: fullName,
      email: email,
      answers: [],
      time_taken: 0,
      submitted_at: new Date().toISOString(),
      analysis_status: 'pending_ai',
    })
    .select()
    .single();

  if (error) {
    console.error('Supabase error creating initial submission:', error);
    throw new Error(error.message || 'Failed to create initial submission. Check RLS policies for anon role on "submissions" table for INSERT.');
  }
  if (!data) {
    throw new Error('Failed to create initial submission: No data returned from Supabase.');
  }
  return data as TestSubmission;
}

export async function updateSubmission(submissionId: string, submissionData: Partial<Omit<TestSubmission, 'id' | 'testId' | 'fullName' | 'email'>>): Promise<TestSubmission | undefined> {
  const { data, error } = await anonSupabaseClient
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
    throw new Error(error.message || `Failed to update submission ${submissionId}. Check RLS policies for anon role for UPDATE on "submissions".`);
  }
  return data as TestSubmission | undefined;
}

export async function getSubmissionById(submissionId: string): Promise<TestSubmission | undefined> {
  const { data, error } = await anonSupabaseClient
    .from('submissions')
    .select('*')
    .eq('id', submissionId)
    .maybeSingle();

  if (error) {
    console.error(`Supabase error fetching submission ${submissionId}:`, error);
    throw new Error(error.message || `Failed to fetch submission ${submissionId}. Check RLS.`);
  }
  return data as TestSubmission | undefined;
}

export async function updateSubmissionAdmin(submissionId: string, submissionData: Partial<Omit<TestSubmission, 'id' | 'testId' | 'fullName' | 'email'>>): Promise<TestSubmission | undefined> {
    const supabaseAdmin = createSupabaseServiceRoleClient();
    const { data, error } = await supabaseAdmin
        .from('submissions')
        .update(submissionData)
        .eq('id', submissionId)
        .select()
        .single();

    if (error) {
        throw handleAdminSupabaseError(error, `updating submission ${submissionId}`);
    }
    return data as TestSubmission | undefined;
}


export async function getAllSubmissionsAdmin(): Promise<TestSubmission[]> {
  const supabaseAdmin = createSupabaseServiceRoleClient();
  const { data, error } = await supabaseAdmin
    .from('submissions')
    .select('*')
    .order('submitted_at', { ascending: false });

  if (error) {
    throw handleAdminSupabaseError(error, 'fetching all submissions');
  }
  return (data || []) as TestSubmission[];
}

// Test function for admin client - this is not used in the app, but for your manual testing
export async function getTestById(id: string): Promise<Test | undefined> {
  const { data, error } = await anonSupabaseClient
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
    console.error(`Supabase error fetching test by id (public) ${id}:`, error);
    throw new Error(error.message || `Failed to fetch test ${id}.`);
  }
  if (!data) return undefined;

  return {
    ...data,
    questions: (data.questions || []).sort((a, b) => (a.order || 0) - (b.order || 0)),
  } as Test;
}

