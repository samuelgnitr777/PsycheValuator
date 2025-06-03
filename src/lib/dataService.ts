
import { supabase as anonSupabaseClient, createSupabaseServiceRoleClient, type SupabaseClient } from './supabaseClient';
import type { Test, Question, QuestionOption, UserAnswer, TestSubmission } from '@/types';
import { v4 as uuidv4 } from 'uuid';

// Helper to generate ID for QuestionOption
const generateOptionId = (): string => `opt-${uuidv4()}`;

// Helper function for improved error handling in admin operations
function handleAdminSupabaseError(error: any, context: string): Error {
  const baseMessage = `Supabase admin error ${context}:`;
  console.error(baseMessage, JSON.stringify(error, null, 2)); // Log the raw error object first

  let detailedMessage = `Failed ${context}.`;
  if (typeof error === 'object' && error !== null) {
    if ('message' in error && (error as any).message) {
      detailedMessage = String((error as any).message);
    } else {
      try {
        detailedMessage = `Received non-standard error: ${JSON.stringify(error)}. Check server logs for full details.`;
      } catch (e) {
        detailedMessage = `Received non-standard, non-serializable error. Check server logs for full details.`;
      }
    }
    if ('name' in error) console.error(`${baseMessage} Error Name: ${(error as any).name}`);
    if ('code' in error) console.error(`${baseMessage} Error Code: ${(error as any).code}`);
    if ('details' in error) console.error(`${baseMessage} Error Details: ${(error as any).details}`);
    if ('hint' in error) console.error(`${baseMessage} Error Hint: ${(error as any).hint}`);
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
    console.error('Supabase error fetching published tests:', JSON.stringify(error, null, 2));
    throw new Error((error as any).message || 'Failed to fetch published tests. Check RLS policies for anon role on "tests" and "questions" tables for SELECT, ensuring "isPublished" filter is allowed.');
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
    console.error(`Supabase error fetching published test by id ${id}:`, JSON.stringify(error, null, 2));
    throw new Error((error as any).message || `Failed to fetch published test ${id}. Check RLS policies.`);
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
     throw handleAdminSupabaseError(error, `fetching test by id ${id}`);
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
  // Fetch the full test details again to include questions
  return getTestByIdAdmin(data.id);
}

export async function deleteTestAdmin(id: string): Promise<boolean> {
  const supabaseAdmin = createSupabaseServiceRoleClient();

  // Delete associated questions first
  const { error: questionDeleteError } = await supabaseAdmin
    .from('questions')
    .delete()
    .eq('test_id', id);

  if (questionDeleteError) {
    // Log the error but don't necessarily throw, to allow test deletion attempt
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
  // Get current max order for the test
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
      id: opt.id || generateOptionId(), // Ensure options have IDs
      text: opt.text,
    }));
  }

  const { data, error } = await supabaseAdmin
    .from('questions')
    .insert({
      test_id: testId,
      text: questionData.text,
      type: questionData.type,
      options: optionsWithIds, // Use options with generated IDs
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
  // Ensure options have IDs if it's a multiple-choice question
  let optionsWithIds: QuestionOption[] | undefined = undefined;
  if (questionData.type === 'multiple-choice' && questionData.options) {
    optionsWithIds = questionData.options.map(opt => ({
      id: opt.id || generateOptionId(), // Ensure options have IDs
      text: opt.text,
    }));
  }

  const updatePayload: any = { ...questionData };
  if (optionsWithIds !== undefined) { // Check if optionsWithIds was actually populated
    updatePayload.options = optionsWithIds;
  }

  // If type changes, nullify irrelevant fields
  if (questionData.type) {
    if (questionData.type !== 'multiple-choice') {
      updatePayload.options = null; // Or [] depending on your preference for DB storage
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

// --- Submission Management ---
export async function createInitialSubmission(testId: string, fullName: string, email: string): Promise<TestSubmission> {
  const submissionPayload = {
    test_id: testId,
    full_name: fullName,
    email: email,
    answers: [], // Initialize with empty answers
    time_taken: 0, // Initialize time_taken
    submitted_at: new Date().toISOString(), // Set submission time
    analysis_status: 'pending_ai' as const, // Set initial status
  };

  const { data, error } = await anonSupabaseClient
    .from('submissions')
    .insert(submissionPayload)
    .select()
    .single();

  if (error) {
    const context = 'creating initial submission';
    const baseMessage = `Supabase error ${context}:`;
    console.error(baseMessage, JSON.stringify(error, null, 2));

    let detailedMessage = `Failed ${context}.`;
    if (typeof error === 'object' && error !== null) {
      if ('message' in error && (error as any).message) {
        detailedMessage = String((error as any).message);
      } else {
        try {
          detailedMessage = `Received non-standard error during ${context}: ${JSON.stringify(error)}.`;
        } catch (e) {
          detailedMessage = `Received non-standard, non-serializable error during ${context}.`;
        }
      }
      if ('name' in error) console.error(`${baseMessage} Error Name: ${(error as any).name}`);
      if ('code' in error) console.error(`${baseMessage} Error Code: ${(error as any).code}`);
      if ('details' in error) console.error(`${baseMessage} Error Details: ${(error as any).details}`);
      if ('hint' in error) console.error(`${baseMessage} Error Hint: ${(error as any).hint}`);
    } else {
      detailedMessage = `Received an unexpected error type during ${context}: ${String(error)}.`;
    }

    if (!detailedMessage.toLowerCase().includes('rls') && !detailedMessage.toLowerCase().includes('policy')) {
        detailedMessage += ' Double check RLS policies for the "anon" role on the "submissions" table for INSERT. Also, ensure all NOT NULL columns in your "submissions" table schema are being provided with values in the insert statement and match their data types.';
    }
    throw new Error(detailedMessage);
  }
  if (!data) {
    throw new Error('Failed to create initial submission: No data returned from Supabase. This can happen if RLS prevents returning the inserted row, or due to a network issue.');
  }
  return data as TestSubmission;
}

export async function updateSubmission(submissionId: string, submissionData: Partial<Omit<TestSubmission, 'id' | 'testId' | 'fullName' | 'email'>>): Promise<TestSubmission | undefined> {
  const { data, error } = await anonSupabaseClient // Use anon client for user updates
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
    .maybeSingle(); // Changed from .single() to .maybeSingle()

  if (error) {
     console.error(`Supabase error updating submission ${submissionId}:`, JSON.stringify(error, null, 2));
    throw new Error((error as any).message || `Failed to update submission ${submissionId}. Check RLS policies for anon role for UPDATE on "submissions".`);
  }
  return data as TestSubmission | undefined;
}

export async function getSubmissionById(submissionId: string): Promise<TestSubmission | undefined> {
  const { data, error } = await anonSupabaseClient // Use anon client for public fetching of results
    .from('submissions')
    .select('*')
    .eq('id', submissionId)
    .maybeSingle();

  if (error) {
    console.error(`Supabase error fetching submission ${submissionId}:`, JSON.stringify(error, null, 2));
    throw new Error((error as any).message || `Failed to fetch submission ${submissionId}. Check RLS.`);
  }
  return data as TestSubmission | undefined;
}

// --- Admin-specific submission functions (using service_role) ---
export async function updateSubmissionAdmin(submissionId: string, submissionData: Partial<Omit<TestSubmission, 'id' | 'testId' | 'fullName' | 'email'>>): Promise<TestSubmission | undefined> {
    const supabaseAdmin = createSupabaseServiceRoleClient();
    const { data, error } = await supabaseAdmin
        .from('submissions')
        .update(submissionData)
        .eq('id', submissionId)
        .select()
        .maybeSingle(); // Changed from .single() to .maybeSingle()

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

// Public function to get a test (e.g., for displaying questions or results to user)
// This function should only fetch PUBLISHED tests unless specifically for admin context
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
    // .eq('isPublished', true) // Re-enable this if getTestById should only fetch published tests
    .order('order', { foreignTable: 'questions', ascending: true })
    .maybeSingle();

  if (error) {
    console.error(`Supabase error fetching test by id (public) ${id}:`, JSON.stringify(error, null, 2));
    throw new Error((error as any).message || `Failed to fetch test ${id}.`);
  }
  if (!data) return undefined;

  return {
    ...data,
    questions: (data.questions || []).sort((a, b) => (a.order || 0) - (b.order || 0)),
  } as Test;
}

    