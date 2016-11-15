"use strict";

var app = angular.module("assessoratorApp", ['ui.bootstrap','ui.bootstrap.contextMenu','ngMaterial', 'ngMessages','ngSanitize']);

app.config(function($mdThemingProvider) {
  $mdThemingProvider.theme('warn')
    .primaryPalette('red')
    .accentPalette('red');
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

// https://github.com/darlanalves/ngWheel
app.directive('ngWheel', []).directive('ngScroll', ['$parse', function($parse) {
  return function(scope, element, attr) {
    var fn = $parse(attr.ngScroll);

    element.bind('scroll', function(event) {
      scope.$apply(function() {
        fn(scope, {
          $event: event
        })
      })
    })
  }
}]);

app.directive('bindHtmlCompile', ['$compile', function ($compile) {
  return {
    restrict: 'A',
    link: function (scope, element, attrs) {
      scope.$watch(function () {
        return scope.$eval(attrs.bindHtmlCompile);
      }, function (value) {
        // In case value is a TrustedValueHolderType, sometimes it
        // needs to be explicitly called into a string in order to
        // get the HTML string.
        element.html(value && value.toString());
        // If scope is provided use it, otherwise use parent scope
        var compileScope = scope;
        if (attrs.bindHtmlScope) {
          compileScope = scope.$eval(attrs.bindHtmlScope);
        }
        $compile(element.contents())(compileScope);
      });
    }
  };
}]);