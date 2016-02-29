"use strict";

app.controller("searchQuestionsCtrl", function ($scope) {
  $scope.init = function(){
    $scope.tabData = $scope.getTabByID($scope.tabID).data;
    $scope.tabName = $scope.getTabByID($scope.tabID).name;

    $scope.search = {};
    $scope.search.title = true;
    $scope.search.results = [];
  };

  $scope.query = function(){
    if(!$scope.search.query)
      return [];

    let questions = new Set(); //Doesn't allow duplicates

    for(let topic of $scope.class.topics){
      for(let question of topic.questions){
        if($scope.search.title){
          if(($scope.search.caseSensitive && question.questionTitle.includes($scope.search.query)) ||
            (!$scope.search.caseSensitive && question.questionTitle.toLowerCase().includes($scope.search.query.toLowerCase()))){
            questions.add(question);
          }
        }
        if($scope.search.description){
          if(($scope.search.caseSensitive && question.questionDescription && question.questionDescription.includes($scope.search.query)) ||
            (!$scope.search.caseSensitive && question.questionDescription && question.questionDescription.toLowerCase().includes($scope.search.query.toLowerCase()))){
            questions.add(question);
          }
        }
        if($scope.search.answers){
          for(let answer of question.answers){
            if(($scope.search.caseSensitive && answer.answerText.includes($scope.search.query)) ||
              (!$scope.search.caseSensitive && answer.answerText.toLowerCase().includes($scope.search.query.toLowerCase()))){
              questions.add(question);
              break; //No need to search other answers in this question
            }
          }
        }
      }
    }
    let arr = Array.from(questions);
    $scope.search.results = arr;
    return arr; //Convert set into array
  };


  $scope.requestFocus = function(){
    $scope.init(); //Call once variables have been set through ng-init
  };
  $scope.cleanup = function(){
    $scope.$parent.closeTab($scope.tabID);
  };
  $scope.submit = function(){
    $scope.getTabByID($scope.tabData.callbackTID).data.searchQuestions.complete = true; //Trigger assessments tab to search for changed
    $scope.cleanup();
  };
  $scope.discard = function(){
    $scope.getTabByID($scope.tabData.callbackTID).data.searchQuestions.complete = false; //Trigger wipe of selected field
    $scope.cleanup();
  };
});