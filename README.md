bindbind.js
========

Data binding made simple.

##Usage
Declare binding anchors
```html
<li
  bb-notification:author="Someone"
  bb-notification:action="did something"
  bb-notification:when="Some time ago"
  bb-notification:image="img/empty.png"
  bb-notification:link="#nolink"
>
  <strong>Someone</strong>
  <span>did something</span>
  <small>Some time ago</small>
  <img src="img/empty.png"/>
  <a href="#nolink">Go check</a>
</li>
```

Define view model
```javascript
var obj = {notification:[]};
```
Bind it to DOM and recieve modifier
```javascript
var bb = new bindbind(obj);
// bb <- this is called modifier,
//       it wraps your model and notifies other 
//       objects about it's changes
```
Update view model using modifier
```javascript
bb(obj.notification).push({
  author:'Thomas White',
  action:'posted on your profile page',
  when:'17 seconds ago',
  image:'img/avatar-2.jpg',
  link:'#link9'});
```
Modify properties
```javascript
bb(obj.notification[0]).author='Elizabeth Owens';
```

##Note
This is still in beta.