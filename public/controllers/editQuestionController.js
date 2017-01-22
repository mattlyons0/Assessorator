'use strict';

let ObjectiveUtils = require('../data/utils/ObjectiveUtils');

app.controller('editQuestionCtrl', function ($scope, $mdDialog) {
  function init(){
    $scope.callback = $scope.tabData.callback;

    if ($scope.tabData.questionID != undefined && $scope.tabData.topicID != undefined) {
      let topic = new CourseUtils($scope.class).getTopic($scope.tabData.topicID);
      let question = new TopicUtils(topic).getQuestion($scope.tabData.questionID);

      $scope.edit = true;

      $scope.question.title=question.questionTitle;
      $scope.question.description=question.questionDescription;
      $scope.topic.selected = [topic];
      if(topic.ID == 0){ //Ignore the 'No Topic' Topic
        $scope.topic.selected = [];
      }
      $scope.objective.selected = [];
      for(let objective of question.objectives){
        $scope.objective.selected.push(objective);
      }
      let selectedIndex;
      if(question.answers[0] && question.answers[0].answerText == 'True' && question.answers[1].answerText == 'False') {
        $scope.question.type = 'TF';
        for(let i=0;i<question.answers.length;i++){
          let ans = question.answers[i];
          if(ans.correct) {
            $scope.question.correctAnswer = i;
            $scope.setCorrect=ans.answerText;
            break;
          }
        }
      }
      else{
        let selected = 0;
        for(let i=0;i<question.answers.length;i++){
          let ans = question.answers[i];
          if(ans.correct) {
            selected++;
            selectedIndex = i;
          }
        }
        if(selected <= 1)
          $scope.question.type = 'MC';
        else {
          $scope.question.type = 'MA';
          $scope.ignoreNextDataValidate = true;
        }

        $scope.question.answers = [];
        for(let ans of question.answers){
          $scope.question.answers.push({
            text: ans.answerText,
            correct: ans.correct,
            pinned: ans.pinned
          });
        }
        if(selected <= 1) {
          $scope.question.correctAnswer = selectedIndex;
        }
      }
    }

  }

  $scope.question = {};
  $scope.question.answers = [];
  $scope.question.answers.push({
    text: '',
    correct: false,
    pinned: false
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
    if(!query) {
      array = $scope.class.topics.slice(0);
      array.splice(0,1); //Remove first topic, 'No Topic'
    } else {
      for (let topic of $scope.class.topics) {
        if (topic.topicName.toLowerCase().indexOf(query.toLowerCase()) > -1 && topic.ID != 0) //Check if its in the search and it isn't the No Topic
          array.push(topic);
      }
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

  $scope.togglePin = function(answer){
    answer.pinned=!answer.pinned;
  };

  $scope.submitQuestion = function () {
    if (!$scope.question.title)
      return;
    if($scope.topic.selected.length > 1){
      document.querySelector('#topicChooserInput').focus();
      showToast('Only One Topic may be selected', {level: 'danger'});
    }
    if ($scope.question.answers.length > 1){
      let correct = false;
      for(let x=0;x<$scope.question.answers.length - 1;x++){ //Last one is always ghost answer
        if(!$scope.question.answers[x].text){
          showToast('An Answer cannot be empty', {level: 'danger'});
          document.querySelector('#questionAnswer'+x).focus();
          return;
        }
        if($scope.question.answers[x].correct)
          correct=true;
      }
      if(!correct){
        showToast('A Question must have a correct answer', {level: 'danger'});
        return;
      }
    }

    let topic = $scope.topic.selected[0];
    if(!$scope.topic.selected.length)
      topic = $scope.class.topics[0]; //The 'No Topic' Topic
    let oldTopic = undefined;
    if($scope.edit)
      oldTopic = new CourseUtils($scope.class).getTopic($scope.tabData.topicID);
    let ignoreEdit = false;
    if (oldTopic && oldTopic.ID !== topic.ID) //Move topics
      ignoreEdit = true;

    if(!$scope.edit || ignoreEdit) {
      let topicUtil = new TopicUtils(topic);
      topicUtil.createQuestion($scope.question.title, $scope.question.description);
      let question = topic.questions[topic.questions.length - 1];
      let questionUtil = new QuestionUtils(question);
      for (let objective of $scope.objective.selected) {
        questionUtil.addObjective(objective);
      }
      for (let x = 0; x < $scope.question.answers.length - 1; x++) { //Omit ghost answer
        questionUtil.createAnswer($scope.question.answers[x].text, $scope.question.answers[x].correct, $scope.question.answers[x].pinned);
      }
      if(ignoreEdit) { //If we are moving topics, preserve creation date & selection data
        let oldQuestion = new TopicUtils(oldTopic).getQuestion($scope.tabData.questionID);
        //Preserve creation date
        question.creationDate = oldQuestion.creationDate
        //Duplicate selection data
        let newJSON = UI.UIDtoJson(question.UID);
        let oldJSON = UI.UIDtoJson(oldQuestion.UID);
        console.log(oldJSON);
        UI.miscState.classView.questions.checked[newJSON] = UI.miscState.classView.questions.checked[oldJSON];
        UI.miscState.classView.questions.open[newJSON] = UI.miscState.classView.questions.open[oldJSON];
      }
    } else{ //Edit Topic
      let oldTopicUtil = new TopicUtils(oldTopic);
      let question = oldTopicUtil.getQuestion($scope.tabData.questionID);
      question.questionTitle = $scope.question.title;
      question.questionDescription = $scope.question.description;

      let questionUtil = new QuestionUtils(question);
      for(let objective of question.objectives){
        new ObjectiveUtils(objective).removeQuestionUID(question.UID);
      }
      question.objectives=[];
      for (let objective of $scope.objective.selected) {
        questionUtil.addObjective(objective);
      }
      for(let i=0;i < $scope.question.answers.length -1; i++){
        let len = question.answers.length;
        if(i<len){
          question.answers[i].answerText = $scope.question.answers[i].text;
          question.answers[i].correct = $scope.question.answers[i].correct;
          question.answers[i].pinned = $scope.question.answers[i].pinned;
        } else{
          new QuestionUtils(question).createAnswer($scope.question.answers[i].text, $scope.question.answers[i].correct, $scope.question.answers[i].pinned);
        }
      }
    }
    if(oldTopic && oldTopic.ID !== topic.ID){ //Move topics
      new TopicUtils(oldTopic).deleteQuestion($scope.tabData.questionID);
    }

    UI.save($scope.class);

    $scope.cleanup();
  };

  $scope.cleanup = function () { //I don't know if these are automatically GC'd or not so I remove them anyway.
    $scope.stopWatching();
    $scope.stopWatching2();
    $scope.stopWatching3();
    $scope.stopWatching4();
    $scope.stopWatching5();
    $scope.$parent.closeTab($scope.tabID);

    if($scope.callback)
      $scope.callback();
  };

  $scope.requestFocus = function () {
    setTimeout(function () {
      document.getElementById('questionTitle' + $scope.tabID).focus();
    }, 500); //Delay until animation starts
    init();
  };

  let tab;

  $scope.stopWatching = $scope.$watch('question.title', function () { //Edit Tab Title
    if (!$scope.question.title)
      return;
    if (!tab)
      tab = $scope.$parent.getTabByID($scope.tabID);
    tab.name = strLimit('Question: ' + $scope.question.title);
  });

  $scope.stopWatching2 = $scope.$watch('question.correctAnswer', function () { //Selector Answer Data Structure Update
    if($scope.ignoreNextDataValidate) {
      $scope.ignoreNextDataValidate = false;
      return;
    }
    for (let x = 0; x < $scope.question.answers.length; x++) {
      if (x === $scope.question.correctAnswer)
        $scope.question.answers[x].correct = true;
      else
        $scope.question.answers[x].correct = false;
    }
  });

  $scope.stopWatching3 = $scope.$watch('question.answers[question.answers.length-1].text', function () { //Create Ghost Answer
    if (!$scope.question.answers.length || $scope.question.answers[$scope.question.answers.length - 1].text) {
      $scope.question.answers.push({
        text: '',
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
          text: 'True',
          correct: false,
          pinned: false
        });
        $scope.question.answers.push({
          text: 'False',
          correct: false,
          pinned: false
        });
        if($scope.setCorrect == 'True')
          $scope.question.answers[0].correct=true;
        else if($scope.setCorrect == 'False')
          $scope.question.answers[1].correct=true;
        $scope.setCorrect = undefined;
      };

      if (dataExists) {
        let confirm = $mdDialog.confirm().title('Are you sure you would like to override previous answers?')
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

});