/*!
 * @base: https://github.com/videojs/video.js
 *
 * @Source: cliplibrejs.dev.js
 *
 * @licstart  The following is the entire license notice for the
 *  JavaScript code in this page.
 *
 * Copyleft 2016 Jesus Eduardo
 *
 * The JavaScript code in this page is free software: you can
 * redistribute it and/or modify it under the terms of the GNU
 * General Public License (GNU GPL) as published by the Free Software
 * Foundation, either version 3 of the License, or (at your option)
 * any later version.  The code is distributed WITHOUT ANY WARRANTY;
 * without even the implied warranty of MERCHANTABILITY or FITNESS
 * FOR A PARTICULAR PURPOSE.  See the GNU GPL for more details.
 *
 * As additional permission under GNU GPL version 3 section 7, you
 * may distribute non-source (e.g., minimized or compacted) forms of
 * that code without the copy of the GNU GPL normally required by
 * section 4, provided you include this license notice and a URL
 * through which recipients can access the Corresponding Source.
 *
 * @licend  The above is the entire license notice
 * for the JavaScript code in this page.
 *
 */
/**
* @fileoverview Main function src.
*/

// HTML5 Shiv. Must be in <head> to support older browsers.
document.createElement('video');
document.createElement('audio');
document.createElement('track');

/**
* Doubles as the main function for users to create a player instance and also
* the main library object.
*
* @param  {String|Element} id      Video element or video element ID
* @param  {Object=} options        Optional options object for config/settings
* @param  {Function=} ready        Optional ready callback
* @return {librevjs.Player}             A player instance
* @namespace
*/
var librevjs = function(id, options, ready){
 var tag; // Element of ID

 // Allow for element or ID to be passed in
 // String ID
 if (typeof id === 'string') {

   // Adjust for jQuery ID syntax
   if (id.indexOf('#') === 0) {
     id = id.slice(1);
   }

   // If a player instance has already been created for this ID return it.
   if (librevjs.players[id]) {
     // If options or ready funtion are passed, warn
     if (options) {
     librevjs.log.warn ('Player "' + id + '" is already initialised. Options will not be applied.');
   }
   if (ready) {
     librevjs.players[id].ready(ready);
   }
     return librevjs.players[id];

   // Otherwise get element for ID
   } else {
     tag = librevjs.el(id);
   }

 // ID is a media element
 } else {
   tag = id;
 }

 // Check for a useable element
 if (!tag || !tag.nodeName) { // re: nodeName, could be a box div also
   throw new TypeError('The element or ID supplied is not valid. (cliplibrejs)'); // Returns
 }

 // Element may have a player attr referring to an already created player instance.
 // If not, set up a new player and return the instance.
 return tag['player'] || new librevjs.Player(tag, options, ready);
};

// Extended name, also available externally, window.cliplibrejs
var cliplibrejs = window['cliplibrejs'] = librevjs;

// CDN Version. Used to target right flash swf.
librevjs.CDN_VERSION = '1.2.0';
librevjs.ACCESS_PROTOCOL = ('https:' == document.location.protocol ? 'https://' : 'http://');

/**
* Global Player instance options, surfaced from librevjs.Player.prototype.options_
* librevjs.options = librevjs.Player.prototype.options_
* All options should use string keys so they avoid
* renaming by closure compiler
* @type {Object}
*/
librevjs.options = {
 // Default order of fallback technology
 'techOrder': ['html5','flash'],
 // techOrder: ['flash','html5'],

 'html5': {},
 'flash': {},

 // Default of web browser is 300x150. Should rely on source width/height.
 'width': 300,
 'height': 150,
 // defaultVolume: 0.85,
 'defaultVolume': 0.00, // The freakin seaguls are driving me crazy!

 // Included control sets
 'children': {
   'mediaLoader': {},
   'posterImage': {},
   'textTrackDisplay': {},
   'loadingSpinner': {},
   'bigPlayButton': {},
   'controlBar': {}
 },

 // Default message to show when a video cannot be played.
 'notSupportedMessage': 'No compatible source was found for this video.'
};

/**
* Global player list
* @type {Object}
*/
librevjs.players = {};
/**
* Core Object/Class for objects that use inheritance + constructors
* @constructor
*/
librevjs.CoreObject = librevjs['CoreObject'] = function(){};
// Manually exporting librevjs['CoreObject'] here for Closure Compiler
// because of the use of the extend/create class methods
// If we didn't do this, those functions would get flattend to something like
// `a = ...` and `this.prototype` would refer to the global object instead of
// CoreObject

/**
* Create a new object that inherits from this Object
* @param {Object} props Functions and properties to be applied to the
*                       new object's prototype
* @return {librevjs.CoreObject} Returns an object that inherits from CoreObject
* @this {*}
*/
librevjs.CoreObject.extend = function(props){
 var init, subObj;

 props = props || {};
 // Set up the constructor using the supplied init method
 // or using the init of the parent object
 // Make sure to check the unobfuscated version for external libs
 init = props['init'] || props.init || this.prototype['init'] || this.prototype.init || function(){};
 // In Resig's simple class inheritance (previously used) the constructor
 //  is a function that calls `this.init.apply(arguments)`
 // However that would prevent us from using `ParentObject.call(this);`
 //  in a Child constuctor because the `this` in `this.init`
 //  would still refer to the Child and cause an inifinite loop.
 // We would instead have to do
 //    `ParentObject.prototype.init.apply(this, argumnents);`
 //  Bleh. We're not creating a _super() function, so it's good to keep
 //  the parent constructor reference simple.
 subObj = function(){
   init.apply(this, arguments);
 };

 // Inherit from this object's prototype
 subObj.prototype = librevjs.obj.create(this.prototype);
 // Reset the constructor property for subObj otherwise
 // instances of subObj would have the constructor of the parent Object
 subObj.prototype.constructor = subObj;

 // Make the class extendable
 subObj.extend = librevjs.CoreObject.extend;
 // Make a function for creating instances
 subObj.create = librevjs.CoreObject.create;

 // Extend subObj's prototype with functions and other properties from props
 for (var name in props) {
   if (props.hasOwnProperty(name)) {
     subObj.prototype[name] = props[name];
   }
 }

 return subObj;
};

/**
* Create a new instace of this Object class
* @return {librevjs.CoreObject} Returns an instance of a CoreObject subclass
* @this {*}
*/
librevjs.CoreObject.create = function(){
 // Create a new object that inherits from this object's prototype
 var inst = librevjs.obj.create(this.prototype);

 // Apply this constructor function to the new object
 this.apply(inst, arguments);

 // Return the new object
 return inst;
};
/**
* @fileoverview Event System (John Resig - Secrets of a JS Ninja http://jsninja.com/)
* (Original book version wasn't completely usable, so fixed some things and made Closure Compiler compatible)
* This should work very similarly to jQuery's events, however it's based off the book version which isn't as
* robust as jquery's, so there's probably some differences.
*/

/**
* Add an event listener to element
* It stores the handler function in a separate cache object
* and adds a generic handler to the element's event,
* along with a unique id (guid) to the element.
* @param  {Element|Object}   elem Element or object to bind listeners to
* @param  {String}   type Type of event to bind to.
* @param  {Function} fn   Event listener.
*/
librevjs.on = function(elem, type, fn){
 var data = librevjs.getData(elem);

 // We need a place to store all our handler data
 if (!data.handlers) data.handlers = {};

 if (!data.handlers[type]) data.handlers[type] = [];

 if (!fn.guid) fn.guid = librevjs.guid++;

 data.handlers[type].push(fn);

 if (!data.dispatcher) {
   data.disabled = false;

   data.dispatcher = function (event){

     if (data.disabled) return;
     event = librevjs.fixEvent(event);

     var handlers = data.handlers[event.type];

     if (handlers) {
       // Copy handlers so if handlers are added/removed during the process it doesn't throw everything off.
       var handlersCopy = handlers.slice(0);

       for (var m = 0, n = handlersCopy.length; m < n; m++) {
         if (event.isImmediatePropagationStopped()) {
           break;
         } else {
           handlersCopy[m].call(elem, event);
         }
       }
     }
   };
 }

 if (data.handlers[type].length == 1) {
   if (document.addEventListener) {
     elem.addEventListener(type, data.dispatcher, false);
   } else if (document.attachEvent) {
     elem.attachEvent('on' + type, data.dispatcher);
   }
 }
};

/**
* Removes event listeners from an element
* @param  {Element|Object}   elem Object to remove listeners from
* @param  {String=}   type Type of listener to remove. Don't include to remove all events from element.
* @param  {Function} fn   Specific listener to remove. Don't incldue to remove listeners for an event type.
*/
librevjs.off = function(elem, type, fn) {
 // Don't want to add a cache object through getData if not needed
 if (!librevjs.hasData(elem)) return;

 var data = librevjs.getData(elem);

 // If no events exist, nothing to unbind
 if (!data.handlers) { return; }

 // Utility function
 var removeType = function(t){
    data.handlers[t] = [];
    librevjs.cleanUpEvents(elem,t);
 };

 // Are we removing all bound events?
 if (!type) {
   for (var t in data.handlers) removeType(t);
   return;
 }

 var handlers = data.handlers[type];

 // If no handlers exist, nothing to unbind
 if (!handlers) return;

 // If no listener was provided, remove all listeners for type
 if (!fn) {
   removeType(type);
   return;
 }

 // We're only removing a single handler
 if (fn.guid) {
   for (var n = 0; n < handlers.length; n++) {
     if (handlers[n].guid === fn.guid) {
       handlers.splice(n--, 1);
     }
   }
 }

 librevjs.cleanUpEvents(elem, type);
};

/**
* Clean up the listener cache and dispatchers
* @param  {Element|Object} elem Element to clean up
* @param  {String} type Type of event to clean up
*/
librevjs.cleanUpEvents = function(elem, type) {
 var data = librevjs.getData(elem);

 // Remove the events of a particular type if there are none left
 if (data.handlers[type].length === 0) {
   delete data.handlers[type];
   // data.handlers[type] = null;
   // Setting to null was causing an error with data.handlers

   // Remove the meta-handler from the element
   if (elem.removeEventListener) {
     elem.removeEventListener(type, data.dispatcher, false);
   } else if (elem.detachEvent) {
     elem.detachEvent('on' + type, data.dispatcher);
   }
 }

 // Remove the events object if there are no types left
 if (librevjs.isEmpty(data.handlers)) {
   delete data.handlers;
   delete data.dispatcher;
   delete data.disabled;

   // data.handlers = null;
   // data.dispatcher = null;
   // data.disabled = null;
 }

 // Finally remove the expando if there is no data left
 if (librevjs.isEmpty(data)) {
   librevjs.removeData(elem);
 }
};

/**
* Fix a native event to have standard property values
* @param  {Object} event Event object to fix
* @return {Object}
*/
librevjs.fixEvent = function(event) {

 function returnTrue() { return true; }
 function returnFalse() { return false; }

 // Test if fixing up is needed
 // Used to check if !event.stopPropagation instead of isPropagationStopped
 // But native events return true for stopPropagation, but don't have
 // other expected methods like isPropagationStopped. Seems to be a problem
 // with the Javascript Ninja code. So we're just overriding all events now.
 if (!event || !event.isPropagationStopped) {
   var old = event || window.event;

   event = {};
   // Clone the old object so that we can modify the values event = {};
   // IE8 Doesn't like when you mess with native event properties
   // Firefox returns false for event.hasOwnProperty('type') and other props
   //  which makes copying more difficult.
   // TODO: Probably best to create a whitelist of event props
   for (var key in old) {
     // Safari 6.0.3 warns you if you try to copy deprecated layerX/Y
     if (key !== 'layerX' && key !== 'layerY') {
       event[key] = old[key];
     }
   }

   // The event occurred on this element
   if (!event.target) {
     event.target = event.srcElement || document;
   }

   // Handle which other element the event is related to
   event.relatedTarget = event.fromElement === event.target ?
     event.toElement :
     event.fromElement;

   // Stop the default browser action
   event.preventDefault = function () {
     if (old.preventDefault) {
       old.preventDefault();
     }
     event.returnValue = false;
     event.isDefaultPrevented = returnTrue;
   };

   event.isDefaultPrevented = returnFalse;

   // Stop the event from bubbling
   event.stopPropagation = function () {
     if (old.stopPropagation) {
       old.stopPropagation();
     }
     event.cancelBubble = true;
     event.isPropagationStopped = returnTrue;
   };

   event.isPropagationStopped = returnFalse;

   // Stop the event from bubbling and executing other handlers
   event.stopImmediatePropagation = function () {
     if (old.stopImmediatePropagation) {
       old.stopImmediatePropagation();
     }
     event.isImmediatePropagationStopped = returnTrue;
     event.stopPropagation();
   };

   event.isImmediatePropagationStopped = returnFalse;

   // Handle mouse position
   if (event.clientX != null) {
     var doc = document.documentElement, body = document.body;

     event.pageX = event.clientX +
       (doc && doc.scrollLeft || body && body.scrollLeft || 0) -
       (doc && doc.clientLeft || body && body.clientLeft || 0);
     event.pageY = event.clientY +
       (doc && doc.scrollTop || body && body.scrollTop || 0) -
       (doc && doc.clientTop || body && body.clientTop || 0);
   }

   // Handle key presses
   event.which = event.charCode || event.keyCode;

   // Fix button for mouse clicks:
   // 0 == left; 1 == middle; 2 == right
   if (event.button != null) {
     event.button = (event.button & 1 ? 0 :
       (event.button & 4 ? 1 :
         (event.button & 2 ? 2 : 0)));
   }
 }

 // Returns fixed-up instance
 return event;
};

/**
* Trigger an event for an element
* @param  {Element|Object} elem  Element to trigger an event on
* @param  {String} event Type of event to trigger
*/
librevjs.trigger = function(elem, event) {
 // Fetches element data and a reference to the parent (for bubbling).
 // Don't want to add a data object to cache for every parent,
 // so checking hasData first.
 var elemData = (librevjs.hasData(elem)) ? librevjs.getData(elem) : {};
 var parent = elem.parentNode || elem.ownerDocument;
     // type = event.type || event,
     // handler;

 // If an event name was passed as a string, creates an event out of it
 if (typeof event === 'string') {
   event = { type:event, target:elem };
 }
 // Normalizes the event properties.
 event = librevjs.fixEvent(event);

 // If the passed element has a dispatcher, executes the established handlers.
 if (elemData.dispatcher) {
   elemData.dispatcher.call(elem, event);
 }

 // Unless explicitly stopped or the event does not bubble (e.g. media events)
   // recursively calls this function to bubble the event up the DOM.
   if (parent && !event.isPropagationStopped() && event.bubbles !== false) {
   librevjs.trigger(parent, event);

 // If at the top of the DOM, triggers the default action unless disabled.
 } else if (!parent && !event.isDefaultPrevented()) {
   var targetData = librevjs.getData(event.target);

   // Checks if the target has a default action for this event.
   if (event.target[event.type]) {
     // Temporarily disables event dispatching on the target as we have already executed the handler.
     targetData.disabled = true;
     // Executes the default action.
     if (typeof event.target[event.type] === 'function') {
       event.target[event.type]();
     }
     // Re-enables event dispatching.
     targetData.disabled = false;
   }
 }

 // Inform the triggerer if the default was prevented by returning false
 return !event.isDefaultPrevented();
 /* Original version of js ninja events wasn't complete.
  * We've since updated to the latest version, but keeping this around
  * for now just in case.
  */
 // // Added in attion to book. Book code was broke.
 // event = typeof event === 'object' ?
 //   event[librevjs.expando] ?
 //     event :
 //     new librevjs.Event(type, event) :
 //   new librevjs.Event(type);

 // event.type = type;
 // if (handler) {
 //   handler.call(elem, event);
 // }

 // // Clean up the event in case it is being reused
 // event.result = undefined;
 // event.target = elem;
};

/**
* Trigger a listener only once for an event
* @param  {Element|Object}   elem Element or object to
* @param  {[type]}   type [description]
* @param  {Function} fn   [description]
* @return {[type]}
*/
librevjs.one = function(elem, type, fn) {
 var func = function(){
   librevjs.off(elem, type, func);
   fn.apply(this, arguments);
 };
 func.guid = fn.guid = fn.guid || librevjs.guid++;
 librevjs.on(elem, type, func);
};
var hasOwnProp = Object.prototype.hasOwnProperty;

/**
* Creates an element and applies properties.
* @param  {String=} tagName    Name of tag to be created.
* @param  {Object=} properties Element properties to be applied.
* @return {Element}
*/
librevjs.createEl = function(tagName, properties){
 var el, propName;

 el = document.createElement(tagName || 'div');

 for (propName in properties){
   if (hasOwnProp.call(properties, propName)) {
     //el[propName] = properties[propName];
     // Not remembering why we were checking for dash
     // but using setAttribute means you have to use getAttribute

     // The check for dash checks for the aria-* attributes, like aria-label, aria-valuemin.
     // The additional check for "role" is because the default method for adding attributes does not
     // add the attribute "role". My guess is because it's not a valid attribute in some namespaces, although
     // browsers handle the attribute just fine. The W3C allows for aria-* attributes to be used in pre-HTML5 docs.
     // http://www.w3.org/TR/wai-aria-primer/#ariahtml. Using setAttribute gets around this problem.

      if (propName.indexOf('aria-') !== -1 || propName=='role') {
        el.setAttribute(propName, properties[propName]);
      } else {
        el[propName] = properties[propName];
      }
   }
 }
 return el;
};

/**
* Uppercase the first letter of a string
* @param  {String} string String to be uppercased
* @return {String}
*/
librevjs.capitalize = function(string){
 return string.charAt(0).toUpperCase() + string.slice(1);
};

/**
* Object functions container
* @type {Object}
*/
librevjs.obj = {};

/**
* Object.create shim for prototypal inheritance.
* https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/Object/create
* @param  {Object}   obj Object to use as prototype
*/
librevjs.obj.create = Object.create || function(obj){
 //Create a new function called 'F' which is just an empty object.
 function F() {}

 //the prototype of the 'F' function should point to the
 //parameter of the anonymous function.
 F.prototype = obj;

 //create a new constructor function based off of the 'F' function.
 return new F();
};

/**
* Loop through each property in an object and call a function
* whose arguments are (key,value)
* @param  {Object}   obj Object of properties
* @param  {Function} fn  Function to be called on each property.
* @this {*}
*/
librevjs.obj.each = function(obj, fn, context){
 for (var key in obj) {
   if (hasOwnProp.call(obj, key)) {
     fn.call(context || this, key, obj[key]);
   }
 }
};

/**
* Merge two objects together and return the original.
* @param  {Object} obj1
* @param  {Object} obj2
* @return {Object}
*/
librevjs.obj.merge = function(obj1, obj2){
 if (!obj2) { return obj1; }
 for (var key in obj2){
   if (hasOwnProp.call(obj2, key)) {
     obj1[key] = obj2[key];
   }
 }
 return obj1;
};

/**
* Merge two objects, and merge any properties that are objects
* instead of just overwriting one. Uses to merge options hashes
* where deeper default settings are important.
* @param  {Object} obj1 Object to override
* @param  {Object} obj2 Overriding object
* @return {Object}      New object. Obj1 and Obj2 will be untouched.
*/
librevjs.obj.deepMerge = function(obj1, obj2){
 var key, val1, val2;

 // make a copy of obj1 so we're not ovewriting original values.
 // like prototype.options_ and all sub options objects
 obj1 = librevjs.obj.copy(obj1);

 for (key in obj2){
   if (hasOwnProp.call(obj2, key)) {
     val1 = obj1[key];
     val2 = obj2[key];

     // Check if both properties are pure objects and do a deep merge if so
     if (librevjs.obj.isPlain(val1) && librevjs.obj.isPlain(val2)) {
       obj1[key] = librevjs.obj.deepMerge(val1, val2);
     } else {
       obj1[key] = obj2[key];
     }
   }
 }
 return obj1;
};

/**
* Make a copy of the supplied object
* @param  {Object} obj Object to copy
* @return {Object}     Copy of object
*/
librevjs.obj.copy = function(obj){
 return librevjs.obj.merge({}, obj);
};

/**
* Check if an object is plain, and not a dom node or any object sub-instance
* @param  {Object} obj Object to check
* @return {Boolean}     True if plain, false otherwise
*/
librevjs.obj.isPlain = function(obj){
 return !!obj
   && typeof obj === 'object'
   && obj.toString() === '[object Object]'
   && obj.constructor === Object;
};

/**
* Bind (a.k.a proxy or Context). A simple method for changing the context of a function
  It also stores a unique id on the function so it can be easily removed from events
* @param  {*}   context The object to bind as scope
* @param  {Function} fn      The function to be bound to a scope
* @param  {Number=}   uid     An optional unique ID for the function to be set
* @return {Function}
*/
librevjs.bind = function(context, fn, uid) {
 // Make sure the function has a unique ID
 if (!fn.guid) { fn.guid = librevjs.guid++; }

 // Create the new function that changes the context
 var ret = function() {
   return fn.apply(context, arguments);
 };

 // Allow for the ability to individualize this function
 // Needed in the case where multiple objects might share the same prototype
 // IF both items add an event listener with the same function, then you try to remove just one
 // it will remove both because they both have the same guid.
 // when using this, you need to use the bind method when you remove the listener as well.
 // currently used in text tracks
 ret.guid = (uid) ? uid + '_' + fn.guid : fn.guid;

 return ret;
};

/**
* Element Data Store. Allows for binding data to an element without putting it directly on the element.
* Ex. Event listneres are stored here.
* (also from jsninja.com, slightly modified and updated for closure compiler)
* @type {Object}
*/
librevjs.cache = {};

/**
* Unique ID for an element or function
* @type {Number}
*/
librevjs.guid = 1;

/**
* Unique attribute name to store an element's guid in
* @type {String}
* @constant
*/
librevjs.expando = 'vdata' + (new Date()).getTime();

/**
* Returns the cache object where data for an element is stored
* @param  {Element} el Element to store data for.
* @return {Object}
*/
librevjs.getData = function(el){
 var id = el[librevjs.expando];
 if (!id) {
   id = el[librevjs.expando] = librevjs.guid++;
   librevjs.cache[id] = {};
 }
 return librevjs.cache[id];
};

/**
* Returns the cache object where data for an element is stored
* @param  {Element} el Element to store data for.
* @return {Object}
*/
librevjs.hasData = function(el){
 var id = el[librevjs.expando];
 return !(!id || librevjs.isEmpty(librevjs.cache[id]));
};

/**
* Delete data for the element from the cache and the guid attr from getElementById
* @param  {Element} el Remove data for an element
*/
librevjs.removeData = function(el){
 var id = el[librevjs.expando];
 if (!id) { return; }
 // Remove all stored data
 // Changed to = null
 // http://coding.smashingmagazine.com/2012/11/05/writing-fast-memory-efficient-javascript/
 // librevjs.cache[id] = null;
 delete librevjs.cache[id];

 // Remove the expando property from the DOM node
 try {
   delete el[librevjs.expando];
 } catch(e) {
   if (el.removeAttribute) {
     el.removeAttribute(librevjs.expando);
   } else {
     // IE doesn't appear to support removeAttribute on the document element
     el[librevjs.expando] = null;
   }
 }
};

librevjs.isEmpty = function(obj) {
 for (var prop in obj) {
   // Inlude null properties as empty.
   if (obj[prop] !== null) {
     return false;
   }
 }
 return true;
};

/**
* Add a CSS class name to an element
* @param {Element} element    Element to add class name to
* @param {String} classToAdd Classname to add
*/
librevjs.addClass = function(element, classToAdd){
 if ((' '+element.className+' ').indexOf(' '+classToAdd+' ') == -1) {
   element.className = element.className === '' ? classToAdd : element.className + ' ' + classToAdd;
 }
};

/**
* Remove a CSS class name from an element
* @param {Element} element    Element to remove from class name
* @param {String} classToAdd Classname to remove
*/
librevjs.removeClass = function(element, classToRemove){
 var classNames, i;

 if (element.className.indexOf(classToRemove) == -1) { return; }

 classNames = element.className.split(' ');

 // no arr.indexOf in ie8, and we don't want to add a big shim
 for (i = classNames.length - 1; i >= 0; i--) {
   if (classNames[i] === classToRemove) {
     classNames.splice(i,1);
   }
 }

 element.className = classNames.join(' ');
};

/**
* Element for testing browser HTML5 video capabilities
* @type {Element}
* @constant
*/
librevjs.TEST_VID = librevjs.createEl('video');

/**
* Useragent for browser testing.
* @type {String}
* @constant
*/
librevjs.USER_AGENT = navigator.userAgent;

/**
* Device is an iPhone
* @type {Boolean}
* @constant
*/
librevjs.IS_IPHONE = (/iPhone/i).test(librevjs.USER_AGENT);
librevjs.IS_IPAD = (/iPad/i).test(librevjs.USER_AGENT);
librevjs.IS_IPOD = (/iPod/i).test(librevjs.USER_AGENT);
librevjs.IS_IOS = librevjs.IS_IPHONE || librevjs.IS_IPAD || librevjs.IS_IPOD;

librevjs.IOS_VERSION = (function(){
 var match = librevjs.USER_AGENT.match(/OS (\d+)_/i);
 if (match && match[1]) { return match[1]; }
})();

