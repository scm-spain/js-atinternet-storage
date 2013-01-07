window.SC.helperFn = {
  /**
   * Parse the values out of a query string
   * @param  {String} queryString
   * @return {Object} A map of the values
   * @example
   *    parseQueryString("foo=bar&fu=bah&fu=blah") ==> {
   *      foo: 'bar',
   *      fu: ['bah', 'blah']
   *    }
   */
  parseQueryString : function (queryString) {
    var query = {};
    if (queryString) {
      queryString.replace(/([^?=&]+)(?:=([^&]*))?/g, function(whole, key, val) {
        key = decodeURIComponent(key);
        val = decodeURIComponent((val || "").replace(/\+/g, ' '));

        switch (typeof query[key]) {
          case 'object':
            query[key].push(val);
            break;
          case 'undefined':
            query[key] = val;
            break;
          default:
            query[key] = [query[key], val];
        }
      });
    }
    return query;
  }
};
