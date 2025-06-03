
import type { Test, Question, QuestionType } from '@/types';

let tests: Test[] = [
  {
    id: 'test-1',
    title: 'Penilaian Kepribadian Pengantar',
    description: 'Penilaian singkat untuk memahami sifat-sifat dasar kepribadian. Tes ini berisi 20 pertanyaan.',
    questions: [
      {
        id: 'q1-1',
        text: 'Seberapa terbuka Anda menganggap diri Anda?',
        type: 'rating-scale',
        scaleMin: 1,
        scaleMax: 5,
        minLabel: 'Sangat Tertutup',
        maxLabel: 'Sangat Terbuka',
      },
      {
        id: 'q1-2',
        text: 'Aktivitas mana yang Anda sukai di akhir pekan?',
        type: 'multiple-choice',
        options: [
          { id: 'opt1-2-1', text: 'Membaca buku di rumah' },
          { id: 'opt1-2-2', text: 'Menghadiri pertemuan sosial' },
          { id: 'opt1-2-3', text: 'Menjelajahi alam' },
        ],
      },
      {
        id: 'q1-3',
        text: 'Deskripsikan situasi menantang yang baru-baru ini Anda hadapi dan bagaimana Anda menanganinya.',
        type: 'open-ended',
      },
      {
        id: 'q1-4',
        text: 'Seberapa sering Anda merasa stres dalam seminggu?',
        type: 'rating-scale',
        scaleMin: 1,
        scaleMax: 5,
        minLabel: 'Jarang',
        maxLabel: 'Sangat Sering',
      },
      {
        id: 'q1-5',
        text: 'Buatlah sebuah kalimat yang menggambarkan pagi ideal Anda.',
        type: 'open-ended',
      },
      {
        id: 'q1-6',
        text: 'Manakah yang lebih penting bagi Anda dalam sebuah pekerjaan?',
        type: 'multiple-choice',
        options: [
          { id: 'opt1-6-1', text: 'Gaji tinggi' },
          { id: 'opt1-6-2', text: 'Lingkungan kerja yang baik' },
          { id: 'opt1-6-3', text: 'Kesempatan berkembang' },
        ],
      },
      {
        id: 'q1-7',
        text: 'Seberapa penting kejujuran bagi Anda?',
        type: 'rating-scale',
        scaleMin: 1,
        scaleMax: 7,
        minLabel: 'Tidak penting',
        maxLabel: 'Sangat penting',
      },
      {
        id: 'q1-8',
        text: 'Tuliskan satu kata yang paling menggambarkan diri Anda.',
        type: 'open-ended',
      },
      {
        id: 'q1-9',
        text: 'Apakah Anda lebih suka bekerja sendiri atau dalam tim?',
        type: 'multiple-choice',
        options: [
          { id: 'opt1-9-1', text: 'Sendiri' },
          { id: 'opt1-9-2', text: 'Dalam tim' },
        ],
      },
      {
        id: 'q1-10',
        text: 'Bagaimana Anda menilai kemampuan Anda dalam beradaptasi dengan perubahan?',
        type: 'rating-scale',
        scaleMin: 1,
        scaleMax: 5,
        minLabel: 'Buruk',
        maxLabel: 'Sangat Baik',
      },
      {
        id: 'q1-11',
        text: 'Buatlah kalimat tentang impian terbesar Anda.',
        type: 'open-ended',
      },
      {
        id: 'q1-12',
        text: 'Warna apa yang paling Anda sukai?',
        type: 'multiple-choice',
        options: [
          { id: 'opt1-12-1', text: 'Biru' },
          { id: 'opt1-12-2', text: 'Merah' },
          { id: 'opt1-12-3', text: 'Hijau' },
          { id: 'opt1-12-4', text: 'Kuning' },
        ],
      },
      {
        id: 'q1-13',
        text: 'Seberapa optimistis Anda tentang masa depan?',
        type: 'rating-scale',
        scaleMin: 1,
        scaleMax: 5,
        minLabel: 'Sangat Pesimis',
        maxLabel: 'Sangat Optimis',
      },
      {
        id: 'q1-14',
        text: 'Apa hobi utama Anda? Jelaskan dalam satu kalimat.',
        type: 'open-ended',
      },
       {
        id: 'q1-15',
        text: 'Ketika menghadapi masalah, Anda cenderung:',
        type: 'multiple-choice',
        options: [
          { id: 'opt1-15-1', text: 'Mencari solusi segera' },
          { id: 'opt1-15-2', text: 'Memikirkannya mendalam terlebih dahulu' },
          { id: 'opt1-15-3', text: 'Meminta bantuan orang lain' },
        ],
      },
      {
        id: 'q1-16',
        text: 'Bagaimana Anda menilai tingkat kesabaran Anda?',
        type: 'rating-scale',
        scaleMin: 1,
        scaleMax: 5,
        minLabel: 'Sangat Tidak Sabar',
        maxLabel: 'Sangat Sabar',
      },
      {
        id: 'q1-17',
        text: 'Buatlah satu kalimat tentang apa arti kebahagiaan bagi Anda.',
        type: 'open-ended',
      },
      {
        id: 'q1-18',
        text: 'Manakah yang lebih Anda hargai: logika atau emosi?',
        type: 'multiple-choice',
        options: [
          { id: 'opt1-18-1', text: 'Logika' },
          { id: 'opt1-18-2', text: 'Emosi' },
          { id: 'opt1-18-3', text: 'Keduanya seimbang' },
        ],
      },
      {
        id: 'q1-19',
        text: 'Seberapa teratur Anda dalam menjalani kehidupan sehari-hari?',
        type: 'rating-scale',
        scaleMin: 1,
        scaleMax: 5,
        minLabel: 'Sangat Tidak Teratur',
        maxLabel: 'Sangat Teratur',
      },
      {
        id: 'q1-20',
        text: 'Tuliskan satu kalimat motivasi yang sering Anda ingat.',
        type: 'open-ended',
      },
    ],
  },
  {
    id: 'test-2',
    title: 'Evaluasi Manajemen Stres',
    description: 'Memahami mekanisme koping Anda di bawah tekanan.',
    questions: [
      {
        id: 'q2-1',
        text: 'Seberapa sering Anda merasa kewalahan dengan tanggung jawab Anda?',
        type: 'rating-scale',
        scaleMin: 1,
        scaleMax: 5,
        minLabel: 'Jarang',
        maxLabel: 'Sangat Sering',
      },
      {
        id: 'q2-2',
        text: 'Apa cara utama Anda dalam menghadapi stres?',
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

