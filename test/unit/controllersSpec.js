/* jasmine specs for controllers go here */

describe('AppController.needsUserLoggedIn', function(){
    var needsUserLoggedIn = AppController.needsUserLoggedIn;
    beforeEach(function(){

    });

    it('should need no user login for some pages', function() {
        expect(needsUserLoggedIn('/login')).toBeFalsy()
        expect(needsUserLoggedIn('/invitation/user@host.com/secret')).toBeFalsy()
        expect(needsUserLoggedIn('/invitation/user@host.com')).toBeFalsy()
        expect(needsUserLoggedIn('/user@host.com/secret')).toBeFalsy()
        expect(needsUserLoggedIn('/user@host.com')).toBeFalsy()
    });

    it('should need user login for most pages', function() {
        expect(needsUserLoggedIn('/other/user@host.com/secret')).toBeTruthy()
        expect(needsUserLoggedIn('/other/user@host.com')).toBeTruthy()
        expect(needsUserLoggedIn('/mystuff')).toBeTruthy()
    });
});
