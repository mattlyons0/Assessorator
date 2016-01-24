"use strict";

/**
 * Contains Assessment Metadata and a list of questions used in the assessment
 */
class Assessment {
  /**
   * Creates a new Assessment with no questions
   * @param assessmentName {String} Name of Assessment
   * @param genID {Number} A *UNIQUE* ID (to this course) representing this Assessment in the data model.
   */
  constructor(assessmentName, genID) {
    this.assessmentName = assessmentName;

    this.ID = genID;

    //Array Data
    /** List of Question IDs
     * @type {Number[]} */
    this.questionIDs = [];
  }

  /**
   * Add a question to the assessment
   * @param questionID {Number} ID of Question
   */
  addQuestion(questionID) {
    this.questionIDs.push(questionID);
  }
}