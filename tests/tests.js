var SC        = window.SC,    // namespace
    ATI       = SC.ATI,       // original public interface functions
    helperFn  = SC.helperFn,  // helper functions for tests
    privateFn = SC.privateFn; // hacked private functions for tests

/**
 * Tests for the public interface
 */
window.SC.ATItests.module('Public interface', function () {

  this.test('Calling public methods with uninitialized library will throw an error', function (assert) {
    assert.that(function(){
      ATI.triggerAudioEvent();
    }).willThrow(Error)();
  });

  this.test('Initialize: missing id should throw an error', function (assert) {
    assert.that(function(){
      ATI.initialize({
        subdomain: 'https://logs1252'
      });
    }).willThrow(Error)();
  });

  this.test('Initialize: missing subdomain should throw an error', function (assert) {
    assert.that(function(){
      ATI.initialize({
        id: 515773
      });
    }).willThrow(Error)();
  });

  this.test('Initialize: passes if all required arguments are given', function (assert) {
    assert.that(function(){
      ATI.initialize({
        id: 515773,
        subdomain: 'https://logs1252'
      });
    }).is.ok().since('all mandatory properties where passed');
  });

  this.test('triggerAudioEvent: Missing mandatory params throw an error', function (assert) {
    assert.that(function(){
      ATI.triggerAudioEvent();
    }).willThrow(Error)();
  });

  this.test('triggerAudioEvent: No missing mandatory param passes', function (assert) {
    assert.that(function(){
      ATI.triggerAudioEvent({
        page         : 'test::http://soundcloud.com/yvg/sound-xyz',
        level        : '0',
        action       : 'play',
        duration     : '123456',
        contextPage  : 'test::http://soundcloud.com/stream',
        contextLevel : '0'
      });
    }).is.ok().since('all required params were passed');
  });

  this.test('triggerCustomEvent: Missing mandatory params throw an error', function (assert) {
    assert.that(function(){
      ATI.triggerCustomEvent();
    }).willThrow(Error)();
  });

  this.test('triggerCustomEvent: No missing mandatory param passes', function (assert) {
    assert.that(function(){
      ATI.triggerCustomEvent({
        type  : 'A',
        page  : 'test::http://test',
        level : '0'
      });
    }).is.ok().since('all required params were passed');
  });

  this.test('triggerPageView: Missing mandatory params throw an error', function (assert) {
    assert.that(function(){
      ATI.triggerPageView();
    }).willThrow(Error)();
  });

  this.test('triggerPageView: No missing mandatory param passes', function (assert) {
    assert.that(function(){
      ATI.triggerPageView({
        page  : 'test::http://test',
        level : '0'
      });
    }).is.ok().since('all required params were passed');
  });

}); // module


/**
 * Tests for internals
 */
window.SC.ATItests.module('Formatting helpers, tests for query URL structure', function () {

  this.addAssertions({
    formattedURL: function(url, event) {
      var i, l, params, queryMaps, property;
      params = helperFn.parseQueryString(url);
      queryMaps = {
        'page'         : 'p',
        'level'        : 's2',
        'type'         : 'clic',
        'action'       : 'a',
        'duration'     : 'm1',
        'contextPage'  : 'prich',
        'contextLevel' : 's2rich',
        'foo'          : 'foo'
      };
      for (property in event) {
        if (event[property] !== params[queryMaps[property]]) {
          return false;
        }
      }
      return true;
    }
  });

  this.test('Formatted time', function (assert) {
    assert.that(/(?:\d{2}x){2}\d{2}/.test(privateFn.getFormattedTime()))
      .is.ok().since('Time formatting should respect the ATI format: HHxMMxSS');
  });

  this.test('Formatted screen properties', function (assert) {
    assert.that(/(?:\d+x){3}\d+/.test(privateFn.getFormattedScreenProperties()))
      .is.ok().since('Screen properties should respect the ATI format: *x*x*x* (e.g. 1280x774x24x24)');

    assert.that(/\d+x\d+/.test(privateFn.getFormattedScreenSize()))
      .is.ok().since('Screen properties should respect the ATI format: *x* (e.g. 1280x800)');
  });

  this.test('Formatted URLs for events', function (assert) {
    var event = {
      type  : 'A',
      page  : 'test::http://test',
      level : '0'
    };
    assert.that(privateFn.getCombinedURL(event)).is.formattedURL(event).since('Mandatory custom event properties should be present in the URL');

    event = {
      page  : 'http://test',
      level : '1'
    };
    assert.that(privateFn.getCombinedURL(event)).is.formattedURL(event).since('Mandatory page view properties should be present in the URL');

    event = {
      page         : 'test::http://testSound',
      level        : '0',
      action       : 'play',
      duration     : '123456',
      contextPage  : 'test::http://testPage',
      contextLevel : '1'
    };
    assert.that(privateFn.getCombinedURL(event)).is.formattedURL(event).since('Mandatory audio event properties should be present in the URL');
  });

}); // module
