bindbind.js
========

Data binding made simple.

##Usage
Declare binding anchors
```html
<a
  bb-notification:image="img/empty.png"
  bb-notification:author="Someone"
  bb-notification:action="did something"
  bb-notification:when="Some time ago"
  bb-notification:link="#nolink"
  
  href="#nolink"
>
  <img src="img/empty.png"/>
  <strong>Someone</strong>
  <span>did something</span>
  <small>Some time ago</small>
</a>
```

Declare view model
```javascript
var obj={notification:[]};
```
Bind it to DOM and recieve modifier
```javascript
var bb=new bindbind(obj);
```
Update view model using modifier
```javascript
bb(obj.notification).push({
  image:'img/avatar-2.jpg',
  author:'Thomas White',action:'posted on your profile page',
  when:'17 seconds ago',
  link:'#link9'});
```
Modify properties
```javascript
bb(obj.notification[0]).author='Elizabeth Owens';
```

##Note
This is still in beta.