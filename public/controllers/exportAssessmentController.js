"use strict";

app.controller("exportAssessmentCtrl", function ($scope,$mdToast) {
  let fs = require('fs');

  $scope.assessment = {};
  $scope.assessment.selected = [];

  $scope.output = {};
  $scope.output.data = "";

  $scope.searchQueryAssessment = function () {
    return $scope.assessment.searchQuery;
  };
  $scope.searchAssessments = function () {
    let array = [];
    let query = $scope.assessment.searchQuery;
    if (!query) {
      array = $scope.class.assessments.slice(0); //Copy Array
    } else {
      for (let assessment of $scope.class.assessments) {
        if (assessment.assessmentName.toLowerCase().indexOf(query.toLowerCase()) > -1) //Check if its in the search
          array.push($scope.class.assessments[x]);
      }
    }
    return array;
  };
  $scope.transformChipAssessment = function (chip) {
    if ($scope.assessment.selected.length > 0) {
      $scope.assessment.selected.splice(0, 1); //remove first topic
    }

    $scope.exportAssessment(chip);

    return chip;
  };

  $scope.exportAssessment = function(assessment){
    let questions = [];
    for(let question of assessment.questions){
      questions.push(question);
    }

    let incompleteRules = [];
    for(let rule of assessment.rules){
      let possibleQuestions = new Set();
      for(let topic of rule.topics){
        for(let question of topic.questions){
          possibleQuestions.add(question);
        }
      }
      for(let topic of $scope.class.topics){
        for(let question of topic.questions){
          for(let objective of question.objectives){
            for(let ruleObjective of rule.objectives){
              if(objective.ID == ruleObjective.ID){
                possibleQuestions.add(question);
              }
            }
          }
        }
      }

      let possibleQuestionArray = Array.from(possibleQuestions);
      let randoms = new Set();
      for(let i=0;i<rule.numRequired;i++){
        let max = possibleQuestionArray.length;

        if(max===0) {
          incompleteRules.push(rule);
          break;
        }

        let randomNum = Math.floor(Math.random()*max); //Random number 0-(max-1)
        questions.push(possibleQuestionArray[randomNum]);
        possibleQuestionArray.splice(randomNum,1);
      }

      let randomArr = Array.from(randoms);
      for(let rand of randomArr){
        questions.push(possibleQuestionArray[rand]);
      }
    }

    if(incompleteRules.length > 0){
      showToast(incompleteRules.length+" rule"+(incompleteRules.length>1?'s':'')+" could not be satisfied for this assessment. " +
        "The assessment generated is incomplete.",$mdToast,7);
    }

    let out = "";
    while(questions.length != 0){
      out+=$scope.toEDX(questions.splice(Math.floor(Math.random()*questions.length),1)[0]);
      //Add a random question to the output (removing afterwards to ensure no duplicates)
    }
    $scope.output.data=out;
  };

  $scope.toEDX = function(question){
    let out = "";
    out+=">>"+question.questionTitle+"<<\n";
    let answerStrings = [];
    for(let i=0;i<question.answers.length;i++){
      let answer = question.answers[i];
      let innerParenthesis = '';
      if(i===0) //Randomize every question in edX
        innerParenthesis+='!';
      if(answer.correct === true) //Select correct question
        innerParenthesis+='x';
      if(answer.pinned === true)
        innerParenthesis+='@';

      answerStrings.push("("+innerParenthesis+") "+answer.answerText+"\n");
      out+=answerStrings[i];
    }

    if(question.questionDescription){
      out+="[explanation]\n"+question.questionDescription+"\n[explanation]\n";
    }

    out+="\n"; //Newline after each question for visibility

    return out;
  };

  $scope.saveToFile = function(){
    if(!$scope.output.data || !$scope.output.data.trim()){
      showToast('An assessment must be generated to be able to save it.',$mdToast);
      return;
    }

    const dialog = require('electron').remote.dialog;
    let saveDirectory = dialog.showSaveDialog({
      title: 'Save edX Assessment',
      properties: ['createDirectory'],
      filters: [{name: 'Text File', extensions: ['txt']}, {name: 'All Files', extensions: ['*']}]
    });

    if(saveDirectory){
      fs.writeFile(saveDirectory,$scope.output.data, function(err){
        if(err){
          showToast('Error saving file.',$mdToast);
          console.error('Error saving file "'+saveDirectory+'"\n'+err);
        } else{
          showToast("File Saved to '"+saveDirectory+"'",$mdToast);
          // require('electron').shell.showItemInFolder(saveDirectory);
        }
      });
    }
  };

  $scope.cleanup = function () {
    $scope.stopWatching();
    $scope.$parent.closeTab($scope.tabID);
  };

  $scope.stopWatching=$scope.$watch('assessment.selected.length', function(){
    if($scope.assessment.selected.length == 0){
      $scope.output.data = "";
    }
  });

});