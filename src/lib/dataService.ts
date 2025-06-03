import type { Test, Question, QuestionType } from '@/types';

let tests: Test[] = [
  {
    id: 'test-1',
    title: 'Introductory Personality Assessment',
    description: 'A quick assessment to understand basic personality traits.',
    questions: [
      {
        id: 'q1-1',
        text: 'How outgoing do you consider yourself?',
        type: 'rating-scale',
        scaleMin: 1,
        scaleMax: 5,
        minLabel: 'Very Introverted',
        maxLabel: 'Very Extroverted',
      },
      {
        id: 'q1-2',
        text: 'Which activity do you prefer on a weekend?',
        type: 'multiple-choice',
        options: [
          { id: 'opt1-2-1', text: 'Reading a book at home' },
          { id: 'opt1-2-2', text: 'Attending a social gathering' },
          { id: 'opt1-2-3', text: 'Exploring nature' },
        ],
      },
      {
        id: 'q1-3',
        text: 'Describe a challenging situation you recently faced and how you handled it.',
        type: 'open-ended',
      },
    ],
  },
  {
    id: 'test-2',
    title: 'Stress Management Evaluation',
    description: 'Understanding your coping mechanisms under stress.',
    questions: [
      {
        id: 'q2-1',
        text: 'How often do you feel overwhelmed by your responsibilities?',
        type: 'rating-scale',
        scaleMin: 1,
        scaleMax: 5,
        minLabel: 'Rarely',
        maxLabel: 'Very Often',
      },
      {
        id: 'q2-2',
        text: 'What is your primary way of dealing with stress?',
        type: 'open-ended',
      },
    ],
  },
];

export async function getTests(): Promise<Test[]> {
  return JSON.parse(JSON.stringify(tests));
}

export async function getTestById(id: string): Promise<Test | undefined> {
  return JSON.parse(JSON.stringify(tests.find(test => test.id === id)));
}

export async function createTest(testData: Omit<Test, 'id' | 'questions'>): Promise<Test> {
  const newTest: Test = {
    ...testData,
    id: `test-${Date.now()}`,
    questions: [],
  };
  tests.push(newTest);
  return JSON.parse(JSON.stringify(newTest));
}

export async function updateTest(id: string, testData: Partial<Omit<Test, 'id' | 'questions'>>): Promise<Test | undefined> {
  const testIndex = tests.findIndex(test => test.id === id);
  if (testIndex === -1) return undefined;
  tests[testIndex] = { ...tests[testIndex], ...testData };
  return JSON.parse(JSON.stringify(tests[testIndex]));
}

export async function deleteTest(id: string): Promise<boolean> {
  const initialLength = tests.length;
  tests = tests.filter(test => test.id !== id);
  return tests.length < initialLength;
}

export async function addQuestionToTest(testId: string, questionData: Omit<Question, 'id'>): Promise<Question | undefined> {
  const test = tests.find(t => t.id === testId);
  if (!test) return undefined;
  const newQuestion: Question = {
    ...questionData,
    id: `q-${testId}-${Date.now()}`,
  };
  test.questions.push(newQuestion);
  return JSON.parse(JSON.stringify(newQuestion));
}

export async function updateQuestionInTest(testId: string, questionId: string, questionData: Partial<Omit<Question, 'id'>>): Promise<Question | undefined> {
  const test = tests.find(t => t.id === testId);
  if (!test) return undefined;
  const questionIndex = test.questions.findIndex(q => q.id === questionId);
  if (questionIndex === -1) return undefined;
  test.questions[questionIndex] = { ...test.questions[questionIndex], ...questionData };
  return JSON.parse(JSON.stringify(test.questions[questionIndex]));
}

export async function deleteQuestionFromTest(testId: string, questionId: string): Promise<boolean> {
  const test = tests.find(t => t.id === testId);
  if (!test) return false;
  const initialLength = test.questions.length;
  test.questions = test.questions.filter(q => q.id !== questionId);
  return test.questions.length < initialLength;
}
