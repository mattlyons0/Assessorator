"use strict";
/**
 * Interface between the UI and state backend.
 * Use UI. to access methods
 */

var UI = {};

var CourseUtils = require('../data/utils/CourseUtils');
var QuestionUtils = require('../data/utils/QuestionUtils');
var TopicUtils = require('../data/utils/TopicUtils');


let State = require('../data/State');
let state = undefined;

let createCallbacks = [];

UI.loadFromDisk = function(coursesFromDisk){
  if(state){
    console.error('Disk load prevented because there is an existing state!');
    return;
  }
  state = new State(coursesFromDisk);
  while(createCallbacks.length > 0){
    createCallbacks[0]();
    createCallbacks.splice(0,1);
  }
  stresstest(); //Do stress test if env var is set
};

UI.stateCreated = function(){
  return !!state;

};

UI.onStateCreate = function(callback){
  if(!state)
    createCallbacks.push(callback);
  else {
    callback();
    createCallbacks.splice(0,1);
  }
};

UI.save = function(course){
  let worker = new Worker('worker.js');
  worker.postMessage(course);
};

UI.getClasses = function () {
  if(!state)
    return;
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

UI.deleteClass = function(id){
  for(let i=0;i<state.courseList.length;i++){
    if(state.courseList[i].ID === id){
      Database.deleteCourse(id);
      
      state.courseList.splice(i,1);
      return;
    }
  }
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
  return courseID;
};

UI.printData = function () {
  console.log(state);
};

let toastQueue = [];
let currentToast = false;
var showToast = function (textContent,$mdToast){
  if(!$mdToast){
    console.error("showToast was called without a $mdToast variable");
    return;
  }
  toastQueue.push({call: $mdToast.simple().textContent(textContent).position("bottom right").hideDelay(3000), mdToast: $mdToast});
  if(!currentToast)
    processToastQueue();
};
function processToastQueue(){
  currentToast = toastQueue.length > 0;

  for(let x=0;x<toastQueue.length;x++){
    toastQueue[x].mdToast.show(toastQueue[x].call);
    toastQueue.splice(0,1);
    setInterval(function(){
      processToastQueue();
    },3000);
    return;
  }
}

//If a string is too long will append ...
var strLimit = function(str){
  let limit = 30; //limit in characters
  if(str.length > limit){
    return str.substring(0,limit).trim()+"…";
  }
  return str;
};

function stresstest(){
  if(process.env.NODE_ENV === 'dev' && process.env.stress){
    let n = 50;
    for(let i=0;i<n;i++) {
      UI.createClass("Dummy Class","DUM "+(100+i),"Fall",(2015+i));
      for(let z=0;z<n*2;z++) { //1k
        new CourseUtils(UI.getClasses()[i]).createTopic('Dummy Topic ' + (z + 1), 'A Topic created for the purposes of testing.');
        new CourseUtils(UI.getClasses()[i]).createObjective('Test Objective ' + (z + 1));
        for(let x=0;x<100;x++) { //10k
          new TopicUtils(UI.getClasses()[i].topics[z]).createQuestion('Dummy Question ' + (x + 1), 'A Question for the purposes of testing.');
          new QuestionUtils(UI.getClasses()[i].topics[z].questions[x]).createAnswer('True', false);
          new QuestionUtils(UI.getClasses()[i].topics[z].questions[x]).createAnswer('False', true);
        }
      }
      UI.save(UI.getClasses()[i]);
    }
    UI.save(UI.getClasses()[0]);
  }
}

if(Array.prototype.equals)
  console.warn("Overriding existing Array.prototype.equals. Possible causes: New API defines the method, there's a framework conflict or you've got double inclusions in your code.");
// attach the .equals method to Array's prototype to call it on any array
Array.prototype.equals = function (array) {
  // if the other array is a falsy value, return
  if (!array)
    return false;

  // compare lengths - can save a lot of time
  if (this.length != array.length)
    return false;

  for (var i = 0, l=this.length; i < l; i++) {
    // Check if we have nested arrays
    if (this[i] instanceof Array && array[i] instanceof Array) {
      // recurse into the nested arrays
      if (!this[i].equals(array[i]))
        return false;
    }
    else if (this[i] != array[i]) {
      // Warning - two different object instances will never be equal: {x:20} != {x:20}
      return false;
    }
  }
  return true;
};
// Hide method from for-in loops
Object.defineProperty(Array.prototype, "equals", {enumerable: false});