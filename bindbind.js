
!function(){

  var viewModel,bindableElements;

  // ObservingWrapper
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
    this.observingKeys={};
    this.changeHandlers=[];
    this.specificHandlers={};

    Object.defineProperty(this.observingKeys,'__observingWrapper',{value:this});
    this.defineObservableProperties();
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
          userChangeHandler.call(this.sourceObject,this.sourceObject[
          userPropertyName]);
      }
    }
    else{
      this.changeHandlers.indexOf(userChangeHandler)===-1&&this.changeHandlers
        .push(userChangeHandler);
      for(key in this.observingKeys)
        typeof this.sourceObject[key]!=='function'&&userChangeHandler.call(this.
          sourceObject,key,this.sourceObject[key]);
    }
  }

  ObservingWrapper.prototype.defineObservableProperties = function() {
    for(var propertyNames=getDeepPropertyNames(this.sourceObject,this.observingKeys),
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
    
    Object.defineProperty(this.observingKeys, propertyName, {enumerable:isEnum, 
      configurable:true, get:get, set:set});
  }

  ObservingWrapper.prototype.getPropertyValue = function(propertyName) {
    var ow=this;
    return typeof this.sourceObject[propertyName] !== 'function' ? this.
      sourceObject[propertyName] : function() {
        var
        length=ow.sourceObject.length,
        result=ow.sourceObject[propertyName].apply(ow.sourceObject,arguments);

        if(length&&length!==ow.sourceObject.length) {
          ow.undefineObservableProperties();
          ow.defineObservableProperties();
        }

        ow.notifyObservers(propertyName,arguments,result);

        return result;
      };
  }

  ObservingWrapper.prototype.notifyObservers = function() {
    var specificHandlers,i;
    
    function reduceArgs(args){
      return Array.prototype.slice.call(args,1);
    }

    if(specificHandlers=this.specificHandlers[arguments[0]])
      for(i=0,n=specificHandlers.length;i<n;i++)
        specificHandlers[i].apply(this.sourceObject,reduceArgs(arguments));

    for(i=0,n=this.changeHandlers.length;i<n;i++)
      this.changeHandlers[i].apply(this.sourceObject,arguments);
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

  ObservingWrapper.prototype.setPropertyValue = function(propertyName,propertyValue) {
    if (this.sourceObject[propertyName] !== propertyValue) {
      this.sourceObject[propertyName] = propertyValue;
      this.notifyObservers(propertyName, propertyValue);
    }
  }

  ObservingWrapper.prototype.undefineObservableProperties = function() {
    for(var propertyNames=getDeepPropertyNames(this.observingKeys),i=0,n=
      propertyNames.length; i<n; i++)
      delete this.observingKeys[i];
  }

  // bindbind
  function c(){console.log.apply(console,arguments)}

  function nodeInsertAfter(referenceNode, newNode) {
    referenceNode.parentNode.insertBefore(newNode,referenceNode.nextSibling);
  }

  function bindElementPaths2ModelPath(anchorElement,bindingPaths,modelPath)
  {
    c('bindElementPaths2ModelPath',{anchorElement:anchorElement,bindingPaths:bindingPaths,modelPath:modelPath});

    for(var k=bindingPaths.length;k--;)
      bindModelPropertyToElement(modelPath,anchorElement,bindingPaths[k]);
  }

  function bindModelPropertyToElement(modelPath,element,valuePath)
  {
    c('bindModelPropertyToElement',{modelPath:modelPath,element:element,valuePath:valuePath})
    var a,b;

    a=modelPath.slice(0,-1);
    b=modelPath.slice(-1)[0];

    ow=(byPath(viewModel,a)).__observingWrapper;
    
    if(ow===undefined){
      ow=new ObservingWrapper(byPath(viewModel,a));
      byPath(viewModel,a,ow.observingKeys);
    }
      
    ow.addChangeHandler(b,function(propertyValue){
      byPath(element,valuePath,propertyValue);
    });
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

    if(value!==undefined)
      obj[path[a]]=value;

    return obj[path[a]];
  }

  function findBindingPaths(node,placeholder,nodePaths,pathPrefix)
  {
    var a,b,possiblePaths,path;

    nodePaths=nodePaths||[];
    pathPrefix=pathPrefix||[];

    [['nodeValue'],['value']].forEach(function(path){
      var value=byPath(node,path);

      if(typeof value==='string'&&(placeholder?value.indexOf(placeholder)>-1:true)){
        nodePaths.push(pathPrefix.concat(path));
        // byPath(node,path,'');
      }
      else if(!placeholder){
        node.appendChild(document.createTextNode(''));
        nodePaths.push(pathPrefix.concat(['childNodes',0,'nodeValue']));
      }
    });

    if(placeholder){
      for(var k in node.style){
        if(['cssText'].indexOf(k)===-1){
          path=['style',k];
          var value=byPath(node,path);
          if(typeof value==='string'&&value.indexOf(placeholder)>-1)
            nodePaths.push(pathPrefix.concat(path));
        }
      }
    }

    if((a=node.childNodes.length)&&placeholder)
      while(a--)
        findBindingPaths(node.childNodes[a],placeholder,nodePaths,pathPrefix.concat(['childNodes',a]));

    return nodePaths;
  }

  function collectBindableElements()
  {
    var a,b,c,d,e,f,g;

    a=[];
    g=[];
    b=document.body.getElementsByTagName('*');

    for(c=b.length;c--;)
      for(d=b[c].attributes.length;d--;)
        if(b[c].attributes[d].name.indexOf('bb-')===0){
          f=b[c].attributes[d].name.substring(3).split(':');
          
          if((e=g.indexOf(b[c]))===-1){
            g.push(b[c]);
            e=a.push({anchorElement:b[c],bindingData:[]})-1;
          }
          
          a[e].bindingData.push({modelPath:f,bindingPaths:findBindingPaths(b[c],
            b[c].attributes[d].value)});

          // b[c].attributes.removeNamedItem(b[c].attributes.item(d).name);
        }

    return a;
  }

  function bind()
  {
    for(var l=bindableElements.length;l--;){
      var anchorElements=[bindableElements[l].anchorElement];
      var w=Math.max.apply(Math,bindableElements[l].bindingData.map(function(k){
        var u=viewModel[k.modelPath[0]];
        return (u&&Array.isArray(u)&&u.length)||0;
      }));

      if(w>1)
        for(var q=0;q<w-1;q++){
          var f=anchorElements[q].cloneNode(true);
          nodeInsertAfter(anchorElements[q],f);
          anchorElements.push(f);
        }
       
      for(var o=bindableElements[l].bindingData.length;o--;){
        var bindingPaths=bindableElements[l].bindingData[o].bindingPaths;
        var userModelPath=bindableElements[l].bindingData[o].modelPath;

        if(Array.isArray(viewModel[userModelPath[0]]))
          for(var j=viewModel[userModelPath[0]].length;j--;){
            var modelPath=userModelPath.slice();
            modelPath.splice(1,0,j);
            bindElementPaths2ModelPath(anchorElements[j],bindingPaths,modelPath);
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
    viewModel=(new ObservingWrapper(userViewModel)).observingKeys;

    if(document.readyState==='complete')
      bind();

    return viewModel;
  }

  document.addEventListener("DOMContentLoaded",afterDOMContentLoaded,false);

  if(window.define===undefined)
    window.bindbind=bindbind;
  else
    define(function(){return bindbind});

}(window)
