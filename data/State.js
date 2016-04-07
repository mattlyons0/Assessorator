"use strict";

let Course = require('./Course');
/**
 * Contains a list of courses.
 * State is a special case and includes functions in the data structure class instead of requiring a Utils class because
 *   it isn't included when data is saved to the disk, therefore functions will not be lost since it is never restored from disk.
 */
class State {
  /**
   * Creates a state with a courses array from the disk (if specified)
   * @param [coursesFromDisk] {Course[]} Courses from the disk read
   */
  constructor(coursesFromDisk) {
    this.courseList = [];
    this.courseUID = 0; //Running count of course ID's which have been assigned in order to always contain a unused ID

    if(coursesFromDisk.length) {
      this.courseList = coursesFromDisk;
      this.courseUID = coursesFromDisk[coursesFromDisk.length - 1].ID + 1; //This will always be ordered by key because we use the key to store it
    }
  }

  /**
   * Creates a Course and adds it to the state.
   * @param courseName {String} Friendly Name of Course
   * @param courseID {String} Friendly ID of Course
   * @param courseYear {Number} Year of Course
   * @param courseSemester {String|Number} TODO figure out how to handle this
   *
   * @returns {Number} ID of course created.
   */
  createCourse(courseName, courseID, courseYear, courseSemester) {
    let genID = this.courseUID;
    this.courseUID++;

    let course = new Course(courseName, courseID, courseYear, courseSemester, genID);
    this.courseList.push(course);
    Database.addCourse(course);
    return genID;
  }
}
module.exports = State;