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
    //Maybe in the future will have to verify it doesn't already exist
    this.objective.questionUIDs.push(questionUID);
  }

  /**
   * Remove a question UID from the local objective reference list
   * @param questionUID {String} UID of question to remove reference from
   */
  removeQuestionUID(questionUID){
    for(let i=0;i<this.objective.questionUIDs.length;i++){
      if(this.objective.questionUIDs[i] == questionUID){
        this.objective.questionUIDs.splice(i,1);
      }
    }
  }
}

module.exports = ObjectiveUtils;