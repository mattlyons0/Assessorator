/**
 * Contains a list of courses.
 */
class State {
  /**
   * Creates a state with no courses.
   */
  constructor() {
    this.courseList = [];
    this.courseUID = 0; //Running count of course ID's which have been assigned in order to always contain a unused ID
  }

  /**
   * Creates a Course and adds it to the state.
   * @param courseName {String} Friendly Name of Course
   * @param courseID {String} Friendly ID of Course
   * @param courseYear {Number} Year of Course
   * @param courseSemester {String|Number} TODO figure out how to handle this
   */
  createCourse(courseName, courseID, courseYear, courseSemester) {
    let genID = this.courseUID;
    this.courseUID++;

    this.courseList.push(new Course(courseName, courseID, courseYear, courseSemester, genID));
  }
}