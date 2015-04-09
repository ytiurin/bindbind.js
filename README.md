bindbind.js
========

Data binding the simple way.

##Usage
Declare binding anchors
```html
<a class="notification" href="#nolink" 
  bb-notification:image="img/empty.png"
  bb-notification:author="Someone"
  bb-notification:action="did something"
  bb-notification:when="Some time ago"
  bb-notification:link="#nolink">

  <img src="img/empty.png"/>
  <strong>Someone</strong>
  <span>did something</span>
  <small>Some time ago</small>
</a>
```

Bind view model
```javascript
viewModel=bindbind({notification:[{image:'img/avatar-2.jpg',author:'Thomas White',action:'posted on your profile page',when:'17 seconds ago',link:'#link9'}]})
```
Update view model
```javascript
viewModel.notification.push({image:'img/avatar-3.jpg',author:'Doina Slaivici',action:'uploaded photo',when:'10 minutes ago',link:'#link8'})
```
Modify view model
```javascript
viewModel.notification[0].author='Elizabeth Owens'
```