"use strict";

app.controller("importQuestionsCtrl", function ($scope, $mdDialog, $mdToast) {
  let tab;
  $scope.input = [];

  $scope.topic = {};
  $scope.topic.selected = [];
  $scope.objective = {};
  $scope.objective.selected = [];

  $scope.searchQueryTopic = function () {
    return $scope.topic.searchQuery;
  };
  $scope.searchTopics = function () {
    let array = [];
    let query = $scope.topic.searchQuery;
    if (!query) {
      array = $scope.class.topics.slice(0);
      array.splice(0, 1); //Remove first topic, 'No Topic'
    } else {
      for (let topic of $scope.class.topics) {
        if (topic.topicName.toLowerCase().indexOf(query.toLowerCase()) > -1 && topic.ID != 0) //Check if its in the search and it isn't the No Topic
          array.push($scope.class.topics[x]);
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

  $scope.searchQueryObjective = function () {
    return $scope.objective.searchQuery;
  };
  $scope.searchObjectives = function () {
    let array = [];
    let query = $scope.objective.searchQuery;
    if (!query)
      return $scope.class.objectives;
    for (let x = 0; x < $scope.class.objectives.length; x++) {
      if ($scope.class.objectives[x].objectiveText.toLowerCase().indexOf(query.toLowerCase()) > -1)
        array.push($scope.class.objectives[x]);
    }
    return array;
  };

  $scope.import = function () {
    if (!$scope.input.data) {
      showToast('No text entered.', $mdToast);
      return;
    }
    let topic = $scope.topic.selected[0]; //Topic object
    if(topic == undefined)
      topic = $scope.class.topics[0]; //The 'No Topic' Topic
    let objectives = $scope.objective.selected; //Array of Objective Objects

    let questions = $scope.parseInput($scope.input.data);
    if(!questions.length){
      return;
    }

    for(let question of questions) {
      let topicUtil = new TopicUtils(topic);
      let qID = topicUtil.createQuestion(question.title,question.description);
      let q = topicUtil.getQuestion(qID);
      for(let objective of objectives) {
        q.objectives.push(objective);

      }
      let questionUtil = new QuestionUtils(q);
      for(let answer of question.answers){
        questionUtil.createAnswer(answer.answerText,answer.correct);
      }
    }

    UI.save($scope.class);
    $scope.cleanup();
  };

  $scope.parseInput = function (input) {
    let earlyAnswerError = false;

    let questions = [];
    let currentQuestion = {};
    let lines = input.split('\n');
    let foundDescription = false;
    let inDescription = false;
    for (let line of lines) {
      if (!foundDescription && !inDescription && line.toLowerCase().indexOf("[explanation]") != -1) { //Explanation start
        foundDescription = true;
        inDescription = true;
      } else if (foundDescription && inDescription && line.toLowerCase().indexOf("[explanation]") != -1) { //Explanation end
        inDescription = false;
      } else if (inDescription) { //In explanation
        currentQuestion.description += line;
      } else if (line.indexOf(">>") != -1 && line.indexOf("<<") != -1) { //Question Title
        if (currentQuestion.title) { //Add previous question
          questions.push(currentQuestion);
        }
        currentQuestion = { //Reset Current Question
          title: "",
          answers: [],
          description: ""
        };

        let openQuestionIndex = line.indexOf(">>");
        let closeQuestionIndex = line.lastIndexOf("<<");
        line = line.substring(openQuestionIndex + 2, closeQuestionIndex);
        currentQuestion.title = line;
      } else if (line.indexOf("(") != -1 && line.indexOf(")") != -1) {
        let openIndex = line.indexOf("(");
        let closeIndex = line.indexOf(")");
        let chosen = line.substring(openIndex + 1, closeIndex);
        let correctAnswer = false;
        if (chosen.trim().toLowerCase().indexOf("x") != -1) {
          correctAnswer = true;
        }
        let answer = line.substring(closeIndex + 1).trim();
        if (!currentQuestion.answers) {
          earlyAnswerError = true;
        } else {
          currentQuestion.answers.push({
            answerText: answer,
            correct: correctAnswer
          });
        }
      }
    }
    if (currentQuestion.title) { //Add previous question
      questions.push(currentQuestion);
    }

    if (!questions.length) {
      showToast('No questions found.', $mdToast);
      return [];
    }
    if(earlyAnswerError){
      showToast('Found answer before question!',$mdToast);
    }
    let answerLess = [];
    for (let question of questions) {
      if (question.answers.length < 2)
        answerLess.push(question);
      let correct = false;
      for(let answer of question.answers){
        if(answer.correct == true){
          correct=true;
          break;
        }
      }
      if(correct == false){
        showToast('At least one question does not have a correct answer.',$mdToast);
        return [];
      }
    }
    if (answerLess.length > 0) {
      let confirm = $mdDialog.confirm().title('There '+(answerLess.length>1?'are':'is')+' ' + answerLess.length + ' question'+(answerLess.length>1?'s':'')+
        ' with less than 2 answers. Are you sure you would like to import?')
        .ok('Import').cancel('Cancel');
      $mdDialog.show(confirm).then(function () {
        return questions;
      }, function () {
        return [];
      });
    }

    return questions;
  };

  $scope.cleanup = function () {
    $scope.$parent.closeTab($scope.tabID);
  };

  $scope.showHelp = function (event) {
    let helpText = "The import format accepted is edX format. <br/><br/>The following notation is accepted:<br/><ul>" +
      "<li><b>&gt;&gt;</b> must precede question title and <b>&lt;&lt;</b> must come at the end of the question title.</li>" +
      "<li><b>( )</b> must precede any answer. It can contain data however all data will be ignored except a capital or lowercase <b>x</b>, denoting a correct answer.</li>" +
      "<li><b>[explanation]</b> can be used to denote the description of a question. The <b>[explanation]</b> tag must be on its own line and be followed with a closing <b>[explanation]</b> tag once the explanation is over.<li/>" +
      "</ul>Note: Each of the above notations is limited to a length of one line (with the exception of the explanation), and must not contain more than one notation per line." +
      "";

    $mdDialog.show($mdDialog.alert().closeTo(document.querySelector('#helpButton'))
      .parent(angular.element(document.body))
      .targetEvent(event)
      .clickOutsideToClose(true)
      .title('Import Syntax')
      .htmlContent(helpText)
      .ok('Close'));
  };

  $scope.requestFocus = function () {
    setTimeout(function () {
      document.getElementById("importArea" + $scope.tabID).focus();
    }, 200); //Delay until animation starts
  };
});