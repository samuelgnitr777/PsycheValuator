
import { supabase as anonSupabaseClient, createSupabaseServiceRoleClient, type SupabaseClient } from './supabaseClient';
import type { Test, Question, QuestionOption, UserAnswer, TestSubmission, TestSubmissionUpdatePayload } from '@/types';
import { v4 as uuidv4 } from 'uuid';

// Helper to generate ID for QuestionOption
const generateOptionId = (): string => `opt-${uuidv4()}`;

// --- Helper Mapping Functions ---
function mapUserAnswerToCamelCase(dbAnswer: any): UserAnswer {
  return {
    questionId: dbAnswer.question_id || dbAnswer.questionId,
    value: dbAnswer.value,
  };
}

function mapQuestionOptionToCamelCase(dbOption: any): QuestionOption {
  return {
    id: dbOption.id,
    text: dbOption.text,
  };
}

function mapQuestionToCamelCase(dbQuestion: any): Question {
  return {
    id: dbQuestion.id,
    testId: dbQuestion.test_id || dbQuestion.testId,
    text: dbQuestion.text,
    type: dbQuestion.type,
    options: dbQuestion.options ? (dbQuestion.options as any[]).map(mapQuestionOptionToCamelCase) : undefined,
    scaleMin: dbQuestion.scale_min,
    scaleMax: dbQuestion.scale_max,
    minLabel: dbQuestion.min_label,
    maxLabel: dbQuestion.max_label,
    order: dbQuestion.order,
  };
}

function mapTestToCamelCase(dbTest: any): Test {
  const mappedTest = {
    id: dbTest.id,
    title: dbTest.title,
    description: dbTest.description,
    isPublished: dbTest.isPublished || dbTest.is_published, // Handles if DB field is "isPublished" or "is_published"
    questions: (dbTest.questions || []).map(mapQuestionToCamelCase).sort((a: Question, b: Question) => (a.order || 0) - (b.order || 0)),
  };
  console.log('[mapTestToCamelCase] Input dbTest:', dbTest, 'Output mappedTest:', mappedTest);
  return mappedTest;
}

function mapSubmissionToCamelCase(dbSubmission: any): TestSubmission {
  if (!dbSubmission) return dbSubmission;
  const mappedSubmission = {
    id: dbSubmission.id,
    testId: dbSubmission.test_id || dbSubmission.testId,
    fullName: dbSubmission.full_name || dbSubmission.fullName,
    email: dbSubmission.email,
    answers: (dbSubmission.answers || []).map(mapUserAnswerToCamelCase),
    timeTaken: dbSubmission.time_taken || dbSubmission.timeTaken,
    submittedAt: dbSubmission.submitted_at || dbSubmission.submittedAt,
    analysisStatus: dbSubmission.analysis_status || dbSubmission.analysisStatus,
    psychologicalTraits: dbSubmission.psychological_traits || dbSubmission.psychologicalTraits,
    aiError: dbSubmission.ai_error || dbSubmission.aiError,
    manualAnalysisNotes: dbSubmission.manual_analysis_notes || dbSubmission.manualAnalysisNotes,
  };
  console.log('[mapSubmissionToCamelCase] Input dbSubmission:', dbSubmission, 'Output mappedSubmission:', mappedSubmission);
  return mappedSubmission;
}


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
      "isPublished", 
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
    .eq('"isPublished"', true)
    .order('title', { ascending: true });

  if (error) {
    console.error('Supabase error fetching published tests:', JSON.stringify(error, null, 2));
    throw new Error((error as any).message || 'Failed to fetch published tests. Check RLS policies for anon role on "tests" and "questions" tables for SELECT, ensuring "isPublished" filter is allowed.');
  }
  return (data || []).map(mapTestToCamelCase);
}

