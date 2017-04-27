"use strict";

let Question = require('../Question');
let ObjectiveUtils = require('./ObjectiveUtils');

/**
 * Contains Functions for doing common operations on the Topic data structure.
 */
class TopicUtils {

  /**
   * Constructor
   * @param {Topic} topic topic to be operated on
   */
  constructor(topic){
    this.topic = topic;
  }

  /**
   * Create a new Question
   * @param {String} questionTitle Title of Question
   * @param {String} questionDescription Description of Question
   */
  createQuestion(questionTitle, questionDescription) {
    let genID = this.topic.questionUID;
    this.topic.questionUID++;

    this.topic.questions.push(new Question(questionTitle, questionDescription, genID,this.topic.ID));
    
    return genID;
  }

  getQuestion(questionID){
    for(let question of this.topic.questions){
      if(question.ID === questionID)
        return question;
    }
    return undefined;
  }

  deleteQuestion(questionID){
    let UID = -1;
    for(let i=0;i<this.topic.questions.length;i++){
      if(this.topic.questions[i].ID === questionID){
        let question = this.topic.questions[i];
        UID = question.UID;
        //Remove objective reference to question
        for(let objective of this.topic.questions[i].objectives){
          new ObjectiveUtils(objective).removeQuestionUID(this.topic.questions[i].UID);
        }

        //Delete Question
        this.topic.questions.splice(i,1);

        //Delete question from state structures
        let json = UI.UIDtoJson(UID);
        delete UI.miscState.classView.questions.checked[json];
        delete UI.miscState.classView.questions.open[json];

        //Delete from Assessments
        for(let assessment of UI.getClassById(UI.classID).assessments){
          let index = assessment.questions.indexOf(json);
          if(index !== -1){
            assessment.questions.splice(index,1);
          }
        }

        return;
      }
    }

    console.error('Error finding question to delete: '+questionID+' in topic '+this.topic.ID)
  }
}

module.exports = TopicUtils;