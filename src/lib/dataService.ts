
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
    isPublished: dbTest["isPublished"], // Explicitly use quoted version for select
    questions: (dbTest.questions || []).map(mapQuestionToCamelCase).sort((a: Question, b: Question) => (a.order || 0) - (b.order || 0)),
  };
  // console.log('[mapTestToCamelCase] Input dbTest:', /*JSON.stringify(dbTest, null, 2),*/ 'Output mappedTest:', /*JSON.stringify(mappedTest, null, 2)*/);
  return mappedTest;
}

function mapSubmissionToCamelCase(dbSubmission: any): TestSubmission {
  if (!dbSubmission) return dbSubmission;
  const mappedSubmission: TestSubmission = {
    id: dbSubmission.id,
    testId: dbSubmission.test_id || dbSubmission.testId,
    fullName: dbSubmission.full_name || dbSubmission.fullName,
    email: dbSubmission.email,
    answers: (dbSubmission.answers || []).map(mapUserAnswerToCamelCase),
    timeTaken: dbSubmission.time_taken === undefined ? 0 : Number(dbSubmission.time_taken), // Ensure number
    submittedAt: dbSubmission.submitted_at || dbSubmission.submittedAt,
    analysisStatus: dbSubmission.analysis_status || dbSubmission.analysisStatus,
    manualAnalysisNotes: dbSubmission.manual_analysis_notes || dbSubmission.manualAnalysisNotes,
  };
  // console.log('[mapSubmissionToCamelCase] Input dbSubmission:', /* JSON.stringify(dbSubmission, null, 2), */ 'Output mappedSubmission:', /* JSON.stringify(mappedSubmission, null, 2) */);
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
  // console.log(`[dataService] getPublishedTestById - MAPPED data for ${id}:`, JSON.stringify(mappedData, null, 2));
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
  // console.log(`[dataService] getTestByIdAdmin - MAPPED data for ${id}:`, JSON.stringify(mappedData, null, 2));
  return mappedData;
}


