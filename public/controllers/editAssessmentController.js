"use strict";
app.controller("editAssessmentCtrl", function ($scope, $mdDialog, $mdToast) {
  $scope.assessment = {};
  $scope.questions = {};
  $scope.questions.manuallyAdded = new Set();

  $scope.submitAssessment = function () {
    if (!$scope.assessment.title)
      return;
    //TODO submission logic
    $scope.class.createAssessment($scope.assessment.title,$scope.assessment.description);
    $scope.cleanup();
  };

  $scope.cleanup = function () {
    $scope.stopWatching();
    $scope.$parent.closeTab($scope.tabID);
  };

  $scope.requestFocus = function () {
    setTimeout(function () {
      document.getElementById("assessmentTitle" + $scope.tabID).focus();
    }, 500); //Delay until animation starts
  };


  $scope.pickQuestion = function(){
    $scope.getTabByID($scope.tabID).data.searchQuestions = {};
    $scope.searchQuestions('Pick Questions',{type: 'pick', callbackTID: $scope.tabID});
    $scope.stopWatching2 = $scope.$watch('getTabByID(tabID).data.searchQuestions.complete', function(){
      if($scope.getTabByID($scope.tabID).data.searchQuestions.complete === true ||
        $scope.getTabByID($scope.tabID).data.searchQuestions.complete === false){ //Search for manual questions is complete
        $scope.stopWatching2();
        //Detect selected questions
        for(let topic of $scope.class.topics) {
          for (let question of topic.questions) {
            if(question.selected && $scope.getTabByID($scope.tabID).data.searchQuestions.complete === true) { //If its selected and we didn't discard data
              $scope.questions.manuallyAdded.add(question);
            }
            delete question.selected;
          }
        }
      }
    })
  };

  $scope.getQuestions = function(){
    //TODO also factor in rules
    return Array.from($scope.questions.manuallyAdded);
  };


  let tab;
  $scope.stopWatching = $scope.$watch('assessment.title', function () { //Edit Tab Title
    if (!$scope.assessment.title)
      return;
    if (!tab)
      tab = $scope.$parent.getTabByID($scope.tabID);
    tab.name = strLimit("Assessment: " + $scope.assessment.title);
  });
});