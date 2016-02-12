"use strict";

let Answer = require('./Answer');

/**
 * Contains Question Metadata and a list of answers.
 */
class Question {
  /**
   * Creates a Question with no answers
   * @param {String} questionTitle Title of Question
   * @param {String} questionDescription Description of Question
   * @param {Number} genID A *UNIQUE* ID (to this Topic) representing this Question in the data model.
   */
  constructor(questionTitle, questionDescription, genID) {
    this.questionTitle = questionTitle;
    this.questionDescription = questionDescription;

    this.ID = genID;

    //Array Data
    /** List of Answer Options
     * @type {Answer[]} */
    this.answers = [];
    this.answerUID = 0;
  }

  /**
   * Create a new Answer
   * @param answerText {String} Text String for Answer
   * @param correct {Boolean} True or False if the answer is a/the correct answer
   */
  createAnswer(answerText,correct) {
    let genID = this.answerUID;
    this.answerUID++;

    this.answers.push(new Answer(answerText, correct, genID));
  }
}

module.exports = Question;