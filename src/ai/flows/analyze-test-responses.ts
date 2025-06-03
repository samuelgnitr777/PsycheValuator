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
    ),
});
export type AnalyzeTestResponsesOutput = z.infer<
  typeof AnalyzeTestResponsesOutputSchema
>;

export async function analyzeTestResponses(
  input: AnalyzeTestResponsesInput
): Promise<AnalyzeTestResponsesOutput> {
  return analyzeTestResponsesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeTestResponsesPrompt',
  input: {schema: AnalyzeTestResponsesInputSchema},
  output: {schema: AnalyzeTestResponsesOutputSchema},
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
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
