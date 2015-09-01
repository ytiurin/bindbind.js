bindbind.js
========

Data binding made simple.

##Usage
Declare binding anchors inside your HTML code
```html
<table>
  <tr bb-writers:name="Unknown" bb-writers:uri="#nolink">
    <td><a href="#nolink">Unknown</a></td>
  </tr>
</table>
```

Define view model and bind it to the DOM
```javascript
var myViewModel = {writers:[]};
var _o = new bindbind(myViewModel);
// _o <- this is an observing proxy object,
//       it holds setters and getters of your
//       object properties and notifies other
//       objects about it's changes
```

Update view model using observing proxy
```javascript
_o(myViewModel.writers).push({
  name:'Joseph Conrad',
  uri:'https://en.wikipedia.org/wiki/Joseph_Conrad'});

_o(myViewModel.writers).push({
  name:'James Joyce',
  uri:'https://en.wikipedia.org/wiki/James_Joyce'});
```

Resulting HTML

```html
<table>
  <tr>
    <td><a href="https://en.wikipedia.org/wiki/Joseph_Conrad">Joseph Conrad</a></td>
  </tr>
  <tr>
    <td><a href="https://en.wikipedia.org/wiki/James_Joyce">James Joyce</a></td>
  </tr>
</table>
```

##Note
This is still in beta.
