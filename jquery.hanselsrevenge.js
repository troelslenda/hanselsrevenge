/*
  CopyWrite 2012, Martin Murphy martin.murphy@whiteboard-it.com
  http://github.com/soitgoes/hanselsrevenge
  MIT License
  http://opensource.org/licenses/mit-license.php
*/

function BreadCrumbTrail(options){
  this.options = options;
  this.trail = [];
  this.links = {};

  this.push = function(crumb){
      if (this.links[crumb.link] !== true){
        this.trail.push(crumb);
        this.links[crumb.link] = true;
      }else{
        this.rewindToUrl(crumb.link);
      }
      if (this.trail.length > 3){
        //this.trail = this.trail.slice(0,3);
      }
  }
  this.pop = function(){
    var crumb = this.trail.pop();
    this.links[crumb.link] = undefined;
    return crumb;
  }
  this.init = function(trail){
    this.trail = trail;
    for (var i=0; i< trail.length; i++){
      this.links[trail[i].link] = true;
    }
  }

  this.rewindToUrl = function(relUrl){
    var y = this.trail.length - 1;
    for (; y >= 0 && this.trail[y].link != relUrl; y--) { }
    this.trail = y===0 ? [this.trail[0]] :  this.trail.slice(0, y + 1);
  }

}
(function ($) {
  $.fn.hanselsRevenge = function (options) {

    var defaultOptions = {
      maxDepth: 5,
      inheritLandingCrumbs: true,
      cookieOptions: {
        path :"/",
        cookieKey : "hanselsrevenge"
      },
      debug : false,
      titleCallback : null
    };
    var options = jQuery.extend(defaultOptions, options);

    var breadCrumb = new BreadCrumbTrail(options);
    var bcContainer = this;
    var cookieKey = options.cookieOptions.cookieKey;

    var log = function(mesg){
      if (console && console.log && options.debug){
        console.log(mesg);
      }
    }

    if (options.debug && bcContainer.length < 1){
      console.log("No breadcrumbs found for: " + options.breadCrumbSelector);
    }

    var getOrigin = function(absUrl){
      var originPattern = /(https?:\/\/.*?)(\/|$)/;
      var result = originPattern.exec(absUrl);
      if (result && result.length > 0){
        return result[1];
      }
      return "";
    }

    var getRelativeUrl = function(absUrl){
      var originPattern = /https?:\/\/.*?(\/.*?)($|\?|#)/;
      var result = originPattern.exec(absUrl);
      if (result){
        return result[1];
      }
       return "/";
    }
    $("a").click(function(){
      //external links clear the cookie
      if (this.href && (getOrigin(this.href) !== document.location.protocol + "//" + document.location.host
        || (options.resetPattern !==undefined) ? this.href.match(options.resetPattern) : false)
      ){
        log("clearing breadcrumb trail");
        $.removeCookie(cookieKey, options.cookieOptions);
      }
    })
    var getTitle = function(){
      if (typeof options.titleCallback == "function") {
        return options.titleCallback();
      }
      if (document.title)
        return document.title;
      var path = document.location.pathname;
      if (path[path.length-1] === '/'){
        path = path.substring(0, path.length -1); //remove trailing slash
      }
      return path.split('/').pop();
    }
    var val = $.cookie(cookieKey);
    if (val === null){
      if (options.inheritLandingCrumbs){
        //read the crumbs
        $("li a", bcContainer).each(function(){
          breadCrumb.push({link:getRelativeUrl(this.href), text: this.innerHTML});
        })
        var last = $("li:last-child", bcContainer);
        if (last){
          breadCrumb.push({link:document.location.pathname, text: last[0].innerHTML});
        }
      }else{
        breadCrumb.init(options.defaultTrail || []);
      }
    }else{
      breadCrumb.init(JSON.parse(val));
    }
    breadCrumb.push({link:document.location.pathname, text:getTitle()});
    if (breadCrumb.trail.length > 0){
      $.cookie(cookieKey, JSON.stringify(breadCrumb.trail), options.cookieOptions);
      if (bcContainer.length > 0){
        bcContainer.html("");
        var depth = breadCrumb.trail.length > options.maxDepth ? options.maxDepth  : breadCrumb.trail.length;
        for (var i = depth-1; i >= 0; i--) {
              var item =  breadCrumb.trail.shift();
              text = (i == 0) ? item.text : item.text.link(item.link);

              bcContainer.append($('<li>').html(text));
        }
      }
    }
  };
})(jQuery);
