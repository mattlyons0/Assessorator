"use strict";
app.controller("editAssessmentCtrl", function ($scope, $uibModal,$sce) {
  function init(){
    if ($scope.tabData.assessmentID != undefined){
      let assessment = new CourseUtils($scope.class).getAssessment($scope.tabData.assessmentID);

      $scope.edit = true;
      $scope.assessment.title = assessment.assessmentName;
      $scope.assessment.description = assessment.assessmentDescription;
      $scope.questions.manuallyAdded = new Set(assessment.questions);
      $scope.questions.rules = [];
      for(let rule of assessment.rules){ //Copy, don't use pointer
        $scope.questions.rules.push({
          type: rule.type,
          numRequired: rule.numRequired,
          objectives: rule.objectives.slice(),
          topics: rule.topics.slice()
        });
      }
    }
  }

  $scope.assessment = {};
  $scope.questions = {};
  $scope.questions.manuallyAdded = new Set();
  $scope.questions.rules = [];

  $scope.submitAssessment = function () {
    if (!$scope.assessment.title)
      return;

    let courseUtils = new CourseUtils($scope.class);
    let assessment;
    if(!$scope.edit)
      assessment = courseUtils.createAssessment($scope.assessment.title, $scope.assessment.description);
    else { //Editing
      assessment = courseUtils.getAssessment($scope.tabData.assessmentID);
      assessment.assessmentName = $scope.assessment.title;
      assessment.assessmentDescription = $scope.assessment.description;
    }
    let manuallyAdded = Array.from($scope.questions.manuallyAdded);
    assessment.questions = [];
    for (let question of manuallyAdded) {
      if(courseUtils.getQuestion(UI.UIDfromJson(question)) !== undefined) //Check for changed topic/deleted question before saving
        assessment.questions.push(question);
    }
    assessment.rules = [];
    for(let rule of $scope.questions.rules){
      assessment.rules.push(rule);
    }

    UI.save($scope.class);
    
    $scope.cleanup();
  };

  $scope.cleanup = function () {
    $scope.stopWatching();
    $scope.$parent.closeTab($scope.tabID);
  };

  $scope.requestFocus = function () {
    setTimeout(function () {
      try{
        document.getElementById("assessmentTitle" + $scope.tabID).focus();
        $scope.resizeTextArea(document.getElementById("assessmentTitle"+$scope.tabID));
        $scope.resizeTextArea(document.getElementById("assessmentDesc"+$scope.tabID));
      } catch(ex) {
        console.warn('Failed to do requestFocus',ex);
      }
    }, 1); //Delay until render finishes
    init();
  };


  $scope.pickQuestion = function () {
    let currentTab = $scope.getTabByID($scope.tabID);
    currentTab.data.searchQuestions = { complete: false, questions: {}};
    for(let question of $scope.questions.manuallyAdded){
      currentTab.data.searchQuestions.questions[question] = true;
    }
    $scope.searchQuestions('Pick Questions for '+currentTab.name, {type: 'pick', callbackTID: $scope.tabID});
    $scope.stopWatching2 = $scope.$watch('getTabByID(tabID).data.searchQuestions.complete', function () {
      if (currentTab.data.searchQuestions.complete === true) { //Search for manual questions is complete
        $scope.stopWatching2();
        //Detect selected questions
        if(currentTab.data.searchQuestions.questions) {
          let classUtil = new CourseUtils($scope.class);
          let foundQ = currentTab.data.searchQuestions.questions;
          for (let uid in foundQ) {
            if(foundQ.hasOwnProperty(uid) && foundQ[uid] === true) {
              $scope.questions.manuallyAdded.add(uid);
            }
          }
        }
      }
    })
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
    return $sce.trustAsHtml(output);
  };

  $scope.checkPossibilities = function(index){
    let rule = $scope.questions.rules[index];
    let count = 0;
    if(rule.type == 'Topic'){
      for(let topic of rule.topics){
        count+=topic.questions.length;
      }
    } else if(rule.type == 'Objective'){
      for(let objective of rule.objectives){
        for(let topic of $scope.class.topics){
          for(let question of topic.questions){
            if(question.objectives.indexOf(objective) != -1)
              count++;
          }
        }
      }
    }
    return count;
  };

  $scope.checkPossible = function(index){
    let rule = $scope.questions.rules[index];
    let count = $scope.checkPossibilities(index);
    if(count >= rule.numRequired)
      return true;
  };

  $scope.formatPossibilities = function(index){
    let rule = $scope.questions.rules[index];
    let count = $scope.checkPossibilities(index);
    if(count === 0)
      return 'This requirement has no possible questions.';

    let output = count + ' possible question' + (count===1?'':'s') + ' meet' + (count===1?'s':'') + ' this requirement.';
    if(count < rule.numRequired) { //Impossible
      output = 'This requirement cannot be met because only ' + output;
    }
    return output;
  };

  $scope.getQuestions = function () {
    let questions = [];
    let courseUtils = new CourseUtils($scope.class);
    for(let uid of $scope.questions.manuallyAdded){
      questions.push(courseUtils.getQuestion(UI.UIDfromJson(uid)));
    }

    return questions;
  };
  $scope.deleteManualQuestion = function(id,topicID){
    let uid = {topic: topicID, question: id};
    let sUID = UI.UIDtoJson(uid);
    $scope.questions.manuallyAdded.delete(sUID);
  };


  let tab;
  $scope.stopWatching = $scope.$watch('assessment.title', function () { //Edit Tab Title
    if (!$scope.assessment.title)
      return;
    if (!tab)
      tab = $scope.$parent.getTabByID($scope.tabID);
    tab.name = strLimit("Assessment: " + $scope.assessment.title);
  });

  $scope.createRequirement = function (event,index) {
    let scope = $scope.$new(); //Makes current scope parent
    if(index == undefined) {
      $scope.questions.rules.push({});
      scope.index = $scope.questions.rules.length - 1;
    } else {
      scope.index = index;
      scope.editRequirementEnabled = true;
    }

    let settingsModal = $uibModal.open({
      templateUrl: 'views/editRequirement.html',
      size: 'md',
      keyboard: false,
      backdrop: 'static',
      scope: scope,
      controller: CreateRequirementController

    });
  };
  $scope.editRequirement = function(index,event){
    $scope.createRequirement(event,index);
  };
  $scope.deleteRequirement = function(index){
    $scope.questions.rules.splice(index, 1);
  };


  /********************************
   *  Right Click Menu Definitions
   ********************************/
  $scope.addedQuestionHeader = [
    ['Edit Question', function($itemScope,$event){
      $scope.editQuestion($itemScope.question.UID);
    }],
    null,
    ['Remove Question', function($itemScope,$event){
      $scope.deleteManualQuestion($itemScope.question.ID,$itemScope.question.topicID)
    }]
  ];
  $scope.ruleHeader = [
    ['Edit Requirement', function($itemScope,$event){
      $scope.editRequirement($itemScope.$index,$event);
    }],
    null,
    ['Delete Requirement', function($itemScope,$event){
      $scope.deleteRequirement($itemScope.$index)
    }]
  ];
});



