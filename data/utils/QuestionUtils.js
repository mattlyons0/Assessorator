"use strict";

let Answer = require('../Answer');

/**
 * Contains functions for diong common operations on the Question data structure.
 */
class QuestionUtils {

  /**
   * Constructor
   * @param {Question} question question to be operated on
   */
  constructor(question){
    this.question = question;
  }
  
  /**
   * Create a new Answer
   * @param answerText {String} Text String for Answer
   * @param correct {Boolean} True or False if the answer is a/the correct answer
   */
  createAnswer(answerText,correct) {
    let genID = this.question.answerUID;
    this.question.answerUID++;

    this.question.answers.push(new Answer(answerText, correct, genID));
  }
}

module.exports = QuestionUtils;