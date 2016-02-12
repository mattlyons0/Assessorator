"use strict";

var app = angular.module("assessoratorApp", ['ngMaterial', 'ngMessages']);

app.directive('ngRightClick', function ($parse) { //Currently Unused
  return function (scope, element, attrs) {
    var fn = $parse(attrs.ngRightClick);
    element.bind('contextmenu', function (event) {
      scope.$apply(function () {
        event.preventDefault();
        fn(scope, {$event: event});
      });
    });
  };
});

app.directive('dynamicCtrl', ['$compile', '$parse',function($compile, $parse) { //Used for a dynamic controller
  return {
    restrict: 'A',
    terminal: true,
    priority: 100000,
    link: function(scope, elem) {
      var name = $parse(elem.attr('dynamic-ctrl'))(scope);
      elem.removeAttr('dynamic-ctrl');
      elem.attr('ng-controller', name);
      $compile(elem)(scope);
    }
  };
}]);

app.directive('autoscroll', ['$window', function($window) { //Used to make things scroll based on the height of the window and an offset
  return function (scope, element, attrs) {
    calcMaxHeight();
    element.css('overflow-y',"auto");

    angular.element($window).bind('resize', function(){
      calcMaxHeight();
    });

    function calcMaxHeight(){
      let maxHeight = $window.innerHeight - Number(attrs.autoscroll);
      element.css('max-height', maxHeight + 'px');
    }
  }
}]);