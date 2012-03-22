/**
 * This file provides a localStorage wrapper for AT Internet click events
 */
ATI = {

  /**
   * The name of the localStorage item we set
   * @type {String}
   */
  name: 'ati-events',

  /**
   * Store data or reset the storage when nothing is passed
   * @param {String=} data String to store in localStorage
   */
  setStorage: function(data) {
    // make sure to get rid of empty objects
    if (data) {
      $.each(data, function(i, item) {
        if ($.isEmptyObject(item)) {
          if (data.length > 1) {
            data = data.splice(i, 1);
          } else {
            data = data.splice(0, 0);
          }
        }
      });
    }
    window.localStorage.setItem(this.name, JSON.stringify(data || []));
  },

  /**
   * Returns a stringified object of the storage
   * @return {String}
   */
  getStorage: function() {
    return JSON.parse(window.localStorage.getItem(this.name));
  },

  /**
   * Used by hasLocalStorage to store the result of initial storage access and prevent unecessary access
   * @private {boolean}
   */
  _hasLocalStorage: null,

  /**
   * Verifies if the browser supports localStorage
   * @return {boolean}
   */
  hasLocalStorage: function() {
    if (this._hasLocalStorage !== null) {
      return this._hasLocalStorage;
    }
    var hasLocalStorage = true;
    try {
      this.setStorage('1');
      window.localStorage.removeItem(this.name);
    } catch (error) {
      hasLocalStorage = false;
    }
    this._hasLocalStorage = hasLocalStorage;
    return hasLocalStorage;
  },

  /**
   * Initializes the wrapper
   * @final
   */
  init: function() {
    if (this.hasLocalStorage()) {
      this.setup();
    }
  },

  /**
   * Runs necessary events and functions after initialization
   */
  setup: function() {
    // content available? process it!
    if (this.getStorage() && this.getStorage().length) {
      this.process();
    } else {
      this.setStorage();
    }
  },

  /**
   * Procces the storage queue
   */
  process: function() {
    var events = this.getStorage(),
        that = this;
    $.each(events, function(i, event) {
      var uuid;
      for (var key in this) {
        uuid = key;
      }
      that.request(event[uuid], uuid);
    });
  },

  /**
   * Pushes data to the storage queue
   * @param {{page: String, type: String, level: String=}} event
   * @example
   *   ATI.push({
   *     page: 'box::login::login',
   *     level: l2Map['entry'],
   *     type: 'A'
   *   });
   */
  push: function(event) {
    if (!this.hasLocalStorage()) {
      return;
    }
    if (typeof event !== 'object') {
      throw new Error('ATI: Only objects are acceptable');
    }
    if (!event.page) {
      throw new Error('ATI: Page is missing in event');
    }
    if (!event.type) {
      throw new Error('ATI: Type is missing in event');
    }
    if (!window.xtsite) {
      throw new Error('ATI: window.xtsite is missing, check your maintag!');
    }
    if (!window.xtsd) {
      throw new Error('ATI: window.xtsd is missing, check your maintag!');
    }

    var stored = this.getStorage(),
        events = stored ? stored : [],
        uuid   = new Date().getTime();

    if (!$.isArray(events)) {
      events = [ events ];
    }
    var newEvent = {};
    newEvent[uuid] = event;
    events.push(newEvent);
    this.setStorage(events);
    this.process();
  },

  /**
   * Do a request to ATI servers
   */
  request: function(event, uuid) {
    var that   = this,
        $img   = $(new Image()),
        date   = new Date(),
        url    = window.xtsd + '.xiti.com/hit.xiti',
        time   = date.getHours() + 'x' + date.getMinutes() + 'x' + date.getSeconds(),
        screen = window.screen.width + 'x' + window.screen.height + 'x' + window.screen.pixelDepth + 'x' + window.screen.colorDepth,
        level  = event.level || '';
    $img
      .attr('src', url + '?s=' + window.xtsite + '&s2=' + level + '&p=' + event.page + '&clic=' + event.type + '&hl=' + time + '&r=' + screen)
      .attr('data-ati-uuid', uuid)
      // should probably be a className?
      .css({
        width:'1px',
        height:'1px',
        position:'absolute',
        left:'-9999em'
      })
      // make sure the request was done before removing it from the storage
      .bind('load', function() {
        var stored = that.getStorage();
        for (var key in stored) {
          var item = stored[key];
          for (var id in item) {
            if ($(this).attr('data-ati-uuid') === id) {
              delete item[id];
              that.setStorage(stored);
              $img.remove();
              break;
            }
          }
        }
      });
    $('body').append($img);
  }
};
