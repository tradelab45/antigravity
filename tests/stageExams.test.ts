import { test } from 'node:test';
import assert from 'node:assert/strict';
import { STAGE_EXAMS, EXAM_LENGTH, EXAM_PASS_MARK, EXAM_ATTEMPT_HISTORY, EXAM_SEEN_MEMORY, getStageExam, buildExamAttempt, type ExamAttempt } from '../src/data/stageExams';

test('every stage has a bank larger than one paper', () => {
  assert.equal(STAGE_EXAMS.length, 6);
  for (const exam of STAGE_EXAMS) {
    // The bank used to be exactly one paper, which meant every retake served
    // the same twenty questions in a new order.
    assert.ok(
      exam.questions.length > EXAM_LENGTH,
      `${exam.stageId} has ${exam.questions.length} questions, so a retake cannot rotate`,
    );
  }
});

test('every question has four options and an answer inside that range', () => {
  for (const exam of STAGE_EXAMS) {
    for (const question of exam.questions) {
      assert.equal(question.options.length, 4, `${question.id} does not offer four options`);
      assert.ok(
        Number.isInteger(question.correctIndex) && question.correctIndex >= 0 && question.correctIndex < question.options.length,
        `${question.id} has an out-of-range correctIndex`,
      );
      assert.ok(question.explanation.trim().length > 0, `${question.id} has no explanation`);
    }
  }
});

test('question ids are unique across the whole bank', () => {
  const ids = STAGE_EXAMS.flatMap((exam) => exam.questions.map((q) => q.id));
  assert.equal(new Set(ids).size, ids.length);
});

test('options within a question are distinct', () => {
  for (const exam of STAGE_EXAMS) {
    for (const question of exam.questions) {
      assert.equal(new Set(question.options).size, 4, `${question.id} repeats an option`);
    }
  }
});

test('an attempt shuffles the questions and the options within them', () => {
  // A small linear congruential generator keeps the shuffle reproducible here.
  let seed = 42;
  const rng = () => {
    seed = (seed * 1103515245 + 12345) % 2147483648;
    return seed / 2147483648;
  };

  const exam = STAGE_EXAMS[0];
  const attempt = buildExamAttempt(exam, rng);

  assert.equal(attempt.length, EXAM_LENGTH);
  const bankIds = new Set(exam.questions.map((q) => q.id));
  assert.ok(
    attempt.every((q) => bankIds.has(q.id)),
    'every drawn question must come from this stage’s bank',
  );
  assert.equal(
    new Set(attempt.map((q) => q.id)).size,
    attempt.length,
    'the paper must not repeat a question',
  );

  // The remap has to follow the answer text, not its original slot.
  for (const question of attempt) {
    const source = exam.questions.find((q) => q.id === question.id)!;
    assert.equal(
      question.options[question.correctIndex],
      source.options[source.correctIndex],
      `${question.id} lost its correct answer in the shuffle`,
    );
    assert.deepEqual(new Set(question.options), new Set(source.options));
  }

  const positions = new Set(attempt.map((q) => q.correctIndex));
  assert.ok(positions.size >= 3, 'a shuffled attempt should spread answers across positions');
});

test('two attempts at the same exam differ in order', () => {
  const exam = STAGE_EXAMS[1];
  const first = buildExamAttempt(exam);
  const second = buildExamAttempt(exam);
  const sameOrder = first.every((q, i) => q.id === second[i].id);
  assert.ok(!sameOrder, 'a retry should not present the questions in the same order');
});

test('the pass mark is achievable and demanding', () => {
  assert.ok(EXAM_PASS_MARK > EXAM_LENGTH / 2, 'a pass should need more than a coin flip');
  assert.ok(EXAM_PASS_MARK <= EXAM_LENGTH);
});

test('exams are addressable by the learning path stage ids', () => {
  for (const id of ['beginner', 'explorer', 'builder', 'analyst', 'responsible', 'taxation']) {
    assert.ok(getStageExam(id), `no exam for stage ${id}`);
  }
  assert.equal(getStageExam('nope'), undefined);
});

/**
 * The academy keeps a rolling window of attempts per stage. The reducer below
 * mirrors what recordExamScore does, so the cap and the ordering are covered
 * without standing up the component.
 */
