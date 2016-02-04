describe('Controller: Test', function () {

    beforeEach(module('app'));

    var Test,
        scope;

    beforeEach(inject(($controller, $rootScope)=> {
        scope = $rootScope.$new();
        Test = $controller('test', {
            $scope: scope
        });
    }));

    it('testing Some', function () {
        expect(Test.testing(1, 2)).toBe(3);
    });
});