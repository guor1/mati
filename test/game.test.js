'use strict';
const test = require('node:test');
const assert = require('node:assert');
const Game = require('../game.js');

// 可控随机源:按序返回给定值,循环
function seq(values) {
  let i = 0;
  return function () {
    const v = values[i % values.length];
    i++;
    return v;
  };
}

test('randomInt: rng=0 返回 min', () => {
  assert.strictEqual(Game.randomInt(1, 9, () => 0), 1);
});

test('randomInt: rng≈1 返回 max', () => {
  assert.strictEqual(Game.randomInt(1, 9, () => 0.999), 9);
});

test('randomInt: rng=0.5 返回中间值', () => {
  assert.strictEqual(Game.randomInt(1, 9, () => 0.5), 5);
});

test('generateQuestion: a 取自段位,b 取自 1..9,answer=a*b', () => {
  const q = Game.generateQuestion([6, 7, 8], null, () => 0);
  assert.strictEqual(q.a, 6);
  assert.strictEqual(q.b, 1);
  assert.strictEqual(q.answer, 6);
});

test('generateQuestion: 避免与上一题完全相同', () => {
  const prev = { a: 6, b: 1, answer: 6 };
  const rng = seq([0, 0, 0, 0.5]);
  const q = Game.generateQuestion([6, 7, 8], prev, rng);
  assert.ok(!(q.a === 6 && q.b === 1), '应与上一题不同');
});

test('generateQuestion: 段位为空时抛错', () => {
  assert.throws(() => Game.generateQuestion([], null, () => 0));
});

test('checkAnswer: 输入等于答案返回 true', () => {
  assert.strictEqual(Game.checkAnswer({ a: 7, b: 8, answer: 56 }, '56'), true);
});

test('checkAnswer: 错误或空输入返回 false', () => {
  assert.strictEqual(Game.checkAnswer({ a: 7, b: 8, answer: 56 }, '57'), false);
  assert.strictEqual(Game.checkAnswer({ a: 7, b: 8, answer: 56 }, ''), false);
});

test('formatQuestion: 渲染为 "A × B = ?"', () => {
  assert.strictEqual(Game.formatQuestion({ a: 7, b: 8, answer: 56 }), '7 × 8 = ?');
});
