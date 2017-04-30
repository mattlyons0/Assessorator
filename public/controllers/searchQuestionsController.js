"use strict";

app.controller("searchQuestionsCtrl", function ($scope) {
  $scope.init = function(){
    $scope.tabData = $scope.getTabByID($scope.tabID).data;
    $scope.tabName = $scope.getTabByID($scope.tabID).name;
    
    $scope.selected = $scope.getTabByID($scope.tabData.callbackTID).data.searchQuestions.questions;
  };

  $scope.requestFocus = function(){
    $scope.init(); //Call once variables have been set through ng-init
  };
  $scope.cleanup = function(){
    $scope.$parent.closeTab($scope.tabID);
  };
  $scope.submit = function(){
    $scope.getTabByID($scope.tabData.callbackTID).data.searchQuestions.questions = $scope.selected;
    $scope.getTabByID($scope.tabData.callbackTID).data.searchQuestions.complete = true; //Trigger assessments tab to search for changed
    $scope.cleanup();
  };
  $scope.discard = function(){
    $scope.getTabByID($scope.tabData.callbackTID).data.searchQuestions.complete = false; //Trigger wipe of selected field
    $scope.cleanup();
  };

  $scope.editQuestionHeader = [
    ['Edit Question', function($itemScope,$event){
      $scope.editQuestion($itemScope.question.UID);
    }]
  ];
});
