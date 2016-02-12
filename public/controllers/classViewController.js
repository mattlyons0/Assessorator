"use strict";
app.controller("classViewCtrl", function ($scope,$timeout) {
  $scope.class = UI.getClassById($scope.$parent.page.classID);
  $scope.tabs = [];
  let nextID = 0;

  $scope.createTopic = function(){
    createTab("New Topic","views/editTopic.html","editTopicCtrl");

    //Remove popup from new question topic chooser UI
    if(document.querySelector("#topicChooserInput")) {
      $timeout(function () { //Delay until after current $apply
        document.querySelector("#topicChooserInput").blur();
        angular.element(document.querySelector('md-virtual-repeat-container')).triggerHandler('mouseleave');
      }, 50); //Less than this seems to screw with the animation
    }
  };
  $scope.createQuestion = function(){
    createTab("New Question", "views/editQuestion.html","editQuestionCtrl");
  };
  $scope.createObjective = function(){
    createTab("New Objective","views/editObjective.html","editObjectiveCtrl");

    //Remove popup from new question topic chooser UI
    if(document.querySelector("#objectiveChooserInput")) {
      $timeout(function () { //Delay until after current $apply
        document.querySelector("#objectiveChooserInput").blur();
        angular.element(document.querySelectorAll('md-virtual-repeat-container')[1]).triggerHandler('mouseleave');
      }, 50); //Less than this seems to screw with the animation
    }
  };

  $scope.getAllQuestions = function(){
    return UI.getAllQuestionsForClass($scope.class.ID);
  };

  $scope.goBack = function () {
    $scope.$parent.page.classID = undefined;
    $scope.$parent.page.URL = 'classes.html';
  };

  $scope.closeTab = function(tabID){
    for(let x=0;x<$scope.tabs.length;x++){
      if($scope.tabs[x].id === tabID){
        $scope.tabs.splice(x,1);
      }
    }
  };

  $scope.getTabByID = function(tabID){
    for(let x=0;x<$scope.tabs.length;x++){
      if($scope.tabs[x].id === tabID){
        return $scope.tabs[x];
      }
    }
    console.error('No tab found with ID: '+tabID);
  };

  function createTab(tabName,contentURL,ctrl){
    let tab = {
      id: nextID,
      name: tabName,
      URL: contentURL,
      controller: ctrl
    };
    nextID++;
    $scope.tabs.push(tab);
  }
});