angular.module('app').controller('test', function () {
    this.testing = (a, b) => {
        return a + b;
    };
});