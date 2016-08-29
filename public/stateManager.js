"use strict";
/**
 * Interface between the UI and state backend.
 * Use UI. to access methods
 */

let appD = require('appdirectory');
let dir = new appD("Assessorator");
let makeDir = require('mkdirp');

var UI = {};

var CourseUtils = require('../data/utils/CourseUtils');
var QuestionUtils = require('../data/utils/QuestionUtils');
var TopicUtils = require('../data/utils/TopicUtils');


let State = require('../data/State');
let state = undefined;

let createCallbacks = [];

UI.loadFromDisk = function (coursesFromDisk) {
  if (state) {
    console.error('Disk load prevented because there is an existing state!');
    return;
  }
  state = new State(coursesFromDisk);
  while (createCallbacks.length > 0) {
    createCallbacks[0]();
    createCallbacks.splice(0, 1);
  }
};

UI.diskLoadError = function(error){
  let scope = angular.element(document.querySelector('#classesContainer')).scope();
  if(error.message.indexOf('Internal error opening backing store') != -1){
    scope.dbReadError('dom');
  } else if(error == 'VersionError'){
    scope.dbReadError('version');
  } else if(error == 'blocked'){
    scope.dbReadError('blocked');
  } else{
    scope.dbReadError('unknown');
  }
};

UI.stateCreated = function () {
  return !!state;

};

UI.onStateCreate = function (callback) {
  if (!state)
    createCallbacks.push(callback);
  else {
    callback();
    createCallbacks.splice(0, 1);
  }
};

UI.save = function (course,callback) {
  let worker = new Worker('worker.js');
  worker.addEventListener("message",function(msg){
    if(callback){
      callback();
    }
  });
  worker.postMessage(angular.toJson(course)); //angular.toJson removes angular's variables in the objects
};

