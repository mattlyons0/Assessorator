"use strict";

let Objective = require('../Objective');

/**
 * Contains functions for diong common operations on the Objective data structure.
 */
class ObjectiveUtils {

  /**
   * Constructor
   * @param {Objective} objective objective to be operated on
   */
  constructor(objective){
    this.objective = objective;
  }

  /**
   * Add a question UID to the reference list of the objective
   * @param questionUID {String} UID of the question
   */
  addQuestionUID(questionUID){
    for(let qUID of this.objective.questionUIDs){
      if(qUID.topic == questionUID.topic && qUID.question == questionUID.question)
        return;
    }
    this.objective.questionUIDs.push(questionUID);
  }

  /**
   * Remove a question UID from the local objective reference list
   * @param questionUID UID of question to remove reference from
   */
  removeQuestionUID(questionUID){
    for(let i=0;i<this.objective.questionUIDs.length;i++){
      let uid = this.objective.questionUIDs[i];
      if(uid.topic == questionUID.topic && uid.question == questionUID.question){
        this.objective.questionUIDs.splice(i,1);
        return;
      }
    }
  }
}

module.exports = ObjectiveUtils;