export async function createTestAdmin(testData: Omit<Test, 'id' | 'questions' | 'isPublished'>): Promise<Test> {
  const supabaseAdmin = createSupabaseServiceRoleClient();
  const { data, error } = await supabaseAdmin
    .from('tests')
    .insert({
      title: testData.title,
      description: testData.description,
      "isPublished": false, 
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
    .update({ "isPublished": isPublished }) 
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
    analysis_status: 'pending_ai' as const, // This status now means "pending manual review"
  };
  console.log('[dataService] createInitialSubmission - Payload to DB:', JSON.stringify(submissionPayload));

  const { data, error } = await anonSupabaseClient
    .from('submissions')
    .insert(submissionPayload)
    .select('id, test_id, full_name, email, answers, time_taken, submitted_at, analysis_status, manual_analysis_notes')
    .single();

  if (error) {
    const context = 'creating initial submission';
    const baseMessage = `Supabase error ${context}:`;
    console.error(baseMessage, JSON.stringify(error, null, 2)); 

    let detailedMessage = `Failed ${context}.`;
    const supabaseError = error as any; 

    if (supabaseError.message && supabaseError.message.toLowerCase().includes('violates row-level security policy')) {
      detailedMessage = "RLS VIOLATION: Insert failed for 'submissions' table.\n" +
                        "This means the public user (anon role) doesn't have permission.\n" +
                        "Please CHECK THE FOLLOWING in your Supabase Dashboard (SQL Editor or Policies UI for 'submissions' table):\n" +
                        "1. Is RLS ENABLED on the 'submissions' table?\n" +
                        "2. Is there an INSERT policy specifically for the 'submissions' table?\n" +
                        "3. Does this INSERT policy target (grant permission TO) the 'anon' role?\n" +
                        "4. Is the 'WITH CHECK' expression for this 'anon' INSERT policy simply 'true'? (This allows all inserts by anon. If it's a more complex condition, ensure your current data meets that condition.)\n" +
                        `Original Supabase error: ${supabaseError.message}`;
    } else if (supabaseError.code === '23502') { 
        detailedMessage = `DATABASE ERROR (NOT NULL constraint): A required field is missing or null in the data being saved. Please check your 'submissions' table schema for columns that cannot be null. Original error: ${supabaseError.message}. Columns in payload being inserted: ${Object.keys(submissionPayload).join(', ')}`;
    } else if (supabaseError.message) {
      detailedMessage = supabaseError.message;
    } else {
      detailedMessage = JSON.stringify(supabaseError);
    }
    
    console.error("Throwing error from createInitialSubmission:", detailedMessage);
    throw new Error(detailedMessage);
  }

  if (!data) {
    throw new Error('Failed to create initial submission: No data returned from Supabase. This can happen if RLS prevents returning the inserted row, or due to a network issue.');
  }
  const mappedData = mapSubmissionToCamelCase(data);
  return mappedData;
}

export async function updateSubmission(submissionId: string, submissionData: TestSubmissionUpdatePayload): Promise<TestSubmission | undefined> {
  const supabaseService = createSupabaseServiceRoleClient(); 
  // console.log(`[dataService] updateSubmission (${submissionId}) - Input submissionData (camelCase):`, JSON.stringify(submissionData));

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
  if (submissionData.hasOwnProperty('manual_analysis_notes')) dbUpdatePayload.manual_analysis_notes = submissionData.manual_analysis_notes;

  // console.log(`[dataService] updateSubmission (${submissionId}) - Payload to DB (snake_case for internal, original for JSON like psychological_traits):`, JSON.stringify(dbUpdatePayload));

  if (Object.keys(dbUpdatePayload).length === 0) {
    console.warn(`updateSubmission called for ${submissionId} with no updatable fields. Returning current submission state.`);
    const currentData = await getSubmissionById(submissionId); 
    return currentData;
  }

  const { data, error } = await supabaseService
    .from('submissions')
    .update(dbUpdatePayload)
    .eq('id', submissionId)
    .select('id, test_id, full_name, email, answers, time_taken, submitted_at, analysis_status, manual_analysis_notes') 
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
  // console.log(`[dataService] updateSubmission (${submissionId}) - Raw data from DB after update:`, JSON.stringify(data));
  const mappedData = data ? mapSubmissionToCamelCase(data) : undefined;
  // console.log(`[dataService] updateSubmission (${submissionId}) - MAPPED data returned:`, JSON.stringify(mappedData));
  return mappedData;
}

export async function getSubmissionById(submissionId: string): Promise<TestSubmission | undefined> {
  // console.log(`[dataService] getSubmissionById - Fetching submission: ${submissionId}`);
  const { data, error } = await anonSupabaseClient
    .from('submissions')
    .select('id, test_id, full_name, email, answers, time_taken, submitted_at, analysis_status, manual_analysis_notes') 
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
  // console.log(`[dataService] getSubmissionById - Raw data from DB for ${submissionId}:`, JSON.stringify(data));
  if (!data) {
    // console.log(`[dataService] getSubmissionById - No data found for ${submissionId}.`);
    return undefined;
  }
  const mappedData = mapSubmissionToCamelCase(data);
  // console.log(`[dataService] getSubmissionById - MAPPED data being returned for ${submissionId}:`, JSON.stringify(mappedData, null, 2));
  return mappedData;
}

// --- Admin-specific submission functions (using service_role) ---

export async function getAllSubmissionsAdminWithTestTitles(): Promise<(TestSubmission & { testTitle: string | null })[]> {
  const supabaseAdmin = createSupabaseServiceRoleClient();
  const { data, error } = await supabaseAdmin
    .from('submissions')
    .select(`
      id,
      test_id,
      full_name,
      email,
      answers,
      time_taken,
      submitted_at,
      analysis_status,
      manual_analysis_notes,
      created_at,
      tests (title) 
    `)
    .order('submitted_at', { ascending: false });

  if (error) {
    throw handleAdminSupabaseError(error, 'fetching all submissions with test titles');
  }
  
  return (data || []).map(item => {
    const { tests, ...submissionData } = item;
    const mappedSubmission = mapSubmissionToCamelCase(submissionData); 
    
    return {
      ...mappedSubmission,
      testTitle: tests?.title || 'Test Tidak Diketahui'
    };
  });
}


export async function updateSubmissionAdmin(submissionId: string, submissionData: TestSubmissionUpdatePayload): Promise<TestSubmission | undefined> {
    const supabaseAdmin = createSupabaseServiceRoleClient();
    // console.log(`[dataService] updateSubmissionAdmin (${submissionId}) - Input submissionData (camelCase):`, JSON.stringify(submissionData));


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
    if (submissionData.hasOwnProperty('manual_analysis_notes')) dbUpdatePayload.manual_analysis_notes = submissionData.manual_analysis_notes;
    
    // console.log(`[dataService] updateSubmissionAdmin (${submissionId}) - Payload to DB (snake_case for internal, original for JSON):`, JSON.stringify(dbUpdatePayload));

    if (Object.keys(dbUpdatePayload).length === 0) {
      console.warn(`updateSubmissionAdmin called for ${submissionId} with no updatable fields. Fetching current state.`);
      const { data: currentDataRaw, error: currentError } = await supabaseAdmin.from('submissions').select('id, test_id, full_name, email, answers, time_taken, submitted_at, analysis_status, manual_analysis_notes').eq('id', submissionId).maybeSingle();
      if(currentError) throw handleAdminSupabaseError(currentError, `fetching current submission ${submissionId} in empty admin update`);
      return currentDataRaw ? mapSubmissionToCamelCase(currentDataRaw) : undefined;
    }

    const { data, error } = await supabaseAdmin
        .from('submissions')
        .update(dbUpdatePayload)
        .eq('id', submissionId)
        .select('id, test_id, full_name, email, answers, time_taken, submitted_at, analysis_status, manual_analysis_notes')
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
    // console.log(`[dataService] updateSubmissionAdmin (${submissionId}) - Raw data from DB after update:`, JSON.stringify(data));
    const mappedData = mapSubmissionToCamelCase(data);
    // console.log(`[dataService] updateSubmissionAdmin (${submissionId}) - MAPPED data returned:`, JSON.stringify(mappedData));
    return mappedData;
}


export async function getSubmissionByIdAdmin(submissionId: string): Promise<TestSubmission | undefined> {
  const supabaseAdmin = createSupabaseServiceRoleClient();
  const { data, error } = await supabaseAdmin
    .from('submissions')
    .select('id, test_id, full_name, email, answers, time_taken, submitted_at, analysis_status, manual_analysis_notes')
    .eq('id', submissionId)
    .maybeSingle();

  if (error) {
    throw handleAdminSupabaseError(error, `fetching submission by id ${submissionId} (admin)`);
  }
  if (!data) return undefined;
  return mapSubmissionToCamelCase(data);
}


export async function getTestById(id: string): Promise<Test | undefined> {
  // console.log(`[dataService] getTestById - Fetching test: ${id}`);
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
  // console.log(`[dataService] getTestById - Raw data from DB for ${id}:`, JSON.stringify(data));
  if (!data) {
    // console.log(`[dataService] getTestById - No data found for ${id}.`);
    return undefined;
  }
  const mappedData = mapTestToCamelCase(data);
  // console.log(`[dataService] getTestById - MAPPED data being returned for ${id}:`, JSON.stringify(mappedData, null, 2));
  return mappedData;
}
    

