/*jshint forin:false bitwise:false*/
/**
 * This file provides an interface that communicates with ATI's endpoints and queues the requests.
 */

/**
* @license
*
* Copyright (c) 2012, SoundCloud Ltd., Yves Van Goethem
* All rights reserved.
*
* Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:
*
* * Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.
* * Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.
*
* THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/

(function(){

  var ATI,

    /* local vars */
    initialized, siteId, subdomain, customVariables, _customVariables, audioRefreshTimer,

    /* utilities helpers */
    isObjectEmpty, isArray,
    supportsLocalStorage, supportsJSON,
    generateUUID, passesConditions,

    /* formatting helpers */
    getDomain, getFormattedTime, getFormattedScreenProperties, getFormattedScreenSize, getCombinedURL,

    /* data helpers */
    processEvent, pushEvent, sendData, isEventAudio, handleAudioRefreshEvents,

    /* storage helpers */
    getStorage, setStorage, processStorage, emptyStorage,

    /**
     * The name of the localStorage key we use
     * @type {String}
     */
    STORAGE_KEY = 'sc-new-ati-events';

  ATI = {

    /**
     * Initializes the library
     * @param {Object} params           Contains the mandatory initialization params
     * @param {String} params.id        The ATI site ID
     * @param {String} params.subdomain The ATI subdomain, prefer the SSL variation.
     * @example
     *   ATI.initialize({
     *     id: '123456',
     *     subdomain: 'https://logs1234'
     *   });
     * See ATI Documentation for more details about your Site ID and your subdomain.
     * @return {Boolean}
     * @final
     */
    initialize: function(params) {
      var passes = false,
          storage;
      if (passesConditions('initialize', params)) {
        if (supportsLocalStorage() && supportsJSON()) {
          storage         = getStorage();
          siteId          = params.id;
          subdomain       = params.subdomain;
          customVariables = {};

          if (storage && storage.length) {
            processStorage();
          } else {
            emptyStorage();
          }

          initialized = true;
          passes = true;
        }
      }
      return passes;
    },

    /**
     * Triggers an audio event
     * @param {Object}  params
     * @param {String}  params.page         The playing sound's page (yours or a users)
     * @param {String}  params.level        The playing sound's page level (yours or a users)
     * @param {String}  params.action       'play'|'pause'|'stop' (refresh events are handled internally)
     * @param {String}  params.duration     in seconds
     * @param {String}  params.contextPage  Page where the play happened (e.g. stream)
     * @param {String}  params.contextLevel Second Level ID where the play happened (e.g. stream)
     * @param {String?} params.qualityID    We use the quality ID as an option.
     * @example to trigger an audio event from the stream page
     *   ATI.triggerAudioEvent({
     *     page         : 'sound::http://soundcloud.com/yvg/sound-xyz',
     *     level        : '7',
     *     action       : 'play',
     *     duration     : '123456',
     *     contextPage  : 'sound::http://soundcloud.com/stream',
     *     contextLevel : '1'
     *   });
     * @return {Boolean}
     * @final
     */
    triggerAudioEvent: function(params) {
      return processEvent('audio', params);
    },

    /**
     * Triggers a custom event, like a click.
     * @param {Object} params
     * @param {String} params.type  'A' for a click (doesn't support others for now)
     * @param {String} params.page  The page 'http://soundcloud.com/bar' or as a chapter 'foo::http://soundcloud.com/bar'
     * @param {String} params.level Second Level ID, see ATI documentation for more details
     * @example to trigger a click event on the "repost dashbox" from the stream
     *   ATI.triggerCustomEvent({
     *     type  : 'A',
     *     page  : 'dashbox::click::repost::http://soundcloud.com/stream',
     *     level : '1'
     *   });
     * @return {Boolean}
     * @final
     */
    triggerCustomEvent: function(params) {
      return processEvent('custom', params);
    },

    /**
     * Triggers a page view event.
     * @param {Object} params
     * @param {String} params.page  The page 'http://soundcloud.com/bar' or as a chapter 'foo::http://soundcloud.com/bar'
     * @param {String} params.level Second Level ID, see ATI documentation for more details
     * @example to trigger a page view event of the stream
     *   ATI.triggerPageView({
     *     page  : 'http://soundcloud.com/stream',
     *     level : '1'
     *   });
     * @return {Boolean}
     * @final
     */
    triggerPageView: function(params) {
      return processEvent('pageview', params);
    },

    /**
     * Sets custom variables that are later sent with a pageview, all of them.
     * @param {Object} variables
     * @example to set the users plan:
     * ATI.setCustomVariables({
     *   xt_ac: 4
     * });
     */
    setCustomVariables: function(variables) {
      for (var key in variables) {
        customVariables[key] = variables[key];
      }
    }
  };

  /**
   * Checks if the passed object is empty
   * @param {Object} obj
   * @return {Boolean}
   */
  isObjectEmpty = function(obj) {
    for (var key in obj) {
      return false;
    }
    return true;
  };

  /**
   * Checks if the passed object is an Array
   * @param {Object} arr
   * @return {Boolean}
   */
  isArray = function(arr) {
    return Object.prototype.toString.call(arr) === '[object Array]';
  };

  /**
   * Checks if the browser supports localStorage
   * @return {Boolean}
   */
  supportsLocalStorage = function() {
    var supportsLocalStorage = true;
    try {
      window.localStorage.setItem('sc-test-storage','1');
      window.localStorage.removeItem('sc-test-storage');
    } catch (error) {
      supportsLocalStorage = false;
    }
    return supportsLocalStorage;
  };

  /**
   * Checks if the browser supports JSON
   * @return {Boolean}
   */
  supportsJSON = function() {
    return window.JSON !== undefined;
  };

  /**
   * Generates an RFC4122 4.0 compliant UUID
   * See http://stackoverflow.com/questions/105034/how-to-create-a-guid-uuid-in-javascript/2117523#2117523
   * @return {String}
   */
  generateUUID = function() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.floor(Math.random() * 16), v = c === 'x' ? r : (r&3|8);
      return v.toString(16);
    });
  };

  /**
   * Throws an error if one condition does not pass otherwise returns true
   * @param  {String} type
   * @param  {Object} params Contains params to check against
   * @return {Boolean?}
   */
  passesConditions = function(type, params) {
    var error, rules, paramsErrorStr, hasParams;
    paramsErrorStr = 'One or multiple params are missing';

    hasParams = function(list) {
      var noMissingParam = true,
          i, l, param;
      for (i = 0, l = list.length; i < l; i++) {
        if (!params[list[i]]) {
          noMissingParam = false;
          break;
        }
      }
      return params && noMissingParam;
    };

    if (type === 'initialize') {
      if (initialized) {
        error = 'Already initialized';
      } else if (!hasParams(['id', 'subdomain'])) {
        error = paramsErrorStr;
      }
    } else if (type === 'audio') {
      if (!hasParams(['page', 'level', 'action', 'duration', 'contextPage', 'contextLevel'])) {
        error = paramsErrorStr;
      }
    } else if (type === 'custom') {
      if (!hasParams(['page', 'level', 'type'])) {
        error = paramsErrorStr;
      }
    } else if (type === 'pageview') {
      if (!hasParams(['page', 'level'])) {
        error = paramsErrorStr;
      }
    } else if (!initialized) {
      error = 'the library needs to be initialized first';
    }

    if (error) {
      throw new Error('ATI: ' + error);
    } else {
      return true;
    }
  };

  /**
   * Combines specific subdomain with full ATI URL
   * @return {String}
   */
  getDomain = function() {
    return subdomain + '.xiti.com/hit.xiti?';
  };

  /**
   * Returns a specifically formatted string for ATI of the local time.
   * @return {String} hhxmmxss
   */
  getFormattedTime = function() {
    var date  = new Date(),
        units = [date.getHours(), date.getMinutes(), date.getSeconds()],
        time  = [],
        unit, i, l;

    for (i = 0, l = units.length; i < l; i++) {
      unit = String(units[i]);
      if (unit.length === 1) {
        time.push('0' + unit);
      } else {
        time.push(unit);
      }
    }

    return time.join('x');
  };

  /**
   * Returns a specifically formatted string for ATI of some screen properties
   * @return {String} e.g. 1280x774x24x24
   */
  getFormattedScreenProperties = function() {
    var windowScreen = window.screen;
    return [windowScreen.availWidth, windowScreen.availHeight, windowScreen.pixelDepth, windowScreen.colorDepth].join('x');
  };

  /**
   * Returns a specifically formatted string for ATI of screen resolution
   * @return {String} e.g. 1280x800
   */
  getFormattedScreenSize = function() {
    var windowScreen = window.screen;
    return [windowScreen.width, windowScreen.height].join('x');
  };

  /**
   * Returns a valid URL for ATI's API by combining multiple query strings depending on the event type
   * @param  {Object} event The event that was passed by processStorage
   * @return {String} The URL to perform a GET request
   */
  getCombinedURL = function(event) {
    var url = getDomain(),
        key;

    /* Basics for all URLs */
    url += [
      's='   + siteId,
      's2='  + event.level,
      'p='   + event.page,
      'r='   + getFormattedScreenProperties(),
      're='  + getFormattedScreenSize(),
      'hl='  + getFormattedTime(),
      'jv='  + (navigator.javaEnabled() ? 1 : 0),
      'lng=' + navigator.language
    ].join('&');

    if (event.type) {
      /* Custom events, like clicks. */
      url += '&clic=' + event.type;
    } else if (isEventAudio(event)) {
      /* Audio events */
      url += [
        '&type=audio',
        'm5=int',  /* We don't need to change that, all of our plays are internal */
        'm6=clip'  /* We don't need to change that, we always know the duration of the sound */
      ].join('&');
      if (event.action !== 'refresh') {
        url += [
          '&a='     + event.action,
          'm1='     + event.duration,
          'prich='  + event.contextPage,
          's2rich=' + event.contextLevel,
          'm3='     + event.qualityID
        ].join('&');
      } else {
        /* Audio refresh events */
        url += '&a=refresh';
      }
    } else {
      /* else it counts as a pageview */
      url += '&ref=' + document.referrer;
      if (_customVariables !== customVariables) {
        for (key in customVariables) {
          url += '&' + key + '=' + customVariables[key];
        }
        _customVariables = customVariables;
      }
    }

    return url;
  };

  /**
   * Stores data in the storage
   * When nothing is passed it resets the storage, call emptyStorage() to do so explicitly.
   * @param {Array=} data Array to store in localStorage
   */
  setStorage = function(data) {
    if (data) {
      for (var i = 0, l = data.length; i < l; ++i) {
        if (isObjectEmpty(data[i])) {
          if (data.length > 1) {
            data = data.splice(i, 1);
          } else {
            data.length = 0;
          }
        }
      }
    }
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data || []));
  };

  /**
   * Returns a parsed object of the storage
   * @return {Array}
   */
  getStorage = function() {
    return JSON.parse(window.localStorage.getItem(STORAGE_KEY));
  };

  /**
   * Processes the storage queue
   */
  processStorage = function() {
    var events, i, l, key, uuid;
    events = getStorage();
    for (i = 0, l = events.length; i < l; ++i) {
      for (key in events[i]) {
        uuid = key;
      }
      sendData(events[i][uuid], uuid);
    }
  };

  /**
   * Empties the storage
   */
  emptyStorage = function() {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
  };

  /**
   * Processes the event if all parameters were passed
   * @param  {String} type
   * @param  {Object} params Contains params to check against
   */
  processEvent = function(type, params) {
    var passes = false;
    if (passesConditions(type, params)) {
      pushEvent(params);
      passes = true;
    }
    return passes;
  };

  /**
   * Pushes the event to the localStorage and processes it
   * @param {Object} event The params coming from a public method
   */
  pushEvent = function(event) {
    var events, uuid, newEvent;

    events = getStorage() || [],
    uuid = generateUUID();
    if (!isArray(events)) {
      events = [ events ];
    }

    newEvent = {};
    newEvent[uuid] = event;
    events.push(newEvent);
    setStorage(events);
    processStorage();
  };

  /**
   * Sends the values to ATI
   * @param  {Object} event
   * @param  {String} uuid
   */
  sendData = function(event, uuid) {
    if (isObjectEmpty(event)) {
      emptyStorage();
      return;
    }

    if (isEventAudio(event) && event.action !== 'refresh') {
      handleAudioRefreshEvents(event);
    }

    var img = new Image();
    img.onload = function() {
      var storage = getStorage(),
          i, l, item, id;
      for (i = 0, l = storage.length; i < l; ++i) {
        item = storage[i];
        for (id in item) {
          if (this['data-ati-uuid'] === id) {
            delete item[id];
            if (isObjectEmpty(storage[0])) {
              emptyStorage();
            } else {
              setStorage(storage);
            }
            break;
          }
        }
      }
    };
    img['data-ati-uuid'] = uuid;
    img.src = getCombinedURL(event);
  };

  /**
   * Verifies if the passed event is audio
   * @param  {Object}  event
   * @return {Boolean}
   */
  isEventAudio = function(event) {
    return event.action && event.duration;
  };

  /**
   * Creates audio refresh events based on the sound duration to define an appropriate number of intervals
   * @param  {Object} event
   */
  handleAudioRefreshEvents = function(event) {
    var MIN_STEPS = 1,
        MAX_STEPS = 10,
        refreshSteps,
        refreshInterval;

    if (event.action === 'play') {
      refreshSteps    = Math.min( Math.max( Math.floor( 3/2 * Math.log(event.duration) - 1.5 ), MIN_STEPS ), MAX_STEPS );
      refreshInterval = Math.floor(event.duration / refreshSteps) * 1000;

      audioRefreshTimer = window.setInterval(function() {
        event.action = 'refresh';
        processEvent('audio', event);
      }, refreshInterval);

    } else {
      window.clearInterval(audioRefreshTimer);
    }
  };



  if (typeof module !== 'undefined' && module.exports) {
    module.exports = ATI;
  } else {
    window.SC = window.SC || {};
    window.SC.ATI = ATI;
  }

}());
