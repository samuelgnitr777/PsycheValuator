
import { supabase as anonSupabaseClient, createSupabaseServiceRoleClient, type SupabaseClient } from './supabaseClient';
import type { Test, Question, QuestionOption, UserAnswer, TestSubmission, TestSubmissionUpdatePayload } from '@/types';
import { v4 as uuidv4 } from 'uuid';

// Helper to generate ID for QuestionOption
const generateOptionId = (): string => `opt-${uuidv4()}`;

// Helper function for improved error handling in admin operations
function handleAdminSupabaseError(error: any, context: string): Error {
  const baseMessage = `Supabase admin error ${context}:`;
  console.error(baseMessage, JSON.stringify(error, null, 2));

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

// --- Submission Management ---
export async function createInitialSubmission(testId: string, fullName: string, email: string): Promise<TestSubmission> {
  const submissionPayload = {
    test_id: testId,
    full_name: fullName,
    email: email,
    answers: [],
    time_taken: 0,
    submitted_at: new Date().toISOString(),
    analysis_status: 'pending_ai' as const,
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
      detailedMessage = (error as any).message || JSON.stringify(error);
    } else {
      detailedMessage = String(error);
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

export async function updateSubmission(submissionId: string, submissionData: TestSubmissionUpdatePayload): Promise<TestSubmission | undefined> {
  const supabaseService = createSupabaseServiceRoleClient();

  // First, check if the submission exists
  const existingSubmission = await getSubmissionById(submissionId); // Use anon client to check existence (RLS might apply)
  if (!existingSubmission) {
    const errorMessage = `Submission with ID ${submissionId} not found. Failed to update.`;
    throw new Error(errorMessage);
  }

  const updatePayload: TestSubmissionUpdatePayload = {};
  // Only include fields in the payload if they are explicitly provided in submissionData
  if (submissionData.answers !== undefined) updatePayload.answers = submissionData.answers;
  if (submissionData.time_taken !== undefined) updatePayload.time_taken = submissionData.time_taken;
  if (submissionData.submitted_at !== undefined) updatePayload.submitted_at = submissionData.submitted_at;
  if (submissionData.analysis_status !== undefined) updatePayload.analysis_status = submissionData.analysis_status;
  
  // For fields that can be explicitly set to null (e.g. clearing a value)
  if (submissionData.hasOwnProperty('psychological_traits')) updatePayload.psychological_traits = submissionData.psychological_traits;
  if (submissionData.hasOwnProperty('ai_error')) updatePayload.ai_error = submissionData.ai_error;
  if (submissionData.hasOwnProperty('manual_analysis_notes')) updatePayload.manual_analysis_notes = submissionData.manual_analysis_notes;

  if (Object.keys(updatePayload).length === 0) {
    console.warn(`updateSubmission called for ${submissionId} with no updatable fields. Returning current submission state.`);
    // Fetch and return current state if no fields to update.
    // This might not be ideal, consider if an error should be thrown or if this is valid.
    // For now, let's assume it's better to avoid an empty update call if possible.
    // However, the function is expected to update, so we might need to fetch.
    // For simplicity, we'll let Supabase handle an empty update object if it occurs,
    // or return current data if we decide to fetch it here.
    // The crucial part is not to send { answers: undefined } if answers wasn't in submissionData.
    // If the payload is truly empty, it's safer to just return or throw.
    // For this iteration, let's fetch if the payload to update is empty.
     const currentState = await getSubmissionById(submissionId); // Using anon client, might need service for consistency
     return currentState;
  }

  const { data, error } = await supabaseService
    .from('submissions')
    .update(updatePayload)
    .eq('id', submissionId)
    .select()
    .maybeSingle();

  if (error) {
    const context = `updating submission ${submissionId} (service client)`;
    throw handleAdminSupabaseError(error, context); 
  }
  
  if (!data && !error) { 
    const errorMessage = `Failed to update submission ${submissionId} or retrieve it after update. The submission ID might not exist.`;
    console.error(errorMessage);
    throw new Error(errorMessage);
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
    const context = `fetching submission ${submissionId} (anon client)`;
    const baseMessage = `Supabase error ${context}:`;
    console.error(baseMessage, JSON.stringify(error, null, 2));
    let detailedMessage = `Failed ${context}.`;
    if (typeof error === 'object' && error !== null) {
      detailedMessage = (error as any).message || JSON.stringify(error);
    } else {
      detailedMessage = String(error);
    }
    throw new Error(detailedMessage);
  }
  return data as TestSubmission | undefined;
}

// --- Admin-specific submission functions (using service_role) ---
export async function updateSubmissionAdmin(submissionId: string, submissionData: TestSubmissionUpdatePayload): Promise<TestSubmission | undefined> {
    const supabaseAdmin = createSupabaseServiceRoleClient();

    // First, check if the submission exists using the admin client
    const { data: existingSubmission, error: checkError } = await supabaseAdmin.from('submissions').select('id').eq('id', submissionId).maybeSingle();
    if (checkError) throw handleAdminSupabaseError(checkError, `checking existence of submission ${submissionId} for admin update`);
    if (!existingSubmission) {
        throw new Error(`Submission with ID ${submissionId} not found. Failed to update (admin).`);
    }

    const updatePayload: TestSubmissionUpdatePayload = {};
    if (submissionData.answers !== undefined) updatePayload.answers = submissionData.answers;
    if (submissionData.time_taken !== undefined) updatePayload.time_taken = submissionData.time_taken;
    if (submissionData.submitted_at !== undefined) updatePayload.submitted_at = submissionData.submitted_at;
    if (submissionData.analysis_status !== undefined) updatePayload.analysis_status = submissionData.analysis_status;
    
    if (submissionData.hasOwnProperty('psychological_traits')) updatePayload.psychological_traits = submissionData.psychological_traits;
    if (submissionData.hasOwnProperty('ai_error')) updatePayload.ai_error = submissionData.ai_error;
    if (submissionData.hasOwnProperty('manual_analysis_notes')) updatePayload.manual_analysis_notes = submissionData.manual_analysis_notes;
    
    if (Object.keys(updatePayload).length === 0) {
      console.warn(`updateSubmissionAdmin called for ${submissionId} with no updatable fields.`);
      // Fetch and return current state if no fields to update.
      const { data: currentData, error: currentError } = await supabaseAdmin.from('submissions').select('*').eq('id', submissionId).maybeSingle();
      if(currentError) throw handleAdminSupabaseError(currentError, `fetching current submission ${submissionId} in empty admin update`);
      return currentData as TestSubmission | undefined;
    }

    const { data, error } = await supabaseAdmin
        .from('submissions')
        .update(updatePayload)
        .eq('id', submissionId)
        .select()
        .maybeSingle();

    if (error) {
        throw handleAdminSupabaseError(error, `updating submission ${submissionId} (admin)`);
    }
    if (!data && !error) { 
        console.warn(`Admin update for submission ${submissionId} returned no data. Submission might not exist.`);
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
    console.error(`Supabase error fetching test by id (public) ${id}:`, JSON.stringify(error, null, 2));
    throw new Error((error as any).message || `Failed to fetch test ${id}.`);
  }
  if (!data) return undefined;

  return {
    ...data,
    questions: (data.questions || []).sort((a, b) => (a.order || 0) - (b.order || 0)),
  } as Test;
}
    
