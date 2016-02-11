"use strict";
app.controller("editQuestionCtrl", function ($scope, $mdDialog) {
  $scope.question = {};
  $scope.question.answers = [];
  $scope.question.answers.push({
    text: "",
    correct: false
  });
  $scope.question.type = 'MC';

  $scope.useRadio = function () {
    return $scope.question.type === 'MC' || $scope.question.type === 'TF'
  };

  let tab;

  $scope.stopWatching = $scope.$watch('question.title', function () { //Once name is entered
    if (!$scope.question.title)
      return;
    if (!tab)
      tab = $scope.$parent.getTabByID($scope.tabID);
    tab.name = strLimit("Question: " + $scope.question.title);
  });

  $scope.submitQuestion = function () {
    if (!$scope.topic.name)
      return;
    $scope.$parent.class.
    $scope.cleanup();
  };

  $scope.cleanup = function(){
    $scope.stopWatching();
    $scope.stopWatching2();
    $scope.stopWatching3();
    $scope.stopWatching4();
    $scope.stopWatching5();
    $scope.$parent.closeTab($scope.tabID);
  };

  $scope.requestFocus = function () {
    setTimeout(function () {
      document.getElementById("questionTitle" + $scope.tabID).focus();
    }, 200); //Delay until animation starts
  };

  $scope.stopWatching2 = $scope.$watch('question.correctAnswer', function () {
    for (let x = 0; x < $scope.question.answers.length; x++) {
      if ($scope.question.answers[x].text === $scope.question.correctAnswer)
        $scope.question.answers[x].correct = true;
      else
        $scope.question.answers[x].correct = false;
    }
  });

  $scope.stopWatching3 = $scope.$watch('question.answers[question.answers.length-1].text', function () {
    // for(let x=0;x<$scope.question.answers.length;x++){
    //
    // }
    if ($scope.question.answers[$scope.question.answers.length - 1].text) {
      $scope.question.answers.push({
        text: "",
        correct: false
      });
    }
  });

  $scope.stopWatching4 = $scope.$watch('question.answers[question.answers.length-2].text', function () {
    let runCheck = function() {
      if ($scope.question.answers.length >= 2 && !$scope.question.answers[$scope.question.answers.length - 2].text) {
        $scope.question.answers.splice($scope.question.answers.length - 1, 1); //If there are 2 trailing blanks remove the last one
        runCheck(); //Recursively remove all other empy answers at the tail
      }
    };
    runCheck();
  });

  $scope.stopWatching5 = $scope.$watch('question.type', function(){
    if($scope.question.type === 'TF'){
      let dataExists = false;
      for(let x=0;x<$scope.question.answers.length;x++){
        if($scope.question.answers[x].text){
          dataExists=true;
          break;
        }
      }
      let replaceTrueFalse = function(){
        $scope.question.answers = [];
        $scope.question.answers.push({
          text: "True",
          correct: false
        });
        $scope.question.answers.push({
          text: "False",
          correct: false
        });
      };

      if(dataExists) {
        let confirm = $mdDialog.confirm().title("Are you sure you would like to override previous answers?")
          .textContent('Previous Answers will be replaced with True and False.').ok('OK').cancel('Cancel');
        $mdDialog.show(confirm).then(function(){ //Yes
          replaceTrueFalse();
        }, function(){ //No
          $scope.question.type = 'MC';
        })
      } else{
        replaceTrueFalse();
      }
    }
  });
});