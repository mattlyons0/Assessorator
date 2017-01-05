"use strict";

app.controller("searchQuestionsCtrl", function ($scope, $mdDialog, $mdToast,$sce) {
  $scope.init = function(){
    $scope.tabData = $scope.getTabByID($scope.tabID).data;
    $scope.tabName = $scope.getTabByID($scope.tabID).name;
    
    $scope.rules = [];
    $scope.selected = [];

    $scope.search = {};
    $scope.search.title = true;
    $scope.search.results = [];
    $scope.search.query = "";
    $scope.search.selected = [];

    $scope.watcher1 = $scope.$watch('rules.length', function(){
      $scope.validateRules();
    });
  };

  $scope.validateRules = function(){
    let allowedTopics = new Set();
    let allowedObjectives = new Set();
    let disallowedTopics = new Set();
    let disallowedObjectives = new Set();

    for(let rule of $scope.rules){
      if(rule.condition == 'Is') {
        for (let value of rule.value) {
          if(rule.selector == "Topic")
            allowedTopics.add(value);
          else if(rule.selector == "Objective")
            allowedObjectives.add(value);
        }
      } else if(rule.condition == "Isn't"){
        for (let value of rule.value){
          if(rule.selector == "Topic")
            disallowedTopics.add(value);
          else if(rule.selector == "Objective")
            disallowedTopics.add(value);
        }
      }
    }

    allowedTopics = Array.from(allowedTopics);
    for(let val of allowedTopics){
      if(disallowedTopics.has(val)) {
        $scope.rulesValidation = false;
        return;
      }
    }
    allowedObjectives = Array.from(allowedObjectives);
    for(let val of allowedObjectives){
      if(disallowedObjectives.has(val)) {
        $scope.rulesValidation = false;
        return;
      }
    }
    $scope.rulesValidation = {topics: {allowed: allowedTopics, disallowed: disallowedTopics},
      objectives: {allowed: allowedObjectives, disallowed: disallowedObjectives}};
  };

  $scope.query = function(){
    let valid = $scope.rulesValidation;
    if(!valid){
      $scope.rulesTextColor = 'red';
      return [];
    }
    $scope.rulesTextColor = '';

    let topics = valid.topics;
    let objectives = valid.objectives;
    if(topics.allowed.length == 0){
      for(let topic of $scope.class.topics){
        if(!topics.disallowed.has(topic))
          topics.allowed.push(topic);
      }
    }
    if(objectives.allowed.length == 0 && objectives.disallowed.size != 0){
      for(let objective of $scope.class.objectives){
        if(!objectives.disallowed.has(objective))
          objectives.allowed.push(objective);
      }
    }

    let questions = new Set(); //Doesn't allow duplicates


    for(let topic of topics.allowed){
      for(let question of topic.questions){
        let validObjectives = false;
        if(objectives.allowed.length == 0) //Bypass check if we don't specify any objectives
          validObjectives = true;
        else {
          for (let objective of objectives.allowed) {
            if (question.objectives.indexOf(objective) != -1) {
              validObjectives = true;
              break;
            }
          }
        }

        if(validObjectives) {
          if ($scope.search.title) {
            if (($scope.search.caseSensitive && question.questionTitle.includes($scope.search.query)) ||
              (!$scope.search.caseSensitive && question.questionTitle.toLowerCase().includes($scope.search.query.toLowerCase()))) {
              questions.add(question);
            }
          }
          if ($scope.search.description) {
            if (($scope.search.caseSensitive && question.questionDescription && question.questionDescription.includes($scope.search.query)) ||
              (!$scope.search.caseSensitive && question.questionDescription && question.questionDescription.toLowerCase().includes($scope.search.query.toLowerCase()))) {
              questions.add(question);
            }
          }
          if ($scope.search.answers) {
            for (let answer of question.answers) {
              if (($scope.search.caseSensitive && answer.answerText.includes($scope.search.query)) ||
                (!$scope.search.caseSensitive && answer.answerText.toLowerCase().includes($scope.search.query.toLowerCase()))) {
                questions.add(question);
                break; //No need to search other answers in this question
              }
            }
          }
        }
      }
    }
    let arr = Array.from(questions);
    $scope.search.results = [];
    for(let topic of $scope.class.topics) {
      for(let question of topic.questions){
        for (let arrQuestion of arr) {
          if(arrQuestion == question){
            $scope.search.results.push({
              topicID: topic.ID,
              questionID: question.ID
            });
          }
        }
      }
    }

    for(let i=0;i<$scope.search.results.length; i++){
      let question = $scope.search.results[i];
      let found = false;
      for(let selected of $scope.selected){
        if(selected.topicID == question.topicID && selected.questionID == question.questionID){
          $scope.search.selected[i]=true;
          found = true;
        }
      }
      if(!found){
        $scope.search.selected[i]=false;
      }
    }
    return arr; //Convert set into array
  };

  $scope.toggleSelect = function(index){
    let selected = $scope.search.results[index];
    let didSelect = false;
    for(let select of $scope.selected){
      if(selected.topicID == select.topicID && selected.questionID == select.questionID){
        $scope.selected.splice($scope.selected.indexOf(selected),1);
        $scope.search.selected[index] = false;
        didSelect = true;
        break;
      }
    }
    if(!didSelect){
      $scope.selected.push(selected);
      $scope.search.selected[index] = true;
    }
  };
  
  $scope.addRule = function(event){
    $mdDialog.show({
      controller: CreateRuleController,
      templateUrl: 'views/editRule.html',
      parent: angular.element(document.body),
      targetEvent: event,
      clickOutsideToClose: false,
      fullscreen: false,
      scope: $scope.$new() //Makes current scope parent
      // closeTo: closeTo
    });
  };
  $scope.getFormattedRuleValues = function(rule){
    let output = "";
    for(let i=0;i<rule.value.length;i++){
      if(rule.value[i].topicName)
        output+='<i>'+rule.value[i].topicName+'</i>';
      else if(rule.value[i].objectiveText)
        output+='<i>'+rule.value[i].objectiveText+'</i>';

      if(i < rule.value.length-2)
        output+=", ";
      else if(i < rule.value.length-1)
        output+=" or ";
    }
    return $sce.trustAsHtml(output);
  };


  $scope.requestFocus = function(){
    $scope.init(); //Call once variables have been set through ng-init
  };
  $scope.cleanup = function(){
    $scope.watcher1();
    $scope.$parent.closeTab($scope.tabID);
  };
  $scope.submit = function(){
    $scope.getTabByID($scope.tabData.callbackTID).data.searchQuestions.questions = $scope.selected;
    $scope.getTabByID($scope.tabData.callbackTID).data.searchQuestions.complete = true; //Trigger assessments tab to search for changed
    $scope.cleanup();
  };
  $scope.discard = function(){
    $scope.getTabByID($scope.tabData.callbackTID).data.searchQuestions.complete = false; //Trigger wipe of selected field
    $scope.cleanup();
  };
});


