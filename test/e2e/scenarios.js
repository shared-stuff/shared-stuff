describe('my app', function() {

  beforeEach(function() {
    browser().navigateTo('../../app/index.html');
  });

/*
  it('should automatically redirect to /view1 when location hash/fragment is empty', function() {
    expect(browser().location().url()).toBe("/view1");
  });
*/

  describe('mystuff', function() {

    beforeEach(function() {
      browser().navigateTo('#/mystuff');
      sleep(2);
    });


    it('should render mystuff when user navigates to /mystuff', function() {
      expect(element('h2').text()).toMatch(/My Stuff/);
    });


  });

/*
  describe('view2', function() {

    beforeEach(function() {
      browser().navigateTo('#/view2');
    });


    it('should render view1 when user navigates to /view2', function() {
      expect(element('[ng-view] p:first').text()).
        toMatch(/partial for view 2/);
    });

  });
  */
});
