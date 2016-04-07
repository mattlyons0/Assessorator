"use strict";

let Topic = require('./Topic');
let Objective = require('./Objective');
let Assessment = require('./Assessment');

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
}

module.exports = Course;