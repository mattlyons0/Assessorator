"use strict";
app.controller("editAssessmentCtrl", function ($scope, $mdDialog, $mdToast, $sce) {
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

    let assessment;
    if(!$scope.edit)
      assessment = new CourseUtils($scope.class).createAssessment($scope.assessment.title, $scope.assessment.description);
    else { //Editing
      assessment = new CourseUtils($scope.class).getAssessment($scope.tabData.assessmentID);
      assessment.assessmentName = $scope.assessment.title;
      assessment.assessmentDescription = $scope.assessment.description;
    }
    let manuallyAdded = Array.from($scope.questions.manuallyAdded);
    assessment.questions = [];
    for (let question of manuallyAdded) {
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
    $scope.getTabByID($scope.tabID).data.searchQuestions = {};
    $scope.searchQuestions('Pick Questions', {type: 'pick', callbackTID: $scope.tabID});
    $scope.stopWatching2 = $scope.$watch('getTabByID(tabID).data.searchQuestions.complete', function () {
      if ($scope.getTabByID($scope.tabID).data.searchQuestions.complete === true) { //Search for manual questions is complete
        $scope.stopWatching2();
        //Detect selected questions
        if($scope.getTabByID($scope.tabID).data.searchQuestions.questions) {
          for (let selectedQuestion of $scope.getTabByID($scope.tabID).data.searchQuestions.questions) {
            let classUtil = new CourseUtils($scope.class);
            let topic = classUtil.getTopic(selectedQuestion.topicID);
            let topicUtil = new TopicUtils(topic);
            let question = topicUtil.getQuestion(selectedQuestion.questionID);
            $scope.questions.manuallyAdded.add(question);
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

    let output = count + ' possible question' + (count===1?'':'s') + ' meet this requirement.';
    if(count < rule.numRequired) { //Impossible
      output = 'This requirement cannot be met because only ' + output;
    }
    return output;
  };

  $scope.getQuestions = function () {
    return Array.from($scope.questions.manuallyAdded);
  };
  $scope.deleteManualQuestion = function(id,topicID){
    let topic = new CourseUtils($scope.class).getTopic(topicID);
    let question = new TopicUtils(topic).getQuestion(id);
    $scope.questions.manuallyAdded.delete(question);
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
    $mdDialog.show({
      controller: CreateRequirementController,
      templateUrl: 'views/editRequirement.html',
      parent: angular.element(document.body), //Fixes Toasts
      targetEvent: event,
      clickOutsideToClose: false,
      fullscreen: false,
      scope: scope
      // closeTo: closeTo
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



function CreateRequirementController($scope, $mdDialog, $mdToast) {
  if(!$scope.editRequirementEnabled) {
    $scope.questions.rules[$scope.index].type = "Topic";
    $scope.questions.rules[$scope.index].numRequired = 1;
    $scope.questions.rules[$scope.index].objectives = [];
    $scope.questions.rules[$scope.index].topics = [];
  }

  $scope.search = {};
  $scope.search.query = "";

  $scope.searchQuery = function () {
    return $scope.search.query;
  };
  $scope.searchTopics = function () {
    let array = [];
    let query = $scope.search.query;
    if (!query)
      return $scope.class.topics;
    for (let x = 0; x < $scope.class.topics.length; x++) {
      if ($scope.class.topics[x].topicName.toLowerCase().indexOf(query.toLowerCase()) > -1)
        array.push($scope.class.topics[x]);
    }
    return array;
  };

  $scope.searchObjectives = function () {
    let array = [];
    let query = $scope.search.query;
    if (!query)
      return $scope.class.objectives;
    for (let x = 0; x < $scope.class.objectives.length; x++) {
      if ($scope.class.objectives[x].objectiveText.toLowerCase().indexOf(query.toLowerCase()) > -1)
        array.push($scope.class.objectives[x]);
    }
    return array;
  };

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
      document.getElementById('inputChooser').focus();
      return;
    } else if($scope.questions.rules[$scope.index].type == 'Objective' && !$scope.questions.rules[$scope.index].objectives.length){
      showToast("At least one objective must be selected", {level: 'danger'});
      document.getElementById('inputChooser').focus();
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

    $mdDialog.hide();
  };
  $scope.cancel = function (event) {
    $mdDialog.cancel();
    if(!$scope.editRequirementEnabled)
      $scope.questions.rules.splice($scope.index, 1);
  };
}