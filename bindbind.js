/*
 * bindbind.js
 * https://github.com/ytiurin/bindbind.js
 *
 * The MIT License (MIT)
 * Copyright (c) 2015 Yevhen Tiurin <yevhentiurin@gmail.com>
 *
 * Aug 3, 2015
 */

'use strict';

!function(){

var bindableElements,bbInstances,appendQueue,appendTimeId;

// Observing proxy
var observingProxy=function(ts,ps,cs,hs){

  function getDeepPropertyDescriptors(o)
  {
    var ns;

    if(o){
      ns=getDeepPropertyDescriptors(Object.getPrototypeOf(o))||[];
      Array.prototype.push.apply(ns,
        Object.getOwnPropertyNames(o)
          .filter(function(k){
            return isNaN(parseInt(k))})
          .map(function(k){
            return {name:k,descriptor:Object.getOwnPropertyDescriptor(o,k)}}));
    }

    return ns;
  }

  function newProxy(t)
  {
    var p={},ns=getDeepPropertyDescriptors(t);

    for(var i=ns.length;i--;){
      delete ns[i].descriptor.value;
      delete ns[i].descriptor.writable;

      ns[i].descriptor.get=propertyGetter.bind({target:t,name:ns[i].name});
      ns[i].descriptor.set=propertySetter.bind({target:t,name:ns[i].name});

      try{
        Object.defineProperty(p,ns[i].name,ns[i].descriptor);
      }
      catch(e){}
    }

    return p;
  }

  function notifyObservers(target)
  {
    var i=targetIndex(target);

    if(cs[i].length)
      for(var l=0;l<hs[i].length;l++)
        hs[i][l].call(this,cs[i]);

    cs[i]=[];
  }

  function propertyGetter()
  {
    var r=this.target[this.name];

    if(Array.isArray(this.target)&&['pop','push','shift','splice','unshift'].
      indexOf(this.name)>-1)
      r=function(){
        var res=this.target[this.name].apply(this.target,arguments);

        cs[targetIndex(this.target)].push(({
          'pop':{object:this.target,type:'splice',index:this.target.length-1,
            removed:[res],addedCount:0},
          'push':{object:this.target,type:'splice',index:this.target.length-1,
            removed:[],addedCount:1},
          'shift':{object:this.target,type:'splice',index:0,removed:[res],
            addedCount:0},
          'splice':{object:this.target,type:'splice',index:arguments[0],
            removed:res,addedCount:Array.prototype.slice.call(arguments,2).length},
          'unshift':{object:this.target,type:'splice',index:0,removed:[],
            addedCount:1}
        })[this.name]);

        setTimeout(function(){
          notifyObservers(this.target)}.bind(this));
      }.bind(this);

    return r;
  }

  function propertySetter(userVal)
  {
    var val=this.target[this.name];
    if(val!==userVal){
      this.target[this.name]=userVal;
      cs[targetIndex(this.target)].push(
        {name:this.name,object:this.target,type:'update',oldValue:val});
      setTimeout(function(){
        notifyObservers(this.target)}.bind(this));
    }
  }

  function targetIndex(t)
  {
    var i=ts.indexOf(t);

    if(i===-1){
      i=ts.push(t)-1;
      ps.push(newProxy(t));
      cs.push([]);
      hs.push([]);
    }

    return i;
  }

  return {
    addChangeHandler:function(target,changeHandler,callOnInit){
      var i=targetIndex(target);
      hs[i].indexOf(changeHandler)===-1&&hs[i].push(changeHandler);

      if(callOnInit){
        var changes=Object.getOwnPropertyNames(target).map(function(key){
          return {name:key,object:target,type:'update',oldValue:target[key]}
        });
        changeHandler.call(target,changes);
      }
    },
    getProxy:function(target){
      return ps[targetIndex(target)];
    },
    removeChangeHandler:function(target,changeHandler){
      var i=targetIndex(target),rmInd;
      if((rmInd=hs[i].indexOf(changeHandler))>-1)
        hs[i].splice(rmInd,1);
    }
  }
}.bind(this)([],[],[],[]);

// bindbind
function c(){console.log.apply(console,arguments)}

function touch(obj,path,newValue)
{
  var propName;

  if(path.length===0)
    return obj;

  propName=path[path.length-1];
  for(var b=0;b<path.length-1;b++)
    if(obj[path[b]])
      obj=obj[path[b]];
    else
      return;

  if(path.args){
    if(path.args.ind!==undefined)
      path.args.splice(path.args.ind,1,newValue);
    obj[propName].apply(obj,path.args);
  }
  else
    if(newValue)
      obj[propName]=newValue;

  return obj[propName];
}

function appendElement(el)
{
  if(el.anchor.parentNode)
    el.anchor.parentNode.insertBefore(el.clone,el.anchor);
  else
    el.parent.appendChild(el.clone);
}

function continueAppendElements(animate)
{
  if(appendTimeId)
    return;

  if(!appendQueue.length)
    return;

  var el=appendQueue.splice(0,1)[0];
  var element=el.clone;
  appendElement(el);

  if(animate){
    var t={
      opacity:element.style.opacity,
      transition:element.style.transition
    }
    element.style.opacity='0';
    element.style.transition='all 0.7s';
    setTimeout(function(){
      element.style.opacity='1';

      setTimeout(function(){
        element.style.transition=t.transition;
        setTimeout(function(){
          element.style.height=t.height;
          element.style.opacity=t.opacity;
        });
      },700);
    });

    appendTimeId=setTimeout(function(){
      appendTimeId=0;
      continueAppendElements(animate);
    },100);
  }
  else
    continueAppendElements(animate);
}

function appendElements(es,animate)
{
  for(var i=0;i<es.length;i++)
    appendQueue.push(es[i]);
  continueAppendElements(animate);
}

function animateTextReduceRaise(element,valuePath,text)
{
  function reduceText(params)
  {
    var text=touch(params.element,params.valuePath).slice(0,-1);
    touch(params.element,params.valuePath,text);

    if(text.length)
      setTimeout(function(){reduceText(params)},10);
    else
      raiseText(params);
  }

  function raiseText(params)
  {
    var l=touch(params.element,params.valuePath).length+1;
    var text=params.text.substr(0,l);
    touch(params.element,params.valuePath,text);

    if(text.length!==params.text.length)
      setTimeout(function(){raiseText(params)},10);
  }

  reduceText({element:element,valuePath:valuePath,text:text});
}

function animateTextFill(element,valuePath,text)
{
  function pm(i)
  {
    if(i<=maxI){
      var s=elementValueRouter.value;
      s=text.substr(0,i)+s.substr(i);
      elementValueRouter.value=s;
      setTimeout(function(){pm(i+1)},10);
    }
  }

  var maxI=Math.max(text.length,touch(element,valuePath).length);
  pm(1);
}

function bindElementPaths2ArraySplice(bi)
{
  c('bindElementPaths2ArraySplice',{bi:bi})

  observingProxy.addChangeHandler(touch(this.viewModel,[bi.modelProperty]),
    function(changes){
      for(var m=changes.length;m--;)
        if(changes[m].type==='splice'){
          if(changes[m].addedCount){
            var es=[];

            for(var k=0;k<changes[m].addedCount;k++){
              var q=changes[m].index+k;
              var anchor=bi.anchorElements[q];
              var clone=anchor.cloneNode(true);
              // clone.style.backgroundColor=(['lightseagreen','lightgreen',
              //   'lightcoral','lightcyan','lavenderblush','lightblue'])
              //   [parseInt(Math.random()*5)];
              es.push({anchor:anchor,clone:clone,parent:bi.anchorParent});
              bi.anchorElements.splice(q,0,clone);

              for(var i=0;i<bi.bindingData.length;i++){
                var modelPath=bi.bindingData[i].modelPath.slice();
                modelPath.splice(1,0,q);
                bindElementPaths2ModelPath.call(this,clone,bi.bindingData[i].
                  bindingPaths,modelPath);
              }
            }

            appendElements(es,false);
          }
          else if(changes[m].removed.length){
            for(var k=0;k<changes[m].removed.length;k++){
              var s=changes[m].index+k;
              bi.anchorElements[s].parentNode.removeChild(bi.anchorElements[s]);
            }

            bi.anchorElements.splice(changes[m].index,
              changes[m].removed.length);
          }
          break;
        }
    }.bind(this),true);
}

function bindModelProperty2Element(modelPath,element,valuePath)
{
  c('bindModelPropertyToElement',{modelPath:modelPath,element:element,
    valuePath:valuePath})
  var a,b;

  a=modelPath.slice(0,-1);
  b=modelPath.slice(-1)[0];

  if(valuePath[valuePath.length-1]==='nodeValue'&&!touch(element,
    valuePath.concat().splice(0,2)))
      element.appendChild(document.createTextNode(''));

  observingProxy.addChangeHandler(touch(this.viewModel,a),
    function(changes){
      for(var m=changes.length;m--;)
        if(changes[m].name===b){
          // if(valuePath[valuePath.length-1]==='nodeValue'&&
          //   valuePath[valuePath.length-3]!=='attributes')
            // animateTextFill(element,valuePath,
            //   changes[m].object[changes[m].name]);
            // animateTextReduceRaise(element,valuePath,
            //   changes[m].object[changes[m].name]);
          // else
            touch(element,valuePath,
              changes[m].object[changes[m].name]);
          break;
        }
    },true);
}

function bindElementPaths2ModelPath(anchorElement,bindingPaths,modelPath)
{
  c('bindElementPaths2ModelPath',{anchorElement:anchorElement,bindingPaths:
    bindingPaths,modelPath:modelPath});

  for(var k=bindingPaths.length;k--;)
    bindModelProperty2Element.call(this,modelPath,anchorElement,
      bindingPaths[k]);
}

function findBindingPaths(node,placeholder,nodePaths,pathPrefix)
{
  var a,b,possiblePaths,path,k;

  nodePaths=nodePaths||[];
  pathPrefix=pathPrefix||[];

  [['nodeValue'],['value']].forEach(function(path){
    var value=touch(node,path);

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
          if(node.attributes[k].value.indexOf(placeholder)>-1){
            path=pathPrefix.concat(['attributes',k,'value']);
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
    destData.push({modelPath:srcData.modelPath,bindingPaths:
      srcData.bindingPaths});
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
      bindable.push({anchorElements:[items[a].anchorElement],
        anchorParent:items[a].anchorElement.parentNode,
        bindingData:[{modelPath:items[a].modelPath,
        bindingPaths:items[a].bindingPaths}],
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

function bind()
{
  for(var l=0;l<bindableElements.length;l++){
    var anchorElements=bindableElements[l].anchorElements;
    var anchorParent=bindableElements[l].anchorParent;
    var u=this.viewModel[bindableElements[l].modelProperty];
    // u=(u.__observingProxy&&u.__observingProxy.sourceObject)||u;

    if(u&&Array.isArray(u)){
      if(u.length>1){
        var es=[];

        for(var q=0;q<u.length-1;q++){
          if(anchorElements[q+1]!==undefined)
            continue;

          var clone=anchorElements[q].cloneNode(true);
          es.unshift({anchor:anchorElements[q],clone:clone,parent:anchorParent
            });

          anchorElements.unshift(clone);
        }

        appendElements(es,false);
      }

      if(anchorElements.length>u.length)
        bindableElements[l].anchorElements=anchorElements.reduce(function(
          r,anchor,i){
          if(i>=u.length)
            anchorElements[i].parentNode.removeChild(anchorElements[i]);
          // else
            r.push(anchor);
          return r;
        },[]);

      bindElementPaths2ArraySplice.call(this,bindableElements[l]);
    }

    for(var o=bindableElements[l].bindingData.length;o--;){
      var userModelPath=bindableElements[l].bindingData[o].modelPath;
      var bindingPaths=bindableElements[l].bindingData[o].bindingPaths;

      if(Array.isArray(u))
        for(var j=this.viewModel[userModelPath[0]].length;j--;){
          var modelPath=userModelPath.slice();
          modelPath.splice(1,0,j);
          bindElementPaths2ModelPath.call(this,anchorElements[j],bindingPaths,
            modelPath);
        }
      else
        bindElementPaths2ModelPath.call(this,anchorElements[0],bindingPaths,
          userModelPath);
    }
  }
}

function afterDOMContentLoaded()
{
  bindableElements=collectBindableElements();
  c('bindableElements',bindableElements);

  for(var i=0;i<bbInstances.length;i++)
    bind.call(bbInstances[i]);
}

function bb(obj)
{
  return observingProxy.getProxy(obj);
}

function bbConstructor(userViewModel)
{
  this.viewModel=userViewModel;
  this.proxies=[observingProxy.getProxy(userViewModel)];

  if(['interactive','complete'].indexOf(document.readyState)>-1)
    bind.call(this);

  var bbInstance=bb.bind(this);
  bbInstances.push(this);

  return bbInstance;
}

bbInstances=[];
appendQueue=[];
appendTimeId=0;

if(['interactive','complete'].indexOf(document.readyState)>-1)
  afterDOMContentLoaded();
else
  document.addEventListener("DOMContentLoaded",afterDOMContentLoaded,false);

if(this.module&&this.module.exports)
  this.module.exports=bbConstructor;
else if(this.define&&this.define.amd)
  this.define(function(){return bbConstructor});
else
  this.bindbind=bbConstructor;

}.bind(this)()
