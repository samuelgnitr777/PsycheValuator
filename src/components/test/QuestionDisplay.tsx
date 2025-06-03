'use client';

import { Question, QuestionOption } from '@/types';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface QuestionDisplayProps {
  question: Question;
  currentAnswer: string | number | undefined;
  onAnswerChange: (value: string | number) => void;
  questionNumber: number;
  totalQuestions: number;
}

export function QuestionDisplay({ question, currentAnswer, onAnswerChange, questionNumber, totalQuestions }: QuestionDisplayProps) {
  return (
    <Card className="w-full shadow-lg">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="font-headline text-xl md:text-2xl">Question {questionNumber} of {totalQuestions}</CardTitle>
          <span className="text-sm text-muted-foreground capitalize">{question.type.replace('-', ' ')}</span>
        </div>
        <CardDescription className="text-lg pt-2">{question.text}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {question.type === 'multiple-choice' && question.options && (
            <RadioGroup
              value={currentAnswer as string | undefined}
              onValueChange={(value) => onAnswerChange(value)}
              className="space-y-3"
            >
              {question.options.map((option: QuestionOption) => (
                <div key={option.id || option.text} className="flex items-center space-x-3 p-3 border rounded-md hover:bg-muted/50 transition-colors has-[:checked]:bg-primary/10 has-[:checked]:border-primary">
                  <RadioGroupItem value={option.id || option.text} id={option.id || option.text} />
                  <Label htmlFor={option.id || option.text} className="text-base cursor-pointer flex-1">{option.text}</Label>
                </div>
              ))}
            </RadioGroup>
          )}

          {question.type === 'rating-scale' && (
            <div className="space-y-4">
              <Slider
                min={question.scaleMin}
                max={question.scaleMax}
                step={1}
                value={currentAnswer !== undefined ? [Number(currentAnswer)] : [Math.floor((question.scaleMin! + question.scaleMax!) / 2)]}
                onValueChange={(value) => onAnswerChange(value[0])}
                className="my-4"
              />
              <div className="flex justify-between text-sm text-muted-foreground px-1">
                <span>{question.minLabel || question.scaleMin}</span>
                <span>{question.maxLabel || question.scaleMax}</span>
              </div>
              <div className="text-center font-semibold text-lg text-primary">
                Selected Value: {currentAnswer !== undefined ? currentAnswer : 'Not selected'}
              </div>
            </div>
          )}

          {question.type === 'open-ended' && (
            <Textarea
              value={currentAnswer as string | undefined}
              onChange={(e) => onAnswerChange(e.target.value)}
              placeholder="Type your answer here..."
              rows={5}
              className="text-base"
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
}