UI.getClasses = function () {
  if (!state)
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

UI.deleteClass = function (id,callback) {
  for (let i = 0; i < state.courseList.length; i++) {
    if (state.courseList[i].ID === id) {
      Database.deleteCourse(id,callback);

      state.courseList.splice(i, 1);
      return;
    }
  }
};


UI.getAllQuestionsForClass = function (classID) {
  let course = UI.getClassById(classID);
  let questions = [];
  for (let x = 0; x < course.topics.length; x++) {
    for (let y = 0; y < course.topics[x].questions.length; y++) {
      questions.push(course.topics[x].questions[y]);
    }
  }
  return questions;
};

UI.createClass = function (name, id, semester, year) {
  //Update Data Model
  let courseID = state.createCourse(name, id, year, semester);
  new CourseUtils(UI.getClassById(courseID)).createTopic('No Topic', 'This is the topic where questions will appear under if they were not assigned to a topic.');
  return courseID;
};

UI.printData = function () {
  console.log(state);
};

let toastQueue = [];
let currentToast = false;
var showToast = function (textContent, $mdToast,delay) {
  let hideDelay = 3 * 1000;
  if(delay > 0){
    hideDelay = delay * 1000;
  }
  if (!$mdToast) {
    console.error("showToast was called without a $mdToast variable");
    return;
  }
  toastQueue.push({
    call: $mdToast.simple().textContent(textContent).position("bottom right").hideDelay(hideDelay),
    mdToast: $mdToast
  });
  if (!currentToast)
    processToastQueue();
};
function processToastQueue() {
  currentToast = toastQueue.length > 0;

  for (let x = 0; x < toastQueue.length; x++) {
    toastQueue[x].mdToast.show(toastQueue[x].call);
    toastQueue.splice(0, 1);
    setInterval(function () {
      processToastQueue();
    }, 3000);
    return;
  }
}

//If a string is too long will append ...
var strLimit = function (str) {
  let limit = 30; //limit in characters
  if (str.length > limit) {
    return str.substring(0, limit).trim() + "…";
  }
  return str;
};

UI.stressTest = function () {
  let n = 50;
  for (let i = 0; i < n; i++) {
    UI.createClass("Dummy Class", "DUM " + (100 + i), "Fall", (2015 + i));
    for (let z = 0; z < n * 2; z++) { //100
      new CourseUtils(UI.getClasses()[i]).createTopic('Dummy Topic ' + (z + 1), 'A Topic created for the purposes of testing.');
      new CourseUtils(UI.getClasses()[i]).createObjective('Test Objective ' + (z + 1));
      for (let x = 0; x < 100; x++) { //5k
        new TopicUtils(UI.getClasses()[i].topics[z]).createQuestion('Dummy Question ' + (x + 1), 'A Question for the purposes of testing.');
        new QuestionUtils(UI.getClasses()[i].topics[z].questions[x]).createAnswer('True', false,false);
        new QuestionUtils(UI.getClasses()[i].topics[z].questions[x]).createAnswer('False', true,false);
      }
    }
    UI.save(UI.getClasses()[i]);
  }
  UI.save(UI.getClasses()[0]);
};

//Called when the window is closed, will wait to close process until this function is done executing
UI.onClose = function(callback){
  saveJSON(dir.userData()+'/dbBackup.json',callback);
};


UI.exportJson = function(){
  const dialog = require('electron').remote.dialog;
  let path = dialog.showSaveDialog({
    title: 'Save Entire Database',
    properties: ['createDirectory'],
    filters: [{name: 'JSON', extensions: ['json']}]
  });
  saveJSON(path);
};

UI.importJson = function(){
  const dialog = require('electron').remote.dialog;
  let buttons = ['No','Yes, Overwrite all existing data'];
  dialog.showMessageBox({type: "question", buttons: buttons, title: "Are you sure you would like to import a database?",
    message: "Importing a database will overwrite all existing data! Continue?"}, function(response){
    if(response === 1){ //Import Database
      let json = '';

      let selectedFile = dialog.showOpenDialog({
        title: 'Import Entire Database',
        properties: ['openFile'],
        filters: [{name: 'JSON', extensions: ['json']}]
      });

      let toast = angular.element(document.querySelector('#container')).scope().$mdToast;

      if(selectedFile && selectedFile[0]) {
        showToast("Importing Database...",toast,10);
        fs.readFile(selectedFile[0],'utf8', function(err,data){
          if(err){
            showToast('Import Aborted. Error reading file: '+selectedFile[0],toast,5);
            console.error('Error reading file "'+selectedFile[0]+'"\n'+err);
          } else{
            json=data;
            if(!json || !json.trim()){
              showToast("Import Aborted, selected file is empty.",toast);
              return;
            }

            let parsedJSON = JSON.parse(json);
            if(parsedJSON.courseList === undefined || parsedJSON.courseUID === undefined){
              let title = require('../package.json').name;
              showToast("Import Aborted, "+title+" structure not found. File is either corrupt or not from "+title,toast,5);
              return;
            }
            openJSON(parsedJSON);
          }
        });
      }
    }
  });
};

UI.freeze = function(){
  let x=0;
  while(true)
    x+=1;
};

function saveJSON(location){
  let md5 = require('md5');
  let json = toJSON();

  if(location){
    let err = fs.writeFileSync(location,json);
    let scope = angular.element(document.querySelector('#container')).scope();
    if(err){
      showToast('Error saving Database.',scope.$mdToast);
      console.error('Error saving Database "'+saveDirectory+'"\n'+err);
    } else{
      let data = fs.readFileSync(location,'utf8');
      if(err){
        showToast("Error verifying saved Database.",scope.$mdToast);
        if(callback)
          callback();
        return;
      }

      if(md5(data) === md5(json)) {
        showToast("Database Saved to '" + location + "'", scope.$mdToast);
      } else{
        showToast("Database Saved in Invalid State!! (Checksum of saved file did not match original)",scope.$mdToast,10);
      }
    }
  }
}

function openJSON(parsedJSON){
  Database.deleteDatabase(function(){
    Database.loadDatabase(function(){
      state = new State(parsedJSON.courseList);
      let count = 0;
      let callbacks = 0;
      for(let course of state.courseList){
        UI.save(course,function(){
          callbacks++;
          if(callbacks === count){
            document.location.reload();
          }
        });
        count++;
      }
    });
  });
}

function toJSON(){
  return angular.toJson(state);
}


if (Array.prototype.equals)
  console.warn("Overriding existing Array.prototype.equals. Possible causes: New API defines the method, there's a framework conflict or you've got double inclusions in your code.");
// attach the .equals method to Array's prototype to call it on any array
Array.prototype.equals = function (array) {
  // if the other array is a falsy value, return
  if (!array)
    return false;

  // compare lengths - can save a lot of time
  if (this.length != array.length)
    return false;

  for (var i = 0, l = this.length; i < l; i++) {
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

//Create save backup dir on startup
makeDir(dir.userData(),function(err){
  if(err){
    console.error('Error creating directory for backup file\n'+err);
  }
});