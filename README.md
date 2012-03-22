If you're using http://www.atinternet-solutions.com for your analytic needs this might be of interest to you.

## What's the issue?

AT Internet includes different methods to track click events, here are the two you'll most likely use:

  * ```xt_click```
  * ```xt_med```
  
### xt_click

The issue with ```xt_click``` is that you have to return this function in your event listener.

This is inconvenient if you're having existing listeners that already return values.

It is also a source of other issues, ```xt_click``` will hijack your link by :

  * preventing the default action;
  * using window.location to redirect you (might not work in situations like using pushState);
  * …

### xt_med

```xt_med``` on the other hand is pretty minimal and just fires a request to their servers.
The issue here is that this won't work either, since the browser will load the next page and cancel the ongoing request.

## What does the ATI Wrapper do?

It uses a mechanism that stores the click events and processes them right away.

If the page got reloaded and the request cancelled, it will still live in the storage and be processed on next page load.

## Example

Instead of using ```xt_med``` or ```xt_click``` to track click events, you can use ```ATI.push()```.

Instead of :

```javascript
xt_med('A', '1', 'foo');```

You would do :

```javascript
ATI.push({
  page : 'foo', // name or chapter
  level: '1',  // level
  type : 'A'    // type (as defined in their documentation)
});
```

## Depedencies

  * jQuery — You can easily replace it with DOM methods or any other library

You don't need xtcore.js only the main tag provided by AT Internet is necessary.

If you use other methods of AT Internet, you might want to leave xtcore.js in your project though, or just extend the wrapper to handle other types of events, page views, etc…

## Compatibility

This code uses localStorage and JSON, if you need to support browsers that don't include these (like IE6, IE7, iOS,…) you might want to use some polyfills for them.

  * [JSON polyfill](https://github.com/douglascrockford/JSON-js)
  * [localStorage polyfill](https://developer.mozilla.org/en/DOM/Storage#Compatibility)