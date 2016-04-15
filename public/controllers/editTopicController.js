"use strict";

app.controller("editTopicCtrl", function($scope){
  $scope.topic = {};
  function init() {
    if ($scope.tabData.topicID != undefined) {
      let topic = new CourseUtils($scope.class).getTopic($scope.tabData.topicID);
      $scope.topic.name = topic.topicName;
      $scope.topic.description = topic.topicDescription;
      $scope.edit = true;
    }
  }

  let tab;

  $scope.stopWatching = $scope.$watch('topic.name', function(){ //Once name is entered
    if(!$scope.topic.name)
      return;
    if(!tab)
      tab = $scope.$parent.getTabByID($scope.tabID);
    tab.name = strLimit("Topic: "+$scope.topic.name);
  });

  $scope.submitTopic = function(){
    if(!$scope.topic.name)
      return;
    if(!$scope.edit)
      new CourseUtils($scope.class).createTopic($scope.topic.name, $scope.topic.description);
    else{
      let topic = new CourseUtils($scope.class).getTopic($scope.tabData.topicID);
      topic.topicName = $scope.topic.name;
      topic.topicDescription = $scope.topic.description;
    }
    UI.save($scope.class);
    $scope.cleanup();
  };

  $scope.cleanup = function(){
    $scope.stopWatching();
    $scope.$parent.closeTab($scope.tabID);
  };
  $scope.requestFocus = function(){
    setTimeout(function(){
      document.getElementById("topicName"+$scope.tabID).focus();
    },200); //Delay until animation starts
    init();
  };
});