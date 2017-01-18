"use strict";

let Topic = require('../Topic');
let Objective = require('../Objective');
let Assessment = require('../Assessment');

/**
 * Contains Functions for doing common operations on the Course data structure.
 */
class CourseUtils {

  /**
   * Constructor
   * @param {Course} course course to be operated on
   */
  constructor(course) {
    this.course = course;
  }
  
  /**
   * Creates a new Topic
   * @param {String} topicName Name of topic
   * @param {String} [topicDescription] Description of Topic
   */
  createTopic(topicName, topicDescription) {
    let genID = this.course.topicUID;
    this.course.topicUID++;

    this.course.topics.push(new Topic(topicName, topicDescription, genID));
  }

  getTopic(topicID){
    for (let x = 0; x < this.course.topics.length; x++) {
      if (this.course.topics[x].ID === topicID) {
        return this.course.topics[x];
      }
    }
    console.error("No topic with ID " + topicID + " found");
  }

  deleteTopic(topicID){
    for(let i=0;i<this.course.topics.length;i++){
      if(this.course.topics[i].ID === topicID){
        this.course.topics.splice(i,1);
        return;
      }
    }
  }

  /**
   * Creates a new Objective
   * @param objectiveText {String} Text for the Objective
   */
  createObjective(objectiveText) {
    let genID = this.course.objectiveUID;
    this.course.objectiveUID++;

    this.course.objectives.push(new Objective(objectiveText, genID));
  }
  
  getObjective(objectiveID){
    for(let objective of this.course.objectives){
      if(objective.ID===objectiveID)
        return objective;
    }
  }

  deleteObjective(objectiveID){
    for(let i=0;i<this.course.objectives.length;i++){
      let obj = this.course.objectives[i];
      if(objectiveID === obj.ID){
        this.course.objectives.splice(i,1);
        return;
      }
    }
  }

  /**
   * Creates a new Assessment containing no questions
   * @param assessmentName {String} Name of Assessment
   * @param assessmentDescription {String} Description of Assessment
   */
  createAssessment(assessmentName,assessmentDescription) {
    let genID = this.course.assessmentUID;
    this.course.assessmentUID++;

    let assessment = new Assessment(assessmentName, assessmentDescription, genID);
    this.course.assessments.push(assessment);
    return assessment;
  }
  getAssessment(id){
    for(let assessment of this.course.assessments){
      if(assessment.ID === id){
        return assessment;
      }
    }
  }
  deleteAssessment(id){
    for(let i=0;i<this.course.assessments.length;i++){
      if(this.course.assessments[i].ID === id){
        this.course.assessments.splice(i,1);
        return;
      }
    }
  }

  /**
   * Count the number of questions for the given course
   * @returns {number} Total number of questions under every topic in the course
   */
  countQuestions(){
    let count = 0;
    for(let topic of this.course.topics){
      count+= topic.questions.length;
    }

    return count;
  }

  /**
   * Get a question from a UID (containing topic and question ID)
   * @param questionUID {Number} containing topic and question ID
   * @returns {Question} question with given UID
   */
  getQuestion(questionUID){
    let topicID = questionUID.topic;

    for(let topic of this.course.topics){
      if(topic.ID === topicID){
        for(let question of topic.questions){
          if(question.UID.question === questionUID.question && question.UID.topic === questionUID.topic){
            return question;
          }
        }
      }
    }
  }
}

module.exports = CourseUtils;