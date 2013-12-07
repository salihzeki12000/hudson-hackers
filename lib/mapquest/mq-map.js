var MQ={Control:{},control:{},Util:{}};
MQ.TileLayer=L.TileLayer.extend({_config:{},options:{key:null,mapType:"map",ext:"png",attribution:"&copy;&nbsp;Mapquest"},initialize:function(a){L.setOptions(this,a);MQ.mapConfig.setAPIKey(this.options);var b=this;MQ.mapConfig.ready(function(){var a=b.options.mapType;b.options.mapType=null;b.setMapType(a)})},setMapType:function(a){if(a!=this.options.mapType){this.options.mapType=a;if(a=MQ.mapConfig.getConfig(a))this._url=a.url,L.setOptions(this,a),this.redraw();this.fire("maptypechange",{layer:this})}},
setUrl:function(a,b){},onAdd:function(a){L.TileLayer.prototype.onAdd.call(this,a);a.mapquest?a.mapquest.layers.push(this):(a.mapquest={},a.mapquest.layers=[this],a.mapquest.logo=(new MQ.Control.Logo).addTo(a),a.attributionControl&&(a.mapquest.oldAttribution=a.attributionControl,a.attributionControl.removeFrom(a)),this._resetStats(!0),this._resetStats(!1),a.mapquest.lastScale=MQ.mapConfig.getScale(this._map.getZoom()),a.mapquest.attributionControl=a.attributionControl=MQ.control.attribution().addTo(a));
this._setBaseLayer(a)},onRemove:function(a){if(1==a.mapquest.layers.length)a.mapquest.logo.removeFrom(a),a.mapquest.attributionControl.removeFrom(a),a.mapquest.oldAttribution&&(a.attributionControl=a.mapquest.oldAttribution.addTo(a)),a.mapquest.layers=[],this._setBaseLayer(a),delete a.mapquest;else{for(var b=0;b<a.mapquest.layers.length;b++)if(a.mapquest.layers[b]==this){a.mapquest.layers.splice(b,1);break}this._setBaseLayer(a)}L.TileLayer.prototype.onRemove.call(this,a)},_setBaseLayer:function(a){if(a.mapquest){for(var b=
null,c=a.mapquest.layers,d=0;d<c.length&&(b=c[d],"hyb"!=c[d].options.mapType);d++);a.mapquest.baseLayer!=b&&(a.mapquest.baseLayer&&(a.off("viewreset",a.mapquest.baseLayer._onViewReset,a.mapquest.baseLayer),a.off("movestart",a.mapquest.baseLayer._onMoveStart,a.mapquest.baseLayer),a.off("moveend",a.mapquest.baseLayer._onMoveEnd,a.mapquest.baseLayer),L.DomEvent.off(window,"unload",a.mapquest.baseLayer._onMapDestroy,a.mapquest.baseLayer),a.mapquest.baseLayer._sendTransactions()),b&&(a.on("viewreset",
b._onViewReset,b),a.on("movestart",b._onMoveStart,b),a.on("moveend",b._onMoveEnd,b),L.DomEvent.on(window,"unload",b._onMapDestroy,b)),(a.mapquest.baseLayer=b)&&a.mapquest.attributionControl&&(a.mapquest.attributionControl.mapTypeChanged(),b._resetTransactionPosition()),a.fire("mqbaselayerchange"))}},_onMapDestroy:function(){if(this._sendTransactions())for(var a=(new Date).getTime()+250;(new Date).getTime()<a;);},getTileUrl:function(a){return this._url?(this._adjustTilePoint(a),L.Util.template(this._url,
L.extend({s:this._getSubdomain(a),z:this._getZoomForUrl(),x:a.x,y:a.y},this.options))):MQ.mapConfig.getConfig("imagePath")+"loading-tile-gears.jpg"},_sendTransactions:function(){var a=!1;if(this._map&&this._map.mapquest){var b=this._map.mapquest;0<b.mapaccum1&&(this._loadTransactionImage(this._map,"m",b.mapaccum1,b.mapaccum2,b.lastScale),a=!0);0<b.sataccum1&&(this._loadTransactionImage(this._map,"a",b.sataccum1,b.sataccum2,b.lastScale),a=!0);0<b.hybaccum1&&(this._loadTransactionImage(this._map,"h",
b.hybaccum1,b.hybaccum2,b.lastScale),a=!0);this._resetStats(!0)}return a},_loadTransactionImage:function(a,b,c,d,e){c=parseInt(1E6*c)/1E6;d=parseInt(1E6*d)/1E6;a=this._map.getCenter();var f=this._map.getSize(),g="L_"+L.version+"_"+MQ.mapConfig.getConfig("version")+"_"+("4"==MQ.mapConfig.getConfig("configNumber")?"OSM":"MQ"),k="?transaction=log&t="+b+"&c="+c+"&c2="+d+"&s="+e+"&lat="+a.lat+"&lng="+a.lng+"&key="+this.options.key+"&width="+f.x+"&height="+f.y+"&rand="+Math.floor(99991*Math.random())+"&v="+
g+"&r=",h=new Image;h.onload=h.onerror=function(){delete h};MQ.mapConfig.ready(function(){h.src=MQ.mapConfig.getConfig("logServer")+k})},_resetStats:function(a){var b=this._getFlags(),c=this._map.mapquest;a?(c.mapaccum1=0,c.sataccum1=0,c.hybaccum1=0,c.mapaccum2=0,c.sataccum2=0,c.hybaccum2=0):(b.map&&(c.mapaccum1+=1,c.mapaccum2+=1),b.sat&&(c.sataccum1+=1,c.sataccum2+=1),b.hyb&&(c.hybaccum1+=1,c.hybaccum2+=1));c.diffaccum=0;c.tileOffsetX=0;c.tileOffsetY=0},_getFlags:function(){var a={map:!1,sat:!1,
hyb:!1};if(this._map&&this._map.mapquest)for(var b=0;b<this._map.mapquest.layers.length;b++)a[this._map.mapquest.layers[b].options.mapType]=!0;return a},_resetTransactionPosition:function(){if(this._map&&this._map.mapquest){this._sendTransactions();var a=this._map.mapquest;a.tileOffsetX=0;a.tileOffsetY=0;a.lastTileCoords=null;a.lastScale=MQ.mapConfig.getScale(this._map.getZoom())}},_onViewReset:function(a){if(this._map){a=this._map.mapquest;var b=this._calculateTileCoords(),c,d,e,f,g=0;a.lastTileCoords&&
(c=a.lastTileCoords.nw.x-b.nw.x,d=this._positiveOrZero(b.se.x-a.lastTileCoords.se.x),e=b.nw.y-a.lastTileCoords.nw.y,f=this._positiveOrZero(a.lastTileCoords.se.y-b.se.y),a.tileOffsetX+=c,a.tileOffsetY+=e,c=this._positiveOrZero(c),e=this._positiveOrZero(e),g+=(c+d)*b.rowcount,g+=(e+f)*b.colcount,0<g&&(d=g/(9*b.rowcount*b.colcount),c=this._getFlags(this._map),c.map&&(a.mapaccum1+=d),c.sat&&(a.sataccum1+=d),c.hyb&&(a.hybaccum1+=d),(4<Math.abs(self.tileOffsetX)||4<Math.abs(self.tileOffsetY))&&this._sendTransactions()));
a._lastTileCoords=b}},_onMoveStart:function(a){this._map&&(a=this._map.mapquest)&&(a.moveStart=this._map.getPixelBounds().min)},_onMoveEnd:function(a){if(this._map&&(a=this._map.mapquest)&&a.moveStart&&a.moveStart){var b,c;startx=a.moveStart.x;b=a.moveStart.y;var d=this._map.getPixelBounds().min;c=Math.abs(d.x-startx);b=Math.abs(d.y-b);var d=this._map.getSize().x,e=this._map.getSize().y;a.diffaccum+=c*b+(d-c)*b+(e-b)*c;0.4<=a.diffaccum/(d*e)&&(c=this._getFlags(),c.map&&(a.mapaccum2+=1),c.sat&&(a.sataccum2+=
1),c.hyb&&(a.hybaccum2+=1),a.diffaccum=0);a.moveStart=null}},_calculateTileCoords:function(){var a=this.options.tileSize,b=this._map.getPixelBounds(),c=b.getSize();return{nw:new L.Point(Math.floor(b.min.x/a),Math.floor(b.min.y/a)),se:new L.Point(Math.floor(b.max.x/a),Math.floor(b.max.y/a)),colcount:Math.floor(c.x/a)+1,rowcount:Math.floor(c.y/a)+1}},_positiveOrZero:function(a){return 0>a?0:a}});MQ.tileLayer=function(a){null==a&&(a={});!a.key&&MQ.KEY&&(a.key=MQ.KEY);return new MQ.TileLayer(a)};
MQ.mapLayer=function(a){null==a&&(a={});!a.key&&MQ.KEY&&(a.key=MQ.KEY);a.mapType="map";return new MQ.TileLayer(a)};MQ.satelliteLayer=function(a){null==a&&(a={});!a.key&&MQ.KEY&&(a.key=MQ.KEY);a.mapType="sat";return new MQ.TileLayer(a)};MQ.hybridLayer=function(a){null==a&&(a={});!a.key&&MQ.KEY&&(a.key=MQ.KEY);a.mapType="sat";var b=new MQ.TileLayer(a),c={mapType:"hyb"};L.Util.setOptions(c,a);a=new MQ.TileLayer(c);return L.layerGroup([b,a])};MQ.Util=L.Class.extend({indexOf:function(a,b,c){if(!Array.prototype.indexOf){c=c||0;for(var d=a.length;c<d;c++)if(a[c]===b)return c;return-1}return a.indexOf(b)},escapable:/[\\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,gap:null,indent:null,meta:{"\b":"\\b","\t":"\\t","\n":"\\n","\f":"\\f","\r":"\\r",'"':'\\"',"\\":"\\\\"},quote:function(a){this.escapable.lastIndex=0;return this.escapable.test(a)?'"'+a.replace(this.escapable,
function(a){var c=this.meta[a];return"string"===typeof c?c:"\\u"+("0000"+a.charCodeAt(0).toString(16)).slice(-4)})+'"':'"'+a+'"'},str:function(a,b){var c,d,e=this.gap,f,g=b[a];switch(typeof g){case "string":return this.quote(g);case "number":return isFinite(g)?String(g):"null";case "boolean":case "null":return String(g);case "object":if(!g)return"null";this.gap+=this.indent;f=[];if("[object Array]"===Object.prototype.toString.apply(g)||"object"==typeof g&&"number"==typeof g.length&&(0===g.length||
"undefined"!=typeof g[0])){d=g.length;for(c=0;c<d;c+=1)f[c]=this.str(c,g)||"null";d=0===f.length?"[]":this.gap?"[\n"+this.gap+f.join(",\n"+this.gap)+"\n"+e+"]":"["+f.join(",")+"]";this.gap=e;return d}for(c in g)Object.hasOwnProperty.call(g,c)&&(d=this.str(c,g))&&f.push(this.quote(c)+(this.gap?": ":":")+d);d=0===f.length?"{}":this.gap?"{\n"+this.gap+f.join(",\n"+this.gap)+"\n"+e+"}":"{"+f.join(",")+"}";this.gap=e;return d}},stringifyJSON:function(a){return window.JSON&&window.JSON.stringify?window.JSON.stringify(a):
this.str("",{"":a})},toQueryString:function(a){var b=[],c={},d;for(d in a)c[d]||b.push(encodeURIComponent(d)+"="+encodeURIComponent(String(a[d])));return b.join("&")},xhr:function(){function a(a){try{return new ActiveXObject(a)}catch(b){}}if(window.XMLHttpRequest)return new window.XMLHttpRequest;if(window.ActiveXObject){var b=a("Msxml2.XMLHTTP.6.0")||a("Msxml2.XMLHTTP.3.0")||a("Msxml2.XMLHTTP")||a("Microsoft.XMLHTTP");if(b)return b}throw Error("Current browser configuration does not support XMLHttpRequest");
},parseJSON:function(a){try{return window.JSON&&window.JSON.parse?window.JSON.parse(a):MQA._jsEval("("+a+")")}catch(b){Log_handleError('Failed to parse JSON "'+a+'"',b)}},doXhr:function(a,b,c){b||(b={});var d=this.xhr(),e,f,g=b.verb||"GET",k="undefined"!=typeof b.async?b.async:!0;setup=b.setup;d.open(g,a,k);setup&&setup(d);"GET"==g&&L.Browser.ie&&d.setRequestHeader("If-Modified-Since","Thu, 1 Jan 1970 00:00:00 GMT");var h=function(){d.onreadystatechange=function(){};var a,b;try{a=d.status}catch(e){}b=
d;d=null;f&&clearTimeout(f);if(200<=a&&299>=a)c(b,!1);else{var g;try{g=b.responseText}catch(h){Log_debug(h.message)}c(b,{reason:"HTTP error",statusCode:a,responseText:g})}};d.onreadystatechange=function(){e||4==d.readyState&&h()};b.timeout&&(f=setTimeout(function(){e||(e=!0,d.onreadystatechange=function(){},d.abort(),c(d,{reason:"Request timed out"}),d=null)},b.timeout));b.formUrlEncoded&&(d.setRequestHeader("Content-type","application/x-www-form-urlencoded"),d.setRequestHeader("Content-length",b.postData.length),
d.setRequestHeader("Connection","close"));d.send(b.postData||null);!k&&("firefox"==MQA.browser.name&&d)&&h();return function(){d&&(Log_debug("Abort Http: "+a),e=!0,d.onreadystatechange=function(){},d.abort(),d=null,f&&clearTimeout(f))}},doGetJSON:function(a,b,c){return this.doXhr(a,b,function(a,b){if(b)c(!1,b);else{var f=MQ.util.parseJSON(a.responseText);f?c(f,null,a.responseText):c(!1,{reason:"Parse Error",responseText:a.responseText})}})},doPostJSON:function(a,b,c,d){c=L.Util.extend(c,{verb:"POST",
setup$After:function(a){a.setRequestHeader("Content-Type","application/json; charset=UTF-8")},postData:this.stringifyJSON(b)});return MQ.util.doGetJSON(a,c,d)},_jsonpCounter:0,_jsonpHead:null,doJSONP:function(a,b,c){(a||"").indexOf("?");b=b.callback||"callback";var d=b+"_json"+ ++this._jsonpCounter;a+="&"+b+"="+encodeURIComponent(d);window[d]=function(a){c(a);try{delete window[d]}catch(b){}window[d]=null};var e=document.createElement("script");e.src=a;e.type="text/javascript";e.async=!0;e.onerror=
function(b){c(!1,{url:a,event:b})};var f=!1;e.onload=e.onreadystatechange=function(){f||this.readyState&&"loaded"!==this.readyState&&"complete"!==this.readyState||(f=!0,e.onload=e.onreadystatechange=null,e&&e.parentNode&&e.parentNode.removeChild(e))};this._jsonpHead||(this._jsonpHead=document.getElementsByTagName("head")[0]);this._jsonpHead.appendChild(e)},doJSONV:function(a,b,c){b=document.createElement("script");b.src=a;b.type="text/javascript";"msie"==MQA.browser.name?b.onreadystatechange=function(){c()}:
b.onload=function(){c()};document.body.appendChild(b);return function(){}},__IOCacheBustValue:0,cacheBust:function(){return(new Date).getTime()+","+ ++this.__IOCacheBustValue},loadCSS:function(a){var b=document.createElement("style"),c=document.getElementsByTagName("head")[0];if(c){if(!L.Browser.ie||window.XDomainRequest&&window.msPerformance)try{b.appendChild(document.createTextNode(a))}catch(d){b.setAttribute("type","text/css"),b.styleSheet&&(b.styleSheet.cssText=a)}else b.setAttribute("type","text/css"),
b.styleSheet&&(b.styleSheet.cssText=a);c.firstChild?c.insertBefore(b,c.firstChild):c.appendChild(b)}}});MQ.util=new MQ.Util;MQ.MapConfig=L.Class.extend({includes:L.Mixin.Events,_hasLoaded:0,sslMode:!1,_config:{smallMap:400,version:"1.0",imagePath:"http://content.mqcdn.com/winston-354/cdn/toolkit/lite/images/",sslImagePath:"https://api-s.mqcdn.com/winston-354/cdn/toolkit/lite/images/",trafficImagePath:"mqtraffic/",iconPath:"icons.mqcdn.com/icons/"},initialize:function(a){L.setOptions(this,a);(this.sslMode="https:"==document.location.protocol)?(this._config.iconPath="https://"+this._config.iconPath,this._config.imagePath=
this._config.sslImagePath):this._config.iconPath="http://"+this._config.iconPath},load:function(){this._hasLoaded=1;this._parseHardCoded()},ready:function(a){2==this._hasLoaded?a.call(null,this):(this.on("load",a),this._hasLoaded||this.load())},_parseHardCoded:function(){this._config.version=MQPLUGINVERSION;this._config.configNumber=MQCONFIGNUMBER;this._config.logServer=MQTILELOGGER.split("?")[0];this._config.copyrightServer=MQCOPYRIGHT.split("?")[0];this._config.geocodeAPI=MQGECOODE+"v1/";this._config.trafficAPI=
MQTRAFFIC+"v2/";this._config.directionsAPI=MQDIRECTIONS+"v2/";this._config.cdn=MQCDN;this._config.trafficImagePath=this._config.cdn+this._config.trafficImagePath;MQIMAGEPATH&&(this._config.imagePath=MQIMAGEPATH);this._config.map={url:this._leafletURL(MQTILEMAP),ext:MQTILEMAPEXT,subdomains:this._leafletSubdomains()};this._config.hyb={url:this._leafletURL(MQTILEHYB),ext:MQTILEHYBEXT,subdomains:this._leafletSubdomains()};this._config.sat={url:this._leafletURL(MQTILESAT),ext:MQTILESATEXT,subdomains:this._leafletSubdomains()};
this._hasLoaded=2;this.fire("load",this)},_leafletURL:function(a){a&&(a=a.replace(/\{\$/g,"{"),a=a.replace("{hostrange}","{s}"));return a},_leafletSubdomains:function(){for(var a=[],b=MQTILELO;b<=MQTILEHI;b++)a.push(b);return a},getConfig:function(a){return this._config[a]},setConfig:function(a,b){this._config[a]=b},setAPIKey:function(a){a.key?this.setConfig("key",a.key):a.key=this.getConfig("key")},getScale:function(a){if(null==this._resolutions){var b=156543.0339;for(this._resolutions=[];0.1<b;)this._resolutions.push(b),
b*=0.5}return Math.floor(2834.6456664*this._resolutions[a])}});MQ.mapConfig=new MQ.MapConfig;MQ.util.loadCSS(".mq-attribution-control{font-family:sans-serif;font-size:9px;white-space:nowrap;margin-bottom: 2px !important;} .mq-attribution-control-light{color:white;font-weight:bold;} .mq-attribution-control-dark{color:black;font-weight:bold;} .mq-attribution-control .mqacopyswitch{display:none;} .mq-attribution-control-light .mqacopyswitchlight{display:inline;} .mq-attribution-control-dark .mqacopyswitchdark{display:inline;}");
MQ.Control.Attribution=L.Control.extend({map:null,_currentMapType:"map",_currentZoom:0,_currentBounds:null,_lastQuery:null,_entityMap:{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;","/":"&#x2F;"},options:{position:"bottomright"},initialize:function(a){L.setOptions(this,a)},onAdd:function(a){this.map=a;this._container=L.DomUtil.create("div","mq-attribution-control");this.list=[];this.invalidateAttribution();a.on("zoomend",this.invalidateCoverage,this);a.on("moveend",this.invalidateCoverage,
this);this._updateAttributionStyle();return this._container},onRemove:function(a){a.off("zoomend",this.invalidateCoverage,this);a.off("moveend",this.invalidateCoverage,this)},escapeHtml:function(a){return String(a).replace(/[&<>"'\/]/g,function(a){return _entityMap[a]})},replaceHtml:function(a){var b=MQ.mapConfig.getConfig("imagePath");return a.replace(/\%TK\%/g,b)},getPreamble:function(){return"&nbsp;&nbsp;-&nbsp;&nbsp;Portions&nbsp;&copy;"+(new Date).getFullYear()+"&nbsp;"},set:function(a,b){var c,
d=this.list,e;if(b)d.push([a,b]),this.invalidateAttribution();else for(c=0;c<d.length;c++)if((e=d[c])&&e[0]==a){d[c]=null;this.invalidateAttribution();break}},invalidateAttribution:function(){if(!this._refreshAttributionKey){var a=this;this._refreshAttributionKey=setTimeout(function(){a.refreshAttribution()},0)}},refreshAttribution:function(){this._refreshAttributionKey=null;var a,b=[],c;a=this.list;var d,e=["&copy;"+(new Date).getFullYear()+"&nbsp;MapQuest"],f={},g=window.location.hostname.match(/.ca$/)?
"http://info.mapquest.com/mapquest-terms-of-use-ca-en/":"http://www.mapquest.com/terms-of-use";for(c=0;c<a.length;c++)(d=a[c])&&b.push(d);b.sort(COPYRIGHT_SORT);this.list=b;for(c=0;c<b.length;c++)a=b[c][0],d=b[c][1],void 0==d||(""==d.text&&""==d.html||0!=c)||e.push(this.getPreamble()),d&&!f[a]&&(f[a]=!0,0<c&&e.push(",&nbsp;"),d.html?e.push(this.replaceHtml(d.html)):d.text&&e.push(this.escapeHtml(d.text)));termsHTML='<a id="terms" class="termsLink" target="_blank" href="'+g+'">Terms</a>';this.map&&
this.map.getSize().x>MQ.mapConfig.getConfig("smallMap")?e.push(" | "+termsHTML):e=[termsHTML];b=e.join("");b!=this._curHtml&&(this._curHtml=this._container.innerHTML=b)},_updateAttributionStyle:function(){"hyb"==this._currentMapType||"sat"==this._currentMapType?(L.DomUtil.removeClass(this._container,"mq-attribution-control-dark"),L.DomUtil.addClass(this._container,"mq-attribution-control-light")):(L.DomUtil.removeClass(this._container,"mq-attribution-control-light"),L.DomUtil.addClass(this._container,
"mq-attribution-control-dark"))},mapTypeChanged:function(){this.map.mapquest&&this.map.mapquest.baseLayer&&(this._currentMapType=this.map.mapquest.baseLayer.options.mapType);this.invalidateCoverage();this._updateAttributionStyle()},invalidateCoverage:function(){null!=this._refreshCoverageKey&&window.clearTimeout(this._refreshCoverageKey);var a=this;this._refreshCoverageKey=setTimeout(function(){a.refreshCoverage()},0)},refreshCoverage:function(){this._refreshCoverageKey=null;this._currentBounds=this.map.getBounds();
this._currentZoom=this.map.getZoom();this.map.mapquest&&this.map.mapquest.baseLayer&&(this._currentMapType=this.map.mapquest.baseLayer.options.mapType);var a="format=json&loc="+this._getTrimmedBounds()+"&zoom="+this._currentZoom+"&projection=sm&cat="+this._currentMapType;if(this._lastQuery!=a){this._lastQuery=a;var b=this;MQ.mapConfig.ready(function(){MQ.util.doJSONP(MQ.mapConfig.getConfig("copyrightServer")+"?"+a,{callback:"jsonp"},L.Util.bind(b._handleCoverageData,b))})}},_getTrimmedBounds:function(){if(this._currentBounds){var a=
this._currentBounds.getNorthEast(),b=this._currentBounds.getSouthWest();0<b.lng&&0>a.lng&&(0<b.lng+a.lng?b.lng-=360:a.lng+=360);return b.lng.toFixed(2)+","+b.lat.toFixed(2)+","+a.lng.toFixed(2)+","+a.lat.toFixed(2)}return""},_handleCoverageData:function(a){if(a&&a[this._currentMapType]){a=a[this._currentMapType];this.list=[];for(var b=0;b<a.length;b++)if(!a[b].opt)for(var c=0;c<a[b].copyrights.length;c++)this.set(a[b].copyrights[c].id,a[b].copyrights[c])}}});var GROUP_SORT={"":1,"Map Data":2,Imagery:3};
function COPYRIGHT_SORT(a,b){var c=a[1],d=b[1],e=c.group,f=d.group,c=String(c.html||c.text||""),d=String(d.html||d.text||""),e=String(GROUP_SORT[e]||e),f=String(GROUP_SORT[f]||f);return e==f?c==d?0:c<d?-1:1:e<f?-1:1}MQ.control.attribution=function(a){return new MQ.Control.Attribution(a)};MQ.util.loadCSS(".mq-logo-control{margin-left: 2px !important;margin-bottom: 2px !important;}.mq-logo-control img{ position: relative; top:4px;}");MQ.Control.Logo=L.Control.extend({options:{position:"bottomleft"},initialize:function(a){L.setOptions(this,a)},onAdd:function(a){this._container=L.DomUtil.create("div","mq-logo-control");L.DomEvent.disableClickPropagation(this._container);this._container.innerHTML='<img src="'+MQ.mapConfig.getConfig("imagePath")+'questy.png" width="82" height="19"/>';return this._container}});
MQ.control.logo=function(a){return new MQ.Control.Logo(a)};

MQ.KEY=Key=mapquest_key;

MQPLUGINVERSION='1.0';
MQCONFIGNUMBER=1;
MQTILELOGGER="http://coverage.win.mqcdn.com/logger/v1/transaction?transaction=log&t={$type}&c={$cost1}&c2={$cost2}&s={$scale}&lat={$lat}&lng={$lng}&key={$key}&rand={$rand}";
MQCDN="http://api.mqcdn.com/";
MQDIRECTIONS="http://www.mapquestapi.com/directions/";
MQTRAFFIC="http://www.mapquestapi.com/traffic/";
MQGECOODE="http://www.mapquestapi.com/geocoding/";
MQCOPYRIGHT="http://coverage.win.mqcdn.com/coverage?projection=sm&format={$format}&loc={$lon1},{$lat1},{$lon2},{lat2}&zoom={$zoom}&cat={$category}";
MQTILEMAP="http://mtile0{$hostrange}.mqcdn.com/tiles/1.0.0/vy/map/{$z}/{$x}/{$y}.{$ext}";
MQTILEMAPEXT="jpg";
MQTILEHYB="http://mtile0{$hostrange}.mqcdn.com/tiles/1.0.0/vy/hyb/{$z}/{$x}/{$y}.{$ext}";
MQTILEHYBEXT="png";
MQTILESAT="http://mtile0{$hostrange}.mqcdn.com/tiles/1.0.0/vy/sat/{$z}/{$x}/{$y}.{$ext}";
MQTILESATEXT="jpg";
MQTILEHI=4;
MQTILELO=1;
MQICONS='http://icons.mqcdn.com/';
MQIMAGEPATH='http://content.mqcdn.com/winston-354/cdn/toolkit/lite/images/';
