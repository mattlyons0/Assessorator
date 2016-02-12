"use strict";
app.controller("editQuestionCtrl", function ($scope, $mdDialog, $mdToast) {
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

  $scope.topic = {};
  $scope.topic.selected = [];

  $scope.objective = {};
  $scope.objective.selected = [];

  $scope.searchQueryTopic = function(){
    return $scope.topic.searchQuery;
  };
  $scope.searchTopics = function () {
    let array = [];
    let query = $scope.topic.searchQuery;
    if(!query)
      return $scope.class.topics;
    for (let x = 0; x < $scope.class.topics.length; x++) {
      if ($scope.class.topics[x].topicName.toLowerCase().indexOf(query.toLowerCase()) > -1)
        array.push($scope.class.topics[x]);
    }
    return array;
  };
  $scope.transformChipTopic = function (chip) {
    if ($scope.topic.selected.length > 0) {
      $scope.topic.selected.splice(0, 1); //remove first topic
    }
    return chip;
  };

  $scope.searchQueryObjective = function(){
    return $scope.objective.searchQuery;
  };
  $scope.searchObjectives = function () {
    let array = [];
    let query = $scope.objective.searchQuery;
    if(!query)
      return $scope.class.objectives;
    for (let x = 0; x < $scope.class.objectives.length; x++) {
      if ($scope.class.objectives[x].objectiveText.toLowerCase().indexOf(query.toLowerCase()) > -1)
        array.push($scope.class.objectives[x]);
    }
    return array;
  };
  $scope.transformChipObjective = function (chip) {
    if (chip.objectiveText) {
      return chip.objectiveText;
    }
    return chip;
  };

  $scope.submitQuestion = function () {
    if (!$scope.question.title)
      return;
    if ($scope.topic.selected.length === 0) {
      document.querySelector("#topicChooserInput").focus();
      showToast('A Topic is Required.');
      return;
    }
    if($scope.topic.selected.length > 1){
      document.querySelector('#topicChooserInput').focus();
      showToast('Only One Topic may be selected.');
    }
    if ($scope.question.answers.length < 3){ //Counting ghost answer
      showToast('A Question must have at least two answers.');
      return;
    }
    if ($scope.question.answers.length > 1){
      let correct = false;
      for(let x=0;x<$scope.question.answers.length - 1;x++){ //Last one is always ghost answer
        if(!$scope.question.answers[x].text){
          showToast('An Answer cannot be empty.');
          document.querySelector('#questionAnswer'+x).focus();
          return;
        }
        if($scope.question.answers[x].correct)
          correct=true;
      }
      if(!correct){
        showToast('A Question must have a correct answer.');
        return;
      }
    }

    let topic = $scope.topic.selected[0];
    topic.createQuestion($scope.question.title,$scope.question.description);
    let question = topic.questions[topic.questions.length - 1];
    for(let x=0;x<$scope.question.answers.length -1;x++){ //Omit ghost answer
      question.createAnswer($scope.question.answers[x].text,$scope.question.answers[x].correct);
    }

    $scope.cleanup();
  };

  $scope.cleanup = function () { //I don't know if these are automatically GC'd or not so I remove them anyway.
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
    }, 500); //Delay until animation starts
  };

  let tab;

  $scope.stopWatching = $scope.$watch('question.title', function () { //Edit Tab Title
    if (!$scope.question.title)
      return;
    if (!tab)
      tab = $scope.$parent.getTabByID($scope.tabID);
    tab.name = strLimit("Question: " + $scope.question.title);
  });

  $scope.stopWatching2 = $scope.$watch('question.correctAnswer', function () { //Selector Answer Data Structure Update
    for (let x = 0; x < $scope.question.answers.length; x++) {
      if ($scope.question.answers[x].text === $scope.question.correctAnswer)
        $scope.question.answers[x].correct = true;
      else
        $scope.question.answers[x].correct = false;
    }
  });

  $scope.stopWatching3 = $scope.$watch('question.answers[question.answers.length-1].text', function () { //Create Ghost Answer
    if ($scope.question.answers[$scope.question.answers.length - 1].text) {
      $scope.question.answers.push({
        text: "",
        correct: false
      });
    }
  });

  $scope.stopWatching4 = $scope.$watch('question.answers[question.answers.length-2].text', function () { //Remove Multiple Ghost Answers
    let runCheck = function () {
      if ($scope.question.answers.length >= 2 && !$scope.question.answers[$scope.question.answers.length - 2].text) {
        $scope.question.answers.splice($scope.question.answers.length - 1, 1); //If there are 2 trailing blanks remove the last one
        runCheck(); //Recursively remove all other empy answers at the tail
      }
    };
    runCheck();
  });

  $scope.stopWatching5 = $scope.$watch('question.type', function () { //Preload True False Data
    if ($scope.question.type === 'TF') {
      let dataExists = false;
      for (let x = 0; x < $scope.question.answers.length; x++) {
        if ($scope.question.answers[x].text && ($scope.question.answers[x].text != 'True' && $scope.question.answers[x].text != 'False')) {
          dataExists = true;
          break;
        }
      }
      let replaceTrueFalse = function () {
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

      if (dataExists) {
        let confirm = $mdDialog.confirm().title("Are you sure you would like to override previous answers?")
          .textContent('Previous Answers will be replaced with True and False.').ok('OK').cancel('Cancel');
        $mdDialog.show(confirm).then(function () { //Yes
          replaceTrueFalse();
        }, function () { //No
          $scope.question.type = 'MC';
        })
      } else {
        replaceTrueFalse();
      }
    }
  });

  let toastQueue = [];
  let currentToast = false;
  function showToast(textContent){
    toastQueue.push($mdToast.simple().textContent(textContent).position("bottom right").hideDelay(3000));
    if(!currentToast)
      processToastQueue();
  }
  function processToastQueue(){
    currentToast = toastQueue.length > 0;

    for(let x=0;x<toastQueue.length;x++){
      $mdToast.show(toastQueue[x]);
      toastQueue.splice(0,1);
      setInterval(function(){
        processToastQueue();
      },3000);
      return;
    }
  }
});