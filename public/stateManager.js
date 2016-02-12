"use strict";
/**
 * Interface between the UI and state backend.
 * Use UI. to access methods
 */

var UI = {};

let State = require('./../data/State');
let state = new State();

UI.getClasses = function () {
  return state.courseList;
};

UI.getClassById = function (id) {
  for (let x = 0; x < state.courseList.length; x++) {
    if (state.courseList[x].ID === id) {
      return state.courseList[x];
    }
  }
  console.error("No course with ID " + id + " found");
};


UI.getAllQuestionsForClass = function (classID){
  let course = UI.getClassById(classID);
  let questions = [];
  for(let x=0;x<course.topics.length;x++){
    for(let y=0;y<course.topics[x].questions.length;y++){
      questions.push(course.topics[x].questions[y]);
    }
  }
  return questions;
};

UI.createClass = function (name, id, semester, year) {
  //Update Data Model
  let courseID = state.createCourse(name, id, year, semester);
};

UI.printData = function () {
  console.log(state);
};

//If a string is too long will append ...
var strLimit = function(str){
  let limit = 30; //limit in characters
  if(str.length > limit){
    return str.substring(0,limit).trim()+"…";
  }
  return str;
};