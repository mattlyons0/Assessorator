"use strict";

/**
 * Contains Answer Metadata
 */
class Answer {
  /**
   * Creates an answer
   * @param answerText {String} Answer String
   * @param correct {Boolean} If the answer is a/the correct answer.
   * @param pinned {Boolean} If the answer is pinned in place (true) or can be randomized (false)
   * @param genID {Number} A *UNIQUE* ID (to this Question) representing this Answer in the data model.
   */
  constructor(answerText, correct, pinned, genID) {
    this.answerText = answerText;
    this.correct = correct;
    this.pinned = pinned;

    this.id = genID;
  }
}

module.exports = Answer;