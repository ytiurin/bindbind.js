
!function(){

  "use strict";

  var viewModel,bindableElements;

  // ObservingWrapper
  function cropArgs(args,n)
  {
    return Array.prototype.slice.call(args,n);
  }

  function getDeepPropertyNames(obj)
  {
    var proto,names,protoNames,reduceNames,i,n;

    names=Object.getOwnPropertyNames(obj);
    for(i=0,n=names.length;i<n;i++)
      if(names[i].indexOf('__')===0&&names[i].lastIndexOf('__')===names[i].length-2){
        names.splice(i,1);
        i--;
        n--;
      }

    (proto=Object.getPrototypeOf(obj)) && (names=names.concat(
      getDeepPropertyNames(proto)));

    return names;
  }

  function ObservingWrapper(sourceObject,initHandler)
  {
    this.sourceObject=sourceObject||undefined;
    this.observableKeys={};
    this.changeHandlers=[];
    this.specificHandlers={};

    Object.defineProperty(this.observableKeys,'__observingWrapper',{value:this});
    this.defineObservableProperties();
  }

  ObservingWrapper.getSourceObject = function(obj) {
    if(obj.__observingWrapper)
      return obj.__observingWrapper.sourceObject;
    return obj;
  }

  ObservingWrapper.prototype.addChangeHandler=function(){
    var key,userPropertyName,userChangeHandler;

    if(['string','number'].indexOf(typeof arguments[0])>-1 && typeof arguments
      [1]==='function')
    {
      userPropertyName=arguments[0];
      userChangeHandler=arguments[1];
    }
    else
      userChangeHandler=arguments[0];

    if(userPropertyName!==undefined){
      this.specificHandlers[userPropertyName]||(this.specificHandlers[
        userPropertyName]=[]);
      if(this.specificHandlers[userPropertyName].indexOf(userChangeHandler)===-1)
      {
        this.specificHandlers[userPropertyName].push(userChangeHandler);
        typeof this.sourceObject[userPropertyName]!=='function'&&
          userChangeHandler.call(this.sourceObject,[{name:userPropertyName,
            object:this.observableKeys,type:'update',oldValue:this.sourceObject
            [userPropertyName]}]);
      }
    }
    else{
      this.changeHandlers.indexOf(userChangeHandler)===-1&&this.changeHandlers
        .push(userChangeHandler);
      for(key in this.observableKeys)
        typeof this.sourceObject[key]!=='function'&&userChangeHandler.call(this.
          observableKeys,[{name:key,object:this.observableKeys,type:'update',
          oldValue:this.sourceObject[key]}]);
    }
  }

  ObservingWrapper.prototype.defineObservableProperties = function() {
    for(var propertyNames=getDeepPropertyNames(this.sourceObject,this.observableKeys),
      i=0,n=propertyNames.length; i<n; i++)
      this.defineObservableProperty(propertyNames[i]);
  }

  ObservingWrapper.prototype.defineObservableProperty = function(propertyName) {
    var ow=this,isEnum=typeof this.sourceObject[propertyName]!=='function';

    function get() {
      return ow.getPropertyValue(propertyName);
    }

    function set(userValue) {
      ow.setPropertyValue(propertyName, userValue);
    }
    
    Object.defineProperty(this.observableKeys, propertyName, {enumerable:isEnum, 
      configurable:true, get:get, set:set});
  }

  ObservingWrapper.prototype.getPropertyValue=function(propertyName){
    var ow=this;
    return typeof this.sourceObject[propertyName]!=='function'
      ? this.sourceObject[propertyName] 
      : function(){var len,ok,res,changes;

          len=ow.sourceObject.length,
          res=ow.sourceObject[propertyName].apply(ow.sourceObject,arguments);

          if(len&&len!==ow.sourceObject.length)
            ow.undefineObservableProperties(),
            ow.defineObservableProperties();

          ok=ow.observableKeys,changes=[{name:propertyName,object:ok,type:'call'
            ,arguments:arguments,result:res}];
          
          if(propertyName==='push')
            changes=[{object:ok,type:'splice',index:ow.sourceObject.length-1,
              removed:[],addedCount:1}];
          
          else if(propertyName==='splice')
            changes=[{object:ok,type:'splice',index:arguments[0],removed:res,
              addedCount:cropArgs(arguments,2).length}];

          ow.notifyObservers(changes);

          return res;
        };
  }

  ObservingWrapper.prototype.notifyObservers=function(changes){
    var specificHandlers,i,n;

    if(specificHandlers=this.specificHandlers[changes[0].name])
      for(i=0,n=specificHandlers.length;i<n;i++)
        specificHandlers[i].call(this.observableKeys,changes);

    for(i=0,n=this.changeHandlers.length;i<n;i++)
      this.changeHandlers[i].call(this.observableKeys,changes);
  }

  ObservingWrapper.prototype.removeChangeHandler = function() {
    var rmInd,key,userPropertyName,userChangeHandler;

    if(['string','number'].indexOf(typeof arguments[0])>-1 && typeof arguments
      [1]==='function')
    {
      userPropertyName=arguments[0];
      userChangeHandler=arguments[1];
    }
    else
      userChangeHandler=arguments[0];

    if(userPropertyName!==undefined){
      this.specificHandlers[userPropertyName]&&(rmInd=this.specificHandlers[
        userPropertyName].indexOf(userChangeHandler))>-1&&this.specificHandlers[
        userPropertyName].splice(rmInd,1);
    }
    else{
      (rmInd=this.changeHandlers.indexOf(userChangeHandler))>-1&&this.
        changeHandlers.splice(rmInd,1);

      for(key in this.specificHandlers)
        (rmInd=this.specificHandlers[key].indexOf(userChangeHandler))>-1&&this.
          specificHandlers[key].splice(rmInd,1);
    }
  }

  ObservingWrapper.prototype.setPropertyValue=function(propertyName,
    propertyValue){var oldValue;

    if(this.sourceObject[propertyName]!==propertyValue){
      oldValue=this.sourceObject[propertyName];
      this.sourceObject[propertyName]=propertyValue;
      this.notifyObservers([{name:propertyName,object:this.sourceObject,type:
        'update',oldValue:oldValue}]);
    }
  }

  ObservingWrapper.prototype.undefineObservableProperties = function() {
    for(var propertyNames=getDeepPropertyNames(this.observableKeys),i=0,n=
      propertyNames.length; i<n; i++)
      delete this.observableKeys[i];
  }

  // bindbind
  function c(){console.log.apply(console,arguments)}

  function bindElementPaths2ArraySplice(anchorElements,bindingPaths,userModelPath)
  {
    var a,ow;

    a=userModelPath.slice(0,1);
    ow=(byPath(viewModel,a)).__observingWrapper;
    
    if(ow===undefined){
      ow=new ObservingWrapper(byPath(viewModel,a));
      byPath(viewModel,a,ow.observableKeys);
    }

    ow.addChangeHandler(function(changes){
      for(var m=0;m<changes.length;m++)
        if(changes[m].type==='splice'){
          if(changes[m].addedCount)
            for(var k=0;k<changes[m].addedCount;k++){
              var q=changes[m].index+k-1;
              var f=anchorElements[q].cloneNode(true);
              anchorElements[q].parentNode.insertBefore(f,anchorElements[q].
                nextSibling);
              anchorElements.splice(changes[m].index+k,1,f);

              var j=q+1;
              var modelPath=userModelPath.slice();
              modelPath.splice(1,0,j);
              bindElementPaths2ModelPath(anchorElements[j],bindingPaths,modelPath);
            }
        }
    });
  }

  function bindModelProperty2Element(modelPath,element,valuePath)
  {
    c('bindModelPropertyToElement',{modelPath:modelPath,element:element,valuePath:valuePath})
    var a,b,ow;

    a=modelPath.slice(0,-1);
    b=modelPath.slice(-1)[0];

    ow=(byPath(viewModel,a)).__observingWrapper;
    
    if(ow===undefined){
      ow=new ObservingWrapper(byPath(viewModel,a));
      byPath(viewModel,a,ow.observableKeys);
    }

    if(valuePath[valuePath.length-1]==='nodeValue'&&!byPath(element,valuePath
      .concat().splice(0,2)))
        element.appendChild(document.createTextNode(''));
      
    ow.addChangeHandler(b,function(changes){
      for(var m=0;m<changes.length;m++)
        byPath(element,valuePath,changes[m].object[changes[m].name]);
    });
  }

  function bindElementPaths2ModelPath(anchorElement,bindingPaths,modelPath)
  {
    c('bindElementPaths2ModelPath',{anchorElement:anchorElement,bindingPaths:bindingPaths,modelPath:modelPath});

    for(var k=bindingPaths.length;k--;)
      bindModelProperty2Element(modelPath,anchorElement,bindingPaths[k]);
  }

  function byPath(obj,path,value)
  {
    var a,b;
    // c('byPath',{obj:obj,path:path,value:value})
    
    if(path.length===0)
      return obj;

    a=path.length-1;
    for(b=0;b<a;b++)
      obj=obj[path[b]];

    if(value!==undefined){
      if(path.args===undefined)
        obj[path[a]]=value;
      else{
        if(path.args.ind!==undefined)
          path.args.splice(path.args.ind,1,value);
        obj[path[a]].apply(obj,path.args);
      }
    }

    return obj[path[a]];
  }

  function findBindingPaths(node,placeholder,nodePaths,pathPrefix)
  {
    var a,b,possiblePaths,path,k;

    nodePaths=nodePaths||[];
    pathPrefix=pathPrefix||[];

    [['nodeValue'],['value']].forEach(function(path){
      var value=byPath(node,path);

      if(typeof value==='string'&&(placeholder?value.indexOf(placeholder)>-1:
        true))
          nodePaths.push(pathPrefix.concat(path));

      else if(value===null&&!placeholder)
        nodePaths.push(pathPrefix.concat(['childNodes',0,'nodeValue']));
    });

    if(placeholder){
      if(node.style)
        for(k in node.style)
          if((node.style.getPropertyValue(k)||'').indexOf(placeholder)>-1){
            path=pathPrefix.concat(['style','setProperty']);
            path.args=[k,undefined];
            path.args.ind=1;
            nodePaths.push(path);
          }

      if(node.classList&&placeholder.indexOf(' ')===-1&&node.classList.contains(
        placeholder))
      {
        path=pathPrefix.concat(['classList','remove']);
        path.args=[placeholder];
        nodePaths.push(path);
      
        path=pathPrefix.concat(['classList','add']);
        path.args=[undefined];
        path.args.ind=0;
        nodePaths.push(path);
      }

      if(node.attributes)
        for(k=node.attributes.length;k--;)
          if(['style','class'].indexOf(node.attributes[k].nodeName)===-1)
            if(node.attributes[k].nodeValue.indexOf(placeholder)>-1){
              path=pathPrefix.concat(['attributes',k,'nodeValue']);
              nodePaths.push(path);
            }
    }

    if((a=node.childNodes.length)&&placeholder)
      while(a--)
        findBindingPaths(node.childNodes[a],placeholder,nodePaths,pathPrefix.
          concat(['childNodes',a]));

    return nodePaths;
  }

  function mergeBindingData(destData,srcData)
  {
    var a,modelPathIn;

    modelPathIn=false;
    for(a=0;a<destData.length;a++)
      modelPathIn=destData[a].modelPath.reduce(function(r,m,i){
        return srcData.modelPath[i]===m&&r},true)||modelPathIn;

    if(!modelPathIn)
      destData.push({modelPath:srcData.modelPath,bindingPaths:srcData.bindingPaths});
  }

  function mergeItemsIntoBindable(bindable,items)
  {
    var a,b;
// c('^^',items)
    for(a=0;a<items.length;a++){
      for(b=0;b<bindable.length;b++){
        if(bindable[b].modelProperty===items[a].modelPath[0]){
          if(bindable[b].anchorElements.indexOf(items[a].anchorElement)===-1){
            if(bindable[b].anchorElements[0].parentNode===items[a].anchorElement
              .parentNode)
            {
              bindable[b].anchorElements.push(items[a].anchorElement);
              items[a]=undefined;
              break;
            }
          }
          else{
            mergeBindingData(bindable[b].bindingData,items[a])
            items[a]=undefined;
            break;
          }
        }
      }
// c('%%',items[a])
      if(items[a])
        bindable.push({anchorElements:[items[a].anchorElement],bindingData:
          [{modelPath:items[a].modelPath,bindingPaths:items[a].bindingPaths}],
          modelProperty:items[a].modelPath[0]});
    }
  }

  function collectBindableElements()
  {
    var a,b,d,e,f,g,h;

    a=document.body.getElementsByTagName('*'),f=[];

    for(b=0;b<a.length;b++){
      e=[];
      
      for(d=0;d<a[b].attributes.length;d++)
        if(a[b].attributes[d].name.indexOf('bb-')===0){
          g=a[b].attributes[d].name.substring(3).split(':').splice(0,2);

          e.push({anchorElement:a[b],modelPath:g,bindingPaths:
            findBindingPaths(a[b],a[b].attributes[d].value)});
        }

      if(e.length)
        mergeItemsIntoBindable(f,e);
    }

    return f;
  }

  function __collectBindableElements()
  {
    var a,b,c,d,e,f,g,h;

    a=[],g=[],b=document.body.getElementsByTagName('*');

    for(c=b.length;c--;)
      for(d=b[c].attributes.length;d--;)
        if(b[c].attributes[d].name.indexOf('bb-')===0){
          f=b[c].attributes[d].name.substring(3).split(':');

          if(-1===(e=g.indexOf(f[0])))
            g.push(f[0]),
            e=a.push({modelPath:f,bindingData:[]})-1;

          for(h=a[e].bindingData.length;h--;)
            if(a[e].bindingData[h].anchorElements[0].parentNode===b[c].parentNode)
              break;

          if(h>-1)
            a[e].bindingData[h].anchorElements.unshift(b[c]);

          else
            a[e].bindingData.push({anchorElements:[b[c]],bindingPaths:
              findBindingPaths(b[c],b[c].attributes[d].value)});
        }

    return a;
  }

  function bind()
  {
    for(var l=0;l<bindableElements.length;l++){
      var anchorElements=bindableElements[l].anchorElements;
      var u=ObservingWrapper.getSourceObject(viewModel[bindableElements[l].modelProperty]);
      var w=(u&&Array.isArray(u)&&u.length)||0;
       
      for(var o=bindableElements[l].bindingData.length;o--;){
        var userModelPath=bindableElements[l].bindingData[o].modelPath;
        var bindingPaths=bindableElements[l].bindingData[o].bindingPaths;

        if(w>1)
          for(var q=0;q<w-1;q++){
            if(anchorElements[q+1]!==undefined)
              continue;

            var f=anchorElements[q].cloneNode(true);
            anchorElements[q].parentNode.insertBefore(f,anchorElements[q].
              nextSibling);
            anchorElements.push(f);
          }

        if(Array.isArray(ObservingWrapper.getSourceObject(viewModel[
          userModelPath[0]])))
        {
          bindElementPaths2ArraySplice(anchorElements,bindingPaths,userModelPath);

          for(var j=viewModel[userModelPath[0]].length;j--;){
            var modelPath=userModelPath.slice();
            modelPath.splice(1,0,j);
            bindElementPaths2ModelPath(anchorElements[j],bindingPaths,modelPath);
          }
        }
        else
          bindElementPaths2ModelPath(anchorElements[0],bindingPaths,userModelPath);
      }
    }
  }

  function afterDOMContentLoaded()
  {
    bindableElements=collectBindableElements();
    c('bindableElements',bindableElements);

    if(viewModel)
      bind();
  }

  function bindbind(userViewModel)
  {
    viewModel=(new ObservingWrapper(userViewModel)).observableKeys;

    if(['interactive','complete'].indexOf(document.readyState)>-1)
      bind();

    return viewModel;
  }

  if(['interactive','complete'].indexOf(document.readyState)>-1)
    afterDOMContentLoaded();
  else
    document.addEventListener("DOMContentLoaded",afterDOMContentLoaded,false);

  if(window.define===undefined)
    window.bindbind=bindbind;
  else
    define(function(){return bindbind});

}(window)