librevjs.IS_ANDROID = (/Android/i).test(librevjs.USER_AGENT);
librevjs.ANDROID_VERSION = (function() {
 // This matches Android Major.Minor.Patch versions
 // ANDROID_VERSION is Major.Minor as a Number, if Minor isn't available, then only Major is returned
 var match = librevjs.USER_AGENT.match(/Android (\d+)(?:\.(\d+))?(?:\.(\d+))*/i),
   major,
   minor;

 if (!match) {
   return null;
 }

 major = match[1] && parseFloat(match[1]);
 minor = match[2] && parseFloat(match[2]);

 if (major && minor) {
   return parseFloat(match[1] + '.' + match[2]);
 } else if (major) {
   return major;
 } else {
   return null;
 }
})();
// Old Android is defined as Version older than 2.3, and requiring a webkit version of the android browser
librevjs.IS_OLD_ANDROID = librevjs.IS_ANDROID && (/webkit/i).test(librevjs.USER_AGENT) && librevjs.ANDROID_VERSION < 2.3;

librevjs.IS_FIREFOX = (/Firefox/i).test(librevjs.USER_AGENT);
librevjs.IS_CHROME = (/Chrome/i).test(librevjs.USER_AGENT);

librevjs.TOUCH_ENABLED = ('ontouchstart' in window);

/**
* Get an element's attribute values, as defined on the HTML tag
* Attributs are not the same as properties. They're defined on the tag
* or with setAttribute (which shouldn't be used with HTML)
* This will return true or false for boolean attributes.
* @param  {Element} tag Element from which to get tag attributes
* @return {Object}
*/
librevjs.getAttributeValues = function(tag){
 var obj, knownBooleans, attrs, attrName, attrVal;

 obj = {};

 // known boolean attributes
 // we can check for matching boolean properties, but older browsers
 // won't know about HTML5 boolean attributes that we still read from
 knownBooleans = ','+'autoplay,controls,loop,muted,default'+',';

 if (tag && tag.attributes && tag.attributes.length > 0) {
   attrs = tag.attributes;

   for (var i = attrs.length - 1; i >= 0; i--) {
     attrName = attrs[i].name;
     attrVal = attrs[i].value;

     // check for known booleans
     // the matching element property will return a value for typeof
     if (typeof tag[attrName] === 'boolean' || knownBooleans.indexOf(','+attrName+',') !== -1) {
       // the value of an included boolean attribute is typically an empty
       // string ('') which would equal false if we just check for a false value.
       // we also don't want support bad code like autoplay='false'
       attrVal = (attrVal !== null) ? true : false;
     }

     obj[attrName] = attrVal;
   }
 }

 return obj;
};

/**
* Get the computed style value for an element
* From http://robertnyman.com/2006/04/24/get-the-rendered-style-of-an-element/
* @param  {Element} el        Element to get style value for
* @param  {String} strCssRule Style name
* @return {String}            Style value
*/
librevjs.getComputedDimension = function(el, strCssRule){
 var strValue = '';
 if(document.defaultView && document.defaultView.getComputedStyle){
   strValue = document.defaultView.getComputedStyle(el, '').getPropertyValue(strCssRule);

 } else if(el.currentStyle){
   // IE8 Width/Height support
   strValue = el['client'+strCssRule.substr(0,1).toUpperCase() + strCssRule.substr(1)] + 'px';
 }
 return strValue;
};

/**
* Insert an element as the first child node of another
* @param  {Element} child   Element to insert
* @param  {[type]} parent Element to insert child into
*/
librevjs.insertFirst = function(child, parent){
 if (parent.firstChild) {
   parent.insertBefore(child, parent.firstChild);
 } else {
   parent.appendChild(child);
 }
};

/**
* Object to hold browser support information
* @type {Object}
*/
librevjs.support = {};

/**
* Shorthand for document.getElementById()
* Also allows for CSS (jQuery) ID syntax. But nothing other than IDs.
* @param  {String} id  Element ID
* @return {Element}    Element with supplied ID
*/
librevjs.el = function(id){
 if (id.indexOf('#') === 0) {
   id = id.slice(1);
 }

 return document.getElementById(id);
};

/**
* Format seconds as a time string, H:MM:SS or M:SS
* Supplying a guide (in seconds) will force a number of leading zeros
* to cover the length of the guide
* @param  {Number} seconds Number of seconds to be turned into a string
* @param  {Number} guide   Number (in seconds) to model the string after
* @return {String}         Time formatted as H:MM:SS or M:SS
*/
librevjs.formatTime = function(seconds, guide) {
 // Default to using seconds as guide
 guide = guide || seconds;
 var s = Math.floor(seconds % 60),
     m = Math.floor(seconds / 60 % 60),
     h = Math.floor(seconds / 3600),
     gm = Math.floor(guide / 60 % 60),
     gh = Math.floor(guide / 3600);

 // handle invalid times
 if (isNaN(seconds) || seconds === Infinity) {
   // '-' is false for all relational operators (e.g. <, >=) so this setting
   // will add the minimum number of fields specified by the guide
   h = m = s = '-';
 }

 // Check if we need to show hours
 h = (h > 0 || gh > 0) ? h + ':' : '';

 // If hours are showing, we may need to add a leading zero.
 // Always show at least one digit of minutes.
 m = (((h || gm >= 10) && m < 10) ? '0' + m : m) + ':';

 // Check if leading zero is need for seconds
 s = (s < 10) ? '0' + s : s;

 return h + m + s;
};

// Attempt to block the ability to select text while dragging controls
librevjs.blockTextSelection = function(){
 document.body.focus();
 document.onselectstart = function () { return false; };
};
// Turn off text selection blocking
librevjs.unblockTextSelection = function(){ document.onselectstart = function () { return true; }; };

/**
* Trim whitespace from the ends of a string.
* @param  {String} string String to trim
* @return {String}        Trimmed string
*/
librevjs.trim = function(str){
 return (str+'').replace(/^\s+|\s+$/g, '');
};

/**
* Should round off a number to a decimal place
* @param  {Number} num Number to round
* @param  {Number} dec Number of decimal places to round to
* @return {Number}     Rounded number
*/
librevjs.round = function(num, dec) {
 if (!dec) { dec = 0; }
 return Math.round(num*Math.pow(10,dec))/Math.pow(10,dec);
};

/**
* Should create a fake TimeRange object
* Mimics an HTML5 time range instance, which has functions that
* return the start and end times for a range
* TimeRanges are returned by the buffered() method
* @param  {Number} start Start time in seconds
* @param  {Number} end   End time in seconds
* @return {Object}       Fake TimeRange object
*/
librevjs.createTimeRange = function(start, end){
 return {
   length: 1,
   start: function() { return start; },
   end: function() { return end; }
 };
};

/**
* Simple http request for retrieving external files (e.g. text tracks)
* @param  {String} url           URL of resource
* @param  {Function=} onSuccess  Success callback
* @param  {Function=} onError    Error callback
*/
librevjs.get = function(url, onSuccess, onError){
 var local, request;

 if (typeof XMLHttpRequest === 'undefined') {
   window.XMLHttpRequest = function () {
     try { return new window.ActiveXObject('Msxml2.XMLHTTP.6.0'); } catch (e) {}
     try { return new window.ActiveXObject('Msxml2.XMLHTTP.3.0'); } catch (f) {}
     try { return new window.ActiveXObject('Msxml2.XMLHTTP'); } catch (g) {}
     throw new Error('This browser does not support XMLHttpRequest.');
   };
 }

 request = new XMLHttpRequest();
 try {
   request.open('GET', url);
 } catch(e) {
   onError(e);
 }

 local = (url.indexOf('file:') === 0 || (window.location.href.indexOf('file:') === 0 && url.indexOf('http') === -1));

 request.onreadystatechange = function() {
   if (request.readyState === 4) {
     if (request.status === 200 || local && request.status === 0) {
       onSuccess(request.responseText);
     } else {
       if (onError) {
         onError();
       }
     }
   }
 };

 try {
   request.send();
 } catch(e) {
   if (onError) {
     onError(e);
   }
 }
};

/* Local Storage
================================================================================ */
librevjs.setLocalStorage = function(key, value){
 try {
   // IE was throwing errors referencing the var anywhere without this
   var localStorage = window.localStorage || false;
   if (!localStorage) { return; }
   localStorage[key] = value;
 } catch(e) {
   if (e.code == 22 || e.code == 1014) { // Webkit == 22 / Firefox == 1014
     librevjs.log('LocalStorage Full (LibreVideoJS)', e);
   } else {
     if (e.code == 18) {
       librevjs.log('LocalStorage not allowed (LibreVideoJS)', e);
     } else {
       librevjs.log('LocalStorage Error (LibreVideoJS)', e);
     }
   }
 }
};

