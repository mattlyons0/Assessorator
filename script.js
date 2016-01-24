"use strict";

var UI = {};
var State = require('./data/State');
var state = new State();


UI.createClass = function () {
  //Update Data Model
  let courseID = state.createCourse();
  //Update UI
  var classList = document.getElementById("classList");
  var classInput = document.createElement("input");
  classInput.id = "class" + courseID;
  var appendLocation = classList.children[classList.children.length - 1];
  appendLocation.appendChild(classInput);
};
UI.createAssessment = function () {

};
UI.createQuestion = function () {

};
UI.printData = function () {
  console.log(state);
};