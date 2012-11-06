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
    initialized, siteId, subdomain,

    /* utilities helpers */
    isObjectEmpty, isArray,
    supportsLocalStorage, supportsJSON,

    /* formatting helpers */
    getDomain, getFormattedTime, getFormattedScreenProperties, getScreenSize, getCombinedURL,

    /* storage helpers */
    getStorage, setStorage, processStorage, resetStorage, sendData,

    /**
     * The name of the localStorage key we use
     * @type {String}
     */
    STORAGE_KEY = 'sc-ati-events-test',

    /**
     * Increases with each push and acts as a UUID
     * @type {Number}
     */
    counter = 0;

  ATI = {

    /**
     * Initializes the wrapper
     * @param {Object} params           Contains the mandatory initialization params
     * @param {Number} params.id        The ATI site ID
     * @param {String} params.subdomain The ATI subdomain, prefer the SSL variation.
     * @example
     *   ATI.init({
     *     id: 123456,
     *     subdomain: 'https://logs1234'
     *   });
     * @see ATI Documentation for more details about your Site ID and your subdomain.
     * @final
     */
    init: function(params) {
      var error, storage;

      if (initialized) {
        error = 'Already initialized';
      } else if (!params || !params.id || !params.subdomain) {
        error = 'Site id and subdomain are missing as parameters';
      }

      if (error) {
        throw new Error('ATI: ' + error);
      }

      if (supportsLocalStorage() && supportsJSON()) {
        siteId    = params.id;
        subdomain = params.subdomain;
        storage   = getStorage();

        if (storage && storage.length) {
          processStorage();
        } else {
          emptyStorage();
        }

        initialized = true;
      }
    },

    /**
     * Pushes data to the storage queue
     * @param {Object}   event          The data and options to send to ATI
     * @param {String}   event.page     The page 'foo' or as a chapter 'foo::bar'
     * @param {String=}  event.type     Defines the event type, defaults to 'A' for click
     * @param {String=}  event.level    Second Level ID, see ATI documentation for more details
     * @param {String=}  event.action   For audio events only: 'play'|'pause'|'refresh'
     * @param {String=}  event.duration For audio events only, in milliseconds
     * @example
     *   ATI.push({
     *     page  : 'foo::bar',
     *     type  : 'A',
     *     level : '1'
     *   });
     * @see ATI Documentation for more details about the event properties and values
     * @final
     */
    push: function(event) {
      var events, uuid, newEvent, error;

      if (!initialized) {
        error = 'the library needs to be initialized first';
      } else if (typeof event !== 'object') {
        error = 'only objects are accepted';
      } else if (!event.page) {
        error = 'page is missing in event';
      } else if (event.type === 'audio' && !event.action) {
        error = 'action is missing in event';
      }

      if (error) {
        throw new Error('ATI: ' + error);
      }

      /* if no level is passed it defaults to an empty string */
      event.level = event.level || '';

      events = getStorage() || [],
      uuid = ++counter;

      if (!isArray(events)) {
        events = [ events ];
      }

      newEvent = {};
      newEvent[uuid] = event;
      events.push(newEvent);
      setStorage(events);
      processStorage();
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
   * Combines specific subdomain with full ATI URL
   * @return {String}
   */
  getDomain = function() {
    return subdomain + '.xiti.com/hit.xiti?';
  };

  /**
   * Returns a specifically formatted string for ATI of the local time.
   * @return {String}
   */
  getFormattedTime = function() {
    var date = new Date();
    return [date.getHours(), date.getMinutes(), date.getSeconds()].join('x');
  };

  /**
   * Returns a specifically formatted string for ATI of some screen properties
   * @return {String}
   */
  getFormattedScreenProperties = function() {
    return [window.screen.availWidth, window.screen.availHeight, window.screen.pixelDepth, window.screen.colorDepth].join('x');
  };

  /**
   * Returns a specifically formatted string for ATI of screen resolution
   * @return {String}
   */
  getFormattedScreenSize = function() {
    return [window.screen.width, window.screen.height].join('x');
  };

  /**
   * Returns a valid URL for ATI's API by combining multiple query strings depending on the event type
   * @param  {Object} event The event that was passed by processStorage
   * @return {String} The URL to perform a GET request
   */
  getCombinedURL = function(event) {
    var url = getDomain();

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

    switch (event.type) {

      /* if no type is defined it counts as a page view */
      case undefined:
        url += '&ref=' + document.referrer;
        break;

      /* In case of a click — the type 'A' defines a click, yup. And allows for any other type like 'N'… see the doc */
      case 'A':
        url += '&clic=' + event.type;
        break;

      case 'audio':
        url += [
          'type='   + event.type,
          'a='      + event.action,
          'm1='     + event.duration,
          'm5=int',   /* We don't need to change that, all of our plays are internal */
          'm6=clip',  /* We don't need to change that, we always know the duration of the sound */
          'prich=',   // TODO
          's2rich='   // TODO
        ].join('&');
        break;

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
    var events = getStorage();
    for (var i = 0, l = events.length; i < l; ++i) {
      var uuid;
      for (var key in events[i]) {
        uuid = key;
      }
      sendData(events[0][uuid], uuid);
    }
  };

  /**
   * Empties the storage
   */
  emptyStorage = function() {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
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

    var img = new Image();
    img.onload = function() {
      var storage = getStorage();
      for (var i = 0, l = storage.length; i < l; ++i) {
        var item = storage[i];
        for (var id in item) {
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

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = ATI;
  } else {
    window.SC = window.SC || {};
    window.SC.ATI = ATI;
  }

})();