function CreateRuleController($scope, $mdDialog, $mdToast) {
  $scope.rule = {
    selector: "",
    condition: "",
    value: []
  };
  $scope.selectors = ("Topic Objective").split(' ');
  $scope.conditions = ("Is Isn't").split(' ');
  
  $scope.search = {};
  $scope.search.query = "";

  $scope.searchQuery = function(){
    return $scope.search.query;
  };
  $scope.searchTopics = function () {
    let array = [];
    let query = $scope.search.query;
    if(!query)
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
    if(!query)
      return $scope.class.objectives;
    for (let x = 0; x < $scope.class.objectives.length; x++) {
      if ($scope.class.objectives[x].objectiveText.toLowerCase().indexOf(query.toLowerCase()) > -1)
        array.push($scope.class.objectives[x]);
    }
    return array;
  };

  $scope.submit = function () {
    if(!$scope.rule.selector) {
      document.getElementById("ruleSelector").focus();
      showToast('A data source is required.');
      return;
    }
    if(!$scope.rule.condition){
      document.getElementById("ruleCondition").focus();
      showToast('A condition is required.');
      return;
    }
    if($scope.rule.value.length == 0){
      document.getElementById("inputChooser").focus();
      showToast('You must choose at least one '+$scope.rule.selector.toLowerCase()+'.');
      return;
    }


    $scope.rules.push($scope.rule);
    $mdDialog.hide();
  };
  $scope.cancel = function (event) {
    $mdDialog.cancel();
  };
}