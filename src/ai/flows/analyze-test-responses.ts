
'use server';

/**
 * @fileOverview This file defines a Genkit flow for analyzing user test responses
 * and providing insights into their psychological traits.
 *
 * - analyzeTestResponses - A function that analyzes the test responses.
 * - AnalyzeTestResponsesInput - The input type for the analyzeTestResponses function.
 * - AnalyzeTestResponsesOutput - The return type for the analyzeTestResponses function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeTestResponsesInputSchema = z.object({
  responses: z
    .string()
    .describe("The user's responses to the test questions, as a string."),
  timeTaken: z.number().describe('The time taken to complete the test, in seconds.'),
});
export type AnalyzeTestResponsesInput = z.infer<
  typeof AnalyzeTestResponsesInputSchema
>;

const AnalyzeTestResponsesOutputSchema = z.object({
  psychologicalTraits: z
    .string()
    .describe(
      'An analysis of the user responses, providing insights into their psychological traits.'
    )
    .optional(),
  error: z.string().optional(),
});
export type AnalyzeTestResponsesOutput = z.infer<
  typeof AnalyzeTestResponsesOutputSchema
>;

export async function analyzeTestResponses(
  input: AnalyzeTestResponsesInput
): Promise<AnalyzeTestResponsesOutput> {
  // The flow is designed to catch errors and return them within the AnalyzeTestResponsesOutput structure.
  return analyzeTestResponsesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeTestResponsesPrompt',
  input: {schema: AnalyzeTestResponsesInputSchema},
  // The output schema for the prompt itself should primarily aim for psychologicalTraits.
  // Errors are handled in the flow's try/catch.
  output: {schema: z.object({ psychologicalTraits: z.string() }) },
  prompt: `Analyze the following test responses and time taken to respond, providing insights into the test taker\'s psychological traits:

Responses: {{{responses}}}
Time Taken (seconds): {{{timeTaken}}}

Consider the time taken to answer. Slower times may reflect uncertainly or deeper thought, while faster times may suggest confidence or impulsivity.

Provide a detailed analysis of the psychological traits suggested by these responses.
`,
});

const analyzeTestResponsesFlow = ai.defineFlow(
  {
    name: 'analyzeTestResponsesFlow',
    inputSchema: AnalyzeTestResponsesInputSchema,
    outputSchema: AnalyzeTestResponsesOutputSchema,
  },
  async (input): Promise<AnalyzeTestResponsesOutput> => {
    try {
      const {output} = await prompt(input); // This line can throw (e.g. on 503)
      if (output?.psychologicalTraits) {
        return { psychologicalTraits: output.psychologicalTraits };
      }
      // This case means the prompt succeeded but didn't return the expected data structure.
      return { error: "Analisis AI tidak menghasilkan output yang diharapkan." };
    } catch (e) {
      console.error("Error during AI analysis prompt execution in flow:", e);
      let errorMessage = "Terjadi kesalahan saat berkomunikasi dengan layanan analisis AI.";
      if (e instanceof Error) {
        if (e.message.includes("503 Service Unavailable") || e.message.includes("model is overloaded") || e.message.includes("overloaded")) {
          errorMessage = "Layanan analisis AI sedang kelebihan beban. Silakan coba lagi nanti.";
        } else if (e.message.includes("Deadline exceeded")) {
          errorMessage = "Waktu tunggu untuk layanan analisis AI habis. Silakan coba lagi nanti.";
        }
      }
      return { error: errorMessage };
    }
  }
);
