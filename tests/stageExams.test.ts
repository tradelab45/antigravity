import { test } from 'node:test';
import assert from 'node:assert/strict';
import { STAGE_EXAMS, EXAM_LENGTH, EXAM_PASS_MARK, getStageExam, buildExamAttempt } from '../src/data/stageExams';

test('every stage has an exam of exactly the advertised length', () => {
  assert.equal(STAGE_EXAMS.length, 6);
  for (const exam of STAGE_EXAMS) {
    assert.equal(exam.questions.length, EXAM_LENGTH, `${exam.stageId} has ${exam.questions.length} questions`);
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

  assert.equal(attempt.length, exam.questions.length);
  assert.deepEqual(
    new Set(attempt.map((q) => q.id)),
    new Set(exam.questions.map((q) => q.id)),
    'the attempt must contain every question exactly once',
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
