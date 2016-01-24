"use strict";

/**
 * Contains Objective Metadata
 */
class Objective {
  /**
   * Creates a new Objective
   * @param objectiveText {String} Objective String
   * @param genID {Number} A *UNIQUE* ID (to this course) representing this Objective in the data model.
   */
  constructor(objectiveText, genID) {
    this.objectiveText = objectiveText;

    this.ID = genID;
  }
}