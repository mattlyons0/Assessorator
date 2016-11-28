"use strict";

/**
 * Contains Assessment Metadata, a list of questions used in the assessment and a list of rules to be evaluated upon generation.
 */
class Assessment {
  /**
   * Creates a new Assessment with no questions
   * @param assessmentName {String} Name of Assessment
   * @param assessmentDescription {String} Description of Assessment
   * @param genID {Number} A *UNIQUE* ID (to this course) representing this Assessment in the data model.
   */
  constructor(assessmentName, assessmentDescription, genID) {
    this.assessmentName = assessmentName;
    this.assessmentDescription = assessmentDescription;

    this.ID = genID;

    //Array Data
    /** List of Question Pointers
     * @type {Question[]} */
    this.questions = [];
    /** List of Rules
     * @type {{}[]} */
    this.rules = [];

    this.creationDate = Date.now();
  }
}

module.exports = Assessment;