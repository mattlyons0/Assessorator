"use strict";

var app = angular.module("assessoratorApp", ['ui.bootstrap','ui.bootstrap.contextMenu','ngMaterial', 'ngMessages','ngSanitize', 'ui.select', 'ngToast', 'ngAnimate']);

app.config(['ngToastProvider',function(ngToastProvider){
  ngToastProvider.configure({
    animation: 'fade',
    verticalPosition: 'bottom',
    combineDuplications: true
  });
}]);

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
    attrs.$observe('autoscroll',function(){
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

//https://github.com/incuna/angular-bind-html-compile
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


/**
 * Highlights text that matches $select.search.
 *
 * Taken from AngularUI Bootstrap Typeahead
 * See https://github.com/angular-ui/bootstrap/blob/0.10.0/src/typeahead/typeahead.js#L340
 */
app.filter('highlight', function() {
    function escapeRegexp(queryToEscape) {
      return ('' + queryToEscape).replace(/([.?*+^$[\]\\(){}|-])/g, '\\$1');
    }

    return function(matchItem, query, caseSensitive) {
      let mod = 'g';
      if(!caseSensitive)
        mod+='i';
      return query && matchItem ? ('' + matchItem).replace(new RegExp(escapeRegexp(query), mod), '<span class="ui-select-highlight">$&</span>') : matchItem;
    };
  });

app.filter('sort', function(){
  return function(arr,params){
    arr = arr.slice(); //Shallow copy so we don't change the order of the actual array

    let mult = 1;
    if(!params.mode.ascending)
      mult = -1;
    return arr.sort(function (a, b) {
      let objA = a[params.key];
      let objB = b[params.key];
      if (objA > objB)
        return 2 * mult;
      if (objA < objB)
        return -2 * mult;
      //Sort based on ID for stability if key matches
      if(a.ID > b.ID)
        return 1;
      else
        return -1;
    });
  };
});

//Unused atm
app.filter('alphabetize', function(){
  return function(arr,key){
    return arr.sort(function(a,b){
      if(a[key] > b[key]){
        return 2;
      } else if(a[key] < b[key]){
        return -2;
      } else{
        if(a.ID > b.ID)
          return 1;
        else
          return -1;
      }
    });
  };
});