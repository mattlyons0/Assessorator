"use strict";
app.controller("classesCtrl", function ($scope, $mdDialog) {
  $scope.classes = UI.getClasses();
  $scope.addClassTooltip = true;
  if (UI.getClasses().length > 0)
    $scope.addClassTooltip = false;

  $scope.lastClass = function(course){
    return course.ID == UI.getClasses()[UI.getClasses().length - 1].ID;

  };

  $scope.rightMenu = function ($mdOpenMenu, event) {
    $mdOpenMenu();
  };

  var closeTo = angular.element(document.querySelector('md-list-item:last-child'));
  $scope.addClass = function (event) {
    $mdDialog.show({
      controller: CreateClassController,
      templateUrl: 'views/editClass.html',
      parent: angular.element(document.body),
      targetEvent: event,
      clickOutsideToClose: true,
      fullscreen: false,
      closeTo: closeTo
    });
  };

  $scope.viewClass = function (classID) {
    $scope.$parent.page.classID = classID;
    $scope.$parent.page.URL = 'classView.html';
  };
});

function CreateClassController($scope, $mdDialog) {
  $scope.class = {
    name: "",
    id: "",
    semester: "",
    year: new Date().getFullYear()
  };
  $scope.semesters = ("Fall Spring Summer").split(' ');

  $scope.submit = function () {
    if ($scope.class.id) {
      console.log($scope.class);
      UI.createClass($scope.class.name, $scope.class.id, $scope.class.semester, $scope.class.year);
      $mdDialog.hide();
    }
  };
  $scope.cancel = function (event) {
    $mdDialog.cancel();
  };
}