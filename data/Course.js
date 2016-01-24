"use strict";

/**
 * Contains Course Metadata and lists of Assessments generated, Objectives created, and Topics created.
 */
class Course {
  /**
   * Creates a Course
   * @param courseName {String} Friendly name of course
   * @param courseID {String} Friendly ID of course
   * @param courseYear {Number} Year of Course
   * @param courseSemester {String|Number} TODO decide how to handle this
   * @param genID {Number} A *UNIQUE* ID representing this course in the data model.
   */
  constructor(courseName, courseID, courseYear, courseSemester, genID) {
    this.courseName = courseName;
    this.courseID = courseID;
    this.courseYear = courseYear;
    this.courseSemester = courseSemester;

    this.ID = genID; //Generate a unique ID to use internally

    //Array Data
    /** Saved Assessments Generated
     * @type {Assessment[]} */
    this.assessments = [];
    this.assessmentUID = 0;
    /** List of Objectives for Course
     * @type {Objective[]}  */
    this.objectives = [];
    this.objectiveUID = 0;
    /** List of Topics for the Course
     * @type {Topic[]} */
    this.topics = [];
    this.topicUID = 0;
  }

  /**
   * Creates a new Topic
   * @param {String} topicName Name of topic
   * @param {String} [topicDescription] Description of Topic
   */
  createTopic(topicName, topicDescription) {
    let genID = this.topicUID;
    this.topicUID++;

    this.topics.push(new Topic(topicName, topicDescription, genID));
  }

  /**
   * Creates a new Objective
   * @param objectiveText {String} Text for the Objective
   */
  createObjective(objectiveText) {
    let genID = this.objectiveUID;
    this.objectiveUID++;

    this.objectives.push(new Objective(objectiveText, genID));
  }

  /**
   * Creates a new Assessment containing no questions
   * @param assessmentName {String} Name of Assessment
   */
  createAssessment(assessmentName) {
    let genID = this.assessmentUID;
    this.assessmentUID++;

    this.assessments.push(new Assessment(assessmentName, genID));
  }
}

module.exports = Course;