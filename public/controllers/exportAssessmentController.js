"use strict";

app.controller("exportAssessmentCtrl", function ($scope) {
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
        let randomNum = Math.floor(Math.random()*max); //Random number 0-(max-1)
        if(randoms.has(randomNum)){
          i--;
        } else {
          randoms.add(randomNum);
        }
      }

      let randomArr = Array.from(randoms);
      for(let rand of randomArr){
        questions.push(possibleQuestionArray[rand]);
      }
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
    for(let answer of question.answers){
      answerStrings.push("("+(answer.correct?"x":" ")+") "+answer.answerText+"\n");
    }
    while(answerStrings.length>0){
      let random = Math.floor(Math.random()*answerStrings.length);
      out+=answerStrings[random];
      answerStrings.splice(random,1);
    }
    if(question.questionDescription){
      out+="[explanation]\n"+question.questionDescription+"\n[explanation]\n";
    }

    return out;
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