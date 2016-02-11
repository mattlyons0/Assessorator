var app = angular.module("assessoratorApp", ['ngMaterial', 'ngMessages']);

app.directive('ngRightClick', function ($parse) {
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

app.directive('dynamicCtrl', ['$compile', '$parse',function($compile, $parse) {
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