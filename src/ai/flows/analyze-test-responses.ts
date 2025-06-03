
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
  // The output schema for the prompt itself aims for psychologicalTraits.
  output: {schema: z.object({ psychologicalTraits: z.string() }) },
  prompt: `Analyze the following test responses and time taken to respond, providing insights into the test taker\'s psychological traits:

Responses: {{{responses}}}
Time Taken (seconds): {{{timeTaken}}}

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
      const modelResponse = await prompt(input); // Get the full response from the prompt

      // Access the structured output, which should be in modelResponse.output
      const structuredOutput = modelResponse.output;

      if (structuredOutput && typeof structuredOutput.psychologicalTraits === 'string' && structuredOutput.psychologicalTraits.length > 0) {
        // We have a valid, non-empty psychologicalTraits string
        return { psychologicalTraits: structuredOutput.psychologicalTraits };
      } else {
        // Log why the expected output was not found
        let reason = "Unknown reason.";
        if (!modelResponse) {
          reason = "The entire response from the prompt was null or undefined.";
        } else if (!structuredOutput) {
          reason = "The 'output' field in the prompt's response was null or undefined.";
        } else if (typeof structuredOutput.psychologicalTraits !== 'string') {
          reason = "The 'psychologicalTraits' field in the prompt's output was not a string.";
        } else if (structuredOutput.psychologicalTraits.length === 0) {
          reason = "The 'psychologicalTraits' field in the prompt's output was an empty string.";
        }
        console.warn(`AI analysis prompt did not return expected psychologicalTraits. Reason: ${reason}. Raw structured output from prompt:`, structuredOutput ? JSON.stringify(structuredOutput) : "N/A");
        return { error: "Analisis AI tidak menghasilkan output yang diharapkan atau formatnya tidak sesuai." };
      }
    } catch (e) {
      console.error("Error during AI analysis prompt execution in flow:", e);
      let errorMessage = "Terjadi kesalahan saat berkomunikasi dengan layanan analisis AI.";
      if (e instanceof Error) {
        const errorMsgLower = e.message.toLowerCase();
        if (errorMsgLower.includes("503 service unavailable") || errorMsgLower.includes("model is overloaded") || errorMsgLower.includes("overloaded")) {
          errorMessage = "Layanan analisis AI sedang kelebihan beban. Silakan coba lagi nanti.";
        } else if (errorMsgLower.includes("deadline exceeded")) {
          errorMessage = "Waktu tunggu untuk layanan analisis AI habis. Silakan coba lagi nanti.";
        } else {
            // Use the actual error message if it's not one of the specific cases above
            errorMessage = `Layanan AI Error: ${e.message}`;
        }
      } else if (typeof e === 'string' && e.trim() !== '') {
        errorMessage = `Layanan AI mengembalikan pesan: ${e}`;
      } else if (typeof e === 'object' && e !== null) {
        const objMsg = (e as any).message || (e as any).error || (e as any).details;
        if (objMsg && typeof objMsg === 'string') {
            errorMessage = `Kesalahan layanan AI: ${objMsg}`;
        }
      }
      return { error: errorMessage };
    }
  }
);
