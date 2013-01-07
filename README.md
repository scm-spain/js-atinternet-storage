If you're using http://www.atinternet-solutions.com for your analytic needs this might be of interest to you.

## Whaaa?

This library is an alternative to xtcore.js.

It allows you to perform very basic tracking tasks more easily.

## Why?

### Clearer public interface

Its interface is simpler and clearer, we only implemented what we need: tracking clicks, custom events, audio events, and setting custom site variables.

### More friendly

You can run it in traditional websites or modern single page applications.

Once loaded, ```ATI``` exports itself as a module in AMD contextes, or attaches itself as an object to the ```window``` object, it's that simple.

### More performant

```ATI``` integrates a mechanism to store events and process them right away.

If the request gets cancelled, ATI will process it on next page load or the next request, this way you never loose any data.

## Public Interface

To make sure you can rely on some documentation, we decided to not alter the way data is being presented.

### Initialize

This is the only mandatory step.

```javascript
ATI.initialize({
  id: '123456',
  subdomain: 'https://logs1234'
});
```

You will find these details in your admin page or the xtcore.js tracking code, your site id is ```window.xtsite``` and the subdomain ```window.xtsd```

### Page views

```javascript
ATI.triggerPageView({
  page  : 'foo', // The page 'http://soundcloud.com/bar' or as a chapter 'foo::http://soundcloud.com/bar'
  level : '1' // Second Level ID, see ATI documentation for more details
});
```

### Click events (custom events)

```javascript
ATI.triggerCustomEvent({
  type  : 'A', // 'A' === click… lookup ATI's documentation for other event types
  page  : 'foo', // The page 'http://soundcloud.com/bar' or as a chapter 'foo::http://soundcloud.com/bar'
  level : '1' // Second Level ID, see ATI documentation for more details
});
```

### Audio events

```javascript
ATI.triggerAudioEvent({
  page         : 'foo', // The playing sound's page
  level        : '1', // The playing sound's page level
  action       : 'play', // can also be pause or stop
  duration     : '123456', // in seconds
  contextPage  : 'bar', // Page where the play happened
  contextLevel : '2' // Second Level ID where the play happened
});
```

Audio events handle refresh events internally.

## Dependencies

None! — That's right.

## Compatibility

This code uses localStorage and JSON, if you need to support browsers that do not implement these technologies (like IE6, IE7, iOS,…) you might want to use some polyfills for them.

  * [JSON polyfill](https://github.com/douglascrockford/JSON-js)
  * [localStorage polyfill](https://developer.mozilla.org/en/DOM/Storage#Compatibility)
