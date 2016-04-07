"use strict";
app.controller("classesCtrl", function ($scope, $mdDialog) {
  $scope.addClassTooltip = $scope.classes && $scope.classes.length <= 0;
  $scope.readingDisk = true;

  UI.onStateCreate( () => {
    $scope.$apply( () => {
      $scope.classes = UI.getClasses();
      $scope.readingDisk = false;
    })
  });
  
  $scope.rightMenu = function ($mdOpenMenu, event) {
    $mdOpenMenu();
  };

  var closeTo = angular.element(document.querySelector('md-list-item:last-child'));
  $scope.addClass = function (event,id) {
    let scope = $scope.$new(); //Makes current scope parent
    if(id != undefined) {
      scope.classID = id;
      scope.edit = true;
    }
    $mdDialog.show({
      controller: CreateClassController,
      templateUrl: 'views/editClass.html',
      parent: angular.element(document.body),
      targetEvent: event,
      clickOutsideToClose: true,
      fullscreen: false,
      scope: scope,
      closeTo: closeTo
    });
  };
  $scope.editClass = function(event,id){
    console.log(id);
    $scope.addClass(event,id);
  };
  $scope.deleteClass = function(id){
    let course = UI.getClassById(id);
    let topics = course.topics.length;
    let objectives = course.objectives.length;
    let assessments = course.assessments.length;
    let questions = 0;
    for(let topic of course.topics){
      questions+=topic.questions.length;
    }
    let deleteArr = [];
    if(questions)
      deleteArr.push("<b>"+questions + " question"+(questions>1?'s</b>':'</b>'));
    if(topics)
      deleteArr.push("<b>"+topics + " topic"+(topics>1?'s</b>':'</b>'));
    if(objectives)
      deleteArr.push("<b>"+objectives + " objective"+(objectives>1?'s</b>':'</b>'));
    if(assessments) {
      deleteArr.push("<b>"+assessments + " assessment"+(assessments>1?'s</b>':'</b>'));
    }

    let deleteStr = "";
    for(let i=0;i<deleteArr.length;i++){
      if(i+2<deleteArr.length){
        deleteStr+=deleteArr[i]+', ';
      } else if(i+1<deleteArr.length){
        deleteStr+=deleteArr[i]+' and ';
      } else { //Last element
        deleteStr+=deleteArr[i]+'.';
      }
    }
    let courseDescrip = course.courseName + ' ' + course.courseID + ' ' + course.courseSemester + ' ' + course.courseYear;
    if(!deleteStr.trim()){
      deleteStr = courseDescrip;
      courseDescrip = "";
    }
    let confirm = $mdDialog.confirm().title('Are you sure you would like to delete Class \''+course.courseName+'\'?')
      .htmlContent(courseDescrip + '<br/><br/>This will delete: '+deleteStr)
      .ok('Delete all of this data').cancel('Cancel').theme('warn');
    $mdDialog.show(confirm).then(function(){
      let finalConfirm = $mdDialog.confirm().title('Are you sure you would like to delete Class \''+course.courseName+'\'?')
        .textContent('Are you sure? This operation cannot be reversed.').ok('Yes I am sure').cancel('Cancel').theme('warn');
      $mdDialog.show(finalConfirm).then(function(){
        UI.deleteClass(id);
      }, function(){
        //You backed out
      })
    }, function(){
      //You didn't delete it.
    });
  };

  $scope.viewClass = function (classID) {
    $scope.$parent.page.classID = classID;
    $scope.$parent.page.URL = 'classView.html';
  };
});

function CreateClassController($scope, $mdDialog) {
  if($scope.classID == undefined) {
    $scope.class = {
      name: "",
      id: "",
      semester: "",
      year: new Date().getFullYear()
    };
  } else { //We are editing a class
    let course = UI.getClassById($scope.classID);
    $scope.class = {
      name: course.courseName,
      id: course.courseID,
      semester: course.courseSemester,
      year: course.courseYear
    }
  }
  $scope.semesters = ("Fall Spring Summer").split(' ');

  $scope.submit = function () {
    if ($scope.class.id) {
      if(!$scope.edit)
        UI.createClass($scope.class.name, $scope.class.id, $scope.class.semester, $scope.class.year);
      else { //Editing
        let course = UI.getClassById($scope.classID);
        course.courseName = $scope.class.name;
        course.courseID = $scope.class.id;
        course.courseSemester = $scope.class.semester;
        course.courseYear = $scope.class.year;
      }
      $mdDialog.hide();
    }
  };
  $scope.cancel = function (event) {
    $mdDialog.cancel();
  };
}