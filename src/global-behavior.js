import {Behavior} from 'aurelia-templating';
import * as LogManager from 'aurelia-logging';

export class GlobalBehavior {
  static metadata(){ 
    return Behavior
      .attachedBehavior('global-behavior')
      .withOptions().and(x => x.dynamic()); 
  }

  static inject() { return [Element]; }
  constructor(element) {
    this.element = element;
  }

  bind(){
    var handler = GlobalBehavior.handlers[this.aureliaAttrName];

    if(!handler){
      throw new Error(`Conventional binding handler not found for ${this.aureliaAttrName}.`);
    }

    try{
      this.handler = handler.bind(this, this.element, this.aureliaCommand) || handler;
    }catch(error){
      throw new Error('Conventional binding handler failed.', error);
    }
  }

  attached(){
    if(this.handler && 'attached' in this.handler){
      this.handler.attached(this, this.element);
    }
  }

  detached(){
    if(this.handler && 'detached' in this.handler){
      this.handler.detached(this, this.element);
    }
  }

  unbind(){
    if(this.handler && 'unbind' in this.handler){
      this.handler.unbind(this, this.element);
    }

    this.handler = null;
  }
}

GlobalBehavior.createSettingsFromBehavior = function(behavior){
  var settings = {};

  for(var key in behavior){
    if(key === 'aureliaAttrName' || key === 'aureliaCommand' || !behavior.hasOwnProperty(key)){
      continue;
    }

    settings[key] = behavior[key];
  }

  return settings;
};

GlobalBehavior.jQueryPlugins = {};

GlobalBehavior.handlers = { 
  jquery:{
    bind(behavior, element, command){
      var settings = GlobalBehavior.createSettingsFromBehavior(behavior);
      var pluginName = GlobalBehavior.jQueryPlugins[command] || command;
      var jqueryElement = window.jQuery(element);

      if(!jqueryElement[pluginName]){
        LogManager.getLogger('templating-resources').warn(`Could not find the jQuery plugin ${pluginName}, possibly due to case mismatch. Trying to enumerate jQuery methods in lowercase. Add the correctly cased plugin name to the GlobalBehavior to avoid this performance hit.`);
        for(var prop in jqueryElement){
          if(prop.toLowerCase() === pluginName){
            pluginName = prop;  
          }
        }
      }
      behavior.plugin = jqueryElement[pluginName](settings);  
    },
    unbind(behavior, element){
      if(typeof behavior.plugin.destroy === 'function'){
        behavior.plugin.destroy();
        behavior.plugin =  null;
      }
    }
  }
};
