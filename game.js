(function (global) {
  'use strict';

  // 返回 [min, max] 闭区间内的整数;rng 为可注入随机源(默认 Math.random)
  function randomInt(min, max, rng) {
    var r = (rng || Math.random)();
    return min + Math.floor(r * (max - min + 1));
  }

  // 生成一题 {a, b, answer}:a 取自 segments(整数数组),b 取自 1..9,
  // 避免与 prev 完全相同(同 a 同 b)。rng 可注入以便测试。
  function generateQuestion(segments, prev, rng) {
    if (!segments || segments.length === 0) {
      throw new Error('segments 不能为空');
    }
    var q;
    var guard = 0;
    do {
      var a = segments[randomInt(0, segments.length - 1, rng)];
      var b = randomInt(1, 9, rng);
      q = { a: a, b: b, answer: a * b };
      guard++;
    } while (prev && q.a === prev.a && q.b === prev.b && guard < 100);
    return q;
  }

  // 校验输入(字符串或数字)是否等于该题答案
  function checkAnswer(question, inputStr) {
    if (inputStr === '' || inputStr === null || inputStr === undefined) {
      return false;
    }
    return Number(inputStr) === question.answer;
  }

  // 格式化题目用于显示,例如 "7 × 8 = ?"
  function formatQuestion(question) {
    return question.a + ' × ' + question.b + ' = ?';
  }

  var Game = {
    randomInt: randomInt,
    generateQuestion: generateQuestion,
    checkAnswer: checkAnswer,
    formatQuestion: formatQuestion
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = Game;
  }
  global.Game = Game;
})(typeof window !== 'undefined' ? window : globalThis);