function CreateRequirementController($scope) {
  if(!$scope.editRequirementEnabled) {
    $scope.questions.rules[$scope.index].type = "Topic";
    $scope.questions.rules[$scope.index].numRequired = 1;
    $scope.questions.rules[$scope.index].objectives = [];
    $scope.questions.rules[$scope.index].topics = [];
  }

  $scope.choices = ['Topic', 'Objective'];
  $scope.selection = { index: $scope.choices.indexOf($scope.questions.rules[$scope.index].type) };

  $scope.$watch('selection.index', function() {
    if($scope.selection.index !== -1){
      $scope.questions.rules[$scope.index].type = $scope.choices[$scope.selection.index];
    }
  });


  function checkConflict(){
    let rule = $scope.questions.rules[$scope.index];
    if(rule.type == 'Topic'){
      let allTopicRules = new Set();
      for(let i=0;i<$scope.questions.rules.length;i++){
        if(i != $scope.index)
          for(let topic of $scope.questions.rules[i].topics){
            allTopicRules.add(topic);
          }
      }
      for(let topic of rule.topics){
        if(allTopicRules.has(topic)){
          showToast("Topic '"+topic.topicName+"' is already used in a different requirement", {level: 'danger'});
          return true;
        }
      }
    } else if(rule.type == 'Objective'){
      let allTopicRules = new Set();
      for(let i=0;i<$scope.questions.rules.length;i++){
        if(i != $scope.index)
          for(let objective of $scope.questions.rules[i].objectives){
            allTopicRules.add(objective);
          }
      }
      for(let objective of rule.objectives){
        if(allTopicRules.has(objective)){
          showToast("Objective '"+objective.objectiveText+"' is already used in a different requirement", {level: 'danger'});
          return true;
        }
      }
    }
    return false;
  }

  $scope.submit = function () {
    if($scope.questions.rules[$scope.index].type == 'Topic' && !$scope.questions.rules[$scope.index].topics.length){
      showToast("At least one topic must be selected",{level: 'danger'});
      $scope.$broadcast('inputChooserTopic');
      return;
    } else if($scope.questions.rules[$scope.index].type == 'Objective' && !$scope.questions.rules[$scope.index].objectives.length){
      showToast("At least one objective must be selected", {level: 'danger'});
      $scope.$broadcast('inputChooserObjective');
      return;
    } else if(!$scope.questions.rules[$scope.index].type){
      showToast("A type must be selected", {level: 'danger'});
      document.getElementById('reqType').focus();
      return;
    } else if($scope.questions.rules[$scope.index].numRequired < 1){
      showToast("Number of questions must be greater than 0",{level: 'danger'});
      document.getElementById('numQuestions').focus();
      return;
    }

    let conflict = checkConflict(); //Checks and displays toast about conflict
    if(conflict)
      return;

    $scope.$close();
  };
  $scope.cancel = function (event) {
    $scope.$dismiss();
    if(!$scope.editRequirementEnabled)
      $scope.questions.rules.splice($scope.index, 1);
  };
}