export async function getPublishedTestById(id: string): Promise<Test | undefined> {
  const { data, error } = await anonSupabaseClient
    .from('tests')
    .select(`
      id,
      title,
      description,
      "isPublished",
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
    .eq('"isPublished"', true)
    .order('order', { foreignTable: 'questions', ascending: true })
    .maybeSingle();

  if (error) {
    console.error(`Supabase error fetching published test by id ${id}:`, JSON.stringify(error, null, 2));
    throw new Error((error as any).message || `Failed to fetch published test ${id}. Check RLS policies.`);
  }
  if (!data) return undefined;
  const mappedData = mapTestToCamelCase(data);
  console.log(`[dataService] getPublishedTestById - MAPPED data for ${id}:`, JSON.stringify(mappedData, null, 2));
  return mappedData;
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
      "isPublished",
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
  return (data || []).map(mapTestToCamelCase);
}

export async function getTestByIdAdmin(id: string): Promise<Test | undefined> {
  const supabaseAdmin = createSupabaseServiceRoleClient();
  const { data, error } = await supabaseAdmin
    .from('tests')
    .select(`
      id,
      title,
      description,
      "isPublished",
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
  const mappedData = mapTestToCamelCase(data);
  console.log(`[dataService] getTestByIdAdmin - MAPPED data for ${id}:`, JSON.stringify(mappedData, null, 2));
  return mappedData;
}


export async function createTestAdmin(testData: Omit<Test, 'id' | 'questions' | 'isPublished'>): Promise<Test> {
  const supabaseAdmin = createSupabaseServiceRoleClient();
  const { data, error } = await supabaseAdmin
    .from('tests')
    .insert({
      title: testData.title,
      description: testData.description,
      "isPublished": false, // Use quoted camelCase for DB
    })
    .select()
    .single();

  if (error) {
    throw handleAdminSupabaseError(error, 'creating test');
  }
  if (!data) {
    throw new Error('Failed to create test (admin): No data returned.');
  }
  return mapTestToCamelCase({ ...data, questions: [] });
}

export async function updateTestAdmin(id: string, testData: Partial<Omit<Test, 'id' | 'questions' | 'isPublished'>>): Promise<Test | undefined> {
  const supabaseAdmin = createSupabaseServiceRoleClient();
  const { data, error } = await supabaseAdmin
    .from('tests')
    .update({
      title: testData.title,
      description: testData.description,
      // "isPublished" is handled by toggleTestPublicationAction
    })
    .eq('id', id)
    .select(`id, title, description, "isPublished", questions (id, test_id, text, type, options, scale_min, scale_max, min_label, max_label, order)`) 
    .order('order', { foreignTable: 'questions', ascending: true })
    .maybeSingle();

  if (error) {
    throw handleAdminSupabaseError(error, `updating test ${id}`);
  }
  if (!data) return undefined;
  return mapTestToCamelCase(data);
}

export async function updateTestPublicationStatusAdmin(testId: string, isPublished: boolean): Promise<Test | undefined> {
  const supabaseAdmin = createSupabaseServiceRoleClient();
  const { data, error } = await supabaseAdmin
    .from('tests')
    .update({ "isPublished": isPublished }) // Use quoted camelCase for DB
    .eq('id', testId)
    .select() 
    .single();

  if (error) {
    throw handleAdminSupabaseError(error, `updating test publication status ${testId}`);
  }
  if (!data) return undefined;
  const fullTestData = await getTestByIdAdmin(data.id);
  return fullTestData ? mapTestToCamelCase(fullTestData) : undefined;
}

export async function deleteTestAdmin(id: string): Promise<boolean> {
  const supabaseAdmin = createSupabaseServiceRoleClient();

  const { error: questionDeleteError } = await supabaseAdmin
    .from('questions')
    .delete()
    .eq('test_id', id);

  if (questionDeleteError) {
    console.warn(handleAdminSupabaseError(questionDeleteError, `deleting questions for test ${id} (non-fatal, proceeding with test deletion)`));
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

  const dbPayload = {
    test_id: testId,
    text: questionData.text,
    type: questionData.type,
    options: optionsWithIds, 
    scale_min: questionData.scaleMin,
    scale_max: questionData.scaleMax,
    min_label: questionData.minLabel,
    max_label: questionData.maxLabel,
    order: newOrder,
  };

  const { data, error } = await supabaseAdmin
    .from('questions')
    .insert(dbPayload)
    .select()
    .single();

  if (error) {
    throw handleAdminSupabaseError(error, `adding question to test ${testId}`);
  }
  return data ? mapQuestionToCamelCase(data) : undefined;
}

export async function updateQuestionInTestAdmin(testId: string, questionId: string, questionData: Partial<Omit<Question, 'id'>>): Promise<Question | undefined> {
  const supabaseAdmin = createSupabaseServiceRoleClient();
  
  const updatePayload: any = {
    text: questionData.text,
    type: questionData.type,
    order: questionData.order, 
    options: null,
    scale_min: null,
    scale_max: null,
    min_label: null,
    max_label: null,
  };

  if (questionData.type === 'multiple-choice') {
    updatePayload.options = (questionData.options || []).map(opt => ({
      id: opt.id || generateOptionId(),
      text: opt.text,
    }));
  } else if (questionData.type === 'rating-scale') {
    updatePayload.scale_min = questionData.scaleMin;
    updatePayload.scale_max = questionData.scaleMax;
    updatePayload.min_label = questionData.minLabel;
    updatePayload.max_label = questionData.maxLabel;
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
  return data ? mapQuestionToCamelCase(data) : undefined;
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
  console.log('[dataService] createInitialSubmission - Input fullName:', fullName, 'Input email:', email);
  const submissionPayload = {
    test_id: testId,
    full_name: fullName, 
    email: email,
    answers: [],
    time_taken: 0,
    submitted_at: new Date().toISOString(), 
    analysis_status: 'pending_ai' as const,
  };
  console.log('[dataService] createInitialSubmission - Payload to DB:', JSON.stringify(submissionPayload));

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
  console.log('[dataService] createInitialSubmission - Raw data from DB:', JSON.stringify(data));
  const mappedData = mapSubmissionToCamelCase(data);
  console.log('[dataService] createInitialSubmission - MAPPED data returned:', JSON.stringify(mappedData));
  return mappedData;
}

export async function updateSubmission(submissionId: string, submissionData: TestSubmissionUpdatePayload): Promise<TestSubmission | undefined> {
  const supabaseService = createSupabaseServiceRoleClient(); 
  console.log(`[dataService] updateSubmission (${submissionId}) - Input submissionData (camelCase):`, JSON.stringify(submissionData));

  const { data: existingSubmissionCheck, error: checkError } = await supabaseService
    .from('submissions')
    .select('id') 
    .eq('id', submissionId)
    .maybeSingle();

  if (checkError) {
    throw handleAdminSupabaseError(checkError, `checking existence of submission ${submissionId} before update`);
  }

  if (!existingSubmissionCheck) {
    const errorMessage = `Submission with ID ${submissionId} not found. Cannot update a non-existent submission.`;
    console.error(errorMessage);
    throw new Error(errorMessage);
  }

  const dbUpdatePayload: any = {};
  if (submissionData.answers !== undefined) dbUpdatePayload.answers = submissionData.answers.map(ans => ({ question_id: ans.questionId, value: ans.value }));
  if (submissionData.time_taken !== undefined) dbUpdatePayload.time_taken = submissionData.time_taken;
  if (submissionData.submitted_at !== undefined) dbUpdatePayload.submitted_at = submissionData.submitted_at;
  if (submissionData.analysis_status !== undefined) dbUpdatePayload.analysis_status = submissionData.analysis_status;
  
  if (submissionData.hasOwnProperty('psychological_traits')) dbUpdatePayload.psychological_traits = submissionData.psychological_traits;
  if (submissionData.hasOwnProperty('ai_error')) dbUpdatePayload.ai_error = submissionData.ai_error;
  if (submissionData.hasOwnProperty('manual_analysis_notes')) dbUpdatePayload.manual_analysis_notes = submissionData.manual_analysis_notes;

  console.log(`[dataService] updateSubmission (${submissionId}) - Payload to DB (snake_case for internal, original for JSON like psychological_traits):`, JSON.stringify(dbUpdatePayload));

  if (Object.keys(dbUpdatePayload).length === 0) {
    console.warn(`updateSubmission called for ${submissionId} with no updatable fields. Returning current submission state.`);
    const currentData = await getSubmissionById(submissionId); 
    return currentData;
  }

  const { data, error } = await supabaseService
    .from('submissions')
    .update(dbUpdatePayload)
    .eq('id', submissionId)
    .select() 
    .maybeSingle();

  if (error) {
    throw handleAdminSupabaseError(error, `updating submission ${submissionId}`);
  }
  
  if (!data && !error) { 
    const errorMessage = `Submission ${submissionId} was targeted for update (and was confirmed to exist), but no data was returned after the operation. ` +
                         `This strongly indicates an RLS (Row Level Security) SELECT policy is preventing the current client (service_role or anon fallback) from viewing the row after the update, ` +
                         `or the update itself was silently prevented by an RLS UPDATE policy's WITH CHECK clause. ` +
                         `If using anon client due to missing service key, check RLS policies for the 'anon' role. If service_role is used, this scenario is highly unusual and suggests a complex DB interaction.`;
    console.error(errorMessage);
    throw new Error(errorMessage);
  }
  console.log(`[dataService] updateSubmission (${submissionId}) - Raw data from DB after update:`, JSON.stringify(data));
  const mappedData = data ? mapSubmissionToCamelCase(data) : undefined;
  console.log(`[dataService] updateSubmission (${submissionId}) - MAPPED data returned:`, JSON.stringify(mappedData));
  return mappedData;
}

export async function getSubmissionById(submissionId: string): Promise<TestSubmission | undefined> {
  console.log(`[dataService] getSubmissionById - Fetching submission: ${submissionId}`);
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
  console.log(`[dataService] getSubmissionById - Raw data from DB for ${submissionId}:`, JSON.stringify(data));
  if (!data) {
    console.log(`[dataService] getSubmissionById - No data found for ${submissionId}.`);
    return undefined;
  }
  const mappedData = mapSubmissionToCamelCase(data);
  console.log(`[dataService] getSubmissionById - MAPPED data being returned for ${submissionId}:`, JSON.stringify(mappedData, null, 2));
  return mappedData;
}

// --- Admin-specific submission functions (using service_role) ---
export async function updateSubmissionAdmin(submissionId: string, submissionData: TestSubmissionUpdatePayload): Promise<TestSubmission | undefined> {
    const supabaseAdmin = createSupabaseServiceRoleClient();
    console.log(`[dataService] updateSubmissionAdmin (${submissionId}) - Input submissionData (camelCase):`, JSON.stringify(submissionData));


    const { data: existingSubmission, error: checkError } = await supabaseAdmin
      .from('submissions')
      .select('id')
      .eq('id', submissionId)
      .maybeSingle();

    if (checkError) {
        throw handleAdminSupabaseError(checkError, `checking existence of submission ${submissionId} for admin update`);
    }
    if (!existingSubmission) {
        const errorMessage = `Submission with ID ${submissionId} not found. Cannot update a non-existent submission (admin).`;
        console.error(errorMessage);
        throw new Error(errorMessage);
    }

    const dbUpdatePayload: any = {};
    if (submissionData.answers !== undefined) dbUpdatePayload.answers = submissionData.answers.map(ans => ({ question_id: ans.questionId, value: ans.value }));
    if (submissionData.time_taken !== undefined) dbUpdatePayload.time_taken = submissionData.time_taken;
    if (submissionData.submitted_at !== undefined) dbUpdatePayload.submitted_at = submissionData.submitted_at;
    if (submissionData.analysis_status !== undefined) dbUpdatePayload.analysis_status = submissionData.analysis_status;
    if (submissionData.hasOwnProperty('psychological_traits')) dbUpdatePayload.psychological_traits = submissionData.psychological_traits;
    if (submissionData.hasOwnProperty('ai_error')) dbUpdatePayload.ai_error = submissionData.ai_error;
    if (submissionData.hasOwnProperty('manual_analysis_notes')) dbUpdatePayload.manual_analysis_notes = submissionData.manual_analysis_notes;
    
    console.log(`[dataService] updateSubmissionAdmin (${submissionId}) - Payload to DB (snake_case for internal, original for JSON):`, JSON.stringify(dbUpdatePayload));

    if (Object.keys(dbUpdatePayload).length === 0) {
      console.warn(`updateSubmissionAdmin called for ${submissionId} with no updatable fields. Fetching current state.`);
      const { data: currentDataRaw, error: currentError } = await supabaseAdmin.from('submissions').select('*').eq('id', submissionId).maybeSingle();
      if(currentError) throw handleAdminSupabaseError(currentError, `fetching current submission ${submissionId} in empty admin update`);
      return currentDataRaw ? mapSubmissionToCamelCase(currentDataRaw) : undefined;
    }

    const { data, error } = await supabaseAdmin
        .from('submissions')
        .update(dbUpdatePayload)
        .eq('id', submissionId)
        .select()
        .maybeSingle();

    if (error) {
        throw handleAdminSupabaseError(error, `updating submission ${submissionId} (admin)`);
    }
    if (!data) { 
        const errorMessage = `Admin update for submission ${submissionId} (confirmed to exist) returned no data. ` +
                             `This strongly indicates an RLS (Row Level Security) SELECT policy is preventing the current client (service_role or anon fallback) from viewing the row after the update. ` +
                             `If service_role is used (key configured), this is highly unusual as it bypasses RLS. ` +
                             `If anon client is used due to missing service key, check RLS SELECT policies for 'anon'.`;
        console.error(errorMessage);
        throw new Error(errorMessage);
    }
    console.log(`[dataService] updateSubmissionAdmin (${submissionId}) - Raw data from DB after update:`, JSON.stringify(data));
    const mappedData = mapSubmissionToCamelCase(data);
    console.log(`[dataService] updateSubmissionAdmin (${submissionId}) - MAPPED data returned:`, JSON.stringify(mappedData));
    return mappedData;
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
  return (data || []).map(mapSubmissionToCamelCase);
}

export async function getTestById(id: string): Promise<Test | undefined> {
  console.log(`[dataService] getTestById - Fetching test: ${id}`);
  const { data, error } = await anonSupabaseClient
    .from('tests')
    .select(`
      id,
      title,
      description,
      "isPublished",
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
  console.log(`[dataService] getTestById - Raw data from DB for ${id}:`, JSON.stringify(data));
  if (!data) {
    console.log(`[dataService] getTestById - No data found for ${id}.`);
    return undefined;
  }
  const mappedData = mapTestToCamelCase(data);
  console.log(`[dataService] getTestById - MAPPED data being returned for ${id}:`, JSON.stringify(mappedData, null, 2));
  return mappedData;
}
    
