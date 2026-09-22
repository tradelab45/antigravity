import React, { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { CheckCircle2, XCircle, Lock, Award, RotateCcw, ArrowRight } from 'lucide-react';
import { buildExamAttempt, EXAM_LENGTH, EXAM_PASS_MARK, type ExamQuestion, type StageExam as StageExamData } from '../data/stageExams';

interface StageExamProps {
  exam: StageExamData;
  stageName: string;
  /** Stage number shown to the learner, 1-based. */
  stageNumber: number;
  /** The stage's modules must all be finished before the exam opens. */
  modulesRemaining: number;
  passed: boolean;
  bestScore: number | null;
  onPass: (score: number) => void;
  onRecordAttempt: (score: number) => void;
}

/**
 * The twenty question exam that stands between one stage and the next.
 *
 * Answers are revealed only after the whole paper is submitted, so a learner
 * cannot walk the correct option out of the feedback one question at a time.
 */
export const StageExam: React.FC<StageExamProps> = ({
  exam,
  stageName,
  stageNumber,
  modulesRemaining,
  passed,
  bestScore,
  onPass,
  onRecordAttempt,
}) => {
  const [attemptSeed, setAttemptSeed] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submittedScore, setSubmittedScore] = useState<number | null>(null);

  const questions = useMemo<ExamQuestion[]>(
    () => buildExamAttempt(exam),
    // A new seed is a new attempt, which is a new shuffle.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [exam, attemptSeed],
  );

  const answeredCount = Object.keys(answers).length;
  const isSubmitted = submittedScore !== null;
  const locked = modulesRemaining > 0;

  const startOver = () => {
    setAnswers({});
    setSubmittedScore(null);
    setAttemptSeed((seed) => seed + 1);
  };

  const submit = () => {
    if (answeredCount < questions.length) return;
    const score = questions.reduce(
      (total, question) => total + (answers[question.id] === question.correctIndex ? 1 : 0),
      0,
    );
    setSubmittedScore(score);
    onRecordAttempt(score);
    if (score >= EXAM_PASS_MARK) onPass(score);
  };

  if (locked) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-center dark:border-slate-700 dark:bg-slate-800/60">
        <Lock className="mx-auto h-6 w-6 text-slate-400" />
        <h3 className="mt-2 text-sm font-black text-slate-900 dark:text-white">
          Finish this stage first
        </h3>
        <p className="mx-auto mt-1 max-w-md text-xs leading-relaxed text-slate-600 dark:text-slate-300">
          {modulesRemaining} module{modulesRemaining === 1 ? '' : 's'} left in {stageName}. The exam
          opens once you have completed them all.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-indigo-200 bg-indigo-50 p-4 dark:border-indigo-900 dark:bg-indigo-950/40">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-wider text-indigo-700 dark:text-indigo-300">
              Stage {stageNumber} exam · {stageName}
            </p>
            <h3 className="mt-0.5 text-base font-black text-indigo-950 dark:text-indigo-100">
              {EXAM_LENGTH} questions · pass with {EXAM_PASS_MARK}
            </h3>
            <p className="mt-1 text-xs leading-relaxed text-indigo-900/80 dark:text-indigo-200/80">
              Passing unlocks the next stage. Answers are shown once you submit the whole paper,
              and you can retake it as often as you like.
            </p>
          </div>
          {passed && (
            <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-emerald-600 px-3 py-1.5 text-[11px] font-black text-white">
              <Award className="h-3.5 w-3.5" /> Passed{bestScore !== null ? ` ${bestScore}/${EXAM_LENGTH}` : ''}
            </span>
          )}
        </div>
      </div>

      {isSubmitted && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className={`rounded-2xl border p-4 ${
            submittedScore >= EXAM_PASS_MARK
              ? 'border-emerald-300 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/40'
              : 'border-amber-300 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/40'
          }`}
          role="status"
        >
          <p className="text-sm font-black text-slate-900 dark:text-white">
            {submittedScore} out of {EXAM_LENGTH} correct
            {submittedScore >= EXAM_PASS_MARK ? ' — stage passed.' : ` — ${EXAM_PASS_MARK} needed to pass.`}
          </p>
          <p className="mt-1 text-xs leading-relaxed text-slate-700 dark:text-slate-300">
            {submittedScore >= EXAM_PASS_MARK
              ? 'The next stage is now open. Your answers are marked below if you want to read the explanations.'
              : 'Read the explanations below, revisit the modules, then retake the paper. The questions are reshuffled each time.'}
          </p>
          <button
            type="button"
            onClick={startOver}
            className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-3 py-2 text-[11px] font-black text-white hover:bg-slate-800 dark:bg-indigo-600 dark:hover:bg-indigo-500"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Retake the exam
          </button>
        </motion.div>
      )}

      <ol className="space-y-3">
        {questions.map((question, index) => {
          const chosen = answers[question.id];
          return (
            <li
              key={question.id}
              className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900"
            >
              <p className="text-xs font-black text-slate-900 dark:text-white">
                <span className="mr-1.5 font-mono text-slate-400">{index + 1}.</span>
                {question.question}
              </p>

              <div className="mt-2.5 grid gap-1.5">
                {question.options.map((option, optionIndex) => {
                  const isChosen = chosen === optionIndex;
                  const isAnswer = optionIndex === question.correctIndex;
                  const showMark = isSubmitted && (isAnswer || isChosen);
                  return (
                    <button
                      key={option}
                      type="button"
                      disabled={isSubmitted}
                      aria-pressed={isChosen}
                      onClick={() => setAnswers((prev) => ({ ...prev, [question.id]: optionIndex }))}
                      className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-left text-[11px] font-bold transition-colors ${
                        isSubmitted
                          ? isAnswer
                            ? 'border-emerald-400 bg-emerald-50 text-emerald-900 dark:border-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-200'
                            : isChosen
                            ? 'border-rose-400 bg-rose-50 text-rose-900 dark:border-rose-800 dark:bg-rose-950/50 dark:text-rose-200'
                            : 'border-slate-200 text-slate-500 dark:border-slate-700 dark:text-slate-400'
                          : isChosen
                          ? 'border-indigo-500 bg-indigo-50 text-indigo-900 dark:border-indigo-500 dark:bg-indigo-950/60 dark:text-indigo-100'
                          : 'border-slate-200 text-slate-700 hover:border-indigo-300 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800'
                      }`}
                    >
                      <span className="min-w-0 flex-1">{option}</span>
                      {showMark && (isAnswer
                        ? <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                        : <XCircle className="h-4 w-4 shrink-0 text-rose-600 dark:text-rose-400" />)}
                    </button>
                  );
                })}
              </div>

              {isSubmitted && (
                <p className="mt-2 rounded-xl bg-slate-50 px-3 py-2 text-[11px] leading-relaxed text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                  {question.explanation}
                </p>
              )}
            </li>
          );
        })}
      </ol>

      {!isSubmitted && (
        <div className="sticky bottom-3 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white/95 p-3 shadow-lg backdrop-blur dark:border-slate-700 dark:bg-slate-900/95">
          <p className="text-xs font-black text-slate-700 dark:text-slate-200">
            {answeredCount} of {questions.length} answered
          </p>
          <button
            type="button"
            onClick={submit}
            disabled={answeredCount < questions.length}
            className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-black text-white transition-colors hover:bg-indigo-500 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500 dark:disabled:bg-slate-700 dark:disabled:text-slate-500"
          >
            Submit paper <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};
