"use strict";

app.controller("exportAssessmentCtrl", function ($scope,$sce) {
  let fs = require('fs');
  $scope.initial = { assessmentName: 'Choose an Assessment' };

  $scope.init = function() {
    $scope.tabData = $scope.getTabByID($scope.tabID).data;
    $scope.assessment = {};
    $scope.assessment.selected = $scope.initial;

    $scope.output = {};
    $scope.output.data = ""; //edX text file
    $scope.output.questions = []; //Question objects generated
    $scope.output.warnings = [];


    if (typeof $scope.tabData.assessmentID === 'number') {
      let courseUtil = new CourseUtils($scope.class);
      let assessment = courseUtil.getAssessment($scope.tabData.assessmentID);
      if (assessment) {
        $scope.assessment.selected = assessment;
      }
    }
  };

  $scope.exportAssessment = function(assessment){
    $scope.output.questions = []; //Clear generated questions
    $scope.output.warnings = []; //Clear generated warnings

    let courseUtils = new CourseUtils($scope.class);
    let questions = new Set();
    for(let question of assessment.questions){
      let questionObj = courseUtils.getQuestion(UI.UIDfromJson(question));
      let questionUtil = new QuestionUtils(questionObj);
      if(!questionUtil.isValid()){
        $scope.output.warnings.push($sce.trustAsHtml('<span class="text-danger">Question: <i>'+
          questionObj.questionTitle+'</i> is not valid. It is an added question however it has been omitted.'))
      } else {
        questions.add(questionObj);
      }
    }

    for(let rule of assessment.rules){
      let possibleQuestions = new Set(); //Create a set of all the questions which satisfy the rule
      for(let topic of rule.topics){
        for(let question of topic.questions){
          let questionUtil = new QuestionUtils(question);
          if(!questions.has(question) && questionUtil.isValid())
            possibleQuestions.add(question);
        }
      }
      for(let topic of $scope.class.topics){
        for(let question of topic.questions){
          for(let objective of question.objectives){
            for(let ruleObjective of rule.objectives){
              if(objective.ID === ruleObjective.ID){
                let questionUtil = new QuestionUtils(question);
                if(!questions.has(question) && questionUtil.isValid())
                  possibleQuestions.add(question);
              }
            }
          }
        }
      }

      let possibleQuestionArray = Array.from(possibleQuestions);
      let randoms = new Set();
      let addedCount = 0;
      for(let i=0;i<rule.numRequired;i++){
        let max = possibleQuestionArray.length;

        if(max===0) {
          let warningStr = 'Requirement <i>'+rule.type+': ';
          if(rule.type === 'Objective')
            warningStr += $scope.formatArray(rule.objectives,'objectiveText');
          else
            warningStr += $scope.formatArray(rule.topics,'topicName');
          warningStr += '</i> can only be met with '+addedCount+' question'+
            (addedCount===1?'':'s')+', '+rule.numRequired+' required.';

          $scope.output.warnings.push($sce.trustAsHtml(warningStr));
          break;
        }

        let randomNum = Math.floor(Math.random()*max); //Random number 0-(max-1)
        questions.add(possibleQuestionArray[randomNum]);
        possibleQuestionArray.splice(randomNum,1);
        addedCount++;
      }

      let randomArr = Array.from(randoms);
      for(let rand of randomArr){
        questions.add(possibleQuestionArray[rand]);
      }
    }

    let questionsArr = Array.from(questions);
    let out = "";
    while(questionsArr.length !== 0){
      let pickedQuestion = questionsArr.splice(Math.floor(Math.random()*questionsArr.length),1)[0];
      //Add a random question to the output (removing afterwards to ensure no duplicates)
      out+=$scope.toEDX(pickedQuestion);
      $scope.output.questions.push(pickedQuestion);
    }
    $scope.output.data=out.trim();

    setTimeout(() => {
      let textArea = document.getElementById("importArea" + $scope.tabID);
      textArea.dispatchEvent(new Event('input', {bubbles: true, cancelable: false }));
    }, 1); //Let DOM Update

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
      showToast('An assessment must be generated to be able to save it', {level: 'danger'});
      return;
    }

    const dialog = require('electron').remote.dialog;
    let saveDirectory = dialog.showSaveDialog({
      title: 'Save edX Assessment',
      properties: ['createDirectory'],
      filters: [{name: 'Text File', extensions: ['txt']}, {name: 'All Files', extensions: ['*']}]
    }, (filename)=>{
      if(filename){
        fs.writeFile(filename,$scope.output.data, function(err){
          if(err){
            showToast('Error saving file', {level: 'danger', keepOpen: true});
            console.error('Error saving file "'+filename+'"');
            console.log(err);
          } else{
            showToast("File Saved to '"+filename+"'"+
              '<p class="btn btn-default" onclick="require(\'electron\').shell.showItemInFolder(\''+filename+'\')" ' +
              'style="opacity:.75;margin-left:10px; margin-bottom: 0 !important;">Open in Folder</p>',
              {level: 'success', compile: true, keepOpen: true, apply: true, noClick: true});
          }
        });
      }
    });
  };

  $scope.cleanup = function () {
    $scope.stopWatching();
    $scope.$parent.closeTab($scope.tabID);
  };

  $scope.stopWatching=$scope.$watch('assessment.selected', function(){
    if($scope.assessment.selected === $scope.initial){
      $scope.output.data = "";
    } else {
      $scope.exportAssessment($scope.assessment.selected);
    }
  });

  $scope.requestFocus = function(){
    setTimeout(function(){
      try {
        $scope.resizeTextArea(document.getElementById("importArea" + $scope.tabID));
      } catch(ex) {
        console.warn('Failed to do requestFocus',ex);
      }
    },1); //Delay until render finishes
    $scope.init(); //Call once variables have been set through ng-init
  };

  $scope.formatArray = function (data,property) {
    let output = "";
    for (let i = 0; i < data.length; i++) {
      if (data[i][property])
        output += '<i>' + data[i][property] + '</i>';

      if (i < data.length - 2)
        output += ", ";
      else if (i < data.length - 1)
        output += " and ";
    }
    return output;
  };

  $scope.editQuestionHeader = [
    ['Edit Question', function($itemScope,$event){
      $scope.editQuestion($itemScope.question.UID);
    }]
  ];

});