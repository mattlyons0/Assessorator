"use strict";

/**
 * Contains Objective Metadata
 * Also contains a pointer to all questions under this objective
 */
class Objective {
  /**
   * Creates a new Objective
   * @param objectiveText {String} Objective String
   * @param genID {Number} A *UNIQUE* ID (to this course) representing this Objective in the data model.
   */
  constructor(objectiveText, genID) {
    this.objectiveText = objectiveText;

    this.questionUIDs = []; //An array of Question UIDs

    this.ID = genID;

    this.creationDate = Date.now();
  }
}

module.exports = Objective;