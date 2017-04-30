"use strict";

app.controller("importQuestionsCtrl", function ($scope, $uibModal) {
  let fs = require('fs');

  let tab;
  $scope.input = [];

  $scope.topic = {};
  $scope.topic.selected = $scope.class.topics[0];
  $scope.objective = {};
  $scope.objective.selected = [];

  $scope.import = function () {
    if (!$scope.input.data) {
      showToast('No text entered', {level: 'danger'});
      return;
    }
    let topic = $scope.topic.selected; //Topic object
    if (topic === undefined)
      topic = $scope.class.topics[0]; //The 'No Topic' Topic
    let objectives = $scope.objective.selected; //Array of Objective Objects

    let questions = $scope.parseEdX($scope.input.data);
    if (!questions.length) {
      return;
    }

    for (let question of questions) {
      let topicUtil = new TopicUtils(topic);
      let qID = topicUtil.createQuestion(question.title, question.description);
      let q = topicUtil.getQuestion(qID);
      for (let objective of objectives) {
        q.objectives.push(objective);

      }
      let questionUtil = new QuestionUtils(q);
      for (let answer of question.answers) {
        questionUtil.createAnswer(answer.answerText, answer.correct, answer.pinned);
      }
    }

    UI.save($scope.class);
    $scope.cleanup();
  };

  $scope.parseEdX = function (input) {
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
      } else if (line.indexOf("(") != -1 && line.indexOf(")") != -1) { //Check if Answer ( )
        let openIndex = line.indexOf("(");
        let closeIndex = line.indexOf(")");
        let chosen = line.substring(openIndex + 1, closeIndex);
        let correctAnswer = false;
        let pinnedAnswer = false;
        if (chosen.trim().toLowerCase().indexOf("x") != -1) //Check if correct answer
          correctAnswer = true;
        if (chosen.trim().toLowerCase().indexOf("@") != -1) //Check if pinned answer
          pinnedAnswer = true;
        let answer = line.substring(closeIndex + 1).trim();
        if (!currentQuestion.answers) {
          earlyAnswerError = true;
        } else {
          currentQuestion.answers.push({
            answerText: answer,
            correct: correctAnswer,
            pinned: pinnedAnswer
          });
        }
      }
    }
    if (currentQuestion.title) { //Add previous question
      questions.push(currentQuestion);
    }

    if (!questions.length) {
      showToast('No questions found' , {level: 'danger'});
      return [];
    }
    if (earlyAnswerError) {
      showToast('Found answer before question! This could indicate incomplete or invalid parsing', {level: 'danger', delay: 10});
    }
    let answerLess = [];
    let questionsWithAnswersCount = 0;
    for (let question of questions) {
      if (question.answers.length < 2)
        answerLess.push(question);
      for (let answer of question.answers) {
        if (answer.correct === true) {
          questionsWithAnswersCount++;
          break;
        }
      }
    }
    let answerlessCount = questions.length - questionsWithAnswersCount;
    if(answerlessCount > 0)
      showToast(answerlessCount + ' question'+(answerlessCount!==1?'s':'')+' imported do'+(answerlessCount!==1?'':'es')+' not have a correct answer.', {level: 'warning', delay: 10});
    if (answerLess.length > 0) {
      showToast('Imported ' + answerLess.length + ' question' + (answerLess.length !== 1 ? 's' : '') +
        ' with less than 2 answers',{level: 'warning', delay:10});
    }

    return questions;
  };

  $scope.cleanup = function () {
    if($scope.tabData.callback){
      $scope.tabData.callback();
    }
    $scope.$parent.closeTab($scope.tabID);
  };

  $scope.showHelp = function () {
    let helpMarkup = '<div ng-controller="settingsCtrl" class="list-group flex" style="margin-bottom:0">' +
      '<div class="list-group-item active"><h2 style="margin-top:10px">Import Help</h2></div><li class="list-group-item form-check form-check-inline">';
    let helpText = "The import format accepted is edX format. <br/><br/>The following notation is accepted:<br/><ul>" +
      "<li><b>&gt;&gt;</b> must precede question title and <b>&lt;&lt;</b> must come at the end of the question title.</li>" +
      "<li><b>( )</b> must precede any answer. It can contain data however all data will be ignored except a capital or lowercase <b>x</b>, denoting a correct answer.</li>" +
      "<li><b>[explanation]</b> can be used to denote the description of a question. The <b>[explanation]</b> tag must be on its own line and be followed with a closing <b>[explanation]</b> tag once the explanation is over.<li/>" +
      "</ul>Note: Each of the above notations is limited to a length of one line (with the exception of the explanation), and must not contain more than one notation per line." +
      '</li>';
    let helpFooter = '<div style="padding: 5px; text-align:right">'+
      '<button type="button" style="margin-right:2px" class="btn btn-default" ng-click="$dismiss()">Close</button>'+
      '</div>';

      let helpModal = $uibModal.open({
        template: helpMarkup+helpText+helpFooter,
        size: 'lg'
      });
    };

  $scope.browseFile = function () {
    const dialog = require('electron').remote.dialog;
    let selectedFiles = dialog.showOpenDialog({
      title: 'Import edX Questions',
      properties: ['openFile', 'multiSelections'],
      filters: [{name: 'All Files', extensions: ['*']}, {name: 'Text Files', extensions: ['txt']}]
    }, (filenames)=>{
      if(filenames) {
        for (let selectedFile of filenames) {
          fs.readFile(selectedFile,'utf8', function(err,data){
            if(err){
              showToast('Error reading file: '+selectedFile, {level: 'danger'});
              console.log(err);
            } else{
              $scope.input.data+=data;
              $scope.$apply();
            }

          });
        }
        setTimeout(() => {
          let textArea = document.getElementById("importArea" + $scope.tabID);
          textArea.dispatchEvent(new Event('input', {bubbles: true, cancelable: false }));
        }, 1); //Let DOM Update
      }
    });
  };

  $scope.requestFocus = function () {
    setTimeout(function () {
      try{
        document.getElementById("importArea" + $scope.tabID).focus();
        $scope.resizeTextArea(document.getElementById("importArea" + $scope.tabID));
      } catch(ex) {
        console.warn('Failed to do requestFocus',ex);
      }
    }, 1); //Delay until render finishes
  };
});