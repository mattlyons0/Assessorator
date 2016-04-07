"use strict";

/**
 * Contains Topic Metadata and a list of questions related to that topic.
 */
class Topic {
  /**
   * Creates a Topic
   * @param topicName {String} Friendly Name of Topic
   * @param topicDescription {String} Description of Topic
   * @param genID {Number} A *UNIQUE* ID (to this course) representing this Topic in the data model.
   */
  constructor(topicName, topicDescription, genID) {
    this.topicName = topicName;
    this.topicDescription = topicDescription;

    this.ID = genID;

    //Array Data
    /** List of Questions on the Topic
     * @type {Question[]} */
    this.questions = [];
    this.questionUID = 0;
  }
}

module.exports = Topic;