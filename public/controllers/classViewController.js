app.controller("classViewCtrl", function ($scope) {
  $scope.class = UI.getClassById($scope.$parent.page.classID);

  $scope.goBack = function () {
    $scope.$parent.page.classID = undefined;
    $scope.$parent.page.URL = 'classes.html';
  }
});