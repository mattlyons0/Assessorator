"use strict";
app.controller("classViewCtrl", function ($scope,$timeout,$mdDialog, $mdToast) {
  $scope.class = UI.getClassById($scope.$parent.page.classID);
  $scope.tabs = [];
  let nextID = 0;

  $scope.createTopic = function(){
    createTab("New Topic","views/editTopic.html","editTopicCtrl");

    //Remove popup from new question topic chooser UI
    if(document.querySelector("#topicChooserInput")) {
      $timeout(function () { //Delay until after current $apply
        document.querySelector("#topicChooserInput").blur();
        angular.element(document.querySelector('md-virtual-repeat-container')).triggerHandler('mouseleave');
      }, 50); //Less than this seems to screw with the animation
    }
  };
  $scope.editTopic = function(id){
    createTab("Edit Topic","views/editTopic.html","editTopicCtrl",{topicID: id});
  };
  $scope.deleteTopic = function(id){
    let topic = $scope.class.getTopic(id);
    if(topic.questions.length > 0){
      showToast("'"+topic.topicName+"' contains "+topic.questions.length+" questions. All questions must be " +
        "removed from a topic before it can be deleted.",$mdToast);
      return;
    }
    let confirm = $mdDialog.confirm().title('Are you sure you would like to delete Topic \''+topic.topicName+'\'?')
      .ok('Delete').cancel('Cancel');
    $mdDialog.show(confirm).then(function(){
      $scope.class.deleteTopic(id);
      $scope.selectedTopic = undefined;
    }, function(){
      //You didn't delete it.
    });
  };
  $scope.createQuestion = function(){
    createTab("New Question", "views/editQuestion.html","editQuestionCtrl");
  };
  $scope.editQuestion = function(id){
    createTab("Edit Question", "views/editQuestion.html","editQuestionCtrl",{questionID: id,topicID: $scope.selectedTopic.ID});
  };
  $scope.deleteQuestion = function(id){
    let topic = $scope.selectedTopic;
    let question = topic.getQuestion(id);
    let confirm = $mdDialog.confirm().title('Are you sure you would like to delete Question \''+question.questionTitle+'\'?')
      .ok('Delete').cancel('Cancel');
    $mdDialog.show(confirm).then(function(){
      topic.deleteQuestion(id);
    }, function(){
      //You didn't delete it.
    });
  };
  $scope.createObjective = function(){
    createTab("New Objective","views/editObjective.html","editObjectiveCtrl");

    //Remove popup from new question topic chooser UI
    if(document.querySelector("#objectiveChooserInput")) {
      $timeout(function () { //Delay until after current $apply
        document.querySelector("#objectiveChooserInput").blur();
        angular.element(document.querySelectorAll('md-virtual-repeat-container')[1]).triggerHandler('mouseleave');
      }, 50); //Less than this seems to screw with the animation
    }
  };
  $scope.createAssessment = function(){
    createTab("New Assessment", "views/editAssessment.html","editAssessmentCtrl");
  };
  $scope.editAssessment = function(id){
    createTab("New Assessment", "views/editAssessment.html","editAssessmentCtrl", {assessmentID: id});
  };
  $scope.deleteAssessment = function(id){
    let assessment = $scope.class.getAssessment(id);
    let confirm = $mdDialog.confirm().title('Are you sure you would like to delete Assessment \''+assessment.assessmentName+'\'?')
      .ok('Delete').cancel('Cancel');
    $mdDialog.show(confirm).then(function(){
      $scope.class.deleteAssessment(id);
    }, function(){
      //You didn't delete it.
    });
  };
  $scope.searchQuestions = function(tabName,data){
    if(!tabName)
      tabName="Search Questions";
    createTab(tabName,"views/searchQuestions.html","searchQuestionsCtrl",data);
  };
  
  
  $scope.getAllQuestions = function(){
    return UI.getAllQuestionsForClass($scope.class.ID);
  };

  $scope.selectTopic = function(topicID){
    if(topicID === undefined)
      return;
    if($scope.selectedTopic != undefined)
      document.querySelector('#topic'+$scope.selectedTopic.ID).style.background='transparent';
    $scope.selectedTopic = $scope.class.getTopic(topicID);
    document.querySelector('#topic'+$scope.selectedTopic.ID).style.background='#E8E8E8';
  };

  $scope.goBack = function () {
    $scope.$parent.page.classID = undefined;
    $scope.$parent.page.URL = 'classes.html';
  };

  $scope.closeTab = function(tabID){
    for(let x=0;x<$scope.tabs.length;x++){
      if($scope.tabs[x].id === tabID){
        $scope.tabs.splice(x,1);
      }
    }
  };

  $scope.getTabByID = function(tabID){
    for(let x=0;x<$scope.tabs.length;x++){
      if($scope.tabs[x].id === tabID){
        return $scope.tabs[x];
      }
    }
    console.error('No tab found with ID: '+tabID);
  };

  function createTab(tabName,contentURL,ctrl,data){
    if(!data)
      data = {};
    
    let tab = {
      id: nextID,
      name: tabName,
      URL: contentURL,
      controller: ctrl,
      data: data
    };
    nextID++;
    $scope.tabs.push(tab);
    
    return tab.id;
  }
});
