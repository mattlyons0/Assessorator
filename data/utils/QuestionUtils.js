"use strict";

let Answer = require('../Answer');
let ObjectiveUtils = require('./ObjectiveUtils');

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
   * @param pinned {Boolean} If the answer should be pinned in place or randomized
   */
  createAnswer(answerText,correct,pinned) {
    let genID = this.question.answerUID;
    this.question.answerUID++;

    this.question.answers.push(new Answer(answerText, correct, pinned, genID));
  }

  addObjective(objective){
    if(this.question.objectives.includes(objective)){
      console.warn('Tried adding objective question already has');
      return;
    }
    this.question.objectives.push(objective);
    new ObjectiveUtils(objective).addQuestionUID(this.question.UID);
  }

  removeObjective(objective){
    let index = this.question.objectives.indexOf(objective);
    if(index !== -1){
      this.question.objectives.splice(index,1); //Remove element
      new ObjectiveUtils(objective).removeQuestionUID(this.question.UID);
    } else{
      console.warn('Tried removing objective question doesn\'t have');
    }
  }

  /**
   * Generate and add a UID to the given question
   */
  createUID(){
    this.question.UID = {topic: this.question.topicID,question:this.question.ID};
  }
}

module.exports = QuestionUtils;