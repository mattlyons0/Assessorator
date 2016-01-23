/**
 * Contains Answer Metadata
 */
class Answer {
  /**
   * Creates an answer
   * @param answerText {String} Answer String
   * @param genID {Number} A *UNIQUE* ID (to this Question) representing this Answer in the data model.
   */
  constructor(answerText, genID) {
    this.answerText = answerText;

    this.id = genID;
  }
}