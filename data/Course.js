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

    /* User Preferences and remembered settings
     */
    this.prefs = {
      classView: {
        openedTab: 0, //Index of open tab

        assessments: {
          sort: 0,
          filter: {
            open: false,

            query: '',
            topicQuery: null,
            objectiveQuery: null,

            searchNames: true,
            searchDescriptions: false,
            searchQuestions: false,
            caseSensitive: false
          }
        },
        topics: {
          sort: 0,
          filter: {
            open: false,

            query: '',
            searchTopics: true,
            searchDescriptions: false,
            caseSensitive: false
          }
        },
        objectives: {
          sort: 0,
          filter: {
            open: false,

            query: '',
            caseSensitive: false
          }
        },
        questions: {
          sort: 0,
          filter: {
            open: false,

            query: '',
            topicQuery: null,
            objectiveQuery: null,

            searchQuestions: true,
            searchDescriptions: false,
            searchAnswers: false,
            caseSensitive: false
          },
          bulk: {
            open: false,
          }
        }
      }
    }
  }
}

module.exports = Course;