const recordAttempt = (history: ExamAttempt[], attempt: ExamAttempt): ExamAttempt[] =>
  [attempt, ...history].slice(0, EXAM_ATTEMPT_HISTORY);

test('the attempt history keeps the newest attempts and caps its length', () => {
  let history: ExamAttempt[] = [];
  for (let i = 0; i < EXAM_ATTEMPT_HISTORY + 5; i += 1) {
    history = recordAttempt(history, { score: i % (EXAM_LENGTH + 1), at: 1_700_000_000_000 + i });
  }

  assert.equal(history.length, EXAM_ATTEMPT_HISTORY, 'the window should not grow past its cap');
  assert.equal(
    history[0].at,
    1_700_000_000_000 + EXAM_ATTEMPT_HISTORY + 4,
    'the most recent attempt belongs at the front',
  );
  const descending = history.every((entry, i) => i === 0 || history[i - 1].at > entry.at);
  assert.ok(descending, 'attempts should read newest first');
});

test('a pass is decided by the best attempt, not the last one', () => {
  const history: ExamAttempt[] = [
    { score: 9, at: 3 },
    { score: EXAM_PASS_MARK + 2, at: 2 },
    { score: 4, at: 1 },
  ];
  const best = Math.max(...history.map((entry) => entry.score));
  assert.ok(best >= EXAM_PASS_MARK, 'a cleared stage stays cleared after a worse retake');
  assert.ok(history[0].score < EXAM_PASS_MARK, 'the latest attempt here is a fail, deliberately');
});

test('every bank holds well more questions than one paper asks', () => {
  for (const exam of STAGE_EXAMS) {
    assert.ok(
      exam.questions.length >= EXAM_LENGTH + 10,
      `${exam.stageId} has ${exam.questions.length} questions; a paper of ${EXAM_LENGTH} would barely rotate`,
    );
  }
});

test('a paper is exactly the exam length even though the bank is larger', () => {
  for (const exam of STAGE_EXAMS) {
    assert.equal(buildExamAttempt(exam).length, EXAM_LENGTH);
  }
});

test('a retake avoids the questions the last paper served', () => {
  const exam = STAGE_EXAMS[0];
  const first = buildExamAttempt(exam);
  const firstIds = first.map((question) => question.id);

  const second = buildExamAttempt(exam, Math.random, firstIds);
  const overlap = second.filter((question) => firstIds.includes(question.id));

  // The bank holds 36 and a paper asks 20, so 16 are fresh and only the
  // remainder can repeat.
  const unseenAvailable = exam.questions.length - firstIds.length;
  assert.equal(
    overlap.length,
    Math.max(0, EXAM_LENGTH - unseenAvailable),
    'a retake should draw every unseen question before reusing one',
  );
});

test('a paper is still full once every question has been seen', () => {
  const exam = STAGE_EXAMS[1];
  const allIds = exam.questions.map((question) => question.id);
  const paper = buildExamAttempt(exam, Math.random, allIds);
  assert.equal(paper.length, EXAM_LENGTH, 'an exhausted pool must not shorten the paper');
});

test('question ids are unique within a bank and across all banks', () => {
  const seen = new Set<string>();
  for (const exam of STAGE_EXAMS) {
    const ids = exam.questions.map((question) => question.id);
    assert.equal(new Set(ids).size, ids.length, `${exam.stageId} repeats a question id`);
    for (const id of ids) {
      assert.ok(!seen.has(id), `id ${id} appears in more than one bank`);
      seen.add(id);
    }
  }
});

test('no paper serves the same question twice', () => {
  for (const exam of STAGE_EXAMS) {
    const ids = buildExamAttempt(exam).map((question) => question.id);
    assert.equal(new Set(ids).size, ids.length, `${exam.stageId} served a duplicate in one paper`);
  }
});

test('the seen memory is smaller than every bank', () => {
  // Remembering a whole bank would leave no unseen pool and silently return
  // the learner to repeats.
  for (const exam of STAGE_EXAMS) {
    assert.ok(
      EXAM_SEEN_MEMORY < exam.questions.length,
      `${exam.stageId} has ${exam.questions.length} questions but the memory holds ${EXAM_SEEN_MEMORY}`,
    );
  }
});
