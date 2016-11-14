"use strict";

/**
 * Contains Question Metadata and a list of answers.
 */
class Question {
  /**
   * Creates a Question with no answers
   * @param {String} questionTitle Title of Question
   * @param {String} questionDescription Description of Question
   * @param {Number} genID A *UNIQUE* ID (to this Topic) representing this Question in the data model.
   * @param {Number} topicID A ID referring to the topic the question ID is unique to.
   */
  constructor(questionTitle, questionDescription, genID, topicID) {
    this.questionTitle = questionTitle;
    this.questionDescription = questionDescription;

    this.ID = genID;
    this.topicID = topicID;
    this.UID = ''; //this.ID+' '+this.UID
    new QuestionUtils(this).createUID();

    //Array Data
    /** List of Answer Options
     * @type {Answer[]} */
    this.answers = [];
    this.answerUID = 0;

    /** List of pointers to objective objects
     * @type {Objective[]} */
    this.objectives = [];
  }
}

module.exports = Question;