/**
* Get abosolute version of relative URL. Used to tell flash correct URL.
* http://stackoverflow.com/questions/470832/getting-an-absolute-url-from-a-relative-one-ie6-issue
* @param  {String} url URL to make absolute
* @return {String}     Absolute URL
*/
librevjs.getAbsoluteURL = function(url){

 // Check if absolute URL
 if (!url.match(/^https?:\/\//)) {
   // Convert to absolute URL. Flash hosted off-site needs an absolute URL.
   url = librevjs.createEl('div', {
     innerHTML: '<a href="'+url+'">x</a>'
   }).firstChild.href;
 }

 return url;
};

// usage: log('inside coolFunc',this,arguments);
// http://paulirish.com/2009/log-a-lightweight-wrapper-for-consolelog/
librevjs.log = function(){
 librevjs.log.history = librevjs.log.history || [];   // store logs to an array for reference
 librevjs.log.history.push(arguments);
 if(window.console){
   window.console.log(Array.prototype.slice.call(arguments));
 }
};

// Offset Left
// getBoundingClientRect technique from John Resig http://ejohn.org/blog/getboundingclientrect-is-awesome/
librevjs.findPosition = function(el) {
   var box, docEl, body, clientLeft, scrollLeft, left, clientTop, scrollTop, top;

   if (el.getBoundingClientRect && el.parentNode) {
     box = el.getBoundingClientRect();
   }

   if (!box) {
     return {
       left: 0,
       top: 0
     };
   }

   docEl = document.documentElement;
   body = document.body;

   clientLeft = docEl.clientLeft || body.clientLeft || 0;
   scrollLeft = window.pageXOffset || body.scrollLeft;
   left = box.left + scrollLeft - clientLeft;

   clientTop = docEl.clientTop || body.clientTop || 0;
   scrollTop = window.pageYOffset || body.scrollTop;
   top = box.top + scrollTop - clientTop;

   return {
     left: left,
     top: top
   };
};
/**
* @fileoverview Player Component - Base class for all UI objects
*
*/

/**
* Base UI Component class
* @param {Object} player  Main Player
* @param {Object=} options
* @constructor
*/
librevjs.Component = librevjs.CoreObject.extend({
 /** @constructor */
 init: function(player, options, ready){
   this.player_ = player;

   // Make a copy of prototype.options_ to protect against overriding global defaults
   this.options_ = librevjs.obj.copy(this.options_);

   // Updated options with supplied options
   options = this.options(options);

   // Get ID from options, element, or create using player ID and unique ID
   this.id_ = options['id'] || ((options['el'] && options['el']['id']) ? options['el']['id'] : player.id() + '_component_' + librevjs.guid++ );

   this.name_ = options['name'] || null;

   // Create element if one wasn't provided in options
   this.el_ = options['el'] || this.createEl();

   this.children_ = [];
   this.childIndex_ = {};
   this.childNameIndex_ = {};

   // Add any child components in options
   this.initChildren();

   this.ready(ready);
   // Don't want to trigger ready here or it will before init is actually
   // finished for all children that run this constructor
 }
});

/**
* Dispose of the component and all child components.
*/
librevjs.Component.prototype.dispose = function(){
 this.trigger('dispose');

 // Dispose all children.
 if (this.children_) {
   for (var i = this.children_.length - 1; i >= 0; i--) {
     if (this.children_[i].dispose) {
       this.children_[i].dispose();
     }
   }
 }

 // Delete child references
 this.children_ = null;
 this.childIndex_ = null;
 this.childNameIndex_ = null;

 // Remove all event listeners.
 this.off();

 // Remove element from DOM
 if (this.el_.parentNode) {
   this.el_.parentNode.removeChild(this.el_);
 }

 librevjs.removeData(this.el_);
 this.el_ = null;
};

/**
* Reference to main player instance.
* @type {librevjs.Player}
* @private
*/
librevjs.Component.prototype.player_;

/**
* Return the component's player.
* @return {librevjs.Player}
*/
librevjs.Component.prototype.player = function(){
 return this.player_;
};

/**
* Component options object.
* @type {Object}
* @private
*/
librevjs.Component.prototype.options_;

/**
* Deep merge of options objects
* Whenever a property is an object on both options objects
* the two properties will be merged using librevjs.obj.deepMerge.
*
* This is used for merging options for child components. We
* want it to be easy to override individual options on a child
* component without having to rewrite all the other default options.
*
* Parent.prototype.options_ = {
*   children: {
*     'childOne': { 'foo': 'bar', 'asdf': 'fdsa' },
*     'childTwo': {},
*     'childThree': {}
*   }
* }
* newOptions = {
*   children: {
*     'childOne': { 'foo': 'baz', 'abc': '123' }
*     'childTwo': null,
*     'childFour': {}
*   }
* }
*
* this.options(newOptions);
*
* RESULT
*
* {
*   children: {
*     'childOne': { 'foo': 'baz', 'asdf': 'fdsa', 'abc': '123' },
*     'childTwo': null, // Disabled. Won't be initialized.
*     'childThree': {},
*     'childFour': {}
*   }
* }
*
* @param  {Object} obj Object whose values will be overwritten
* @return {Object}      NEW merged object. Does not return obj1.
*/
librevjs.Component.prototype.options = function(obj){
 if (obj === undefined) return this.options_;

 return this.options_ = librevjs.obj.deepMerge(this.options_, obj);
};

/**
* The DOM element for the component.
* @type {Element}
* @private
*/
librevjs.Component.prototype.el_;

/**
* Create the component's DOM element.
* @param  {String=} tagName  Element's node type. e.g. 'div'
* @param  {Object=} attributes An object of element attributes that should be set on the element.
* @return {Element}
*/
librevjs.Component.prototype.createEl = function(tagName, attributes){
 return librevjs.createEl(tagName, attributes);
};

/**
* Return the component's DOM element.
* @return {Element}
*/
librevjs.Component.prototype.el = function(){
 return this.el_;
};

/**
* An optional element where, if defined, children will be inserted
*   instead of directly in el_
* @type {Element}
* @private
*/
librevjs.Component.prototype.contentEl_;

/**
* Return the component's DOM element for embedding content.
*   will either be el_ or a new element defined in createEl
* @return {Element}
*/
librevjs.Component.prototype.contentEl = function(){
 return this.contentEl_ || this.el_;
};

/**
* The ID for the component.
* @type {String}
* @private
*/
librevjs.Component.prototype.id_;

/**
* Return the component's ID.
* @return {String}
*/
librevjs.Component.prototype.id = function(){
 return this.id_;
};

/**
* The name for the component. Often used to reference the component.
* @type {String}
* @private
*/
librevjs.Component.prototype.name_;

/**
* Return the component's ID.
* @return {String}
*/
librevjs.Component.prototype.name = function(){
 return this.name_;
};

/**
* Array of child components
* @type {Array}
* @private
*/
librevjs.Component.prototype.children_;

/**
* Returns array of all child components.
* @return {Array}
*/
librevjs.Component.prototype.children = function(){
 return this.children_;
};

/**
* Object of child components by ID
* @type {Object}
* @private
*/
librevjs.Component.prototype.childIndex_;

/**
* Returns a child component with the provided ID.
* @return {Array}
*/
librevjs.Component.prototype.getChildById = function(id){
 return this.childIndex_[id];
};

/**
* Object of child components by Name
* @type {Object}
* @private
*/
librevjs.Component.prototype.childNameIndex_;

/**
* Returns a child component with the provided ID.
* @return {Array}
*/
librevjs.Component.prototype.getChild = function(name){
 return this.childNameIndex_[name];
};

/**
* Adds a child component inside this component.
* @param {String|librevjs.Component} child The class name or instance of a child to add.
* @param {Object=} options Optional options, including options to be passed to
*  children of the child.
* @return {librevjs.Component} The child component, because it might be created in this process.
* @suppress {accessControls|checkRegExp|checkTypes|checkVars|const|constantProperty|deprecated|duplicate|es5Strict|fileoverviewTags|globalThis|invalidCasts|missingProperties|nonStandardJsDocs|strictModuleDepCheck|undefinedNames|undefinedVars|unknownDefines|uselessCode|visibility}
*/
librevjs.Component.prototype.addChild = function(child, options){
 var component, componentClass, componentName, componentId;

 // If string, create new component with options
 if (typeof child === 'string') {

   componentName = child;

   // Make sure options is at least an empty object to protect against errors
   options = options || {};

   // Assume name of set is a lowercased name of the UI Class (PlayButton, etc.)
   componentClass = options['componentClass'] || librevjs.capitalize(componentName);

   // Set name through options
   options['name'] = componentName;

   // Create a new object & element for this controls set
   // If there's no .player_, this is a player
   // Closure Compiler throws an 'incomplete alias' warning if we use the librevjs variable directly.
   // Every class should be exported, so this should never be a problem here.
   component = new window['cliplibrejs'][componentClass](this.player_ || this, options);

 // child is a component instance
 } else {
   component = child;
 }

 this.children_.push(component);

 if (typeof component.id === 'function') {
   this.childIndex_[component.id()] = component;
 }

 // If a name wasn't used to create the component, check if we can use the
 // name function of the component
 componentName = componentName || (component.name && component.name());

 if (componentName) {
   this.childNameIndex_[componentName] = component;
 }

 // Add the UI object's element to the container div (box)
 // Having an element is not required
 if (typeof component['el'] === 'function' && component['el']()) {
   this.contentEl().appendChild(component['el']());
 }

 // Return so it can stored on parent object if desired.
 return component;
};

librevjs.Component.prototype.removeChild = function(component){
 if (typeof component === 'string') {
   component = this.getChild(component);
 }

 if (!component || !this.children_) return;

 var childFound = false;
 for (var i = this.children_.length - 1; i >= 0; i--) {
   if (this.children_[i] === component) {
     childFound = true;
     this.children_.splice(i,1);
     break;
   }
 }

 if (!childFound) return;

 this.childIndex_[component.id] = null;
 this.childNameIndex_[component.name] = null;

 var compEl = component.el();
 if (compEl && compEl.parentNode === this.contentEl()) {
   this.contentEl().removeChild(component.el());
 }
};

/**
* Initialize default child components from options
*/
librevjs.Component.prototype.initChildren = function(){
 var options = this.options_;

 if (options && options['children']) {
   var self = this;

   // Loop through components and add them to the player
   librevjs.obj.each(options['children'], function(name, opts){
     // Allow for disabling default components
     // e.g. librevjs.options['children']['posterImage'] = false
     if (opts === false) return;

     // Allow waiting to add components until a specific event is called
     var tempAdd = function(){
       // Set property name on player. Could cause conflicts with other prop names, but it's worth making refs easy.
       self[name] = self.addChild(name, opts);
     };

     if (opts['loadEvent']) {
       // this.one(opts.loadEvent, tempAdd)
     } else {
       tempAdd();
     }
   });
 }
};

librevjs.Component.prototype.buildCSSClass = function(){
   // Child classes can include a function that does:
   // return 'CLASS NAME' + this._super();
   return '';
};

/* Events
============================================================================= */

/**
* Add an event listener to this component's element. Context will be the component.
* @param  {String}   type Event type e.g. 'click'
* @param  {Function} fn   Event listener
* @return {librevjs.Component}
*/
librevjs.Component.prototype.on = function(type, fn){
 librevjs.on(this.el_, type, librevjs.bind(this, fn));
 return this;
};

/**
* Remove an event listener from the component's element
* @param  {String=}   type Optional event type. Without type it will remove all listeners.
* @param  {Function=} fn   Optional event listener. Without fn it will remove all listeners for a type.
* @return {librevjs.Component}
*/
librevjs.Component.prototype.off = function(type, fn){
 librevjs.off(this.el_, type, fn);
 return this;
};

/**
* Add an event listener to be triggered only once and then removed
* @param  {String}   type Event type
* @param  {Function} fn   Event listener
* @return {librevjs.Component}
*/
librevjs.Component.prototype.one = function(type, fn) {
 librevjs.one(this.el_, type, librevjs.bind(this, fn));
 return this;
};

/**
* Trigger an event on an element
* @param  {String} type  Event type to trigger
* @param  {Event|Object} event Event object to be passed to the listener
* @return {librevjs.Component}
*/
librevjs.Component.prototype.trigger = function(type, event){
 librevjs.trigger(this.el_, type, event);
 return this;
};

/* Ready
================================================================================ */
/**
* Is the component loaded.
* @type {Boolean}
* @private
*/
librevjs.Component.prototype.isReady_;

/**
* Trigger ready as soon as initialization is finished.
*   Allows for delaying ready. Override on a sub class prototype.
*   If you set this.isReadyOnInitFinish_ it will affect all components.
*   Specially used when waiting for the Flash player to asynchrnously load.
*   @type {Boolean}
*   @private
*/
librevjs.Component.prototype.isReadyOnInitFinish_ = true;

/**
* List of ready listeners
* @type {Array}
* @private
*/
librevjs.Component.prototype.readyQueue_;

/**
* Bind a listener to the component's ready state.
*   Different from event listeners in that if the ready event has already happend
*   it will trigger the function immediately.
* @param  {Function} fn Ready listener
* @return {librevjs.Component}
*/
librevjs.Component.prototype.ready = function(fn){
 if (fn) {
   if (this.isReady_) {
     fn.call(this);
   } else {
     if (this.readyQueue_ === undefined) {
       this.readyQueue_ = [];
     }
     this.readyQueue_.push(fn);
   }
 }
 return this;
};

/**
* Trigger the ready listeners
* @return {librevjs.Component}
*/
librevjs.Component.prototype.triggerReady = function(){
 this.isReady_ = true;

 var readyQueue = this.readyQueue_;

 if (readyQueue && readyQueue.length > 0) {

   for (var i = 0, j = readyQueue.length; i < j; i++) {
     readyQueue[i].call(this);
   }

   // Reset Ready Queue
   this.readyQueue_ = [];

   // Allow for using event listeners also, in case you want to do something everytime a source is ready.
   this.trigger('ready');
 }
};

/* Display
============================================================================= */

/**
* Add a CSS class name to the component's element
* @param {String} classToAdd Classname to add
* @return {librevjs.Component}
*/
librevjs.Component.prototype.addClass = function(classToAdd){
 librevjs.addClass(this.el_, classToAdd);
 return this;
};

/**
* Remove a CSS class name from the component's element
* @param {String} classToRemove Classname to remove
* @return {librevjs.Component}
*/
librevjs.Component.prototype.removeClass = function(classToRemove){
 librevjs.removeClass(this.el_, classToRemove);
 return this;
};

/**
* Show the component element if hidden
* @return {librevjs.Component}
*/
librevjs.Component.prototype.show = function(){
 this.el_.style.display = 'block';
 return this;
};

/**
* Hide the component element if hidden
* @return {librevjs.Component}
*/
librevjs.Component.prototype.hide = function(){
 this.el_.style.display = 'none';
 return this;
};

/**
* Lock an item in its visible state. To be used with fadeIn/fadeOut.
* @return {librevjs.Component}
*/
librevjs.Component.prototype.lockShowing = function(){
 this.addClass('librevjs-lock-showing');
 return this;
};

/**
* Unlock an item to be hidden. To be used with fadeIn/fadeOut.
* @return {librevjs.Component}
*/
librevjs.Component.prototype.unlockShowing = function(){
 this.removeClass('librevjs-lock-showing');
 return this;
};

/**
* Disable component by making it unshowable
*/
librevjs.Component.prototype.disable = function(){
 this.hide();
 this.show = function(){};
};

/**
* If a value is provided it will change the width of the player to that value
* otherwise the width is returned
* http://dev.w3.org/html5/spec/dimension-attributes.html#attr-dim-height
* Video tag width/height only work in pixels. No percents.
* But allowing limited percents use. e.g. width() will return number+%, not computed width
* @param  {Number|String=} num   Optional width number
* @param  {[type]} skipListeners Skip the 'resize' event trigger
* @return {librevjs.Component|Number|String} Returns 'this' if dimension was set.
*   Otherwise it returns the dimension.
*/
librevjs.Component.prototype.width = function(num, skipListeners){
 return this.dimension('width', num, skipListeners);
};

/**
* Get or set the height of the player
* @param  {Number|String=} num     Optional new player height
* @param  {Boolean=} skipListeners Optional skip resize event trigger
* @return {librevjs.Component|Number|String} The player, or the dimension
*/
librevjs.Component.prototype.height = function(num, skipListeners){
 return this.dimension('height', num, skipListeners);
};

/**
* Set both width and height at the same time.
* @param  {Number|String} width
* @param  {Number|String} height
* @return {librevjs.Component}   The player.
*/
librevjs.Component.prototype.dimensions = function(width, height){
 // Skip resize listeners on width for optimization
 return this.width(width, true).height(height);
};

/**
* Get or set width or height.
* All for an integer, integer + 'px' or integer + '%';
* Known issue: hidden elements. Hidden elements officially have a width of 0.
* So we're defaulting to the style.width value and falling back to computedStyle
* which has the hidden element issue.
* Info, but probably not an efficient fix:
* http://www.foliotek.com/devblog/getting-the-width-of-a-hidden-element-with-jquery-using-width/
* @param  {String=} widthOrHeight 'width' or 'height'
* @param  {Number|String=} num           New dimension
* @param  {Boolean=} skipListeners Skip resize event trigger
* @return {librevjs.Component|Number|String} Return the player if setting a dimension.
*                                         Otherwise it returns the dimension.
*/
librevjs.Component.prototype.dimension = function(widthOrHeight, num, skipListeners){
 if (num !== undefined) {

   // Check if using css width/height (% or px) and adjust
   if ((''+num).indexOf('%') !== -1 || (''+num).indexOf('px') !== -1) {
     this.el_.style[widthOrHeight] = num;
   } else if (num === 'auto') {
     this.el_.style[widthOrHeight] = '';
   } else {
     this.el_.style[widthOrHeight] = num+'px';
   }

   // skipListeners allows us to avoid triggering the resize event when setting both width and height
   if (!skipListeners) { this.trigger('resize'); }

   // Return component
   return this;
 }

 // Not setting a value, so getting it
 // Make sure element exists
 if (!this.el_) return 0;

 // Get dimension value from style
 var val = this.el_.style[widthOrHeight];
 var pxIndex = val.indexOf('px');
 if (pxIndex !== -1) {
   // Return the pixel value with no 'px'
   return parseInt(val.slice(0,pxIndex), 10);

 // No px so using % or no style was set, so falling back to offsetWidth/height
 // If component has display:none, offset will return 0
 // TODO: handle display:none and no dimension style using px
 } else {

   return parseInt(this.el_['offset'+librevjs.capitalize(widthOrHeight)], 10);

   // ComputedStyle version.
   // Only difference is if the element is hidden it will return
   // the percent value (e.g. '100%'')
   // instead of zero like offsetWidth returns.
   // var val = librevjs.getComputedStyleValue(this.el_, widthOrHeight);
   // var pxIndex = val.indexOf('px');

   // if (pxIndex !== -1) {
   //   return val.slice(0, pxIndex);
   // } else {
   //   return val;
   // }
 }
};

/**
* Emit 'tap' events when touch events are supported. We're requireing them to
* be enabled because otherwise every component would have this extra overhead
* unnecessarily, on mobile devices where extra overhead is especially bad.
*
* This is being implemented so we can support taps on the video element
* toggling the controls.
*/
librevjs.Component.prototype.emitTapEvents = function(){
 var touchStart, touchTime, couldBeTap, noTap;

 // Track the start time so we can determine how long the touch lasted
 touchStart = 0;

 this.on('touchstart', function(event) {
   // Record start time so we can detect a tap vs. "touch and hold"
   touchStart = new Date().getTime();
   // Reset couldBeTap tracking
   couldBeTap = true;
 });

 noTap = function(){
   couldBeTap = false;
 };
 // TODO: Listen to the original target. http://youtu.be/DujfpXOKUp8?t=13m8s
 this.on('touchmove', noTap);
 this.on('touchleave', noTap);
 this.on('touchcancel', noTap);

 // When the touch ends, measure how long it took and trigger the appropriate
 // event
 this.on('touchend', function() {
   // Proceed only if the touchmove/leave/cancel event didn't happen
   if (couldBeTap === true) {
     // Measure how long the touch lasted
     touchTime = new Date().getTime() - touchStart;
     // The touch needs to be quick in order to consider it a tap
     if (touchTime < 250) {
       this.trigger('tap');
       // It may be good to copy the touchend event object and change the
       // type to tap, if the other event properties aren't exact after
       // librevjs.fixEvent runs (e.g. event.target)
     }
   }
 });
};
/* Button - Base class for all buttons
================================================================================ */
/**
* Base class for all buttons
* @param {librevjs.Player|Object} player
* @param {Object=} options
* @constructor
*/
librevjs.Button = librevjs.Component.extend({
 /** @constructor */
 init: function(player, options){
   librevjs.Component.call(this, player, options);

   var touchstart = false;
   this.on('touchstart', function(event) {
     // Stop click and other mouse events from triggering also
     event.preventDefault();
     touchstart = true;
   });
   this.on('touchmove', function() {
     touchstart = false;
   });
   var self = this;
   this.on('touchend', function(event) {
     if (touchstart) {
       self.onClick(event);
     }
     event.preventDefault();
   });

   this.on('click', this.onClick);
   this.on('focus', this.onFocus);
   this.on('blur', this.onBlur);
 }
});

librevjs.Button.prototype.createEl = function(type, props){
 // Add standard Aria and Tabindex info
 props = librevjs.obj.merge({
   className: this.buildCSSClass(),
   innerHTML: '<div class="librevjs-control-content"><span class="librevjs-control-text">' + (this.buttonText || 'Need Text') + '</span></div>',
   role: 'button',
   'aria-live': 'polite', // let the screen reader user know that the text of the button may change
   tabIndex: 0
 }, props);

 return librevjs.Component.prototype.createEl.call(this, type, props);
};

librevjs.Button.prototype.buildCSSClass = function(){
 // TODO: Change librevjs-control to librevjs-button?
 return 'librevjs-control ' + librevjs.Component.prototype.buildCSSClass.call(this);
};

 // Click - Override with specific functionality for button
librevjs.Button.prototype.onClick = function(){};

 // Focus - Add keyboard functionality to element
librevjs.Button.prototype.onFocus = function(){
 librevjs.on(document, 'keyup', librevjs.bind(this, this.onKeyPress));
};

 // KeyPress (document level) - Trigger click when keys are pressed
librevjs.Button.prototype.onKeyPress = function(event){
 // Check for space bar (32) or enter (13) keys
 if (event.which == 32 || event.which == 13) {
   event.preventDefault();
   this.onClick();
 }
};

// Blur - Remove keyboard triggers
librevjs.Button.prototype.onBlur = function(){
 librevjs.off(document, 'keyup', librevjs.bind(this, this.onKeyPress));
};
/* Slider
================================================================================ */
/**
* Parent for seek bar and volume slider
* @param {librevjs.Player|Object} player
* @param {Object=} options
* @constructor
*/
librevjs.Slider = librevjs.Component.extend({
 /** @constructor */
 init: function(player, options){
   librevjs.Component.call(this, player, options);

   // Set property names to bar and handle to match with the child Slider class is looking for
   this.bar = this.getChild(this.options_['barName']);
   this.handle = this.getChild(this.options_['handleName']);

   player.on(this.playerEvent, librevjs.bind(this, this.update));

   this.on('mousedown', this.onMouseDown);
   this.on('touchstart', this.onMouseDown);
   this.on('focus', this.onFocus);
   this.on('blur', this.onBlur);
   this.on('click', this.onClick);

   this.player_.on('controlsvisible', librevjs.bind(this, this.update));

   // This is actually to fix the volume handle position. http://twitter.com/#!/gerritvanaaken/status/159046254519787520
   // this.player_.one('timeupdate', librevjs.bind(this, this.update));

   player.ready(librevjs.bind(this, this.update));

   this.boundEvents = {};
 }
});

librevjs.Slider.prototype.createEl = function(type, props) {
 props = props || {};
 // Add the slider element class to all sub classes
 props.className = props.className + ' librevjs-slider';
 props = librevjs.obj.merge({
   role: 'slider',
   'aria-valuenow': 0,
   'aria-valuemin': 0,
   'aria-valuemax': 100,
   tabIndex: 0
 }, props);

 return librevjs.Component.prototype.createEl.call(this, type, props);
};

librevjs.Slider.prototype.onMouseDown = function(event){
 event.preventDefault();
 librevjs.blockTextSelection();

 this.boundEvents.move = librevjs.bind(this, this.onMouseMove);
 this.boundEvents.end = librevjs.bind(this, this.onMouseUp);

 librevjs.on(document, 'mousemove', this.boundEvents.move);
 librevjs.on(document, 'mouseup', this.boundEvents.end);
 librevjs.on(document, 'touchmove', this.boundEvents.move);
 librevjs.on(document, 'touchend', this.boundEvents.end);

 this.onMouseMove(event);
};

librevjs.Slider.prototype.onMouseUp = function() {
 librevjs.unblockTextSelection();
 librevjs.off(document, 'mousemove', this.boundEvents.move, false);
 librevjs.off(document, 'mouseup', this.boundEvents.end, false);
 librevjs.off(document, 'touchmove', this.boundEvents.move, false);
 librevjs.off(document, 'touchend', this.boundEvents.end, false);

 this.update();
};

librevjs.Slider.prototype.update = function(){
 // In VolumeBar init we have a setTimeout for update that pops and update to the end of the
 // execution stack. The player is destroyed before then update will cause an error
 if (!this.el_) return;

 // If scrubbing, we could use a cached value to make the handle keep up with the user's mouse.
 // On HTML5 browsers scrubbing is really smooth, but some flash players are slow, so we might want to utilize this later.
 // var progress =  (this.player_.scrubbing) ? this.player_.getCache().currentTime / this.player_.duration() : this.player_.currentTime() / this.player_.duration();

 var barProgress,
     progress = this.getPercent(),
     handle = this.handle,
     bar = this.bar;

 // Protect against no duration and other division issues
 if (isNaN(progress)) { progress = 0; }

 barProgress = progress;

 // If there is a handle, we need to account for the handle in our calculation for progress bar
 // so that it doesn't fall short of or extend past the handle.
 if (handle) {

   var box = this.el_,
       boxWidth = box.offsetWidth,

       handleWidth = handle.el().offsetWidth,

       // The width of the handle in percent of the containing box
       // In IE, widths may not be ready yet causing NaN
       handlePercent = (handleWidth) ? handleWidth / boxWidth : 0,

       // Get the adjusted size of the box, considering that the handle's center never touches the left or right side.
       // There is a margin of half the handle's width on both sides.
       boxAdjustedPercent = 1 - handlePercent,

       // Adjust the progress that we'll use to set widths to the new adjusted box width
       adjustedProgress = progress * boxAdjustedPercent;

   // The bar does reach the left side, so we need to account for this in the bar's width
   barProgress = adjustedProgress + (handlePercent / 2);

   // Move the handle from the left based on the adjected progress
   handle.el().style.left = librevjs.round(adjustedProgress * 100, 2) + '%';
 }

 // Set the new bar width
 bar.el().style.width = librevjs.round(barProgress * 100, 2) + '%';
};

librevjs.Slider.prototype.calculateDistance = function(event){
 var el, box, boxX, boxY, boxW, boxH, handle, pageX, pageY;

 el = this.el_;
 box = librevjs.findPosition(el);
 boxW = boxH = el.offsetWidth;
 handle = this.handle;

 if (this.options_.vertical) {
   boxY = box.top;

   if (event.changedTouches) {
     pageY = event.changedTouches[0].pageY;
   } else {
     pageY = event.pageY;
   }

   if (handle) {
     var handleH = handle.el().offsetHeight;
     // Adjusted X and Width, so handle doesn't go outside the bar
     boxY = boxY + (handleH / 2);
     boxH = boxH - handleH;
   }

   // Percent that the click is through the adjusted area
   return Math.max(0, Math.min(1, ((boxY - pageY) + boxH) / boxH));

 } else {
   boxX = box.left;

   if (event.changedTouches) {
     pageX = event.changedTouches[0].pageX;
   } else {
     pageX = event.pageX;
   }

   if (handle) {
     var handleW = handle.el().offsetWidth;

     // Adjusted X and Width, so handle doesn't go outside the bar
     boxX = boxX + (handleW / 2);
     boxW = boxW - handleW;
   }

   // Percent that the click is through the adjusted area
   return Math.max(0, Math.min(1, (pageX - boxX) / boxW));
 }
};

librevjs.Slider.prototype.onFocus = function(){
 librevjs.on(document, 'keyup', librevjs.bind(this, this.onKeyPress));
};

librevjs.Slider.prototype.onKeyPress = function(event){
 if (event.which == 37) { // Left Arrow
   event.preventDefault();
   this.stepBack();
 } else if (event.which == 39) { // Right Arrow
   event.preventDefault();
   this.stepForward();
 }
};

librevjs.Slider.prototype.onBlur = function(){
 librevjs.off(document, 'keyup', librevjs.bind(this, this.onKeyPress));
};

/**
* Listener for click events on slider, used to prevent clicks
*   from bubbling up to parent elements like button menus.
* @param  {Object} event Event object
*/
librevjs.Slider.prototype.onClick = function(event){
 event.stopImmediatePropagation();
 event.preventDefault();
};

/**
* SeekBar Behavior includes play progress bar, and seek handle
* Needed so it can determine seek position based on handle position/size
* @param {librevjs.Player|Object} player
* @param {Object=} options
* @constructor
*/
librevjs.SliderHandle = librevjs.Component.extend();

/**
* Default value of the slider
* @type {Number}
*/
librevjs.SliderHandle.prototype.defaultValue = 0;

/** @inheritDoc */
librevjs.SliderHandle.prototype.createEl = function(type, props) {
 props = props || {};
 // Add the slider element class to all sub classes
 props.className = props.className + ' librevjs-slider-handle';
 props = librevjs.obj.merge({
   innerHTML: '<span class="librevjs-control-text">'+this.defaultValue+'</span>'
 }, props);

 return librevjs.Component.prototype.createEl.call(this, 'div', props);
};
/* Menu
================================================================================ */
/**
* The base for text track and settings menu buttons.
* @param {librevjs.Player|Object} player
* @param {Object=} options
* @constructor
*/
librevjs.Menu = librevjs.Component.extend();

/**
* Add a menu item to the menu
* @param {Object|String} component Component or component type to add
*/
librevjs.Menu.prototype.addItem = function(component){
 this.addChild(component);
 component.on('click', librevjs.bind(this, function(){
   this.unlockShowing();
 }));
};

/** @inheritDoc */
librevjs.Menu.prototype.createEl = function(){
 var contentElType = this.options().contentElType || 'ul';
 this.contentEl_ = librevjs.createEl(contentElType, {
   className: 'librevjs-menu-content'
 });
 var el = librevjs.Component.prototype.createEl.call(this, 'div', {
   append: this.contentEl_,
   className: 'librevjs-menu'
 });
 el.appendChild(this.contentEl_);

 // Prevent clicks from bubbling up. Needed for Menu Buttons,
 // where a click on the parent is significant
 librevjs.on(el, 'click', function(event){
   event.preventDefault();
   event.stopImmediatePropagation();
 });

 return el;
};

/**
* Menu item
* @param {librevjs.Player|Object} player
* @param {Object=} options
* @constructor
*/
librevjs.MenuItem = librevjs.Button.extend({
 /** @constructor */
 init: function(player, options){
   librevjs.Button.call(this, player, options);
   this.selected(options['selected']);
 }
});

/** @inheritDoc */
librevjs.MenuItem.prototype.createEl = function(type, props){
 return librevjs.Button.prototype.createEl.call(this, 'li', librevjs.obj.merge({
   className: 'librevjs-menu-item',
   innerHTML: this.options_['label']
 }, props));
};

/** @inheritDoc */
librevjs.MenuItem.prototype.onClick = function(){
 this.selected(true);
};

/**
* Set this menu item as selected or not
* @param  {Boolean} selected
*/
librevjs.MenuItem.prototype.selected = function(selected){
 if (selected) {
   this.addClass('librevjs-selected');
   this.el_.setAttribute('aria-selected',true);
 } else {
   this.removeClass('librevjs-selected');
   this.el_.setAttribute('aria-selected',false);
 }
};


/**
* A button class with a popup menu
* @param {librevjs.Player|Object} player
* @param {Object=} options
* @constructor
*/
librevjs.MenuButton = librevjs.Button.extend({
 /** @constructor */
 init: function(player, options){
   librevjs.Button.call(this, player, options);

   this.menu = this.createMenu();

   // Add list to element
   this.addChild(this.menu);

   // Automatically hide empty menu buttons
   if (this.items && this.items.length === 0) {
     this.hide();
   }

   this.on('keyup', this.onKeyPress);
   this.el_.setAttribute('aria-haspopup', true);
   this.el_.setAttribute('role', 'button');
 }
});

/**
* Track the state of the menu button
* @type {Boolean}
*/
librevjs.MenuButton.prototype.buttonPressed_ = false;

librevjs.MenuButton.prototype.createMenu = function(){
 var menu = new librevjs.Menu(this.player_);

 // Add a title list item to the top
 if (this.options().title) {
   menu.el().appendChild(librevjs.createEl('li', {
     className: 'librevjs-menu-title',
     innerHTML: librevjs.capitalize(this.kind_),
     tabindex: -1
   }));
 }

 this.items = this['createItems']();

 if (this.items) {
   // Add menu items to the menu
   for (var i = 0; i < this.items.length; i++) {
     menu.addItem(this.items[i]);
   }
 }

 return menu;
};

/**
* Create the list of menu items. Specific to each subclass.
*/
librevjs.MenuButton.prototype.createItems = function(){};

/** @inheritDoc */
librevjs.MenuButton.prototype.buildCSSClass = function(){
 return this.className + ' librevjs-menu-button ' + librevjs.Button.prototype.buildCSSClass.call(this);
};

// Focus - Add keyboard functionality to element
// This function is not needed anymore. Instead, the keyboard functionality is handled by
// treating the button as triggering a submenu. When the button is pressed, the submenu
// appears. Pressing the button again makes the submenu disappear.
librevjs.MenuButton.prototype.onFocus = function(){};
// Can't turn off list display that we turned on with focus, because list would go away.
librevjs.MenuButton.prototype.onBlur = function(){};

librevjs.MenuButton.prototype.onClick = function(){
 // When you click the button it adds focus, which will show the menu indefinitely.
 // So we'll remove focus when the mouse leaves the button.
 // Focus is needed for tab navigation.
 this.one('mouseout', librevjs.bind(this, function(){
   this.menu.unlockShowing();
   this.el_.blur();
 }));
 if (this.buttonPressed_){
   this.unpressButton();
 } else {
   this.pressButton();
 }
};

librevjs.MenuButton.prototype.onKeyPress = function(event){
 event.preventDefault();

 // Check for space bar (32) or enter (13) keys
 if (event.which == 32 || event.which == 13) {
   if (this.buttonPressed_){
     this.unpressButton();
   } else {
     this.pressButton();
   }
 // Check for escape (27) key
 } else if (event.which == 27){
   if (this.buttonPressed_){
     this.unpressButton();
   }
 }
};

librevjs.MenuButton.prototype.pressButton = function(){
 this.buttonPressed_ = true;
 this.menu.lockShowing();
 this.el_.setAttribute('aria-pressed', true);
 if (this.items && this.items.length > 0) {
   this.items[0].el().focus(); // set the focus to the title of the submenu
 }
};

librevjs.MenuButton.prototype.unpressButton = function(){
 this.buttonPressed_ = false;
 this.menu.unlockShowing();
 this.el_.setAttribute('aria-pressed', false);
};

/**
* Main player class. A player instance is returned by _V_(id);
* @param {Element} tag        The original video tag used for configuring options
* @param {Object=} options    Player options
* @param {Function=} ready    Ready callback function
* @constructor
*/
librevjs.Player = librevjs.Component.extend({
 /** @constructor */
 init: function(tag, options, ready){
   this.tag = tag; // Store the original tag used to set options

   // Set Options
   // The options argument overrides options set in the video tag
   // which overrides globally set options.
   // This latter part coincides with the load order
   // (tag must exist before Player)
   options = librevjs.obj.merge(this.getTagSettings(tag), options);

   // Cache for video property values.
   this.cache_ = {};

   // Set poster
   this.poster_ = options['poster'];
   // Set controls
   this.controls_ = options['controls'];
   // Original tag settings stored in options
   // now remove immediately so native controls don't flash.
   // May be turned back on by HTML5 tech if nativeControlsForTouch is true
   tag.controls = false;

   // Run base component initializing with new options.
   // Builds the element through createEl()
   // Inits and embeds any child components in opts
   librevjs.Component.call(this, this, options, ready);

   // Update controls className. Can't do this when the controls are initially
   // set because the element doesn't exist yet.
   if (this.controls()) {
     this.addClass('librevjs-controls-enabled');
   } else {
     this.addClass('librevjs-controls-disabled');
   }

   // TODO: Make this smarter. Toggle user state between touching/mousing
   // using events, since devices can have both touch and mouse events.
   // if (librevjs.TOUCH_ENABLED) {
   //   this.addClass('librevjs-touch-enabled');
   // }

   // Firstplay event implimentation. Not sold on the event yet.
   // Could probably just check currentTime==0?
   this.one('play', function(e){
     var fpEvent = { type: 'firstplay', target: this.el_ };
     // Using librevjs.trigger so we can check if default was prevented
     var keepGoing = librevjs.trigger(this.el_, fpEvent);

     if (!keepGoing) {
       e.preventDefault();
       e.stopPropagation();
       e.stopImmediatePropagation();
     }
   });

   this.on('ended', this.onEnded);
   this.on('play', this.onPlay);
   this.on('firstplay', this.onFirstPlay);
   this.on('pause', this.onPause);
   this.on('progress', this.onProgress);
   this.on('durationchange', this.onDurationChange);
   this.on('error', this.onError);
   this.on('fullscreenchange', this.onFullscreenChange);

   // Make player easily findable by ID
   librevjs.players[this.id_] = this;

   if (options['plugins']) {
     librevjs.obj.each(options['plugins'], function(key, val){
       this[key](val);
     }, this);
   }

   this.listenForUserActivity();
 }
});

/**
* Player instance options, surfaced using librevjs.options
* librevjs.options = librevjs.Player.prototype.options_
* Make changes in librevjs.options, not here.
* All options should use string keys so they avoid
* renaming by closure compiler
* @type {Object}
* @private
*/
librevjs.Player.prototype.options_ = librevjs.options;

librevjs.Player.prototype.dispose = function(){
 this.trigger('dispose');
 // prevent dispose from being called twice
 this.off('dispose');

 // Kill reference to this player
 librevjs.players[this.id_] = null;
 if (this.tag && this.tag['player']) { this.tag['player'] = null; }
 if (this.el_ && this.el_['player']) { this.el_['player'] = null; }

 // Ensure that tracking progress and time progress will stop and plater deleted
 this.stopTrackingProgress();
 this.stopTrackingCurrentTime();

 if (this.tech) { this.tech.dispose(); }

 // Component dispose
 librevjs.Component.prototype.dispose.call(this);
};

librevjs.Player.prototype.getTagSettings = function(tag){
 var options = {
   'sources': [],
   'tracks': []
 };

 librevjs.obj.merge(options, librevjs.getAttributeValues(tag));

 // Get tag children settings
 if (tag.hasChildNodes()) {
   var children, child, childName, i, j;

   children = tag.childNodes;

   for (i=0,j=children.length; i<j; i++) {
     child = children[i];
     // Change case needed: http://ejohn.org/blog/nodename-case-sensitivity/
     childName = child.nodeName.toLowerCase();
     if (childName === 'source') {
       options['sources'].push(librevjs.getAttributeValues(child));
     } else if (childName === 'track') {
       options['tracks'].push(librevjs.getAttributeValues(child));
     }
   }
 }

 return options;
};

librevjs.Player.prototype.createEl = function(){
 var el = this.el_ = librevjs.Component.prototype.createEl.call(this, 'div');
 var tag = this.tag;

 // Remove width/height attrs from tag so CSS can make it 100% width/height
 tag.removeAttribute('width');
 tag.removeAttribute('height');
 // Empty video tag tracks so the built-in player doesn't use them also.
 // This may not be fast enough to stop HTML5 browsers from reading the tags
 // so we'll need to turn off any default tracks if we're manually doing
 // captions and subtitles. videoElement.textTracks
 if (tag.hasChildNodes()) {
   var nodes, nodesLength, i, node, nodeName, removeNodes;

   nodes = tag.childNodes;
   nodesLength = nodes.length;
   removeNodes = [];

   while (nodesLength--) {
     node = nodes[nodesLength];
     nodeName = node.nodeName.toLowerCase();
     if (nodeName === 'track') {
       removeNodes.push(node);
     }
   }

   for (i=0; i<removeNodes.length; i++) {
     tag.removeChild(removeNodes[i]);
   }
 }

 // Make sure tag ID exists
 tag.id = tag.id || 'librevjs_video_' + librevjs.guid++;

 // Give video tag ID and class to player div
 // ID will now reference player box, not the video tag
 el.id = tag.id;
 el.className = tag.className;

 // Update tag id/class for use as HTML5 playback tech
 // Might think we should do this after embedding in container so .librevjs-tech class
 // doesn't flash 100% width/height, but class only applies with .video-js parent
 tag.id += '_html5_api';
 tag.className = 'librevjs-tech';

 // Make player findable on elements
 tag['player'] = el['player'] = this;
 // Default state of video is paused
 this.addClass('librevjs-paused');

 // Make box use width/height of tag, or rely on default implementation
 // Enforce with CSS since width/height attrs don't work on divs
 this.width(this.options_['width="100%"'], true); // (true) Skip resize listener on load
 this.height(this.options_['height="auto"'], true);

 // Wrap video tag in div (el/box) container
 if (tag.parentNode) {
   tag.parentNode.insertBefore(el, tag);
 }
 librevjs.insertFirst(tag, el); // Breaks iPhone, fixed in HTML5 setup.

 return el;
};

// /* Media Technology (tech)
// ================================================================================ */
// Load/Create an instance of playback technlogy including element and API methods
// And append playback element in player div.
librevjs.Player.prototype.loadTech = function(techName, source){

 // Pause and remove current playback technology
 if (this.tech) {
   this.unloadTech();

 // if this is the first time loading, HTML5 tag will exist but won't be initialized
 // so we need to remove it if we're not loading HTML5
 } else if (techName !== 'Html5' && this.tag) {
   librevjs.Html5.disposeMediaElement(this.tag);
   this.tag = null;
 }

 this.techName = techName;

 // Turn off API access because we're loading a new tech that might load asynchronously
 this.isReady_ = false;

 var techReady = function(){
   this.player_.triggerReady();

   // Manually track progress in cases where the browser/flash player doesn't report it.
   if (!this.features['progressEvents']) {
     this.player_.manualProgressOn();
   }

   // Manually track timeudpates in cases where the browser/flash player doesn't report it.
   if (!this.features['timeupdateEvents']) {
     this.player_.manualTimeUpdatesOn();
   }
 };

 // Grab tech-specific options from player options and add source and parent element to use.
 var techOptions = librevjs.obj.merge({ 'source': source, 'parentEl': this.el_ }, this.options_[techName.toLowerCase()]);

 if (source) {
   if (source.src == this.cache_.src && this.cache_.currentTime > 0) {
     techOptions['startTime'] = this.cache_.currentTime;
   }

   this.cache_.src = source.src;
 }

 // Initialize tech instance
 this.tech = new window['cliplibrejs'][techName](this, techOptions);

 this.tech.ready(techReady);
};

librevjs.Player.prototype.unloadTech = function(){
 this.isReady_ = false;
 this.tech.dispose();

 // Turn off any manual progress or timeupdate tracking
 if (this.manualProgress) { this.manualProgressOff(); }

 if (this.manualTimeUpdates) { this.manualTimeUpdatesOff(); }

 this.tech = false;
};

// There's many issues around changing the size of a Flash (or other plugin) object.
// First is a plugin reload issue in Firefox that has been around for 11 years: https://bugzilla.mozilla.org/show_bug.cgi?id=90268
// Then with the new fullscreen API, Mozilla and webkit browsers will reload the flash object after going to fullscreen.
// To get around this, we're unloading the tech, caching source and currentTime values, and reloading the tech once the plugin is resized.
// reloadTech: function(betweenFn){
//   librevjs.log('unloadingTech')
//   this.unloadTech();
//   librevjs.log('unloadedTech')
//   if (betweenFn) { betweenFn.call(); }
//   librevjs.log('LoadingTech')
//   this.loadTech(this.techName, { src: this.cache_.src })
//   librevjs.log('loadedTech')
// },

/* Fallbacks for unsupported event types
================================================================================ */
// Manually trigger progress events based on changes to the buffered amount
// Many flash players and older HTML5 browsers don't send progress or progress-like events
librevjs.Player.prototype.manualProgressOn = function(){
 this.manualProgress = true;

 // Trigger progress watching when a source begins loading
 this.trackProgress();

 // Watch for a native progress event call on the tech element
 // In HTML5, some older versions don't support the progress event
 // So we're assuming they don't, and turning off manual progress if they do.
 // As opposed to doing user agent detection
 this.tech.one('progress', function(){

   // Update known progress support for this playback technology
   this.features['progressEvents'] = true;

   // Turn off manual progress tracking
   this.player_.manualProgressOff();
 });
};

librevjs.Player.prototype.manualProgressOff = function(){
 this.manualProgress = false;
 this.stopTrackingProgress();
};

librevjs.Player.prototype.trackProgress = function(){

 this.progressInterval = setInterval(librevjs.bind(this, function(){
   // Don't trigger unless buffered amount is greater than last time
   // log(this.cache_.bufferEnd, this.buffered().end(0), this.duration())
   /* TODO: update for multiple buffered regions */
   if (this.cache_.bufferEnd < this.buffered().end(0)) {
     this.trigger('progress');
   } else if (this.bufferedPercent() == 1) {
     this.stopTrackingProgress();
     this.trigger('progress'); // Last update
   }
 }), 500);
};
librevjs.Player.prototype.stopTrackingProgress = function(){ clearInterval(this.progressInterval); };

/* Time Tracking -------------------------------------------------------------- */
librevjs.Player.prototype.manualTimeUpdatesOn = function(){
 this.manualTimeUpdates = true;

 this.on('play', this.trackCurrentTime);
 this.on('pause', this.stopTrackingCurrentTime);
 // timeupdate is also called by .currentTime whenever current time is set

 // Watch for native timeupdate event
 this.tech.one('timeupdate', function(){
   // Update known progress support for this playback technology
   this.features['timeupdateEvents'] = true;
   // Turn off manual progress tracking
   this.player_.manualTimeUpdatesOff();
 });
};

librevjs.Player.prototype.manualTimeUpdatesOff = function(){
 this.manualTimeUpdates = false;
 this.stopTrackingCurrentTime();
 this.off('play', this.trackCurrentTime);
 this.off('pause', this.stopTrackingCurrentTime);
};

librevjs.Player.prototype.trackCurrentTime = function(){
 if (this.currentTimeInterval) { this.stopTrackingCurrentTime(); }
 this.currentTimeInterval = setInterval(librevjs.bind(this, function(){
   this.trigger('timeupdate');
 }), 250); // 42 = 24 fps // 250 is what Webkit uses // FF uses 15
};

// Turn off play progress tracking (when paused or dragging)
librevjs.Player.prototype.stopTrackingCurrentTime = function(){ clearInterval(this.currentTimeInterval); };

// /* Player event handlers (how the player reacts to certain events)
// ================================================================================ */
librevjs.Player.prototype.onEnded = function(){
 if (this.options_['loop']) {
   this.currentTime(0);
   this.play();
 }
};

librevjs.Player.prototype.onPlay = function(){
 librevjs.removeClass(this.el_, 'librevjs-paused');
 librevjs.addClass(this.el_, 'librevjs-playing');
};

librevjs.Player.prototype.onFirstPlay = function(){
   //If the first starttime attribute is specified
   //then we will start at the given offset in seconds
   if(this.options_['starttime']){
     this.currentTime(this.options_['starttime']);
   }

   this.addClass('librevjs-has-started');
};

librevjs.Player.prototype.onPause = function(){
 librevjs.removeClass(this.el_, 'librevjs-playing');
 librevjs.addClass(this.el_, 'librevjs-paused');
};

librevjs.Player.prototype.onProgress = function(){
 // Add custom event for when source is finished downloading.
 if (this.bufferedPercent() == 1) {
   this.trigger('loadedalldata');
 }
};

// Update duration with durationchange event
// Allows for cacheing value instead of asking player each time.
librevjs.Player.prototype.onDurationChange = function(){
 this.duration(this.techGet('duration'));
};

librevjs.Player.prototype.onError = function(e) {
 librevjs.log('Video Error', e);
};

librevjs.Player.prototype.onFullscreenChange = function() {
 if (this.isFullScreen) {
   this.addClass('librevjs-fullscreen');
 } else {
   this.removeClass('librevjs-fullscreen');
 }
};

// /* Player API
// ================================================================================ */

/**
* Object for cached values.
* @private
*/
librevjs.Player.prototype.cache_;

librevjs.Player.prototype.getCache = function(){
 return this.cache_;
};

// Pass values to the playback tech
librevjs.Player.prototype.techCall = function(method, arg){
 // If it's not ready yet, call method when it is
 if (this.tech && !this.tech.isReady_) {
   this.tech.ready(function(){
     this[method](arg);
   });

 // Otherwise call method now
 } else {
   try {
     this.tech[method](arg);
   } catch(e) {
     librevjs.log(e);
     throw e;
   }
 }
};

// Get calls can't wait for the tech, and sometimes don't need to.
librevjs.Player.prototype.techGet = function(method){

 if (this.tech && this.tech.isReady_) {

   // Flash likes to die and reload when you hide or reposition it.
   // In these cases the object methods go away and we get errors.
   // When that happens we'll catch the errors and inform tech that it's not ready any more.
   try {
     return this.tech[method]();
   } catch(e) {
     // When building additional tech libs, an expected method may not be defined yet
     if (this.tech[method] === undefined) {
       librevjs.log('LibreVideo.js: ' + method + ' method not defined for '+this.techName+' playback technology.', e);
     } else {
       // When a method isn't available on the object it throws a TypeError
       if (e.name == 'TypeError') {
         librevjs.log('LibreVideo.js: ' + method + ' unavailable on '+this.techName+' playback technology element.', e);
         this.tech.isReady_ = false;
       } else {
         librevjs.log(e);
       }
     }
     throw e;
   }
 }

 return;
};

/**
* Start media playback
* http://dev.w3.org/html5/spec/video.html#dom-media-play
* We're triggering the 'play' event here instead of relying on the
* media element to allow using event.preventDefault() to stop
* play from happening if desired. Usecase: preroll ads.
*/
librevjs.Player.prototype.play = function(){
 this.techCall('play');
 return this;
};

// http://dev.w3.org/html5/spec/video.html#dom-media-pause
librevjs.Player.prototype.pause = function(){
 this.techCall('pause');
 return this;
};

// http://dev.w3.org/html5/spec/video.html#dom-media-paused
// The initial state of paused should be true (in Safari it's actually false)
librevjs.Player.prototype.paused = function(){
 return (this.techGet('paused') === false) ? false : true;
};

// http://dev.w3.org/html5/spec/video.html#dom-media-currenttime
librevjs.Player.prototype.currentTime = function(seconds){
 if (seconds !== undefined) {

   // Cache the last set value for smoother scrubbing.
   this.cache_.lastSetCurrentTime = seconds;

   this.techCall('setCurrentTime', seconds);

   // Improve the accuracy of manual timeupdates
   if (this.manualTimeUpdates) { this.trigger('timeupdate'); }

   return this;
 }

 // Cache last currentTime and return
 // Default to 0 seconds
 return this.cache_.currentTime = (this.techGet('currentTime') || 0);
};

// http://dev.w3.org/html5/spec/video.html#dom-media-duration
// Duration should return NaN if not available. ParseFloat will turn false-ish values to NaN.
librevjs.Player.prototype.duration = function(seconds){
 if (seconds !== undefined) {

   // Cache the last set value for optimiized scrubbing (esp. Flash)
   this.cache_.duration = parseFloat(seconds);

   return this;
 }

 if (this.cache_.duration === undefined) {
   this.onDurationChange();
 }

 return this.cache_.duration;
};

// Calculates how much time is left. Not in spec, but useful.
librevjs.Player.prototype.remainingTime = function(){
 return this.duration() - this.currentTime();
};

// http://dev.w3.org/html5/spec/video.html#dom-media-buffered
// Buffered returns a timerange object.
// Kind of like an array of portions of the video that have been downloaded.
// So far no browsers return more than one range (portion)
librevjs.Player.prototype.buffered = function(){
 var buffered = this.techGet('buffered'),
     start = 0,
     buflast = buffered.length - 1,
     // Default end to 0 and store in values
     end = this.cache_.bufferEnd = this.cache_.bufferEnd || 0;

 if (buffered && buflast >= 0 && buffered.end(buflast) !== end) {
   end = buffered.end(buflast);
   // Storing values allows them be overridden by setBufferedFromProgress
   this.cache_.bufferEnd = end;
 }

 return librevjs.createTimeRange(start, end);
};

// Calculates amount of buffer is full. Not in spec but useful.
librevjs.Player.prototype.bufferedPercent = function(){
 return (this.duration()) ? this.buffered().end(0) / this.duration() : 0;
};

// http://dev.w3.org/html5/spec/video.html#dom-media-volume
librevjs.Player.prototype.volume = function(percentAsDecimal){
 var vol;

 if (percentAsDecimal !== undefined) {
   vol = Math.max(0, Math.min(1, parseFloat(percentAsDecimal))); // Force value to between 0 and 1
   this.cache_.volume = vol;
   this.techCall('setVolume', vol);
   librevjs.setLocalStorage('volume', vol);
   return this;
 }

 // Default to 1 when returning current volume.
 vol = parseFloat(this.techGet('volume'));
 return (isNaN(vol)) ? 1 : vol;
};

// http://dev.w3.org/html5/spec/video.html#attr-media-muted
librevjs.Player.prototype.muted = function(muted){
 if (muted !== undefined) {
   this.techCall('setMuted', muted);
   return this;
 }
 return this.techGet('muted') || false; // Default to false
};

// Check if current tech can support native fullscreen (e.g. with built in controls lik iOS, so not our flash swf)
librevjs.Player.prototype.supportsFullScreen = function(){ return this.techGet('supportsFullScreen') || false; };

// Turn on fullscreen (or window) mode
librevjs.Player.prototype.requestFullScreen = function(){
 var requestFullScreen = librevjs.support.requestFullScreen;
 this.isFullScreen = true;

 if (requestFullScreen) {
   // the browser supports going fullscreen at the element level so we can
   // take the controls fullscreen as well as the video

   // Trigger fullscreenchange event after change
   // We have to specifically add this each time, and remove
   // when cancelling fullscreen. Otherwise if there's multiple
   // players on a page, they would all be reacting to the same fullscreen
   // events
   librevjs.on(document, requestFullScreen.eventName, librevjs.bind(this, function(e){
     this.isFullScreen = document[requestFullScreen.isFullScreen];

     // If cancelling fullscreen, remove event listener.
     if (this.isFullScreen === false) {
       librevjs.off(document, requestFullScreen.eventName, arguments.callee);
     }

     this.trigger('fullscreenchange');
   }));

   this.el_[requestFullScreen.requestFn]();

 } else if (this.tech.supportsFullScreen()) {
   // we can't take the video.js controls fullscreen but we can go fullscreen
   // with native controls
   this.techCall('enterFullScreen');
 } else {
   // fullscreen isn't supported so we'll just stretch the video element to
   // fill the viewport
   this.enterFullWindow();
   this.trigger('fullscreenchange');
 }

 return this;
};

librevjs.Player.prototype.cancelFullScreen = function(){
 var requestFullScreen = librevjs.support.requestFullScreen;
 this.isFullScreen = false;

 // Check for browser element fullscreen support
 if (requestFullScreen) {
   document[requestFullScreen.cancelFn]();
 } else if (this.tech.supportsFullScreen()) {
  this.techCall('exitFullScreen');
 } else {
  this.exitFullWindow();
  this.trigger('fullscreenchange');
 }

 return this;
};

// When fullscreen isn't supported we can stretch the video container to as wide as the browser will let us.
librevjs.Player.prototype.enterFullWindow = function(){
 this.isFullWindow = true;

 // Storing original doc overflow value to return to when fullscreen is off
 this.docOrigOverflow = document.documentElement.style.overflow;

 // Add listener for esc key to exit fullscreen
 librevjs.on(document, 'keydown', librevjs.bind(this, this.fullWindowOnEscKey));

 // Hide any scroll bars
 document.documentElement.style.overflow = 'hidden';

 // Apply fullscreen styles
 librevjs.addClass(document.body, 'librevjs-full-window');

 this.trigger('enterFullWindow');
};
librevjs.Player.prototype.fullWindowOnEscKey = function(event){
 if (event.keyCode === 27) {
   if (this.isFullScreen === true) {
     this.cancelFullScreen();
   } else {
     this.exitFullWindow();
   }
 }
};

librevjs.Player.prototype.exitFullWindow = function(){
 this.isFullWindow = false;
 librevjs.off(document, 'keydown', this.fullWindowOnEscKey);

 // Unhide scroll bars.
 document.documentElement.style.overflow = this.docOrigOverflow;

 // Remove fullscreen styles
 librevjs.removeClass(document.body, 'librevjs-full-window');

 // Resize the box, controller, and poster to original sizes
 // this.positionAll();
 this.trigger('exitFullWindow');
};

librevjs.Player.prototype.selectSource = function(sources){

 // Loop through each playback technology in the options order
 for (var i=0,j=this.options_['techOrder'];i<j.length;i++) {
   var techName = librevjs.capitalize(j[i]),
       tech = window['cliplibrejs'][techName];

   // Check if the browser supports this technology
   if (tech.isSupported()) {
     // Loop through each source object
     for (var a=0,b=sources;a<b.length;a++) {
       var source = b[a];

       // Check if source can be played with this technology
       if (tech['canPlaySource'](source)) {
         return { source: source, tech: techName };
       }
     }
   }
 }

 return false;
};

// src is a pretty powerful function
// If you pass it an array of source objects, it will find the best source to play and use that object.src
//   If the new source requires a new playback technology, it will switch to that.
// If you pass it an object, it will set the source to object.src
// If you pass it anything else (url string) it will set the video source to that
librevjs.Player.prototype.src = function(source){
 // Case: Array of source objects to choose from and pick the best to play
 if (source instanceof Array) {

   var sourceTech = this.selectSource(source),
       techName;

   if (sourceTech) {
       source = sourceTech.source;
       techName = sourceTech.tech;

     // If this technology is already loaded, set source
     if (techName == this.techName) {
       this.src(source); // Passing the source object
     // Otherwise load this technology with chosen source
     } else {
       this.loadTech(techName, source);
     }
   } else {
     this.el_.appendChild(librevjs.createEl('p', {
       innerHTML: this.options()['notSupportedMessage']
     }));
   }

 // Case: Source object { src: '', type: '' ... }
 } else if (source instanceof Object) {

   if (window['cliplibrejs'][this.techName]['canPlaySource'](source)) {
     this.src(source.src);
   } else {
     // Send through tech loop to check for a compatible technology.
     this.src([source]);
   }

 // Case: URL String (http://myvideo...)
 } else {
   // Cache for getting last set source
   this.cache_.src = source;

   if (!this.isReady_) {
     this.ready(function(){
       this.src(source);
     });
   } else {
     this.techCall('src', source);
     if (this.options_['preload'] == 'auto') {
       this.load();
     }
     if (this.options_['autoplay']) {
       this.play();
     }
   }
 }
 return this;
};

// Begin loading the src data
// http://dev.w3.org/html5/spec/video.html#dom-media-load
librevjs.Player.prototype.load = function(){
 this.techCall('load');
 return this;
};

// http://dev.w3.org/html5/spec/video.html#dom-media-currentsrc
librevjs.Player.prototype.currentSrc = function(){
 return this.techGet('currentSrc') || this.cache_.src || '';
};

// Attributes/Options
librevjs.Player.prototype.preload = function(value){
 if (value !== undefined) {
   this.techCall('setPreload', value);
   this.options_['preload'] = value;
   return this;
 }
 return this.techGet('preload');
};
librevjs.Player.prototype.autoplay = function(value){
 if (value !== undefined) {
   this.techCall('setAutoplay', value);
   this.options_['autoplay'] = value;
   return this;
 }
 return this.techGet('autoplay', value);
};
librevjs.Player.prototype.loop = function(value){
 if (value !== undefined) {
   this.techCall('setLoop', value);
   this.options_['loop'] = value;
   return this;
 }
 return this.techGet('loop');
};

/**
* The url of the poster image source.
* @type {String}
* @private
*/
librevjs.Player.prototype.poster_;

/**
* Get or set the poster image source url.
* @param  {String} src Poster image source URL
* @return {String}    Poster image source URL or null
*/
librevjs.Player.prototype.poster = function(src){
 if (src !== undefined) {
   this.poster_ = src;
 }
 return this.poster_;
};

/**
* Whether or not the controls are showing
* @type {Boolean}
* @private
*/
librevjs.Player.prototype.controls_;

/**
* Get or set whether or not the controls are showing.
* @param  {Boolean} controls Set controls to showing or not
* @return {Boolean}    Controls are showing
*/
librevjs.Player.prototype.controls = function(bool){
 if (bool !== undefined) {
   bool = !!bool; // force boolean
   // Don't trigger a change event unless it actually changed
   if (this.controls_ !== bool) {
     this.controls_ = bool;
     if (bool) {
       this.removeClass('librevjs-controls-disabled');
       this.addClass('librevjs-controls-enabled');
       this.trigger('controlsenabled');
     } else {
       this.removeClass('librevjs-controls-enabled');
       this.addClass('librevjs-controls-disabled');
       this.trigger('controlsdisabled');
     }
   }
   return this;
 }
 return this.controls_;
};

librevjs.Player.prototype.usingNativeControls_;

/**
* Toggle native controls on/off. Native controls are the controls built into
* devices (e.g. default iPhone controls), Flash, or other techs
* (e.g. Vimeo Controls)
*
* **This should only be set by the current tech, because only the tech knows
* if it can support native controls**
*
* @param  {Boolean} bool    True signals that native controls are on
* @return {librevjs.Player}      Returns the player
*/
librevjs.Player.prototype.usingNativeControls = function(bool){
 if (bool !== undefined) {
   bool = !!bool; // force boolean
   // Don't trigger a change event unless it actually changed
   if (this.usingNativeControls_ !== bool) {
     this.usingNativeControls_ = bool;
     if (bool) {
       this.addClass('librevjs-using-native-controls');
       this.trigger('usingnativecontrols');
     } else {
       this.removeClass('librevjs-using-native-controls');
       this.trigger('usingcustomcontrols');
     }
   }
   return this;
 }
 return this.usingNativeControls_;
};

librevjs.Player.prototype.error = function(){ return this.techGet('error'); };
librevjs.Player.prototype.ended = function(){ return this.techGet('ended'); };
librevjs.Player.prototype.seeking = function(){ return this.techGet('seeking'); };

// When the player is first initialized, trigger activity so components
// like the control bar show themselves if needed
librevjs.Player.prototype.userActivity_ = true;
librevjs.Player.prototype.reportUserActivity = function(event){
 this.userActivity_ = true;
};

librevjs.Player.prototype.userActive_ = true;
librevjs.Player.prototype.userActive = function(bool){
 if (bool !== undefined) {
   bool = !!bool;
   if (bool !== this.userActive_) {
     this.userActive_ = bool;
     if (bool) {
       // If the user was inactive and is now active we want to reset the
       // inactivity timer
       this.userActivity_ = true;
       this.removeClass('librevjs-user-inactive');
       this.addClass('librevjs-user-active');
       this.trigger('useractive');
     } else {
       // We're switching the state to inactive manually, so erase any other
       // activity
       this.userActivity_ = false;

       // Chrome/Safari/IE have bugs where when you change the cursor it can
       // trigger a mousemove event. This causes an issue when you're hiding
       // the cursor when the user is inactive, and a mousemove signals user
       // activity. Making it impossible to go into inactive mode. Specifically
       // this happens in fullscreen when we really need to hide the cursor.
       //
       // When this gets resolved in ALL browsers it can be removed
       // https://code.google.com/p/chromium/issues/detail?id=103041
       this.tech.one('mousemove', function(e){
         e.stopPropagation();
         e.preventDefault();
       });
       this.removeClass('librevjs-user-active');
       this.addClass('librevjs-user-inactive');
       this.trigger('userinactive');
     }
   }
   return this;
 }
 return this.userActive_;
};

librevjs.Player.prototype.listenForUserActivity = function(){
 var onMouseActivity, onMouseDown, mouseInProgress, onMouseUp,
     activityCheck, inactivityTimeout;

 onMouseActivity = this.reportUserActivity;

 onMouseDown = function() {
   onMouseActivity();
   // For as long as the they are touching the device or have their mouse down,
   // we consider them active even if they're not moving their finger or mouse.
   // So we want to continue to update that they are active
   clearInterval(mouseInProgress);
   // Setting userActivity=true now and setting the interval to the same time
   // as the activityCheck interval (250) should ensure we never miss the
   // next activityCheck
   mouseInProgress = setInterval(librevjs.bind(this, onMouseActivity), 250);
 };

 onMouseUp = function(event) {
   onMouseActivity();
   // Stop the interval that maintains activity if the mouse/touch is down
   clearInterval(mouseInProgress);
 };

 // Any mouse movement will be considered user activity
 this.on('mousedown', onMouseDown);
 this.on('mousemove', onMouseActivity);
 this.on('mouseup', onMouseUp);

 // Listen for keyboard navigation
 // Shouldn't need to use inProgress interval because of key repeat
 this.on('keydown', onMouseActivity);
 this.on('keyup', onMouseActivity);

 // Consider any touch events that bubble up to be activity
 // Certain touches on the tech will be blocked from bubbling because they
 // toggle controls
 this.on('touchstart', onMouseDown);
 this.on('touchmove', onMouseActivity);
 this.on('touchend', onMouseUp);
 this.on('touchcancel', onMouseUp);

 // Run an interval every 250 milliseconds instead of stuffing everything into
 // the mousemove/touchmove function itself, to prevent performance degradation.
 // `this.reportUserActivity` simply sets this.userActivity_ to true, which
 // then gets picked up by this loop
 // http://ejohn.org/blog/learning-from-twitter/
 activityCheck = setInterval(librevjs.bind(this, function() {
   // Check to see if mouse/touch activity has happened
   if (this.userActivity_) {
     // Reset the activity tracker
     this.userActivity_ = false;

     // If the user state was inactive, set the state to active
     this.userActive(true);

     // Clear any existing inactivity timeout to start the timer over
     clearTimeout(inactivityTimeout);

     // In X seconds, if no more activity has occurred the user will be
     // considered inactive
     inactivityTimeout = setTimeout(librevjs.bind(this, function() {
       // Protect against the case where the inactivityTimeout can trigger just
       // before the next user activity is picked up by the activityCheck loop
       // causing a flicker
       if (!this.userActivity_) {
         this.userActive(false);
       }
     }), 2000);
   }
 }), 250);

 // Clean up the intervals when we kill the player
 this.on('dispose', function(){
   clearInterval(activityCheck);
   clearTimeout(inactivityTimeout);
 });
};

// Methods to add support for
// networkState: function(){ return this.techCall('networkState'); },
// readyState: function(){ return this.techCall('readyState'); },
// seeking: function(){ return this.techCall('seeking'); },
// initialTime: function(){ return this.techCall('initialTime'); },
// startOffsetTime: function(){ return this.techCall('startOffsetTime'); },
// played: function(){ return this.techCall('played'); },
// seekable: function(){ return this.techCall('seekable'); },
// videoTracks: function(){ return this.techCall('videoTracks'); },
// audioTracks: function(){ return this.techCall('audioTracks'); },
// videoWidth: function(){ return this.techCall('videoWidth'); },
// videoHeight: function(){ return this.techCall('videoHeight'); },
// defaultPlaybackRate: function(){ return this.techCall('defaultPlaybackRate'); },
// playbackRate: function(){ return this.techCall('playbackRate'); },
// mediaGroup: function(){ return this.techCall('mediaGroup'); },
// controller: function(){ return this.techCall('controller'); },
// defaultMuted: function(){ return this.techCall('defaultMuted'); }

// TODO
// currentSrcList: the array of sources including other formats and bitrates
// playList: array of source lists in order of playback

// RequestFullscreen API
(function(){
 var prefix, requestFS, div;

 div = document.createElement('div');

 requestFS = {};

 // Current W3C Spec
 // http://dvcs.w3.org/hg/fullscreen/raw-file/tip/Overview.html#api
 // Mozilla Draft: https://wiki.mozilla.org/Gecko:FullScreenAPI#fullscreenchange_event
 // New: https://dvcs.w3.org/hg/fullscreen/raw-file/529a67b8d9f3/Overview.html
 if (div.cancelFullscreen !== undefined) {
   requestFS.requestFn = 'requestFullscreen';
   requestFS.cancelFn = 'exitFullscreen';
   requestFS.eventName = 'fullscreenchange';
   requestFS.isFullScreen = 'fullScreen';

 // Webkit (Chrome/Safari) and Mozilla (Firefox) have working implementations
 // that use prefixes and vary slightly from the new W3C spec. Specifically,
 // using 'exit' instead of 'cancel', and lowercasing the 'S' in Fullscreen.
 // Other browsers don't have any hints of which version they might follow yet,
 // so not going to try to predict by looping through all prefixes.
 } else {

   if (document.mozCancelFullScreen) {
     prefix = 'moz';
     requestFS.isFullScreen = prefix + 'FullScreen';
   } else {
     prefix = 'webkit';
     requestFS.isFullScreen = prefix + 'IsFullScreen';
   }

   if (div[prefix + 'RequestFullScreen']) {
     requestFS.requestFn = prefix + 'RequestFullScreen';
     requestFS.cancelFn = prefix + 'CancelFullScreen';
   }
   requestFS.eventName = prefix + 'fullscreenchange';
 }

 if (document[requestFS.cancelFn]) {
   librevjs.support.requestFullScreen = requestFS;
 }

})();


/**
* Container of main controls
* @param {librevjs.Player|Object} player
* @param {Object=} options
* @constructor
*/
librevjs.ControlBar = librevjs.Component.extend();

librevjs.ControlBar.prototype.options_ = {
 loadEvent: 'play',
 children: {
   'playToggle': {},
   'currentTimeDisplay': {},
   'timeDivider': {},
   'durationDisplay': {},
   'remainingTimeDisplay': {},
   'progressControl': {},
   'fullscreenToggle': {},
   'volumeControl': {},
   'muteToggle': {}
   // 'volumeMenuButton': {}
 }
};

librevjs.ControlBar.prototype.createEl = function(){
 return librevjs.createEl('div', {
   className: 'librevjs-control-bar'
 });
};
/**
* Button to toggle between play and pause
* @param {librevjs.Player|Object} player
* @param {Object=} options
* @constructor
*/
librevjs.PlayToggle = librevjs.Button.extend({
 /** @constructor */
 init: function(player, options){
   librevjs.Button.call(this, player, options);

   player.on('play', librevjs.bind(this, this.onPlay));
   player.on('pause', librevjs.bind(this, this.onPause));
 }
});

librevjs.PlayToggle.prototype.buttonText = 'Play';

librevjs.PlayToggle.prototype.buildCSSClass = function(){
 return 'librevjs-play-control ' + librevjs.Button.prototype.buildCSSClass.call(this);
};

 // OnClick - Toggle between play and pause
librevjs.PlayToggle.prototype.onClick = function(){
 if (this.player_.paused()) {
   this.player_.play();
 } else {
   this.player_.pause();
 }
};

 // OnPlay - Add the librevjs-playing class to the element so it can change appearance
librevjs.PlayToggle.prototype.onPlay = function(){
 librevjs.removeClass(this.el_, 'librevjs-paused');
 librevjs.addClass(this.el_, 'librevjs-playing');
 this.el_.children[0].children[0].innerHTML = 'Pause'; // change the button text to "Pause"
};

 // OnPause - Add the librevjs-paused class to the element so it can change appearance
librevjs.PlayToggle.prototype.onPause = function(){
 librevjs.removeClass(this.el_, 'librevjs-playing');
 librevjs.addClass(this.el_, 'librevjs-paused');
 this.el_.children[0].children[0].innerHTML = 'Play'; // change the button text to "Play"
};/**
* Displays the current time
* @param {librevjs.Player|Object} player
* @param {Object=} options
* @constructor
*/
librevjs.CurrentTimeDisplay = librevjs.Component.extend({
 /** @constructor */
 init: function(player, options){
   librevjs.Component.call(this, player, options);

   player.on('timeupdate', librevjs.bind(this, this.updateContent));
 }
});

librevjs.CurrentTimeDisplay.prototype.createEl = function(){
 var el = librevjs.Component.prototype.createEl.call(this, 'div', {
   className: 'librevjs-current-time librevjs-time-controls librevjs-control'
 });

 this.content = librevjs.createEl('div', {
   className: 'librevjs-current-time-display',
   innerHTML: '<span class="librevjs-control-text">Current Time </span>' + '0:00', // label the current time for screen reader users
   'aria-live': 'off' // tell screen readers not to automatically read the time as it changes
 });

 el.appendChild(librevjs.createEl('div').appendChild(this.content));
 return el;
};

librevjs.CurrentTimeDisplay.prototype.updateContent = function(){
 // Allows for smooth scrubbing, when player can't keep up.
 var time = (this.player_.scrubbing) ? this.player_.getCache().currentTime : this.player_.currentTime();
 this.content.innerHTML = '<span class="librevjs-control-text">Current Time </span>' + librevjs.formatTime(time, this.player_.duration());
};

/**
* Displays the duration
* @param {librevjs.Player|Object} player
* @param {Object=} options
* @constructor
*/
librevjs.DurationDisplay = librevjs.Component.extend({
 /** @constructor */
 init: function(player, options){
   librevjs.Component.call(this, player, options);

   player.on('timeupdate', librevjs.bind(this, this.updateContent)); // this might need to be changes to 'durationchange' instead of 'timeupdate' eventually, however the durationchange event fires before this.player_.duration() is set, so the value cannot be written out using this method. Once the order of durationchange and this.player_.duration() being set is figured out, this can be updated.
 }
});

librevjs.DurationDisplay.prototype.createEl = function(){
 var el = librevjs.Component.prototype.createEl.call(this, 'div', {
   className: 'librevjs-duration librevjs-time-controls librevjs-control'
 });

 this.content = librevjs.createEl('div', {
   className: 'librevjs-duration-display',
   innerHTML: '<span class="librevjs-control-text">Duration Time </span>' + '0:00', // label the duration time for screen reader users
   'aria-live': 'off' // tell screen readers not to automatically read the time as it changes
 });

 el.appendChild(librevjs.createEl('div').appendChild(this.content));
 return el;
};

librevjs.DurationDisplay.prototype.updateContent = function(){
 var duration = this.player_.duration();
 if (duration) {
     this.content.innerHTML = '<span class="librevjs-control-text">Duration Time </span>' + librevjs.formatTime(duration); // label the duration time for screen reader users
 }
};

/**
* Time Separator (Not used in main skin, but still available, and could be used as a 'spare element')
* @param {librevjs.Player|Object} player
* @param {Object=} options
* @constructor
*/
librevjs.TimeDivider = librevjs.Component.extend({
 /** @constructor */
 init: function(player, options){
   librevjs.Component.call(this, player, options);
 }
});

librevjs.TimeDivider.prototype.createEl = function(){
 return librevjs.Component.prototype.createEl.call(this, 'div', {
   className: 'librevjs-time-divider',
   innerHTML: '<div><span>/</span></div>'
 });
};

/**
* Displays the time left in the video
* @param {librevjs.Player|Object} player
* @param {Object=} options
* @constructor
*/
librevjs.RemainingTimeDisplay = librevjs.Component.extend({
 /** @constructor */
 init: function(player, options){
   librevjs.Component.call(this, player, options);

   player.on('timeupdate', librevjs.bind(this, this.updateContent));
 }
});

librevjs.RemainingTimeDisplay.prototype.createEl = function(){
 var el = librevjs.Component.prototype.createEl.call(this, 'div', {
   className: 'librevjs-remaining-time librevjs-time-controls librevjs-control'
 });

 this.content = librevjs.createEl('div', {
   className: 'librevjs-remaining-time-display',
   innerHTML: '<span class="librevjs-control-text">Remaining Time </span>' + '-0:00', // label the remaining time for screen reader users
   'aria-live': 'off' // tell screen readers not to automatically read the time as it changes
 });

 el.appendChild(librevjs.createEl('div').appendChild(this.content));
 return el;
};

librevjs.RemainingTimeDisplay.prototype.updateContent = function(){
 if (this.player_.duration()) {
   this.content.innerHTML = '<span class="librevjs-control-text">Remaining Time </span>' + '-'+ librevjs.formatTime(this.player_.remainingTime());
 }

 // Allows for smooth scrubbing, when player can't keep up.
 // var time = (this.player_.scrubbing) ? this.player_.getCache().currentTime : this.player_.currentTime();
 // this.content.innerHTML = librevjs.formatTime(time, this.player_.duration());
};
/**
* Toggle fullscreen video
* @param {librevjs.Player|Object} player
* @param {Object=} options
* @constructor
*/
librevjs.FullscreenToggle = librevjs.Button.extend({
 /** @constructor */
 init: function(player, options){
   librevjs.Button.call(this, player, options);
 }
});

librevjs.FullscreenToggle.prototype.buttonText = 'Fullscreen';

librevjs.FullscreenToggle.prototype.buildCSSClass = function(){
 return 'librevjs-fullscreen-control ' + librevjs.Button.prototype.buildCSSClass.call(this);
};

librevjs.FullscreenToggle.prototype.onClick = function(){
 if (!this.player_.isFullScreen) {
   this.player_.requestFullScreen();
   this.el_.children[0].children[0].innerHTML = 'Non-Fullscreen'; // change the button text to "Non-Fullscreen"
 } else {
   this.player_.cancelFullScreen();
   this.el_.children[0].children[0].innerHTML = 'Fullscreen'; // change the button to "Fullscreen"
 }
};/**
* Seek, Load Progress, and Play Progress
* @param {librevjs.Player|Object} player
* @param {Object=} options
* @constructor
*/
librevjs.ProgressControl = librevjs.Component.extend({
 /** @constructor */
 init: function(player, options){
   librevjs.Component.call(this, player, options);
 }
});

librevjs.ProgressControl.prototype.options_ = {
 children: {
   'seekBar': {}
 }
};

librevjs.ProgressControl.prototype.createEl = function(){
 return librevjs.Component.prototype.createEl.call(this, 'div', {
   className: 'librevjs-progress-control librevjs-control'
 });
};

/**
* Seek Bar and holder for the progress bars
* @param {librevjs.Player|Object} player
* @param {Object=} options
* @constructor
*/
librevjs.SeekBar = librevjs.Slider.extend({
 /** @constructor */
 init: function(player, options){
   librevjs.Slider.call(this, player, options);
   player.on('timeupdate', librevjs.bind(this, this.updateARIAAttributes));
   player.ready(librevjs.bind(this, this.updateARIAAttributes));
 }
});

librevjs.SeekBar.prototype.options_ = {
 children: {
   'loadProgressBar': {},
   'playProgressBar': {},
   'seekHandle': {}
 },
 'barName': 'playProgressBar',
 'handleName': 'seekHandle'
};

librevjs.SeekBar.prototype.playerEvent = 'timeupdate';

librevjs.SeekBar.prototype.createEl = function(){
 return librevjs.Slider.prototype.createEl.call(this, 'div', {
   className: 'librevjs-progress-holder',
   'aria-label': 'video progress bar'
 });
};

librevjs.SeekBar.prototype.updateARIAAttributes = function(){
   // Allows for smooth scrubbing, when player can't keep up.
   var time = (this.player_.scrubbing) ? this.player_.getCache().currentTime : this.player_.currentTime();
   this.el_.setAttribute('aria-valuenow',librevjs.round(this.getPercent()*100, 2)); // machine readable value of progress bar (percentage complete)
   this.el_.setAttribute('aria-valuetext',librevjs.formatTime(time, this.player_.duration())); // human readable value of progress bar (time complete)
};

librevjs.SeekBar.prototype.getPercent = function(){
 var currentTime;
 // Flash RTMP provider will not report the correct time
 // immediately after a seek. This isn't noticeable if you're
 // seeking while the video is playing, but it is if you seek
 // while the video is paused.
 if (this.player_.techName === 'Flash' && this.player_.seeking()) {
   var cache = this.player_.getCache();
   if (cache.lastSetCurrentTime) {
     currentTime = cache.lastSetCurrentTime;
   }
   else {
     currentTime = this.player_.currentTime();
   }
 }
 else {
   currentTime = this.player_.currentTime();
 }

 return currentTime / this.player_.duration();
};

librevjs.SeekBar.prototype.onMouseDown = function(event){
 librevjs.Slider.prototype.onMouseDown.call(this, event);

 this.player_.scrubbing = true;

 this.videoWasPlaying = !this.player_.paused();
 this.player_.pause();
};

librevjs.SeekBar.prototype.onMouseMove = function(event){
 var newTime = this.calculateDistance(event) * this.player_.duration();

 // Don't let video end while scrubbing.
 if (newTime == this.player_.duration()) { newTime = newTime - 0.1; }

 // Set new time (tell player to seek to new time)
 this.player_.currentTime(newTime);
};

librevjs.SeekBar.prototype.onMouseUp = function(event){
 librevjs.Slider.prototype.onMouseUp.call(this, event);

 this.player_.scrubbing = false;
 if (this.videoWasPlaying) {
   this.player_.play();
 }
};

librevjs.SeekBar.prototype.stepForward = function(){
 this.player_.currentTime(this.player_.currentTime() + 5); // more quickly fast forward for keyboard-only users
};

librevjs.SeekBar.prototype.stepBack = function(){
 this.player_.currentTime(this.player_.currentTime() - 5); // more quickly rewind for keyboard-only users
};


/**
* Shows load progres
* @param {librevjs.Player|Object} player
* @param {Object=} options
* @constructor
*/
librevjs.LoadProgressBar = librevjs.Component.extend({
 /** @constructor */
 init: function(player, options){
   librevjs.Component.call(this, player, options);
   player.on('progress', librevjs.bind(this, this.update));
 }
});

librevjs.LoadProgressBar.prototype.createEl = function(){
 return librevjs.Component.prototype.createEl.call(this, 'div', {
   className: 'librevjs-load-progress',
   innerHTML: '<span class="librevjs-control-text">Loaded: 0%</span>'
 });
};

librevjs.LoadProgressBar.prototype.update = function(){
 if (this.el_.style) { this.el_.style.width = librevjs.round(this.player_.bufferedPercent() * 100, 2) + '%'; }
};


/**
* Shows play progress
* @param {librevjs.Player|Object} player
* @param {Object=} options
* @constructor
*/
librevjs.PlayProgressBar = librevjs.Component.extend({
 /** @constructor */
 init: function(player, options){
   librevjs.Component.call(this, player, options);
 }
});

librevjs.PlayProgressBar.prototype.createEl = function(){
 return librevjs.Component.prototype.createEl.call(this, 'div', {
   className: 'librevjs-play-progress',
   innerHTML: '<span class="librevjs-control-text">Progress: 0%</span>'
 });
};

/**
* SeekBar component includes play progress bar, and seek handle
* Needed so it can determine seek position based on handle position/size
* @param {librevjs.Player|Object} player
* @param {Object=} options
* @constructor
*/
librevjs.SeekHandle = librevjs.SliderHandle.extend();

/** @inheritDoc */
librevjs.SeekHandle.prototype.defaultValue = '00:00';

/** @inheritDoc */
librevjs.SeekHandle.prototype.createEl = function(){
 return librevjs.SliderHandle.prototype.createEl.call(this, 'div', {
   className: 'librevjs-seek-handle'
 });
};/**
* Control the volume
* @param {librevjs.Player|Object} player
* @param {Object=} options
* @constructor
*/
librevjs.VolumeControl = librevjs.Component.extend({
 /** @constructor */
 init: function(player, options){
   librevjs.Component.call(this, player, options);

   // hide volume controls when they're not supported by the current tech
   if (player.tech && player.tech.features && player.tech.features['volumeControl'] === false) {
     this.addClass('librevjs-hidden');
   }
   player.on('loadstart', librevjs.bind(this, function(){
     if (player.tech.features && player.tech.features['volumeControl'] === false) {
       this.addClass('librevjs-hidden');
     } else {
       this.removeClass('librevjs-hidden');
     }
   }));
 }
});

librevjs.VolumeControl.prototype.options_ = {
 children: {
   'volumeBar': {}
 }
};

librevjs.VolumeControl.prototype.createEl = function(){
 return librevjs.Component.prototype.createEl.call(this, 'div', {
   className: 'librevjs-volume-control librevjs-control'
 });
};

/**
* Contains volume level
* @param {librevjs.Player|Object} player
* @param {Object=} options
* @constructor
*/
librevjs.VolumeBar = librevjs.Slider.extend({
 /** @constructor */
 init: function(player, options){
   librevjs.Slider.call(this, player, options);
   player.on('volumechange', librevjs.bind(this, this.updateARIAAttributes));
   player.ready(librevjs.bind(this, this.updateARIAAttributes));
   setTimeout(librevjs.bind(this, this.update), 0); // update when elements is in DOM
 }
});

librevjs.VolumeBar.prototype.updateARIAAttributes = function(){
 // Current value of volume bar as a percentage
 this.el_.setAttribute('aria-valuenow',librevjs.round(this.player_.volume()*100, 2));
 this.el_.setAttribute('aria-valuetext',librevjs.round(this.player_.volume()*100, 2)+'%');
};

librevjs.VolumeBar.prototype.options_ = {
 children: {
   'volumeLevel': {},
   'volumeHandle': {}
 },
 'barName': 'volumeLevel',
 'handleName': 'volumeHandle'
};

librevjs.VolumeBar.prototype.playerEvent = 'volumechange';

librevjs.VolumeBar.prototype.createEl = function(){
 return librevjs.Slider.prototype.createEl.call(this, 'div', {
   className: 'librevjs-volume-bar',
   'aria-label': 'volume level'
 });
};

librevjs.VolumeBar.prototype.onMouseMove = function(event) {
 this.player_.volume(this.calculateDistance(event));
};

librevjs.VolumeBar.prototype.getPercent = function(){
 if (this.player_.muted()) {
   return 0;
 } else {
   return this.player_.volume();
 }
};

librevjs.VolumeBar.prototype.stepForward = function(){
 this.player_.volume(this.player_.volume() + 0.1);
};

librevjs.VolumeBar.prototype.stepBack = function(){
 this.player_.volume(this.player_.volume() - 0.1);
};

/**
* Shows volume level
* @param {librevjs.Player|Object} player
* @param {Object=} options
* @constructor
*/
librevjs.VolumeLevel = librevjs.Component.extend({
 /** @constructor */
 init: function(player, options){
   librevjs.Component.call(this, player, options);
 }
});

librevjs.VolumeLevel.prototype.createEl = function(){
 return librevjs.Component.prototype.createEl.call(this, 'div', {
   className: 'librevjs-volume-level',
   innerHTML: '<span class="librevjs-control-text"></span>'
 });
};

/**
* Change volume level
* @param {librevjs.Player|Object} player
* @param {Object=} options
* @constructor
*/
librevjs.VolumeHandle = librevjs.SliderHandle.extend();

/** @inheritDoc */
librevjs.VolumeHandle.prototype.defaultValue = '00:00';

/** @inheritDoc */
librevjs.VolumeHandle.prototype.createEl = function(){
  return librevjs.SliderHandle.prototype.createEl.call(this, 'div', {
    className: 'librevjs-volume-handle'
  });
};
/**
* Mute the audio
* @param {librevjs.Player|Object} player
* @param {Object=} options
* @constructor
*/
librevjs.MuteToggle = librevjs.Button.extend({
 /** @constructor */
 init: function(player, options){
   librevjs.Button.call(this, player, options);

   player.on('volumechange', librevjs.bind(this, this.update));

   // hide mute toggle if the current tech doesn't support volume control
   if (player.tech && player.tech.features && player.tech.features['volumeControl'] === false) {
     this.addClass('librevjs-hidden');
   }
   player.on('loadstart', librevjs.bind(this, function(){
     if (player.tech.features && player.tech.features['volumeControl'] === false) {
       this.addClass('librevjs-hidden');
     } else {
       this.removeClass('librevjs-hidden');
     }
   }));
 }
});

librevjs.MuteToggle.prototype.createEl = function(){
 return librevjs.Button.prototype.createEl.call(this, 'div', {
   className: 'librevjs-mute-control librevjs-control',
   innerHTML: '<div><span class="librevjs-control-text">Mute</span></div>'
 });
};

librevjs.MuteToggle.prototype.onClick = function(){
 this.player_.muted( this.player_.muted() ? false : true );
};

librevjs.MuteToggle.prototype.update = function(){
 var vol = this.player_.volume(),
     level = 3;

 if (vol === 0 || this.player_.muted()) {
   level = 0;
 } else if (vol < 0.33) {
   level = 1;
 } else if (vol < 0.67) {
   level = 2;
 }

 // Don't rewrite the button text if the actual text doesn't change.
 // This causes unnecessary and confusing information for screen reader users.
 // This check is needed because this function gets called every time the volume level is changed.
 if(this.player_.muted()){
     if(this.el_.children[0].children[0].innerHTML!='Unmute'){
         this.el_.children[0].children[0].innerHTML = 'Unmute'; // change the button text to "Unmute"
     }
 } else {
     if(this.el_.children[0].children[0].innerHTML!='Mute'){
         this.el_.children[0].children[0].innerHTML = 'Mute'; // change the button text to "Mute"
     }
 }

 /* TODO improve muted icon classes */
 for (var i = 0; i < 4; i++) {
   librevjs.removeClass(this.el_, 'librevjs-vol-'+i);
 }
 librevjs.addClass(this.el_, 'librevjs-vol-'+level);
};
/**
* Menu button with a popup for showing the volume slider.
* @constructor
*/
librevjs.VolumeMenuButton = librevjs.MenuButton.extend({
 /** @constructor */
 init: function(player, options){
   librevjs.MenuButton.call(this, player, options);

   // Same listeners as MuteToggle
   player.on('volumechange', librevjs.bind(this, this.update));

   // hide mute toggle if the current tech doesn't support volume control
   if (player.tech && player.tech.features && player.tech.features.volumeControl === false) {
     this.addClass('librevjs-hidden');
   }
   player.on('loadstart', librevjs.bind(this, function(){
     if (player.tech.features && player.tech.features.volumeControl === false) {
       this.addClass('librevjs-hidden');
     } else {
       this.removeClass('librevjs-hidden');
     }
   }));
   this.addClass('librevjs-menu-button');
 }
});

librevjs.VolumeMenuButton.prototype.createMenu = function(){
 var menu = new librevjs.Menu(this.player_, {
   contentElType: 'div'
 });
 var vc = new librevjs.VolumeBar(this.player_, librevjs.obj.merge({vertical: true}, this.options_.volumeBar));
 menu.addChild(vc);
 return menu;
};

librevjs.VolumeMenuButton.prototype.onClick = function(){
 librevjs.MuteToggle.prototype.onClick.call(this);
 librevjs.MenuButton.prototype.onClick.call(this);
};

librevjs.VolumeMenuButton.prototype.createEl = function(){
 return librevjs.Button.prototype.createEl.call(this, 'div', {
   className: 'librevjs-volume-menu-button librevjs-menu-button librevjs-control',
   innerHTML: '<div><span class="librevjs-control-text">Mute</span></div>'
 });
};
librevjs.VolumeMenuButton.prototype.update = librevjs.MuteToggle.prototype.update;
/* Poster Image
================================================================================ */
/**
* Poster image. Shows before the video plays.
* @param {librevjs.Player|Object} player
* @param {Object=} options
* @constructor
*/
librevjs.PosterImage = librevjs.Button.extend({
 /** @constructor */
 init: function(player, options){
   librevjs.Button.call(this, player, options);

   if (!player.poster() || !player.controls()) {
     this.hide();
   }

   player.on('play', librevjs.bind(this, this.hide));
 }
});

librevjs.PosterImage.prototype.createEl = function(){
 var el = librevjs.createEl('div', {
       className: 'librevjs-poster',

       // Don't want poster to be tabbable.
       tabIndex: -1
     }),
     poster = this.player_.poster();

 if (poster) {
   if ('backgroundSize' in el.style) {
     el.style.backgroundImage = 'url("' + poster + '")';
   } else {
     el.appendChild(librevjs.createEl('img', { src: poster }));
   }
 }

 return el;
};

librevjs.PosterImage.prototype.onClick = function(){
 // Only accept clicks when controls are enabled
 if (this.player().controls()) {
   this.player_.play();
 }
};
/* Loading Spinner
================================================================================ */
/**
* Loading spinner for waiting events
* @param {librevjs.Player|Object} player
* @param {Object=} options
* @constructor
*/
librevjs.LoadingSpinner = librevjs.Component.extend({
 /** @constructor */
 init: function(player, options){
   librevjs.Component.call(this, player, options);

   player.on('canplay', librevjs.bind(this, this.hide));
   player.on('canplaythrough', librevjs.bind(this, this.hide));
   player.on('playing', librevjs.bind(this, this.hide));
   player.on('seeked', librevjs.bind(this, this.hide));

   player.on('seeking', librevjs.bind(this, this.show));

   // in some browsers seeking does not trigger the 'playing' event,
   // so we also need to trap 'seeked' if we are going to set a
   // 'seeking' event
   player.on('seeked', librevjs.bind(this, this.hide));

   player.on('error', librevjs.bind(this, this.show));

   // Not showing spinner on stalled any more. Browsers may stall and then not trigger any events that would remove the spinner.
   // player.on('stalled', librevjs.bind(this, this.show));

   player.on('waiting', librevjs.bind(this, this.show));
 }
});

librevjs.LoadingSpinner.prototype.createEl = function(){
 return librevjs.Component.prototype.createEl.call(this, 'div', {
   className: 'librevjs-loading-spinner'
 });
};
/* Big Play Button
================================================================================ */
/**
* Initial play button. Shows before the video has played. The hiding of the
* big play button is done via CSS and player states.
* @param {librevjs.Player|Object} player
* @param {Object=} options
* @constructor
*/
librevjs.BigPlayButton = librevjs.Button.extend();

librevjs.BigPlayButton.prototype.createEl = function(){
 return librevjs.Button.prototype.createEl.call(this, 'div', {
   className: 'librevjs-big-play-button',
   innerHTML: '<span></span>',
   'aria-label': 'play video'
 });
};

librevjs.BigPlayButton.prototype.onClick = function(){
 this.player_.play();
};
/**
* @fileoverview Media Technology Controller - Base class for media playback
* technology controllers like Flash and HTML5
*/

/**
* Base class for media (HTML5 Video, Flash) controllers
* @param {librevjs.Player|Object} player  Central player instance
* @param {Object=} options Options object
* @constructor
*/
librevjs.MediaTechController = librevjs.Component.extend({
 /** @constructor */
 init: function(player, options, ready){
   librevjs.Component.call(this, player, options, ready);

   this.initControlsListeners();
 }
});

/**
* Set up click and touch listeners for the playback element
* On desktops, a click on the video itself will toggle playback,
* on a mobile device a click on the video toggles controls.
* (toggling controls is done by toggling the user state between active and
* inactive)
*
* A tap can signal that a user has become active, or has become inactive
* e.g. a quick tap on an iPhone movie should reveal the controls. Another
* quick tap should hide them again (signaling the user is in an inactive
* viewing state)
*
* In addition to this, we still want the user to be considered inactive after
* a few seconds of inactivity.
*
* Note: the only part of iOS interaction we can't mimic with this setup
* is a touch and hold on the video element counting as activity in order to
* keep the controls showing, but that shouldn't be an issue. A touch and hold on
* any controls will still keep the user active
*/
librevjs.MediaTechController.prototype.initControlsListeners = function(){
 var player, tech, activateControls, deactivateControls;

 tech = this;
 player = this.player();

 var activateControls = function(){
   if (player.controls() && !player.usingNativeControls()) {
     tech.addControlsListeners();
   }
 };

 deactivateControls = librevjs.bind(tech, tech.removeControlsListeners);

 // Set up event listeners once the tech is ready and has an element to apply
 // listeners to
 this.ready(activateControls);
 player.on('controlsenabled', activateControls);
 player.on('controlsdisabled', deactivateControls);
};

librevjs.MediaTechController.prototype.addControlsListeners = function(){
 var preventBubble, userWasActive;

 // Some browsers (Chrome & IE) don't trigger a click on a flash swf, but do
 // trigger mousedown/up.
 // http://stackoverflow.com/questions/1444562/javascript-onclick-event-over-flash-object
 // Any touch events are set to block the mousedown event from happening
 this.on('mousedown', this.onClick);

 // We need to block touch events on the video element from bubbling up,
 // otherwise they'll signal activity prematurely. The specific use case is
 // when the video is playing and the controls have faded out. In this case
 // only a tap (fast touch) should toggle the user active state and turn the
 // controls back on. A touch and move or touch and hold should not trigger
 // the controls (per iOS as an example at least)
 //
 // We always want to stop propagation on touchstart because touchstart
 // at the player level starts the touchInProgress interval. We can still
 // report activity on the other events, but won't let them bubble for
 // consistency. We don't want to bubble a touchend without a touchstart.
 this.on('touchstart', function(event) {
   // Stop the mouse events from also happening
   event.preventDefault();
   event.stopPropagation();
   // Record if the user was active now so we don't have to keep polling it
   userWasActive = this.player_.userActive();
 });

 preventBubble = function(event){
   event.stopPropagation();
   if (userWasActive) {
     this.player_.reportUserActivity();
   }
 };

 // Treat all touch events the same for consistency
 this.on('touchmove', preventBubble);
 this.on('touchleave', preventBubble);
 this.on('touchcancel', preventBubble);
 this.on('touchend', preventBubble);

 // Turn on component tap events
 this.emitTapEvents();

 // The tap listener needs to come after the touchend listener because the tap
 // listener cancels out any reportedUserActivity when setting userActive(false)
 this.on('tap', this.onTap);
};

/**
* Remove the listeners used for click and tap controls. This is needed for
* toggling to controls disabled, where a tap/touch should do nothing.
*/
librevjs.MediaTechController.prototype.removeControlsListeners = function(){
 // We don't want to just use `this.off()` because there might be other needed
 // listeners added by techs that extend this.
 this.off('tap');
 this.off('touchstart');
 this.off('touchmove');
 this.off('touchleave');
 this.off('touchcancel');
 this.off('touchend');
 this.off('click');
 this.off('mousedown');
};

/**
* Handle a click on the media element. By default will play/pause the media.
*/
librevjs.MediaTechController.prototype.onClick = function(event){
 // We're using mousedown to detect clicks thanks to Flash, but mousedown
 // will also be triggered with right-clicks, so we need to prevent that
 if (event.button !== 0) return;

 // When controls are disabled a click should not toggle playback because
 // the click is considered a control
 if (this.player().controls()) {
   if (this.player().paused()) {
     this.player().play();
   } else {
     this.player().pause();
   }
 }
};

/**
* Handle a tap on the media element. By default it will toggle the user
* activity state, which hides and shows the controls.
*/

librevjs.MediaTechController.prototype.onTap = function(){
 this.player().userActive(!this.player().userActive());
};

librevjs.MediaTechController.prototype.features = {
 'volumeControl': true,

 // Resizing plugins using request fullscreen reloads the plugin
 'fullscreenResize': false,

 // Optional events that we can manually mimic with timers
 // currently not triggered by video-js-swf
 'progressEvents': false,
 'timeupdateEvents': false
};

librevjs.media = {};

/**
* List of default API methods for any MediaTechController
* @type {String}
*/
librevjs.media.ApiMethods = 'play,pause,paused,currentTime,setCurrentTime,duration,buffered,volume,setVolume,muted,setMuted,width,height,supportsFullScreen,enterFullScreen,src,load,currentSrc,preload,setPreload,autoplay,setAutoplay,loop,setLoop,error,networkState,readyState,seeking,initialTime,startOffsetTime,played,seekable,ended,videoTracks,audioTracks,videoWidth,videoHeight,textTracks,defaultPlaybackRate,playbackRate,mediaGroup,controller,controls,defaultMuted'.split(',');
// Create placeholder methods for each that warn when a method isn't supported by the current playback technology

function createMethod(methodName){
 return function(){
   throw new Error('The "'+methodName+'" method is not available on the playback technology\'s API');
 };
}

for (var i = librevjs.media.ApiMethods.length - 1; i >= 0; i--) {
 var methodName = librevjs.media.ApiMethods[i];
 librevjs.MediaTechController.prototype[librevjs.media.ApiMethods[i]] = createMethod(methodName);
}
/**
* @fileoverview HTML5 Media Controller - Wrapper for HTML5 Media API
*/

/**
* HTML5 Media Controller - Wrapper for HTML5 Media API
* @param {librevjs.Player|Object} player
* @param {Object=} options
* @param {Function=} ready
* @constructor
*/
librevjs.Html5 = librevjs.MediaTechController.extend({
 /** @constructor */
 init: function(player, options, ready){
   // volume cannot be changed from 1 on iOS
   this.features['volumeControl'] = librevjs.Html5.canControlVolume();

   // In iOS, if you move a video element in the DOM, it breaks video playback.
   this.features['movingMediaElementInDOM'] = !librevjs.IS_IOS;

   // HTML video is able to automatically resize when going to fullscreen
   this.features['fullscreenResize'] = true;

   librevjs.MediaTechController.call(this, player, options, ready);

   var source = options['source'];

   // If the element source is already set, we may have missed the loadstart event, and want to trigger it.
   // We don't want to set the source again and interrupt playback.
   if (source && this.el_.currentSrc === source.src && this.el_.networkState > 0) {
     player.trigger('loadstart');

   // Otherwise set the source if one was provided.
   } else if (source) {
     this.el_.src = source.src;
   }

   // Determine if native controls should be used
   // Our goal should be to get the custom controls on mobile solid everywhere
   // so we can remove this all together. Right now this will block custom
   // controls on touch enabled laptops like the Chrome Pixel
   if (librevjs.TOUCH_ENABLED && player.options()['nativeControlsForTouch'] === true) {
     this.useNativeControls();
   }

   // Chrome and Safari both have issues with autoplay.
   // In Safari (5.1.1), when we move the video element into the container div, autoplay doesn't work.
   // In Chrome (15), if you have autoplay + a poster + no controls, the video gets hidden (but audio plays)
   // This fixes both issues. Need to wait for API, so it updates displays correctly
   player.ready(function(){
     if (this.tag && this.options_['autoplay'] && this.paused()) {
       delete this.tag['poster']; // Chrome Fix. Fixed in Chrome v16.
       this.play();
     }
   });

   this.setupTriggers();
   this.triggerReady();
 }
});

librevjs.Html5.prototype.dispose = function(){
 librevjs.MediaTechController.prototype.dispose.call(this);
};

librevjs.Html5.prototype.createEl = function(){
 var player = this.player_,
     // If possible, reuse original tag for HTML5 playback technology element
     el = player.tag,
     newEl,
     clone;

 // Check if this browser supports moving the element into the box.
 // On the iPhone video will break if you move the element,
 // So we have to create a brand new element.
 if (!el || this.features['movingMediaElementInDOM'] === false) {

   // If the original tag is still there, clone and remove it.
   if (el) {
     clone = el.cloneNode(false);
     librevjs.Html5.disposeMediaElement(el);
     el = clone;
     player.tag = null;
   } else {
     el = librevjs.createEl('video', {
       id:player.id() + '_html5_api',
       className:'librevjs-tech'
     });
   }
   // associate the player with the new tag
   el['player'] = player;

   librevjs.insertFirst(el, player.el());
 }

 // Update specific tag settings, in case they were overridden
 var attrs = ['autoplay','preload','loop','muted'];
 for (var i = attrs.length - 1; i >= 0; i--) {
   var attr = attrs[i];
   if (player.options_[attr] !== null) {
     el[attr] = player.options_[attr];
   }
 }

 return el;
 // jenniisawesome = true;
};

// Make video events trigger player events
// May seem verbose here, but makes other APIs possible.
librevjs.Html5.prototype.setupTriggers = function(){
 for (var i = librevjs.Html5.Events.length - 1; i >= 0; i--) {
   librevjs.on(this.el_, librevjs.Html5.Events[i], librevjs.bind(this.player_, this.eventHandler));
 }
};
// Triggers removed using this.off when disposed

librevjs.Html5.prototype.eventHandler = function(e){
 this.trigger(e);

 // No need for media events to bubble up.
 e.stopPropagation();
};

librevjs.Html5.prototype.useNativeControls = function(){
 var tech, player, controlsOn, controlsOff, cleanUp;

 tech = this;
 player = this.player();

 // If the player controls are enabled turn on the native controls
 tech.setControls(player.controls());

 // Update the native controls when player controls state is updated
 controlsOn = function(){
   tech.setControls(true);
 };
 controlsOff = function(){
   tech.setControls(false);
 };
 player.on('controlsenabled', controlsOn);
 player.on('controlsdisabled', controlsOff);

 // Clean up when not using native controls anymore
 cleanUp = function(){
   player.off('controlsenabled', controlsOn);
   player.off('controlsdisabled', controlsOff);
 };
 tech.on('dispose', cleanUp);
 player.on('usingcustomcontrols', cleanUp);

 // Update the state of the player to using native controls
 player.usingNativeControls(true);
};


librevjs.Html5.prototype.play = function(){ this.el_.play(); };
librevjs.Html5.prototype.pause = function(){ this.el_.pause(); };
librevjs.Html5.prototype.paused = function(){ return this.el_.paused; };

librevjs.Html5.prototype.currentTime = function(){ return this.el_.currentTime; };
librevjs.Html5.prototype.setCurrentTime = function(seconds){
 try {
   this.el_.currentTime = seconds;
 } catch(e) {
   librevjs.log(e, 'Video is not ready. (LibreVideo.js)');
   // this.warning(LibreVideoJS.warnings.videoNotReady);
 }
};

librevjs.Html5.prototype.duration = function(){ return this.el_.duration || 0; };
librevjs.Html5.prototype.buffered = function(){ return this.el_.buffered; };

librevjs.Html5.prototype.volume = function(){ return this.el_.volume; };
librevjs.Html5.prototype.setVolume = function(percentAsDecimal){ this.el_.volume = percentAsDecimal; };
librevjs.Html5.prototype.muted = function(){ return this.el_.muted; };
librevjs.Html5.prototype.setMuted = function(muted){ this.el_.muted = muted; };

librevjs.Html5.prototype.width = function(){ return this.el_.offsetWidth; };
librevjs.Html5.prototype.height = function(){ return this.el_.offsetHeight; };

librevjs.Html5.prototype.supportsFullScreen = function(){
 if (typeof this.el_.webkitEnterFullScreen == 'function') {

   // Seems to be broken in Chromium/Chrome && Safari in Leopard
   if (/Android/.test(librevjs.USER_AGENT) || !/Chrome|Mac OS X 10.5/.test(librevjs.USER_AGENT)) {
     return true;
   }
 }
 return false;
};

librevjs.Html5.prototype.enterFullScreen = function(){
 var video = this.el_;
 if (video.paused && video.networkState <= video.HAVE_METADATA) {
   // attempt to prime the video element for programmatic access
   // this isn't necessary on the desktop but shouldn't hurt
   this.el_.play();

   // playing and pausing synchronously during the transition to fullscreen
   // can get iOS ~6.1 devices into a play/pause loop
   setTimeout(function(){
     video.pause();
     video.webkitEnterFullScreen();
   }, 0);
 } else {
   video.webkitEnterFullScreen();
 }
};
librevjs.Html5.prototype.exitFullScreen = function(){
 this.el_.webkitExitFullScreen();
};
librevjs.Html5.prototype.src = function(src){ this.el_.src = src; };
librevjs.Html5.prototype.load = function(){ this.el_.load(); };
librevjs.Html5.prototype.currentSrc = function(){ return this.el_.currentSrc; };

librevjs.Html5.prototype.preload = function(){ return this.el_.preload; };
librevjs.Html5.prototype.setPreload = function(val){ this.el_.preload = val; };

librevjs.Html5.prototype.autoplay = function(){ return this.el_.autoplay; };
librevjs.Html5.prototype.setAutoplay = function(val){ this.el_.autoplay = val; };

librevjs.Html5.prototype.controls = function(){ return this.el_.controls; }
librevjs.Html5.prototype.setControls = function(val){ this.el_.controls = !!val; }

librevjs.Html5.prototype.loop = function(){ return this.el_.loop; };
librevjs.Html5.prototype.setLoop = function(val){ this.el_.loop = val; };

librevjs.Html5.prototype.error = function(){ return this.el_.error; };
librevjs.Html5.prototype.seeking = function(){ return this.el_.seeking; };
librevjs.Html5.prototype.ended = function(){ return this.el_.ended; };
librevjs.Html5.prototype.defaultMuted = function(){ return this.el_.defaultMuted; };

/* HTML5 Support Testing ---------------------------------------------------- */

librevjs.Html5.isSupported = function(){
 return !!librevjs.TEST_VID.canPlayType;
};

librevjs.Html5.canPlaySource = function(srcObj){
 // MediaPlayer throws an error here
 try {
   return !!librevjs.TEST_VID.canPlayType(srcObj.type);
 } catch(e) {
   return '';
 }
 // TODO: Check Type
 // If no Type, check ext
 // Check Media Type
};

librevjs.Html5.canControlVolume = function(){
 var volume =  librevjs.TEST_VID.volume;
 librevjs.TEST_VID.volume = (volume / 2) + 0.1;
 return volume !== librevjs.TEST_VID.volume;
};

// List of all HTML5 events (various uses).
librevjs.Html5.Events = 'loadstart,suspend,abort,error,emptied,stalled,loadedmetadata,loadeddata,canplay,canplaythrough,playing,waiting,seeking,seeked,ended,durationchange,timeupdate,progress,play,pause,ratechange,volumechange'.split(',');

librevjs.Html5.disposeMediaElement = function(el){
 if (!el) { return; }

 el['player'] = null;

 if (el.parentNode) {
   el.parentNode.removeChild(el);
 }

 // remove any child track or source nodes to prevent their loading
 while(el.hasChildNodes()) {
   el.removeChild(el.firstChild);
 }

 // remove any src reference. not setting `src=''` because that causes a warning
 // in firefox
 el.removeAttribute('src');

 // force the media element to update its loading state by calling load()
 if (typeof el.load === 'function') {
   el.load();
 }
};

// HTML5 Feature detection and Device Fixes --------------------------------- //

 // Override Android 2.2 and less canPlayType method which is broken
if (librevjs.IS_OLD_ANDROID) {
 document.createElement('video').constructor.prototype.canPlayType = function(type){
   return (type && type.toLowerCase().indexOf('video/mp4') != -1) ? 'maybe' : '';
 };
}
/**
* @fileoverview LibreVideoJS NO use flash
* Not using setupTriggers. Using global onEvent func to distribute events
*/

/**
* HTML5 Media Controller - Wrapper for HTML5 Media API
* @param {librevjs.Player|Object} player
* @param {Object=} options
* @param {Function=} ready
* @constructor
*/
librevjs.Flash = librevjs.MediaTechController.extend({
 /** @constructor */
 init: function(player, options, ready){
   librevjs.MediaTechController.call(this, player, options, ready);

   var source = options['source'],

       // Which element to embed in
       parentEl = options['parentEl'],

       // Create a temporary element to be replaced by swf object
       placeHolder = this.el_ = librevjs.createEl('div', { id: player.id() + '_temp_flash' }),

       // Generate ID for swf object
       objId = player.id()+'_flash_api',

       // Store player options in local var for optimization
       // TODO: switch to using player methods instead of options
       // e.g. player.autoplay();
       playerOptions = player.options_,

       // Merge default flashvars with ones passed in to init
       flashVars = librevjs.obj.merge({

         // SWF Callback Functions
         'readyFunction': 'cliplibrejs.Flash.onReady',
         'eventProxyFunction': 'cliplibrejs.Flash.onEvent',
         'errorEventProxyFunction': 'cliplibrejs.Flash.onError',

         // Player Settings
         'autoplay': playerOptions.autoplay,
         'preload': playerOptions.preload,
         'loop': playerOptions.loop,
         'muted': playerOptions.muted

       }, options['flashVars']),

       // Merge default parames with ones passed in
       params = librevjs.obj.merge({
         'wmode': 'opaque', // Opaque is needed to overlay controls, but can affect playback performance
         'bgcolor': '#000000' // Using bgcolor prevents a white flash when the object is loading
       }, options['params']),

       // Merge default attributes with ones passed in
       attributes = librevjs.obj.merge({
         'id': objId,
         'name': objId, // Both ID and Name needed or swf to identifty itself
         'class': 'librevjs-tech'
       }, options['attributes'])
   ;

   // If source was supplied pass as a flash var.
   if (source) {
     if (source.type && librevjs.Flash.isStreamingType(source.type)) {
       var parts = librevjs.Flash.streamToParts(source.src);
       flashVars['rtmpConnection'] = encodeURIComponent(parts.connection);
       flashVars['rtmpStream'] = encodeURIComponent(parts.stream);
     }
     else {
       flashVars['src'] = encodeURIComponent(librevjs.getAbsoluteURL(source.src));
     }
   }

   // Add placeholder to player div
   librevjs.insertFirst(placeHolder, parentEl);

   // Having issues with Flash reloading on certain page actions (hide/resize/fullscreen) in certain browsers
   // This allows resetting the playhead when we catch the reload
   if (options['startTime']) {
     this.ready(function(){
       this.load();
       this.play();
       this.currentTime(options['startTime']);
     });
   }

   // Flash iFrame Mode
   // In web browsers there are multiple instances where changing the parent element or visibility of a plugin causes the plugin to reload.
   // - Firefox just about always. https://bugzilla.mozilla.org/show_bug.cgi?id=90268 (might be fixed by version 13)
   // - Webkit when hiding the plugin
   // - Webkit and Firefox when using requestFullScreen on a parent element
   // Loading the flash plugin into a dynamically generated iFrame gets around most of these issues.
   // Issues that remain include hiding the element and requestFullScreen in Firefox specifically

   // There's on particularly annoying issue with this method which is that Firefox throws a security error on an offsite Flash object loaded into a dynamically created iFrame.
   // Even though the iframe was inserted into a page on the web, Firefox + Flash considers it a local app trying to access an internet file.
   // I tried mulitple ways of setting the iframe src attribute but couldn't find a src that worked well. Tried a real/fake source, in/out of domain.
   // Also tried a method from stackoverflow that caused a security error in all browsers. http://stackoverflow.com/questions/2486901/how-to-set-document-domain-for-a-dynamically-generated-iframe
   // In the end the solution I found to work was setting the iframe window.location.href right before doing a document.write of the Flash object.
   // The only downside of this it seems to trigger another http request to the original page (no matter what's put in the href). Not sure why that is.

   // NOTE (2012-01-29): Cannot get Firefox to load the remote hosted SWF into a dynamically created iFrame
   // Firefox 9 throws a security error, unleess you call location.href right before doc.write.
   //    Not sure why that even works, but it causes the browser to look like it's continuously trying to load the page.
   // Firefox 3.6 keeps calling the iframe onload function anytime I write to it, causing an endless loop.

   if (options['iFrameMode'] === true && !librevjs.IS_FIREFOX) {

     // Create iFrame with librevjs-tech class so it's 100% width/height
     var iFrm = librevjs.createEl('iframe', {
       'id': objId + '_iframe',
       'name': objId + '_iframe',
       'className': 'librevjs-tech',
       'scrolling': 'no',
       'marginWidth': 0,
       'marginHeight': 0,
       'frameBorder': 0
     });

     // Update ready function names in flash vars for iframe window
     flashVars['readyFunction'] = 'ready';
     flashVars['eventProxyFunction'] = 'events';
     flashVars['errorEventProxyFunction'] = 'errors';

     // Tried multiple methods to get this to work in all browsers

     // Tried embedding the flash object in the page first, and then adding a place holder to the iframe, then replacing the placeholder with the page object.
     // The goal here was to try to load the swf URL in the parent page first and hope that got around the firefox security error
     // var newObj = librevjs.Flash.embed(options['swf'], placeHolder, flashVars, params, attributes);
     // (in onload)
     //  var temp = librevjs.createEl('a', { id:'asdf', innerHTML: 'asdf' } );
     //  iDoc.body.appendChild(temp);

     // Tried embedding the flash object through javascript in the iframe source.
     // This works in webkit but still triggers the firefox security error
     // iFrm.src = 'javascript: document.write('"+librevjs.Flash.getEmbedCode(options['swf'], flashVars, params, attributes)+"');";

     // Tried an actual local iframe just to make sure that works, but it kills the easiness of the CDN version if you require the user to host an iframe
     // We should add an option to host the iframe locally though, because it could help a lot of issues.
     // iFrm.src = "iframe.html";

     // Wait until iFrame has loaded to write into it.
     librevjs.on(iFrm, 'load', librevjs.bind(this, function(){

       var iDoc,
           iWin = iFrm.contentWindow;

       // The one working method I found was to use the iframe's document.write() to create the swf object
       // This got around the security issue in all browsers except firefox.
       // I did find a hack where if I call the iframe's window.location.href='', it would get around the security error
       // However, the main page would look like it was loading indefinitely (URL bar loading spinner would never stop)
       // Plus Firefox 3.6 didn't work no matter what I tried.
       // if (librevjs.USER_AGENT.match('Firefox')) {
       //   iWin.location.href = '';
       // }

       // Get the iFrame's document depending on what the browser supports
       iDoc = iFrm.contentDocument ? iFrm.contentDocument : iFrm.contentWindow.document;

       // Tried ensuring both document domains were the same, but they already were, so that wasn't the issue.
       // Even tried adding /. that was mentioned in a browser security writeup
       // document.domain = document.domain+'/.';
       // iDoc.domain = document.domain+'/.';

       // Tried adding the object to the iframe doc's innerHTML. Security error in all browsers.
       // iDoc.body.innerHTML = swfObjectHTML;

       // Tried appending the object to the iframe doc's body. Security error in all browsers.
       // iDoc.body.appendChild(swfObject);

       // Using document.write actually got around the security error that browsers were throwing.
       // Again, it's a dynamically generated (same domain) iframe, loading an external Flash swf.
       // Not sure why that's a security issue, but apparently it is.
       iDoc.write(librevjs.Flash.getEmbedCode(options['swf'], flashVars, params, attributes));

       // Setting variables on the window needs to come after the doc write because otherwise they can get reset in some browsers
       // So far no issues with swf ready event being called before it's set on the window.
       iWin['player'] = this.player_;

       // Create swf ready function for iFrame window
       iWin['ready'] = librevjs.bind(this.player_, function(currSwf){
         var el = iDoc.getElementById(currSwf),
             player = this,
             tech = player.tech;

         // Update reference to playback technology element
         tech.el_ = el;

         // Make sure swf is actually ready. Sometimes the API isn't actually yet.
         librevjs.Flash.checkReady(tech);
       });

       // Create event listener for all swf events
       iWin['events'] = librevjs.bind(this.player_, function(swfID, eventName){
         var player = this;
         if (player && player.techName === 'flash') {
           player.trigger(eventName);
         }
       });

       // Create error listener for all swf errors
       iWin['errors'] = librevjs.bind(this.player_, function(swfID, eventName){
         librevjs.log('Flash Error', eventName);
       });

     }));

     // Replace placeholder with iFrame (it will load now)
     placeHolder.parentNode.replaceChild(iFrm, placeHolder);

   // If not using iFrame mode, embed as normal object
   } else {
     librevjs.Flash.embed(options['swf'], placeHolder, flashVars, params, attributes);
   }
 }
});

librevjs.Flash.prototype.dispose = function(){
 librevjs.MediaTechController.prototype.dispose.call(this);
};

librevjs.Flash.prototype.play = function(){
 this.el_.librevjs_play();
};

librevjs.Flash.prototype.pause = function(){
 this.el_.librevjs_pause();
};

librevjs.Flash.prototype.src = function(src){
 if (librevjs.Flash.isStreamingSrc(src)) {
   src = librevjs.Flash.streamToParts(src);
   this.setRtmpConnection(src.connection);
   this.setRtmpStream(src.stream);
 }
 else {
   // Make sure source URL is abosolute.
   src = librevjs.getAbsoluteURL(src);
   this.el_.librevjs_src(src);
 }

 // Currently the SWF doesn't autoplay if you load a source later.
 // e.g. Load player w/ no source, wait 2s, set src.
 if (this.player_.autoplay()) {
   var tech = this;
   setTimeout(function(){ tech.play(); }, 0);
 }
};

librevjs.Flash.prototype.currentSrc = function(){
 var src = this.el_.librevjs_getProperty('currentSrc');
 // no src, check and see if RTMP
 if (src == null) {
   var connection = this.rtmpConnection(),
       stream = this.rtmpStream();

   if (connection && stream) {
     src = librevjs.Flash.streamFromParts(connection, stream);
   }
 }
 return src;
};

librevjs.Flash.prototype.load = function(){
 this.el_.librevjs_load();
};

librevjs.Flash.prototype.poster = function(){
 this.el_.librevjs_getProperty('poster');
};

librevjs.Flash.prototype.buffered = function(){
 return librevjs.createTimeRange(0, this.el_.librevjs_getProperty('buffered'));
};

librevjs.Flash.prototype.supportsFullScreen = function(){
 return false; // Flash does not allow fullscreen through javascript
};

librevjs.Flash.prototype.enterFullScreen = function(){
 return false;
};


// Create setters and getters for attributes
var api = librevjs.Flash.prototype,
   readWrite = 'rtmpConnection,rtmpStream,preload,currentTime,defaultPlaybackRate,playbackRate,autoplay,loop,mediaGroup,controller,controls,volume,muted,defaultMuted'.split(','),
   readOnly = 'error,currentSrc,networkState,readyState,seeking,initialTime,duration,startOffsetTime,paused,played,seekable,ended,videoTracks,audioTracks,videoWidth,videoHeight,textTracks'.split(',');
   // Overridden: buffered

/**
* @this {*}
*/
var createSetter = function(attr){
 var attrUpper = attr.charAt(0).toUpperCase() + attr.slice(1);
 api['set'+attrUpper] = function(val){ return this.el_.librevjs_setProperty(attr, val); };
};

/**
* @this {*}
*/
var createGetter = function(attr){
 api[attr] = function(){ return this.el_.librevjs_getProperty(attr); };
};

(function(){
 var i;
 // Create getter and setters for all read/write attributes
 for (i = 0; i < readWrite.length; i++) {
   createGetter(readWrite[i]);
   createSetter(readWrite[i]);
 }

 // Create getters for read-only attributes
 for (i = 0; i < readOnly.length; i++) {
   createGetter(readOnly[i]);
 }
})();

/* MediaLoader REQUIRED*/
/**
* @constructor
*/
librevjs.MediaLoader = librevjs.Component.extend({
 /** @constructor */
 init: function(player, options, ready){
   librevjs.Component.call(this, player, options, ready);

   // If there are no sources when the player is initialized,
   // load the first supported playback technology.
   if (!player.options_['sources'] || player.options_['sources'].length === 0) {
     for (var i=0,j=player.options_['techOrder']; i<j.length; i++) {
       var techName = librevjs.capitalize(j[i]),
           tech = window['cliplibrejs'][techName];

       // Check if the browser supports this technology
       if (tech && tech.isSupported()) {
         player.loadTech(techName);
         break;
       }
     }
   } else {
     // // Loop through playback technologies (HTML5, Flash) and check for support.
     // // Then load the best source.
     // // A few assumptions here:
     // //   All playback technologies respect preload false.
     player.src(player.options_['sources']);
   }
 }
});/**
* @fileoverview Text Tracks
* Text tracks are tracks of timed text events.
* Captions - text displayed over the video for the hearing impared
* Subtitles - text displayed over the video for those who don't understand langauge in the video
* Chapters - text displayed in a menu allowing the user to jump to particular points (chapters) in the video
* Descriptions (not supported yet) - audio descriptions that are read back to the user by a screen reading device
*/

// Player Additions - Functions add to the player object for easier access to tracks

/**
* List of associated text tracks
* @type {Array}
* @private
*/
librevjs.Player.prototype.textTracks_;

/**
* Get an array of associated text tracks. captions, subtitles, chapters, descriptions
* http://www.w3.org/html/wg/drafts/html/master/embedded-content-0.html#dom-media-texttracks
* @return {Array}           Array of track objects
*/
librevjs.Player.prototype.textTracks = function(){
 this.textTracks_ = this.textTracks_ || [];
 return this.textTracks_;
};

/**
* Add a text track
* In addition to the W3C settings we allow adding additional info through options.
* http://www.w3.org/html/wg/drafts/html/master/embedded-content-0.html#dom-media-addtexttrack
* @param {String}  kind        Captions, subtitles, chapters, descriptions, or metadata
* @param {String=} label       Optional label
* @param {String=} language    Optional language
* @param {Object=} options     Additional track options, like src
*/
librevjs.Player.prototype.addTextTrack = function(kind, label, language, options){
 var tracks = this.textTracks_ = this.textTracks_ || [];
 options = options || {};

 options['kind'] = kind;
 options['label'] = label;
 options['language'] = language;

 // HTML5 Spec says default to subtitles.
 // Uppercase first letter to match class names
 var Kind = librevjs.capitalize(kind || 'subtitles');

 // Create correct texttrack class. CaptionsTrack, etc.
 var track = new window['cliplibrejs'][Kind + 'Track'](this, options);

 tracks.push(track);

 // If track.dflt() is set, start showing immediately
 // TODO: Add a process to deterime the best track to show for the specific kind
 // Incase there are mulitple defaulted tracks of the same kind
 // Or the user has a set preference of a specific language that should override the default
 // if (track.dflt()) {
 //   this.ready(librevjs.bind(track, track.show));
 // }

 return track;
};

/**
* Add an array of text tracks. captions, subtitles, chapters, descriptions
* Track objects will be stored in the player.textTracks() array
* @param {Array} trackList Array of track elements or objects (fake track elements)
*/
librevjs.Player.prototype.addTextTracks = function(trackList){
 var trackObj;

 for (var i = 0; i < trackList.length; i++) {
   trackObj = trackList[i];
   this.addTextTrack(trackObj['kind'], trackObj['label'], trackObj['language'], trackObj);
 }

 return this;
};

// Show a text track
// disableSameKind: disable all other tracks of the same kind. Value should be a track kind (captions, etc.)
librevjs.Player.prototype.showTextTrack = function(id, disableSameKind){
 var tracks = this.textTracks_,
     i = 0,
     j = tracks.length,
     track, showTrack, kind;

 // Find Track with same ID
 for (;i<j;i++) {
   track = tracks[i];
   if (track.id() === id) {
     track.show();
     showTrack = track;

   // Disable tracks of the same kind
   } else if (disableSameKind && track.kind() == disableSameKind && track.mode() > 0) {
     track.disable();
   }
 }

 // Get track kind from shown track or disableSameKind
 kind = (showTrack) ? showTrack.kind() : ((disableSameKind) ? disableSameKind : false);

 // Trigger trackchange event, captionstrackchange, subtitlestrackchange, etc.
 if (kind) {
   this.trigger(kind+'trackchange');
 }

 return this;
};

/**
* Track Class
* Contains track methods for loading, showing, parsing cues of tracks
* @param {librevjs.Player|Object} player
* @param {Object=} options
* @constructor
*/
librevjs.TextTrack = librevjs.Component.extend({
 /** @constructor */
 init: function(player, options){
   librevjs.Component.call(this, player, options);

   // Apply track info to track object
   // Options will often be a track element

   // Build ID if one doesn't exist
   this.id_ = options['id'] || ('librevjs_' + options['kind'] + '_' + options['language'] + '_' + librevjs.guid++);
   this.src_ = options['src'];
   // 'default' is a reserved keyword in js so we use an abbreviated version
   this.dflt_ = options['default'] || options['dflt'];
   this.title_ = options['title'];
   this.language_ = options['srclang'];
   this.label_ = options['label'];
   this.cues_ = [];
   this.activeCues_ = [];
   this.readyState_ = 0;
   this.mode_ = 0;

   this.player_.on('fullscreenchange', librevjs.bind(this, this.adjustFontSize));
 }
});

/**
* Track kind value. Captions, subtitles, etc.
* @private
*/
librevjs.TextTrack.prototype.kind_;

/**
* Get the track kind value
* @return {String}
*/
librevjs.TextTrack.prototype.kind = function(){
 return this.kind_;
};

/**
* Track src value
* @private
*/
librevjs.TextTrack.prototype.src_;

/**
* Get the track src value
* @return {String}
*/
librevjs.TextTrack.prototype.src = function(){
 return this.src_;
};

/**
* Track default value
* If default is used, subtitles/captions to start showing
* @private
*/
librevjs.TextTrack.prototype.dflt_;

/**
* Get the track default value
* 'default' is a reserved keyword
* @return {Boolean}
*/
librevjs.TextTrack.prototype.dflt = function(){
 return this.dflt_;
};

/**
* Track title value
* @private
*/
librevjs.TextTrack.prototype.title_;

/**
* Get the track title value
* @return {String}
*/
librevjs.TextTrack.prototype.title = function(){
 return this.title_;
};

/**
* Language - two letter string to represent track language, e.g. 'en' for English
* Spec def: readonly attribute DOMString language;
* @private
*/
librevjs.TextTrack.prototype.language_;

/**
* Get the track language value
* @return {String}
*/
librevjs.TextTrack.prototype.language = function(){
 return this.language_;
};

/**
* Track label e.g. 'English'
* Spec def: readonly attribute DOMString label;
* @private
*/
librevjs.TextTrack.prototype.label_;

/**
* Get the track label value
* @return {String}
*/
librevjs.TextTrack.prototype.label = function(){
 return this.label_;
};

/**
* All cues of the track. Cues have a startTime, endTime, text, and other properties.
* Spec def: readonly attribute TextTrackCueList cues;
* @private
*/
librevjs.TextTrack.prototype.cues_;

/**
* Get the track cues
* @return {Array}
*/
librevjs.TextTrack.prototype.cues = function(){
 return this.cues_;
};

/**
* ActiveCues is all cues that are currently showing
* Spec def: readonly attribute TextTrackCueList activeCues;
* @private
*/
librevjs.TextTrack.prototype.activeCues_;

/**
* Get the track active cues
* @return {Array}
*/
librevjs.TextTrack.prototype.activeCues = function(){
 return this.activeCues_;
};

/**
* ReadyState describes if the text file has been loaded
* const unsigned short NONE = 0;
* const unsigned short LOADING = 1;
* const unsigned short LOADED = 2;
* const unsigned short ERROR = 3;
* readonly attribute unsigned short readyState;
* @private
*/
librevjs.TextTrack.prototype.readyState_;

/**
* Get the track readyState
* @return {Number}
*/
librevjs.TextTrack.prototype.readyState = function(){
 return this.readyState_;
};

/**
* Mode describes if the track is showing, hidden, or disabled
* const unsigned short OFF = 0;
* const unsigned short HIDDEN = 1; (still triggering cuechange events, but not visible)
* const unsigned short SHOWING = 2;
* attribute unsigned short mode;
* @private
*/
librevjs.TextTrack.prototype.mode_;

/**
* Get the track mode
* @return {Number}
*/
librevjs.TextTrack.prototype.mode = function(){
 return this.mode_;
};

/**
* Change the font size of the text track to make it larger when playing in fullscreen mode
* and restore it to its normal size when not in fullscreen mode.
*/
librevjs.TextTrack.prototype.adjustFontSize = function(){
   if (this.player_.isFullScreen) {
       // Scale the font by the same factor as increasing the video width to the full screen window width.
       // Additionally, multiply that factor by 1.8, which is the default font size for
       // the caption track (from the CSS)
       this.el_.style.fontSize = screen.width / this.player_.width() * 2.5 * 100 + '%';
   } else {
       // Change the font size of the text track back to its original non-fullscreen size
       this.el_.style.fontSize = '';
   }
};

/**
* Create basic div to hold cue text
* @return {Element}
*/
librevjs.TextTrack.prototype.createEl = function(){
 return librevjs.Component.prototype.createEl.call(this, 'div', {
   className: 'librevjs-' + this.kind_ + ' librevjs-text-track'
 });
};

/**
* Show: Mode Showing (2)
* Indicates that the text track is active. If no attempt has yet been made to obtain the track's cues, the user agent will perform such an attempt momentarily.
* The user agent is maintaining a list of which cues are active, and events are being fired accordingly.
* In addition, for text tracks whose kind is subtitles or captions, the cues are being displayed over the video as appropriate;
* for text tracks whose kind is descriptions, the user agent is making the cues available to the user in a non-visual fashion;
* and for text tracks whose kind is chapters, the user agent is making available to the user a mechanism by which the user can navigate to any point in the media resource by selecting a cue.
* The showing by default state is used in conjunction with the default attribute on track elements to indicate that the text track was enabled due to that attribute.
* This allows the user agent to override the state if a later track is discovered that is more appropriate per the user's preferences.
*/
librevjs.TextTrack.prototype.show = function(){
 this.activate();

 this.mode_ = 2;

 // Show element.
 librevjs.Component.prototype.show.call(this);
};

/**
* Hide: Mode Hidden (1)
* Indicates that the text track is active, but that the user agent is not actively displaying the cues.
* If no attempt has yet been made to obtain the track's cues, the user agent will perform such an attempt momentarily.
* The user agent is maintaining a list of which cues are active, and events are being fired accordingly.
*/
librevjs.TextTrack.prototype.hide = function(){
 // When hidden, cues are still triggered. Disable to stop triggering.
 this.activate();

 this.mode_ = 1;

 // Hide element.
 librevjs.Component.prototype.hide.call(this);
};

/**
* Disable: Mode Off/Disable (0)
* Indicates that the text track is not active. Other than for the purposes of exposing the track in the DOM, the user agent is ignoring the text track.
* No cues are active, no events are fired, and the user agent will not attempt to obtain the track's cues.
*/
librevjs.TextTrack.prototype.disable = function(){
 // If showing, hide.
 if (this.mode_ == 2) { this.hide(); }

 // Stop triggering cues
 this.deactivate();

 // Switch Mode to Off
 this.mode_ = 0;
};

/**
* Turn on cue tracking. Tracks that are showing OR hidden are active.
*/
librevjs.TextTrack.prototype.activate = function(){
 // Load text file if it hasn't been yet.
 if (this.readyState_ === 0) { this.load(); }

 // Only activate if not already active.
 if (this.mode_ === 0) {
   // Update current cue on timeupdate
   // Using unique ID for bind function so other tracks don't remove listener
   this.player_.on('timeupdate', librevjs.bind(this, this.update, this.id_));

   // Reset cue time on media end
   this.player_.on('ended', librevjs.bind(this, this.reset, this.id_));

   // Add to display
   if (this.kind_ === 'captions' || this.kind_ === 'subtitles') {
     this.player_.getChild('textTrackDisplay').addChild(this);
   }
 }
};

/**
* Turn off cue tracking.
*/
librevjs.TextTrack.prototype.deactivate = function(){
 // Using unique ID for bind function so other tracks don't remove listener
 this.player_.off('timeupdate', librevjs.bind(this, this.update, this.id_));
 this.player_.off('ended', librevjs.bind(this, this.reset, this.id_));
 this.reset(); // Reset

 // Remove from display
 this.player_.getChild('textTrackDisplay').removeChild(this);
};

// A readiness state
// One of the following:
//
// Not loaded
// Indicates that the text track is known to exist (e.g. it has been declared with a track element), but its cues have not been obtained.
//
// Loading
// Indicates that the text track is loading and there have been no fatal errors encountered so far. Further cues might still be added to the track.
//
// Loaded
// Indicates that the text track has been loaded with no fatal errors. No new cues will be added to the track except if the text track corresponds to a MutableTextTrack object.
//
// Failed to load
// Indicates that the text track was enabled, but when the user agent attempted to obtain it, this failed in some way (e.g. URL could not be resolved, network error, unknown text track format). Some or all of the cues are likely missing and will not be obtained.
librevjs.TextTrack.prototype.load = function(){

 // Only load if not loaded yet.
 if (this.readyState_ === 0) {
   this.readyState_ = 1;
   librevjs.get(this.src_, librevjs.bind(this, this.parseCues), librevjs.bind(this, this.onError));
 }

};

librevjs.TextTrack.prototype.onError = function(err){
 this.error = err;
 this.readyState_ = 3;
 this.trigger('error');
};

// Parse the WebVTT text format for cue times.
// TODO: Separate parser into own class so alternative timed text formats can be used. (TTML, DFXP)
librevjs.TextTrack.prototype.parseCues = function(srcContent) {
 var cue, time, text,
     lines = srcContent.split('\n'),
     line = '', id;

 for (var i=1, j=lines.length; i<j; i++) {
   // Line 0 should be 'WEBVTT', so skipping i=0

   line = librevjs.trim(lines[i]); // Trim whitespace and linebreaks

   if (line) { // Loop until a line with content

     // First line could be an optional cue ID
     // Check if line has the time separator
     if (line.indexOf('-->') == -1) {
       id = line;
       // Advance to next line for timing.
       line = librevjs.trim(lines[++i]);
     } else {
       id = this.cues_.length;
     }

     // First line - Number
     cue = {
       id: id, // Cue Number
       index: this.cues_.length // Position in Array
     };

     // Timing line
     time = line.split(' --> ');
     cue.startTime = this.parseCueTime(time[0]);
     cue.endTime = this.parseCueTime(time[1]);

     // Additional lines - Cue Text
     text = [];

     // Loop until a blank line or end of lines
     // Assumeing trim('') returns false for blank lines
     while (lines[++i] && (line = librevjs.trim(lines[i]))) {
       text.push(line);
     }

     cue.text = text.join('<br/>');

     // Add this cue
     this.cues_.push(cue);
   }
 }

 this.readyState_ = 2;
 this.trigger('loaded');
};


librevjs.TextTrack.prototype.parseCueTime = function(timeText) {
 var parts = timeText.split(':'),
     time = 0,
     hours, minutes, other, seconds, ms;

 // Check if optional hours place is included
 // 00:00:00.000 vs. 00:00.000
 if (parts.length == 3) {
   hours = parts[0];
   minutes = parts[1];
   other = parts[2];
 } else {
   hours = 0;
   minutes = parts[0];
   other = parts[1];
 }

 // Break other (seconds, milliseconds, and flags) by spaces
 // TODO: Make additional cue layout settings work with flags
 other = other.split(/\s+/);
 // Remove seconds. Seconds is the first part before any spaces.
 seconds = other.splice(0,1)[0];
 // Could use either . or , for decimal
 seconds = seconds.split(/\.|,/);
 // Get milliseconds
 ms = parseFloat(seconds[1]);
 seconds = seconds[0];

 // hours => seconds
 time += parseFloat(hours) * 3600;
 // minutes => seconds
 time += parseFloat(minutes) * 60;
 // Add seconds
 time += parseFloat(seconds);
 // Add milliseconds
 if (ms) { time += ms/1000; }

 return time;
};

// Update active cues whenever timeupdate events are triggered on the player.
librevjs.TextTrack.prototype.update = function(){
 if (this.cues_.length > 0) {

   // Get curent player time
   var time = this.player_.currentTime();

   // Check if the new time is outside the time box created by the the last update.
   if (this.prevChange === undefined || time < this.prevChange || this.nextChange <= time) {
     var cues = this.cues_,

         // Create a new time box for this state.
         newNextChange = this.player_.duration(), // Start at beginning of the timeline
         newPrevChange = 0, // Start at end

         reverse = false, // Set the direction of the loop through the cues. Optimized the cue check.
         newCues = [], // Store new active cues.

         // Store where in the loop the current active cues are, to provide a smart starting point for the next loop.
         firstActiveIndex, lastActiveIndex,
         cue, i; // Loop vars

     // Check if time is going forwards or backwards (scrubbing/rewinding)
     // If we know the direction we can optimize the starting position and direction of the loop through the cues array.
     if (time >= this.nextChange || this.nextChange === undefined) { // NextChange should happen
       // Forwards, so start at the index of the first active cue and loop forward
       i = (this.firstActiveIndex !== undefined) ? this.firstActiveIndex : 0;
     } else {
       // Backwards, so start at the index of the last active cue and loop backward
       reverse = true;
       i = (this.lastActiveIndex !== undefined) ? this.lastActiveIndex : cues.length - 1;
     }

     while (true) { // Loop until broken
       cue = cues[i];

       // Cue ended at this point
       if (cue.endTime <= time) {
         newPrevChange = Math.max(newPrevChange, cue.endTime);

         if (cue.active) {
           cue.active = false;
         }

         // No earlier cues should have an active start time.
         // Nevermind. Assume first cue could have a duration the same as the video.
         // In that case we need to loop all the way back to the beginning.
         // if (reverse && cue.startTime) { break; }

       // Cue hasn't started
       } else if (time < cue.startTime) {
         newNextChange = Math.min(newNextChange, cue.startTime);

         if (cue.active) {
           cue.active = false;
         }

         // No later cues should have an active start time.
         if (!reverse) { break; }

       // Cue is current
       } else {

         if (reverse) {
           // Add cue to front of array to keep in time order
           newCues.splice(0,0,cue);

           // If in reverse, the first current cue is our lastActiveCue
           if (lastActiveIndex === undefined) { lastActiveIndex = i; }
           firstActiveIndex = i;
         } else {
           // Add cue to end of array
           newCues.push(cue);

           // If forward, the first current cue is our firstActiveIndex
           if (firstActiveIndex === undefined) { firstActiveIndex = i; }
           lastActiveIndex = i;
         }

         newNextChange = Math.min(newNextChange, cue.endTime);
         newPrevChange = Math.max(newPrevChange, cue.startTime);

         cue.active = true;
       }

       if (reverse) {
         // Reverse down the array of cues, break if at first
         if (i === 0) { break; } else { i--; }
       } else {
         // Walk up the array fo cues, break if at last
         if (i === cues.length - 1) { break; } else { i++; }
       }

     }

     this.activeCues_ = newCues;
     this.nextChange = newNextChange;
     this.prevChange = newPrevChange;
     this.firstActiveIndex = firstActiveIndex;
     this.lastActiveIndex = lastActiveIndex;

     this.updateDisplay();

     this.trigger('cuechange');
   }
 }
};

// Add cue HTML to display
librevjs.TextTrack.prototype.updateDisplay = function(){
 var cues = this.activeCues_,
     html = '',
     i=0,j=cues.length;

 for (;i<j;i++) {
   html += '<span class="librevjs-tt-cue">'+cues[i].text+'</span>';
 }

 this.el_.innerHTML = html;
};

// Set all loop helper values back
librevjs.TextTrack.prototype.reset = function(){
 this.nextChange = 0;
 this.prevChange = this.player_.duration();
 this.firstActiveIndex = 0;
 this.lastActiveIndex = 0;
};

// Create specific track types
/**
* @constructor
*/
librevjs.CaptionsTrack = librevjs.TextTrack.extend();
librevjs.CaptionsTrack.prototype.kind_ = 'captions';
// Exporting here because Track creation requires the track kind
// to be available on global object. e.g. new window['cliplibrejs'][Kind + 'Track']

/**
* @constructor
*/
librevjs.SubtitlesTrack = librevjs.TextTrack.extend();
librevjs.SubtitlesTrack.prototype.kind_ = 'subtitles';

/**
* @constructor
*/
librevjs.ChaptersTrack = librevjs.TextTrack.extend();
librevjs.ChaptersTrack.prototype.kind_ = 'chapters';


/* Text Track Display
============================================================================= */
// Global container for both subtitle and captions text. Simple div container.

/**
* @constructor
*/
librevjs.TextTrackDisplay = librevjs.Component.extend({
 /** @constructor */
 init: function(player, options, ready){
   librevjs.Component.call(this, player, options, ready);

   // This used to be called during player init, but was causing an error
   // if a track should show by default and the display hadn't loaded yet.
   // Should probably be moved to an external track loader when we support
   // tracks that don't need a display.
   if (player.options_['tracks'] && player.options_['tracks'].length > 0) {
     this.player_.addTextTracks(player.options_['tracks']);
   }
 }
});

librevjs.TextTrackDisplay.prototype.createEl = function(){
 return librevjs.Component.prototype.createEl.call(this, 'div', {
   className: 'librevjs-text-track-display'
 });
};


/* Text Track Menu Items
============================================================================= */
/**
* @constructor
*/
librevjs.TextTrackMenuItem = librevjs.MenuItem.extend({
 /** @constructor */
 init: function(player, options){
   var track = this.track = options['track'];

   // Modify options for parent MenuItem class's init.
   options['label'] = track.label();
   options['selected'] = track.dflt();
   librevjs.MenuItem.call(this, player, options);

   this.player_.on(track.kind() + 'trackchange', librevjs.bind(this, this.update));
   /**
   * @author Jesús Eduardo
   * my modification:
   */
   if(track.dflt()) {
       this.player_.showTextTrack(this.track.id_, this.track.kind());
   }
 }
});

librevjs.TextTrackMenuItem.prototype.onClick = function(){
 librevjs.MenuItem.prototype.onClick.call(this);
 this.player_.showTextTrack(this.track.id_, this.track.kind());
};

librevjs.TextTrackMenuItem.prototype.update = function(){
 this.selected(this.track.mode() == 2);
};

/**
* @constructor
*/
librevjs.OffTextTrackMenuItem = librevjs.TextTrackMenuItem.extend({
 /** @constructor */
 init: function(player, options){
   // Create pseudo track info
   // Requires options['kind']
   options['track'] = {
     kind: function() { return options['kind']; },
     player: player,
     label: function(){ return options['kind'] + ' off'; },
     dflt: function(){ return false; },
     mode: function(){ return false; }
   };
   librevjs.TextTrackMenuItem.call(this, player, options);
   this.selected(true);
 }
});

librevjs.OffTextTrackMenuItem.prototype.onClick = function(){
 librevjs.TextTrackMenuItem.prototype.onClick.call(this);
 this.player_.showTextTrack(this.track.id_, this.track.kind());
};

librevjs.OffTextTrackMenuItem.prototype.update = function(){
 var tracks = this.player_.textTracks(),
     i=0, j=tracks.length, track,
     off = true;

 for (;i<j;i++) {
   track = tracks[i];
   if (track.kind() == this.track.kind() && track.mode() == 2) {
     off = false;
   }
 }

 this.selected(off);
};

/* Captions Button
================================================================================ */
/**
* @constructor
*/
librevjs.TextTrackButton = librevjs.MenuButton.extend({
 /** @constructor */
 init: function(player, options){
   librevjs.MenuButton.call(this, player, options);

   if (this.items.length <= 1) {
     this.hide();
   }
 }
});

// librevjs.TextTrackButton.prototype.buttonPressed = false;

// librevjs.TextTrackButton.prototype.createMenu = function(){
//   var menu = new librevjs.Menu(this.player_);

//   // Add a title list item to the top
//   // menu.el().appendChild(librevjs.createEl('li', {
//   //   className: 'librevjs-menu-title',
//   //   innerHTML: librevjs.capitalize(this.kind_),
//   //   tabindex: -1
//   // }));

//   this.items = this.createItems();

//   // Add menu items to the menu
//   for (var i = 0; i < this.items.length; i++) {
//     menu.addItem(this.items[i]);
//   }

//   // Add list to element
//   this.addChild(menu);

//   return menu;
// };

// Create a menu item for each text track
librevjs.TextTrackButton.prototype.createItems = function(){
 var items = [], track;

 // Add an OFF menu item to turn all tracks off
 items.push(new librevjs.OffTextTrackMenuItem(this.player_, { 'kind': this.kind_ }));

 for (var i = 0; i < this.player_.textTracks().length; i++) {
   track = this.player_.textTracks()[i];
   if (track.kind() === this.kind_) {
     items.push(new librevjs.TextTrackMenuItem(this.player_, {
       'track': track
     }));
   }
 }

 return items;
};

/**
* @constructor
*/
librevjs.CaptionsButton = librevjs.TextTrackButton.extend({
 /** @constructor */
 init: function(player, options, ready){
   librevjs.TextTrackButton.call(this, player, options, ready);
   this.el_.setAttribute('aria-label','Captions Menu');
 }
});
librevjs.CaptionsButton.prototype.kind_ = 'captions';
librevjs.CaptionsButton.prototype.buttonText = 'Captions';
librevjs.CaptionsButton.prototype.className = 'librevjs-captions-button';

/**
* @constructor
*/
librevjs.SubtitlesButton = librevjs.TextTrackButton.extend({
 /** @constructor */
 init: function(player, options, ready){
   librevjs.TextTrackButton.call(this, player, options, ready);
   this.el_.setAttribute('aria-label','Subtitles Menu');
 }
});
librevjs.SubtitlesButton.prototype.kind_ = 'subtitles';
librevjs.SubtitlesButton.prototype.buttonText = 'Subtitles';
librevjs.SubtitlesButton.prototype.className = 'librevjs-subtitles-button';

// Chapters act much differently than other text tracks
// Cues are navigation vs. other tracks of alternative languages
/**
* @constructor
*/
librevjs.ChaptersButton = librevjs.TextTrackButton.extend({
 /** @constructor */
 init: function(player, options, ready){
   librevjs.TextTrackButton.call(this, player, options, ready);
   this.el_.setAttribute('aria-label','Chapters Menu');
 }
});
librevjs.ChaptersButton.prototype.kind_ = 'chapters';
librevjs.ChaptersButton.prototype.buttonText = 'Chapters';
librevjs.ChaptersButton.prototype.className = 'librevjs-chapters-button';

// Create a menu item for each text track
librevjs.ChaptersButton.prototype.createItems = function(){
 var items = [], track;

 for (var i = 0; i < this.player_.textTracks().length; i++) {
   track = this.player_.textTracks()[i];
   if (track.kind() === this.kind_) {
     items.push(new librevjs.TextTrackMenuItem(this.player_, {
       'track': track
     }));
   }
 }

 return items;
};

librevjs.ChaptersButton.prototype.createMenu = function(){
 var tracks = this.player_.textTracks(),
     i = 0,
     j = tracks.length,
     track, chaptersTrack,
     items = this.items = [];

 for (;i<j;i++) {
   track = tracks[i];
   if (track.kind() == this.kind_ && track.dflt()) {
     if (track.readyState() < 2) {
       this.chaptersTrack = track;
       track.on('loaded', librevjs.bind(this, this.createMenu));
       return;
     } else {
       chaptersTrack = track;
       break;
     }
   }
 }

 var menu = this.menu = new librevjs.Menu(this.player_);

 menu.el_.appendChild(librevjs.createEl('li', {
   className: 'librevjs-menu-title',
   innerHTML: librevjs.capitalize(this.kind_),
   tabindex: -1
 }));

 if (chaptersTrack) {
   var cues = chaptersTrack.cues_, cue, mi;
   i = 0;
   j = cues.length;

   for (;i<j;i++) {
     cue = cues[i];

     mi = new librevjs.ChaptersTrackMenuItem(this.player_, {
       'track': chaptersTrack,
       'cue': cue
     });

     items.push(mi);

     menu.addChild(mi);
   }
 }

 if (this.items.length > 0) {
   this.show();
 }

 return menu;
};


/**
* @constructor
*/
librevjs.ChaptersTrackMenuItem = librevjs.MenuItem.extend({
 /** @constructor */
 init: function(player, options){
   var track = this.track = options['track'],
       cue = this.cue = options['cue'],
       currentTime = player.currentTime();

   // Modify options for parent MenuItem class's init.
   options['label'] = cue.text;
   options['selected'] = (cue.startTime <= currentTime && currentTime < cue.endTime);
   librevjs.MenuItem.call(this, player, options);

   track.on('cuechange', librevjs.bind(this, this.update));
 }
});

librevjs.ChaptersTrackMenuItem.prototype.onClick = function(){
 librevjs.MenuItem.prototype.onClick.call(this);
 this.player_.currentTime(this.cue.startTime);
 this.update(this.cue.startTime);
};

librevjs.ChaptersTrackMenuItem.prototype.update = function(){
 var cue = this.cue,
     currentTime = this.player_.currentTime();

 // librevjs.log(currentTime, cue.startTime);
 this.selected(cue.startTime <= currentTime && currentTime < cue.endTime);
};

// Add Buttons to controlBar
librevjs.obj.merge(librevjs.ControlBar.prototype.options_['children'], {
 'subtitlesButton': {},
 'captionsButton': {},
 'chaptersButton': {}
});

// librevjs.Cue = librevjs.Component.extend({
//   /** @constructor */
//   init: function(player, options){
//     librevjs.Component.call(this, player, options);
//   }
// });
/**
* @fileoverview Add JSON support
* @suppress {undefinedVars}
* (Compiler doesn't like JSON not being declared)
*/

/**
* Javascript JSON implementation
* (Parse Method Only)
* https://github.com/douglascrockford/JSON-js/blob/master/json2.js
* Only using for parse method when parsing data-setup attribute JSON.
* @type {Object}
* @suppress {undefinedVars}
*/
librevjs.JSON;

/**
* @suppress {undefinedVars}
*/
if (typeof window.JSON !== 'undefined' && window.JSON.parse === 'function') {
 librevjs.JSON = window.JSON;

} else {
 librevjs.JSON = {};

 var cx = /[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g;

 librevjs.JSON.parse = function (text, reviver) {
     var j;

     function walk(holder, key) {
         var k, v, value = holder[key];
         if (value && typeof value === 'object') {
             for (k in value) {
                 if (Object.prototype.hasOwnProperty.call(value, k)) {
                     v = walk(value, k);
                     if (v !== undefined) {
                         value[k] = v;
                     } else {
                         delete value[k];
                     }
                 }
             }
         }
         return reviver.call(holder, key, value);
     }
     text = String(text);
     cx.lastIndex = 0;
     if (cx.test(text)) {
         text = text.replace(cx, function (a) {
             return '\\u' +
                 ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
         });
     }

     if (/^[\],:{}\s]*$/
             .test(text.replace(/\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g, '@')
                 .replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, ']')
                 .replace(/(?:^|:|,)(?:\s*\[)+/g, ''))) {

         j = eval('(' + text + ')');

         return typeof reviver === 'function' ?
             walk({'': j}, '') : j;
     }

     throw new SyntaxError('JSON.parse(): invalid or malformed JSON data');
 };
}
/**
* @fileoverview Functions for automatically setting up a player
* based on the data-setup attribute of the video tag
*/

// Automatically set up any tags that have a data-setup attribute
librevjs.autoSetup = function(){
 var options, vid, player,
     vids = document.getElementsByTagName('video');

 // Check if any media elements exist
 if (vids && vids.length > 0) {

   for (var i=0,j=vids.length; i<j; i++) {
     vid = vids[i];

     // Check if element exists, has getAttribute func.
     // IE seems to consider typeof el.getAttribute == 'object' instead of 'function' like expected, at least when loading the player immediately.
     if (vid && vid.getAttribute) {

       // Make sure this player hasn't already been set up.
       if (vid['player'] === undefined) {
         options = vid.getAttribute('data-setup');

         // Check if data-setup attr exists.
         // We only auto-setup if they've added the data-setup attr.
         if (options !== null) {

           // Parse options JSON
           // If empty string, make it a parsable json object.
           options = librevjs.JSON.parse(options || '{}');

           // Create new video.js instance.
           player = cliplibrejs(vid, options);
         }
       }

     // If getAttribute isn't defined, we need to wait for the DOM.
     } else {
       librevjs.autoSetupTimeout(1);
       break;
     }
   }

 // No videos were found, so keep looping unless page is finisehd loading.
 } else if (!librevjs.windowLoaded) {
   librevjs.autoSetupTimeout(1);
 }
};

// Pause to let the DOM keep processing
librevjs.autoSetupTimeout = function(wait){
 setTimeout(librevjs.autoSetup, wait);
};

if (document.readyState === 'complete') {
 librevjs.windowLoaded = true;
} else {
 librevjs.one(window, 'load', function(){
   librevjs.windowLoaded = true;
 });
}

// Run Auto-load players
// You have to wait at least once in case this script is loaded after your video in the DOM (weird behavior only with minified version)
librevjs.autoSetupTimeout(1);
librevjs.plugin = function(name, init){
librevjs.Player.prototype[name] = init;
};
/* Selector Quality
@base: https://github.com/dominic-p/videojs-resolution-selector
================================================================================ */
(function(_V_) {
 /***********************************************************************************
  * Define some helper functions
  ***********************************************************************************/
 var methods = {
   /**
    * Utility function for merging 2 objects recursively. It treats
    * arrays like plain objects and it relies on a for...in loop which will
    * break if the Object prototype is messed with.
    *
    * @param	(object)	destination	The object to modify and return
    * @param	(object)	source		The object to use to overwrite the first
    * 									object
    *
    * @returns	(object)	The modified first object is returned
    */
   extend : function(destination, source){
     for (var prop in source){
       // Sanity check
       if (!source.hasOwnProperty(prop)){continue;}

       // Enable recursive (deep) object extension
       if (typeof source[prop] == 'object' && null !== source[prop]) {
         destination[prop] = methods.extend( destination[prop] || {}, source[prop] );
       } else {
         destination[prop] = source[prop];
       }
     }
     return destination;
   },

   /**
    * In a future version, this can be made more intelligent,
    * but for now, we'll just add a "p" at the end if we are passed
    * numbers.
    *
    * @param	(string)	res	The resolution to make a label for
    *
    * @returns	(string)	The label text string
    */
   res_label : function(res){
     return (/^\d+$/.test(res)) ? res + 'p' : res;
   },
    matchResolution: function(resStack, res){
    },

   /**
     * returns a dummy object that implements the basic get/set
     * functionality of the Cookies library. Used in the case where
     * the Cookies library is not present
     */
    buildCookiesDummy: function(){
      return{
        get: function(key){
          return "";
        },
        set: function(key, val){
          return false;
        }
      };
    }
 };

 /***********************************************************************************
  * Setup our resolution menu items
  ***********************************************************************************/
 _V_.ResolutionMenuItem = _V_.MenuItem.extend({

   /** @constructor */
   init : function(player, options){

     // Modify options for parent MenuItem class's init.
     options.label = methods.res_label(options.res);
     options.selected = (options.res.toString() === player.getCurrentRes().toString());

     // Call the parent constructor
     _V_.MenuItem.call(this, player, options);

     // Store the resolution as a call property
     this.resolution = options.res;

     // Register our click handler
     this.on('click', this.onClick);

     // Toggle the selected class whenever the resolution changes
     player.on('changeRes', _V_.bind(this, function(){
       if (this.resolution == player.getCurrentRes()){
         this.selected(true);
       } else {
         this.selected(false);
       }
     }));
   }
 });

 // Handle clicks on the menu items
 _V_.ResolutionMenuItem.prototype.onClick = function(){
   var player = this.player(),
     video_el = player.el().firstChild,
     current_time = player.currentTime(),
     is_paused = player.paused(),
     button_nodes = player.controlBar.resolutionSelector.el().firstChild.children,
     button_node_count = button_nodes.length;

   // Do nothing if we aren't changing resolutions
   if (player.getCurrentRes() == this.resolution){return;}

   // Make sure the loadedmetadata event will fire
   if ('none' == video_el.preload) {video_el.preload = 'metadata';}

   // Change the source and make sure we don't start the video over
   player.src( player.availableRes[this.resolution]).one('loadedmetadata', function() {
     player.currentTime(current_time);
     if (!is_paused) {player.play();}
   });

   // Save the newly selected resolution in our player options property
   player.currentRes = this.resolution;

   // Update the button text
   while (button_node_count > 0){
     button_node_count--;
     if ('librevjs-current-res' == button_nodes[button_node_count].className){
       button_nodes[button_node_count].innerHTML = methods.res_label(this.resolution);
       break;
     }
   }

   // Update the classes to reflect the currently selected resolution
   player.trigger('changeRes');
 };

 /***********************************************************************************
  * Setup our resolution menu title item
  ***********************************************************************************/
 _V_.ResolutionTitleMenuItem = _V_.MenuItem.extend({

   init : function(player, options){

     // Call the parent constructor
     _V_.MenuItem.call(this, player, options);

     // No click handler for the menu title
     this.off('click');
   }
 });

 /***********************************************************************************
  * Define our resolution selector button
  ***********************************************************************************/
 _V_.ResolutionSelector = _V_.MenuButton.extend({

   /** @constructor */
   init : function(player, options) {

     // Add our list of available resolutions to the player object
     player.availableRes = options.available_res;

     // Call the parent constructor
     _V_.MenuButton.call(this, player, options);
   }
 });

 // Create a menu item for each available resolution
 _V_.ResolutionSelector.prototype.createItems = function(){

   var player = this.player(),
     items = [],
     current_res;

   // Add the menu title item
   items.push( new _V_.ResolutionTitleMenuItem(player,{
     el : _V_.Component.prototype.createEl('li',{
       className	: 'librevjs-menu-title librevjs-res-menu-title',
       innerHTML	: 'Calidad'
     })
   }));

   // Add an item for each available resolution
   for (current_res in player.availableRes){
     // Don't add an item for the length attribute
     if ('length' == current_res) {continue;}
     items.push( new _V_.ResolutionMenuItem(player,{
       res : current_res
     }));
   }

   // Sort the available resolutions in descending order
   items.sort(function(a,b){
     if (typeof a.resolution == 'undefined'){
       return -1;
     } else {
       return parseInt(b.resolution) - parseInt(a.resolution);
     }
   });
   return items;
 };

 /***********************************************************************************
  * Register the plugin with cliplibrejs, main plugin function
  ***********************************************************************************/
 _V_.plugin('resolutionSelector', function(options){

   // Only enable the plugin on HTML5 videos
   if (!this.el().firstChild.canPlayType){return;}

   var player = this,
     sources	= player.options().sources,
     i = sources.length,
     j,
     found_type,

     // Override default options with those provided
     settings = methods.extend({

       default_res	: '',		// (string)	The resolution that should be selected by default ( '480' or  '480,1080,240' )
       force_types	: false		// (array)	List of media types. If passed, we need to have source for each type in each resolution or that resolution will not be an option

     }, options || {}),

     available_res = {length : 0},
     current_res,
     resolutionSelector,

     // Split default resolutions if set and valid, otherwise default to an empty array
     default_resolutions = (settings.default_res && typeof settings.default_res == 'string') ? settings.default_res.split( ',' ) : [],
      cookieNamespace = 'cliplibrejs.resolutionSelector',
      resCookieName = cookieNamespace + '.res',
      cookieRef = (typeof(Cookies) === "function") ? Cookies : methods.buildCookiesDummy();

   // Get all of the available resoloutions
   while (i > 0){

     i--;

     // Skip sources that don't have data-res attributes
     if (!sources[i]['data-res']){continue;}
     current_res = sources[i]['data-res'];
     if (typeof available_res[current_res] !== 'object'){
       available_res[current_res] = [];
       available_res.length++;
     }
     available_res[current_res].push( sources[i] );
   }

   // Check for forced types
   if (settings.force_types){
     // Loop through all available resoultions
     for (current_res in available_res){
       // Don't count the length property as a resolution
       if ('length' == current_res){continue;}
       i = settings.force_types.length;
       // For each resolution loop through the required types
       while (i > 0){

         i--;

         j = available_res[current_res].length;
         found_types = 0;

         // For each required type loop through the available sources to check if its there
         while (j > 0){

           j--;

           if (settings.force_types[i] === available_res[current_res][j].type){
             found_types++;
           }
         } // End loop through current resolution sources

         if (found_types < settings.force_types.length){
           delete available_res[current_res];
           available_res.length--;
           break;
         }
       } // End loop through required types
     } // End loop through resolutions
   }

   // Make sure we have at least 2 available resolutions before we add the button
   if (available_res.length < 2) {return;}

    var resCookie = cookieRef.get(resCookieName)
    if (resCookie) {
      // rebuild the default_resolutions stack with the cookie's resolution on top
      default_resolutions = [resCookie].concat(default_resolutions);
    }

   // Loop through the choosen default resolutions if there were any
   for (i = 0; i < default_resolutions.length; i++){
     // Set the video to start out with the first available default res
     if (available_res[default_resolutions[i]]){
       player.src(available_res[default_resolutions[i]]);
       player.currentRes = default_resolutions[i];
       break;
     }
   }

   // Helper function to get the current resolution
   player.getCurrentRes = function(){
     if (typeof player.currentRes !== 'undefined'){
       return player.currentRes;
     } else {
       try {
         return res = player.options().sources[0]['data-res'];
       } catch(e) {
         return '';
       }
     }
   };

   // Get the started resolution
   current_res = player.getCurrentRes();

   if (current_res) {current_res = methods.res_label(current_res);}

   // Add the resolution selector button
   resolutionSelector = new _V_.ResolutionSelector(player,{
     el : _V_.Component.prototype.createEl( null,{
       className	: 'librevjs-res-button librevjs-menu-button librevjs-control',
       innerHTML	: '<div class="librevjs-control-content"><span class="librevjs-current-res">' + (current_res || 'Quality') + '</span></div>',
       role		: 'button',
       'aria-live'	: 'polite', // let the screen reader user know that the text of the button may change
       tabIndex	: 0
     }),
     available_res	: available_res
   });

    // Attach an event to remember previous res selection via cookie
    this.on('changeRes', function(){
      cookieRef.set(resCookieName, player.getCurrentRes());
    });

    // Attach an event to update player.src once on loadedmetadata
    // if a resolution was previously set
    this.one('loadedmetadata', function(){
      var resCookie = cookieRef.get(resCookieName);

      if (resCookie) {
        player.src(player.availableRes[resCookie]);
        player.currentRes = resCookie;
        player.trigger( 'changeRes' );
      }
    });

   // Add the button to the control bar object and the DOM
   player.controlBar.resolutionSelector = player.controlBar.addChild( resolutionSelector );
 });
})(cliplibrejs);

/* Hotkeys for LibreVideoJS
@base:  https://github.com/ctd1500/videojs-hotkeys
================================================================================ */
(function(window, cliplibrejs){
  'use strict';

  window['cliplibrejs_hotkeys'] = {version: "0.2.4"};
  var hotkeys = function(options){
    var player = this;
    var def_options = {
      volumeStep: 0.1,
      seekStep: 5,
      enableMute: true,
      enableFullscreen: true,
      enableNumbers: true,
    };
    options = options || {};

    // Set default player tabindex to handle keydown and doubleclick events
    if (!player.el().hasAttribute('tabIndex')){
      player.el().setAttribute('tabIndex', '-1');
    }

    player.on('play', function(){
      // Fix allowing the YouTube plugin to have hotkey support.
      var ifblocker = player.el().querySelector('.iframeblocker');
      if (ifblocker &&
          ifblocker.style.display == ""){
        ifblocker.style.display = "block";
        ifblocker.style.bottom = "39px";
      }
    });

    var keyDown = function keyDown(event){
      var ewhich = event.which;
      var volumeStep = options.volumeStep || def_options.volumeStep;
      var seekStep = options.seekStep || def_options.seekStep;
      var enableMute = options.enableMute || def_options.enableMute;
      var enableFull = options.enableFullscreen || def_options.enableFullscreen;
      var enableNumbers = options.enableNumbers || def_options.enableNumbers;

      // When controls are disabled, hotkeys will be disabled as well
      if (player.controls()){

        // Don't catch keys if any control buttons are focused
        var activeEl = document.activeElement;
        if (activeEl == player.el() ||
            activeEl == player.el().querySelector('.librevjs-tech') ||
            activeEl == player.el().querySelector('.librevjs-control-bar') ||
            activeEl == player.el().querySelector('.iframeblocker')){

          // Spacebar toggles play/pause
          if (ewhich === 32){
            event.preventDefault();
            if (this.player_.paused()){
              this.player_.play();
            } else {
              this.player_.pause();
            }
          }

          // Seeking with the left/right arrow keys
          else if (ewhich === 37){ // Left Arrow
            event.preventDefault();
            var curTime = player.currentTime() - seekStep;

            // The flash player tech will allow you to seek into negative
            // numbers and break the seekbar, so try to prevent that.
            if (player.currentTime() <= seekStep){
              curTime = 0;
            }
            player.currentTime(curTime);
          } else if (ewhich === 39){ // Right Arrow
            event.preventDefault();
            player.currentTime(player.currentTime() + seekStep);
          }

          // Volume control with the up/down arrow keys
          else if (ewhich === 40){ // Down Arrow
            event.preventDefault();
            player.volume(player.volume() - volumeStep);
          } else if (ewhich === 38){ // Up Arrow
            event.preventDefault();
            player.volume(player.volume() + volumeStep);
          }

          // Toggle Mute with the M key
          else if (ewhich === 77){
            if (enableMute) {
              if (player.muted()){
                player.muted(false);
              } else {
                player.muted(true);
              }
            }
          }

          // Toggle Fullscreen with the F key
          else if (ewhich === 70){
            if (enableFull){
              if (this.player_.isFullScreen){
                this.player_.cancelFullScreen();
              } else{
                this.player_.requestFullScreen();
              }
            }
          }

          // Number keys from 0-9 skip to a percentage of the video. 0 is 0% and 9 is 90%
          else if ((ewhich > 47 && ewhich < 59) || (ewhich > 95 && ewhich < 106)){
            if (enableNumbers){
              var sub = 48;
              if (ewhich > 95){
                sub = 96;
              }
              var number = ewhich - sub;
              event.preventDefault();
              player.currentTime(player.duration() * number * 0.1);
            }
          }
        }
      }
    };

    var doubleClick = function doubleClick(event){
      var enableFull = options.enableFullscreen || def_options.enableFullscreen;

      // When controls are disabled, hotkeys will be disabled as well
      if (player.controls()){

        // Don't catch clicks if any control buttons are focused
        var activeEl = event.relatedTarget || event.toElement || document.activeElement;
        if (activeEl == player.el() ||
            activeEl == player.el().querySelector('.librevjs-tech') ||
            activeEl == player.el().querySelector('.iframeblocker')){

          if (enableFull){
            if (this.player_.isFullScreen){
              this.player_.cancelFullScreen();
            } else{
              this.player_.requestFullScreen();
            }
          }
        }
      }
    };

    player.on('keydown', keyDown);
    player.on('dblclick', doubleClick);

    return this;
  };

  cliplibrejs.plugin('hotkeys', hotkeys);

})(window, window.cliplibrejs);
