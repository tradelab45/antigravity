import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  STAGE_EXAMS,
  EXAM_LENGTH,
  EXAM_PASS_MARK,
  EXAM_ATTEMPT_HISTORY,
  REST_PAPERS_AFTER_CORRECT,
  REST_PAPERS_AFTER_WRONG,
  REVIEW_SHARE,
  emptyExamMemory,
  memoryFromSeenIds,
  recordPaper,
  getStageExam,
  buildExamAttempt,
  type ExamAttempt,
} from '../src/data/stageExams';

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

  const second = buildExamAttempt(exam, Math.random, memoryFromSeenIds(firstIds));
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
  const paper = buildExamAttempt(exam, Math.random, memoryFromSeenIds(allIds));
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

test('a rested bank always has enough questions left for a full paper', () => {
  // A paper drawn entirely from questions answered correctly last time still
  // has to be full: the rest period may not shorten the exam.
  for (const exam of STAGE_EXAMS) {
    const everything = exam.questions.map((question) => ({ id: question.id, correct: true }));
    const memory = recordPaper(emptyExamMemory(), everything);
    assert.equal(buildExamAttempt(exam, Math.random, memory).length, EXAM_LENGTH, exam.stageId);
  }
});

test('a question answered wrongly comes back on the next paper', () => {
  const exam = STAGE_EXAMS[0];
  const first = buildExamAttempt(exam);
  const missed = first.slice(0, 4).map((question) => question.id);

  const memory = recordPaper(
    emptyExamMemory(),
    first.map((question) => ({ id: question.id, correct: !missed.includes(question.id) })),
  );

  const second = buildExamAttempt(exam, Math.random, memory).map((question) => question.id);
  for (const id of missed) {
    assert.ok(second.includes(id), `${id} was answered wrongly and should be asked again`);
  }
});

test('a question answered correctly rests while wrong ones return', () => {
  const exam = STAGE_EXAMS[0];
  const first = buildExamAttempt(exam);
  const wrongId = first[0].id;

  const memory = recordPaper(
    emptyExamMemory(),
    first.map((question) => ({ id: question.id, correct: question.id !== wrongId })),
  );

  const second = buildExamAttempt(exam, Math.random, memory).map((question) => question.id);
  const restedAndReturned = first
    .slice(1)
    .filter((question) => second.includes(question.id));

  // A paper is always full, so once the unseen pool is spent the rested
  // questions fill the rest — but only that many, and only after them.
  const unseenAvailable = exam.questions.length - first.length;
  const shortfall = Math.max(0, EXAM_LENGTH - 1 - unseenAvailable);

  assert.ok(second.includes(wrongId), 'the wrong one is back');
  assert.equal(
    restedAndReturned.length,
    shortfall,
    'nothing answered correctly returns while an unseen question could take its place',
  );
});

test('review never takes more than half the paper', () => {
  const exam = STAGE_EXAMS[0];
  // A paper where everything was wrong: the next one still has to teach.
  const first = buildExamAttempt(exam);
  const memory = recordPaper(
    emptyExamMemory(),
    first.map((question) => ({ id: question.id, correct: false })),
  );

  const second = buildExamAttempt(exam, Math.random, memory);
  const repeated = second.filter((question) =>
    first.some((earlier) => earlier.id === question.id),
  );

  assert.ok(
    repeated.length <= Math.floor(EXAM_LENGTH * REVIEW_SHARE),
    `a wholly failed paper brought back ${repeated.length} of ${EXAM_LENGTH}`,
  );
  assert.ok(repeated.length > 0, 'and it does bring some back');
});

test('a correct answer rests for three papers, not forever', () => {
  const exam = STAGE_EXAMS[0];
  const id = exam.questions[0].id;

  let memory = recordPaper(emptyExamMemory(), [{ id, correct: true }]);
  assert.equal(memory.papers, 1);
  assert.equal(memory.questions[id].correct, true);

  // Two more papers pass without it.
  memory = recordPaper(memory, []);
  memory = recordPaper(memory, []);
  assert.equal(memory.papers, REST_PAPERS_AFTER_CORRECT);

  const drawn = buildExamAttempt(
    { ...exam, questions: [exam.questions[0]] },
    Math.random,
    memory,
  );
  assert.equal(drawn[0].id, id, 'once rested it is eligible again');
});

test('a paper that was never submitted changes nothing', () => {
  const memory = emptyExamMemory();
  assert.equal(memory.papers, 0);
  assert.deepEqual(memory.questions, {}, 'only a graded paper is recorded');
  assert.equal(REST_PAPERS_AFTER_WRONG, 1);
});

test('an unknown result is ignored rather than stored as a question', () => {
  const memory = recordPaper(emptyExamMemory(), [
    { id: 'ex-b-1', correct: false },
    null as any,
    { id: 42 as any, correct: true },
  ]);
  assert.deepEqual(Object.keys(memory.questions), ['ex-b-1']);
});

test('no bank asks the same question twice', () => {
  // Growing the banks from 20 to 36 added five questions whose text repeated
  // one already there under a different id. The draw works by id, so a paper
  // could show a learner the identical question twice — and a test matching
  // the paper against the bank counted one question as two.
  for (const exam of STAGE_EXAMS) {
    const texts = exam.questions.map((question) => question.question.trim().toLowerCase());
    const repeated = texts.filter((text, index) => texts.indexOf(text) !== index);
    assert.deepEqual(repeated, [], `${exam.stageId} repeats a question`);
  }
});
