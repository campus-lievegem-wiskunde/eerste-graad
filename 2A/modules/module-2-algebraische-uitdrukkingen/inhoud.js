/*! jQuery v1.12.4 | (c) jQuery Foundation | jquery.org/license */
/*! jQuery v1.12.4 | (c) jQuery Foundation | jquery.org/license */
!function(a,b){"object"==typeof module&&"object"==typeof module.exports?module.exports=a.document?b(a,!0):function(a){if(!a.document)throw new Error("jQuery requires a window with a document");return b(a)}:b(a)}("undefined"!=typeof window?window:this,function(a,b){var c=[],d=a.document,e=c.slice,f=c.concat,g=c.push,h=c.indexOf,i={},j=i.toString,k=i.hasOwnProperty,l={},m="1.12.4",n=function(a,b){return new n.fn.init(a,b)},o=/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g,p=/^-ms-/,q=/-([\da-z])/gi,r=function(a,b){return b.toUpperCase()};n.fn=n.prototype={jquery:m,constructor:n,selector:"",length:0,toArray:function(){return e.call(this)},get:function(a){return null!=a?0>a?this[a+this.length]:this[a]:e.call(this)},pushStack:function(a){var b=n.merge(this.constructor(),a);return b.prevObject=this,b.context=this.context,b},each:function(a){return n.each(this,a)},map:function(a){return this.pushStack(n.map(this,function(b,c){return a.call(b,c,b)}))},slice:function(){return this.pushStack(e.apply(this,arguments))},first:function(){return this.eq(0)},last:function(){return this.eq(-1)},eq:function(a){var b=this.length,c=+a+(0>a?b:0);return this.pushStack(c>=0&&b>c?[this[c]]:[])},end:function(){return this.prevObject||this.constructor()},push:g,sort:c.sort,splice:c.splice},n.extend=n.fn.extend=function(){var a,b,c,d,e,f,g=arguments[0]||{},h=1,i=arguments.length,j=!1;for("boolean"==typeof g&&(j=g,g=arguments[h]||{},h++),"object"==typeof g||n.isFunction(g)||(g={}),h===i&&(g=this,h--);i>h;h++)if(null!=(e=arguments[h]))for(d in e)a=g[d],c=e[d],g!==c&&(j&&c&&(n.isPlainObject(c)||(b=n.isArray(c)))?(b?(b=!1,f=a&&n.isArray(a)?a:[]):f=a&&n.isPlainObject(a)?a:{},g[d]=n.extend(j,f,c)):void 0!==c&&(g[d]=c));return g},n.extend({expando:"jQuery"+(m+Math.random()).replace(/\D/g,""),isReady:!0,error:function(a){throw new Error(a)},noop:function(){},isFunction:function(a){return"function"===n.type(a)},isArray:Array.isArray||function(a){return"array"===n.type(a)},isWindow:function(a){return null!=a&&a==a.window},isNumeric:function(a){var b=a&&a.toString();return!n.isArray(a)&&b-parseFloat(b)+1>=0},isEmptyObject:function(a){var b;for(b in a)return!1;return!0},isPlainObject:function(a){var b;if(!a||"object"!==n.type(a)||a.nodeType||n.isWindow(a))return!1;try{if(a.constructor&&!k.call(a,"constructor")&&!k.call(a.constructor.prototype,"isPrototypeOf"))return!1}catch(c){return!1}if(!l.ownFirst)for(b in a)return k.call(a,b);for(b in a);return void 0===b||k.call(a,b)},type:function(a){return null==a?a+"":"object"==typeof a||"function"==typeof a?i[j.call(a)]||"object":typeof a},globalEval:function(b){b&&n.trim(b)&&(a.execScript||function(b){a.eval.call(a,b)})(b)},camelCase:function(a){return a.replace(p,"ms-").replace(q,r)},nodeName:function(a,b){return a.nodeName&&a.nodeName.toLowerCase()===b.toLowerCase()},each:function(a,b){var c,d=0;if(s(a)){for(c=a.length;c>d;d++)if(b.call(a[d],d,a[d])===!1)break}else for(d in a)if(b.call(a[d],d,a[d])===!1)break;return a},trim:function(a){return null==a?"":(a+"").replace(o,"")},makeArray:function(a,b){var c=b||[];return null!=a&&(s(Object(a))?n.merge(c,"string"==typeof a?[a]:a):g.call(c,a)),c},inArray:function(a,b,c){var d;if(b){if(h)return h.call(b,a,c);for(d=b.length,c=c?0>c?Math.max(0,d+c):c:0;d>c;c++)if(c in b&&b[c]===a)return c}return-1},merge:function(a,b){var c=+b.length,d=0,e=a.length;while(c>d)a[e++]=b[d++];if(c!==c)while(void 0!==b[d])a[e++]=b[d++];return a.length=e,a},grep:function(a,b,c){for(var d,e=[],f=0,g=a.length,h=!c;g>f;f++)d=!b(a[f],f),d!==h&&e.push(a[f]);return e},map:function(a,b,c){var d,e,g=0,h=[];if(s(a))for(d=a.length;d>g;g++)e=b(a[g],g,c),null!=e&&h.push(e);else for(g in a)e=b(a[g],g,c),null!=e&&h.push(e);return f.apply([],h)},guid:1,proxy:function(a,b){var c,d,f;return"string"==typeof b&&(f=a[b],b=a,a=f),n.isFunction(a)?(c=e.call(arguments,2),d=function(){return a.apply(b||this,c.concat(e.call(arguments)))},d.guid=a.guid=a.guid||n.guid++,d):void 0},now:function(){return+new Date},support:l}),"function"==typeof Symbol&&(n.fn[Symbol.iterator]=c[Symbol.iterator]),n.each("Boolean Number String Function Array Date RegExp Object Error Symbol".split(" "),function(a,b){i["[object "+b+"]"]=b.toLowerCase()});function s(a){var b=!!a&&"length"in a&&a.length,c=n.type(a);return"function"===c||n.isWindow(a)?!1:"array"===c||0===b||"number"==typeof b&&b>0&&b-1 in a}var t=function(a){var b,c,d,e,f,g,h,i,j,k,l,m,n,o,p,q,r,s,t,u="sizzle"+1*new Date,v=a.document,w=0,x=0,y=ga(),z=ga(),A=ga(),B=function(a,b){return a===b&&(l=!0),0},C=1<<31,D={}.hasOwnProperty,E=[],F=E.pop,G=E.push,H=E.push,I=E.slice,J=function(a,b){for(var c=0,d=a.length;d>c;c++)if(a[c]===b)return c;return-1},K="checked|selected|async|autofocus|autoplay|controls|defer|disabled|hidden|ismap|loop|multiple|open|readonly|required|scoped",L="[\\x20\\t\\r\\n\\f]",M="(?:\\\\.|[\\w-]|[^\\x00-\\xa0])+",N="\\["+L+"*("+M+")(?:"+L+"*([*^$|!~]?=)"+L+"*(?:'((?:\\\\.|[^\\\\'])*)'|\"((?:\\\\.|[^\\\\\"])*)\"|("+M+"))|)"+L+"*\\]",O=":("+M+")(?:\\((('((?:\\\\.|[^\\\\'])*)'|\"((?:\\\\.|[^\\\\\"])*)\")|((?:\\\\.|[^\\\\()[\\]]|"+N+")*)|.*)\\)|)",P=new RegExp(L+"+","g"),Q=new RegExp("^"+L+"+|((?:^|[^\\\\])(?:\\\\.)*)"+L+"+$","g"),R=new RegExp("^"+L+"*,"+L+"*"),S=new RegExp("^"+L+"*([>+~]|"+L+")"+L+"*"),T=new RegExp("="+L+"*([^\\]'\"]*?)"+L+"*\\]","g"),U=new RegExp(O),V=new RegExp("^"+M+"$"),W={ID:new RegExp("^#("+M+")"),CLASS:new RegExp("^\\.("+M+")"),TAG:new RegExp("^("+M+"|[*])"),ATTR:new RegExp("^"+N),PSEUDO:new RegExp("^"+O),CHILD:new RegExp("^:(only|first|last|nth|nth-last)-(child|of-type)(?:\\("+L+"*(even|odd|(([+-]|)(\\d*)n|)"+L+"*(?:([+-]|)"+L+"*(\\d+)|))"+L+"*\\)|)","i"),bool:new RegExp("^(?:"+K+")$","i"),needsContext:new RegExp("^"+L+"*[>+~]|:(even|odd|eq|gt|lt|nth|first|last)(?:\\("+L+"*((?:-\\d)?\\d*)"+L+"*\\)|)(?=[^-]|$)","i")},X=/^(?:input|select|textarea|button)$/i,Y=/^h\d$/i,Z=/^[^{]+\{\s*\[native \w/,$=/^(?:#([\w-]+)|(\w+)|\.([\w-]+))$/,_=/[+~]/,aa=/'|\\/g,ba=new RegExp("\\\\([\\da-f]{1,6}"+L+"?|("+L+")|.)","ig"),ca=function(a,b,c){var d="0x"+b-65536;return d!==d||c?b:0>d?String.fromCharCode(d+65536):String.fromCharCode(d>>10|55296,1023&d|56320)},da=function(){m()};try{H.apply(E=I.call(v.childNodes),v.childNodes),E[v.childNodes.length].nodeType}catch(ea){H={apply:E.length?function(a,b){G.apply(a,I.call(b))}:function(a,b){var c=a.length,d=0;while(a[c++]=b[d++]);a.length=c-1}}}function fa(a,b,d,e){var f,h,j,k,l,o,r,s,w=b&&b.ownerDocument,x=b?b.nodeType:9;if(d=d||[],"string"!=typeof a||!a||1!==x&&9!==x&&11!==x)return d;if(!e&&((b?b.ownerDocument||b:v)!==n&&m(b),b=b||n,p)){if(11!==x&&(o=$.exec(a)))if(f=o[1]){if(9===x){if(!(j=b.getElementById(f)))return d;if(j.id===f)return d.push(j),d}else if(w&&(j=w.getElementById(f))&&t(b,j)&&j.id===f)return d.push(j),d}else{if(o[2])return H.apply(d,b.getElementsByTagName(a)),d;if((f=o[3])&&c.getElementsByClassName&&b.getElementsByClassName)return H.apply(d,b.getElementsByClassName(f)),d}if(c.qsa&&!A[a+" "]&&(!q||!q.test(a))){if(1!==x)w=b,s=a;else if("object"!==b.nodeName.toLowerCase()){(k=b.getAttribute("id"))?k=k.replace(aa,"\\$&"):b.setAttribute("id",k=u),r=g(a),h=r.length,l=V.test(k)?"#"+k:"[id='"+k+"']";while(h--)r[h]=l+" "+qa(r[h]);s=r.join(","),w=_.test(a)&&oa(b.parentNode)||b}if(s)try{return H.apply(d,w.querySelectorAll(s)),d}catch(y){}finally{k===u&&b.removeAttribute("id")}}}return i(a.replace(Q,"$1"),b,d,e)}function ga(){var a=[];function b(c,e){return a.push(c+" ")>d.cacheLength&&delete b[a.shift()],b[c+" "]=e}return b}function ha(a){return a[u]=!0,a}function ia(a){var b=n.createElement("div");try{return!!a(b)}catch(c){return!1}finally{b.parentNode&&b.parentNode.removeChild(b),b=null}}function ja(a,b){var c=a.split("|"),e=c.length;while(e--)d.attrHandle[c[e]]=b}function ka(a,b){var c=b&&a,d=c&&1===a.nodeType&&1===b.nodeType&&(~b.sourceIndex||C)-(~a.sourceIndex||C);if(d)return d;if(c)while(c=c.nextSibling)if(c===b)return-1;return a?1:-1}function la(a){return function(b){var c=b.nodeName.toLowerCase();return"input"===c&&b.type===a}}function ma(a){return function(b){var c=b.nodeName.toLowerCase();return("input"===c||"button"===c)&&b.type===a}}function na(a){return ha(function(b){return b=+b,ha(function(c,d){var e,f=a([],c.length,b),g=f.length;while(g--)c[e=f[g]]&&(c[e]=!(d[e]=c[e]))})})}function oa(a){return a&&"undefined"!=typeof a.getElementsByTagName&&a}c=fa.support={},f=fa.isXML=function(a){var b=a&&(a.ownerDocument||a).documentElement;return b?"HTML"!==b.nodeName:!1},m=fa.setDocument=function(a){var b,e,g=a?a.ownerDocument||a:v;return g!==n&&9===g.nodeType&&g.documentElement?(n=g,o=n.documentElement,p=!f(n),(e=n.defaultView)&&e.top!==e&&(e.addEventListener?e.addEventListener("unload",da,!1):e.attachEvent&&e.attachEvent("onunload",da)),c.attributes=ia(function(a){return a.className="i",!a.getAttribute("className")}),c.getElementsByTagName=ia(function(a){return a.appendChild(n.createComment("")),!a.getElementsByTagName("*").length}),c.getElementsByClassName=Z.test(n.getElementsByClassName),c.getById=ia(function(a){return o.appendChild(a).id=u,!n.getElementsByName||!n.getElementsByName(u).length}),c.getById?(d.find.ID=function(a,b){if("undefined"!=typeof b.getElementById&&p){var c=b.getElementById(a);return c?[c]:[]}},d.filter.ID=function(a){var b=a.replace(ba,ca);return function(a){return a.getAttribute("id")===b}}):(delete d.find.ID,d.filter.ID=function(a){var b=a.replace(ba,ca);return function(a){var c="undefined"!=typeof a.getAttributeNode&&a.getAttributeNode("id");return c&&c.value===b}}),d.find.TAG=c.getElementsByTagName?function(a,b){return"undefined"!=typeof b.getElementsByTagName?b.getElementsByTagName(a):c.qsa?b.querySelectorAll(a):void 0}:function(a,b){var c,d=[],e=0,f=b.getElementsByTagName(a);if("*"===a){while(c=f[e++])1===c.nodeType&&d.push(c);return d}return f},d.find.CLASS=c.getElementsByClassName&&function(a,b){return"undefined"!=typeof b.getElementsByClassName&&p?b.getElementsByClassName(a):void 0},r=[],q=[],(c.qsa=Z.test(n.querySelectorAll))&&(ia(function(a){o.appendChild(a).innerHTML="<a id='"+u+"'></a><select id='"+u+"-\r\\' msallowcapture=''><option selected=''></option></select>",a.querySelectorAll("[msallowcapture^='']").length&&q.push("[*^$]="+L+"*(?:''|\"\")"),a.querySelectorAll("[selected]").length||q.push("\\["+L+"*(?:value|"+K+")"),a.querySelectorAll("[id~="+u+"-]").length||q.push("~="),a.querySelectorAll(":checked").length||q.push(":checked"),a.querySelectorAll("a#"+u+"+*").length||q.push(".#.+[+~]")}),ia(function(a){var b=n.createElement("input");b.setAttribute("type","hidden"),a.appendChild(b).setAttribute("name","D"),a.querySelectorAll("[name=d]").length&&q.push("name"+L+"*[*^$|!~]?="),a.querySelectorAll(":enabled").length||q.push(":enabled",":disabled"),a.querySelectorAll("*,:x"),q.push(",.*:")})),(c.matchesSelector=Z.test(s=o.matches||o.webkitMatchesSelector||o.mozMatchesSelector||o.oMatchesSelector||o.msMatchesSelector))&&ia(function(a){c.disconnectedMatch=s.call(a,"div"),s.call(a,"[s!='']:x"),r.push("!=",O)}),q=q.length&&new RegExp(q.join("|")),r=r.length&&new RegExp(r.join("|")),b=Z.test(o.compareDocumentPosition),t=b||Z.test(o.contains)?function(a,b){var c=9===a.nodeType?a.documentElement:a,d=b&&b.parentNode;return a===d||!(!d||1!==d.nodeType||!(c.contains?c.contains(d):a.compareDocumentPosition&&16&a.compareDocumentPosition(d)))}:function(a,b){if(b)while(b=b.parentNode)if(b===a)return!0;return!1},B=b?function(a,b){if(a===b)return l=!0,0;var d=!a.compareDocumentPosition-!b.compareDocumentPosition;return d?d:(d=(a.ownerDocument||a)===(b.ownerDocument||b)?a.compareDocumentPosition(b):1,1&d||!c.sortDetached&&b.compareDocumentPosition(a)===d?a===n||a.ownerDocument===v&&t(v,a)?-1:b===n||b.ownerDocument===v&&t(v,b)?1:k?J(k,a)-J(k,b):0:4&d?-1:1)}:function(a,b){if(a===b)return l=!0,0;var c,d=0,e=a.parentNode,f=b.parentNode,g=[a],h=[b];if(!e||!f)return a===n?-1:b===n?1:e?-1:f?1:k?J(k,a)-J(k,b):0;if(e===f)return ka(a,b);c=a;while(c=c.parentNode)g.unshift(c);c=b;while(c=c.parentNode)h.unshift(c);while(g[d]===h[d])d++;return d?ka(g[d],h[d]):g[d]===v?-1:h[d]===v?1:0},n):n},fa.matches=function(a,b){return fa(a,null,null,b)},fa.matchesSelector=function(a,b){if((a.ownerDocument||a)!==n&&m(a),b=b.replace(T,"='$1']"),c.matchesSelector&&p&&!A[b+" "]&&(!r||!r.test(b))&&(!q||!q.test(b)))try{var d=s.call(a,b);if(d||c.disconnectedMatch||a.document&&11!==a.document.nodeType)return d}catch(e){}return fa(b,n,null,[a]).length>0},fa.contains=function(a,b){return(a.ownerDocument||a)!==n&&m(a),t(a,b)},fa.attr=function(a,b){(a.ownerDocument||a)!==n&&m(a);var e=d.attrHandle[b.toLowerCase()],f=e&&D.call(d.attrHandle,b.toLowerCase())?e(a,b,!p):void 0;return void 0!==f?f:c.attributes||!p?a.getAttribute(b):(f=a.getAttributeNode(b))&&f.specified?f.value:null},fa.error=function(a){throw new Error("Syntax error, unrecognized expression: "+a)},fa.uniqueSort=function(a){var b,d=[],e=0,f=0;if(l=!c.detectDuplicates,k=!c.sortStable&&a.slice(0),a.sort(B),l){while(b=a[f++])b===a[f]&&(e=d.push(f));while(e--)a.splice(d[e],1)}return k=null,a},e=fa.getText=function(a){var b,c="",d=0,f=a.nodeType;if(f){if(1===f||9===f||11===f){if("string"==typeof a.textContent)return a.textContent;for(a=a.firstChild;a;a=a.nextSibling)c+=e(a)}else if(3===f||4===f)return a.nodeValue}else while(b=a[d++])c+=e(b);return c},d=fa.selectors={cacheLength:50,createPseudo:ha,match:W,attrHandle:{},find:{},relative:{">":{dir:"parentNode",first:!0}," ":{dir:"parentNode"},"+":{dir:"previousSibling",first:!0},"~":{dir:"previousSibling"}},preFilter:{ATTR:function(a){return a[1]=a[1].replace(ba,ca),a[3]=(a[3]||a[4]||a[5]||"").replace(ba,ca),"~="===a[2]&&(a[3]=" "+a[3]+" "),a.slice(0,4)},CHILD:function(a){return a[1]=a[1].toLowerCase(),"nth"===a[1].slice(0,3)?(a[3]||fa.error(a[0]),a[4]=+(a[4]?a[5]+(a[6]||1):2*("even"===a[3]||"odd"===a[3])),a[5]=+(a[7]+a[8]||"odd"===a[3])):a[3]&&fa.error(a[0]),a},PSEUDO:function(a){var b,c=!a[6]&&a[2];return W.CHILD.test(a[0])?null:(a[3]?a[2]=a[4]||a[5]||"":c&&U.test(c)&&(b=g(c,!0))&&(b=c.indexOf(")",c.length-b)-c.length)&&(a[0]=a[0].slice(0,b),a[2]=c.slice(0,b)),a.slice(0,3))}},filter:{TAG:function(a){var b=a.replace(ba,ca).toLowerCase();return"*"===a?function(){return!0}:function(a){return a.nodeName&&a.nodeName.toLowerCase()===b}},CLASS:function(a){var b=y[a+" "];return b||(b=new RegExp("(^|"+L+")"+a+"("+L+"|$)"))&&y(a,function(a){return b.test("string"==typeof a.className&&a.className||"undefined"!=typeof a.getAttribute&&a.getAttribute("class")||"")})},ATTR:function(a,b,c){return function(d){var e=fa.attr(d,a);return null==e?"!="===b:b?(e+="","="===b?e===c:"!="===b?e!==c:"^="===b?c&&0===e.indexOf(c):"*="===b?c&&e.indexOf(c)>-1:"$="===b?c&&e.slice(-c.length)===c:"~="===b?(" "+e.replace(P," ")+" ").indexOf(c)>-1:"|="===b?e===c||e.slice(0,c.length+1)===c+"-":!1):!0}},CHILD:function(a,b,c,d,e){var f="nth"!==a.slice(0,3),g="last"!==a.slice(-4),h="of-type"===b;return 1===d&&0===e?function(a){return!!a.parentNode}:function(b,c,i){var j,k,l,m,n,o,p=f!==g?"nextSibling":"previousSibling",q=b.parentNode,r=h&&b.nodeName.toLowerCase(),s=!i&&!h,t=!1;if(q){if(f){while(p){m=b;while(m=m[p])if(h?m.nodeName.toLowerCase()===r:1===m.nodeType)return!1;o=p="only"===a&&!o&&"nextSibling"}return!0}if(o=[g?q.firstChild:q.lastChild],g&&s){m=q,l=m[u]||(m[u]={}),k=l[m.uniqueID]||(l[m.uniqueID]={}),j=k[a]||[],n=j[0]===w&&j[1],t=n&&j[2],m=n&&q.childNodes[n];while(m=++n&&m&&m[p]||(t=n=0)||o.pop())if(1===m.nodeType&&++t&&m===b){k[a]=[w,n,t];break}}else if(s&&(m=b,l=m[u]||(m[u]={}),k=l[m.uniqueID]||(l[m.uniqueID]={}),j=k[a]||[],n=j[0]===w&&j[1],t=n),t===!1)while(m=++n&&m&&m[p]||(t=n=0)||o.pop())if((h?m.nodeName.toLowerCase()===r:1===m.nodeType)&&++t&&(s&&(l=m[u]||(m[u]={}),k=l[m.uniqueID]||(l[m.uniqueID]={}),k[a]=[w,t]),m===b))break;return t-=e,t===d||t%d===0&&t/d>=0}}},PSEUDO:function(a,b){var c,e=d.pseudos[a]||d.setFilters[a.toLowerCase()]||fa.error("unsupported pseudo: "+a);return e[u]?e(b):e.length>1?(c=[a,a,"",b],d.setFilters.hasOwnProperty(a.toLowerCase())?ha(function(a,c){var d,f=e(a,b),g=f.length;while(g--)d=J(a,f[g]),a[d]=!(c[d]=f[g])}):function(a){return e(a,0,c)}):e}},pseudos:{not:ha(function(a){var b=[],c=[],d=h(a.replace(Q,"$1"));return d[u]?ha(function(a,b,c,e){var f,g=d(a,null,e,[]),h=a.length;while(h--)(f=g[h])&&(a[h]=!(b[h]=f))}):function(a,e,f){return b[0]=a,d(b,null,f,c),b[0]=null,!c.pop()}}),has:ha(function(a){return function(b){return fa(a,b).length>0}}),contains:ha(function(a){return a=a.replace(ba,ca),function(b){return(b.textContent||b.innerText||e(b)).indexOf(a)>-1}}),lang:ha(function(a){return V.test(a||"")||fa.error("unsupported lang: "+a),a=a.replace(ba,ca).toLowerCase(),function(b){var c;do if(c=p?b.lang:b.getAttribute("xml:lang")||b.getAttribute("lang"))return c=c.toLowerCase(),c===a||0===c.indexOf(a+"-");while((b=b.parentNode)&&1===b.nodeType);return!1}}),target:function(b){var c=a.location&&a.location.hash;return c&&c.slice(1)===b.id},root:function(a){return a===o},focus:function(a){return a===n.activeElement&&(!n.hasFocus||n.hasFocus())&&!!(a.type||a.href||~a.tabIndex)},enabled:function(a){return a.disabled===!1},disabled:function(a){return a.disabled===!0},checked:function(a){var b=a.nodeName.toLowerCase();return"input"===b&&!!a.checked||"option"===b&&!!a.selected},selected:function(a){return a.parentNode&&a.parentNode.selectedIndex,a.selected===!0},empty:function(a){for(a=a.firstChild;a;a=a.nextSibling)if(a.nodeType<6)return!1;return!0},parent:function(a){return!d.pseudos.empty(a)},header:function(a){return Y.test(a.nodeName)},input:function(a){return X.test(a.nodeName)},button:function(a){var b=a.nodeName.toLowerCase();return"input"===b&&"button"===a.type||"button"===b},text:function(a){var b;return"input"===a.nodeName.toLowerCase()&&"text"===a.type&&(null==(b=a.getAttribute("type"))||"text"===b.toLowerCase())},first:na(function(){return[0]}),last:na(function(a,b){return[b-1]}),eq:na(function(a,b,c){return[0>c?c+b:c]}),even:na(function(a,b){for(var c=0;b>c;c+=2)a.push(c);return a}),odd:na(function(a,b){for(var c=1;b>c;c+=2)a.push(c);return a}),lt:na(function(a,b,c){for(var d=0>c?c+b:c;--d>=0;)a.push(d);return a}),gt:na(function(a,b,c){for(var d=0>c?c+b:c;++d<b;)a.push(d);return a})}},d.pseudos.nth=d.pseudos.eq;for(b in{radio:!0,checkbox:!0,file:!0,password:!0,image:!0})d.pseudos[b]=la(b);for(b in{submit:!0,reset:!0})d.pseudos[b]=ma(b);function pa(){}pa.prototype=d.filters=d.pseudos,d.setFilters=new pa,g=fa.tokenize=function(a,b){var c,e,f,g,h,i,j,k=z[a+" "];if(k)return b?0:k.slice(0);h=a,i=[],j=d.preFilter;while(h){c&&!(e=R.exec(h))||(e&&(h=h.slice(e[0].length)||h),i.push(f=[])),c=!1,(e=S.exec(h))&&(c=e.shift(),f.push({value:c,type:e[0].replace(Q," ")}),h=h.slice(c.length));for(g in d.filter)!(e=W[g].exec(h))||j[g]&&!(e=j[g](e))||(c=e.shift(),f.push({value:c,type:g,matches:e}),h=h.slice(c.length));if(!c)break}return b?h.length:h?fa.error(a):z(a,i).slice(0)};function qa(a){for(var b=0,c=a.length,d="";c>b;b++)d+=a[b].value;return d}function ra(a,b,c){var d=b.dir,e=c&&"parentNode"===d,f=x++;return b.first?function(b,c,f){while(b=b[d])if(1===b.nodeType||e)return a(b,c,f)}:function(b,c,g){var h,i,j,k=[w,f];if(g){while(b=b[d])if((1===b.nodeType||e)&&a(b,c,g))return!0}else while(b=b[d])if(1===b.nodeType||e){if(j=b[u]||(b[u]={}),i=j[b.uniqueID]||(j[b.uniqueID]={}),(h=i[d])&&h[0]===w&&h[1]===f)return k[2]=h[2];if(i[d]=k,k[2]=a(b,c,g))return!0}}}function sa(a){return a.length>1?function(b,c,d){var e=a.length;while(e--)if(!a[e](b,c,d))return!1;return!0}:a[0]}function ta(a,b,c){for(var d=0,e=b.length;e>d;d++)fa(a,b[d],c);return c}function ua(a,b,c,d,e){for(var f,g=[],h=0,i=a.length,j=null!=b;i>h;h++)(f=a[h])&&(c&&!c(f,d,e)||(g.push(f),j&&b.push(h)));return g}function va(a,b,c,d,e,f){return d&&!d[u]&&(d=va(d)),e&&!e[u]&&(e=va(e,f)),ha(function(f,g,h,i){var j,k,l,m=[],n=[],o=g.length,p=f||ta(b||"*",h.nodeType?[h]:h,[]),q=!a||!f&&b?p:ua(p,m,a,h,i),r=c?e||(f?a:o||d)?[]:g:q;if(c&&c(q,r,h,i),d){j=ua(r,n),d(j,[],h,i),k=j.length;while(k--)(l=j[k])&&(r[n[k]]=!(q[n[k]]=l))}if(f){if(e||a){if(e){j=[],k=r.length;while(k--)(l=r[k])&&j.push(q[k]=l);e(null,r=[],j,i)}k=r.length;while(k--)(l=r[k])&&(j=e?J(f,l):m[k])>-1&&(f[j]=!(g[j]=l))}}else r=ua(r===g?r.splice(o,r.length):r),e?e(null,g,r,i):H.apply(g,r)})}function wa(a){for(var b,c,e,f=a.length,g=d.relative[a[0].type],h=g||d.relative[" "],i=g?1:0,k=ra(function(a){return a===b},h,!0),l=ra(function(a){return J(b,a)>-1},h,!0),m=[function(a,c,d){var e=!g&&(d||c!==j)||((b=c).nodeType?k(a,c,d):l(a,c,d));return b=null,e}];f>i;i++)if(c=d.relative[a[i].type])m=[ra(sa(m),c)];else{if(c=d.filter[a[i].type].apply(null,a[i].matches),c[u]){for(e=++i;f>e;e++)if(d.relative[a[e].type])break;return va(i>1&&sa(m),i>1&&qa(a.slice(0,i-1).concat({value:" "===a[i-2].type?"*":""})).replace(Q,"$1"),c,e>i&&wa(a.slice(i,e)),f>e&&wa(a=a.slice(e)),f>e&&qa(a))}m.push(c)}return sa(m)}function xa(a,b){var c=b.length>0,e=a.length>0,f=function(f,g,h,i,k){var l,o,q,r=0,s="0",t=f&&[],u=[],v=j,x=f||e&&d.find.TAG("*",k),y=w+=null==v?1:Math.random()||.1,z=x.length;for(k&&(j=g===n||g||k);s!==z&&null!=(l=x[s]);s++){if(e&&l){o=0,g||l.ownerDocument===n||(m(l),h=!p);while(q=a[o++])if(q(l,g||n,h)){i.push(l);break}k&&(w=y)}c&&((l=!q&&l)&&r--,f&&t.push(l))}if(r+=s,c&&s!==r){o=0;while(q=b[o++])q(t,u,g,h);if(f){if(r>0)while(s--)t[s]||u[s]||(u[s]=F.call(i));u=ua(u)}H.apply(i,u),k&&!f&&u.length>0&&r+b.length>1&&fa.uniqueSort(i)}return k&&(w=y,j=v),t};return c?ha(f):f}return h=fa.compile=function(a,b){var c,d=[],e=[],f=A[a+" "];if(!f){b||(b=g(a)),c=b.length;while(c--)f=wa(b[c]),f[u]?d.push(f):e.push(f);f=A(a,xa(e,d)),f.selector=a}return f},i=fa.select=function(a,b,e,f){var i,j,k,l,m,n="function"==typeof a&&a,o=!f&&g(a=n.selector||a);if(e=e||[],1===o.length){if(j=o[0]=o[0].slice(0),j.length>2&&"ID"===(k=j[0]).type&&c.getById&&9===b.nodeType&&p&&d.relative[j[1].type]){if(b=(d.find.ID(k.matches[0].replace(ba,ca),b)||[])[0],!b)return e;n&&(b=b.parentNode),a=a.slice(j.shift().value.length)}i=W.needsContext.test(a)?0:j.length;while(i--){if(k=j[i],d.relative[l=k.type])break;if((m=d.find[l])&&(f=m(k.matches[0].replace(ba,ca),_.test(j[0].type)&&oa(b.parentNode)||b))){if(j.splice(i,1),a=f.length&&qa(j),!a)return H.apply(e,f),e;break}}}return(n||h(a,o))(f,b,!p,e,!b||_.test(a)&&oa(b.parentNode)||b),e},c.sortStable=u.split("").sort(B).join("")===u,c.detectDuplicates=!!l,m(),c.sortDetached=ia(function(a){return 1&a.compareDocumentPosition(n.createElement("div"))}),ia(function(a){return a.innerHTML="<a href='#'></a>","#"===a.firstChild.getAttribute("href")})||ja("type|href|height|width",function(a,b,c){return c?void 0:a.getAttribute(b,"type"===b.toLowerCase()?1:2)}),c.attributes&&ia(function(a){return a.innerHTML="<input/>",a.firstChild.setAttribute("value",""),""===a.firstChild.getAttribute("value")})||ja("value",function(a,b,c){return c||"input"!==a.nodeName.toLowerCase()?void 0:a.defaultValue}),ia(function(a){return null==a.getAttribute("disabled")})||ja(K,function(a,b,c){var d;return c?void 0:a[b]===!0?b.toLowerCase():(d=a.getAttributeNode(b))&&d.specified?d.value:null}),fa}(a);n.find=t,n.expr=t.selectors,n.expr[":"]=n.expr.pseudos,n.uniqueSort=n.unique=t.uniqueSort,n.text=t.getText,n.isXMLDoc=t.isXML,n.contains=t.contains;var u=function(a,b,c){var d=[],e=void 0!==c;while((a=a[b])&&9!==a.nodeType)if(1===a.nodeType){if(e&&n(a).is(c))break;d.push(a)}return d},v=function(a,b){for(var c=[];a;a=a.nextSibling)1===a.nodeType&&a!==b&&c.push(a);return c},w=n.expr.match.needsContext,x=/^<([\w-]+)\s*\/?>(?:<\/\1>|)$/,y=/^.[^:#\[\.,]*$/;function z(a,b,c){if(n.isFunction(b))return n.grep(a,function(a,d){return!!b.call(a,d,a)!==c});if(b.nodeType)return n.grep(a,function(a){return a===b!==c});if("string"==typeof b){if(y.test(b))return n.filter(b,a,c);b=n.filter(b,a)}return n.grep(a,function(a){return n.inArray(a,b)>-1!==c})}n.filter=function(a,b,c){var d=b[0];return c&&(a=":not("+a+")"),1===b.length&&1===d.nodeType?n.find.matchesSelector(d,a)?[d]:[]:n.find.matches(a,n.grep(b,function(a){return 1===a.nodeType}))},n.fn.extend({find:function(a){var b,c=[],d=this,e=d.length;if("string"!=typeof a)return this.pushStack(n(a).filter(function(){for(b=0;e>b;b++)if(n.contains(d[b],this))return!0}));for(b=0;e>b;b++)n.find(a,d[b],c);return c=this.pushStack(e>1?n.unique(c):c),c.selector=this.selector?this.selector+" "+a:a,c},filter:function(a){return this.pushStack(z(this,a||[],!1))},not:function(a){return this.pushStack(z(this,a||[],!0))},is:function(a){return!!z(this,"string"==typeof a&&w.test(a)?n(a):a||[],!1).length}});var A,B=/^(?:\s*(<[\w\W]+>)[^>]*|#([\w-]*))$/,C=n.fn.init=function(a,b,c){var e,f;if(!a)return this;if(c=c||A,"string"==typeof a){if(e="<"===a.charAt(0)&&">"===a.charAt(a.length-1)&&a.length>=3?[null,a,null]:B.exec(a),!e||!e[1]&&b)return!b||b.jquery?(b||c).find(a):this.constructor(b).find(a);if(e[1]){if(b=b instanceof n?b[0]:b,n.merge(this,n.parseHTML(e[1],b&&b.nodeType?b.ownerDocument||b:d,!0)),x.test(e[1])&&n.isPlainObject(b))for(e in b)n.isFunction(this[e])?this[e](b[e]):this.attr(e,b[e]);return this}if(f=d.getElementById(e[2]),f&&f.parentNode){if(f.id!==e[2])return A.find(a);this.length=1,this[0]=f}return this.context=d,this.selector=a,this}return a.nodeType?(this.context=this[0]=a,this.length=1,this):n.isFunction(a)?"undefined"!=typeof c.ready?c.ready(a):a(n):(void 0!==a.selector&&(this.selector=a.selector,this.context=a.context),n.makeArray(a,this))};C.prototype=n.fn,A=n(d);var D=/^(?:parents|prev(?:Until|All))/,E={children:!0,contents:!0,next:!0,prev:!0};n.fn.extend({has:function(a){var b,c=n(a,this),d=c.length;return this.filter(function(){for(b=0;d>b;b++)if(n.contains(this,c[b]))return!0})},closest:function(a,b){for(var c,d=0,e=this.length,f=[],g=w.test(a)||"string"!=typeof a?n(a,b||this.context):0;e>d;d++)for(c=this[d];c&&c!==b;c=c.parentNode)if(c.nodeType<11&&(g?g.index(c)>-1:1===c.nodeType&&n.find.matchesSelector(c,a))){f.push(c);break}return this.pushStack(f.length>1?n.uniqueSort(f):f)},index:function(a){return a?"string"==typeof a?n.inArray(this[0],n(a)):n.inArray(a.jquery?a[0]:a,this):this[0]&&this[0].parentNode?this.first().prevAll().length:-1},add:function(a,b){return this.pushStack(n.uniqueSort(n.merge(this.get(),n(a,b))))},addBack:function(a){return this.add(null==a?this.prevObject:this.prevObject.filter(a))}});function F(a,b){do a=a[b];while(a&&1!==a.nodeType);return a}n.each({parent:function(a){var b=a.parentNode;return b&&11!==b.nodeType?b:null},parents:function(a){return u(a,"parentNode")},parentsUntil:function(a,b,c){return u(a,"parentNode",c)},next:function(a){return F(a,"nextSibling")},prev:function(a){return F(a,"previousSibling")},nextAll:function(a){return u(a,"nextSibling")},prevAll:function(a){return u(a,"previousSibling")},nextUntil:function(a,b,c){return u(a,"nextSibling",c)},prevUntil:function(a,b,c){return u(a,"previousSibling",c)},siblings:function(a){return v((a.parentNode||{}).firstChild,a)},children:function(a){return v(a.firstChild)},contents:function(a){return n.nodeName(a,"iframe")?a.contentDocument||a.contentWindow.document:n.merge([],a.childNodes)}},function(a,b){n.fn[a]=function(c,d){var e=n.map(this,b,c);return"Until"!==a.slice(-5)&&(d=c),d&&"string"==typeof d&&(e=n.filter(d,e)),this.length>1&&(E[a]||(e=n.uniqueSort(e)),D.test(a)&&(e=e.reverse())),this.pushStack(e)}});var G=/\S+/g;function H(a){var b={};return n.each(a.match(G)||[],function(a,c){b[c]=!0}),b}n.Callbacks=function(a){a="string"==typeof a?H(a):n.extend({},a);var b,c,d,e,f=[],g=[],h=-1,i=function(){for(e=a.once,d=b=!0;g.length;h=-1){c=g.shift();while(++h<f.length)f[h].apply(c[0],c[1])===!1&&a.stopOnFalse&&(h=f.length,c=!1)}a.memory||(c=!1),b=!1,e&&(f=c?[]:"")},j={add:function(){return f&&(c&&!b&&(h=f.length-1,g.push(c)),function d(b){n.each(b,function(b,c){n.isFunction(c)?a.unique&&j.has(c)||f.push(c):c&&c.length&&"string"!==n.type(c)&&d(c)})}(arguments),c&&!b&&i()),this},remove:function(){return n.each(arguments,function(a,b){var c;while((c=n.inArray(b,f,c))>-1)f.splice(c,1),h>=c&&h--}),this},has:function(a){return a?n.inArray(a,f)>-1:f.length>0},empty:function(){return f&&(f=[]),this},disable:function(){return e=g=[],f=c="",this},disabled:function(){return!f},lock:function(){return e=!0,c||j.disable(),this},locked:function(){return!!e},fireWith:function(a,c){return e||(c=c||[],c=[a,c.slice?c.slice():c],g.push(c),b||i()),this},fire:function(){return j.fireWith(this,arguments),this},fired:function(){return!!d}};return j},n.extend({Deferred:function(a){var b=[["resolve","done",n.Callbacks("once memory"),"resolved"],["reject","fail",n.Callbacks("once memory"),"rejected"],["notify","progress",n.Callbacks("memory")]],c="pending",d={state:function(){return c},always:function(){return e.done(arguments).fail(arguments),this},then:function(){var a=arguments;return n.Deferred(function(c){n.each(b,function(b,f){var g=n.isFunction(a[b])&&a[b];e[f[1]](function(){var a=g&&g.apply(this,arguments);a&&n.isFunction(a.promise)?a.promise().progress(c.notify).done(c.resolve).fail(c.reject):c[f[0]+"With"](this===d?c.promise():this,g?[a]:arguments)})}),a=null}).promise()},promise:function(a){return null!=a?n.extend(a,d):d}},e={};return d.pipe=d.then,n.each(b,function(a,f){var g=f[2],h=f[3];d[f[1]]=g.add,h&&g.add(function(){c=h},b[1^a][2].disable,b[2][2].lock),e[f[0]]=function(){return e[f[0]+"With"](this===e?d:this,arguments),this},e[f[0]+"With"]=g.fireWith}),d.promise(e),a&&a.call(e,e),e},when:function(a){var b=0,c=e.call(arguments),d=c.length,f=1!==d||a&&n.isFunction(a.promise)?d:0,g=1===f?a:n.Deferred(),h=function(a,b,c){return function(d){b[a]=this,c[a]=arguments.length>1?e.call(arguments):d,c===i?g.notifyWith(b,c):--f||g.resolveWith(b,c)}},i,j,k;if(d>1)for(i=new Array(d),j=new Array(d),k=new Array(d);d>b;b++)c[b]&&n.isFunction(c[b].promise)?c[b].promise().progress(h(b,j,i)).done(h(b,k,c)).fail(g.reject):--f;return f||g.resolveWith(k,c),g.promise()}});var I;n.fn.ready=function(a){return n.ready.promise().done(a),this},n.extend({isReady:!1,readyWait:1,holdReady:function(a){a?n.readyWait++:n.ready(!0)},ready:function(a){(a===!0?--n.readyWait:n.isReady)||(n.isReady=!0,a!==!0&&--n.readyWait>0||(I.resolveWith(d,[n]),n.fn.triggerHandler&&(n(d).triggerHandler("ready"),n(d).off("ready"))))}});function J(){d.addEventListener?(d.removeEventListener("DOMContentLoaded",K),a.removeEventListener("load",K)):(d.detachEvent("onreadystatechange",K),a.detachEvent("onload",K))}function K(){(d.addEventListener||"load"===a.event.type||"complete"===d.readyState)&&(J(),n.ready())}n.ready.promise=function(b){if(!I)if(I=n.Deferred(),"complete"===d.readyState||"loading"!==d.readyState&&!d.documentElement.doScroll)a.setTimeout(n.ready);else if(d.addEventListener)d.addEventListener("DOMContentLoaded",K),a.addEventListener("load",K);else{d.attachEvent("onreadystatechange",K),a.attachEvent("onload",K);var c=!1;try{c=null==a.frameElement&&d.documentElement}catch(e){}c&&c.doScroll&&!function f(){if(!n.isReady){try{c.doScroll("left")}catch(b){return a.setTimeout(f,50)}J(),n.ready()}}()}return I.promise(b)},n.ready.promise();var L;for(L in n(l))break;l.ownFirst="0"===L,l.inlineBlockNeedsLayout=!1,n(function(){var a,b,c,e;c=d.getElementsByTagName("body")[0],c&&c.style&&(b=d.createElement("div"),e=d.createElement("div"),e.style.cssText="position:absolute;border:0;width:0;height:0;top:0;left:-9999px",c.appendChild(e).appendChild(b),"undefined"!=typeof b.style.zoom&&(b.style.cssText="display:inline;margin:0;border:0;padding:1px;width:1px;zoom:1",l.inlineBlockNeedsLayout=a=3===b.offsetWidth,a&&(c.style.zoom=1)),c.removeChild(e))}),function(){var a=d.createElement("div");l.deleteExpando=!0;try{delete a.test}catch(b){l.deleteExpando=!1}a=null}();var M=function(a){var b=n.noData[(a.nodeName+" ").toLowerCase()],c=+a.nodeType||1;return 1!==c&&9!==c?!1:!b||b!==!0&&a.getAttribute("classid")===b},N=/^(?:\{[\w\W]*\}|\[[\w\W]*\])$/,O=/([A-Z])/g;function P(a,b,c){if(void 0===c&&1===a.nodeType){var d="data-"+b.replace(O,"-$1").toLowerCase();if(c=a.getAttribute(d),"string"==typeof c){try{c="true"===c?!0:"false"===c?!1:"null"===c?null:+c+""===c?+c:N.test(c)?n.parseJSON(c):c}catch(e){}n.data(a,b,c)}else c=void 0;
}return c}function Q(a){var b;for(b in a)if(("data"!==b||!n.isEmptyObject(a[b]))&&"toJSON"!==b)return!1;return!0}function R(a,b,d,e){if(M(a)){var f,g,h=n.expando,i=a.nodeType,j=i?n.cache:a,k=i?a[h]:a[h]&&h;if(k&&j[k]&&(e||j[k].data)||void 0!==d||"string"!=typeof b)return k||(k=i?a[h]=c.pop()||n.guid++:h),j[k]||(j[k]=i?{}:{toJSON:n.noop}),"object"!=typeof b&&"function"!=typeof b||(e?j[k]=n.extend(j[k],b):j[k].data=n.extend(j[k].data,b)),g=j[k],e||(g.data||(g.data={}),g=g.data),void 0!==d&&(g[n.camelCase(b)]=d),"string"==typeof b?(f=g[b],null==f&&(f=g[n.camelCase(b)])):f=g,f}}function S(a,b,c){if(M(a)){var d,e,f=a.nodeType,g=f?n.cache:a,h=f?a[n.expando]:n.expando;if(g[h]){if(b&&(d=c?g[h]:g[h].data)){n.isArray(b)?b=b.concat(n.map(b,n.camelCase)):b in d?b=[b]:(b=n.camelCase(b),b=b in d?[b]:b.split(" ")),e=b.length;while(e--)delete d[b[e]];if(c?!Q(d):!n.isEmptyObject(d))return}(c||(delete g[h].data,Q(g[h])))&&(f?n.cleanData([a],!0):l.deleteExpando||g!=g.window?delete g[h]:g[h]=void 0)}}}n.extend({cache:{},noData:{"applet ":!0,"embed ":!0,"object ":"clsid:D27CDB6E-AE6D-11cf-96B8-444553540000"},hasData:function(a){return a=a.nodeType?n.cache[a[n.expando]]:a[n.expando],!!a&&!Q(a)},data:function(a,b,c){return R(a,b,c)},removeData:function(a,b){return S(a,b)},_data:function(a,b,c){return R(a,b,c,!0)},_removeData:function(a,b){return S(a,b,!0)}}),n.fn.extend({data:function(a,b){var c,d,e,f=this[0],g=f&&f.attributes;if(void 0===a){if(this.length&&(e=n.data(f),1===f.nodeType&&!n._data(f,"parsedAttrs"))){c=g.length;while(c--)g[c]&&(d=g[c].name,0===d.indexOf("data-")&&(d=n.camelCase(d.slice(5)),P(f,d,e[d])));n._data(f,"parsedAttrs",!0)}return e}return"object"==typeof a?this.each(function(){n.data(this,a)}):arguments.length>1?this.each(function(){n.data(this,a,b)}):f?P(f,a,n.data(f,a)):void 0},removeData:function(a){return this.each(function(){n.removeData(this,a)})}}),n.extend({queue:function(a,b,c){var d;return a?(b=(b||"fx")+"queue",d=n._data(a,b),c&&(!d||n.isArray(c)?d=n._data(a,b,n.makeArray(c)):d.push(c)),d||[]):void 0},dequeue:function(a,b){b=b||"fx";var c=n.queue(a,b),d=c.length,e=c.shift(),f=n._queueHooks(a,b),g=function(){n.dequeue(a,b)};"inprogress"===e&&(e=c.shift(),d--),e&&("fx"===b&&c.unshift("inprogress"),delete f.stop,e.call(a,g,f)),!d&&f&&f.empty.fire()},_queueHooks:function(a,b){var c=b+"queueHooks";return n._data(a,c)||n._data(a,c,{empty:n.Callbacks("once memory").add(function(){n._removeData(a,b+"queue"),n._removeData(a,c)})})}}),n.fn.extend({queue:function(a,b){var c=2;return"string"!=typeof a&&(b=a,a="fx",c--),arguments.length<c?n.queue(this[0],a):void 0===b?this:this.each(function(){var c=n.queue(this,a,b);n._queueHooks(this,a),"fx"===a&&"inprogress"!==c[0]&&n.dequeue(this,a)})},dequeue:function(a){return this.each(function(){n.dequeue(this,a)})},clearQueue:function(a){return this.queue(a||"fx",[])},promise:function(a,b){var c,d=1,e=n.Deferred(),f=this,g=this.length,h=function(){--d||e.resolveWith(f,[f])};"string"!=typeof a&&(b=a,a=void 0),a=a||"fx";while(g--)c=n._data(f[g],a+"queueHooks"),c&&c.empty&&(d++,c.empty.add(h));return h(),e.promise(b)}}),function(){var a;l.shrinkWrapBlocks=function(){if(null!=a)return a;a=!1;var b,c,e;return c=d.getElementsByTagName("body")[0],c&&c.style?(b=d.createElement("div"),e=d.createElement("div"),e.style.cssText="position:absolute;border:0;width:0;height:0;top:0;left:-9999px",c.appendChild(e).appendChild(b),"undefined"!=typeof b.style.zoom&&(b.style.cssText="-webkit-box-sizing:content-box;-moz-box-sizing:content-box;box-sizing:content-box;display:block;margin:0;border:0;padding:1px;width:1px;zoom:1",b.appendChild(d.createElement("div")).style.width="5px",a=3!==b.offsetWidth),c.removeChild(e),a):void 0}}();var T=/[+-]?(?:\d*\.|)\d+(?:[eE][+-]?\d+|)/.source,U=new RegExp("^(?:([+-])=|)("+T+")([a-z%]*)$","i"),V=["Top","Right","Bottom","Left"],W=function(a,b){return a=b||a,"none"===n.css(a,"display")||!n.contains(a.ownerDocument,a)};function X(a,b,c,d){var e,f=1,g=20,h=d?function(){return d.cur()}:function(){return n.css(a,b,"")},i=h(),j=c&&c[3]||(n.cssNumber[b]?"":"px"),k=(n.cssNumber[b]||"px"!==j&&+i)&&U.exec(n.css(a,b));if(k&&k[3]!==j){j=j||k[3],c=c||[],k=+i||1;do f=f||".5",k/=f,n.style(a,b,k+j);while(f!==(f=h()/i)&&1!==f&&--g)}return c&&(k=+k||+i||0,e=c[1]?k+(c[1]+1)*c[2]:+c[2],d&&(d.unit=j,d.start=k,d.end=e)),e}var Y=function(a,b,c,d,e,f,g){var h=0,i=a.length,j=null==c;if("object"===n.type(c)){e=!0;for(h in c)Y(a,b,h,c[h],!0,f,g)}else if(void 0!==d&&(e=!0,n.isFunction(d)||(g=!0),j&&(g?(b.call(a,d),b=null):(j=b,b=function(a,b,c){return j.call(n(a),c)})),b))for(;i>h;h++)b(a[h],c,g?d:d.call(a[h],h,b(a[h],c)));return e?a:j?b.call(a):i?b(a[0],c):f},Z=/^(?:checkbox|radio)$/i,$=/<([\w:-]+)/,_=/^$|\/(?:java|ecma)script/i,aa=/^\s+/,ba="abbr|article|aside|audio|bdi|canvas|data|datalist|details|dialog|figcaption|figure|footer|header|hgroup|main|mark|meter|nav|output|picture|progress|section|summary|template|time|video";function ca(a){var b=ba.split("|"),c=a.createDocumentFragment();if(c.createElement)while(b.length)c.createElement(b.pop());return c}!function(){var a=d.createElement("div"),b=d.createDocumentFragment(),c=d.createElement("input");a.innerHTML="  <link/><table></table><a href='/a'>a</a><input type='checkbox'/>",l.leadingWhitespace=3===a.firstChild.nodeType,l.tbody=!a.getElementsByTagName("tbody").length,l.htmlSerialize=!!a.getElementsByTagName("link").length,l.html5Clone="<:nav></:nav>"!==d.createElement("nav").cloneNode(!0).outerHTML,c.type="checkbox",c.checked=!0,b.appendChild(c),l.appendChecked=c.checked,a.innerHTML="<textarea>x</textarea>",l.noCloneChecked=!!a.cloneNode(!0).lastChild.defaultValue,b.appendChild(a),c=d.createElement("input"),c.setAttribute("type","radio"),c.setAttribute("checked","checked"),c.setAttribute("name","t"),a.appendChild(c),l.checkClone=a.cloneNode(!0).cloneNode(!0).lastChild.checked,l.noCloneEvent=!!a.addEventListener,a[n.expando]=1,l.attributes=!a.getAttribute(n.expando)}();var da={option:[1,"<select multiple='multiple'>","</select>"],legend:[1,"<fieldset>","</fieldset>"],area:[1,"<map>","</map>"],param:[1,"<object>","</object>"],thead:[1,"<table>","</table>"],tr:[2,"<table><tbody>","</tbody></table>"],col:[2,"<table><tbody></tbody><colgroup>","</colgroup></table>"],td:[3,"<table><tbody><tr>","</tr></tbody></table>"],_default:l.htmlSerialize?[0,"",""]:[1,"X<div>","</div>"]};da.optgroup=da.option,da.tbody=da.tfoot=da.colgroup=da.caption=da.thead,da.th=da.td;function ea(a,b){var c,d,e=0,f="undefined"!=typeof a.getElementsByTagName?a.getElementsByTagName(b||"*"):"undefined"!=typeof a.querySelectorAll?a.querySelectorAll(b||"*"):void 0;if(!f)for(f=[],c=a.childNodes||a;null!=(d=c[e]);e++)!b||n.nodeName(d,b)?f.push(d):n.merge(f,ea(d,b));return void 0===b||b&&n.nodeName(a,b)?n.merge([a],f):f}function fa(a,b){for(var c,d=0;null!=(c=a[d]);d++)n._data(c,"globalEval",!b||n._data(b[d],"globalEval"))}var ga=/<|&#?\w+;/,ha=/<tbody/i;function ia(a){Z.test(a.type)&&(a.defaultChecked=a.checked)}function ja(a,b,c,d,e){for(var f,g,h,i,j,k,m,o=a.length,p=ca(b),q=[],r=0;o>r;r++)if(g=a[r],g||0===g)if("object"===n.type(g))n.merge(q,g.nodeType?[g]:g);else if(ga.test(g)){i=i||p.appendChild(b.createElement("div")),j=($.exec(g)||["",""])[1].toLowerCase(),m=da[j]||da._default,i.innerHTML=m[1]+n.htmlPrefilter(g)+m[2],f=m[0];while(f--)i=i.lastChild;if(!l.leadingWhitespace&&aa.test(g)&&q.push(b.createTextNode(aa.exec(g)[0])),!l.tbody){g="table"!==j||ha.test(g)?"<table>"!==m[1]||ha.test(g)?0:i:i.firstChild,f=g&&g.childNodes.length;while(f--)n.nodeName(k=g.childNodes[f],"tbody")&&!k.childNodes.length&&g.removeChild(k)}n.merge(q,i.childNodes),i.textContent="";while(i.firstChild)i.removeChild(i.firstChild);i=p.lastChild}else q.push(b.createTextNode(g));i&&p.removeChild(i),l.appendChecked||n.grep(ea(q,"input"),ia),r=0;while(g=q[r++])if(d&&n.inArray(g,d)>-1)e&&e.push(g);else if(h=n.contains(g.ownerDocument,g),i=ea(p.appendChild(g),"script"),h&&fa(i),c){f=0;while(g=i[f++])_.test(g.type||"")&&c.push(g)}return i=null,p}!function(){var b,c,e=d.createElement("div");for(b in{submit:!0,change:!0,focusin:!0})c="on"+b,(l[b]=c in a)||(e.setAttribute(c,"t"),l[b]=e.attributes[c].expando===!1);e=null}();var ka=/^(?:input|select|textarea)$/i,la=/^key/,ma=/^(?:mouse|pointer|contextmenu|drag|drop)|click/,na=/^(?:focusinfocus|focusoutblur)$/,oa=/^([^.]*)(?:\.(.+)|)/;function pa(){return!0}function qa(){return!1}function ra(){try{return d.activeElement}catch(a){}}function sa(a,b,c,d,e,f){var g,h;if("object"==typeof b){"string"!=typeof c&&(d=d||c,c=void 0);for(h in b)sa(a,h,c,d,b[h],f);return a}if(null==d&&null==e?(e=c,d=c=void 0):null==e&&("string"==typeof c?(e=d,d=void 0):(e=d,d=c,c=void 0)),e===!1)e=qa;else if(!e)return a;return 1===f&&(g=e,e=function(a){return n().off(a),g.apply(this,arguments)},e.guid=g.guid||(g.guid=n.guid++)),a.each(function(){n.event.add(this,b,e,d,c)})}n.event={global:{},add:function(a,b,c,d,e){var f,g,h,i,j,k,l,m,o,p,q,r=n._data(a);if(r){c.handler&&(i=c,c=i.handler,e=i.selector),c.guid||(c.guid=n.guid++),(g=r.events)||(g=r.events={}),(k=r.handle)||(k=r.handle=function(a){return"undefined"==typeof n||a&&n.event.triggered===a.type?void 0:n.event.dispatch.apply(k.elem,arguments)},k.elem=a),b=(b||"").match(G)||[""],h=b.length;while(h--)f=oa.exec(b[h])||[],o=q=f[1],p=(f[2]||"").split(".").sort(),o&&(j=n.event.special[o]||{},o=(e?j.delegateType:j.bindType)||o,j=n.event.special[o]||{},l=n.extend({type:o,origType:q,data:d,handler:c,guid:c.guid,selector:e,needsContext:e&&n.expr.match.needsContext.test(e),namespace:p.join(".")},i),(m=g[o])||(m=g[o]=[],m.delegateCount=0,j.setup&&j.setup.call(a,d,p,k)!==!1||(a.addEventListener?a.addEventListener(o,k,!1):a.attachEvent&&a.attachEvent("on"+o,k))),j.add&&(j.add.call(a,l),l.handler.guid||(l.handler.guid=c.guid)),e?m.splice(m.delegateCount++,0,l):m.push(l),n.event.global[o]=!0);a=null}},remove:function(a,b,c,d,e){var f,g,h,i,j,k,l,m,o,p,q,r=n.hasData(a)&&n._data(a);if(r&&(k=r.events)){b=(b||"").match(G)||[""],j=b.length;while(j--)if(h=oa.exec(b[j])||[],o=q=h[1],p=(h[2]||"").split(".").sort(),o){l=n.event.special[o]||{},o=(d?l.delegateType:l.bindType)||o,m=k[o]||[],h=h[2]&&new RegExp("(^|\\.)"+p.join("\\.(?:.*\\.|)")+"(\\.|$)"),i=f=m.length;while(f--)g=m[f],!e&&q!==g.origType||c&&c.guid!==g.guid||h&&!h.test(g.namespace)||d&&d!==g.selector&&("**"!==d||!g.selector)||(m.splice(f,1),g.selector&&m.delegateCount--,l.remove&&l.remove.call(a,g));i&&!m.length&&(l.teardown&&l.teardown.call(a,p,r.handle)!==!1||n.removeEvent(a,o,r.handle),delete k[o])}else for(o in k)n.event.remove(a,o+b[j],c,d,!0);n.isEmptyObject(k)&&(delete r.handle,n._removeData(a,"events"))}},trigger:function(b,c,e,f){var g,h,i,j,l,m,o,p=[e||d],q=k.call(b,"type")?b.type:b,r=k.call(b,"namespace")?b.namespace.split("."):[];if(i=m=e=e||d,3!==e.nodeType&&8!==e.nodeType&&!na.test(q+n.event.triggered)&&(q.indexOf(".")>-1&&(r=q.split("."),q=r.shift(),r.sort()),h=q.indexOf(":")<0&&"on"+q,b=b[n.expando]?b:new n.Event(q,"object"==typeof b&&b),b.isTrigger=f?2:3,b.namespace=r.join("."),b.rnamespace=b.namespace?new RegExp("(^|\\.)"+r.join("\\.(?:.*\\.|)")+"(\\.|$)"):null,b.result=void 0,b.target||(b.target=e),c=null==c?[b]:n.makeArray(c,[b]),l=n.event.special[q]||{},f||!l.trigger||l.trigger.apply(e,c)!==!1)){if(!f&&!l.noBubble&&!n.isWindow(e)){for(j=l.delegateType||q,na.test(j+q)||(i=i.parentNode);i;i=i.parentNode)p.push(i),m=i;m===(e.ownerDocument||d)&&p.push(m.defaultView||m.parentWindow||a)}o=0;while((i=p[o++])&&!b.isPropagationStopped())b.type=o>1?j:l.bindType||q,g=(n._data(i,"events")||{})[b.type]&&n._data(i,"handle"),g&&g.apply(i,c),g=h&&i[h],g&&g.apply&&M(i)&&(b.result=g.apply(i,c),b.result===!1&&b.preventDefault());if(b.type=q,!f&&!b.isDefaultPrevented()&&(!l._default||l._default.apply(p.pop(),c)===!1)&&M(e)&&h&&e[q]&&!n.isWindow(e)){m=e[h],m&&(e[h]=null),n.event.triggered=q;try{e[q]()}catch(s){}n.event.triggered=void 0,m&&(e[h]=m)}return b.result}},dispatch:function(a){a=n.event.fix(a);var b,c,d,f,g,h=[],i=e.call(arguments),j=(n._data(this,"events")||{})[a.type]||[],k=n.event.special[a.type]||{};if(i[0]=a,a.delegateTarget=this,!k.preDispatch||k.preDispatch.call(this,a)!==!1){h=n.event.handlers.call(this,a,j),b=0;while((f=h[b++])&&!a.isPropagationStopped()){a.currentTarget=f.elem,c=0;while((g=f.handlers[c++])&&!a.isImmediatePropagationStopped())a.rnamespace&&!a.rnamespace.test(g.namespace)||(a.handleObj=g,a.data=g.data,d=((n.event.special[g.origType]||{}).handle||g.handler).apply(f.elem,i),void 0!==d&&(a.result=d)===!1&&(a.preventDefault(),a.stopPropagation()))}return k.postDispatch&&k.postDispatch.call(this,a),a.result}},handlers:function(a,b){var c,d,e,f,g=[],h=b.delegateCount,i=a.target;if(h&&i.nodeType&&("click"!==a.type||isNaN(a.button)||a.button<1))for(;i!=this;i=i.parentNode||this)if(1===i.nodeType&&(i.disabled!==!0||"click"!==a.type)){for(d=[],c=0;h>c;c++)f=b[c],e=f.selector+" ",void 0===d[e]&&(d[e]=f.needsContext?n(e,this).index(i)>-1:n.find(e,this,null,[i]).length),d[e]&&d.push(f);d.length&&g.push({elem:i,handlers:d})}return h<b.length&&g.push({elem:this,handlers:b.slice(h)}),g},fix:function(a){if(a[n.expando])return a;var b,c,e,f=a.type,g=a,h=this.fixHooks[f];h||(this.fixHooks[f]=h=ma.test(f)?this.mouseHooks:la.test(f)?this.keyHooks:{}),e=h.props?this.props.concat(h.props):this.props,a=new n.Event(g),b=e.length;while(b--)c=e[b],a[c]=g[c];return a.target||(a.target=g.srcElement||d),3===a.target.nodeType&&(a.target=a.target.parentNode),a.metaKey=!!a.metaKey,h.filter?h.filter(a,g):a},props:"altKey bubbles cancelable ctrlKey currentTarget detail eventPhase metaKey relatedTarget shiftKey target timeStamp view which".split(" "),fixHooks:{},keyHooks:{props:"char charCode key keyCode".split(" "),filter:function(a,b){return null==a.which&&(a.which=null!=b.charCode?b.charCode:b.keyCode),a}},mouseHooks:{props:"button buttons clientX clientY fromElement offsetX offsetY pageX pageY screenX screenY toElement".split(" "),filter:function(a,b){var c,e,f,g=b.button,h=b.fromElement;return null==a.pageX&&null!=b.clientX&&(e=a.target.ownerDocument||d,f=e.documentElement,c=e.body,a.pageX=b.clientX+(f&&f.scrollLeft||c&&c.scrollLeft||0)-(f&&f.clientLeft||c&&c.clientLeft||0),a.pageY=b.clientY+(f&&f.scrollTop||c&&c.scrollTop||0)-(f&&f.clientTop||c&&c.clientTop||0)),!a.relatedTarget&&h&&(a.relatedTarget=h===a.target?b.toElement:h),a.which||void 0===g||(a.which=1&g?1:2&g?3:4&g?2:0),a}},special:{load:{noBubble:!0},focus:{trigger:function(){if(this!==ra()&&this.focus)try{return this.focus(),!1}catch(a){}},delegateType:"focusin"},blur:{trigger:function(){return this===ra()&&this.blur?(this.blur(),!1):void 0},delegateType:"focusout"},click:{trigger:function(){return n.nodeName(this,"input")&&"checkbox"===this.type&&this.click?(this.click(),!1):void 0},_default:function(a){return n.nodeName(a.target,"a")}},beforeunload:{postDispatch:function(a){void 0!==a.result&&a.originalEvent&&(a.originalEvent.returnValue=a.result)}}},simulate:function(a,b,c){var d=n.extend(new n.Event,c,{type:a,isSimulated:!0});n.event.trigger(d,null,b),d.isDefaultPrevented()&&c.preventDefault()}},n.removeEvent=d.removeEventListener?function(a,b,c){a.removeEventListener&&a.removeEventListener(b,c)}:function(a,b,c){var d="on"+b;a.detachEvent&&("undefined"==typeof a[d]&&(a[d]=null),a.detachEvent(d,c))},n.Event=function(a,b){return this instanceof n.Event?(a&&a.type?(this.originalEvent=a,this.type=a.type,this.isDefaultPrevented=a.defaultPrevented||void 0===a.defaultPrevented&&a.returnValue===!1?pa:qa):this.type=a,b&&n.extend(this,b),this.timeStamp=a&&a.timeStamp||n.now(),void(this[n.expando]=!0)):new n.Event(a,b)},n.Event.prototype={constructor:n.Event,isDefaultPrevented:qa,isPropagationStopped:qa,isImmediatePropagationStopped:qa,preventDefault:function(){var a=this.originalEvent;this.isDefaultPrevented=pa,a&&(a.preventDefault?a.preventDefault():a.returnValue=!1)},stopPropagation:function(){var a=this.originalEvent;this.isPropagationStopped=pa,a&&!this.isSimulated&&(a.stopPropagation&&a.stopPropagation(),a.cancelBubble=!0)},stopImmediatePropagation:function(){var a=this.originalEvent;this.isImmediatePropagationStopped=pa,a&&a.stopImmediatePropagation&&a.stopImmediatePropagation(),this.stopPropagation()}},n.each({mouseenter:"mouseover",mouseleave:"mouseout",pointerenter:"pointerover",pointerleave:"pointerout"},function(a,b){n.event.special[a]={delegateType:b,bindType:b,handle:function(a){var c,d=this,e=a.relatedTarget,f=a.handleObj;return e&&(e===d||n.contains(d,e))||(a.type=f.origType,c=f.handler.apply(this,arguments),a.type=b),c}}}),l.submit||(n.event.special.submit={setup:function(){return n.nodeName(this,"form")?!1:void n.event.add(this,"click._submit keypress._submit",function(a){var b=a.target,c=n.nodeName(b,"input")||n.nodeName(b,"button")?n.prop(b,"form"):void 0;c&&!n._data(c,"submit")&&(n.event.add(c,"submit._submit",function(a){a._submitBubble=!0}),n._data(c,"submit",!0))})},postDispatch:function(a){a._submitBubble&&(delete a._submitBubble,this.parentNode&&!a.isTrigger&&n.event.simulate("submit",this.parentNode,a))},teardown:function(){return n.nodeName(this,"form")?!1:void n.event.remove(this,"._submit")}}),l.change||(n.event.special.change={setup:function(){return ka.test(this.nodeName)?("checkbox"!==this.type&&"radio"!==this.type||(n.event.add(this,"propertychange._change",function(a){"checked"===a.originalEvent.propertyName&&(this._justChanged=!0)}),n.event.add(this,"click._change",function(a){this._justChanged&&!a.isTrigger&&(this._justChanged=!1),n.event.simulate("change",this,a)})),!1):void n.event.add(this,"beforeactivate._change",function(a){var b=a.target;ka.test(b.nodeName)&&!n._data(b,"change")&&(n.event.add(b,"change._change",function(a){!this.parentNode||a.isSimulated||a.isTrigger||n.event.simulate("change",this.parentNode,a)}),n._data(b,"change",!0))})},handle:function(a){var b=a.target;return this!==b||a.isSimulated||a.isTrigger||"radio"!==b.type&&"checkbox"!==b.type?a.handleObj.handler.apply(this,arguments):void 0},teardown:function(){return n.event.remove(this,"._change"),!ka.test(this.nodeName)}}),l.focusin||n.each({focus:"focusin",blur:"focusout"},function(a,b){var c=function(a){n.event.simulate(b,a.target,n.event.fix(a))};n.event.special[b]={setup:function(){var d=this.ownerDocument||this,e=n._data(d,b);e||d.addEventListener(a,c,!0),n._data(d,b,(e||0)+1)},teardown:function(){var d=this.ownerDocument||this,e=n._data(d,b)-1;e?n._data(d,b,e):(d.removeEventListener(a,c,!0),n._removeData(d,b))}}}),n.fn.extend({on:function(a,b,c,d){return sa(this,a,b,c,d)},one:function(a,b,c,d){return sa(this,a,b,c,d,1)},off:function(a,b,c){var d,e;if(a&&a.preventDefault&&a.handleObj)return d=a.handleObj,n(a.delegateTarget).off(d.namespace?d.origType+"."+d.namespace:d.origType,d.selector,d.handler),this;if("object"==typeof a){for(e in a)this.off(e,b,a[e]);return this}return b!==!1&&"function"!=typeof b||(c=b,b=void 0),c===!1&&(c=qa),this.each(function(){n.event.remove(this,a,c,b)})},trigger:function(a,b){return this.each(function(){n.event.trigger(a,b,this)})},triggerHandler:function(a,b){var c=this[0];return c?n.event.trigger(a,b,c,!0):void 0}});var ta=/ jQuery\d+="(?:null|\d+)"/g,ua=new RegExp("<(?:"+ba+")[\\s/>]","i"),va=/<(?!area|br|col|embed|hr|img|input|link|meta|param)(([\w:-]+)[^>]*)\/>/gi,wa=/<script|<style|<link/i,xa=/checked\s*(?:[^=]|=\s*.checked.)/i,ya=/^true\/(.*)/,za=/^\s*<!(?:\[CDATA\[|--)|(?:\]\]|--)>\s*$/g,Aa=ca(d),Ba=Aa.appendChild(d.createElement("div"));function Ca(a,b){return n.nodeName(a,"table")&&n.nodeName(11!==b.nodeType?b:b.firstChild,"tr")?a.getElementsByTagName("tbody")[0]||a.appendChild(a.ownerDocument.createElement("tbody")):a}function Da(a){return a.type=(null!==n.find.attr(a,"type"))+"/"+a.type,a}function Ea(a){var b=ya.exec(a.type);return b?a.type=b[1]:a.removeAttribute("type"),a}function Fa(a,b){if(1===b.nodeType&&n.hasData(a)){var c,d,e,f=n._data(a),g=n._data(b,f),h=f.events;if(h){delete g.handle,g.events={};for(c in h)for(d=0,e=h[c].length;e>d;d++)n.event.add(b,c,h[c][d])}g.data&&(g.data=n.extend({},g.data))}}function Ga(a,b){var c,d,e;if(1===b.nodeType){if(c=b.nodeName.toLowerCase(),!l.noCloneEvent&&b[n.expando]){e=n._data(b);for(d in e.events)n.removeEvent(b,d,e.handle);b.removeAttribute(n.expando)}"script"===c&&b.text!==a.text?(Da(b).text=a.text,Ea(b)):"object"===c?(b.parentNode&&(b.outerHTML=a.outerHTML),l.html5Clone&&a.innerHTML&&!n.trim(b.innerHTML)&&(b.innerHTML=a.innerHTML)):"input"===c&&Z.test(a.type)?(b.defaultChecked=b.checked=a.checked,b.value!==a.value&&(b.value=a.value)):"option"===c?b.defaultSelected=b.selected=a.defaultSelected:"input"!==c&&"textarea"!==c||(b.defaultValue=a.defaultValue)}}function Ha(a,b,c,d){b=f.apply([],b);var e,g,h,i,j,k,m=0,o=a.length,p=o-1,q=b[0],r=n.isFunction(q);if(r||o>1&&"string"==typeof q&&!l.checkClone&&xa.test(q))return a.each(function(e){var f=a.eq(e);r&&(b[0]=q.call(this,e,f.html())),Ha(f,b,c,d)});if(o&&(k=ja(b,a[0].ownerDocument,!1,a,d),e=k.firstChild,1===k.childNodes.length&&(k=e),e||d)){for(i=n.map(ea(k,"script"),Da),h=i.length;o>m;m++)g=k,m!==p&&(g=n.clone(g,!0,!0),h&&n.merge(i,ea(g,"script"))),c.call(a[m],g,m);if(h)for(j=i[i.length-1].ownerDocument,n.map(i,Ea),m=0;h>m;m++)g=i[m],_.test(g.type||"")&&!n._data(g,"globalEval")&&n.contains(j,g)&&(g.src?n._evalUrl&&n._evalUrl(g.src):n.globalEval((g.text||g.textContent||g.innerHTML||"").replace(za,"")));k=e=null}return a}function Ia(a,b,c){for(var d,e=b?n.filter(b,a):a,f=0;null!=(d=e[f]);f++)c||1!==d.nodeType||n.cleanData(ea(d)),d.parentNode&&(c&&n.contains(d.ownerDocument,d)&&fa(ea(d,"script")),d.parentNode.removeChild(d));return a}n.extend({htmlPrefilter:function(a){return a.replace(va,"<$1></$2>")},clone:function(a,b,c){var d,e,f,g,h,i=n.contains(a.ownerDocument,a);if(l.html5Clone||n.isXMLDoc(a)||!ua.test("<"+a.nodeName+">")?f=a.cloneNode(!0):(Ba.innerHTML=a.outerHTML,Ba.removeChild(f=Ba.firstChild)),!(l.noCloneEvent&&l.noCloneChecked||1!==a.nodeType&&11!==a.nodeType||n.isXMLDoc(a)))for(d=ea(f),h=ea(a),g=0;null!=(e=h[g]);++g)d[g]&&Ga(e,d[g]);if(b)if(c)for(h=h||ea(a),d=d||ea(f),g=0;null!=(e=h[g]);g++)Fa(e,d[g]);else Fa(a,f);return d=ea(f,"script"),d.length>0&&fa(d,!i&&ea(a,"script")),d=h=e=null,f},cleanData:function(a,b){for(var d,e,f,g,h=0,i=n.expando,j=n.cache,k=l.attributes,m=n.event.special;null!=(d=a[h]);h++)if((b||M(d))&&(f=d[i],g=f&&j[f])){if(g.events)for(e in g.events)m[e]?n.event.remove(d,e):n.removeEvent(d,e,g.handle);j[f]&&(delete j[f],k||"undefined"==typeof d.removeAttribute?d[i]=void 0:d.removeAttribute(i),c.push(f))}}}),n.fn.extend({domManip:Ha,detach:function(a){return Ia(this,a,!0)},remove:function(a){return Ia(this,a)},text:function(a){return Y(this,function(a){return void 0===a?n.text(this):this.empty().append((this[0]&&this[0].ownerDocument||d).createTextNode(a))},null,a,arguments.length)},append:function(){return Ha(this,arguments,function(a){if(1===this.nodeType||11===this.nodeType||9===this.nodeType){var b=Ca(this,a);b.appendChild(a)}})},prepend:function(){return Ha(this,arguments,function(a){if(1===this.nodeType||11===this.nodeType||9===this.nodeType){var b=Ca(this,a);b.insertBefore(a,b.firstChild)}})},before:function(){return Ha(this,arguments,function(a){this.parentNode&&this.parentNode.insertBefore(a,this)})},after:function(){return Ha(this,arguments,function(a){this.parentNode&&this.parentNode.insertBefore(a,this.nextSibling)})},empty:function(){for(var a,b=0;null!=(a=this[b]);b++){1===a.nodeType&&n.cleanData(ea(a,!1));while(a.firstChild)a.removeChild(a.firstChild);a.options&&n.nodeName(a,"select")&&(a.options.length=0)}return this},clone:function(a,b){return a=null==a?!1:a,b=null==b?a:b,this.map(function(){return n.clone(this,a,b)})},html:function(a){return Y(this,function(a){var b=this[0]||{},c=0,d=this.length;if(void 0===a)return 1===b.nodeType?b.innerHTML.replace(ta,""):void 0;if("string"==typeof a&&!wa.test(a)&&(l.htmlSerialize||!ua.test(a))&&(l.leadingWhitespace||!aa.test(a))&&!da[($.exec(a)||["",""])[1].toLowerCase()]){a=n.htmlPrefilter(a);try{for(;d>c;c++)b=this[c]||{},1===b.nodeType&&(n.cleanData(ea(b,!1)),b.innerHTML=a);b=0}catch(e){}}b&&this.empty().append(a)},null,a,arguments.length)},replaceWith:function(){var a=[];return Ha(this,arguments,function(b){var c=this.parentNode;n.inArray(this,a)<0&&(n.cleanData(ea(this)),c&&c.replaceChild(b,this))},a)}}),n.each({appendTo:"append",prependTo:"prepend",insertBefore:"before",insertAfter:"after",replaceAll:"replaceWith"},function(a,b){n.fn[a]=function(a){for(var c,d=0,e=[],f=n(a),h=f.length-1;h>=d;d++)c=d===h?this:this.clone(!0),n(f[d])[b](c),g.apply(e,c.get());return this.pushStack(e)}});var Ja,Ka={HTML:"block",BODY:"block"};function La(a,b){var c=n(b.createElement(a)).appendTo(b.body),d=n.css(c[0],"display");return c.detach(),d}function Ma(a){var b=d,c=Ka[a];return c||(c=La(a,b),"none"!==c&&c||(Ja=(Ja||n("<iframe frameborder='0' width='0' height='0'/>")).appendTo(b.documentElement),b=(Ja[0].contentWindow||Ja[0].contentDocument).document,b.write(),b.close(),c=La(a,b),Ja.detach()),Ka[a]=c),c}var Na=/^margin/,Oa=new RegExp("^("+T+")(?!px)[a-z%]+$","i"),Pa=function(a,b,c,d){var e,f,g={};for(f in b)g[f]=a.style[f],a.style[f]=b[f];e=c.apply(a,d||[]);for(f in b)a.style[f]=g[f];return e},Qa=d.documentElement;!function(){var b,c,e,f,g,h,i=d.createElement("div"),j=d.createElement("div");if(j.style){j.style.cssText="float:left;opacity:.5",l.opacity="0.5"===j.style.opacity,l.cssFloat=!!j.style.cssFloat,j.style.backgroundClip="content-box",j.cloneNode(!0).style.backgroundClip="",l.clearCloneStyle="content-box"===j.style.backgroundClip,i=d.createElement("div"),i.style.cssText="border:0;width:8px;height:0;top:0;left:-9999px;padding:0;margin-top:1px;position:absolute",j.innerHTML="",i.appendChild(j),l.boxSizing=""===j.style.boxSizing||""===j.style.MozBoxSizing||""===j.style.WebkitBoxSizing,n.extend(l,{reliableHiddenOffsets:function(){return null==b&&k(),f},boxSizingReliable:function(){return null==b&&k(),e},pixelMarginRight:function(){return null==b&&k(),c},pixelPosition:function(){return null==b&&k(),b},reliableMarginRight:function(){return null==b&&k(),g},reliableMarginLeft:function(){return null==b&&k(),h}});function k(){var k,l,m=d.documentElement;m.appendChild(i),j.style.cssText="-webkit-box-sizing:border-box;box-sizing:border-box;position:relative;display:block;margin:auto;border:1px;padding:1px;top:1%;width:50%",b=e=h=!1,c=g=!0,a.getComputedStyle&&(l=a.getComputedStyle(j),b="1%"!==(l||{}).top,h="2px"===(l||{}).marginLeft,e="4px"===(l||{width:"4px"}).width,j.style.marginRight="50%",c="4px"===(l||{marginRight:"4px"}).marginRight,k=j.appendChild(d.createElement("div")),k.style.cssText=j.style.cssText="-webkit-box-sizing:content-box;-moz-box-sizing:content-box;box-sizing:content-box;display:block;margin:0;border:0;padding:0",k.style.marginRight=k.style.width="0",j.style.width="1px",g=!parseFloat((a.getComputedStyle(k)||{}).marginRight),j.removeChild(k)),j.style.display="none",f=0===j.getClientRects().length,f&&(j.style.display="",j.innerHTML="<table><tr><td></td><td>t</td></tr></table>",j.childNodes[0].style.borderCollapse="separate",k=j.getElementsByTagName("td"),k[0].style.cssText="margin:0;border:0;padding:0;display:none",f=0===k[0].offsetHeight,f&&(k[0].style.display="",k[1].style.display="none",f=0===k[0].offsetHeight)),m.removeChild(i)}}}();var Ra,Sa,Ta=/^(top|right|bottom|left)$/;a.getComputedStyle?(Ra=function(b){var c=b.ownerDocument.defaultView;return c&&c.opener||(c=a),c.getComputedStyle(b)},Sa=function(a,b,c){var d,e,f,g,h=a.style;return c=c||Ra(a),g=c?c.getPropertyValue(b)||c[b]:void 0,""!==g&&void 0!==g||n.contains(a.ownerDocument,a)||(g=n.style(a,b)),c&&!l.pixelMarginRight()&&Oa.test(g)&&Na.test(b)&&(d=h.width,e=h.minWidth,f=h.maxWidth,h.minWidth=h.maxWidth=h.width=g,g=c.width,h.width=d,h.minWidth=e,h.maxWidth=f),void 0===g?g:g+""}):Qa.currentStyle&&(Ra=function(a){return a.currentStyle},Sa=function(a,b,c){var d,e,f,g,h=a.style;return c=c||Ra(a),g=c?c[b]:void 0,null==g&&h&&h[b]&&(g=h[b]),Oa.test(g)&&!Ta.test(b)&&(d=h.left,e=a.runtimeStyle,f=e&&e.left,f&&(e.left=a.currentStyle.left),h.left="fontSize"===b?"1em":g,g=h.pixelLeft+"px",h.left=d,f&&(e.left=f)),void 0===g?g:g+""||"auto"});function Ua(a,b){return{get:function(){return a()?void delete this.get:(this.get=b).apply(this,arguments)}}}var Va=/alpha\([^)]*\)/i,Wa=/opacity\s*=\s*([^)]*)/i,Xa=/^(none|table(?!-c[ea]).+)/,Ya=new RegExp("^("+T+")(.*)$","i"),Za={position:"absolute",visibility:"hidden",display:"block"},$a={letterSpacing:"0",fontWeight:"400"},_a=["Webkit","O","Moz","ms"],ab=d.createElement("div").style;function bb(a){if(a in ab)return a;var b=a.charAt(0).toUpperCase()+a.slice(1),c=_a.length;while(c--)if(a=_a[c]+b,a in ab)return a}function cb(a,b){for(var c,d,e,f=[],g=0,h=a.length;h>g;g++)d=a[g],d.style&&(f[g]=n._data(d,"olddisplay"),c=d.style.display,b?(f[g]||"none"!==c||(d.style.display=""),""===d.style.display&&W(d)&&(f[g]=n._data(d,"olddisplay",Ma(d.nodeName)))):(e=W(d),(c&&"none"!==c||!e)&&n._data(d,"olddisplay",e?c:n.css(d,"display"))));for(g=0;h>g;g++)d=a[g],d.style&&(b&&"none"!==d.style.display&&""!==d.style.display||(d.style.display=b?f[g]||"":"none"));return a}function db(a,b,c){var d=Ya.exec(b);return d?Math.max(0,d[1]-(c||0))+(d[2]||"px"):b}function eb(a,b,c,d,e){for(var f=c===(d?"border":"content")?4:"width"===b?1:0,g=0;4>f;f+=2)"margin"===c&&(g+=n.css(a,c+V[f],!0,e)),d?("content"===c&&(g-=n.css(a,"padding"+V[f],!0,e)),"margin"!==c&&(g-=n.css(a,"border"+V[f]+"Width",!0,e))):(g+=n.css(a,"padding"+V[f],!0,e),"padding"!==c&&(g+=n.css(a,"border"+V[f]+"Width",!0,e)));return g}function fb(a,b,c){var d=!0,e="width"===b?a.offsetWidth:a.offsetHeight,f=Ra(a),g=l.boxSizing&&"border-box"===n.css(a,"boxSizing",!1,f);if(0>=e||null==e){if(e=Sa(a,b,f),(0>e||null==e)&&(e=a.style[b]),Oa.test(e))return e;d=g&&(l.boxSizingReliable()||e===a.style[b]),e=parseFloat(e)||0}return e+eb(a,b,c||(g?"border":"content"),d,f)+"px"}n.extend({cssHooks:{opacity:{get:function(a,b){if(b){var c=Sa(a,"opacity");return""===c?"1":c}}}},cssNumber:{animationIterationCount:!0,columnCount:!0,fillOpacity:!0,flexGrow:!0,flexShrink:!0,fontWeight:!0,lineHeight:!0,opacity:!0,order:!0,orphans:!0,widows:!0,zIndex:!0,zoom:!0},cssProps:{"float":l.cssFloat?"cssFloat":"styleFloat"},style:function(a,b,c,d){if(a&&3!==a.nodeType&&8!==a.nodeType&&a.style){var e,f,g,h=n.camelCase(b),i=a.style;if(b=n.cssProps[h]||(n.cssProps[h]=bb(h)||h),g=n.cssHooks[b]||n.cssHooks[h],void 0===c)return g&&"get"in g&&void 0!==(e=g.get(a,!1,d))?e:i[b];if(f=typeof c,"string"===f&&(e=U.exec(c))&&e[1]&&(c=X(a,b,e),f="number"),null!=c&&c===c&&("number"===f&&(c+=e&&e[3]||(n.cssNumber[h]?"":"px")),l.clearCloneStyle||""!==c||0!==b.indexOf("background")||(i[b]="inherit"),!(g&&"set"in g&&void 0===(c=g.set(a,c,d)))))try{i[b]=c}catch(j){}}},css:function(a,b,c,d){var e,f,g,h=n.camelCase(b);return b=n.cssProps[h]||(n.cssProps[h]=bb(h)||h),g=n.cssHooks[b]||n.cssHooks[h],g&&"get"in g&&(f=g.get(a,!0,c)),void 0===f&&(f=Sa(a,b,d)),"normal"===f&&b in $a&&(f=$a[b]),""===c||c?(e=parseFloat(f),c===!0||isFinite(e)?e||0:f):f}}),n.each(["height","width"],function(a,b){n.cssHooks[b]={get:function(a,c,d){return c?Xa.test(n.css(a,"display"))&&0===a.offsetWidth?Pa(a,Za,function(){return fb(a,b,d)}):fb(a,b,d):void 0},set:function(a,c,d){var e=d&&Ra(a);return db(a,c,d?eb(a,b,d,l.boxSizing&&"border-box"===n.css(a,"boxSizing",!1,e),e):0)}}}),l.opacity||(n.cssHooks.opacity={get:function(a,b){return Wa.test((b&&a.currentStyle?a.currentStyle.filter:a.style.filter)||"")?.01*parseFloat(RegExp.$1)+"":b?"1":""},set:function(a,b){var c=a.style,d=a.currentStyle,e=n.isNumeric(b)?"alpha(opacity="+100*b+")":"",f=d&&d.filter||c.filter||"";c.zoom=1,(b>=1||""===b)&&""===n.trim(f.replace(Va,""))&&c.removeAttribute&&(c.removeAttribute("filter"),""===b||d&&!d.filter)||(c.filter=Va.test(f)?f.replace(Va,e):f+" "+e)}}),n.cssHooks.marginRight=Ua(l.reliableMarginRight,function(a,b){return b?Pa(a,{display:"inline-block"},Sa,[a,"marginRight"]):void 0}),n.cssHooks.marginLeft=Ua(l.reliableMarginLeft,function(a,b){return b?(parseFloat(Sa(a,"marginLeft"))||(n.contains(a.ownerDocument,a)?a.getBoundingClientRect().left-Pa(a,{
marginLeft:0},function(){return a.getBoundingClientRect().left}):0))+"px":void 0}),n.each({margin:"",padding:"",border:"Width"},function(a,b){n.cssHooks[a+b]={expand:function(c){for(var d=0,e={},f="string"==typeof c?c.split(" "):[c];4>d;d++)e[a+V[d]+b]=f[d]||f[d-2]||f[0];return e}},Na.test(a)||(n.cssHooks[a+b].set=db)}),n.fn.extend({css:function(a,b){return Y(this,function(a,b,c){var d,e,f={},g=0;if(n.isArray(b)){for(d=Ra(a),e=b.length;e>g;g++)f[b[g]]=n.css(a,b[g],!1,d);return f}return void 0!==c?n.style(a,b,c):n.css(a,b)},a,b,arguments.length>1)},show:function(){return cb(this,!0)},hide:function(){return cb(this)},toggle:function(a){return"boolean"==typeof a?a?this.show():this.hide():this.each(function(){W(this)?n(this).show():n(this).hide()})}});function gb(a,b,c,d,e){return new gb.prototype.init(a,b,c,d,e)}n.Tween=gb,gb.prototype={constructor:gb,init:function(a,b,c,d,e,f){this.elem=a,this.prop=c,this.easing=e||n.easing._default,this.options=b,this.start=this.now=this.cur(),this.end=d,this.unit=f||(n.cssNumber[c]?"":"px")},cur:function(){var a=gb.propHooks[this.prop];return a&&a.get?a.get(this):gb.propHooks._default.get(this)},run:function(a){var b,c=gb.propHooks[this.prop];return this.options.duration?this.pos=b=n.easing[this.easing](a,this.options.duration*a,0,1,this.options.duration):this.pos=b=a,this.now=(this.end-this.start)*b+this.start,this.options.step&&this.options.step.call(this.elem,this.now,this),c&&c.set?c.set(this):gb.propHooks._default.set(this),this}},gb.prototype.init.prototype=gb.prototype,gb.propHooks={_default:{get:function(a){var b;return 1!==a.elem.nodeType||null!=a.elem[a.prop]&&null==a.elem.style[a.prop]?a.elem[a.prop]:(b=n.css(a.elem,a.prop,""),b&&"auto"!==b?b:0)},set:function(a){n.fx.step[a.prop]?n.fx.step[a.prop](a):1!==a.elem.nodeType||null==a.elem.style[n.cssProps[a.prop]]&&!n.cssHooks[a.prop]?a.elem[a.prop]=a.now:n.style(a.elem,a.prop,a.now+a.unit)}}},gb.propHooks.scrollTop=gb.propHooks.scrollLeft={set:function(a){a.elem.nodeType&&a.elem.parentNode&&(a.elem[a.prop]=a.now)}},n.easing={linear:function(a){return a},swing:function(a){return.5-Math.cos(a*Math.PI)/2},_default:"swing"},n.fx=gb.prototype.init,n.fx.step={};var hb,ib,jb=/^(?:toggle|show|hide)$/,kb=/queueHooks$/;function lb(){return a.setTimeout(function(){hb=void 0}),hb=n.now()}function mb(a,b){var c,d={height:a},e=0;for(b=b?1:0;4>e;e+=2-b)c=V[e],d["margin"+c]=d["padding"+c]=a;return b&&(d.opacity=d.width=a),d}function nb(a,b,c){for(var d,e=(qb.tweeners[b]||[]).concat(qb.tweeners["*"]),f=0,g=e.length;g>f;f++)if(d=e[f].call(c,b,a))return d}function ob(a,b,c){var d,e,f,g,h,i,j,k,m=this,o={},p=a.style,q=a.nodeType&&W(a),r=n._data(a,"fxshow");c.queue||(h=n._queueHooks(a,"fx"),null==h.unqueued&&(h.unqueued=0,i=h.empty.fire,h.empty.fire=function(){h.unqueued||i()}),h.unqueued++,m.always(function(){m.always(function(){h.unqueued--,n.queue(a,"fx").length||h.empty.fire()})})),1===a.nodeType&&("height"in b||"width"in b)&&(c.overflow=[p.overflow,p.overflowX,p.overflowY],j=n.css(a,"display"),k="none"===j?n._data(a,"olddisplay")||Ma(a.nodeName):j,"inline"===k&&"none"===n.css(a,"float")&&(l.inlineBlockNeedsLayout&&"inline"!==Ma(a.nodeName)?p.zoom=1:p.display="inline-block")),c.overflow&&(p.overflow="hidden",l.shrinkWrapBlocks()||m.always(function(){p.overflow=c.overflow[0],p.overflowX=c.overflow[1],p.overflowY=c.overflow[2]}));for(d in b)if(e=b[d],jb.exec(e)){if(delete b[d],f=f||"toggle"===e,e===(q?"hide":"show")){if("show"!==e||!r||void 0===r[d])continue;q=!0}o[d]=r&&r[d]||n.style(a,d)}else j=void 0;if(n.isEmptyObject(o))"inline"===("none"===j?Ma(a.nodeName):j)&&(p.display=j);else{r?"hidden"in r&&(q=r.hidden):r=n._data(a,"fxshow",{}),f&&(r.hidden=!q),q?n(a).show():m.done(function(){n(a).hide()}),m.done(function(){var b;n._removeData(a,"fxshow");for(b in o)n.style(a,b,o[b])});for(d in o)g=nb(q?r[d]:0,d,m),d in r||(r[d]=g.start,q&&(g.end=g.start,g.start="width"===d||"height"===d?1:0))}}function pb(a,b){var c,d,e,f,g;for(c in a)if(d=n.camelCase(c),e=b[d],f=a[c],n.isArray(f)&&(e=f[1],f=a[c]=f[0]),c!==d&&(a[d]=f,delete a[c]),g=n.cssHooks[d],g&&"expand"in g){f=g.expand(f),delete a[d];for(c in f)c in a||(a[c]=f[c],b[c]=e)}else b[d]=e}function qb(a,b,c){var d,e,f=0,g=qb.prefilters.length,h=n.Deferred().always(function(){delete i.elem}),i=function(){if(e)return!1;for(var b=hb||lb(),c=Math.max(0,j.startTime+j.duration-b),d=c/j.duration||0,f=1-d,g=0,i=j.tweens.length;i>g;g++)j.tweens[g].run(f);return h.notifyWith(a,[j,f,c]),1>f&&i?c:(h.resolveWith(a,[j]),!1)},j=h.promise({elem:a,props:n.extend({},b),opts:n.extend(!0,{specialEasing:{},easing:n.easing._default},c),originalProperties:b,originalOptions:c,startTime:hb||lb(),duration:c.duration,tweens:[],createTween:function(b,c){var d=n.Tween(a,j.opts,b,c,j.opts.specialEasing[b]||j.opts.easing);return j.tweens.push(d),d},stop:function(b){var c=0,d=b?j.tweens.length:0;if(e)return this;for(e=!0;d>c;c++)j.tweens[c].run(1);return b?(h.notifyWith(a,[j,1,0]),h.resolveWith(a,[j,b])):h.rejectWith(a,[j,b]),this}}),k=j.props;for(pb(k,j.opts.specialEasing);g>f;f++)if(d=qb.prefilters[f].call(j,a,k,j.opts))return n.isFunction(d.stop)&&(n._queueHooks(j.elem,j.opts.queue).stop=n.proxy(d.stop,d)),d;return n.map(k,nb,j),n.isFunction(j.opts.start)&&j.opts.start.call(a,j),n.fx.timer(n.extend(i,{elem:a,anim:j,queue:j.opts.queue})),j.progress(j.opts.progress).done(j.opts.done,j.opts.complete).fail(j.opts.fail).always(j.opts.always)}n.Animation=n.extend(qb,{tweeners:{"*":[function(a,b){var c=this.createTween(a,b);return X(c.elem,a,U.exec(b),c),c}]},tweener:function(a,b){n.isFunction(a)?(b=a,a=["*"]):a=a.match(G);for(var c,d=0,e=a.length;e>d;d++)c=a[d],qb.tweeners[c]=qb.tweeners[c]||[],qb.tweeners[c].unshift(b)},prefilters:[ob],prefilter:function(a,b){b?qb.prefilters.unshift(a):qb.prefilters.push(a)}}),n.speed=function(a,b,c){var d=a&&"object"==typeof a?n.extend({},a):{complete:c||!c&&b||n.isFunction(a)&&a,duration:a,easing:c&&b||b&&!n.isFunction(b)&&b};return d.duration=n.fx.off?0:"number"==typeof d.duration?d.duration:d.duration in n.fx.speeds?n.fx.speeds[d.duration]:n.fx.speeds._default,null!=d.queue&&d.queue!==!0||(d.queue="fx"),d.old=d.complete,d.complete=function(){n.isFunction(d.old)&&d.old.call(this),d.queue&&n.dequeue(this,d.queue)},d},n.fn.extend({fadeTo:function(a,b,c,d){return this.filter(W).css("opacity",0).show().end().animate({opacity:b},a,c,d)},animate:function(a,b,c,d){var e=n.isEmptyObject(a),f=n.speed(b,c,d),g=function(){var b=qb(this,n.extend({},a),f);(e||n._data(this,"finish"))&&b.stop(!0)};return g.finish=g,e||f.queue===!1?this.each(g):this.queue(f.queue,g)},stop:function(a,b,c){var d=function(a){var b=a.stop;delete a.stop,b(c)};return"string"!=typeof a&&(c=b,b=a,a=void 0),b&&a!==!1&&this.queue(a||"fx",[]),this.each(function(){var b=!0,e=null!=a&&a+"queueHooks",f=n.timers,g=n._data(this);if(e)g[e]&&g[e].stop&&d(g[e]);else for(e in g)g[e]&&g[e].stop&&kb.test(e)&&d(g[e]);for(e=f.length;e--;)f[e].elem!==this||null!=a&&f[e].queue!==a||(f[e].anim.stop(c),b=!1,f.splice(e,1));!b&&c||n.dequeue(this,a)})},finish:function(a){return a!==!1&&(a=a||"fx"),this.each(function(){var b,c=n._data(this),d=c[a+"queue"],e=c[a+"queueHooks"],f=n.timers,g=d?d.length:0;for(c.finish=!0,n.queue(this,a,[]),e&&e.stop&&e.stop.call(this,!0),b=f.length;b--;)f[b].elem===this&&f[b].queue===a&&(f[b].anim.stop(!0),f.splice(b,1));for(b=0;g>b;b++)d[b]&&d[b].finish&&d[b].finish.call(this);delete c.finish})}}),n.each(["toggle","show","hide"],function(a,b){var c=n.fn[b];n.fn[b]=function(a,d,e){return null==a||"boolean"==typeof a?c.apply(this,arguments):this.animate(mb(b,!0),a,d,e)}}),n.each({slideDown:mb("show"),slideUp:mb("hide"),slideToggle:mb("toggle"),fadeIn:{opacity:"show"},fadeOut:{opacity:"hide"},fadeToggle:{opacity:"toggle"}},function(a,b){n.fn[a]=function(a,c,d){return this.animate(b,a,c,d)}}),n.timers=[],n.fx.tick=function(){var a,b=n.timers,c=0;for(hb=n.now();c<b.length;c++)a=b[c],a()||b[c]!==a||b.splice(c--,1);b.length||n.fx.stop(),hb=void 0},n.fx.timer=function(a){n.timers.push(a),a()?n.fx.start():n.timers.pop()},n.fx.interval=13,n.fx.start=function(){ib||(ib=a.setInterval(n.fx.tick,n.fx.interval))},n.fx.stop=function(){a.clearInterval(ib),ib=null},n.fx.speeds={slow:600,fast:200,_default:400},n.fn.delay=function(b,c){return b=n.fx?n.fx.speeds[b]||b:b,c=c||"fx",this.queue(c,function(c,d){var e=a.setTimeout(c,b);d.stop=function(){a.clearTimeout(e)}})},function(){var a,b=d.createElement("input"),c=d.createElement("div"),e=d.createElement("select"),f=e.appendChild(d.createElement("option"));c=d.createElement("div"),c.setAttribute("className","t"),c.innerHTML="  <link/><table></table><a href='/a'>a</a><input type='checkbox'/>",a=c.getElementsByTagName("a")[0],b.setAttribute("type","checkbox"),c.appendChild(b),a=c.getElementsByTagName("a")[0],a.style.cssText="top:1px",l.getSetAttribute="t"!==c.className,l.style=/top/.test(a.getAttribute("style")),l.hrefNormalized="/a"===a.getAttribute("href"),l.checkOn=!!b.value,l.optSelected=f.selected,l.enctype=!!d.createElement("form").enctype,e.disabled=!0,l.optDisabled=!f.disabled,b=d.createElement("input"),b.setAttribute("value",""),l.input=""===b.getAttribute("value"),b.value="t",b.setAttribute("type","radio"),l.radioValue="t"===b.value}();var rb=/\r/g,sb=/[\x20\t\r\n\f]+/g;n.fn.extend({val:function(a){var b,c,d,e=this[0];{if(arguments.length)return d=n.isFunction(a),this.each(function(c){var e;1===this.nodeType&&(e=d?a.call(this,c,n(this).val()):a,null==e?e="":"number"==typeof e?e+="":n.isArray(e)&&(e=n.map(e,function(a){return null==a?"":a+""})),b=n.valHooks[this.type]||n.valHooks[this.nodeName.toLowerCase()],b&&"set"in b&&void 0!==b.set(this,e,"value")||(this.value=e))});if(e)return b=n.valHooks[e.type]||n.valHooks[e.nodeName.toLowerCase()],b&&"get"in b&&void 0!==(c=b.get(e,"value"))?c:(c=e.value,"string"==typeof c?c.replace(rb,""):null==c?"":c)}}}),n.extend({valHooks:{option:{get:function(a){var b=n.find.attr(a,"value");return null!=b?b:n.trim(n.text(a)).replace(sb," ")}},select:{get:function(a){for(var b,c,d=a.options,e=a.selectedIndex,f="select-one"===a.type||0>e,g=f?null:[],h=f?e+1:d.length,i=0>e?h:f?e:0;h>i;i++)if(c=d[i],(c.selected||i===e)&&(l.optDisabled?!c.disabled:null===c.getAttribute("disabled"))&&(!c.parentNode.disabled||!n.nodeName(c.parentNode,"optgroup"))){if(b=n(c).val(),f)return b;g.push(b)}return g},set:function(a,b){var c,d,e=a.options,f=n.makeArray(b),g=e.length;while(g--)if(d=e[g],n.inArray(n.valHooks.option.get(d),f)>-1)try{d.selected=c=!0}catch(h){d.scrollHeight}else d.selected=!1;return c||(a.selectedIndex=-1),e}}}}),n.each(["radio","checkbox"],function(){n.valHooks[this]={set:function(a,b){return n.isArray(b)?a.checked=n.inArray(n(a).val(),b)>-1:void 0}},l.checkOn||(n.valHooks[this].get=function(a){return null===a.getAttribute("value")?"on":a.value})});var tb,ub,vb=n.expr.attrHandle,wb=/^(?:checked|selected)$/i,xb=l.getSetAttribute,yb=l.input;n.fn.extend({attr:function(a,b){return Y(this,n.attr,a,b,arguments.length>1)},removeAttr:function(a){return this.each(function(){n.removeAttr(this,a)})}}),n.extend({attr:function(a,b,c){var d,e,f=a.nodeType;if(3!==f&&8!==f&&2!==f)return"undefined"==typeof a.getAttribute?n.prop(a,b,c):(1===f&&n.isXMLDoc(a)||(b=b.toLowerCase(),e=n.attrHooks[b]||(n.expr.match.bool.test(b)?ub:tb)),void 0!==c?null===c?void n.removeAttr(a,b):e&&"set"in e&&void 0!==(d=e.set(a,c,b))?d:(a.setAttribute(b,c+""),c):e&&"get"in e&&null!==(d=e.get(a,b))?d:(d=n.find.attr(a,b),null==d?void 0:d))},attrHooks:{type:{set:function(a,b){if(!l.radioValue&&"radio"===b&&n.nodeName(a,"input")){var c=a.value;return a.setAttribute("type",b),c&&(a.value=c),b}}}},removeAttr:function(a,b){var c,d,e=0,f=b&&b.match(G);if(f&&1===a.nodeType)while(c=f[e++])d=n.propFix[c]||c,n.expr.match.bool.test(c)?yb&&xb||!wb.test(c)?a[d]=!1:a[n.camelCase("default-"+c)]=a[d]=!1:n.attr(a,c,""),a.removeAttribute(xb?c:d)}}),ub={set:function(a,b,c){return b===!1?n.removeAttr(a,c):yb&&xb||!wb.test(c)?a.setAttribute(!xb&&n.propFix[c]||c,c):a[n.camelCase("default-"+c)]=a[c]=!0,c}},n.each(n.expr.match.bool.source.match(/\w+/g),function(a,b){var c=vb[b]||n.find.attr;yb&&xb||!wb.test(b)?vb[b]=function(a,b,d){var e,f;return d||(f=vb[b],vb[b]=e,e=null!=c(a,b,d)?b.toLowerCase():null,vb[b]=f),e}:vb[b]=function(a,b,c){return c?void 0:a[n.camelCase("default-"+b)]?b.toLowerCase():null}}),yb&&xb||(n.attrHooks.value={set:function(a,b,c){return n.nodeName(a,"input")?void(a.defaultValue=b):tb&&tb.set(a,b,c)}}),xb||(tb={set:function(a,b,c){var d=a.getAttributeNode(c);return d||a.setAttributeNode(d=a.ownerDocument.createAttribute(c)),d.value=b+="","value"===c||b===a.getAttribute(c)?b:void 0}},vb.id=vb.name=vb.coords=function(a,b,c){var d;return c?void 0:(d=a.getAttributeNode(b))&&""!==d.value?d.value:null},n.valHooks.button={get:function(a,b){var c=a.getAttributeNode(b);return c&&c.specified?c.value:void 0},set:tb.set},n.attrHooks.contenteditable={set:function(a,b,c){tb.set(a,""===b?!1:b,c)}},n.each(["width","height"],function(a,b){n.attrHooks[b]={set:function(a,c){return""===c?(a.setAttribute(b,"auto"),c):void 0}}})),l.style||(n.attrHooks.style={get:function(a){return a.style.cssText||void 0},set:function(a,b){return a.style.cssText=b+""}});var zb=/^(?:input|select|textarea|button|object)$/i,Ab=/^(?:a|area)$/i;n.fn.extend({prop:function(a,b){return Y(this,n.prop,a,b,arguments.length>1)},removeProp:function(a){return a=n.propFix[a]||a,this.each(function(){try{this[a]=void 0,delete this[a]}catch(b){}})}}),n.extend({prop:function(a,b,c){var d,e,f=a.nodeType;if(3!==f&&8!==f&&2!==f)return 1===f&&n.isXMLDoc(a)||(b=n.propFix[b]||b,e=n.propHooks[b]),void 0!==c?e&&"set"in e&&void 0!==(d=e.set(a,c,b))?d:a[b]=c:e&&"get"in e&&null!==(d=e.get(a,b))?d:a[b]},propHooks:{tabIndex:{get:function(a){var b=n.find.attr(a,"tabindex");return b?parseInt(b,10):zb.test(a.nodeName)||Ab.test(a.nodeName)&&a.href?0:-1}}},propFix:{"for":"htmlFor","class":"className"}}),l.hrefNormalized||n.each(["href","src"],function(a,b){n.propHooks[b]={get:function(a){return a.getAttribute(b,4)}}}),l.optSelected||(n.propHooks.selected={get:function(a){var b=a.parentNode;return b&&(b.selectedIndex,b.parentNode&&b.parentNode.selectedIndex),null},set:function(a){var b=a.parentNode;b&&(b.selectedIndex,b.parentNode&&b.parentNode.selectedIndex)}}),n.each(["tabIndex","readOnly","maxLength","cellSpacing","cellPadding","rowSpan","colSpan","useMap","frameBorder","contentEditable"],function(){n.propFix[this.toLowerCase()]=this}),l.enctype||(n.propFix.enctype="encoding");var Bb=/[\t\r\n\f]/g;function Cb(a){return n.attr(a,"class")||""}n.fn.extend({addClass:function(a){var b,c,d,e,f,g,h,i=0;if(n.isFunction(a))return this.each(function(b){n(this).addClass(a.call(this,b,Cb(this)))});if("string"==typeof a&&a){b=a.match(G)||[];while(c=this[i++])if(e=Cb(c),d=1===c.nodeType&&(" "+e+" ").replace(Bb," ")){g=0;while(f=b[g++])d.indexOf(" "+f+" ")<0&&(d+=f+" ");h=n.trim(d),e!==h&&n.attr(c,"class",h)}}return this},removeClass:function(a){var b,c,d,e,f,g,h,i=0;if(n.isFunction(a))return this.each(function(b){n(this).removeClass(a.call(this,b,Cb(this)))});if(!arguments.length)return this.attr("class","");if("string"==typeof a&&a){b=a.match(G)||[];while(c=this[i++])if(e=Cb(c),d=1===c.nodeType&&(" "+e+" ").replace(Bb," ")){g=0;while(f=b[g++])while(d.indexOf(" "+f+" ")>-1)d=d.replace(" "+f+" "," ");h=n.trim(d),e!==h&&n.attr(c,"class",h)}}return this},toggleClass:function(a,b){var c=typeof a;return"boolean"==typeof b&&"string"===c?b?this.addClass(a):this.removeClass(a):n.isFunction(a)?this.each(function(c){n(this).toggleClass(a.call(this,c,Cb(this),b),b)}):this.each(function(){var b,d,e,f;if("string"===c){d=0,e=n(this),f=a.match(G)||[];while(b=f[d++])e.hasClass(b)?e.removeClass(b):e.addClass(b)}else void 0!==a&&"boolean"!==c||(b=Cb(this),b&&n._data(this,"__className__",b),n.attr(this,"class",b||a===!1?"":n._data(this,"__className__")||""))})},hasClass:function(a){var b,c,d=0;b=" "+a+" ";while(c=this[d++])if(1===c.nodeType&&(" "+Cb(c)+" ").replace(Bb," ").indexOf(b)>-1)return!0;return!1}}),n.each("blur focus focusin focusout load resize scroll unload click dblclick mousedown mouseup mousemove mouseover mouseout mouseenter mouseleave change select submit keydown keypress keyup error contextmenu".split(" "),function(a,b){n.fn[b]=function(a,c){return arguments.length>0?this.on(b,null,a,c):this.trigger(b)}}),n.fn.extend({hover:function(a,b){return this.mouseenter(a).mouseleave(b||a)}});var Db=a.location,Eb=n.now(),Fb=/\?/,Gb=/(,)|(\[|{)|(}|])|"(?:[^"\\\r\n]|\\["\\\/bfnrt]|\\u[\da-fA-F]{4})*"\s*:?|true|false|null|-?(?!0\d)\d+(?:\.\d+|)(?:[eE][+-]?\d+|)/g;n.parseJSON=function(b){if(a.JSON&&a.JSON.parse)return a.JSON.parse(b+"");var c,d=null,e=n.trim(b+"");return e&&!n.trim(e.replace(Gb,function(a,b,e,f){return c&&b&&(d=0),0===d?a:(c=e||b,d+=!f-!e,"")}))?Function("return "+e)():n.error("Invalid JSON: "+b)},n.parseXML=function(b){var c,d;if(!b||"string"!=typeof b)return null;try{a.DOMParser?(d=new a.DOMParser,c=d.parseFromString(b,"text/xml")):(c=new a.ActiveXObject("Microsoft.XMLDOM"),c.async="false",c.loadXML(b))}catch(e){c=void 0}return c&&c.documentElement&&!c.getElementsByTagName("parsererror").length||n.error("Invalid XML: "+b),c};var Hb=/#.*$/,Ib=/([?&])_=[^&]*/,Jb=/^(.*?):[ \t]*([^\r\n]*)\r?$/gm,Kb=/^(?:about|app|app-storage|.+-extension|file|res|widget):$/,Lb=/^(?:GET|HEAD)$/,Mb=/^\/\//,Nb=/^([\w.+-]+:)(?:\/\/(?:[^\/?#]*@|)([^\/?#:]*)(?::(\d+)|)|)/,Ob={},Pb={},Qb="*/".concat("*"),Rb=Db.href,Sb=Nb.exec(Rb.toLowerCase())||[];function Tb(a){return function(b,c){"string"!=typeof b&&(c=b,b="*");var d,e=0,f=b.toLowerCase().match(G)||[];if(n.isFunction(c))while(d=f[e++])"+"===d.charAt(0)?(d=d.slice(1)||"*",(a[d]=a[d]||[]).unshift(c)):(a[d]=a[d]||[]).push(c)}}function Ub(a,b,c,d){var e={},f=a===Pb;function g(h){var i;return e[h]=!0,n.each(a[h]||[],function(a,h){var j=h(b,c,d);return"string"!=typeof j||f||e[j]?f?!(i=j):void 0:(b.dataTypes.unshift(j),g(j),!1)}),i}return g(b.dataTypes[0])||!e["*"]&&g("*")}function Vb(a,b){var c,d,e=n.ajaxSettings.flatOptions||{};for(d in b)void 0!==b[d]&&((e[d]?a:c||(c={}))[d]=b[d]);return c&&n.extend(!0,a,c),a}function Wb(a,b,c){var d,e,f,g,h=a.contents,i=a.dataTypes;while("*"===i[0])i.shift(),void 0===e&&(e=a.mimeType||b.getResponseHeader("Content-Type"));if(e)for(g in h)if(h[g]&&h[g].test(e)){i.unshift(g);break}if(i[0]in c)f=i[0];else{for(g in c){if(!i[0]||a.converters[g+" "+i[0]]){f=g;break}d||(d=g)}f=f||d}return f?(f!==i[0]&&i.unshift(f),c[f]):void 0}function Xb(a,b,c,d){var e,f,g,h,i,j={},k=a.dataTypes.slice();if(k[1])for(g in a.converters)j[g.toLowerCase()]=a.converters[g];f=k.shift();while(f)if(a.responseFields[f]&&(c[a.responseFields[f]]=b),!i&&d&&a.dataFilter&&(b=a.dataFilter(b,a.dataType)),i=f,f=k.shift())if("*"===f)f=i;else if("*"!==i&&i!==f){if(g=j[i+" "+f]||j["* "+f],!g)for(e in j)if(h=e.split(" "),h[1]===f&&(g=j[i+" "+h[0]]||j["* "+h[0]])){g===!0?g=j[e]:j[e]!==!0&&(f=h[0],k.unshift(h[1]));break}if(g!==!0)if(g&&a["throws"])b=g(b);else try{b=g(b)}catch(l){return{state:"parsererror",error:g?l:"No conversion from "+i+" to "+f}}}return{state:"success",data:b}}n.extend({active:0,lastModified:{},etag:{},ajaxSettings:{url:Rb,type:"GET",isLocal:Kb.test(Sb[1]),global:!0,processData:!0,async:!0,contentType:"application/x-www-form-urlencoded; charset=UTF-8",accepts:{"*":Qb,text:"text/plain",html:"text/html",xml:"application/xml, text/xml",json:"application/json, text/javascript"},contents:{xml:/\bxml\b/,html:/\bhtml/,json:/\bjson\b/},responseFields:{xml:"responseXML",text:"responseText",json:"responseJSON"},converters:{"* text":String,"text html":!0,"text json":n.parseJSON,"text xml":n.parseXML},flatOptions:{url:!0,context:!0}},ajaxSetup:function(a,b){return b?Vb(Vb(a,n.ajaxSettings),b):Vb(n.ajaxSettings,a)},ajaxPrefilter:Tb(Ob),ajaxTransport:Tb(Pb),ajax:function(b,c){"object"==typeof b&&(c=b,b=void 0),c=c||{};var d,e,f,g,h,i,j,k,l=n.ajaxSetup({},c),m=l.context||l,o=l.context&&(m.nodeType||m.jquery)?n(m):n.event,p=n.Deferred(),q=n.Callbacks("once memory"),r=l.statusCode||{},s={},t={},u=0,v="canceled",w={readyState:0,getResponseHeader:function(a){var b;if(2===u){if(!k){k={};while(b=Jb.exec(g))k[b[1].toLowerCase()]=b[2]}b=k[a.toLowerCase()]}return null==b?null:b},getAllResponseHeaders:function(){return 2===u?g:null},setRequestHeader:function(a,b){var c=a.toLowerCase();return u||(a=t[c]=t[c]||a,s[a]=b),this},overrideMimeType:function(a){return u||(l.mimeType=a),this},statusCode:function(a){var b;if(a)if(2>u)for(b in a)r[b]=[r[b],a[b]];else w.always(a[w.status]);return this},abort:function(a){var b=a||v;return j&&j.abort(b),y(0,b),this}};if(p.promise(w).complete=q.add,w.success=w.done,w.error=w.fail,l.url=((b||l.url||Rb)+"").replace(Hb,"").replace(Mb,Sb[1]+"//"),l.type=c.method||c.type||l.method||l.type,l.dataTypes=n.trim(l.dataType||"*").toLowerCase().match(G)||[""],null==l.crossDomain&&(d=Nb.exec(l.url.toLowerCase()),l.crossDomain=!(!d||d[1]===Sb[1]&&d[2]===Sb[2]&&(d[3]||("http:"===d[1]?"80":"443"))===(Sb[3]||("http:"===Sb[1]?"80":"443")))),l.data&&l.processData&&"string"!=typeof l.data&&(l.data=n.param(l.data,l.traditional)),Ub(Ob,l,c,w),2===u)return w;i=n.event&&l.global,i&&0===n.active++&&n.event.trigger("ajaxStart"),l.type=l.type.toUpperCase(),l.hasContent=!Lb.test(l.type),f=l.url,l.hasContent||(l.data&&(f=l.url+=(Fb.test(f)?"&":"?")+l.data,delete l.data),l.cache===!1&&(l.url=Ib.test(f)?f.replace(Ib,"$1_="+Eb++):f+(Fb.test(f)?"&":"?")+"_="+Eb++)),l.ifModified&&(n.lastModified[f]&&w.setRequestHeader("If-Modified-Since",n.lastModified[f]),n.etag[f]&&w.setRequestHeader("If-None-Match",n.etag[f])),(l.data&&l.hasContent&&l.contentType!==!1||c.contentType)&&w.setRequestHeader("Content-Type",l.contentType),w.setRequestHeader("Accept",l.dataTypes[0]&&l.accepts[l.dataTypes[0]]?l.accepts[l.dataTypes[0]]+("*"!==l.dataTypes[0]?", "+Qb+"; q=0.01":""):l.accepts["*"]);for(e in l.headers)w.setRequestHeader(e,l.headers[e]);if(l.beforeSend&&(l.beforeSend.call(m,w,l)===!1||2===u))return w.abort();v="abort";for(e in{success:1,error:1,complete:1})w[e](l[e]);if(j=Ub(Pb,l,c,w)){if(w.readyState=1,i&&o.trigger("ajaxSend",[w,l]),2===u)return w;l.async&&l.timeout>0&&(h=a.setTimeout(function(){w.abort("timeout")},l.timeout));try{u=1,j.send(s,y)}catch(x){if(!(2>u))throw x;y(-1,x)}}else y(-1,"No Transport");function y(b,c,d,e){var k,s,t,v,x,y=c;2!==u&&(u=2,h&&a.clearTimeout(h),j=void 0,g=e||"",w.readyState=b>0?4:0,k=b>=200&&300>b||304===b,d&&(v=Wb(l,w,d)),v=Xb(l,v,w,k),k?(l.ifModified&&(x=w.getResponseHeader("Last-Modified"),x&&(n.lastModified[f]=x),x=w.getResponseHeader("etag"),x&&(n.etag[f]=x)),204===b||"HEAD"===l.type?y="nocontent":304===b?y="notmodified":(y=v.state,s=v.data,t=v.error,k=!t)):(t=y,!b&&y||(y="error",0>b&&(b=0))),w.status=b,w.statusText=(c||y)+"",k?p.resolveWith(m,[s,y,w]):p.rejectWith(m,[w,y,t]),w.statusCode(r),r=void 0,i&&o.trigger(k?"ajaxSuccess":"ajaxError",[w,l,k?s:t]),q.fireWith(m,[w,y]),i&&(o.trigger("ajaxComplete",[w,l]),--n.active||n.event.trigger("ajaxStop")))}return w},getJSON:function(a,b,c){return n.get(a,b,c,"json")},getScript:function(a,b){return n.get(a,void 0,b,"script")}}),n.each(["get","post"],function(a,b){n[b]=function(a,c,d,e){return n.isFunction(c)&&(e=e||d,d=c,c=void 0),n.ajax(n.extend({url:a,type:b,dataType:e,data:c,success:d},n.isPlainObject(a)&&a))}}),n._evalUrl=function(a){return n.ajax({url:a,type:"GET",dataType:"script",cache:!0,async:!1,global:!1,"throws":!0})},n.fn.extend({wrapAll:function(a){if(n.isFunction(a))return this.each(function(b){n(this).wrapAll(a.call(this,b))});if(this[0]){var b=n(a,this[0].ownerDocument).eq(0).clone(!0);this[0].parentNode&&b.insertBefore(this[0]),b.map(function(){var a=this;while(a.firstChild&&1===a.firstChild.nodeType)a=a.firstChild;return a}).append(this)}return this},wrapInner:function(a){return n.isFunction(a)?this.each(function(b){n(this).wrapInner(a.call(this,b))}):this.each(function(){var b=n(this),c=b.contents();c.length?c.wrapAll(a):b.append(a)})},wrap:function(a){var b=n.isFunction(a);return this.each(function(c){n(this).wrapAll(b?a.call(this,c):a)})},unwrap:function(){return this.parent().each(function(){n.nodeName(this,"body")||n(this).replaceWith(this.childNodes)}).end()}});function Yb(a){return a.style&&a.style.display||n.css(a,"display")}function Zb(a){if(!n.contains(a.ownerDocument||d,a))return!0;while(a&&1===a.nodeType){if("none"===Yb(a)||"hidden"===a.type)return!0;a=a.parentNode}return!1}n.expr.filters.hidden=function(a){return l.reliableHiddenOffsets()?a.offsetWidth<=0&&a.offsetHeight<=0&&!a.getClientRects().length:Zb(a)},n.expr.filters.visible=function(a){return!n.expr.filters.hidden(a)};var $b=/%20/g,_b=/\[\]$/,ac=/\r?\n/g,bc=/^(?:submit|button|image|reset|file)$/i,cc=/^(?:input|select|textarea|keygen)/i;function dc(a,b,c,d){var e;if(n.isArray(b))n.each(b,function(b,e){c||_b.test(a)?d(a,e):dc(a+"["+("object"==typeof e&&null!=e?b:"")+"]",e,c,d)});else if(c||"object"!==n.type(b))d(a,b);else for(e in b)dc(a+"["+e+"]",b[e],c,d)}n.param=function(a,b){var c,d=[],e=function(a,b){b=n.isFunction(b)?b():null==b?"":b,d[d.length]=encodeURIComponent(a)+"="+encodeURIComponent(b)};if(void 0===b&&(b=n.ajaxSettings&&n.ajaxSettings.traditional),n.isArray(a)||a.jquery&&!n.isPlainObject(a))n.each(a,function(){e(this.name,this.value)});else for(c in a)dc(c,a[c],b,e);return d.join("&").replace($b,"+")},n.fn.extend({serialize:function(){return n.param(this.serializeArray())},serializeArray:function(){return this.map(function(){var a=n.prop(this,"elements");return a?n.makeArray(a):this}).filter(function(){var a=this.type;return this.name&&!n(this).is(":disabled")&&cc.test(this.nodeName)&&!bc.test(a)&&(this.checked||!Z.test(a))}).map(function(a,b){var c=n(this).val();return null==c?null:n.isArray(c)?n.map(c,function(a){return{name:b.name,value:a.replace(ac,"\r\n")}}):{name:b.name,value:c.replace(ac,"\r\n")}}).get()}}),n.ajaxSettings.xhr=void 0!==a.ActiveXObject?function(){return this.isLocal?ic():d.documentMode>8?hc():/^(get|post|head|put|delete|options)$/i.test(this.type)&&hc()||ic()}:hc;var ec=0,fc={},gc=n.ajaxSettings.xhr();a.attachEvent&&a.attachEvent("onunload",function(){for(var a in fc)fc[a](void 0,!0)}),l.cors=!!gc&&"withCredentials"in gc,gc=l.ajax=!!gc,gc&&n.ajaxTransport(function(b){if(!b.crossDomain||l.cors){var c;return{send:function(d,e){var f,g=b.xhr(),h=++ec;if(g.open(b.type,b.url,b.async,b.username,b.password),b.xhrFields)for(f in b.xhrFields)g[f]=b.xhrFields[f];b.mimeType&&g.overrideMimeType&&g.overrideMimeType(b.mimeType),b.crossDomain||d["X-Requested-With"]||(d["X-Requested-With"]="XMLHttpRequest");for(f in d)void 0!==d[f]&&g.setRequestHeader(f,d[f]+"");g.send(b.hasContent&&b.data||null),c=function(a,d){var f,i,j;if(c&&(d||4===g.readyState))if(delete fc[h],c=void 0,g.onreadystatechange=n.noop,d)4!==g.readyState&&g.abort();else{j={},f=g.status,"string"==typeof g.responseText&&(j.text=g.responseText);try{i=g.statusText}catch(k){i=""}f||!b.isLocal||b.crossDomain?1223===f&&(f=204):f=j.text?200:404}j&&e(f,i,j,g.getAllResponseHeaders())},b.async?4===g.readyState?a.setTimeout(c):g.onreadystatechange=fc[h]=c:c()},abort:function(){c&&c(void 0,!0)}}}});function hc(){try{return new a.XMLHttpRequest}catch(b){}}function ic(){try{return new a.ActiveXObject("Microsoft.XMLHTTP")}catch(b){}}n.ajaxSetup({accepts:{script:"text/javascript, application/javascript, application/ecmascript, application/x-ecmascript"},contents:{script:/\b(?:java|ecma)script\b/},converters:{"text script":function(a){return n.globalEval(a),a}}}),n.ajaxPrefilter("script",function(a){void 0===a.cache&&(a.cache=!1),a.crossDomain&&(a.type="GET",a.global=!1)}),n.ajaxTransport("script",function(a){if(a.crossDomain){var b,c=d.head||n("head")[0]||d.documentElement;return{send:function(e,f){b=d.createElement("script"),b.async=!0,a.scriptCharset&&(b.charset=a.scriptCharset),b.src=a.url,b.onload=b.onreadystatechange=function(a,c){(c||!b.readyState||/loaded|complete/.test(b.readyState))&&(b.onload=b.onreadystatechange=null,b.parentNode&&b.parentNode.removeChild(b),b=null,c||f(200,"success"))},c.insertBefore(b,c.firstChild)},abort:function(){b&&b.onload(void 0,!0)}}}});var jc=[],kc=/(=)\?(?=&|$)|\?\?/;n.ajaxSetup({jsonp:"callback",jsonpCallback:function(){var a=jc.pop()||n.expando+"_"+Eb++;return this[a]=!0,a}}),n.ajaxPrefilter("json jsonp",function(b,c,d){var e,f,g,h=b.jsonp!==!1&&(kc.test(b.url)?"url":"string"==typeof b.data&&0===(b.contentType||"").indexOf("application/x-www-form-urlencoded")&&kc.test(b.data)&&"data");return h||"jsonp"===b.dataTypes[0]?(e=b.jsonpCallback=n.isFunction(b.jsonpCallback)?b.jsonpCallback():b.jsonpCallback,h?b[h]=b[h].replace(kc,"$1"+e):b.jsonp!==!1&&(b.url+=(Fb.test(b.url)?"&":"?")+b.jsonp+"="+e),b.converters["script json"]=function(){return g||n.error(e+" was not called"),g[0]},b.dataTypes[0]="json",f=a[e],a[e]=function(){g=arguments},d.always(function(){void 0===f?n(a).removeProp(e):a[e]=f,b[e]&&(b.jsonpCallback=c.jsonpCallback,jc.push(e)),g&&n.isFunction(f)&&f(g[0]),g=f=void 0}),"script"):void 0}),n.parseHTML=function(a,b,c){if(!a||"string"!=typeof a)return null;"boolean"==typeof b&&(c=b,b=!1),b=b||d;var e=x.exec(a),f=!c&&[];return e?[b.createElement(e[1])]:(e=ja([a],b,f),f&&f.length&&n(f).remove(),n.merge([],e.childNodes))};var lc=n.fn.load;n.fn.load=function(a,b,c){if("string"!=typeof a&&lc)return lc.apply(this,arguments);var d,e,f,g=this,h=a.indexOf(" ");return h>-1&&(d=n.trim(a.slice(h,a.length)),a=a.slice(0,h)),n.isFunction(b)?(c=b,b=void 0):b&&"object"==typeof b&&(e="POST"),g.length>0&&n.ajax({url:a,type:e||"GET",dataType:"html",data:b}).done(function(a){f=arguments,g.html(d?n("<div>").append(n.parseHTML(a)).find(d):a)}).always(c&&function(a,b){g.each(function(){c.apply(this,f||[a.responseText,b,a])})}),this},n.each(["ajaxStart","ajaxStop","ajaxComplete","ajaxError","ajaxSuccess","ajaxSend"],function(a,b){n.fn[b]=function(a){return this.on(b,a)}}),n.expr.filters.animated=function(a){return n.grep(n.timers,function(b){return a===b.elem}).length};function mc(a){return n.isWindow(a)?a:9===a.nodeType?a.defaultView||a.parentWindow:!1}n.offset={setOffset:function(a,b,c){var d,e,f,g,h,i,j,k=n.css(a,"position"),l=n(a),m={};"static"===k&&(a.style.position="relative"),h=l.offset(),f=n.css(a,"top"),i=n.css(a,"left"),j=("absolute"===k||"fixed"===k)&&n.inArray("auto",[f,i])>-1,j?(d=l.position(),g=d.top,e=d.left):(g=parseFloat(f)||0,e=parseFloat(i)||0),n.isFunction(b)&&(b=b.call(a,c,n.extend({},h))),null!=b.top&&(m.top=b.top-h.top+g),null!=b.left&&(m.left=b.left-h.left+e),"using"in b?b.using.call(a,m):l.css(m)}},n.fn.extend({offset:function(a){if(arguments.length)return void 0===a?this:this.each(function(b){n.offset.setOffset(this,a,b)});var b,c,d={top:0,left:0},e=this[0],f=e&&e.ownerDocument;if(f)return b=f.documentElement,n.contains(b,e)?("undefined"!=typeof e.getBoundingClientRect&&(d=e.getBoundingClientRect()),c=mc(f),{top:d.top+(c.pageYOffset||b.scrollTop)-(b.clientTop||0),left:d.left+(c.pageXOffset||b.scrollLeft)-(b.clientLeft||0)}):d},position:function(){if(this[0]){var a,b,c={top:0,left:0},d=this[0];return"fixed"===n.css(d,"position")?b=d.getBoundingClientRect():(a=this.offsetParent(),b=this.offset(),n.nodeName(a[0],"html")||(c=a.offset()),c.top+=n.css(a[0],"borderTopWidth",!0),c.left+=n.css(a[0],"borderLeftWidth",!0)),{top:b.top-c.top-n.css(d,"marginTop",!0),left:b.left-c.left-n.css(d,"marginLeft",!0)}}},offsetParent:function(){return this.map(function(){var a=this.offsetParent;while(a&&!n.nodeName(a,"html")&&"static"===n.css(a,"position"))a=a.offsetParent;return a||Qa})}}),n.each({scrollLeft:"pageXOffset",scrollTop:"pageYOffset"},function(a,b){var c=/Y/.test(b);n.fn[a]=function(d){return Y(this,function(a,d,e){var f=mc(a);return void 0===e?f?b in f?f[b]:f.document.documentElement[d]:a[d]:void(f?f.scrollTo(c?n(f).scrollLeft():e,c?e:n(f).scrollTop()):a[d]=e)},a,d,arguments.length,null)}}),n.each(["top","left"],function(a,b){n.cssHooks[b]=Ua(l.pixelPosition,function(a,c){return c?(c=Sa(a,b),Oa.test(c)?n(a).position()[b]+"px":c):void 0})}),n.each({Height:"height",Width:"width"},function(a,b){n.each({
padding:"inner"+a,content:b,"":"outer"+a},function(c,d){n.fn[d]=function(d,e){var f=arguments.length&&(c||"boolean"!=typeof d),g=c||(d===!0||e===!0?"margin":"border");return Y(this,function(b,c,d){var e;return n.isWindow(b)?b.document.documentElement["client"+a]:9===b.nodeType?(e=b.documentElement,Math.max(b.body["scroll"+a],e["scroll"+a],b.body["offset"+a],e["offset"+a],e["client"+a])):void 0===d?n.css(b,c,g):n.style(b,c,d,g)},b,f?d:void 0,f,null)}})}),n.fn.extend({bind:function(a,b,c){return this.on(a,null,b,c)},unbind:function(a,b){return this.off(a,null,b)},delegate:function(a,b,c,d){return this.on(b,a,c,d)},undelegate:function(a,b,c){return 1===arguments.length?this.off(a,"**"):this.off(b,a||"**",c)}}),n.fn.size=function(){return this.length},n.fn.andSelf=n.fn.addBack,"function"==typeof define&&define.amd&&define("jquery",[],function(){return n});var nc=a.jQuery,oc=a.$;return n.noConflict=function(b){return a.$===n&&(a.$=oc),b&&a.jQuery===n&&(a.jQuery=nc),n},b||(a.jQuery=a.$=n),n});
/**
 * MathQuill v0.10.1               http://mathquill.com
 * by Han, Jeanine, and Mary  maintainers@mathquill.com
 *
 * This Source Code Form is subject to the terms of the
 * Mozilla Public License, v. 2.0. If a copy of the MPL
 * was not distributed with this file, You can obtain
 * one at http://mozilla.org/MPL/2.0/.
 */
!function(){function t(){}function e(t){var e=t.length-1;return function(){var n=kt.call(arguments,0,e),i=kt.call(arguments,e);return t.apply(this,n.concat([i]))}}function n(t){return e(function(e,n){"function"!=typeof e&&(e=jt(e));var i=function(t){return e.apply(t,[t].concat(n))};return t.call(this,i)})}function i(t){var e=kt.call(arguments,1);return function(){return t.apply(this,e)}}function s(t,e){if(!e)throw new Error("prayer failed: "+t)}function r(t){s("a direction was passed",t===Tt||t===Ct)}function o(t,e,n){s("a parent is always present",t),s("leftward is properly set up",function(){return e?e[Ct]===n&&e.parent===t:t.ends[Tt]===n}()),s("rightward is properly set up",function(){return n?n[Tt]===e&&n.parent===t:t.ends[Ct]===e}())}function a(){window.console&&console.warn('You are using the MathQuill API without specifying an interface version, which will fail in v1.0.0. Easiest fix is to do the following before doing anything else:\n\n    MathQuill = MathQuill.getInterface(1);\n    // now MathQuill.MathField() works like it used to\n\nSee also the "`dev` branch (2014–2015) → v0.10.0 Migration Guide" at\n  https://github.com/mathquill/mathquill/wiki/%60dev%60-branch-(2014%E2%80%932015)-%E2%86%92-v0.10.0-Migration-Guide')}function l(t){return a(),bt(t)}function c(e){function n(t){var e,n;return t&&t.nodeType?(e=_t(t).children(".mq-root-block").attr(xt),n=e&&St.byId[e].controller,n?s[n.KIND_OF_MQ](n):null):null}function i(t,e){var n,i,r;e&&e.handlers&&(e.handlers={fns:e.handlers,APIClasses:s});for(n in e)e.hasOwnProperty(n)&&(i=e[n],r=Ft[n],t[n]=r?r(i):i)}var s,r,o;if(!(e>=g&&b>=e))throw"Only interface versions between "+g+" and "+b+" supported. You specified: "+e;s={},n.L=Tt,n.R=Ct,n.config=function(t){return i(Bt.p,t),this},n.registerEmbed=function(t,e){if(!/^[a-z][a-z0-9]*$/i.test(t))throw"Embed name must start with letter and be only letters and digits";Nt[t]=e},r=s.AbstractMathQuill=Qt($t,function(t){t.init=function(t){this.__controller=t,this.__options=t.options,this.id=t.id,this.data=t.data},t.__mathquillify=function(t){var e,n=this.__controller,i=n.root,s=n.container;n.createTextarea(),e=s.addClass(t).contents().detach(),i.jQ=_t('<span class="mq-root-block"/>').attr(xt,i.id).appendTo(s),this.latex(e.text()),this.revert=function(){return s.empty().unbind(".mathquill").removeClass("mq-editable-field mq-math-mode mq-text-mode").append(e)}},t.config=function(t){return i(this.__options,t),this},t.el=function(){return this.__controller.container[0]},t.text=function(){return this.__controller.exportText()},t.latex=function(t){return arguments.length>0?(this.__controller.renderLatexMath(t),this.__controller.blurred&&this.__controller.cursor.hide().parent.blur(),this):this.__controller.exportLatex()},t.html=function(){return this.__controller.root.jQ.html().replace(/ mathquill-(?:command|block)-id="?\d+"?/g,"").replace(/<span class="?mq-cursor( mq-blink)?"?>.?<\/span>/i,"").replace(/ mq-hasCursor|mq-hasCursor ?/,"").replace(/ class=(""|(?= |>))/g,"")},t.reflow=function(){return this.__controller.root.postOrder("reflow"),this}}),n.prototype=r.prototype,s.EditableField=Qt(r,function(e,n){e.__mathquillify=function(){return n.__mathquillify.apply(this,arguments),this.__controller.editable=!0,this.__controller.delegateMouseEvents(),this.__controller.editablesTextareaEvents(),this},e.focus=function(){return this.__controller.textarea.focus(),this},e.blur=function(){return this.__controller.textarea.blur(),this},e.write=function(t){return this.__controller.writeLatex(t),this.__controller.scrollHoriz(),this.__controller.blurred&&this.__controller.cursor.hide().parent.blur(),this},e.cmd=function(t){var e,n=this.__controller.notify(),i=n.cursor;return/^\\[a-z]+$/i.test(t)?(t=t.slice(1),e=Et[t],e&&(t=e(t),i.selection&&t.replaces(i.replaceSelection()),t.createLeftOf(i.show()),this.__controller.scrollHoriz())):i.parent.write(i,t),n.blurred&&i.hide().parent.blur(),this},e.select=function(){var t=this.__controller;for(t.notify("move").cursor.insAtRightEnd(t.root);t.cursor[Tt];)t.selectLeft();return this},e.clearSelection=function(){return this.__controller.cursor.clearSelection(),this},e.moveToDirEnd=function(t){return this.__controller.notify("move").cursor.insAtDirEnd(t,this.__controller.root),this},e.moveToLeftEnd=function(){return this.moveToDirEnd(Tt)},e.moveToRightEnd=function(){return this.moveToDirEnd(Ct)},e.keystroke=function(e){var n;for(e=e.replace(/^\s+|\s+$/g,"").split(/\s+/),n=0;n<e.length;n+=1)this.__controller.keystroke(e[n],{preventDefault:t});return this},e.typedText=function(t){for(var e=0;e<t.length;e+=1)this.__controller.typedText(t.charAt(e));return this},e.dropEmbedded=function(t,e,n){var i,s=t-_t(window).scrollLeft(),r=e-_t(window).scrollTop(),o=document.elementFromPoint(s,r);this.__controller.seek(_t(o),t,e),i=mt().setOptions(n),i.createLeftOf(this.__controller.cursor)},e.clickAt=function(t,e,n){n=n||document.elementFromPoint(t,e);var i=this.__controller,s=i.root;return wt.contains(s.jQ[0],n)||(n=s.jQ[0]),i.seek(_t(n),t+pageXOffset,e+pageYOffset),i.blurred&&this.focus(),this},e.ignoreNextMousedown=function(t){return this.__controller.cursor.options.ignoreNextMousedown=t,this}}),n.EditableField=function(){throw"wtf don't call me, I'm 'abstract'"},n.EditableField.prototype=s.EditableField.prototype;for(o in Mt)(function(t,i){var r=s[t]=i(s);n[t]=function(i,s){var o,a=n(i);return a instanceof r||!i||!i.nodeType?a:(o=zt(r.RootBlock(),_t(i),Bt()),o.KIND_OF_MQ=t,r(o).__mathquillify(s,e))},n[t].prototype=r.prototype})(o,Mt[o]);return n}function u(t){var e,n="moveOutOf deleteOutOf selectOutOf upOutOf downOutOf".split(" ");for(e=0;e<n.length;e+=1)(function(e){t[e]=function(t){this.controller.handle(e,t)}})(n[e]);t.reflow=function(){this.controller.handle("reflow"),this.controller.handle("edited"),this.controller.handle("edit")}}function h(t,e,n){return Qt(_,{ctrlSeq:t,htmlTemplate:"<"+e+" "+n+">&0</"+e+">"})}function f(t){var e=this.parent,n=t;do{if(n[Ct])return t.insLeftOf(e);n=n.parent.parent}while(n!==e);t.insRightOf(e)}function p(t,e){t.jQadd=function(){e.jQadd.apply(this,arguments),this.delimjQs=this.jQ.children(":first").add(this.jQ.children(":last")),this.contentjQ=this.jQ.children(":eq(1)")},t.reflow=function(){var t=this.contentjQ.outerHeight()/parseFloat(this.contentjQ.css("fontSize"));K(this.delimjQs,yt(1+.2*(t-1),1.2),1.2*t)}}function d(t,e){var e=e||t,n=ft[t],s=ft[e];At[t]=i(ht,Tt,t,n,e,s),At[n]=i(ht,Ct,t,n,e,s)}var m,g,b,v,w,q,x,y,O,k,j,Q,T,C,_,D,S,L,E,A,R,I,z,M,B,F,$,N,P,U,W,H,G,K,Y,X,Z,V,J,tt,et,nt,it,st,rt,ot,at,lt,ct,ut,ht,ft,pt,dt,mt,gt,bt,vt,wt=window.jQuery,qt="mathquill-command-id",xt="mathquill-block-id",yt=Math.min,Ot=Math.max,kt=[].slice,jt=e(function(t,n){return e(function(e,i){return t in e?e[t].apply(e,n.concat(i)):void 0})}),Qt=function(t,e,n){function i(t){return"object"==typeof t}function s(t){return"function"==typeof t}function r(){}return function o(a,l){function c(){var t=new u;return s(t.init)&&t.init.apply(t,arguments),t}function u(){}var h,f,p;return l===n&&(l=a,a=Object),c.Bare=u,h=r[t]=a[t],f=u[t]=c[t]=c.p=new r,f.constructor=c,c.extend=function(t){return o(c,t)},(c.open=function(t){if(p={},s(t)?p=t.call(c,f,h,c,a):i(t)&&(p=t),i(p))for(var n in p)e.call(p,n)&&(f[n]=p[n]);return s(f.init)||(f.init=a),c})(l)}}("prototype",{}.hasOwnProperty),Tt=-1,Ct=1,_t=Qt(wt,function(t){t.insDirOf=function(t,e){return t===Tt?this.insertBefore(e.first()):this.insertAfter(e.last())},t.insAtDirEnd=function(t,e){return t===Tt?this.prependTo(e):this.appendTo(e)}}),Dt=Qt(function(t){t.parent=0,t[Tt]=0,t[Ct]=0,t.init=function(t,e,n){this.parent=t,this[Tt]=e,this[Ct]=n},this.copy=function(t){return Dt(t.parent,t[Tt],t[Ct])}}),St=Qt(function(t){function e(){return i+=1}t[Tt]=0,t[Ct]=0,t.parent=0;var i=0;this.byId={},t.init=function(){this.id=e(),St.byId[this.id]=this,this.ends={},this.ends[Tt]=0,this.ends[Ct]=0},t.dispose=function(){delete St.byId[this.id]},t.toString=function(){return"{{ MathQuill Node #"+this.id+" }}"},t.jQ=_t(),t.jQadd=function(t){return this.jQ=this.jQ.add(t)},t.jQize=function(t){function e(t){var n,i;for(t.getAttribute&&(n=t.getAttribute("mathquill-command-id"),i=t.getAttribute("mathquill-block-id"),n&&St.byId[n].jQadd(t),i&&St.byId[i].jQadd(t)),t=t.firstChild;t;t=t.nextSibling)e(t)}var n;for(t=_t(t||this.html()),n=0;n<t.length;n+=1)e(t[n]);return t},t.createDir=function(t,e){r(t);var n=this;return n.jQize(),n.jQ.insDirOf(t,e.jQ),e[t]=n.adopt(e.parent,e[Tt],e[Ct]),n},t.createLeftOf=function(t){return this.createDir(Tt,t)},t.selectChildren=function(t,e){return It(t,e)},t.bubble=n(function(t){var e,n;for(e=this;e&&(n=t(e),n!==!1);e=e.parent);return this}),t.postOrder=n(function(t){return function e(n){n.eachChild(e),t(n)}(this),this}),t.isEmpty=function(){return 0===this.ends[Tt]&&0===this.ends[Ct]},t.children=function(){return Lt(this.ends[Tt],this.ends[Ct])},t.eachChild=function(){var t=this.children();return t.each.apply(t,arguments),this},t.foldChildren=function(t,e){return this.children().fold(t,e)},t.withDirAdopt=function(t,e,n,i){return Lt(this,this).withDirAdopt(t,e,n,i),this},t.adopt=function(t,e,n){return Lt(this,this).adopt(t,e,n),this},t.disown=function(){return Lt(this,this).disown(),this},t.remove=function(){return this.jQ.remove(),this.postOrder("dispose"),this.disown()}}),Lt=Qt(function(t){t.init=function(t,e,n){if(n===m&&(n=Tt),r(n),s("no half-empty fragments",!t==!e),this.ends={},t){s("withDir is passed to Fragment",t instanceof St),s("oppDir is passed to Fragment",e instanceof St),s("withDir and oppDir have the same parent",t.parent===e.parent),this.ends[n]=t,this.ends[-n]=e;var i=this.fold([],function(t,e){return t.push.apply(t,e.jQ.get()),t});this.jQ=this.jQ.add(i)}},t.jQ=_t(),t.withDirAdopt=function(t,e,n,i){return t===Tt?this.adopt(e,n,i):this.adopt(e,i,n)},t.adopt=function(t,e,n){var i,s,r;return o(t,e,n),i=this,i.disowned=!1,(s=i.ends[Tt])?(r=i.ends[Ct],e||(t.ends[Tt]=s),n?n[Tt]=r:t.ends[Ct]=r,i.ends[Ct][Ct]=n,i.each(function(n){n[Tt]=e,n.parent=t,e&&(e[Ct]=n),e=n}),i):this},t.disown=function(){var t,e,n=this,i=n.ends[Tt];return!i||n.disowned?n:(n.disowned=!0,t=n.ends[Ct],e=i.parent,o(e,i[Tt],i),o(e,t,t[Ct]),i[Tt]?i[Tt][Ct]=t[Ct]:e.ends[Tt]=t[Ct],t[Ct]?t[Ct][Tt]=i[Tt]:e.ends[Ct]=i[Tt],n)},t.remove=function(){return this.jQ.remove(),this.each("postOrder","dispose"),this.disown()},t.each=n(function(t){var e,n=this,i=n.ends[Tt];if(!i)return n;for(;i!==n.ends[Ct][Ct]&&(e=t(i),e!==!1);i=i[Ct]);return n}),t.fold=function(t,e){return this.each(function(n){t=e.call(this,t,n)}),t}}),Et={},At={},Rt=Qt(Dt,function(t){t.init=function(t,e){this.parent=t,this.options=e;var n=this.jQ=this._jQ=_t('<span class="mq-cursor">&#8203;</span>');this.blink=function(){n.toggleClass("mq-blink")},this.upDownCache={}},t.show=function(){return this.jQ=this._jQ.removeClass("mq-blink"),"intervalId"in this?clearInterval(this.intervalId):(this[Ct]?this.selection&&this.selection.ends[Tt][Tt]===this[Tt]?this.jQ.insertBefore(this.selection.jQ):this.jQ.insertBefore(this[Ct].jQ.first()):this.jQ.appendTo(this.parent.jQ),this.parent.focus()),this.intervalId=setInterval(this.blink,500),this},t.hide=function(){return"intervalId"in this&&clearInterval(this.intervalId),delete this.intervalId,this.jQ.detach(),this.jQ=_t(),this},t.withDirInsertAt=function(t,e,n,i){var s=this.parent;this.parent=e,this[t]=n,this[-t]=i,s!==e&&s.blur&&s.blur(this)},t.insDirOf=function(t,e){return r(t),this.jQ.insDirOf(t,e.jQ),this.withDirInsertAt(t,e.parent,e[t],e),this.parent.jQ.addClass("mq-hasCursor"),this},t.insLeftOf=function(t){return this.insDirOf(Tt,t)},t.insRightOf=function(t){return this.insDirOf(Ct,t)},t.insAtDirEnd=function(t,e){return r(t),this.jQ.insAtDirEnd(t,e.jQ),this.withDirInsertAt(t,e,0,e.ends[t]),e.focus(),this},t.insAtLeftEnd=function(t){return this.insAtDirEnd(Tt,t)},t.insAtRightEnd=function(t){return this.insAtDirEnd(Ct,t)},t.jumpUpDown=function(t,e){var n,i,s=this;s.upDownCache[t.id]=Dt.copy(s),n=s.upDownCache[e.id],n?n[Ct]?s.insLeftOf(n[Ct]):s.insAtRightEnd(n.parent):(i=s.offset().left,e.seek(i,s))},t.offset=function(){var t=this,e=t.jQ.removeClass("mq-cursor").offset();return t.jQ.addClass("mq-cursor"),e},t.unwrapGramp=function(){var t=this.parent.parent,e=t.parent,n=t[Ct],i=this,s=t[Tt];if(t.disown().eachChild(function(i){i.isEmpty()||(i.children().adopt(e,s,n).each(function(e){e.jQ.insertBefore(t.jQ.first())}),s=i.ends[Ct])}),!this[Ct])if(this[Tt])this[Ct]=this[Tt][Ct];else for(;!this[Ct];){if(this.parent=this.parent[Ct],!this.parent){this[Ct]=t[Ct],this.parent=e;break}this[Ct]=this.parent.ends[Tt]}this[Ct]?this.insLeftOf(this[Ct]):this.insAtRightEnd(e),t.jQ.remove(),t[Tt].siblingDeleted&&t[Tt].siblingDeleted(i.options,Ct),t[Ct].siblingDeleted&&t[Ct].siblingDeleted(i.options,Tt)},t.startSelection=function(){var t,e=this.anticursor=Dt.copy(this),n=e.ancestors={};for(t=e;t.parent;t=t.parent)n[t.parent.id]=t},t.endSelection=function(){delete this.anticursor},t.select=function(){var t,e,n,i,r,o,a,l=this.anticursor;if(this[Tt]===l[Tt]&&this.parent===l.parent)return!1;for(t=this;t.parent;t=t.parent)if(t.parent.id in l.ancestors){e=t.parent;break}if(s("cursor and anticursor in the same tree",e),n=l.ancestors[e.id],o=Ct,t[Tt]!==n)for(a=t;a;a=a[Ct])if(a[Ct]===n[Ct]){o=Tt,i=t,r=n;break}return o===Ct&&(i=n,r=t),i instanceof Dt&&(i=i[Ct]),r instanceof Dt&&(r=r[Tt]),this.hide().selection=e.selectChildren(i,r),this.insDirOf(o,this.selection.ends[o]),this.selectionChanged(),!0},t.clearSelection=function(){return this.selection&&(this.selection.clear(),delete this.selection,this.selectionChanged()),this},t.deleteSelection=function(){this.selection&&(this[Tt]=this.selection.ends[Tt][Tt],this[Ct]=this.selection.ends[Ct][Ct],this.selection.remove(),this.selectionChanged(),delete this.selection)},t.replaceSelection=function(){var t=this.selection;return t&&(this[Tt]=t.ends[Tt][Tt],this[Ct]=t.ends[Ct][Ct],delete this.selection),t}}),It=Qt(Lt,function(t,e){t.init=function(){e.init.apply(this,arguments),this.jQ=this.jQ.wrapAll('<span class="mq-selection"></span>').parent()},t.adopt=function(){return this.jQ.replaceWith(this.jQ=this.jQ.children()),e.adopt.apply(this,arguments)},t.clear=function(){return this.jQ.replaceWith(this.jQ[0].childNodes),this},t.join=function(t){return this.fold("",function(e,n){return e+n[t]()})}}),zt=Qt(function(t){t.init=function(t,e,n){this.id=t.id,this.data={},this.root=t,this.container=e,this.options=n,t.controller=this,this.cursor=t.cursor=Rt(t,n)},t.handle=function(t,e){var n,i=this.options.handlers;i&&i.fns[t]&&(n=i.APIClasses[this.KIND_OF_MQ](this),e===Tt||e===Ct?i.fns[t](e,n):i.fns[t](n))};var e=[];this.onNotify=function(t){e.push(t)},t.notify=function(){for(var t=0;t<e.length;t+=1)e[t].apply(this.cursor,arguments);return this}}),Mt={},Bt=Qt(),Ft={},$t=Qt(),Nt={};l.prototype=$t.p,l.interfaceVersion=function(t){if(1!==t)throw"Only interface version 1 supported. You specified: "+t;return a=function(){window.console&&console.warn('You called MathQuill.interfaceVersion(1); to specify the interface version, which will fail in v1.0.0. You can fix this easily by doing this before doing anything else:\n\n    MathQuill = MathQuill.getInterface(1);\n    // now MathQuill.MathField() works like it used to\n\nSee also the "`dev` branch (2014–2015) → v0.10.0 Migration Guide" at\n  https://github.com/mathquill/mathquill/wiki/%60dev%60-branch-(2014%E2%80%932015)-%E2%86%92-v0.10.0-Migration-Guide')},a(),l},l.getInterface=c,g=c.MIN=1,b=c.MAX=2,l.noConflict=function(){return window.MathQuill=v,l},v=window.MathQuill,window.MathQuill=l,w=Qt(function(t,e,n){function i(t,e){throw t=t?"'"+t+"'":"EOF","Parse Error: "+e+" at "+t}var r,o,a,l,c,u,h,f,p,d,m,g,b;t.init=function(t){this._=t},t.parse=function(t){function e(t,e){return e}return this.skip(b)._(""+t,e,i)},t.or=function(t){s("or is passed a parser",t instanceof n);var e=this;return n(function(n,i,s){function r(e){return t._(n,i,s)}return e._(n,i,r)})},t.then=function(t){var e=this;return n(function(i,r,o){function a(e,i){var a=t instanceof n?t:t(i);return s("a parser is returned",a instanceof n),a._(e,r,o)}return e._(i,a,o)})},t.many=function(){var t=this;return n(function(e,n,i){function s(t,n){return e=t,o.push(n),!0}function r(){return!1}for(var o=[];t._(e,s,r););return n(e,o)})},t.times=function(t,e){arguments.length<2&&(e=t);var i=this;return n(function(n,s,r){function o(t,e){return h.push(e),n=t,!0}function a(t,e){return c=e,n=t,!1}function l(t,e){return!1}var c,u,h=[],f=!0;for(u=0;t>u;u+=1)if(f=i._(n,o,a),!f)return r(n,c);for(;e>u&&f;u+=1)f=i._(n,o,l);return s(n,h)})},t.result=function(t){return this.then(a(t))},t.atMost=function(t){return this.times(0,t)},t.atLeast=function(t){var e=this;return e.times(t).then(function(t){return e.many().map(function(e){return t.concat(e)})})},t.map=function(t){return this.then(function(e){return a(t(e))})},t.skip=function(t){return this.then(function(e){return t.result(e)})},r=this.string=function(t){var e=t.length,i="expected '"+t+"'";return n(function(n,s,r){var o=n.slice(0,e);return o===t?s(n.slice(e),o):r(n,i)})},o=this.regex=function(t){s("regexp parser is anchored","^"===t.toString().charAt(1));var e="expected "+t;return n(function(n,i,s){var r,o=t.exec(n);return o?(r=o[0],i(n.slice(r.length),r)):s(n,e)})},a=n.succeed=function(t){return n(function(e,n){return n(e,t)})},l=n.fail=function(t){return n(function(e,n,i){return i(e,t)})},c=n.letter=o(/^[a-z]/i),u=n.letters=o(/^[a-z]*/i),h=n.digit=o(/^[0-9]/),f=n.digits=o(/^[0-9]*/),p=n.whitespace=o(/^\s+/),d=n.optWhitespace=o(/^\s*/),m=n.any=n(function(t,e,n){return t?e(t.slice(1),t.charAt(0)):n(t,"expected any character")}),g=n.all=n(function(t,e,n){return e("",t)}),b=n.eof=n(function(t,e,n){return t?n(t,"expected EOF"):e(t,t)})}),q=function(){function e(t){var e,i=t.which||t.keyCode,s=n[i],r=[];return t.ctrlKey&&r.push("Ctrl"),t.originalEvent&&t.originalEvent.metaKey&&r.push("Meta"),t.altKey&&r.push("Alt"),t.shiftKey&&r.push("Shift"),e=s||String.fromCharCode(i),r.length||s?(r.push(e),r.join("-")):e}var n={8:"Backspace",9:"Tab",10:"Enter",13:"Enter",16:"Shift",17:"Control",18:"Alt",20:"CapsLock",27:"Esc",32:"Spacebar",33:"PageUp",34:"PageDown",35:"End",36:"Home",37:"Left",38:"Up",39:"Right",40:"Down",45:"Insert",46:"Del",144:"NumLock"};return function(n,i){function s(t){q=t,clearTimeout(d),d=setTimeout(t)}function r(e){q(),q=t,clearTimeout(d),v.val(e),e&&v[0].select&&v[0].select(),m=!!e}function o(){var t=v[0];return"selectionStart"in t?t.selectionStart!==t.selectionEnd:!1}function a(){i.keystroke(e(g),g)}function l(e){g=e,b=null,m&&s(function(e){e&&"focusout"===e.type||!v[0].select||v[0].select(),q=t,clearTimeout(d)}),a()}function c(t){g&&b&&a(),b=t,s(u)}function u(){if(!o()){var t=v.val();1===t.length?(v.val(""),i.typedText(t)):t&&v[0].select&&v[0].select()}}function h(){g=b=null}function f(t){v.focus(),s(p)}function p(){var t=v.val();v.val(""),t&&i.paste(t)}var d,m,g=null,b=null,v=wt(n),w=wt(i.container||v),q=t;return w.bind("keydown keypress input keyup focusout paste",function(t){q(t)}),m=!1,w.bind({keydown:l,keypress:c,focusout:h,paste:f}),{select:r}}}(),zt.open(function(t,e){t.exportText=function(){return this.root.foldChildren("",function(t,e){return t+e.text()})}}),zt.open(function(t){t.focusBlurEvents=function(){function t(){clearTimeout(n),r.selection&&r.selection.jQ.addClass("mq-blur"),e()}function e(){r.hide().parent.blur(),i.container.removeClass("mq-focused"),_t(window).off("blur",t)}var n,i=this,s=i.root,r=i.cursor;i.textarea.focus(function(){i.blurred=!1,clearTimeout(n),i.container.addClass("mq-focused"),r.parent||r.insAtRightEnd(s),r.selection?(r.selection.jQ.removeClass("mq-blur"),i.selectionChanged()):r.show()}).blur(function(){i.blurred=!0,n=setTimeout(function(){s.postOrder("intentionalBlur"),r.clearSelection().endSelection(),e()}),_t(window).on("blur",t)}),i.blurred=!0,r.hide().parent.blur()}}),zt.open(function(t){t.keystroke=function(t,e){this.cursor.parent.keystroke(t,e,this)}}),St.open(function(t){t.keystroke=function(t,e,n){var i=n.cursor;switch(t){case"Ctrl-Shift-Backspace":case"Ctrl-Backspace":n.ctrlDeleteDir(Tt);break;case"Shift-Backspace":case"Backspace":n.backspace();break;case"Esc":case"Tab":return void n.escapeDir(Ct,t,e);case"Shift-Tab":case"Shift-Esc":return void n.escapeDir(Tt,t,e);case"End":n.notify("move").cursor.insAtRightEnd(i.parent);break;case"Ctrl-End":n.notify("move").cursor.insAtRightEnd(n.root);break;case"Shift-End":for(;i[Ct];)n.selectRight();break;case"Ctrl-Shift-End":for(;i[Ct]||i.parent!==n.root;)n.selectRight();break;case"Home":n.notify("move").cursor.insAtLeftEnd(i.parent);break;case"Ctrl-Home":n.notify("move").cursor.insAtLeftEnd(n.root);break;case"Shift-Home":for(;i[Tt];)n.selectLeft();break;case"Ctrl-Shift-Home":for(;i[Tt]||i.parent!==n.root;)n.selectLeft();break;case"Left":n.moveLeft();break;case"Shift-Left":n.selectLeft();break;case"Ctrl-Left":break;case"Right":n.moveRight();break;case"Shift-Right":n.selectRight();break;case"Ctrl-Right":break;case"Up":n.moveUp();break;case"Down":n.moveDown();break;case"Shift-Up":if(i[Tt])for(;i[Tt];)n.selectLeft();else n.selectLeft();case"Shift-Down":if(i[Ct])for(;i[Ct];)n.selectRight();else n.selectRight();case"Ctrl-Up":break;case"Ctrl-Down":break;case"Ctrl-Shift-Del":case"Ctrl-Del":n.ctrlDeleteDir(Ct);break;case"Shift-Del":case"Del":n.deleteForward();break;case"Meta-A":case"Ctrl-A":for(n.notify("move").cursor.insAtRightEnd(n.root);i[Tt];)n.selectLeft();break;default:return}e.preventDefault(),n.scrollHoriz()},t.moveOutOf=t.moveTowards=t.deleteOutOf=t.deleteTowards=t.unselectInto=t.selectOutOf=t.selectTowards=function(){s("overridden or never called on this node")}}),zt.open(function(t){function e(t,e){var n=t.notify("upDown").cursor,i=e+"Into",s=e+"OutOf";return n[Ct][i]?n.insAtLeftEnd(n[Ct][i]):n[Tt][i]?n.insAtRightEnd(n[Tt][i]):n.parent.bubble(function(t){var e=t[s];return e&&("function"==typeof e&&(e=t[s](n)),e instanceof St&&n.jumpUpDown(t,e),e!==!0)?!1:void 0}),t}this.onNotify(function(t){"move"!==t&&"upDown"!==t||this.show().clearSelection()}),t.escapeDir=function(t,e,n){r(t);var i=this.cursor;return i.parent!==this.root&&n.preventDefault(),i.parent!==this.root?(i.parent.moveOutOf(t,i),this.notify("move")):void 0},Ft.leftRightIntoCmdGoes=function(t){if(t&&"up"!==t&&"down"!==t)throw'"up" or "down" required for leftRightIntoCmdGoes option, got "'+t+'"';return t},t.moveDir=function(t){r(t);var e=this.cursor,n=e.options.leftRightIntoCmdGoes;return e.selection?e.insDirOf(t,e.selection.ends[t]):e[t]?e[t].moveTowards(t,e,n):e.parent.moveOutOf(t,e,n),this.notify("move")},t.moveLeft=function(){return this.moveDir(Tt)},t.moveRight=function(){return this.moveDir(Ct)},t.moveUp=function(){return e(this,"up")},t.moveDown=function(){return e(this,"down")},this.onNotify(function(t){"upDown"!==t&&(this.upDownCache={})}),this.onNotify(function(t){"edit"===t&&this.show().deleteSelection()}),t.deleteDir=function(t){var e,n;return r(t),e=this.cursor,n=e.selection,this.notify("edit"),n||(e[t]?e[t].deleteTowards(t,e):e.parent.deleteOutOf(t,e)),e[Tt].siblingDeleted&&e[Tt].siblingDeleted(e.options,Ct),e[Ct].siblingDeleted&&e[Ct].siblingDeleted(e.options,Tt),e.parent.bubble("reflow"),this},t.ctrlDeleteDir=function(t){r(t);var e=this.cursor;return!e[Tt]||e.selection?ctrlr.deleteDir():(this.notify("edit"),Lt(e.parent.ends[Tt],e[Tt]).remove(),e.insAtDirEnd(Tt,e.parent),e[Tt].siblingDeleted&&e[Tt].siblingDeleted(e.options,Ct),e[Ct].siblingDeleted&&e[Ct].siblingDeleted(e.options,Tt),e.parent.bubble("reflow"),this)},t.backspace=function(){return this.deleteDir(Tt)},t.deleteForward=function(){return this.deleteDir(Ct)},this.onNotify(function(t){"select"!==t&&this.endSelection()}),t.selectDir=function(t){var e,n=this.notify("select").cursor,i=n.selection;r(t),n.anticursor||n.startSelection(),e=n[t],e?i&&i.ends[t]===e&&n.anticursor[-t]!==e?e.unselectInto(t,n):e.selectTowards(t,n):n.parent.selectOutOf(t,n),n.clearSelection(),n.select()||n.show()},t.selectLeft=function(){return this.selectDir(Tt)},t.selectRight=function(){return this.selectDir(Ct)}}),x=function(){function t(t){var e=T();return t.adopt(e,0,0),e}function e(t){var e,n=t[0]||T();for(e=1;e<t.length;e+=1)t[e].children().adopt(n,n.ends[Ct],0);return n}var n=w.string,i=w.regex,s=w.letter,r=w.any,o=w.optWhitespace,a=w.succeed,l=w.fail,c=s.map(function(t){return R(t)}),u=i(/^[^${}\\_^]/).map(function(t){return j(t)}),h=i(/^[^\\a-eg-zA-Z]/).or(n("\\").then(i(/^[a-z]+/i).or(i(/^\s+/).result(" ")).or(r))).then(function(t){var e=Et[t];return e?e(t).parser():l("unknown command: \\"+t)}),f=h.or(c).or(u),p=n("{").then(function(){return m}).skip(n("}")),d=o.then(p.or(f.map(t))),m=d.many().map(e).skip(o),g=n("[").then(d.then(function(t){return"]"!==t.join("latex")?a(t):l()}).many().map(e).skip(o)).skip(n("]")),b=m;return b.block=d,b.optBlock=g,b}(),zt.open(function(t,e){t.exportLatex=function(){return this.root.latex().replace(/(\\[a-z]+) (?![a-z])/gi,"$1")},t.writeLatex=function(t){var e,n=this.notify("edit").cursor,i=w.all,s=w.eof,r=x.skip(s).or(i.result(!1)).parse(t);return r&&!r.isEmpty()&&(r.children().adopt(n.parent,n[Tt],n[Ct]),e=r.jQize(),e.insertBefore(n.jQ),n[Tt]=r.ends[Ct],r.finalizeInsert(n.options,n),r.ends[Ct][Ct].siblingCreated&&r.ends[Ct][Ct].siblingCreated(n.options,Tt),r.ends[Tt][Tt].siblingCreated&&r.ends[Tt][Tt].siblingCreated(n.options,Ct),n.parent.bubble("reflow")),this},t.renderLatexMath=function(t){var e,n,i=this.root,s=this.cursor,r=w.all,o=w.eof,a=x.skip(o).or(r.result(!1)).parse(t);i.eachChild("postOrder","dispose"),i.ends[Tt]=i.ends[Ct]=0,a&&a.children().adopt(i,0,0),e=i.jQ,a?(n=a.join("html"),e.html(n),i.jQize(e.children()),i.finalizeInsert(s.options)):e.empty(),delete s.selection,s.insAtRightEnd(i)},t.renderLatexText=function(t){var e,n,i,s,r,o,a,l,c,u,h=this.root,f=this.cursor;if(h.jQ.children().slice(1).remove(),h.eachChild("postOrder","dispose"),h.ends[Tt]=h.ends[Ct]=0,delete f.selection,f.show().insAtRightEnd(h),e=w.regex,n=w.string,i=w.eof,s=w.all,r=n("$").then(x).skip(n("$").or(i)).map(function(t){var e,n=S(f);return n.createBlocks(),e=n.ends[Tt],t.children().adopt(e,0,0),n}),o=n("\\$").result("$"),a=o.or(e(/^[^$]/)).map(j),l=r.or(a).many(),c=l.skip(i).or(s.result(!1)).parse(t)){for(u=0;u<c.length;u+=1)c[u].adopt(h,h.ends[Ct],0);h.jQize().appendTo(h.jQ),h.finalizeInsert(f.options)}}}),zt.open(function(e){Bt.p.ignoreNextMousedown=t,e.delegateMouseEvents=function(){var e=this.root.jQ;this.container.bind("mousedown.mathquill",function(n){function i(t){o=_t(t.target)}function s(t){u.anticursor||u.startSelection(),c.seek(o,t.pageX,t.pageY).cursor.select(),o=m}function r(t){u.blink=h,u.selection||(c.editable?u.show():f.detach()),a.unbind("mousemove",i),_t(t.target.ownerDocument).unbind("mousemove",s).unbind("mouseup",r)}var o,a=_t(n.target).closest(".mq-root-block"),l=St.byId[a.attr(xt)||e.attr(xt)],c=l.controller,u=c.cursor,h=u.blink,f=c.textareaSpan,p=c.textarea;n.preventDefault(),n.target.unselectable=!0,u.options.ignoreNextMousedown(n)||(u.options.ignoreNextMousedown=t,c.blurred&&(c.editable||a.prepend(f),p.focus()),u.blink=t,c.seek(_t(n.target),n.pageX,n.pageY).cursor.startSelection(),a.mousemove(i),_t(n.target.ownerDocument).mousemove(s).mouseup(r))})}}),zt.open(function(t){t.seek=function(t,e,n){var i,r,o,a=this.notify("select").cursor;return t&&(i=t.attr(xt)||t.attr(qt),i||(r=t.parent(),i=r.attr(xt)||r.attr(qt))),o=i?St.byId[i]:this.root,s("nodeId is the id of some Node that exists",o),a.clearSelection().show(),o.seek(e,a),this.scrollHoriz(),this}}),zt.open(function(t){t.scrollHoriz=function(){var t,e,n,i,s,r=this.cursor,o=r.selection,a=this.root.jQ[0].getBoundingClientRect();if(o)if(n=o.jQ[0].getBoundingClientRect(),i=n.left-(a.left+20),s=n.right-(a.right-20),o.ends[Tt]===r[Ct])if(0>i)e=i;else{if(!(s>0))return;e=n.left-s<a.left+20?i:s}else if(s>0)e=s;else{if(!(0>i))return;e=n.right-i>a.right-20?s:i}else if(t=r.jQ[0].getBoundingClientRect().left,t>a.right-20)e=t-(a.right-20);else{if(!(t<a.left+20))return;e=t-(a.left+20)}this.root.jQ.stop().animate({scrollLeft:"+="+e},100)}}),zt.open(function(t){Bt.p.substituteTextarea=function(){return _t("<textarea autocapitalize=off autocomplete=off autocorrect=off spellcheck=false x-palm-disable-ste-all=true />")[0]},t.createTextarea=function(){var t,e=this.textareaSpan=_t('<span class="mq-textarea"></span>'),n=this.options.substituteTextarea();if(!n.nodeType)throw"substituteTextarea() must return a DOM element, got "+n;n=this.textarea=_t(n).appendTo(e),t=this,t.cursor.selectionChanged=function(){t.selectionChanged()},t.container.bind("copy",function(){t.setTextareaSelection()})},t.selectionChanged=function(){var t=this;Y(t.container[0]),t.textareaSelectionTimeout===m&&(t.textareaSelectionTimeout=setTimeout(function(){t.setTextareaSelection()}))},t.setTextareaSelection=function(){this.textareaSelectionTimeout=m;var t="";this.cursor.selection&&(t=this.cursor.selection.join("latex"),this.options.statelessClipboard&&(t="$"+t+"$")),this.selectFn(t)},t.staticMathTextareaEvents=function(){function t(){s.detach(),e.blurred=!0}var e=this,n=(e.root,e.cursor),i=e.textarea,s=e.textareaSpan;this.container.prepend('<span class="mq-selectable">$'+e.exportLatex()+"$</span>"),e.blurred=!0,i.bind("cut paste",!1).focus(function(){e.blurred=!1}).blur(function(){n.selection&&n.selection.clear(),setTimeout(t)}),e.selectFn=function(t){i.val(t),t&&i.select()}},t.editablesTextareaEvents=function(){var t=this,e=(t.root,t.cursor),n=t.textarea,i=t.textareaSpan,s=q(n,this);this.selectFn=function(t){s.select(t)},this.container.prepend(i).on("cut",function(n){e.selection&&setTimeout(function(){t.notify("edit"),e.parent.bubble("reflow")})}),this.focusBlurEvents()},t.typedText=function(t){if("\n"===t)return this.handle("enter");var e=this.notify().cursor;e.parent.write(e,t),this.scrollHoriz()},t.paste=function(t){this.options.statelessClipboard&&(t="$"===t.slice(0,1)&&"$"===t.slice(-1)?t.slice(1,-1):"\\text{"+t+"}"),this.writeLatex(t).cursor.show()}}),y=Qt(St,function(t,e){t.finalizeInsert=function(t,e){var n=this;n.postOrder("finalizeTree",t),n.postOrder("contactWeld",e),n.postOrder("blur"),n.postOrder("reflow"),n[Ct].siblingCreated&&n[Ct].siblingCreated(t,Tt),n[Tt].siblingCreated&&n[Tt].siblingCreated(t,Ct),n.bubble("reflow")}}),O=Qt(y,function(t,e){t.init=function(t,n,i){var s=this;e.init.call(s),s.ctrlSeq||(s.ctrlSeq=t),n&&(s.htmlTemplate=n),i&&(s.textTemplate=i)},t.replaces=function(t){t.disown(),this.replacedFragment=t},t.isEmpty=function(){return this.foldChildren(!0,function(t,e){return t&&e.isEmpty()})},t.parser=function(){var t=x.block,e=this;return t.times(e.numBlocks()).map(function(t){e.blocks=t;for(var n=0;n<t.length;n+=1)t[n].adopt(e,e.ends[Ct],0);return e})},t.createLeftOf=function(t){var n=this,i=n.replacedFragment;n.createBlocks(),e.createLeftOf.call(n,t),i&&(i.adopt(n.ends[Tt],0,0),i.jQ.appendTo(n.ends[Tt].jQ)),n.finalizeInsert(t.options),n.placeCursor(t)},t.createBlocks=function(){var t,e,n=this,i=n.numBlocks(),s=n.blocks=Array(i);for(t=0;i>t;t+=1)e=s[t]=T(),e.adopt(n,n.ends[Ct],0)},t.placeCursor=function(t){t.insAtRightEnd(this.foldChildren(this.ends[Tt],function(t,e){return t.isEmpty()?t:e}))},t.moveTowards=function(t,e,n){var i=n&&this[n+"Into"];e.insAtDirEnd(-t,i||this.ends[-t])},t.deleteTowards=function(t,e){this.isEmpty()?e[t]=this.remove()[t]:this.moveTowards(t,e,null)},t.selectTowards=function(t,e){e[-t]=this,e[t]=this[t]},t.selectChildren=function(){return It(this,this)},t.unselectInto=function(t,e){e.insAtDirEnd(-t,e.anticursor.ancestors[this.id])},t.seek=function(t,e){function n(t){var e={};return e[Tt]=t.jQ.offset().left,e[Ct]=e[Tt]+t.jQ.outerWidth(),e}var i,s=this,r=n(s);return t<r[Tt]?e.insLeftOf(s):t>r[Ct]?e.insRightOf(s):(i=r[Tt],void s.eachChild(function(o){var a=n(o);return t<a[Tt]?(t-i<a[Tt]-t?o[Tt]?e.insAtRightEnd(o[Tt]):e.insLeftOf(s):e.insAtLeftEnd(o),!1):t>a[Ct]?void(o[Ct]?i=a[Ct]:r[Ct]-t<t-a[Ct]?e.insRightOf(s):e.insAtRightEnd(o)):(o.seek(t,e),!1)}))},t.numBlocks=function(){var t=this.htmlTemplate.match(/&\d+/g);return t?t.length:0;
},t.html=function(){var t,e,n,i=this,r=i.blocks,o=" mathquill-command-id="+i.id,a=i.htmlTemplate.match(/<[^<>]+>|[^<>]+/g);for(s("no unmatched angle brackets",a.join("")===this.htmlTemplate),t=0,e=a[0];e;t+=1,e=a[t])if("/>"===e.slice(-2))a[t]=e.slice(0,-2)+o+"/>";else if("<"===e.charAt(0)){s("not an unmatched top-level close tag","/"!==e.charAt(1)),a[t]=e.slice(0,-1)+o+">",n=1;do t+=1,e=a[t],s("no missing close tags",e),"</"===e.slice(0,2)?n-=1:"<"===e.charAt(0)&&"/>"!==e.slice(-2)&&(n+=1);while(n>0)}return a.join("").replace(/>&(\d+)/g,function(t,e){return" mathquill-block-id="+r[e].id+">"+r[e].join("html")})},t.latex=function(){return this.foldChildren(this.ctrlSeq,function(t,e){return t+"{"+(e.latex()||" ")+"}"})},t.textTemplate=[""],t.text=function(){var t=this,e=0;return t.foldChildren(t.textTemplate[e],function(n,i){e+=1;var s=i.text();return n&&"("===t.textTemplate[e]&&"("===s[0]&&")"===s.slice(-1)?n+s.slice(1,-1)+t.textTemplate[e]:n+i.text()+(t.textTemplate[e]||"")})}}),k=Qt(O,function(e,n){e.init=function(t,e,i){i||(i=t&&t.length>1?t.slice(1):t),n.init.call(this,t,e,[i])},e.parser=function(){return w.succeed(this)},e.numBlocks=function(){return 0},e.replaces=function(t){t.remove()},e.createBlocks=t,e.moveTowards=function(t,e){e.jQ.insDirOf(t,this.jQ),e[-t]=this,e[t]=this[t]},e.deleteTowards=function(t,e){e[t]=this.remove()[t]},e.seek=function(t,e){t-this.jQ.offset().left<this.jQ.outerWidth()/2?e.insLeftOf(this):e.insRightOf(this)},e.latex=function(){return this.ctrlSeq},e.text=function(){return this.textTemplate},e.placeCursor=t,e.isEmpty=function(){return!0}}),j=Qt(k,function(t,e){t.init=function(t,n){e.init.call(this,t,"<span>"+(n||t)+"</span>")}}),Q=Qt(k,function(t,e){t.init=function(t,n,i){e.init.call(this,t,'<span class="mq-binary-operator">'+n+"</span>",i)}}),T=Qt(y,function(t,e){t.join=function(t){return this.foldChildren("",function(e,n){return e+n[t]()})},t.html=function(){return this.join("html")},t.latex=function(){return this.join("latex")},t.text=function(){return this.ends[Tt]===this.ends[Ct]&&0!==this.ends[Tt]?this.ends[Tt].text():this.join("text")},t.keystroke=function(t,n,i){return!i.options.spaceBehavesLikeTab||"Spacebar"!==t&&"Shift-Spacebar"!==t?e.keystroke.apply(this,arguments):(n.preventDefault(),void i.escapeDir("Shift-Spacebar"===t?Tt:Ct,t,n))},t.moveOutOf=function(t,e,n){var i=n&&this.parent[n+"Into"];!i&&this[t]?e.insAtDirEnd(-t,this[t]):e.insDirOf(t,this.parent)},t.selectOutOf=function(t,e){e.insDirOf(t,this.parent)},t.deleteOutOf=function(t,e){e.unwrapGramp()},t.seek=function(t,e){var n=this.ends[Ct];if(!n||n.jQ.offset().left+n.jQ.outerWidth()<t)return e.insAtRightEnd(this);if(t<this.ends[Tt].jQ.offset().left)return e.insAtLeftEnd(this);for(;t<n.jQ.offset().left;)n=n[Tt];return n.seek(t,e)},t.chToCmd=function(t){var e;return t.match(/^[a-eg-zA-Z]$/)?R(t):/^\d$/.test(t)?E(t):(e=At[t]||Et[t])?e(t):j(t)},t.write=function(t,e){var n=this.chToCmd(e);t.selection&&n.replaces(t.replaceSelection()),n.createLeftOf(t.show())},t.focus=function(){return this.jQ.addClass("mq-hasCursor"),this.jQ.removeClass("mq-empty"),this},t.blur=function(){return this.jQ.removeClass("mq-hasCursor"),this.isEmpty()&&this.jQ.addClass("mq-empty"),this}}),Mt.StaticMath=function(t){return Qt(t.AbstractMathQuill,function(e,n){this.RootBlock=T,e.__mathquillify=function(){return n.__mathquillify.call(this,"mq-math-mode"),this.__controller.delegateMouseEvents(),this.__controller.staticMathTextareaEvents(),this},e.init=function(){n.init.apply(this,arguments),this.__controller.root.postOrder("registerInnerField",this.innerFields=[],t.MathField)},e.latex=function(){var e=n.latex.apply(this,arguments);return arguments.length>0&&this.__controller.root.postOrder("registerInnerField",this.innerFields=[],t.MathField),e}})},C=Qt(T,u),Mt.MathField=function(e){return Qt(e.EditableField,function(e,n){this.RootBlock=C,e.__mathquillify=function(e,i){return this.config(e),i>1&&(this.__controller.root.reflow=t),n.__mathquillify.call(this,"mq-editable-field mq-math-mode"),delete this.__controller.root.reflow,this}})},_=Qt(St,function(t,e){function n(t){var e,n;return t.jQ[0].normalize(),(e=t.jQ[0].firstChild)?(s("only node in TextBlock span is Text node",3===e.nodeType),n=D(e.data),n.jQadd(e),t.children().disown(),n.adopt(t,0,0)):void 0}t.ctrlSeq="\\text",t.replaces=function(t){t instanceof Lt?this.replacedText=t.remove().jQ.text():"string"==typeof t&&(this.replacedText=t)},t.jQadd=function(t){e.jQadd.call(this,t),this.ends[Tt]&&this.ends[Tt].jQadd(this.jQ[0].firstChild)},t.createLeftOf=function(t){var n,i=this;if(e.createLeftOf.call(this,t),i[Ct].siblingCreated&&i[Ct].siblingCreated(t.options,Tt),i[Tt].siblingCreated&&i[Tt].siblingCreated(t.options,Ct),i.bubble("reflow"),t.insAtRightEnd(i),i.replacedText)for(n=0;n<i.replacedText.length;n+=1)i.write(t,i.replacedText.charAt(n))},t.parser=function(){var t=this,e=w.string,n=w.regex,i=w.optWhitespace;return i.then(e("{")).then(n(/^[^}]*/)).skip(e("}")).map(function(e){return 0===e.length?Lt():(D(e).adopt(t,0,0),t)})},t.textContents=function(){return this.foldChildren("",function(t,e){return t+e.text})},t.text=function(){return'"'+this.textContents()+'"'},t.latex=function(){var t=this.textContents();return 0===t.length?"":"\\text{"+t+"}"},t.html=function(){return'<span class="mq-text-mode" mathquill-command-id='+this.id+">"+this.textContents()+"</span>"},t.moveTowards=function(t,e){e.insAtDirEnd(-t,this)},t.moveOutOf=function(t,e){e.insDirOf(t,this)},t.unselectInto=t.moveTowards,t.selectTowards=O.prototype.selectTowards,t.deleteTowards=O.prototype.deleteTowards,t.selectOutOf=function(t,e){e.insDirOf(t,this)},t.deleteOutOf=function(t,e){this.isEmpty()&&e.insRightOf(this)},t.write=function(t,n){var i,s;t.show().deleteSelection(),"$"!==n?t[Tt]?t[Tt].appendText(n):D(n).createLeftOf(t):this.isEmpty()?(t.insRightOf(this),j("\\$","$").createLeftOf(t)):t[Ct]?t[Tt]?(i=_(),s=this.ends[Tt],s.disown().jQ.detach(),s.adopt(i,0,0),t.insLeftOf(this),e.createLeftOf.call(i,t)):t.insLeftOf(this):t.insRightOf(this)},t.seek=function(t,e){var i,s,r,o,a,l,c,u;for(e.hide(),i=n(this),s=this.jQ.width()/this.text.length,r=Math.round((t-this.jQ.offset().left)/s),0>=r?e.insAtLeftEnd(this):r>=i.text.length?e.insAtRightEnd(this):e.insLeftOf(i.splitRight(r)),o=t-e.show().offset().left,a=o&&0>o?Tt:Ct,l=a;e[a]&&o*l>0;)e[a].moveTowards(a,e),l=o,o=t-e.offset().left;-a*l>a*o&&e[-a].moveTowards(-a,e),e.anticursor?e.anticursor.parent===this&&(c=e[Tt]&&e[Tt].text.length,this.anticursorPosition===c?e.anticursor=Dt.copy(e):(this.anticursorPosition<c?(u=e[Tt].splitRight(this.anticursorPosition),e[Tt]=u):u=e[Ct].splitRight(this.anticursorPosition-c),e.anticursor=Dt(this,u[Tt],u))):this.anticursorPosition=e[Tt]&&e[Tt].text.length},t.blur=function(t){T.prototype.blur.call(this),t&&(""===this.textContents()?(this.remove(),t[Tt]===this?t[Tt]=this[Tt]:t[Ct]===this&&(t[Ct]=this[Ct])):n(this))},t.focus=T.prototype.focus}),D=Qt(St,function(t,e){function n(t,e){return e.charAt(t===Tt?0:-1+e.length)}t.init=function(t){e.init.call(this),this.text=t},t.jQadd=function(t){this.dom=t,this.jQ=_t(t)},t.jQize=function(){return this.jQadd(document.createTextNode(this.text))},t.appendText=function(t){this.text+=t,this.dom.appendData(t)},t.prependText=function(t){this.text=t+this.text,this.dom.insertData(0,t)},t.insTextAtDirEnd=function(t,e){r(e),e===Ct?this.appendText(t):this.prependText(t)},t.splitRight=function(t){var e=D(this.text.slice(t)).adopt(this.parent,this,this[Ct]);return e.jQadd(this.dom.splitText(t)),this.text=this.text.slice(0,t),e},t.moveTowards=function(t,e){var i,s;return r(t),i=n(-t,this.text),s=this[-t],s?s.insTextAtDirEnd(i,t):D(i).createDir(-t,e),this.deleteTowards(t,e)},t.latex=function(){return this.text},t.deleteTowards=function(t,e){this.text.length>1?t===Ct?(this.dom.deleteData(0,1),this.text=this.text.slice(1)):(this.dom.deleteData(-1+this.text.length,1),this.text=this.text.slice(0,-1)):(this.remove(),this.jQ.remove(),e[t]=this[t])},t.selectTowards=function(t,e){var i,s,o,a;return r(t),i=e.anticursor,s=n(-t,this.text),i[t]===this?(o=D(s).createDir(t,e),i[t]=o,e.insDirOf(t,o)):(a=this[-t],a?a.insTextAtDirEnd(s,t):(o=D(s).createDir(-t,e),o.jQ.insDirOf(-t,e.selection.jQ)),1===this.text.length&&i[-t]===this&&(i[-t]=this[-t])),this.deleteTowards(t,e)}}),At.$=Et.text=Et.textnormal=Et.textrm=Et.textup=Et.textmd=_,Et.em=Et.italic=Et.italics=Et.emph=Et.textit=Et.textsl=h("\\textit","i",'class="mq-text-mode"'),Et.strong=Et.bold=Et.textbf=h("\\textbf","b",'class="mq-text-mode"'),Et.sf=Et.textsf=h("\\textsf","span",'class="mq-sans-serif mq-text-mode"'),Et.tt=Et.texttt=h("\\texttt","span",'class="mq-monospace mq-text-mode"'),Et.textsc=h("\\textsc","span",'style="font-variant:small-caps" class="mq-text-mode"'),Et.uppercase=h("\\uppercase","span",'style="text-transform:uppercase" class="mq-text-mode"'),Et.lowercase=h("\\lowercase","span",'style="text-transform:lowercase" class="mq-text-mode"'),S=Qt(O,function(t,e){t.init=function(t){e.init.call(this,"$"),this.cursor=t},t.htmlTemplate='<span class="mq-math-mode">&0</span>',t.createBlocks=function(){e.createBlocks.call(this),this.ends[Tt].cursor=this.cursor,this.ends[Tt].write=function(t,e){"$"!==e?T.prototype.write.call(this,t,e):this.isEmpty()?(t.insRightOf(this.parent),this.parent.deleteTowards(dir,t),j("\\$","$").createLeftOf(t.show())):t[Ct]?t[Tt]?T.prototype.write.call(this,t,e):t.insLeftOf(this.parent):t.insRightOf(this.parent)}},t.latex=function(){return"$"+this.ends[Tt].latex()+"$"}}),L=Qt(C,function(t,e){t.keystroke=function(t){return"Spacebar"!==t&&"Shift-Spacebar"!==t?e.keystroke.apply(this,arguments):void 0},t.write=function(t,e){if(t.show().deleteSelection(),"$"===e)S(t).createLeftOf(t);else{var n;"<"===e?n="&lt;":">"===e&&(n="&gt;"),j(e,n).createLeftOf(t)}}}),Mt.TextField=function(t){return Qt(t.EditableField,function(t,e){this.RootBlock=L,t.__mathquillify=function(){return e.__mathquillify.call(this,"mq-editable-field mq-text-mode")},t.latex=function(t){return arguments.length>0?(this.__controller.renderLatexText(t),this.__controller.blurred&&this.__controller.cursor.hide().parent.blur(),this):this.__controller.exportLatex()}})},Et.notin=Et.cong=Et.equiv=Et.oplus=Et.otimes=Qt(Q,function(t,e){t.init=function(t){e.init.call(this,"\\"+t+" ","&"+t+";")}}),Et["≠"]=Et.ne=Et.neq=i(Q,"\\ne ","&ne;"),Et.ast=Et.star=Et.loast=Et.lowast=i(Q,"\\ast ","&lowast;"),Et.therefor=Et.therefore=i(Q,"\\therefore ","&there4;"),Et.cuz=Et.because=i(Q,"\\because ","&#8757;"),Et.prop=Et.propto=i(Q,"\\propto ","&prop;"),Et["≈"]=Et.asymp=Et.approx=i(Q,"\\approx ","&asymp;"),Et.isin=Et["in"]=i(Q,"\\in ","&isin;"),Et.ni=Et.contains=i(Q,"\\ni ","&ni;"),Et.notni=Et.niton=Et.notcontains=Et.doesnotcontain=i(Q,"\\not\\ni ","&#8716;"),Et.sub=Et.subset=i(Q,"\\subset ","&sub;"),Et.sup=Et.supset=Et.superset=i(Q,"\\supset ","&sup;"),Et.nsub=Et.notsub=Et.nsubset=Et.notsubset=i(Q,"\\not\\subset ","&#8836;"),Et.nsup=Et.notsup=Et.nsupset=Et.notsupset=Et.nsuperset=Et.notsuperset=i(Q,"\\not\\supset ","&#8837;"),Et.sube=Et.subeq=Et.subsete=Et.subseteq=i(Q,"\\subseteq ","&sube;"),Et.supe=Et.supeq=Et.supsete=Et.supseteq=Et.supersete=Et.superseteq=i(Q,"\\supseteq ","&supe;"),Et.nsube=Et.nsubeq=Et.notsube=Et.notsubeq=Et.nsubsete=Et.nsubseteq=Et.notsubsete=Et.notsubseteq=i(Q,"\\not\\subseteq ","&#8840;"),Et.nsupe=Et.nsupeq=Et.notsupe=Et.notsupeq=Et.nsupsete=Et.nsupseteq=Et.notsupsete=Et.notsupseteq=Et.nsupersete=Et.nsuperseteq=Et.notsupersete=Et.notsuperseteq=i(Q,"\\not\\supseteq ","&#8841;"),Et.N=Et.naturals=Et.Naturals=i(j,"\\mathbb{N}","&#8469;"),Et.P=Et.primes=Et.Primes=Et.projective=Et.Projective=Et.probability=Et.Probability=i(j,"\\mathbb{P}","&#8473;"),Et.Z=Et.integers=Et.Integers=i(j,"\\mathbb{Z}","&#8484;"),Et.Q=Et.rationals=Et.Rationals=i(j,"\\mathbb{Q}","&#8474;"),Et.R=Et.reals=Et.Reals=i(j,"\\mathbb{R}","&#8477;"),Et.C=Et.complex=Et.Complex=Et.complexes=Et.Complexes=Et.complexplane=Et.Complexplane=Et.ComplexPlane=i(j,"\\mathbb{C}","&#8450;"),Et.H=Et.Hamiltonian=Et.quaternions=Et.Quaternions=i(j,"\\mathbb{H}","&#8461;"),Et.quad=Et.emsp=i(j,"\\quad ","    "),Et.qquad=i(j,"\\qquad ","        "),Et.diamond=i(j,"\\diamond ","&#9671;"),Et.bigtriangleup=i(j,"\\bigtriangleup ","&#9651;"),Et.ominus=i(j,"\\ominus ","&#8854;"),Et.uplus=i(j,"\\uplus ","&#8846;"),Et.bigtriangledown=i(j,"\\bigtriangledown ","&#9661;"),Et.sqcap=i(j,"\\sqcap ","&#8851;"),Et.triangleleft=i(j,"\\triangleleft ","&#8882;"),Et.sqcup=i(j,"\\sqcup ","&#8852;"),Et.triangleright=i(j,"\\triangleright ","&#8883;"),Et.odot=Et.circledot=i(j,"\\odot ","&#8857;"),Et.bigcirc=i(j,"\\bigcirc ","&#9711;"),Et.dagger=i(j,"\\dagger ","&#0134;"),Et.ddagger=i(j,"\\ddagger ","&#135;"),Et.wr=i(j,"\\wr ","&#8768;"),Et.amalg=i(j,"\\amalg ","&#8720;"),Et.models=i(j,"\\models ","&#8872;"),Et.prec=i(j,"\\prec ","&#8826;"),Et.succ=i(j,"\\succ ","&#8827;"),Et.preceq=i(j,"\\preceq ","&#8828;"),Et.succeq=i(j,"\\succeq ","&#8829;"),Et.simeq=i(j,"\\simeq ","&#8771;"),Et.mid=i(j,"\\mid ","&#8739;"),Et.ll=i(j,"\\ll ","&#8810;"),Et.gg=i(j,"\\gg ","&#8811;"),Et.parallel=i(j,"\\parallel ","&#8741;"),Et.nparallel=i(j,"\\nparallel ","&#8742;"),Et.bowtie=i(j,"\\bowtie ","&#8904;"),Et.sqsubset=i(j,"\\sqsubset ","&#8847;"),Et.sqsupset=i(j,"\\sqsupset ","&#8848;"),Et.smile=i(j,"\\smile ","&#8995;"),Et.sqsubseteq=i(j,"\\sqsubseteq ","&#8849;"),Et.sqsupseteq=i(j,"\\sqsupseteq ","&#8850;"),Et.doteq=i(j,"\\doteq ","&#8784;"),Et.frown=i(j,"\\frown ","&#8994;"),Et.vdash=i(j,"\\vdash ","&#8870;"),Et.dashv=i(j,"\\dashv ","&#8867;"),Et.nless=i(j,"\\nless ","&#8814;"),Et.ngtr=i(j,"\\ngtr ","&#8815;"),Et.longleftarrow=i(j,"\\longleftarrow ","&#8592;"),Et.longrightarrow=i(j,"\\longrightarrow ","&#8594;"),Et.Longleftarrow=i(j,"\\Longleftarrow ","&#8656;"),Et.Longrightarrow=i(j,"\\Longrightarrow ","&#8658;"),Et.longleftrightarrow=i(j,"\\longleftrightarrow ","&#8596;"),Et.updownarrow=i(j,"\\updownarrow ","&#8597;"),Et.Longleftrightarrow=i(j,"\\Longleftrightarrow ","&#8660;"),Et.Updownarrow=i(j,"\\Updownarrow ","&#8661;"),Et.mapsto=i(j,"\\mapsto ","&#8614;"),Et.nearrow=i(j,"\\nearrow ","&#8599;"),Et.hookleftarrow=i(j,"\\hookleftarrow ","&#8617;"),Et.hookrightarrow=i(j,"\\hookrightarrow ","&#8618;"),Et.searrow=i(j,"\\searrow ","&#8600;"),Et.leftharpoonup=i(j,"\\leftharpoonup ","&#8636;"),Et.rightharpoonup=i(j,"\\rightharpoonup ","&#8640;"),Et.swarrow=i(j,"\\swarrow ","&#8601;"),Et.leftharpoondown=i(j,"\\leftharpoondown ","&#8637;"),Et.rightharpoondown=i(j,"\\rightharpoondown ","&#8641;"),Et.nwarrow=i(j,"\\nwarrow ","&#8598;"),Et.ldots=i(j,"\\ldots ","&#8230;"),Et.cdots=i(j,"\\cdots ","&#8943;"),Et.vdots=i(j,"\\vdots ","&#8942;"),Et.ddots=i(j,"\\ddots ","&#8945;"),Et.surd=i(j,"\\surd ","&#8730;"),Et.triangle=i(j,"\\triangle ","&#9651;"),Et.ell=i(j,"\\ell ","&#8467;"),Et.top=i(j,"\\top ","&#8868;"),Et.flat=i(j,"\\flat ","&#9837;"),Et.natural=i(j,"\\natural ","&#9838;"),Et.sharp=i(j,"\\sharp ","&#9839;"),Et.wp=i(j,"\\wp ","&#8472;"),Et.bot=i(j,"\\bot ","&#8869;"),Et.clubsuit=i(j,"\\clubsuit ","&#9827;"),Et.diamondsuit=i(j,"\\diamondsuit ","&#9826;"),Et.heartsuit=i(j,"\\heartsuit ","&#9825;"),Et.spadesuit=i(j,"\\spadesuit ","&#9824;"),Et.parallelogram=i(j,"\\parallelogram ","&#9649;"),Et.square=i(j,"\\square ","&#11036;"),Et.oint=i(j,"\\oint ","&#8750;"),Et.bigcap=i(j,"\\bigcap ","&#8745;"),Et.bigcup=i(j,"\\bigcup ","&#8746;"),Et.bigsqcup=i(j,"\\bigsqcup ","&#8852;"),Et.bigvee=i(j,"\\bigvee ","&#8744;"),Et.bigwedge=i(j,"\\bigwedge ","&#8743;"),Et.bigodot=i(j,"\\bigodot ","&#8857;"),Et.bigotimes=i(j,"\\bigotimes ","&#8855;"),Et.bigoplus=i(j,"\\bigoplus ","&#8853;"),Et.biguplus=i(j,"\\biguplus ","&#8846;"),Et.lfloor=i(j,"\\lfloor ","&#8970;"),Et.rfloor=i(j,"\\rfloor ","&#8971;"),Et.lceil=i(j,"\\lceil ","&#8968;"),Et.rceil=i(j,"\\rceil ","&#8969;"),Et.opencurlybrace=Et.lbrace=i(j,"\\lbrace ","{"),Et.closecurlybrace=Et.rbrace=i(j,"\\rbrace ","}"),Et.lbrack=i(j,"["),Et.rbrack=i(j,"]"),Et.slash=i(j,"/"),Et.vert=i(j,"|"),Et.perp=Et.perpendicular=i(j,"\\perp ","&perp;"),Et.nabla=Et.del=i(j,"\\nabla ","&nabla;"),Et.hbar=i(j,"\\hbar ","&#8463;"),Et.AA=Et.Angstrom=Et.angstrom=i(j,"\\text\\AA ","&#8491;"),Et.ring=Et.circ=Et.circle=i(j,"\\circ ","&#8728;"),Et.bull=Et.bullet=i(j,"\\bullet ","&bull;"),Et.setminus=Et.smallsetminus=i(j,"\\setminus ","&#8726;"),Et.not=Et["¬"]=Et.neg=i(j,"\\neg ","&not;"),Et["…"]=Et.dots=Et.ellip=Et.hellip=Et.ellipsis=Et.hellipsis=i(j,"\\dots ","&hellip;"),Et.converges=Et.darr=Et.dnarr=Et.dnarrow=Et.downarrow=i(j,"\\downarrow ","&darr;"),Et.dArr=Et.dnArr=Et.dnArrow=Et.Downarrow=i(j,"\\Downarrow ","&dArr;"),Et.diverges=Et.uarr=Et.uparrow=i(j,"\\uparrow ","&uarr;"),Et.uArr=Et.Uparrow=i(j,"\\Uparrow ","&uArr;"),Et.to=i(Q,"\\to ","&rarr;"),Et.rarr=Et.rightarrow=i(j,"\\rightarrow ","&rarr;"),Et.implies=i(Q,"\\Rightarrow ","&rArr;"),Et.rArr=Et.Rightarrow=i(j,"\\Rightarrow ","&rArr;"),Et.gets=i(Q,"\\gets ","&larr;"),Et.larr=Et.leftarrow=i(j,"\\leftarrow ","&larr;"),Et.impliedby=i(Q,"\\Leftarrow ","&lArr;"),Et.lArr=Et.Leftarrow=i(j,"\\Leftarrow ","&lArr;"),Et.harr=Et.lrarr=Et.leftrightarrow=i(j,"\\leftrightarrow ","&harr;"),Et.iff=i(Q,"\\Leftrightarrow ","&hArr;"),Et.hArr=Et.lrArr=Et.Leftrightarrow=i(j,"\\Leftrightarrow ","&hArr;"),Et.Re=Et.Real=Et.real=i(j,"\\Re ","&real;"),Et.Im=Et.imag=Et.image=Et.imagin=Et.imaginary=Et.Imaginary=i(j,"\\Im ","&image;"),Et.part=Et.partial=i(j,"\\partial ","&part;"),Et.infty=Et.infin=Et.infinity=i(j,"\\infty ","&infin;"),Et.alef=Et.alefsym=Et.aleph=Et.alephsym=i(j,"\\aleph ","&alefsym;"),Et.xist=Et.xists=Et.exist=Et.exists=i(j,"\\exists ","&exist;"),Et.nexists=Et.nexist=i(j,"\\nexists ","&#8708;"),Et.and=Et.land=Et.wedge=i(j,"\\wedge ","&and;"),Et.or=Et.lor=Et.vee=i(j,"\\vee ","&or;"),Et.o=Et.O=Et.empty=Et.emptyset=Et.oslash=Et.Oslash=Et.nothing=Et.varnothing=i(Q,"\\varnothing ","&empty;"),Et.cup=Et.union=i(Q,"\\cup ","&cup;"),Et.cap=Et.intersect=Et.intersection=i(Q,"\\cap ","&cap;"),Et.deg=Et.degree=i(j,"\\degree ","&deg;"),Et.ang=Et.angle=i(j,"\\angle ","&ang;"),Et.measuredangle=i(j,"\\measuredangle ","&#8737;"),E=Qt(j,function(t,e){t.createLeftOf=function(t){t.options.autoSubscriptNumerals&&t.parent!==t.parent.parent.sub&&(t[Tt]instanceof A&&t[Tt].isItalic!==!1||t[Tt]instanceof st&&t[Tt][Tt]instanceof A&&t[Tt][Tt].isItalic!==!1)?(Et._().createLeftOf(t),e.createLeftOf.call(this,t),t.insRightOf(t.parent.parent)):e.createLeftOf.call(this,t)}}),A=Qt(k,function(t,e){t.init=function(t,n){e.init.call(this,t,"<var>"+(n||t)+"</var>")},t.text=function(){var t=this.ctrlSeq;return!this[Tt]||this[Tt]instanceof A||this[Tt]instanceof Q||"\\ "===this[Tt].ctrlSeq||(t="*"+t),!this[Ct]||this[Ct]instanceof Q||this[Ct]instanceof st||(t+="*"),t}}),Bt.p.autoCommands={_maxLength:0},Ft.autoCommands=function(t){var e,n,i,s,r;if(!/^[a-z]+(?: [a-z]+)*$/i.test(t))throw'"'+t+'" not a space-delimited list of only letters';for(e=t.split(" "),n={},i=0,s=0;s<e.length;s+=1){if(r=e[s],r.length<2)throw'autocommand "'+r+'" not minimum length of 2';if(Et[r]===B)throw'"'+r+'" is a built-in operator name';n[r]=1,i=Ot(i,r.length)}return n._maxLength=i,n},R=Qt(A,function(t,e){function n(t){return!t||t instanceof Q||t instanceof rt}t.init=function(t){return e.init.call(this,this.letter=t)},t.createLeftOf=function(t){var n,i,s,r,o;if(e.createLeftOf.apply(this,arguments),n=t.options.autoCommands,i=n._maxLength,i>0){for(s="",r=this,o=0;r instanceof R&&r.ctrlSeq===r.letter&&i>o;)s=r.letter+s,r=r[Tt],o+=1;for(;s.length;){if(n.hasOwnProperty(s)){for(o=1,r=this;o<s.length;o+=1,r=r[Tt]);return Lt(r,this).remove(),t[Tt]=r[Tt],Et[s](s).createLeftOf(t)}s=s.slice(1)}}},t.italicize=function(t){return this.isItalic=t,this.jQ.toggleClass("mq-operator-name",!t),this},t.finalizeTree=t.siblingDeleted=t.siblingCreated=function(t,e){e!==Tt&&this[Ct]instanceof R||this.autoUnItalicize(t)},t.autoUnItalicize=function(t){var e,i,s,r,o,a,l,c,u,h,f,p,d,m=t.autoOperatorNames;if(0!==m._maxLength){for(e=this.letter,i=this[Tt];i instanceof R;i=i[Tt])e=i.letter+e;for(s=this[Ct];s instanceof R;s=s[Ct])e+=s.letter;Lt(i[Ct]||this.parent.ends[Tt],s[Tt]||this.parent.ends[Ct]).each(function(t){t.italicize(!0).jQ.removeClass("mq-first mq-last mq-followed-by-supsub"),t.ctrlSeq=t.letter});t:for(r=0,o=i[Ct]||this.parent.ends[Tt];r<e.length;r+=1,o=o[Ct])for(a=yt(m._maxLength,e.length-r);a>0;a-=1)if(l=e.slice(r,r+a),m.hasOwnProperty(l)){for(c=0,u=o;a>c;c+=1,u=u[Ct])u.italicize(!1),h=u;f=I.hasOwnProperty(l),o.ctrlSeq=(f?"\\":"\\operatorname{")+o.ctrlSeq,h.ctrlSeq+=f?" ":"}",M.hasOwnProperty(l)&&h[Tt][Tt][Tt].jQ.addClass("mq-last"),n(o[Tt])||o.jQ.addClass("mq-first"),n(h[Ct])||(h[Ct]instanceof st?(p=h[Ct],(d=p.siblingCreated=p.siblingDeleted=function(){p.jQ.toggleClass("mq-after-operator-name",!(p[Ct]instanceof ht))})()):h.jQ.toggleClass("mq-last",!(h[Ct]instanceof ht))),r+=a-1,o=h;continue t}}}}),I={},z=Bt.p.autoOperatorNames={_maxLength:9},M={limsup:1,liminf:1,projlim:1,injlim:1},function(){var t,e,n,i,s="arg deg det dim exp gcd hom inf ker lg lim ln log max min sup limsup liminf injlim projlim Pr".split(" ");for(t=0;t<s.length;t+=1)I[s[t]]=z[s[t]]=1;for(e="sin cos tan arcsin arccos arctan sinh cosh tanh sec csc cot coth".split(" "),t=0;t<e.length;t+=1)I[e[t]]=1;for(n="sin cos tan sec cosec csc cotan cot ctg".split(" "),t=0;t<n.length;t+=1)z[n[t]]=z["arc"+n[t]]=z[n[t]+"h"]=z["ar"+n[t]+"h"]=z["arc"+n[t]+"h"]=1;for(i="gcf hcf lcm proj span".split(" "),t=0;t<i.length;t+=1)z[i[t]]=1}(),Ft.autoOperatorNames=function(t){var e,n,i,s,r;if(!/^[a-z]+(?: [a-z]+)*$/i.test(t))throw'"'+t+'" not a space-delimited list of only letters';for(e=t.split(" "),n={},i=0,s=0;s<e.length;s+=1){if(r=e[s],r.length<2)throw'"'+r+'" not minimum length of 2';n[r]=1,i=Ot(i,r.length)}return n._maxLength=i,n},B=Qt(k,function(t,e){t.init=function(t){this.ctrlSeq=t},t.createLeftOf=function(t){var e,n=this.ctrlSeq;for(e=0;e<n.length;e+=1)R(n.charAt(e)).createLeftOf(t)},t.parser=function(){var t,e=this.ctrlSeq,n=T();for(t=0;t<e.length;t+=1)R(e.charAt(t)).adopt(n,n.ends[Ct],0);return w.succeed(n.children())}});for(F in z)z.hasOwnProperty(F)&&(Et[F]=B);Et.operatorname=Qt(O,function(e){e.createLeftOf=t,e.numBlocks=function(){return 1},e.parser=function(){return x.block.map(function(t){return t.children()})}}),Et.f=Qt(R,function(t,e){t.init=function(){k.p.init.call(this,this.letter="f",'<var class="mq-f">f</var>')},t.italicize=function(t){return this.jQ.html("f").toggleClass("mq-f",t),e.italicize.apply(this,arguments)}}),Et[" "]=Et.space=i(j,"\\ ","&nbsp;"),Et["'"]=Et.prime=i(j,"'","&prime;"),Et.backslash=i(j,"\\backslash ","\\"),At["\\"]||(At["\\"]=Et.backslash),Et.$=i(j,"\\$","$"),$=Qt(k,function(t,e){t.init=function(t,n){e.init.call(this,t,'<span class="mq-nonSymbola">'+(n||t)+"</span>")}}),Et["@"]=$,Et["&"]=i($,"\\&","&amp;"),Et["%"]=i($,"\\%","%"),Et.alpha=Et.beta=Et.gamma=Et.delta=Et.zeta=Et.eta=Et.theta=Et.iota=Et.kappa=Et.mu=Et.nu=Et.xi=Et.rho=Et.sigma=Et.tau=Et.chi=Et.psi=Et.omega=Qt(A,function(t,e){t.init=function(t){e.init.call(this,"\\"+t+" ","&"+t+";")}}),Et.phi=i(A,"\\phi ","&#981;"),Et.phiv=Et.varphi=i(A,"\\varphi ","&phi;"),Et.epsilon=i(A,"\\epsilon ","&#1013;"),Et.epsiv=Et.varepsilon=i(A,"\\varepsilon ","&epsilon;"),Et.piv=Et.varpi=i(A,"\\varpi ","&piv;"),Et.sigmaf=Et.sigmav=Et.varsigma=i(A,"\\varsigma ","&sigmaf;"),Et.thetav=Et.vartheta=Et.thetasym=i(A,"\\vartheta ","&thetasym;"),Et.upsilon=Et.upsi=i(A,"\\upsilon ","&upsilon;"),Et.gammad=Et.Gammad=Et.digamma=i(A,"\\digamma ","&#989;"),Et.kappav=Et.varkappa=i(A,"\\varkappa ","&#1008;"),Et.rhov=Et.varrho=i(A,"\\varrho ","&#1009;"),Et.pi=Et["π"]=i($,"\\pi ","&pi;"),Et.lambda=i($,"\\lambda ","&lambda;"),Et.Upsilon=Et.Upsi=Et.upsih=Et.Upsih=i(k,"\\Upsilon ",'<var style="font-family: serif">&upsih;</var>'),Et.Gamma=Et.Delta=Et.Theta=Et.Lambda=Et.Xi=Et.Pi=Et.Sigma=Et.Phi=Et.Psi=Et.Omega=Et.forall=Qt(j,function(t,e){t.init=function(t){e.init.call(this,"\\"+t+" ","&"+t+";")}}),N=Qt(O,function(t){t.init=function(t){this.latex=t},t.createLeftOf=function(t){var e=x.parse(this.latex);e.children().adopt(t.parent,t[Tt],t[Ct]),t[Tt]=e.ends[Ct],e.jQize().insertBefore(t.jQ),e.finalizeInsert(t.options,t),e.ends[Ct][Ct].siblingCreated&&e.ends[Ct][Ct].siblingCreated(t.options,Tt),e.ends[Tt][Tt].siblingCreated&&e.ends[Tt][Tt].siblingCreated(t.options,Ct),t.parent.bubble("reflow")},t.parser=function(){var t=x.parse(this.latex).children();return w.succeed(t)}}),Et["¹"]=i(N,"^1"),Et["²"]=i(N,"^2"),Et["³"]=i(N,"^3"),Et["¼"]=i(N,"\\frac14"),Et["½"]=i(N,"\\frac12"),Et["¾"]=i(N,"\\frac34"),P=Qt(Q,function(t){t.init=j.prototype.init,t.contactWeld=t.siblingCreated=t.siblingDeleted=function(t,e){return e!==Ct?(this.jQ[0].className=!this[Tt]||this[Tt]instanceof Q||/^[,;:\(\[]$/.test(this[Tt].ctrlSeq)?"":"mq-binary-operator",this):void 0}}),Et["+"]=i(P,"+","+"),Et["–"]=Et["-"]=i(P,"-","&minus;"),Et["±"]=Et.pm=Et.plusmn=Et.plusminus=i(P,"\\pm ","&plusmn;"),Et.mp=Et.mnplus=Et.minusplus=i(P,"\\mp ","&#8723;"),At["*"]=Et.sdot=Et.cdot=i(Q,"\\cdot ","&middot;","*"),U=Qt(Q,function(t,e){t.init=function(t,n){this.data=t,this.strict=n;var i=n?"Strict":"";e.init.call(this,t["ctrlSeq"+i],t["html"+i],t["text"+i])},t.swap=function(t){this.strict=t;var e=t?"Strict":"";this.ctrlSeq=this.data["ctrlSeq"+e],this.jQ.html(this.data["html"+e]),this.textTemplate=[this.data["text"+e]]},t.deleteTowards=function(t,n){return t!==Tt||this.strict?void e.deleteTowards.apply(this,arguments):(this.swap(!0),void this.bubble("reflow"))}}),W={ctrlSeq:"\\le ",html:"&le;",text:"≤",ctrlSeqStrict:"<",htmlStrict:"&lt;",textStrict:"<"},H={ctrlSeq:"\\ge ",html:"&ge;",text:"≥",ctrlSeqStrict:">",htmlStrict:"&gt;",textStrict:">"},Et["<"]=Et.lt=i(U,W,!0),Et[">"]=Et.gt=i(U,H,!0),Et["≤"]=Et.le=Et.leq=i(U,W,!1),Et["≥"]=Et.ge=Et.geq=i(U,H,!1),G=Qt(Q,function(t,e){t.init=function(){e.init.call(this,"=","=")},t.createLeftOf=function(t){return t[Tt]instanceof U&&t[Tt].strict?(t[Tt].swap(!1),void t[Tt].bubble("reflow")):void e.createLeftOf.apply(this,arguments)}}),Et["="]=G,Et["×"]=Et.times=i(Q,"\\times ","&times;","[x]"),Et["÷"]=Et.div=Et.divide=Et.divides=i(Q,"\\div ","&divide;","[/]"),At["~"]=Et.sim=i(Q,"\\sim ","~","~"),Y=t,X=document.createElement("div"),Z=X.style,V={transform:1,WebkitTransform:1,MozTransform:1,OTransform:1,msTransform:1};for(tt in V)if(tt in Z){J=tt;break}J?K=function(t,e,n){t.css(J,"scale("+e+","+n+")")}:"filter"in Z?(Y=function(t){t.className=t.className},K=function(t,e,n){function i(){t.css("marginRight",(s.width()-1)*(e-1)/e+"px")}var s,r;e/=1+(n-1)/2,t.css("fontSize",n+"em"),t.hasClass("mq-matrixed-container")||t.addClass("mq-matrixed-container").wrapInner('<span class="mq-matrixed"></span>'),s=t.children().css("filter","progid:DXImageTransform.Microsoft.Matrix(M11="+e+",SizingMethod='auto expand')"),i(),r=setInterval(i),_t(window).load(function(){clearTimeout(r),i()})}):K=function(t,e,n){t.css("fontSize",n+"em")},et=Qt(O,function(t,e){t.init=function(t,n,i){e.init.call(this,t,"<"+n+" "+i+">&0</"+n+">")}}),Et.mathrm=i(et,"\\mathrm","span",'class="mq-roman mq-font"'),Et.mathit=i(et,"\\mathit","i",'class="mq-font"'),Et.mathbf=i(et,"\\mathbf","b",'class="mq-font"'),Et.mathsf=i(et,"\\mathsf","span",'class="mq-sans-serif mq-font"'),Et.mathtt=i(et,"\\mathtt","span",'class="mq-monospace mq-font"'),Et.underline=i(et,"\\underline","span",'class="mq-non-leaf mq-underline"'),Et.overline=Et.bar=i(et,"\\overline","span",'class="mq-non-leaf mq-overline"'),Et.overrightarrow=i(et,"\\overrightarrow","span",'class="mq-non-leaf mq-overarrow mq-arrow-right"'),Et.overleftarrow=i(et,"\\overleftarrow","span",'class="mq-non-leaf mq-overarrow mq-arrow-left"'),nt=Et.textcolor=Qt(O,function(t,e){t.setColor=function(t){this.color=t,this.htmlTemplate='<span class="mq-textcolor" style="color:'+t+'">&0</span>'},t.latex=function(){return"\\textcolor{"+this.color+"}{"+this.blocks[0].latex()+"}"},t.parser=function(){var t=this,n=w.optWhitespace,i=w.string,s=w.regex;return n.then(i("{")).then(s(/^[#\w\s.,()%-]*/)).skip(i("}")).then(function(n){return t.setColor(n),e.parser.call(t)})}}),it=Et["class"]=Qt(O,function(t,e){t.parser=function(){var t=this,n=w.string,i=w.regex;return w.optWhitespace.then(n("{")).then(i(/^[-\w\s\\\xA0-\xFF]*/)).skip(n("}")).then(function(n){return t.htmlTemplate='<span class="mq-class '+n+'">&0</span>',e.parser.call(t)})}}),st=Qt(O,function(t,e){t.ctrlSeq="_{...}^{...}",t.createLeftOf=function(t){return t[Tt]||!t.options.supSubsRequireOperand?e.createLeftOf.apply(this,arguments):void 0},t.contactWeld=function(t){var e,n,i,s,r,o;for(e=Tt;e;e=e===Tt?Ct:!1)if(this[e]instanceof st){for(n="sub";n;n="sub"===n?"sup":!1)i=this[n],s=this[e][n],i&&(s?i.isEmpty()?o=Dt(s,0,s.ends[Tt]):(i.jQ.children().insAtDirEnd(-e,s.jQ),r=i.children().disown(),o=Dt(s,r.ends[Ct],s.ends[Tt]),e===Tt?r.adopt(s,s.ends[Ct],0):r.adopt(s,0,s.ends[Tt])):this[e].addBlock(i.disown()),this.placeCursor=function(t,n){return function(i){i.insAtDirEnd(-e,t||n)}}(s,i));this.remove(),t&&t[Tt]===this&&(e===Ct&&o?o[Tt]?t.insRightOf(o[Tt]):t.insAtLeftEnd(o.parent):t.insRightOf(this[e]));break}},Bt.p.charsThatBreakOutOfSupSub="",t.finalizeTree=function(){this.ends[Tt].write=function(t,e){if(t.options.autoSubscriptNumerals&&this===this.parent.sub){if("_"===e)return;var n=this.chToCmd(e);return n instanceof k?t.deleteSelection():t.clearSelection().insRightOf(this.parent),n.createLeftOf(t.show())}t[Tt]&&!t[Ct]&&!t.selection&&t.options.charsThatBreakOutOfSupSub.indexOf(e)>-1&&t.insRightOf(this.parent),T.p.write.apply(this,arguments)}},t.moveTowards=function(t,n,i){n.options.autoSubscriptNumerals&&!this.sup?n.insDirOf(t,this):e.moveTowards.apply(this,arguments)},t.deleteTowards=function(t,n){if(n.options.autoSubscriptNumerals&&this.sub){var i=this.sub.ends[-t];i instanceof k?i.remove():i&&i.deleteTowards(t,n.insAtDirEnd(-t,this.sub)),this.sub.isEmpty()&&(this.sub.deleteOutOf(Tt,n.insAtLeftEnd(this.sub)),this.sup&&n.insDirOf(-t,this))}else e.deleteTowards.apply(this,arguments)},t.latex=function(){function t(t,e){var n=e&&e.latex();return e?t+(1===n.length?n:"{"+(n||" ")+"}"):""}return t("_",this.sub)+t("^",this.sup)},t.addBlock=function(t){"sub"===this.supsub?(this.sup=this.upInto=this.sub.upOutOf=t,t.adopt(this,this.sub,0).downOutOf=this.sub,t.jQ=_t('<span class="mq-sup"/>').append(t.jQ.children()).attr(xt,t.id).prependTo(this.jQ)):(this.sub=this.downInto=this.sup.downOutOf=t,t.adopt(this,0,this.sup).upOutOf=this.sup,t.jQ=_t('<span class="mq-sub"></span>').append(t.jQ.children()).attr(xt,t.id).appendTo(this.jQ.removeClass("mq-sup-only")),this.jQ.append('<span style="display:inline-block;width:0">&#8203;</span>'));for(var e=0;2>e;e+=1)(function(t,e,n,i){t[e].deleteOutOf=function(s,r){if(r.insDirOf(this[s]?-s:s,this.parent),!this.isEmpty()){var o=this.ends[s];this.children().disown().withDirAdopt(s,r.parent,r[s],r[-s]).jQ.insDirOf(-s,r.jQ),r[-s]=o}t.supsub=n,delete t[e],delete t[i+"Into"],t[n][i+"OutOf"]=f,delete t[n].deleteOutOf,"sub"===e&&_t(t.jQ.addClass("mq-sup-only")[0].lastChild).remove(),this.remove()}})(this,"sub sup".split(" ")[e],"sup sub".split(" ")[e],"down up".split(" ")[e])}}),Et.subscript=Et._=Qt(st,function(t,e){t.supsub="sub",t.htmlTemplate='<span class="mq-supsub mq-non-leaf"><span class="mq-sub">&0</span><span style="display:inline-block;width:0">&#8203;</span></span>',t.textTemplate=["_"],t.finalizeTree=function(){this.downInto=this.sub=this.ends[Tt],this.sub.upOutOf=f,e.finalizeTree.call(this)}}),Et.superscript=Et.supscript=Et["^"]=Qt(st,function(t,e){t.supsub="sup",t.htmlTemplate='<span class="mq-supsub mq-non-leaf mq-sup-only"><span class="mq-sup">&0</span></span>',t.textTemplate=["^"],t.finalizeTree=function(){this.upInto=this.sup=this.ends[Ct],this.sup.downOutOf=f,e.finalizeTree.call(this)}}),rt=Qt(O,function(t,e){t.init=function(t,e){var n='<span class="mq-large-operator mq-non-leaf"><span class="mq-to"><span>&1</span></span><big>'+e+'</big><span class="mq-from"><span>&0</span></span></span>';k.prototype.init.call(this,t,n)},t.createLeftOf=function(t){e.createLeftOf.apply(this,arguments),t.options.sumStartsWithNEquals&&(R("n").createLeftOf(t),G().createLeftOf(t))},t.latex=function(){function t(t){
return 1===t.length?t:"{"+(t||" ")+"}"}return this.ctrlSeq+"_"+t(this.ends[Tt].latex())+"^"+t(this.ends[Ct].latex())},t.parser=function(){var t,e=w.string,n=w.optWhitespace,i=w.succeed,s=x.block,r=this,o=r.blocks=[T(),T()];for(t=0;t<o.length;t+=1)o[t].adopt(r,r.ends[Ct],0);return n.then(e("_").or(e("^"))).then(function(t){var e=o["_"===t?0:1];return s.then(function(t){return t.children().adopt(e,e.ends[Ct],0),i(r)})}).many().result(r)},t.finalizeTree=function(){this.downInto=this.ends[Tt],this.upInto=this.ends[Ct],this.ends[Tt].upOutOf=this.ends[Ct],this.ends[Ct].downOutOf=this.ends[Tt]}}),Et["∑"]=Et.sum=Et.summation=i(rt,"\\sum ","&sum;"),Et["∏"]=Et.prod=Et.product=i(rt,"\\prod ","&prod;"),Et.coprod=Et.coproduct=i(rt,"\\coprod ","&#8720;"),Et["∫"]=Et["int"]=Et.integral=Qt(rt,function(t,e){t.init=function(){var t='<span class="mq-int mq-non-leaf"><big>&int;</big><span class="mq-supsub mq-non-leaf"><span class="mq-sup"><span class="mq-sup-inner">&1</span></span><span class="mq-sub">&0</span><span style="display:inline-block;width:0">&#8203</span></span></span>';k.prototype.init.call(this,"\\int ",t)},t.createLeftOf=O.p.createLeftOf}),ot=Et.frac=Et.dfrac=Et.cfrac=Et.fraction=Qt(O,function(t,e){t.ctrlSeq="\\frac",t.htmlTemplate='<span class="mq-fraction mq-non-leaf"><span class="mq-numerator">&0</span><span class="mq-denominator">&1</span><span style="display:inline-block;width:0">&#8203;</span></span>',t.textTemplate=["(",")/(",")"],t.finalizeTree=function(){this.upInto=this.ends[Ct].upOutOf=this.ends[Tt],this.downInto=this.ends[Tt].downOutOf=this.ends[Ct]}}),at=Et.over=At["/"]=Qt(ot,function(e,n){e.createLeftOf=function(e){if(!this.replacedFragment){for(var i=e[Tt];i&&!(i instanceof Q||i instanceof(Et.text||t)||i instanceof rt||"\\ "===i.ctrlSeq||/^[,;:]$/.test(i.ctrlSeq));)i=i[Tt];i instanceof rt&&i[Ct]instanceof st&&(i=i[Ct],i[Ct]instanceof st&&i[Ct].ctrlSeq!=i.ctrlSeq&&(i=i[Ct])),i!==e[Tt]&&(this.replaces(Lt(i[Ct]||e.parent.ends[Tt],e[Tt])),e[Tt]=i)}n.createLeftOf.call(this,e)}}),lt=Et.sqrt=Et["√"]=Qt(O,function(t,e){t.ctrlSeq="\\sqrt",t.htmlTemplate='<span class="mq-non-leaf"><span class="mq-scaled mq-sqrt-prefix">&radic;</span><span class="mq-non-leaf mq-sqrt-stem">&0</span></span>',t.textTemplate=["sqrt(",")"],t.parser=function(){return x.optBlock.then(function(t){return x.block.map(function(e){var n=ut();return n.blocks=[t,e],t.adopt(n,0,0),e.adopt(n,t,0),n})}).or(e.parser.call(this))},t.reflow=function(){var t=this.ends[Ct].jQ;K(t.prev(),1,t.innerHeight()/+t.css("fontSize").slice(0,-2)-.1)}}),ct=Et.vec=Qt(O,function(t,e){t.ctrlSeq="\\vec",t.htmlTemplate='<span class="mq-non-leaf"><span class="mq-vector-prefix">&rarr;</span><span class="mq-vector-stem">&0</span></span>',t.textTemplate=["vec(",")"]}),ut=Et.nthroot=Qt(lt,function(t,e){t.htmlTemplate='<sup class="mq-nthroot mq-non-leaf">&0</sup><span class="mq-scaled"><span class="mq-sqrt-prefix mq-scaled">&radic;</span><span class="mq-sqrt-stem mq-non-leaf">&1</span></span>',t.textTemplate=["sqrt[","](",")"],t.latex=function(){return"\\sqrt["+this.ends[Tt].latex()+"]{"+this.ends[Ct].latex()+"}"}}),ht=Qt(Qt(O,p),function(e,n){e.init=function(t,e,i,s,r){n.init.call(this,"\\left"+s,m,[e,i]),this.side=t,this.sides={},this.sides[Tt]={ch:e,ctrlSeq:s},this.sides[Ct]={ch:i,ctrlSeq:r}},e.numBlocks=function(){return 1},e.html=function(){return this.htmlTemplate='<span class="mq-non-leaf"><span class="mq-scaled mq-paren'+(this.side===Ct?" mq-ghost":"")+'">'+this.sides[Tt].ch+'</span><span class="mq-non-leaf">&0</span><span class="mq-scaled mq-paren'+(this.side===Tt?" mq-ghost":"")+'">'+this.sides[Ct].ch+"</span></span>",n.html.call(this)},e.latex=function(){return"\\left"+this.sides[Tt].ctrlSeq+this.ends[Tt].latex()+"\\right"+this.sides[Ct].ctrlSeq},e.oppBrack=function(t,e,n){return e instanceof ht&&e.side&&e.side!==-n&&("|"===this.sides[this.side].ch||e.side===-this.side)&&(!t.restrictMismatchedBrackets||ft[this.sides[this.side].ch]===e.sides[e.side].ch||{"(":"]","[":")"}[this.sides[Tt].ch]===e.sides[Ct].ch)&&e},e.closeOpposing=function(t){t.side=0,t.sides[this.side]=this.sides[this.side],t.delimjQs.eq(this.side===Tt?0:1).removeClass("mq-ghost").html(this.sides[this.side].ch)},e.createLeftOf=function(t){var e,i,s;this.replacedFragment||(e=t.options,i=this.oppBrack(e,t[Tt],Tt)||this.oppBrack(e,t[Ct],Ct)||this.oppBrack(e,t.parent.parent)),i?(s=this.side=-i.side,this.closeOpposing(i),i===t.parent.parent&&t[s]&&(Lt(t[s],t.parent.ends[s],-s).disown().withDirAdopt(-s,i.parent,i,i[s]).jQ.insDirOf(s,i.jQ),i.bubble("reflow"))):(i=this,s=i.side,i.replacedFragment?i.side=0:t[-s]&&(i.replaces(Lt(t[-s],t.parent.ends[-s],s)),t[-s]=0),n.createLeftOf.call(i,t)),s===Tt?t.insAtLeftEnd(i.ends[Tt]):t.insRightOf(i)},e.placeCursor=t,e.unwrap=function(){this.ends[Tt].children().disown().adopt(this.parent,this,this[Ct]).jQ.insertAfter(this.jQ),this.remove()},e.deleteSide=function(t,e,n){var i,s,r,o=this.parent,a=this[t],l=o.ends[t];if(t===this.side)return this.unwrap(),void(a?n.insDirOf(-t,a):n.insAtDirEnd(t,o));if(i=n.options,s=!this.side,this.side=-t,this.oppBrack(i,this.ends[Tt].ends[this.side],t))this.closeOpposing(this.ends[Tt].ends[this.side]),r=this.ends[Tt].ends[t],this.unwrap(),r.siblingCreated&&r.siblingCreated(n.options,t),a?n.insDirOf(-t,a):n.insAtDirEnd(t,o);else{if(this.oppBrack(i,this.parent.parent,t))this.parent.parent.closeOpposing(this),this.parent.parent.unwrap();else{if(e&&s)return this.unwrap(),void(a?n.insDirOf(-t,a):n.insAtDirEnd(t,o));this.sides[t]={ch:ft[this.sides[this.side].ch],ctrlSeq:ft[this.sides[this.side].ctrlSeq]},this.delimjQs.removeClass("mq-ghost").eq(t===Tt?0:1).addClass("mq-ghost").html(this.sides[t].ch)}a?(r=this.ends[Tt].ends[t],Lt(a,l,-t).disown().withDirAdopt(-t,this.ends[Tt],r,0).jQ.insAtDirEnd(t,this.ends[Tt].jQ.removeClass("mq-empty")),r.siblingCreated&&r.siblingCreated(n.options,t),n.insDirOf(-t,a)):e?n.insDirOf(t,this):n.insAtDirEnd(t,this.ends[Tt])}},e.deleteTowards=function(t,e){this.deleteSide(-t,!1,e)},e.finalizeTree=function(){this.ends[Tt].deleteOutOf=function(t,e){this.parent.deleteSide(t,!0,e)},this.finalizeTree=this.intentionalBlur=function(){this.delimjQs.eq(this.side===Tt?1:0).removeClass("mq-ghost"),this.side=0}},e.siblingCreated=function(t,e){e===-this.side&&this.finalizeTree()}}),ft={"(":")",")":"(","[":"]","]":"[","{":"}","}":"{","\\{":"\\}","\\}":"\\{","&lang;":"&rang;","&rang;":"&lang;","\\langle ":"\\rangle ","\\rangle ":"\\langle ","|":"|"},d("("),d("["),d("{","\\{"),Et.langle=i(ht,Tt,"&lang;","&rang;","\\langle ","\\rangle "),Et.rangle=i(ht,Ct,"&lang;","&rang;","\\langle ","\\rangle "),At["|"]=i(ht,Tt,"|","|","|","|"),Et.left=Qt(O,function(t){t.parser=function(){var t=w.regex,e=w.string,n=(w.succeed,w.optWhitespace);return n.then(t(/^(?:[([|]|\\\{)/)).then(function(i){var s="\\"===i.charAt(0)?i.slice(1):i;return x.then(function(r){return e("\\right").skip(n).then(t(/^(?:[\])|]|\\\})/)).map(function(t){var e="\\"===t.charAt(0)?t.slice(1):t,n=ht(0,s,e,i,t);return n.blocks=[r],r.adopt(n,0,0),n})})})}}),Et.right=Qt(O,function(t){t.parser=function(){return w.fail("unmatched \\right")}}),pt=Et.binom=Et.binomial=Qt(Qt(O,p),function(t,e){t.ctrlSeq="\\binom",t.htmlTemplate='<span class="mq-non-leaf"><span class="mq-paren mq-scaled">(</span><span class="mq-non-leaf"><span class="mq-array mq-non-leaf"><span>&0</span><span>&1</span></span></span><span class="mq-paren mq-scaled">)</span></span>',t.textTemplate=["choose(",",",")"]}),dt=Et.choose=Qt(pt,function(t){t.createLeftOf=at.prototype.createLeftOf}),Et.editable=Et.MathQuillMathField=Qt(O,function(t,e){t.ctrlSeq="\\MathQuillMathField",t.htmlTemplate='<span class="mq-editable-field"><span class="mq-root-block">&0</span></span>',t.parser=function(){var t=this,n=w.string,i=w.regex,s=w.succeed;return n("[").then(i(/^[a-z][a-z0-9]*/i)).skip(n("]")).map(function(e){t.name=e}).or(s()).then(e.parser.call(t))},t.finalizeTree=function(){var t=zt(this.ends[Tt],this.jQ,Bt());t.KIND_OF_MQ="MathField",t.editable=!0,t.createTextarea(),t.editablesTextareaEvents(),t.cursor.insAtRightEnd(t.root),u(t.root)},t.registerInnerField=function(t,e){t.push(t[this.name]=e(this.ends[Tt].controller))},t.latex=function(){return this.ends[Tt].latex()},t.text=function(){return this.ends[Tt].text()}}),mt=Et.embed=Qt(k,function(t,e){t.setOptions=function(t){function e(){return""}return this.text=t.text||e,this.htmlTemplate=t.htmlString||"",this.latex=t.latex||e,this},t.parser=function(){var t=this;return string=w.string,regex=w.regex,succeed=w.succeed,string("{").then(regex(/^[a-z][a-z0-9]*/i)).skip(string("}")).then(function(e){return string("[").then(regex(/^[-\w\s]*/)).skip(string("]")).or(succeed()).map(function(n){return t.setOptions(Nt[e](n))})})}}),gt=At["\\"]=Qt(O,function(t,e){t.ctrlSeq="\\",t.replaces=function(t){this._replacedFragment=t.disown(),this.isEmpty=function(){return!1}},t.htmlTemplate='<span class="mq-latex-command-input mq-non-leaf">\\<span>&0</span></span>',t.textTemplate=["\\"],t.createBlocks=function(){e.createBlocks.call(this),this.ends[Tt].focus=function(){return this.parent.jQ.addClass("mq-hasCursor"),this.isEmpty()&&this.parent.jQ.removeClass("mq-empty"),this},this.ends[Tt].blur=function(){return this.parent.jQ.removeClass("mq-hasCursor"),this.isEmpty()&&this.parent.jQ.addClass("mq-empty"),this},this.ends[Tt].write=function(t,e){t.show().deleteSelection(),e.match(/[a-z]/i)?j(e).createLeftOf(t):(this.parent.renderCommand(t),"\\"===e&&this.isEmpty()||this.parent.parent.write(t,e))},this.ends[Tt].keystroke=function(t,n,i){return"Tab"===t||"Enter"===t||"Spacebar"===t?(this.parent.renderCommand(i.cursor),void n.preventDefault()):e.keystroke.apply(this,arguments)}},t.createLeftOf=function(t){if(e.createLeftOf.call(this,t),this._replacedFragment){var n=this.jQ[0];this.jQ=this._replacedFragment.jQ.addClass("mq-blur").bind("mousedown mousemove",function(t){return _t(t.target=n).trigger(t),!1}).insertBefore(this.jQ).add(this.jQ)}},t.latex=function(){return"\\"+this.ends[Tt].latex()+" "},t.renderCommand=function(t){var e,n;this.jQ=this.jQ.last(),this.remove(),this[Ct]?t.insLeftOf(this[Ct]):t.insAtRightEnd(this.parent),e=this.ends[Tt].latex(),e||(e=" "),n=Et[e],n?(n=n(e),this._replacedFragment&&n.replaces(this._replacedFragment),n.createLeftOf(t)):(n=_(),n.replaces(e),n.createLeftOf(t),t.insRightOf(n),this._replacedFragment&&this._replacedFragment.remove())}}),bt=c(1);for(vt in bt)(function(t,e){"function"==typeof e?(l[t]=function(){return a(),e.apply(this,arguments)},l[t].prototype=e.prototype):l[t]=e})(vt,bt[vt])}();
;(function(){

/* ============================================================
   2A MODULE 2 · ALGEBRAÏSCHE UITDRUKKINGEN
   Opbouw: de algebramotor van de twee oude pagina's (één oefening
   per kaart), in de zijbalk- en kaartenwerking van het platform.
   Bron: /mnt/project-files/2A-module-2/bron, build.sh plakt alles samen.
   ============================================================ */
/* koppeling met het platform (voortgang per vraag); doet niets zonder aanmelding */
const CLres = (id, ok, info) => { try{ window.CL && window.CL.res(id, ok, info); }catch(e){} };
const CLvraag = id => { try{ window.CL && window.CL.vraag(id); }catch(e){} };
const CLtoets = (key, score, n) => { try{ window.CL && window.CL.toets(key, score, n); }catch(e){} };
const PREFIX = '2a_m2_algebra_v1_';
function load(k){ try{ const r = localStorage.getItem(PREFIX+k); if(r){ const p = JSON.parse(r); if(p && typeof p === 'object') return p; } }catch(e){} return {}; }
function store(k,v){ try{ localStorage.setItem(PREFIX+k, JSON.stringify(v)); }catch(e){} }
function wipe(k){ try{ localStorage.removeItem(PREFIX+k); }catch(e){} }
function el(tag, cls, html){ const e=document.createElement(tag); if(cls) e.className=cls; if(html!=null) e.innerHTML=html; return e; }
function shuffle(arr){ const a = arr.slice(); for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } return a; }

/* ---------- toevalsgenerator met zaadje (zelfde opgave na herladen) ---------- */
function mulberry(seed){ let a = seed>>>0; return ()=>{ a = (a + 0x6D2B79F5)>>>0; let t = a; t = Math.imul(t ^ (t>>>15), t | 1); t ^= t + Math.imul(t ^ (t>>>7), t | 61); return ((t ^ (t>>>14))>>>0) / 4294967296; }; }
function makeR(st, key='seed'){
  if(!st[key]) st[key] = 1 + Math.floor(Math.random()*2e9);
  const f = mulberry(st[key]);
  const R = {
    f, int:(a,b)=>a + Math.floor(f()*(b-a+1)), pick:arr=>arr[Math.floor(f()*arr.length)],
    sign:()=> f()<.5?-1:1,
    nz:(a,b)=>{ let x=0; while(x===0) x = a + Math.floor(f()*(b-a+1)); return x; },
    shuffle:arr=>{ const a=arr.slice(); for(let i=a.length-1;i>0;i--){ const j=Math.floor(f()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } return a; }
  };
  return R;
}

/* ---------- iconen ---------- */
const T = (s, size=9, y=15.5) => `<text x="12" y="${y}" text-anchor="middle" font-size="${size}" stroke="none" fill="currentColor">${s}</text>`;
const TI = (s, size=10, y=15.5) => `<text x="12" y="${y}" text-anchor="middle" font-size="${size}" font-style="italic" font-family="Georgia,serif" stroke="none" fill="currentColor">${s}</text>`;
const ICONS = {
  letter:TI('x',15,17),
  eenterm:TI('3a²',9,15.5),
  gelijk:'<rect x="3" y="6" width="7.5" height="12" rx="2"/><rect x="13.5" y="6" width="7.5" height="12" rx="2"/>',
  veelterm:T('+ −',9,15),
  patroon:'<rect x="3" y="14" width="4" height="4"/><rect x="9" y="10" width="4" height="8"/><rect x="15" y="6" width="4" height="12"/>',
  herleid:'<path d="M4 7h16M7 12h10M10 17h4"/>',
  getal:TI('x=2',7.5,15),
  omtrek:'<path d="M4 18L8 6h12l-4 12z"/>',
  som:'<circle cx="12" cy="12" r="8.5"/><path d="M12 8v8M8 12h8"/>',
  verschil:'<circle cx="12" cy="12" r="8.5"/><path d="M8 12h8"/>',
  maal:'<circle cx="12" cy="12" r="8.5"/><path d="M9 9l6 6M15 9l-6 6"/>',
  distr:'<path d="M4 16c3-7 6-7 8 0M4 16c5-10 11-10 16 0"/><circle cx="4" cy="16" r="1.4" fill="currentColor"/>',
  toep:'<rect x="3.5" y="6.5" width="17" height="11" rx="1"/><path d="M3.5 21h17M20.5 3v18" stroke-dasharray="2 2"/>',
  fout:'<circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.3 15.3l5 5"/><path d="M8.3 8.3l4.4 4.4M12.7 8.3l-4.4 4.4"/>',
  toets:'<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 3h6v3.2H9zM8.5 12l2 2 4.5-4.5M8.5 17.5h7"/>',
  na:'<path d="M5 4h14v16H5z"/><path d="M8 9l1.5 1.5L12 8M8 14l1.5 1.5L12 13M14 9.5h2.5M14 14.5h2.5"/>',
  quiz:'<circle cx="12" cy="13" r="8"/><path d="M12 13V8.5M12 13l3 2M10 2.5h4"/>',
  cheat:'<path d="M5.5 3h9l4 4v14h-13z"/><path d="M14.5 3v4h4M8.5 11h7M8.5 14.5h7M8.5 18h4"/>',
  bulb:'<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2V16h5v-.1c0-.8.4-1.5 1-2A6 6 0 0 0 12 3z"/>',
  info:'<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.5"/>',
  play:'<path d="M7 4.5v15l12-7.5z"/>',
  bord:'<rect x="3" y="4" width="18" height="12" rx="1.5"/><path d="M8 20l4-4 4 4"/>'
};
const icon = k => `<svg class="ic" viewBox="0 0 24 24" aria-hidden="true">${ICONS[k] || ''}</svg>`;
const LVL = {1:'<span class="lvl-badge l1">basis</span>', 2:'<span class="lvl-badge l2">oefenen</span>', 3:'<span class="lvl-badge l3">verdieping</span>'};
function fmtN(x){ const r = Math.round(x*100)/100; return String(r).replace('.', ','); }

/* foto's van de oude pagina's */
const IMG = { muntjes:'img/muntjes.jpg', stickers:'img/stickers.jpg', basket:'img/basket.jpg' };

/* ============================================================
   KAARTWIDGET (aq): één oefening van de algebramotor in een kaart.
   De motor werkte met één vraag per scherm en vaste id's; hier
   zoekt $R(naam) binnen de kaart die nu actief is (CUR). Elke kaart
   heeft haar eigen ui-toestand, antwoord (st.val) en verbetering
   (st.check). Klikken, typen of focus in een kaart maakt ze actief.
   ============================================================ */
let CUR = null;
const AQS = [];
function $R(n){ return CUR ? CUR.root.querySelector('[data-r="'+n+'"]') : null; }
function withCard(c, fn){ const p = CUR; CUR = c; try{ return fn(); } finally { CUR = p; } }
function rafC(fn){ const c = CUR; return requestAnimationFrame(t => { if(c && !c.root.isConnected) return; withCard(c, () => fn(t)); }); }
function setTimeoutC(fn, ms){ const c = CUR; return setTimeout(() => { if(c && !c.root.isConnected) return; withCard(c, fn); }, ms); }
const UI_LEEG = {};
const ui = new Proxy({}, {
  get:(t, k) => (CUR ? CUR.ui : UI_LEEG)[k],
  set:(t, k, v) => { (CUR ? CUR.ui : UI_LEEG)[k] = v; return true; }
});
function nieuweUi(){ return { armyAnim:false, mcol:0, tsel:null, klsel:null, dsel:null, dhint:false, patHi:false, curQ:null, freshSub:null, freshArc:null, afterDraw:null }; }

/* ---------- antwoorden: enkel via deze functies ---------- */
function getVal(q){
  const d = defaultVal(q), e = CUR && CUR.st.val;
  if(!e || typeof e !== 'object') return d;
  const v = clone(e);
  Object.keys(d).forEach(k => { if(v[k] === undefined) v[k] = d[k]; });
  return v;
}
function completed(q){ return isComplete(q, getVal(q)); }
function saveAnswer(q, v){
  if(!CUR || CUR.locked) return;                  /* bordmodus of verbeterde proeftoets: niets bewaren */
  CUR.st.val = v;
  if(CUR.st.check && CUR.mode !== 'toets'){ delete CUR.st.check; CUR.st.sol = false; CUR.dirtyCheck = true; }
  CUR.save();
  if(CUR.changed) CUR.changed();
}

/* ---------- begrippenlijst (uitleg bij aanwijzen) ---------- */
let glossRe = null;
function glossify(text){
  if(!glossRe){
    const keys = Object.keys(GLOSSARY).sort((a,b)=>b.length-a.length);
    glossRe = new RegExp('(' + keys.map(k=>k.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('|') + ')', 'gi');
  }
  const used = new Set();
  return String(text).split(glossRe).map((part, idx) => {
    if(idx % 2 === 0) return esc(part);
    const key = part.toLowerCase();
    if(used.has(key) || !GLOSSARY[key]) return esc(part);
    used.add(key);
    return '<span class="gloss" title="'+esc(GLOSSARY[key])+'">'+esc(part)+'</span>';
  }).join('');
}
function hintText(q){ return q.hint || (q.type === 'pat' ? (PATHINT[q.fig] || '') : (HINTS[q.id] || '')); }

/* ---------- tekenen ---------- */
const RENDER = () => ({ kies:renderKies, fout:renderFout, sorteer:renderSorteer, omkring:renderOmkring, isgelijk:renderIsgelijk,
  bewteken:renderBewteken, labels:renderLabels, koppel:renderKoppel, orden:renderOrden, kleur:renderKleur, tabel:renderTabel,
  rows:renderRows, herlrows:renderHerlrows, herl:renderHerl, hw:renderHw, gw:renderGw, gwtabel:renderGwtabel, mono:renderMono,
  prodtab:renderProdtab, distr:renderDistr, opp:renderOpp, omtrek:renderOmtrek, pat:renderPat, pira:renderPira, ctx:renderCtx });
const SIDE_TYPES = { kies:true, fout:true, ctx:true };
function isSide(q){ return !!SIDE_TYPES[q.type] && !!(q.img || q.svg || q.type === 'fout'); }
function render(){ if(CUR) renderCard(CUR); }
function renderCard(c){
  withCard(c, () => {
    const q = c.q, v = getVal(q);
    const instr = $R('instruction'); instr.innerHTML = rich(q.instr || INSTR[q.type] || '');
    const hint = hintText(q), hb = $R('hintBtn'), hbox = $R('hintBox');
    if(hb){ hb.hidden = !hint; hb.classList.toggle('on', !!ui.hintOn); hb.innerHTML = icon('bulb') + (ui.hintOn ? 'Verberg de hint' : 'Hint'); }
    if(hbox){ hbox.hidden = !(ui.hintOn && hint); hbox.innerHTML = hint ? '<b class="hk">Hint:</b> ' + rich(hint) : ''; }
    $R('workspace').classList.toggle('stack', !isSide(q) || c.root.clientWidth < 640);
    if(ui.curQ !== q.id){ ui.curQ = q.id; ui.tsel = null; ui.klsel = null; ui.dsel = null; ui.dhint = false; ui.patHi = false; ui.afterDraw = null; ui.rdsel = null; ui.rdhint = null; ui.sgOpen = null; ui.freshSg = null; }
    if(c.mode === 'toets' && q.type === 'pat') ui.patHi = false;
    RENDER()[q.type](q, v);
    toonVerbetering(q);
    const ans = $R('answer'); ans.style.display = ans.innerHTML.trim() ? '' : 'none';
    const vis = $R('visual'); vis.style.display = vis.innerHTML.trim() ? '' : 'none';
    c.root.classList.toggle('locked', !!c.locked);
    syncKnoppen(c);
  });
}
function syncKnoppen(c){
  withCard(c, () => {
    const b = $R('checkQ'); if(!b) return;
    const klaar = completed(c.q), r = c.st.check, ok = r && r.goed === r.totaal;
    b.disabled = !klaar || !!r;
    b.innerHTML = r ? (ok ? '✓ Juist!' : 'Verbeterd') : 'Verbeteren';
    b.title = klaar ? (r ? 'Pas je antwoord aan om opnieuw te verbeteren.' : 'Kijk je antwoord na.') : 'Vul eerst de hele oefening in.';
    const sb = $R('solBtn'); if(sb) sb.hidden = !r || ok || !!c.st.sol;
    const fb = $R('fb');
    if(fb){
      if(!r){ fb.className = 'fb'; fb.innerHTML = ''; }
      else if(ok){ fb.className = 'fb ok'; fb.innerHTML = 'Juist!'; }
      else { fb.className = 'fb bad'; fb.innerHTML = 'Nog niet juist. Kijk naar de rode kringen en de tips hieronder.'; }
    }
  });
}

/* ---------- een kaart opbouwen ----------
   opts: {mode:'oef'|'toets', key, extra:[knoppen]}                       */
function mountAQ(body, q, st, save, opts){
  opts = opts || {};
  const root = el('div', 'aq');
  root.innerHTML =
    '<p class="instruction" data-r="instruction"></p>' +
    '<div class="hintbox" data-r="hintBox" hidden></div>' +
    '<div class="workspace" data-r="workspace"><div class="visual" data-r="visual"></div><div class="answer" data-r="answer"></div></div>' +
    (opts.mode === 'toets' ? '' :
      '<div class="aq-acts"><button type="button" class="btn aq-check" data-r="checkQ">Verbeteren</button>' +
      '<button type="button" class="btn ghost aq-sol" data-r="solBtn" hidden>Toon de oplossing</button>' +
      '<button type="button" class="btn ghost aq-hint" data-r="hintBtn" hidden></button>' +
      '<span class="aq-extra" data-r="extra"></span></div>' +
      '<div class="fb" data-r="fb" role="status"></div>');
  body.append(root);
  const c = { root, q, st, save, ui:nieuweUi(), mode:opts.mode || 'oef', key:opts.key, afterDraw:null, locked:false };
  Object.defineProperty(c.ui, 'afterDraw', { get:() => c.afterDraw, set:f => { c.afterDraw = f; }, enumerable:false });
  c.changed = () => syncKnoppen(c);
  const activeer = () => { CUR = c; };
  ['pointerdown', 'focusin', 'keydown', 'click'].forEach(t => root.addEventListener(t, activeer, true));
  if(c.mode !== 'toets'){
    root.querySelector('[data-r="checkQ"]').addEventListener('click', () => {
      if(!completed(q)) return;
      st.check = verbeter(q, getVal(q)); st.sol = false;
      const ok = st.check.goed === st.check.totaal;
      if(opts.key) CLres(opts.key, ok);
      save(); ui.vbAnim = true; render();
      const p = root.querySelector('.vb'); if(p) p.scrollIntoView({behavior:'smooth', block:'nearest'});
    });
    root.querySelector('[data-r="solBtn"]').addEventListener('click', () => { st.sol = true; save(); render(); });
    root.querySelector('[data-r="hintBtn"]').addEventListener('click', () => { ui.hintOn = !ui.hintOn; if(q.type === 'pat') ui.patHi = ui.hintOn; render(); });
    if(opts.key) CLvraag(opts.key);
  }
  if(window.ResizeObserver){
    let w0 = 0;
    const ro = new ResizeObserver(() => { const w = root.clientWidth; if(!w || Math.abs(w - w0) < 2) return; w0 = w; renderCard(c); if(c.afterDraw) withCard(c, c.afterDraw); });
    ro.observe(root);
  }
  AQS.push(c);
  renderCard(c);
  return c;
}
/* lijntjes en kringen opnieuw tekenen (na tonen van een onderdeel of een tabblad) */
function hertekenAQ(){
  AQS.forEach(c => { if(!c.root.isConnected || !c.root.offsetParent) return; withCard(c, () => { if(c.afterDraw) c.afterDraw(); drawVbRings(); }); });
}
window.addEventListener('resize', hertekenAQ);
function esc(str){ const d=document.createElement('div'); d.textContent = str==null ? '' : String(str); return d.innerHTML; }
function fmt(n){ return n < 0 ? '−' + Math.abs(n) : String(n); }
// Tekens kleuren in wiskundige uitdrukkingen: − blauw, + rood
function colorExpr(expr){
  return esc(expr).replace(/−/g,'<span class="sg-m">−</span>').replace(/\+/g,'<span class="sg-p">+</span>');
}
function signedJump(d){ return d > 0 ? '+' + d : '−' + Math.abs(d); }
const COL = { plus:'#b86e00', min:'#127a7f' };
function clone(o){ return JSON.parse(JSON.stringify(o)); }
function norm(s){ return String(s==null?'':s).trim().replace(/[−–—]/g,'-').replace(/\s+/g,''); }
function parseIntStr(s){ const t=norm(s); return /^[+-]?\d{1,6}$/.test(t) ? Number(t) : null; }  // geheel getal
function parseNatStr(s){ const t=norm(s); return /^\d{1,6}$/.test(t) ? Number(t) : null; }       // natuurlijk getal (zonder teken)
function validExpr(s){
  const t = String(s||'').trim();
  if(!t) return false;
  if(!/^[\d\s+\-−–()=,.€°Cc]+$/.test(t)) return false;
  const nums = t.match(/\d+/g) || [];
  return nums.length >= 2 && /[+\-−–]/.test(t.replace(/^\s*[\-−–]/,''));
}

/* =========================================================
   Invoervelden: generiek, bewaren als ruwe tekst
   (geen oordeel over juistheid — enkel een vormcontrole)
========================================================= */
const FMT_MSG = {
  int:'Schrijf een geheel getal, bijvoorbeeld 12 of −7.',
  nat:'Schrijf hier enkel het getal, zonder teken.',
  q:'Schrijf een getal zonder teken: 12, een kommagetal zoals 0,5 of een breuk zoals 2/3. Het teken kies je met het vakje ervoor.',
  coef:'Schrijf hier enkel het getalgedeelte: 12, 0,5 of 3/4. Staat er geen getal, laat het dan leeg (dat betekent 1).',
  lett:'Schrijf hier enkel letters, eventueel met een exponent: x, ab, x2 (wordt x²) of xy3.'
};
function numInput(path, value, kind, msgKey, extraCls){ return inp(path, value, kind, extraCls, '', 'antwoord'); }
function fieldValid(kind, raw){
  if(String(raw).trim() === '') return true;
  if(kind === 'int')  return parseIntStr(raw) != null;
  if(kind === 'nat')  return parseNatStr(raw) != null;
  if(kind === 'q')    return parseQ(raw) != null;
  if(kind === 'coef') return parseCoef(raw) != null;
  if(kind === 'lett') return parseLett(raw) != null;
  return true;
}
function setPath(obj, path, val){
  const parts = path.split('.');
  let o = obj;
  for(let i = 0; i < parts.length - 1; i++) o = o[parts[i]];
  o[parts[parts.length - 1]] = val;
}
function getPath(obj, path){ return path.split('.').reduce((o, k) => o == null ? o : o[k], obj); }
function refreshFormatMessages(){
  const bad = {};
  $R('workspace').querySelectorAll('[data-path]').forEach(inpEl => {
    const ok = fieldValid(inpEl.dataset.kind, inpEl.value);
    inpEl.classList.toggle('invalid', !ok);
    if(!ok) bad[inpEl.dataset.msgkey] = FMT_MSG[inpEl.dataset.kind];
  });
  $R('workspace').querySelectorAll('[data-msg]').forEach(m => { m.textContent = bad[m.dataset.msg] || ''; });
}
function bindInputs(q, onInput){
  $R('workspace').querySelectorAll('[data-spath]').forEach(btn => {
    const path = btn.dataset.spath;
    const setSign = sign => {
      const val = getVal(q); setPath(val, path + '.s', sign); saveAnswer(q, val); render();
      const el = $R('workspace').querySelector('[data-spath="'+path+'"]'); if(el) el.focus();
    };
    btn.onclick = () => { const cur = getPath(getVal(q), path + '.s'); setSign(cur === '−' ? '' : '−'); };
    btn.onkeydown = e => {
      if(e.key === '-' || e.key === '−'){ e.preventDefault(); setSign('−'); }
      else if(e.key === '+' || e.key === ' ' || e.key === 'Backspace' || e.key === 'Delete'){ e.preventDefault(); setSign(''); }
    };
  });
  $R('workspace').querySelectorAll('[data-path]').forEach(inpEl => {
    if(inpEl.dataset.bound) return; inpEl.dataset.bound = '1';
    inpEl.addEventListener('input', () => {
      const val = getVal(q);
      setPath(val, inpEl.dataset.path, inpEl.value);
      saveAnswer(q, val);
      if(onInput) onInput();
      refreshFormatMessages();
    });
    inpEl.addEventListener('blur', refreshFormatMessages);
    inpEl.addEventListener('keydown', e => {
      if(e.key === 'Enter'){
        const all = Array.from($R('workspace').querySelectorAll('input'));
        const nxt = all[all.indexOf(inpEl) + 1];
        if(nxt) nxt.focus();
      }
    });
  });
  refreshFormatMessages();
}

/* =========================================================
   M02 — ALGEBRA-MOTOR (enkel weergave en invoer; de verbetering gebeurt in code.gs)
========================================================= */
/* Eén term = een teken + een rij tekens (tokens).
   token: {k:'n',v:'12',d:null|'4'}  getal, eventueel met noemer
          {k:'l',v:'x',e:1}          letter met exponent
          {k:'p',v:'('|')'}          haakje
          {k:'o',v:'+'|'−'|'⋅'}      bewerkingsteken binnen haakjes            */
function TS(){ return {s:null, toks:[]}; }
function TRV(){ return [TS()]; }
function SN(){ return TS(); }
function refreshSimpHints(){}
function frHTML2(t, n){ return '<span class="fr"><span class="fr-t">'+t+'</span><span class="fr-n">'+n+'</span></span>'; }
const PARL = '<span class="bpl" aria-hidden="true"><svg viewBox="0 0 10 100" preserveAspectRatio="none"><path d="M8.5 2 Q0.5 50 8.5 98"/></svg></span>';
const PARR = '<span class="bpl" aria-hidden="true"><svg viewBox="0 0 10 100" preserveAspectRatio="none"><path d="M1.5 2 Q9.5 50 1.5 98"/></svg></span>';
function PW(inner){ return '<span class="bpw">'+PARL+'<span class="bpin">'+inner+'</span>'+PARR+'</span>'; }
function opgaveBox(html, lab){ return '<div class="opgave"><span class="olab">'+(lab || 'Opgave')+'</span><span class="oexpr">'+html+'</span></div>'; }
function renderKeep(){
  const a = document.activeElement, p = a && a.dataset ? a.dataset.path : null;
  render();
  if(p){ const el = $R('workspace').querySelector('[data-path="'+p+'"]'); if(el){ el.focus(); const n = el.value.length; try{ el.setSelectionRange(n, n); }catch(e){} } }
}

/* ---------- getallen en letters lezen (enkel vormcontrole) ---------- */
function normQ(s){ return String(s == null ? '' : s).trim().replace(/\s+/g, '').replace('.', ','); }
function parseQ(s){                       // natuurlijk getal, kommagetal of breuk a/b (zonder teken)
  const t = normQ(s);
  if(/^\d{1,7}(,\d{1,6})?$/.test(t)) return t;
  if(/^\d{1,6}\/\d{1,6}$/.test(t) && !/\/0+$/.test(t)) return t;
  return null;
}
function parseCoef(s){ const t = normQ(s); return t === '' ? '' : parseQ(t); }
function normLett(s){
  return String(s == null ? '' : s).replace(/\s+/g, '').replace(/[·⋅*]/g, '')
    .replace(/²/g, '^2').replace(/³/g, '^3').replace(/⁴/g, '^4').replace(/⁵/g, '^5').replace(/⁶/g, '^6');
}
function parseLett(s){                    // "x2y" / "x^2y" / "x²y" -> [{v:'x',e:2},{v:'y',e:1}]
  const t = normLett(s);
  if(t === '') return [];
  if(!/^([a-zA-Z]\^?\d{0,2})+$/.test(t)) return null;
  const out = [];
  t.replace(/([a-zA-Z])\^?(\d{0,2})/g, (m, v, e) => { out.push({v:v.toLowerCase(), e: e ? Number(e) : 1}); return m; });
  return out.some(o => o.e < 1) ? null : out;
}

/* ---------- weergave ---------- */
function coefHTML(c){
  const t = normQ(c);
  if(t.indexOf('/') >= 0){ const p = t.split('/'); return frHTML2(esc(p[0]), esc(p[1])); }
  return t ? '<span class="mn">'+esc(t)+'</span>' : '';
}
function lettHTML(arr){ return (arr || []).map(o => '<span class="lt"><i class="lv">'+esc(o.v)+'</i>'+(o.e > 1 ? '<sup>'+o.e+'</sup>' : '')+'</span>').join(''); }
function sgHTML(s, first){
  if(s === '−') return '<span class="sg-m'+(first ? '' : ' bop')+'">−</span>';
  if(s === '+') return first ? '' : '<span class="sg-p bop">+</span>';
  if(s == null && !first) return '<span class="qm bop">?</span>';
  return '';
}
function termBody(c, l){ const L = typeof l === 'string' ? parseLett(l) : l; return coefHTML(c) + lettHTML(L || []); }
// data-veelterm "−2x^2 + 3x − 1" -> [{s:'−', c:'2', l:'x^2'}, …]
function parsePoly(str){
  const s = String(str).replace(/\s+/g, '').replace(/-/g, '−');
  const out = []; let i = 0;
  while(i < s.length){
    let sg = '+';
    if(s[i] === '+' || s[i] === '−'){ sg = s[i]; i++; }
    let j = i; while(j < s.length && s[j] !== '+' && s[j] !== '−') j++;
    const m = s.slice(i, j).match(/^(\d+(?:,\d+)?(?:\/\d+)?)?(.*)$/);
    out.push({s:sg, c:m[1] || '', l:m[2] || ''}); i = j;
  }
  return out;
}
function dTerm(t, first){ return sgHTML(t.s, first) + termBody(t.c, t.l); }
function polyHTML(str){ return parsePoly(str).map((t, i) => dTerm(t, i === 0)).join(''); }
// vrije wiskundetekst (titels, opties): getallen, breuken, letters, exponenten, haakjes
function mathHTML(s){
  s = String(s); let h = '', i = 0;
  while(i < s.length){
    const rest = s.slice(i), ch = s[i];
    if(ch === '('){
      let d = 0, j = i;
      for(; j < s.length; j++){ if(s[j] === '(') d++; else if(s[j] === ')'){ d--; if(!d) break; } }
      const inner = s.slice(i+1, j);
      const grp = inner.indexOf('/') >= 0 ? PW(mathHTML(inner)) : '<span class="par">(</span>'+mathHTML(inner)+'<span class="par">)</span>';
      i = j + 1;
      const ex = s.slice(i).match(/^\^(\d+)/);
      if(ex){ h += '<span class="lt">'+grp+'<sup>'+ex[1]+'</sup></span>'; i += ex[0].length; } else h += grp;
      continue;
    }
    const wr = rest.match(/^√(\d+(?:,\d+)?)/);           // vierkantswortel uit een getal
    if(wr){ h += '<span class="wrt">√<span class="wrt-in">'+wr[1]+'</span></span>'; i += wr[0].length; continue; }
    let m = rest.match(/^(\d+(?:,\d+)?)(?:\/(\d+))?(\^(\d+))?/);
    if(m){
      const base = m[2] ? frHTML2(m[1], m[2]) : '<span class="mn">'+m[1]+'</span>';
      h += m[4] ? '<span class="lt">'+base+'<sup>'+m[4]+'</sup></span>' : base;
      i += m[0].length; continue;
    }
    m = rest.match(/^\^(\d+)/);
    if(m){ h += '<sup>'+m[1]+'</sup>'; i += m[0].length; continue; }
    m = rest.match(/^([a-zA-Z])(?:\^(\d+))?/);
    if(m){ h += '<span class="lt"><i class="lv">'+m[1]+'</i>'+(m[2] ? '<sup>'+m[2]+'</sup>' : '')+'</span>'; i += m[0].length; continue; }
    const bin = h !== '' ? ' bop' : '';
    if(ch === '−' || ch === '-') h += '<span class="sg-m'+bin+'">−</span>';
    else if(ch === '+') h += '<span class="sg-p'+bin+'">+</span>';
    else if(ch === '·' || ch === '⋅' || ch === '*') h += '<span class="mop">⋅</span>';
    else if(ch === '=' || ch === '≠' || ch === '<' || ch === '>') h += '<span class="eqm">'+ch+'</span>';
    else if(ch === ' ') h += '<span class="msp"></span>';
    else h += esc(ch);
    i++;
  }
  return '<span class="mx">'+h+'</span>';
}
function richOrMath(t){ return String(t).indexOf('`') >= 0 ? rich(t) : mathHTML(t); }
function rich(t){ return String(t == null ? '' : t).split('`').map((p, i) => i % 2 ? mathHTML(p) : glossify(p)).join(''); }
function speakAlg(t){
  return String(t).replace(/`/g, '').replace(/√/g, ' vierkantswortel uit ').replace(/\^2/g, ' kwadraat').replace(/\^3/g, ' tot de derde').replace(/\^(\d+)/g, ' tot de $1de')
    .replace(/(\d+)\/(\d+)/g, '$1 op $2').replace(/·/g, ' maal ').replace(/≠/g, ' is niet gelijk aan ').replace(/\|([A-Z])([A-Z])\|/g, 'de lengte van $1 $2').replace(/\[([A-Z])([A-Z])\]/g, 'lijnstuk $1 $2');
}

/* ---------- invoer: tekens ---------- */
function sgChoice(attr, path, st, cls2, opts){
  const sel = opts.filter(o => o.v === st)[0];
  if(sel && ui.sgOpen !== path){                       // gekozen: gewoon teken op de schrijflijn
    const fresh = ui.freshSg === path, dir = sel.l === '+' ? 'up' : 'down';
    if(sel.v === '')                                   // + vooraan: komt naar voren en verdwijnt
      return '<button type="button" class="sgdone none '+(cls2 || '')+'" data-pmopen="'+path+'" title="Positief: je schrijft geen teken. Klik om te wijzigen." aria-label="positief, geen teken">' +
        (fresh ? '<span class="sgfly">+</span>' : '') + '</button>';
    return '<button type="button" class="sgdone'+(fresh ? ' fresh ' + dir : '')+' '+(cls2 || '')+'" data-pmopen="'+path+'" title="Klik om het teken te wijzigen">'+sel.l+'</button>';
  }
  return '<span class="sgch'+(sel ? ' chosen' : '')+' '+(cls2 || '')+'" role="group" aria-label="kies het teken">' + opts.map(o =>
    '<button type="button" class="sgopt'+(st === o.v ? ' on' : '')+'" '+attr+'="'+path+'" data-v="'+o.v+'" title="'+o.t+'" aria-pressed="'+(st === o.v)+'">'+o.l+'</button>').join('') + '</span>';
}
function pmBtn(path, st, cls2){               // bewerkingsteken of teken van een term: + of −
  return sgChoice('data-pmset', path, st, cls2, [{v:'+', l:'+', t:'plus'}, {v:'−', l:'−', t:'min'}]);
}
function tsBtn(path, st, cls2){               // eerste term: positief (geen teken) of −; path wijst naar het object met .s
  return sgChoice('data-pmset', path + '.s', st, cls2, [{v:'', l:'+', t:'positief: je schrijft geen teken'}, {v:'−', l:'−', t:'min'}]);
}
function bindPM(q){
  $R('workspace').querySelectorAll('[data-pmset]').forEach(b => b.onclick = () => {
    const path = b.dataset.pmset, val = getVal(q);
    setPath(val, path, b.dataset.v);
    ui.sgOpen = null; ui.freshSg = path;              // het gekozen teken schuift naar de schrijflijn
    saveAnswer(q, val); render();
  });
  $R('workspace').querySelectorAll('[data-pmopen]').forEach(b => b.onclick = () => { ui.sgOpen = b.dataset.pmopen; render(); });
  ui.freshSg = null;                                  // de animatie speelt maar één keer
}
function inp(path, value, kind, cls, ph, aria){
  return '<input class="num '+(cls || '')+'" type="text" autocomplete="off" spellcheck="false" autocapitalize="off" data-path="'+path+'" data-kind="'+kind+'" data-msgkey="res" value="'+esc(value)+'"'+(ph ? ' placeholder="'+esc(ph)+'"' : '')+' aria-label="'+esc(aria || 'antwoord')+'">';
}

/* =========================================================
   TERMENBOUWER — één invoertool voor alle algebraïsche vormen
   Een term is {s, toks}. De tokens staan op één schrijflijn; een puntje
   rechtsboven een letter maakt er een exponent van, een puntje onder een
   getal maakt er een breuk van. Lang indrukken wist een term, ← en →
   maken ongedaan en opnieuw.
========================================================= */
function tbEmpty(t){ return !t || ((!t.toks || !t.toks.length) && t.s == null); }
function tbStr(t){                      // wat naar code.gs gaat: "3x^2", "1/4k", "x(x+3)"
  return (t && t.toks || []).map(tk => {
    if(tk.k === 'n') return (tk.d != null && tk.d !== '') ? tk.v + '/' + tk.d : tk.v;
    if(tk.k === 'l') return tk.v + (tk.e > 1 ? '^' + tk.e : '');
    return tk.v;
  }).join('');
}
function tbTokHTML(tk){
  if(tk.k === 'n') return (tk.d != null && tk.d !== '') ? frHTML2(esc(tk.v || '?'), esc(tk.d)) : '<span class="mn">'+esc(tk.v)+'</span>';
  if(tk.k === 'l') return '<span class="lt"><i class="lv">'+esc(tk.v)+'</i>'+(tk.e > 1 ? '<sup>'+tk.e+'</sup>' : '')+'</span>';
  if(tk.k === 'o') return '<span class="'+(tk.v === '⋅' ? 'mop' : 'bop')+'">'+esc(tk.v)+'</span>';
  return '<span class="par">'+esc(tk.v)+'</span>';
}
function tbTermHTML(t, first){
  const body = (t.toks || []).map(tbTokHTML).join('');
  if(!body) return '';
  return sgHTML(t.s === '' ? '+' : t.s, first) + body;
}
function tbArr(v){ return Array.isArray(v) ? v : [v || TS()]; }
function trPrev(arr){
  const a = tbArr(arr).filter(t => !tbEmpty(t));
  if(!a.length) return '';
  const parts = a.map((t, i) => tbTermHTML(t, i === 0));
  if(parts.every(p => !p)) return '';
  return '<span class="pvx">'+parts.join('')+'</span>';
}
/* (vroeger: een aparte typregel onder het vakje) */
function prevHTML(path, cls){ return ''; }      // de aparte typregel is niet meer nodig: er is één invullijn

/* ---------- getypte tekst -> termen (zelfde regels als in het vakje) ---------- */
function tbParse(text, noLetters, keepPlus){
  const terms = [TS()];
  const s = String(text == null ? '' : text).replace(/\s+/g, '');
  let ti = 0, i = 0;
  const open = t => { let n = 0; t.toks.forEach(tk => { if(tk.k === 'p' && tk.v === '(') n++; if(tk.k === 'p' && tk.v === ')') n--; }); return Math.max(0, n); };
  while(i < s.length){
    const ch = s[i], t = terms[ti], last = t.toks[t.toks.length - 1];
    if(/\d/.test(ch) || ch === ',' || ch === '.'){
      const c2 = ch === '.' ? ',' : ch;
      if(last && last.k === 'n' && last.d != null) last.d += c2;
      else if(last && last.k === 'n') last.v += c2;
      else if(last && last.k === 'l' && /\d/.test(c2)) last.e = last.e > 1 ? Number(String(last.e) + c2) : Number(c2);
      else t.toks.push({k:'n', v:c2, d:null});
      i++; continue;
    }
    if(ch === '/'){ if(last && last.k === 'n' && last.d == null) last.d = ''; i++; continue; }
    if(/[a-zA-Z]/.test(ch)){ if(!noLetters) t.toks.push({k:'l', v:ch.toLowerCase(), e:1}); i++; continue; }
    if(ch === '²' || ch === '³' || ch === '⁴'){ if(last && last.k === 'l') last.e = ch === '²' ? 2 : (ch === '³' ? 3 : 4); i++; continue; }
    if(ch === '^'){
      let j = i + 1, d = '';
      while(j < s.length && /\d/.test(s[j])){ d += s[j]; j++; }
      if(last && last.k === 'l' && d) last.e = Number(d);
      i = j; continue;
    }
    if(ch === '(' || ch === ')'){ if(!noLetters) t.toks.push({k:'p', v:ch}); i++; continue; }
    if(ch === '*' || ch === '·' || ch === '⋅'){ if(!noLetters) t.toks.push({k:'o', v:'⋅'}); i++; continue; }
    if(ch === '+' || ch === '-' || ch === '−'){
      const sgn = ch === '+' ? '+' : '−';
      if(open(t) > 0) t.toks.push({k:'o', v:sgn});
      else if(t.toks.length === 0) t.s = (ti === 0 && !keepPlus) ? (sgn === '+' ? '' : '−') : sgn;
      else { terms.push({s:sgn, toks:[]}); ti++; }
      i++; continue;
    }
    i++;
  }
  // wie zelf schrijft, kiest het teken door het te typen: geen teken vooraan = positief
  if(terms[0].toks.length && terms[0].s == null) terms[0].s = '';
  return terms;
}
/* ---------- termen -> typbare tekst ---------- */
const SUPS = {2:'²', 3:'³', 4:'⁴', 5:'⁵', 6:'⁶'};
function tbTokText(tk){
  if(tk.k === 'n') return (tk.d != null && tk.d !== '') ? tk.v + '/' + tk.d : tk.v;
  if(tk.k === 'l') return tk.v + (tk.e > 1 ? (SUPS[tk.e] || '^' + tk.e) : '');
  return tk.v;
}
function tbText(arr){
  return tbArr(arr).filter(t => !tbEmpty(t)).map((t, i) => {
    const body = t.toks.map(tbTokText).join('');
    const sg = i === 0 ? (t.s === '−' ? '−' : (t.s === '+' ? '+' : ''))
                       : (t.s === '−' ? ' − ' : (t.s === '+' ? ' + ' : ' ? '));
    return sg + body;
  }).join('');
}

/* ---------- volledigheid ---------- */
function tbTermOK(t){ return !!t && t.s != null && !!t.toks && t.toks.length > 0 && t.toks.every(tk => tk.k !== 'n' || (tk.v !== '' && tk.d !== '')); }
function trOK(arr){ const a = tbArr(arr).filter(t => !tbEmpty(t)); return a.length > 0 && a.every(tbTermOK); }
function tbNumOnly(t){ return tbTermOK(t) && t.toks.every(tk => tk.k === 'n'); }
function qOK(o){ const a = tbArr(o).filter(t => !tbEmpty(t)); return a.length === 1 && tbNumOnly(a[0]); }
function pmOK(o){ return qOK(o); }
function lettOK(s){ const L = parseLett(s); return L != null && L.length > 0; }

/* ---------- de plaatshouders in de HTML ---------- */
function trHTML(path, arr, opt){
  opt = opt || {};
  const mode = opt.fixed ? 'one' : 'row';
  let h = '<span class="tbrow'+(opt.compact ? ' compact' : '')+'" data-tb="'+path+'" data-tbmode="'+mode+'"></span>';
  if(!opt.noprev) h += prevHTML(path);
  return '<span class="trwrap">'+h+'</span>';
}
function snField(path, o, kind, cls){
  const c = cls || '';
  return '<span class="trwrap num"><span class="tbrow num'+(c.indexOf('sm') >= 0 ? ' compact' : '')+'" data-tb="'+path+'" data-tbmode="num"></span>' +
    (c.indexOf('geen') >= 0 ? '' : prevHTML(path, 'kort')) + '</span>';
}
function letField(path, o, cls){
  return '<span class="tbrow let'+(cls && cls.indexOf('sm') >= 0 ? ' compact' : '')+'" data-tb="'+path+'" data-tbmode="let"></span>';
}
function letOK(o){
  const a = tbArr(o).filter(t => !tbEmpty(t));
  return a.length === 1 && a[0].toks.length > 0 && a[0].toks.every(tk => tk.k === 'l');
}
function pmField(path, o, cls){
  const c = cls || '';
  return '<span class="trwrap num"><span class="tbrow num'+(c.indexOf('sm') >= 0 ? ' compact' : '')+'" data-tb="'+path+'" data-tbmode="pm"></span>' +
    (c.indexOf('geen') >= 0 ? '' : prevHTML(path, 'kort')) + '</span>';
}
function nhBtn(path, on){ return '<button type="button" class="nhbtn'+(on ? ' on' : '')+'" data-nh="'+path+'">✓ kan niet herleid worden</button>'; }

/* ---------- het widget ---------- */
const UNDO_SVG = '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M3.4 7.4h8.1a4.1 4.1 0 0 1 0 8.2H7.2" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"/><path d="M6.4 4.2 3.2 7.4l3.2 3.2" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const REDO_SVG = '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M16.6 7.4H8.5a4.1 4.1 0 0 0 0 8.2h4.3" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"/><path d="m13.6 4.2 3.2 3.2-3.2 3.2" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const TBS = [];
/* ---------- ÉÉN INVULLIJN (vervangt de termenbouwer en de typregel) ----------
   Het vakje is een MathQuill-veld: typ ^ voor een exponent en / voor een breuk.
   Wat de leerling schrijft, wordt omgezet naar dezelfde termen {s, toks} als
   vroeger, dus de verbetering in code.gs blijft ongewijzigd.                  */
const MQ = (window.MathQuill && window.MathQuill.getInterface) ? window.MathQuill.getInterface(2) : null;
const MQCFG = { spaceBehavesLikeTab:true, leftRightIntoCmdGoes:'up', restrictMismatchedBrackets:true,
                supSubsRequireOperand:true, charsThatBreakOutOfSupSub:'+-=<>', autoOperatorNames:'sin cos' };
function latexToLin(s){                            // "\frac{1}{4}x^{2}" -> "1/4x^2"
  let t = String(s == null ? '' : s);
  for(let k = 0; k < 8; k++){
    const t0 = t;
    t = t.replace(/\^\{([^{}]*)\}/g, (m, e) => '^' + e);
    t = t.replace(/\\frac\{([^{}]*)\}\{([^{}]*)\}/g, (m, a, b) =>
      (/^-?[\d.,]+$/.test(a) ? a : '(' + a + ')') + '/' + (/^[\d.,]+$/.test(b) ? b : '(' + b + ')'));
    if(t === t0) break;
  }
  return t.replace(/\\cdot|\\times/g, '·').replace(/\\left|\\right/g, '').replace(/\\ /g, ' ').replace(/\{,\}/g, ',').replace(/[{}\\]/g, '');
}
function termsToLatex(terms, keepPlus){             // termen -> wat in het vakje staat
  return tbArr(terms).filter(t => !tbEmpty(t)).map((t, i) => {
    const sg = t.s === '−' ? '-' : (t.s === '+' ? (i === 0 && !keepPlus ? '' : '+') : (i === 0 ? '' : '+'));
    return sg + (t.toks || []).map(tk => {
      if(tk.k === 'n') return (tk.d != null && tk.d !== '') ? '\\frac{' + tk.v + '}{' + tk.d + '}' : tk.v;
      if(tk.k === 'l') return tk.v + (tk.e > 1 ? '^{' + tk.e + '}' : '');
      if(tk.k === 'o') return tk.v === '⋅' ? '\\cdot ' : (tk.v === '−' ? '-' : '+');
      return tk.v;
    }).join('');
  }).join('');
}
/* In een noemer of exponent staan enkel getallen: typt de leerling daar een letter
   of een bewerkingsteken, dan springt de cursor eerst uit de breuk of exponent.   */
function breakOut(e, span, mf){
  if(e.ctrlKey || e.metaKey || e.altKey) return;
  const k = e.key;
  if(!k || k.length !== 1 || !/[a-zA-Z+\-*()=·]/.test(k)) return;
  const cur = span.querySelector('.mq-cursor');
  if(!cur || cur.nextSibling) return;
  const blk = cur.parentNode;
  if(!blk || !blk.classList) return;
  const inDen = blk.classList.contains('mq-denominator'), inSup = blk.classList.contains('mq-sup');
  if(!inDen && !inSup) return;
  if(inSup && /[+\-=]/.test(k)) return;              // dat doet MathQuill zelf al
  e.preventDefault(); e.stopPropagation();
  mf.keystroke('Right');
  mf.typedText(k);
}
/* knopjes (exponent · breuk · eruit) naast elk vakje: zichtbaar zolang het vakje actief is */
const MFBTNS = '<span class="mfbtns" aria-label="Invoerhulp">' +
  '<button type="button" class="kbtn" data-k="exp" title="Exponent (toets ^)" tabindex="-1"><span class="kico">x<sup></sup></span></button>' +
  '<button type="button" class="kbtn" data-k="frac" title="Breuk (toets /)" tabindex="-1"><span class="kfr"><i></i><b></b><i></i></span></button>' +
  '<button type="button" class="kbtn" data-k="right" title="Uit de breuk of de exponent (pijltje naar rechts of spatie)" tabindex="-1">→</button></span>';
function hidePop(){}
function bindBtns(w){
  w.row.querySelectorAll('.mfbtns .kbtn').forEach(b => {
    b.onmousedown = e => e.preventDefault();
    b.onclick = () => {
      const k = b.dataset.k;
      if(w.mf){
        if(k === 'exp') w.mf.typedText('^'); else if(k === 'frac') w.mf.typedText('/'); else w.mf.keystroke('Right');
        w.mf.focus();
      } else if(w.inp){
        if(k !== 'right'){
          const pos = w.inp.selectionStart == null ? w.inp.value.length : w.inp.selectionStart;
          w.inp.value = w.inp.value.slice(0, pos) + (k === 'exp' ? '^' : '/') + w.inp.value.slice(pos);
          w.inp.dispatchEvent(new Event('input'));
          try{ w.inp.setSelectionRange(pos + 1, pos + 1); }catch(e){}
        }
        w.inp.focus();
      }
    };
  });
  w.row.addEventListener('focusin', () => w.row.classList.add('focus'));
  w.row.addEventListener('focusout', () => setTimeoutC(() => { if(!w.row.contains(document.activeElement)) w.row.classList.remove('focus'); }, 80));
}

function TermRow(opts){
  const mode = opts.single ? (opts.pm ? 'pm' : (opts.noSign ? 'let' : (opts.noLetters ? 'num' : 'one'))) : 'row';
  const self = { terms: (opts.terms && opts.terms.length ? clone(opts.terms) : [TS()]), row: opts.row,
                 onchange: opts.onchange || function(){}, txt:null, mf:null, inp:null };
  const keepPlus = !!opts.keepPlus || mode === 'pm';
  const toTerms = src => {
    let t = tbParse(latexToLin(src), !!opts.noLetters, keepPlus);
    if(opts.single && t.length > 1) t = t.slice(0, 1);
    if(opts.noSign) t.forEach(x => { if(x.toks.length) x.s = ''; });
    return t;
  };
  const changed = src => { self.terms = toTerms(src); self.onchange(self.value()); };
  const R = self.row;
  R.innerHTML = '';
  R.classList.add('mqrow', 'mode-' + mode);
  const nextField = () => {
    const all = Array.from($R('workspace').querySelectorAll('.tbrow'));
    const nx = all[all.indexOf(R) + 1];
    if(nx){ const f = nx.querySelector('textarea, input'); if(f) f.focus(); }
  };
  if(MQ){
    const span = document.createElement('span');
    R.appendChild(span);
    const mf = MQ.MathField(span, MQCFG);
    const start = termsToLatex(self.terms, keepPlus);
    if(start) mf.latex(start);
    mf.config({ handlers:{ edit: () => changed(mf.latex()), enter: nextField } });
    span.addEventListener('keydown', e => breakOut(e, span, mf), true);
    self.mf = mf;
  } else {                                          // reserve: een gewone typregel
    const inp = document.createElement('input');
    inp.className = 'tbtxt'; inp.type = 'text'; inp.autocomplete = 'off'; inp.spellcheck = false;
    inp.setAttribute('aria-label', 'typ hier je antwoord');
    inp.value = tbText(self.terms);
    inp.oninput = () => changed(inp.value);
    inp.onkeydown = e => { if(e.key === 'Enter'){ e.preventDefault(); nextField(); } };
    R.appendChild(inp);
    self.inp = inp;
  }
  R.insertAdjacentHTML('beforeend', MFBTNS); bindBtns(self);
  self.value = () => self.terms.filter(t => !tbEmpty(t));
  self.fromText = str => changed(str);
  self.cancelDel = () => {}; self.stopLp = () => {}; self.movedLp = () => {};
  TBS.push(self);
  return self;
}

/* één set luisteraars voor alle widgets samen */
window.addEventListener('pointerup', () => TBS.forEach(w => w.stopLp()));
window.addEventListener('pointercancel', () => TBS.forEach(w => w.stopLp()));
window.addEventListener('pointermove', e => TBS.forEach(w => w.movedLp(e)));
document.addEventListener('pointerdown', e => {
  if(e.target.closest('.tbterm')) return;
  TBS.forEach(w => w.cancelDel());
});

/* ---------- de widgets aan de vraag koppelen ---------- */
let TB_EXTRA = null;                 // extra tekenwerk (bv. een figuur bijwerken) na elke wijziging
function bindTB(q, extra){
  TBS.length = 0; TB_EXTRA = extra || null; hidePop();
  $R('workspace').querySelectorAll('[data-tb]').forEach(el => {
    const path = el.dataset.tb, mode = el.dataset.tbmode;
    const stored = getPath(getVal(q), path);
    const w = TermRow({
      row: el,
      hist: $R('workspace').querySelector('[data-tbhist="'+path+'"]'),
      txt: $R('workspace').querySelector('[data-tbtxt="'+path+'"]'),
      terms: tbArr(stored).filter(t => t && t.toks),
      single: mode !== 'row',
      noLetters: mode === 'num' || mode === 'pm',
      pm: mode === 'pm',
      noSign: mode === 'let',
      keepPlus: mode === 'one',
      onchange: terms => {
        const val = getVal(q);
        setPath(val, path, mode === 'row' || mode === 'one' ? terms : (terms[0] || TS()));
        saveAnswer(q, val);
        if(CUR && CUR.changed) CUR.changed();
        if(TB_EXTRA) TB_EXTRA();
        if(ui.afterDraw) ui.afterDraw();
      }
    });
    if(w.txt){
      w.txt.addEventListener('input', () => w.fromText(w.txt.value));
      w.txt.addEventListener('blur', () => { w.txt.value = tbText(w.terms); });
    }
  });
  $R('workspace').querySelectorAll('[data-nh]').forEach(b => b.onclick = () => {
    const val = getVal(q); setPath(val, b.dataset.nh, !getPath(val, b.dataset.nh)); saveAnswer(q, val); render();
  });
}
function refreshPrev(q){
  const val = getVal(q);
  $R('workspace').querySelectorAll('[data-tbmath]').forEach(el => {
    if($R('workspace').querySelector('[data-tb="'+el.dataset.tbmath+'"]')) return;   // door het widget zelf bijgehouden
    el.innerHTML = trPrev(getPath(val, el.dataset.tbmath));
  });
}

/* ---------- markeerstiften (gelijksoortige termen kleuren) ---------- */
const MK_COL = ['#ffe066', '#ffb3d6', '#d4c2ff', '#ffc98f', '#9fe3db'];
function markerBar(){
  return '<div class="mkbar"><span class="mklab">Markeerstift:</span>' +
    MK_COL.map((c, i) => '<button type="button" class="mkpen'+(ui.mcol === i ? ' on' : '')+'" data-mcol="'+i+'" style="--mk:'+c+'" aria-label="markeerstift '+(i+1)+'"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20 l3-7 9-9 4 4 -9 9z" fill="var(--mk)" stroke="#35545a" stroke-width="1.4" stroke-linejoin="round"/><path d="M4 20 l3-7 4 4z" fill="#35545a"/></svg></button>').join('') +
    '<button type="button" class="mkpen gum'+(ui.mcol === -1 ? ' on' : '')+'" data-mcol="-1" title="Gom: kleur weghalen" aria-label="gom">⌫</button></div>';
}
function mkTile(path, i, inner, map, cls){
  const c = map && map[i] != null ? map[i] : null;
  return '<button type="button" class="atile'+(c != null ? ' marked' : '')+' '+(cls || '')+'" data-mt="'+path+'" data-ti="'+i+'"'+(c != null ? ' style="--mk:'+MK_COL[c]+'"' : '')+'>'+inner+'</button>';
}
function bindMarkers(q){
  $R('workspace').querySelectorAll('[data-mcol]').forEach(b => b.onclick = () => { ui.mcol = Number(b.dataset.mcol); render(); });
  $R('workspace').querySelectorAll('[data-mt]').forEach(b => b.onclick = () => {
    const val = getVal(q), m = getPath(val, b.dataset.mt), i = b.dataset.ti;
    if(ui.mcol < 0 || m[i] === ui.mcol) delete m[i]; else m[i] = ui.mcol;
    saveAnswer(q, val); render();
  });
}
function allMarked(map, n){ for(let i = 0; i < n; i++) if(!map || map[i] == null) return false; return true; }

/* ---------- lijntjes en boogjes tekenen tussen elementen ---------- */
function drawLinks(wrap, links){
  if(!wrap) return;
  const old = wrap.querySelector('svg.lnk'); if(old) old.remove();
  const R = wrap.getBoundingClientRect(); let h = '';
  links.forEach(L => {
    if(!L.a || !L.b) return;
    const A = L.a.getBoundingClientRect(), B = L.b.getBoundingClientRect();
    if(L.arc){
      const x1 = A.left + A.width/2 - R.left, x2 = B.left + B.width/2 - R.left, y1 = A.top - R.top + 2, y2 = B.top - R.top + 2;
      const cy = Math.min(y1, y2) - 18 - Math.abs(x2 - x1) * 0.18;
      h += '<path class="lkarc'+(L.fresh ? ' fresh' : '')+'" d="M'+x1+' '+y1+' Q'+((x1+x2)/2)+' '+cy+' '+x2+' '+y2+'" stroke="'+(L.color || '#127a7f')+'"/>' +
           (L.nohead ? '' : '<path d="M'+(x2-5)+' '+(y2-9)+' L'+x2+' '+y2+' L'+(x2+5)+' '+(y2-9)+'" class="lkhead" stroke="'+(L.color || '#127a7f')+'"/>');
    } else {
      const x1 = A.right - R.left, y1 = A.top + A.height/2 - R.top, x2 = B.left - R.left, y2 = B.top + B.height/2 - R.top;
      h += '<path class="lkline'+(L.fresh ? ' fresh' : '')+'" d="M'+x1+' '+y1+' C'+(x1+40)+' '+y1+' '+(x2-40)+' '+y2+' '+x2+' '+y2+'" stroke="'+(L.color || '#08845f')+'"/>' +
           '<circle cx="'+x1+'" cy="'+y1+'" r="4" fill="'+(L.color || '#08845f')+'"/><circle cx="'+x2+'" cy="'+y2+'" r="4" fill="'+(L.color || '#08845f')+'"/>';
    }
  });
  wrap.insertAdjacentHTML('beforeend', '<svg class="lnk" width="'+R.width+'" height="'+R.height+'" aria-hidden="true">'+h+'</svg>');
}

/* ---------- alles koppelen ---------- */
function bindAll(q, extra){
  bindPM(q); bindTB(q, extra); bindMarkers(q);
  bindInputs(q, () => { refreshPrev(q); if(extra) extra(); });
  refreshPrev(q);
  if(extra) extra();
}

/* ---------- leesbare weergave van een antwoord (voor het leerkrachtenblad) ---------- */
function tbPoly(arr){
  return tbArr(arr).filter(t => !tbEmpty(t))
    .map((t, i) => (i === 0 ? (t.s === '−' ? '−' : '') : (t.s === '−' ? ' − ' : ' + ')) + tbStr(t)).join('');
}
const STIL = {bg:1, sub:1, sd:1};                  // werkstappen, geen antwoord op zich
function groepText(m){                             // markeerstiften -> groepjes termnummers
  const g = {};
  Object.keys(m || {}).forEach(k => { (g[m[k]] = g[m[k]] || []).push(Number(k) + 1); });
  return Object.keys(g).map(c => g[c].sort((a, b) => a - b).join('+')).join(' | ');
}
function answerText(v){
  if(v == null) return '';
  if(typeof v === 'boolean') return v ? 'ja' : '';
  if(Array.isArray(v)){
    if(v.length && v.every(x => x && x.toks)) return tbPoly(v);
    if(v.length && v.every(x => x && typeof x === 'object' && 'toks' in x === false && 's' in x && Object.keys(x).length === 1))
      return v.map(x => x.s === '−' ? '−' : (x.s === '+' ? '+' : (x.s === '' ? '+' : '?'))).join(' ');
    return v.map(answerText).filter(x => x !== '').join(' ; ');
  }
  if(typeof v === 'object'){
    if(v.toks) return tbPoly(v);
    if(Object.keys(v).length === 1 && 's' in v) return v.s === '−' ? '−' : (v.s ? v.s : '+');
    return Object.keys(v).filter(k => !STIL[k]).map(k => {
      if(k === 'mk'){ const g = groepText(v.mk); return g ? 'groepen ' + g : ''; }
      const t = answerText(v[k]);
      return t === '' ? '' : (k === 'res' || k === 'choice' ? t : k + '=' + t);
    }).filter(Boolean).join(' | ');
  }
  return String(v);
}

/* =========================================================
   M02 — TEKENINGEN (SVG)
========================================================= */
const HI = '#127a7f';
/* ---------- lijnstukken ---------- */
function segSVG(s){
  const U = 92, X = u => 30 + u * U, W = X(s.len) + 30, Y = 40;
  let h = '<defs><marker id="sa" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="#1d4ed8"/></marker></defs>';
  h += '<line x1="'+X(0)+'" y1="'+Y+'" x2="'+X(s.len)+'" y2="'+Y+'" stroke="#17313a" stroke-width="2.5"/>';
  (s.ticks || []).forEach(t => { h += '<line x1="'+X(t)+'" y1="'+(Y-7)+'" x2="'+X(t)+'" y2="'+(Y+7)+'" stroke="#d62828" stroke-width="2"/>'; });
  [0, s.len].forEach(t => { h += '<circle cx="'+X(t)+'" cy="'+Y+'" r="3.5" fill="#17313a"/>'; });
  const pt = (x, lab) => '<circle cx="'+X(x)+'" cy="'+Y+'" r="5" fill="#17313a"/><text x="'+X(x)+'" y="'+(Y-14)+'" text-anchor="middle" font-size="17" font-weight="800" fill="#17313a">'+lab+'</text>';
  h += pt(s.A, 'A') + pt(s.B, 'B'); if(s.C != null) h += pt(s.C, '');
  (s.dims || []).forEach(d => {
    const up = d[3] === 'up', y = up ? Y - 34 : Y + 26;
    if(up){ h += '<line x1="'+X(d[0])+'" y1="'+(Y-6)+'" x2="'+X(d[0])+'" y2="'+(y-4)+'" stroke="#9fb3b6" stroke-dasharray="3 3"/><line x1="'+X(d[1])+'" y1="'+(Y-6)+'" x2="'+X(d[1])+'" y2="'+(y-4)+'" stroke="#9fb3b6" stroke-dasharray="3 3"/>'; }
    h += '<line x1="'+(X(d[0])+3)+'" y1="'+y+'" x2="'+(X(d[1])-3)+'" y2="'+y+'" stroke="#1d4ed8" stroke-width="2" marker-start="url(#sa)" marker-end="url(#sa)"/>';
    h += '<text x="'+((X(d[0])+X(d[1]))/2)+'" y="'+(up ? y - 6 : y + 19)+'" text-anchor="middle" font-size="17" font-style="italic" font-weight="700" fill="#1d4ed8">'+d[2]+'</text>';
  });
  return '<svg class="vis-svg segsvg" viewBox="0 -18 '+W+' 112" style="max-width:'+W+'px" aria-label="Lijnstuk">'+h+'</svg>';
}

/* ---------- lijnstuk [AC] met B ertussen: accolades boven en onder (zoals op de toets) ---------- */
function segABC(o){
  const x0 = 46, x1 = 674, xB = Math.round(x0 + (x1 - x0) * (o.fB || 0.45)), Y = 96;
  const t = s => esc(s).replace(/([a-z])/g, '<tspan font-style="italic" font-family="Georgia,serif">$1</tspan>');
  const lab = (k, P, Q) => '|' + P + Q + '| = ' + (o[k] == null ? '?' : o[k]);
  const top = (a, b, k, P, Q) => {
    const open = o[k] == null, col = open ? '#b26a00' : '#17313a';
    return '<path d="M'+a+' '+(Y-14)+' V'+(Y-40)+' H'+b+' V'+(Y-14)+'" fill="none" stroke="'+col+'" stroke-width="2.5"'+(open ? ' stroke-dasharray="8 6"' : '')+'/>' +
      '<text x="'+((a+b)/2)+'" y="'+(Y-52)+'" text-anchor="middle" font-size="21" font-weight="700" fill="'+col+'">'+t(lab(k, P, Q))+'</text>';
  };
  let h = top(x0, xB, 'ab', 'A', 'B') + top(xB, x1, 'bc', 'B', 'C');
  h += '<line x1="'+x0+'" y1="'+Y+'" x2="'+x1+'" y2="'+Y+'" stroke="#17313a" stroke-width="3.5"/>';
  [[x0, 'A'], [xB, 'B'], [x1, 'C']].forEach(p => {
    h += '<circle cx="'+p[0]+'" cy="'+Y+'" r="7.5" fill="#17313a"/><text x="'+p[0]+'" y="'+(Y+34)+'" text-anchor="middle" font-size="21" font-weight="900" fill="#17313a">'+p[1]+'</text>';
  });
  const open = o.ac == null, col = open ? '#b26a00' : '#17313a';
  h += '<path d="M'+x0+' '+(Y+46)+' V'+(Y+66)+' H'+x1+' V'+(Y+46)+'" fill="none" stroke="'+col+'" stroke-width="2.5"'+(open ? ' stroke-dasharray="8 6"' : '')+'/>' +
       '<text x="'+((x0+x1)/2)+'" y="'+(Y+96)+'" text-anchor="middle" font-size="21" font-weight="700" fill="'+col+'">'+t(lab('ac', 'A', 'C'))+'</text>';
  return '<svg class="vis-svg segabc" viewBox="0 0 720 '+(Y+108)+'" style="max-width:720px" aria-label="Lijnstuk A C met het punt B ertussen">'+h+'</svg>';
}

/* ---------- patronen ---------- */
/* ---------- patronen ----------
   Met de hint aan krijgt elke herhaalde groep een eigen kleur en houdt het vaste
   stuk (de + achteraan de formule) altijd dezelfde grijsblauwe kleur.           */
const GRP  = ['#e53935', '#1e88e5', '#43a047', '#127a7f'];
const GRPD = ['#b71c1c', '#0d47a1', '#1b5e20', '#0e5f63'];
const VAST = '#bdbdbd', VASTD = '#616161';
function grp(k){ return {c:GRP[k % GRP.length], d:GRPD[k % GRPD.length]}; }
const VASTP = {c:VAST, d:VASTD};
/* een plaats aan tafel: een ondiep boogje net buiten de vrije zijde */
function seatArc(a, b, ux, uy, col){
  const c = col ? col.d : '#b85a1f';
  const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2;
  const ex = b[0] - a[0], ey = b[1] - a[1], eL = Math.hypot(ex, ey), tx = ex / eL, ty = ey / eL;
  const half = eL * 0.3, off = 5, bol = 21;
  const x1 = mx - tx * half + ux * off, y1 = my - ty * half + uy * off;
  const x2 = mx + tx * half + ux * off, y2 = my + ty * half + uy * off;
  const cx = mx + ux * bol, cy = my + uy * bol;
  return '<path d="M'+x1.toFixed(1)+' '+y1.toFixed(1)+' Q'+cx.toFixed(1)+' '+cy.toFixed(1)+' '+x2.toFixed(1)+' '+y2.toFixed(1)+'" ' +
         'fill="none" stroke="'+c+'" stroke-width="4" stroke-linecap="round"/>';
}
function chair(x, y, ang, col){
  const c = col ? col.c : '#e07b39', d = col ? col.d : '#b85a1f';
  return '<g transform="translate('+x.toFixed(1)+' '+y.toFixed(1)+') rotate('+ang.toFixed(1)+')">' +
    '<rect x="-8" y="-6" width="16" height="12" rx="3.5" fill="'+c+'" stroke="#7a3d12" stroke-width="1.2"/>' +
    '<rect x="-8" y="3" width="16" height="4" rx="2" fill="'+d+'"/></g>';
}
const PATS = {
  /* zeshoekige tafels: per tafel 4 stoelen (een eigen kleur) + 2 stoelen op de koppen */
  hexa(n, hi){
    const r = 30, w = Math.sqrt(3) * r, cy = r + 22, sx = 26 + w/2;
    let h = '', ch = '';
    for(let k = 0; k < n; k++){
      const cx = sx + k * w, V = [];
      for(let a = 0; a < 6; a++){ const t = (-90 + 60 * a) * Math.PI / 180; V.push([cx + r * Math.cos(t), cy + r * Math.sin(t)]); }
      const G = grp(k);
      h += '<polygon points="'+V.map(p => p.map(z => z.toFixed(1)).join(',')).join(' ')+'" fill="'+(hi ? G.c + '66' : '#c99a6b')+'" stroke="'+(hi ? G.d : '#6d4c2f')+'" stroke-width="2"/>';
      for(let sd = 0; sd < 6; sd++){
        if(sd === 1 && k < n - 1) continue;        // rechterzijde tegen de volgende tafel
        if(sd === 4 && k > 0) continue;            // linkerzijde tegen de vorige tafel
        const p = V[sd], q2 = V[(sd + 1) % 6], mx = (p[0] + q2[0]) / 2, my = (p[1] + q2[1]) / 2;
        const nx = mx - cx, ny = my - cy, L = Math.hypot(nx, ny), ang = Math.atan2(ny, nx) * 180 / Math.PI + 90;
        const kop = (sd === 4 && k === 0) || (sd === 1 && k === n - 1);
        ch += seatArc(p, q2, nx / L, ny / L, hi ? (kop ? VASTP : G) : null);
      }
    }
    const W = sx * 2 + (n - 1) * w;
    return '<svg class="patsvg" viewBox="0 0 '+W.toFixed(0)+' '+(2 * cy)+'" style="width:'+(W * 0.9).toFixed(0)+'px" aria-label="Figuur '+n+'">'+h+ch+'</svg>';
  },
  /* lucifers: per vierkantje 3 lucifers (een eigen kleur) + de eerste staander */
  luc(n, hi){
    const S = 44, x0 = 12, y0 = 12;
    const stick = (x1, y1, x2, y2, col) => {
      const hor = y1 === y2, c = col ? col.c : '#e8c27a', hd = col ? col.d : '#b33a1f';
      return (hor ? '<rect x="'+(x1+4)+'" y="'+(y1-3)+'" width="'+(S-8)+'" height="6" rx="3" fill="'+c+'" stroke="#8a6a2b" stroke-width=".8"/><circle cx="'+(x2-5)+'" cy="'+y1+'" r="4.2" fill="'+hd+'"/>'
                  : '<rect x="'+(x1-3)+'" y="'+(y1+4)+'" width="6" height="'+(S-8)+'" rx="3" fill="'+c+'" stroke="#8a6a2b" stroke-width=".8"/><circle cx="'+x1+'" cy="'+(y1+5)+'" r="4.2" fill="'+hd+'"/>');
    };
    let h = '';
    for(let k = 0; k < n; k++){
      const G = hi ? grp(k) : null, x = x0 + k * S;
      h += stick(x, y0, x + S, y0, G) + stick(x, y0 + S, x + S, y0 + S, G);
    }
    for(let k = 0; k <= n; k++) h += stick(x0 + k * S, y0, x0 + k * S, y0 + S, hi ? (k === 0 ? VASTP : grp(k - 1)) : null);
    const W = x0 * 2 + n * S;
    return '<svg class="patsvg" viewBox="0 0 '+W+' '+(S + 2 * y0)+'" style="width:'+(W * 1.05).toFixed(0)+'px" aria-label="Figuur '+n+'">'+h+'</svg>';
  },
  /* L-vorm: per stap 2 blokjes (een eigen kleur) + het hoekblokje */
  lvorm(n, hi){
    const S = 26, W = (n + 1) * S + 8, Hh = (n + 1) * S + 8;
    const blk = (c, r, col) => '<rect x="'+(4 + c * S)+'" y="'+(4 + r * S)+'" width="'+(S - 2)+'" height="'+(S - 2)+'" rx="4" fill="'+(col ? col.c : '#26a69a')+'" stroke="#17313a" stroke-width="1.2"/><rect x="'+(8 + c * S)+'" y="'+(7 + r * S)+'" width="'+(S - 12)+'" height="4" rx="2" fill="#fff" opacity=".35"/>';
    let h = blk(0, n, hi ? VASTP : null);
    for(let k = 1; k <= n; k++){
      const G = hi ? grp(k - 1) : null;
      h += blk(0, n - k, G) + blk(k, n, G);
    }
    return '<svg class="patsvg" viewBox="0 0 '+W+' '+Hh+'" style="width:'+(W * 1.1).toFixed(0)+'px" aria-label="Figuur '+n+'">'+h+'</svg>';
  },
  /* theaterzaal: een vierkant van n op n stoelen + één kolom van n stoelen */
  theater(n, hi){
    const S = 24, W = (n + 1) * S + 8, Hh = n * S + 8;
    let h = '';
    for(let r = 0; r < n; r++) for(let c = 0; c <= n; c++){
      const inV = c < n, col = hi ? (inV ? grp(0) : VASTP) : null;
      const x = 4 + c * S, y = 4 + r * S;
      h += '<rect x="'+(x+2)+'" y="'+(y+2)+'" width="'+(S-6)+'" height="'+(S-8)+'" rx="4" fill="'+(col ? col.c : '#c0392b')+'"/>' +
           '<rect x="'+x+'" y="'+(y+S-9)+'" width="'+(S-2)+'" height="6" rx="2" fill="'+(col ? col.d : '#7b241c')+'"/>';
    }
    if(hi){
      h += '<rect x="3" y="3" width="'+(n * S + 2)+'" height="'+(n * S + 2)+'" rx="5" fill="none" stroke="'+GRPD[0]+'" stroke-width="2.5" stroke-dasharray="6 4"/>';
      h += '<rect x="'+(n * S + 5)+'" y="3" width="'+(S)+'" height="'+(n * S + 2)+'" rx="5" fill="none" stroke="'+VASTD+'" stroke-width="2.5" stroke-dasharray="6 4"/>';
    }
    return '<svg class="patsvg" viewBox="0 0 '+(W + 4)+' '+(Hh + 4)+'" style="width:'+(W * 1.15).toFixed(0)+'px" aria-label="Patroon '+n+'">'+h+'</svg>';
  }
};
/* ---------- figuren met aanklikbare zijden ---------- */
const FIGS = {
  tent: {
    sides:[{lab:'3a', p:[[80,270],[400,270]], lp:[240,298]}, {lab:'b', p:[[400,270],[400,150]], lp:[424,214]},
           {lab:'2a', p:[[400,150],[240,40]], lp:[350,80]}, {lab:'2a', p:[[240,40],[80,150]], lp:[130,80]}, {lab:'b', p:[[80,150],[80,270]], lp:[56,214]}],
    draw(v){
      const S = this.sides, sd = (v && v.sd) || [];
      let h = '<defs><linearGradient id="tg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5ec8b8"/><stop offset="1" stop-color="#2f9e8d"/></linearGradient></defs>';
      h += '<polygon points="80,270 400,270 400,150 240,40 80,150" fill="url(#tg)"/>';
      h += '<polygon points="240,40 400,150 400,270 240,270" fill="#000" opacity=".10"/>';
      // ingang: ritsdriehoek
      h += '<polygon points="240,95 320,270 160,270" fill="#1f7d70"/>';
      h += '<path d="M240 95 L200 270" stroke="#d9f2ee" stroke-width="3" stroke-dasharray="7 6"/><path d="M240 95 L280 270" stroke="#d9f2ee" stroke-width="3" stroke-dasharray="7 6"/>';
      // scheerlijnen en haringen
      h += '<path d="M80 150 L34 270" stroke="#8a6a2b" stroke-width="3"/><path d="M400 150 L446 270" stroke="#8a6a2b" stroke-width="3"/>';
      h += '<circle cx="34" cy="270" r="5" fill="#6d4c2f"/><circle cx="446" cy="270" r="5" fill="#6d4c2f"/>';
      h += '<line x1="20" y1="270" x2="460" y2="270" stroke="#c9b48a" stroke-width="4"/>';
      S.forEach((s2, i) => {
        const k = sd.indexOf(i), on = k >= 0, a = s2.p[0], b = s2.p[1];
        h += '<g class="side'+(on ? ' on' : '')+'" data-side="'+i+'" role="button" aria-label="zijde '+s2.lab+'">' +
          '<line x1="'+a[0]+'" y1="'+a[1]+'" x2="'+b[0]+'" y2="'+b[1]+'" class="sidehit"/>' +
          '<line x1="'+a[0]+'" y1="'+a[1]+'" x2="'+b[0]+'" y2="'+b[1]+'" class="sideline"/>' +
          '<text x="'+s2.lp[0]+'" y="'+s2.lp[1]+'" text-anchor="middle" class="sidelab">'+s2.lab.replace(/([a-z])/g, '<tspan font-style="italic">$1</tspan>')+'</text>' +
          (on ? '<circle cx="'+((a[0]+b[0])/2)+'" cy="'+((a[1]+b[1])/2)+'" r="12" fill="#127a7f"/><text x="'+((a[0]+b[0])/2)+'" y="'+((a[1]+b[1])/2 + 5)+'" text-anchor="middle" font-size="14" font-weight="900" fill="#fff">'+(k+1)+'</text>' : '') + '</g>';
      });
      return '<svg class="vis-svg figsvg" viewBox="14 16 456 300" style="max-width:480px" aria-label="Festivaltentje">'+h+'</svg>';
    }
  },
  mat: {
    draw(v){
      const y0 = 40, H = 130, x0 = 60, W1 = 200, W2 = 130;
      const lab = arr => { const p = trPrev(arr).replace(/<span class="pvlab">[^<]*<\/span>/, ''); return p; };
      const p = (v && v.p) || [[], []];
      let h = '<defs><marker id="ma" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="#1d4ed8"/></marker>' +
        '<linearGradient id="gb" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3a4250"/><stop offset="1" stop-color="#22262e"/></linearGradient>' +
        '<linearGradient id="go" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#127a7f"/><stop offset="1" stop-color="#127a7f"/></linearGradient></defs>';
      h += '<rect x="'+(x0+4)+'" y="'+(y0+6)+'" width="'+(W1+W2)+'" height="'+H+'" rx="10" fill="#000" opacity=".12"/>';
      h += '<rect x="'+x0+'" y="'+y0+'" width="'+W1+'" height="'+H+'" rx="8" fill="url(#gb)"/><rect x="'+(x0+W1)+'" y="'+y0+'" width="'+W2+'" height="'+H+'" rx="8" fill="url(#go)"/>';
      h += '<rect x="'+(x0+W1-8)+'" y="'+y0+'" width="16" height="'+H+'" fill="url(#go)"/><rect x="'+(x0+W1-8)+'" y="'+y0+'" width="8" height="'+H+'" fill="url(#gb)"/>';
      h += '<text x="'+(x0+W1/2)+'" y="'+(y0+32)+'" text-anchor="middle" font-size="18" font-weight="900" fill="#fff">①</text><text x="'+(x0+W1+W2/2)+'" y="'+(y0+32)+'" text-anchor="middle" font-size="18" font-weight="900" fill="#fff">②</text>';
      h += '<foreignObject x="'+x0+'" y="'+(y0+H/2-8)+'" width="'+W1+'" height="40"><div xmlns="http://www.w3.org/1999/xhtml" class="rarea w">'+lab(p[0])+'</div></foreignObject>';
      h += '<foreignObject x="'+(x0+W1)+'" y="'+(y0+H/2-8)+'" width="'+W2+'" height="40"><div xmlns="http://www.w3.org/1999/xhtml" class="rarea w">'+lab(p[1])+'</div></foreignObject>';
      const dim = (x1, y1, x2, y2, t, tx, ty) => '<line x1="'+x1+'" y1="'+y1+'" x2="'+x2+'" y2="'+y2+'" stroke="#1d4ed8" stroke-width="2" marker-start="url(#ma)" marker-end="url(#ma)"/><text x="'+tx+'" y="'+ty+'" text-anchor="middle" font-size="18" font-weight="800" fill="#1d4ed8"'+(/[a-z]/.test(t) ? ' font-style="italic"' : '')+'>'+t+'</text>';
      h += dim(x0+3, y0+H+18, x0+W1-3, y0+H+18, '3', x0+W1/2, y0+H+40) + dim(x0+W1+3, y0+H+18, x0+W1+W2-3, y0+H+18, 'x', x0+W1+W2/2, y0+H+40);
      h += dim(x0+W1+W2+18, y0+3, x0+W1+W2+18, y0+H-3, 'x', x0+W1+W2+34, y0+H/2+6);
      return '<svg class="vis-svg figsvg" viewBox="30 20 '+(W1+W2+100)+' '+(H+80)+'" style="max-width:'+(W1+W2+110)+'px" aria-label="Sportmat">'+h+'</svg>';
    }
  }
};

/* ---------- extra figuren voor de omtrek: niet elke zijde staat erbij,
   streepjes tonen welke zijden even lang zijn (zoals op de toets) ---------- */
/* rechte hoek: een losse L met even lange benen (lengte q) in de hoek, met de hoek van de L
   op afstand g van het hoekpunt P, zodat ze de benen PA en PB niet raakt */
function rhoekL(P, A, B, g, q, kleur, w){
  const u = Q => { const dx = Q[0]-P[0], dy = Q[1]-P[1], L = Math.hypot(dx, dy); return [dx/L, dy/L]; };
  const a = u(A), b = u(B), c = [P[0] + g*(a[0]+b[0]), P[1] + g*(a[1]+b[1])];
  const f = n => Math.round(n * 10) / 10;
  return '<path d="M'+f(c[0]+q*a[0])+' '+f(c[1]+q*a[1])+' L'+f(c[0])+' '+f(c[1])+' L'+f(c[0]+q*b[0])+' '+f(c[1]+q*b[1])+'" fill="none" stroke="'+(kleur || '#35545a')+'" stroke-width="'+(w || 1.8)+'" pointer-events="none"/>';
}
function polyFig(o){
  return {
    sides: o.sides.map(s => ({lab:s.lab, p:[o.pts[s.a], o.pts[s.b]], lp:s.lp, show:s.show !== false, ticks:s.ticks || 0})),
    draw(v){
      const sd = (v && v.sd) || [];
      let h = '<polygon points="'+o.pts.map(p => p.join(',')).join(' ')+'" fill="#e3f3f1"/>';
      this.sides.forEach((s2, i) => {
        const k = sd.indexOf(i), on = k >= 0, a = s2.p[0], b = s2.p[1];
        const mx = (a[0]+b[0])/2, my = (a[1]+b[1])/2, dx = b[0]-a[0], dy = b[1]-a[1], L = Math.hypot(dx, dy), ux = dx/L, uy = dy/L;
        let tk = '';
        for(let t = 0; t < s2.ticks; t++){
          const off = (t - (s2.ticks - 1) / 2) * 8, cx = mx + ux * off, cy = my + uy * off;
          tk += '<line x1="'+(cx - uy * 9)+'" y1="'+(cy + ux * 9)+'" x2="'+(cx + uy * 9)+'" y2="'+(cy - ux * 9)+'" stroke="#17313a" stroke-width="2.5" pointer-events="none"/>';
        }
        h += '<g class="side'+(on ? ' on' : '')+'" data-side="'+i+'" role="button" aria-label="zijde '+(s2.show ? s2.lab : (i + 1))+'">' +
          '<line x1="'+a[0]+'" y1="'+a[1]+'" x2="'+b[0]+'" y2="'+b[1]+'" class="sidehit"/>' +
          '<line x1="'+a[0]+'" y1="'+a[1]+'" x2="'+b[0]+'" y2="'+b[1]+'" class="sideline"/>' + tk +
          (s2.show ? '<text x="'+s2.lp[0]+'" y="'+s2.lp[1]+'" text-anchor="middle" class="sidelab">'+s2.lab.replace(/([a-z])/g, '<tspan font-style="italic">$1</tspan>')+'</text>' : '') +
          (on ? '<circle cx="'+(mx + uy * 20)+'" cy="'+(my - ux * 20)+'" r="12" fill="#127a7f"/><text x="'+(mx + uy * 20)+'" y="'+(my - ux * 20 + 5)+'" text-anchor="middle" font-size="14" font-weight="900" fill="#fff">'+(k+1)+'</text>' : '') + '</g>';
      });
      (o.right || []).forEach(c => { h += rhoekL(o.pts[c[0]], o.pts[c[1]], o.pts[c[2]], 5, 15); });   // rechte hoeken
      return '<svg class="vis-svg figsvg" viewBox="'+o.view+'" style="max-width:'+o.max+'px" aria-label="'+o.label+'">'+h+'</svg>';
    }
  };
}
FIGS.para = polyFig({
  label:'Parallellogram', view:'20 40 460 250', max:470,
  pts:[[60,240], [340,240], [430,80], [150,80]],
  sides:[{a:0, b:1, lab:'4a', lp:[200,274], ticks:1}, {a:1, b:2, lab:'1,5b', lp:[428,170], ticks:2},
         {a:2, b:3, lab:'4a', show:false, ticks:1}, {a:3, b:0, lab:'1,5b', show:false, ticks:2}]
});
FIGS.vierkant = polyFig({
  label:'Vierkant', view:'90 20 320 320', max:330,
  pts:[[140,70], [360,70], [360,290], [140,290]],
  sides:[{a:0, b:1, lab:'2,5y', lp:[250,52], ticks:1}, {a:1, b:2, lab:'2,5y', show:false, ticks:1},
         {a:2, b:3, lab:'2,5y', show:false, ticks:1}, {a:3, b:0, lab:'2,5y', show:false, ticks:1}],
  right:[[0,1,3], [1,0,2], [2,1,3], [3,2,0]]
});

FIGS.driehoek = polyFig({
  label:'Driehoek met zijden 3x − 2, x + 4 en 2x + 1', view:'20 25 470 285', max:480,
  pts:[[60,250], [430,250], [190,50]],
  sides:[{a:0, b:1, lab:'3x − 2', lp:[245,284]}, {a:1, b:2, lab:'x + 4', lp:[362,140]}, {a:2, b:0, lab:'2x + 1', lp:[80,140]}]
});
FIGS.rechthoek = polyFig({
  label:'Rechthoek met breedte x en lengte x + 3', view:'20 10 470 260', max:480,
  pts:[[70,60], [410,60], [410,230], [70,230]],
  sides:[{a:0, b:1, lab:'x + 3', lp:[150,44], ticks:1}, {a:1, b:2, lab:'x', lp:[438,104], ticks:2},
         {a:2, b:3, lab:'x + 3', show:false, ticks:1}, {a:3, b:0, lab:'x', show:false, ticks:2}],
  right:[[0,1,3], [1,0,2], [2,1,3], [3,2,0]]
});

/* het zinnetje onder de figuren wanneer de hint aan staat */
const PATHINT = {
  hexa:'Elke tafel krijgt een eigen kleur: bij elke tafel horen even veel stoelen. De grijze stoelen op de twee koppen komen er maar één keer bij.',
  luc:'Elk vierkantje krijgt een eigen kleur: bij elk vierkantje horen even veel lucifers. De grijze staander vooraan komt er maar één keer bij.',
  lvorm:'Elke stap krijgt een eigen kleur: bij elke stap horen even veel blokjes. Het grijze hoekblokje komt er maar één keer bij.',
  theater:'Binnen het streepjesvierkant staan even veel rijen als kolommen. De grijze kolom ernaast telt er telkens bij.'
};

/* ---------- vaste tekeningen ---------- */
const SVGS = {
  rechthoek2(){
    let h = '<rect x="70" y="56" width="300" height="150" fill="#e3f3f1" stroke="#35545a" stroke-width="3"/>';
    [[70,56,1,1], [370,56,-1,1], [370,206,-1,-1], [70,206,1,-1]].forEach(c => {
      h += '<path d="M'+(c[0]+16*c[2])+' '+c[1]+' V'+(c[1]+16*c[3])+' H'+c[0]+'" fill="none" stroke="#35545a" stroke-width="1.8"/>';
    });
    const it = s => s.replace(/([a-z])/g, '<tspan font-style="italic" font-family="Georgia,serif">$1</tspan>');
    h += '<text x="220" y="40" text-anchor="middle" font-size="22" font-weight="800" fill="#1d4ed8">'+it('3a − 1')+'</text>';
    h += '<text x="384" y="138" font-size="22" font-weight="800" fill="#1d4ed8">'+it('2a')+'</text>';
    return '<svg class="vis-svg" viewBox="30 10 400 220" style="max-width:440px" aria-label="Rechthoek met lengte 3a min 1 en breedte 2a">'+h+'</svg>';
  },
  benoem(){
    let h = '';
    h += '<rect x="30" y="52" width="250" height="88" rx="16" fill="none" stroke="#0e5f63" stroke-width="2.5" stroke-dasharray="7 5"/>';
    h += '<rect x="44" y="62" width="120" height="68" rx="12" fill="#fff" stroke="#e08a12" stroke-width="3"/>';
    h += '<text x="58" y="115" font-size="54" font-weight="800" fill="#17313a">−</text><text x="88" y="115" font-size="54" font-weight="800" fill="#17313a">8</text>';
    h += '<text x="123" y="115" font-size="56" font-weight="700" font-style="italic" fill="#17313a" font-family="Georgia,serif">y</text>';
    h += '<text x="185" y="113" font-size="50" font-weight="800" fill="#17313a">+</text><text x="228" y="115" font-size="54" font-weight="800" fill="#17313a">5</text>';
    const tag = (x, y, t, c) => '<circle cx="'+x+'" cy="'+y+'" r="17" fill="'+c+'"/><text x="'+x+'" y="'+(y+5)+'" text-anchor="middle" font-size="14" font-weight="900" fill="#fff" font-family="Georgia,serif">'+t+'</text>';
    h += '<line x1="104" y1="62" x2="104" y2="30" stroke="#e08a12" stroke-width="2.5"/>' + tag(104, 20, 'I', '#e08a12');
    h += '<line x1="136" y1="124" x2="150" y2="176" stroke="#08845f" stroke-width="2.5"/>' + tag(150, 188, 'II', '#08845f');
    h += '<line x1="80" y1="124" x2="66" y2="176" stroke="#1565c0" stroke-width="2.5"/>' + tag(66, 188, 'III', '#1565c0');
    h += '<line x1="243" y1="66" x2="243" y2="30" stroke="#8d6e63" stroke-width="2.5"/>' + tag(243, 20, 'IV', '#8d6e63');
    h += '<line x1="280" y1="96" x2="312" y2="96" stroke="#0e5f63" stroke-width="2.5"/>' + tag(330, 96, 'V', '#0e5f63');
    return '<svg class="vis-svg" viewBox="0 0 360 210" style="max-width:420px" aria-label="De veelterm min 8 y plus 5 met Romeinse cijfers">'+h+'</svg>';
  },
  stoet(){
    let h = '';
    const man = (x, y, front) => '<g transform="translate('+x+' '+y+')"><circle r="13" fill="'+(front ? '#ffb300' : '#3949ab')+'" stroke="#17313a" stroke-width="1.5"/><circle r="6" cy="-2" fill="#f1c9a5"/>' +
      (front ? '<path d="M11 -6 l6 -12" stroke="#8a5a00" stroke-width="3" stroke-linecap="round"/><path d="M17 -18 q4 -7 0 -11 q-4 4 0 11z" fill="#ff7043"/>' : '<rect x="-7" y="-15" width="14" height="6" rx="2" fill="#1a237e"/>') + '</g>';
    const F = [[150, 30], [120, 62], [180, 62], [90, 94], [210, 94]];
    F.forEach(p => { h += man(p[0], p[1], true); });
    const y0 = 140, dy = 38, RN = 3;
    for(let r = 0; r < RN; r++) for(let c = 0; c < 3; c++) h += man(100 + c * 50, y0 + r * dy, false);
    // stippellijn tussen twee opeenvolgende rijen
    for(let r = 1; r < RN; r++){
      const y = y0 + r * dy - dy / 2;
      h += '<line x1="70" y1="'+y+'" x2="238" y2="'+y+'" stroke="#9fb3b6" stroke-width="1.5" stroke-dasharray="5 5"/>';
    }
    h += '<rect x="66" y="10" width="168" height="104" rx="18" fill="none" stroke="#e0a800" stroke-width="2" stroke-dasharray="6 5"/>';
    h += '<text x="244" y="60" font-size="14" font-weight="800" fill="#8a5a00">vaste groep</text>';
    h += '<text x="244" y="78" font-size="14" font-weight="800" fill="#8a5a00">fakkeldragers</text>';
    // accolade langs de rijen
    const yA = y0 - dy / 2 + 4, yB = y0 + (RN - 1) * dy + dy / 2 - 4, xB = 250, yM = (yA + yB) / 2;
    h += '<path d="M'+xB+' '+yA+' q8 0 8 9 v'+((yM - yA) - 18)+' q0 9 8 9 q-8 0 -8 9 v'+((yB - yM) - 18)+' q0 9 -8 9" ' +
         'fill="none" stroke="#3949ab" stroke-width="2" stroke-linecap="round"/>';
    h += '<text x="'+(xB + 22)+'" y="'+(yM + 5)+'" font-size="15" font-weight="800" fill="#3949ab">rijen</text>';
    return '<svg class="vis-svg" viewBox="40 0 330 250" style="max-width:380px" aria-label="Lichtstoet: een vaste groep van 5 en daarachter rijen van 3">'+h+'</svg>';
  }
};

/* =========================================================
   M02 — VRAAGTYPES: standaardwaarden, volledigheid, weergave
   (geen oordeel over juistheid: code.gs verbetert)
========================================================= */
function SR(eq, html, step, cls){
  return '<div class="srow '+(cls || '')+'"><span class="eq">'+(eq || '')+'</span><div class="orig">'+html+'</div>'+(step ? '<span class="stepname">'+step+'</span>' : '<span></span>')+'</div>';
}
const FMT = '<div class="fmtmsg" data-msg="res"></div>';
const TRHINT1 = '<div class="signhint">Typ je antwoord gewoon op de lijn. Typ <b>^</b> voor een exponent (<b>x^2</b> wordt x²) en <b>/</b> voor een breuk (<b>1/4</b> wordt ¼). Met <b>→</b> of een spatie ga je uit de exponent of de breuk. De knopjes naast het vakje doen hetzelfde.</div>';
const TRHINT = '<div class="signhint">Typ je antwoord gewoon op de lijn. Typ <b>^</b> voor een exponent (<b>x^2</b> wordt x²) en <b>/</b> voor een breuk (<b>1/4</b> wordt ¼). Met <b>→</b> of een spatie ga je uit de exponent of de breuk. De knopjes naast het vakje doen hetzelfde.</div>';
function letterOf(i){ return String.fromCharCode(97 + i) + ')'; }
function picHTML(key, alt, cls){ return IMG[key] ? '<figure class="pic '+(cls || '')+'"><img src="'+IMG[key]+'" alt="'+esc(alt || '')+'"></figure>' : ''; }
function optList(opts, cur, attr){
  return '<div class="optlist">'+opts.map((o, i) => {
    const id = o.id != null ? o.id : i, txt = o.text != null ? o.text : o;
    return '<button type="button" class="opt'+(String(cur) === String(id) ? ' selected' : '')+'" '+attr+'="'+id+'"><span class="letter">'+String.fromCharCode(65 + i)+'</span><span>'+rich(txt)+'</span></button>';
  }).join('')+'</div>';
}
function bindOpts(q, attr, setter){
  $R('workspace').querySelectorAll('['+attr+']').forEach(b => b.onclick = () => { const val = getVal(q); setter(val, b.getAttribute(attr)); saveAnswer(q, val); render(); });
}
function flatTerms(q){ const out = []; q.g.forEach((g, gi) => parsePoly(g.t).forEach((t, ti) => out.push({t, gi, ti}))); return out; }
function letterCount(q){ return parsePoly(q.expr).reduce((s, t) => s + (parseLett(t.l) || []).length, 0); }

/* ---------- standaardwaarden ---------- */
function defaultVal(q){
  switch(q.type){
    case 'kies':     return {choice:null};
    case 'fout':     return {choice:null, res:TRV()};
    case 'sorteer':  return {a:{}};
    case 'omkring':  return {c:q.rows.map(() => [])};
    case 'isgelijk': return {c:q.rows.map(() => null)};
    case 'bewteken': return {c:q.rows.map(() => ({s:null}))};
    case 'labels':   return {c:q.rows.map(() => null)};
    case 'koppel':   return {m:{}};
    case 'orden':    return {o:q.parts.map(() => [])};
    case 'kleur':    return {mk:{}};
    case 'tabel':    return {r:q.rows.map(row => { const o = {}; if(row.t == null) o.t = TRV(); if(row.c == null) o.c = SN(); if(row.l == null) o.l = SN(); return o; })};
    case 'rows':     { const o = {r:q.rows.map(() => q.kind === 'nat' ? '' : TRV())}; if(q.rows.some(r => r.dist)) o.bg = q.rows.map(() => []); return o; }
    case 'herlrows': return {r:q.rows.map(() => ({t:TRV(), nh:false}))};
    case 'herl':     return {mk:{}, res:TRV()};
    case 'hw':       return {tg:q.kort ? null : q.g.map(g => g.op === '−' ? parsePoly(g.t).map(() => ({s:null})) : null),
                             hw:flatTerms(q).map(() => ({s:null})), mk:{}, res:TRV()};
    case 'gw':       return {sub:[], tv:parsePoly(q.expr).length > 1 ? parsePoly(q.expr).map(() => SN()) : null, res:SN()};
    case 'gwtabel':  return {r:q.vals.map(() => SN())};
    case 'mono':     return {r:q.rows.map(() => ({g:SN(), l:SN()}))};
    case 'prodtab':  return {r:q.rf.map(() => q.cf.map(() => TRV()))};
    case 'distr':    return {bg:[], pr:q.items.map(it => it.loose ? null : parsePoly(it.t).map(() => TRV())), sam:TRV(), mk:{}, res:TRV()};
    case 'opp':      return {p:q.parts.map(() => TRV()), tot:TRV(), bes:TRV()};
    case 'omtrek':   return {sd:[], res:TRV()};
    case 'pat':      return {t:q.cols.map(() => ''), f:TRV(), wf:null, ask:q.ask ? SN() : null};
    case 'pira':     return {c:[TRV(), TRV(), TRV()]};
    case 'ctx':      return {p:q.parts.map(p => (p.k === 'tr' || p.k === 'gs') ? TRV() : (p.k === 'nf' ? SN() : null))};
  }
  return {};
}
function isComplete(q, v){
  if(!v) return false;
  try{
    switch(q.type){
      case 'kies':     return v.choice != null;
      case 'fout':     return v.choice != null && trOK(v.res);
      case 'sorteer':  return q.chips.every((c, i) => v.a[i] != null);
      case 'omkring':  return v.c.every(r => r.length > 0);
      case 'isgelijk': case 'labels': return v.c.every(x => x != null);
      case 'bewteken': return v.c.every(x => x.s != null);
      case 'koppel':   return q.left.every((l, i) => v.m[i] != null);
      case 'orden':    return q.parts.every((p, r) => v.o[r].length === parsePoly(p).length);
      case 'kleur':    return allMarked(v.mk, q.tiles.length);
      case 'tabel':    return v.r.every(o => (!o.t || trOK(o.t)) && (!o.c || qOK(o.c)) && (o.l == null || letOK(o.l)));
      case 'rows':     return v.r.every(x => q.kind === 'nat' ? parseNatStr(x) != null : trOK(x));
      case 'herlrows': return v.r.every(x => x.nh || trOK(x.t));
      case 'herl':     return allMarked(v.mk, parsePoly(q.expr).length) && trOK(v.res);
      case 'hw':       return (!v.tg || v.tg.every(g => !g || g.every(o => o.s != null))) && v.hw.every(o => o.s != null) &&
                              allMarked(v.mk, v.hw.length) && trOK(v.res);
      case 'gw':       return v.sub.length === letterCount(q) && (!v.tv || v.tv.every(pmOK)) && qOK(v.res);
      case 'gwtabel':  return v.r.every(qOK);
      case 'mono':     return v.r.every(o => qOK(o.g) && letOK(o.l));
      case 'prodtab':  return v.r.every(r => r.every(trOK));
      case 'distr':    return q.items.every((it, pi) => it.loose || parsePoly(it.t).every((t, ti) => v.bg.indexOf(pi+'.'+ti) >= 0 && trOK(v.pr[pi][ti]))) &&
                              (!needsHerl(q) || (trOK(v.sam) && allMarked(v.mk, samTerms(v).length))) && trOK(v.res);
      case 'opp':      return v.p.every(trOK) && trOK(v.tot) && trOK(v.bes);
      case 'omtrek':   return v.sd.length === FIGS[q.fig].sides.length && trOK(v.res);
      case 'pat':      return v.t.every(x => parseNatStr(x) != null) && trOK(v.f) && (!q.wf || v.wf != null) && (!q.ask || qOK(v.ask));
      case 'pira':     return v.c.every(trOK);
      case 'ctx':      return q.parts.every((p, i) => (p.k === 'tr' || p.k === 'gs') ? trOK(v.p[i]) : (p.k === 'nf' ? qOK(v.p[i]) : v.p[i] != null));
    }
  }catch(e){ return false; }
  return false;
}

/* =========================================================
   KIES — meerkeuze (eventueel met foto)
========================================================= */
function renderKies(q, v){
  $R('visual').innerHTML = q.img ? picHTML(q.img, q.imgAlt) : '';
  $R('answer').innerHTML = optList(q.options, v.choice, 'data-opt');
  bindOpts(q, 'data-opt', (val, id) => { val.choice = id; });
}

/* =========================================================
   FOUTENJAGER — schrift van een klasgenoot
========================================================= */
function renderFout(q, v){
  $R('visual').innerHTML =
    '<div class="notebook"><div class="nb-name">Schrift van '+esc(q.who)+'</div><div class="nb-line">'+mathHTML(q.work)+'</div><div class="nb-stamp">?</div></div>';
  $R('answer').innerHTML = '<h3>Wat ging er fout?</h3>' + optList(q.options, v.choice, 'data-opt') +
    '<h3 class="sub">Schrijf de juiste uitkomst</h3><div class="row"><span class="eqs big">=</span>'+trHTML('res', v.res)+'</div>' + FMT + TRHINT;
  bindOpts(q, 'data-opt', (val, id) => { val.choice = id; });
  bindAll(q);
}

/* =========================================================
   SORTEREN — kaarten in bakken (klikken of slepen)
========================================================= */
function renderSorteer(q, v){
  const chip = i => '<button type="button" class="chip'+(ui.tsel === i ? ' sel' : '')+'" data-chip="'+i+'" draggable="true">'+rich(q.chips[i])+'</button>';
  const pool = q.chips.map((c, i) => v.a[i] == null ? chip(i) : '').join('');
  $R('visual').innerHTML = '';
  $R('answer').innerHTML =
    '<div class="pool" data-bin="-1">'+(pool || '<span class="hint">Alle kaarten liggen in een bak. Klik een kaart aan om ze te verplaatsen.</span>')+'</div>' +
    '<div class="bins" style="grid-template-columns:repeat('+Math.min(q.bins.length, 4)+',minmax(0,1fr))">' +
    q.bins.map((b, bi) => '<div class="bin'+(ui.tsel != null ? ' ready' : '')+'" data-bin="'+bi+'"><div class="binhead">'+rich(b)+'</div><div class="binbody">' +
      q.chips.map((c, i) => v.a[i] === bi ? chip(i) : '').join('') + '</div></div>').join('') + '</div>';
  const put = (i, b) => { const val = getVal(q); if(b < 0) delete val.a[i]; else val.a[i] = b; ui.tsel = null; saveAnswer(q, val); render(); };
  $R('answer').querySelectorAll('[data-chip]').forEach(c => {
    c.onclick = e => {
      e.stopPropagation();
      const i = Number(c.dataset.chip);
      if(ui.tsel != null && ui.tsel !== i){ put(ui.tsel, v.a[i] != null ? v.a[i] : -1); return; }  // kaart naar dezelfde bak als deze kaart
      ui.tsel = ui.tsel === i ? null : i; render();
    };
    c.ondragstart = e => { e.dataTransfer.setData('text/plain', c.dataset.chip); };
  });
  $R('answer').querySelectorAll('[data-bin]').forEach(b => {
    b.onclick = () => { if(ui.tsel != null) put(ui.tsel, Number(b.dataset.bin)); };
    b.ondragover = e => { e.preventDefault(); b.classList.add('over'); };
    b.ondragleave = () => b.classList.remove('over');
    b.ondrop = e => { e.preventDefault(); const i = Number(e.dataTransfer.getData('text/plain')); if(!isNaN(i)) put(i, Number(b.dataset.bin)); };
  });
}

/* =========================================================
   OMKRINGEN
========================================================= */
function renderOmkring(q, v){
  $R('visual').innerHTML = '';
  $R('answer').innerHTML = q.rows.map((r, ri) =>
    '<div class="okrow"><span class="rl">'+letterOf(ri)+'</span><span class="okref">'+mathHTML(r.ref)+'</span><span class="okarrow">→</span>' +
    r.items.map((it, j) => '<button type="button" class="okchip'+(v.c[ri].indexOf(j) >= 0 ? ' on' : '')+'" data-ok="'+ri+'.'+j+'">'+mathHTML(it)+'</button>').join('') + '</div>').join('');
  $R('answer').querySelectorAll('[data-ok]').forEach(b => b.onclick = () => {
    const [ri, j] = b.dataset.ok.split('.').map(Number), val = getVal(q), a = val.c[ri], k = a.indexOf(j);
    if(k >= 0) a.splice(k, 1); else a.push(j);
    saveAnswer(q, val); render();
  });
}

/* =========================================================
   = OF ≠
========================================================= */
function renderIsgelijk(q, v){
  $R('visual').innerHTML = '';
  $R('answer').innerHTML = q.rows.map((r, i) =>
    '<div class="cmprow"><div class="l"><span class="cmpletter">'+letterOf(i)+'</span>'+mathHTML(r[0])+'</div><div class="cmpbtns">' +
    ['=', '≠'].map(s => '<button type="button" class="cmpbtn'+(v.c[i] === s ? ' selected' : '')+'" data-cmp="'+i+'" data-v="'+s+'">'+s+'</button>').join('') +
    '</div><div class="r">'+mathHTML(r[1])+'</div></div>').join('');
  $R('answer').querySelectorAll('[data-cmp]').forEach(b => b.onclick = () => { const val = getVal(q); val.c[Number(b.dataset.cmp)] = b.dataset.v; saveAnswer(q, val); render(); });
}

/* =========================================================
   BEWERKINGSTEKEN INVULLEN
========================================================= */
function renderBewteken(q, v){
  $R('visual').innerHTML = '';
  $R('answer').innerHTML = q.rows.map((r, i) =>
    '<div class="bwrow"><span class="rl">'+letterOf(i)+'</span><span class="bwx">'+mathHTML('('+r[0]+')')+'</span>'+pmBtn('c.'+i+'.s', v.c[i].s, 'big')+
    '<span class="bwx">'+mathHTML('('+r[1]+')')+'</span><span class="eqs big">=</span><span class="bwx">'+mathHTML(r[2])+'</span></div>').join('');
  bindPM(q);
}

/* =========================================================
   BEGRIPPEN BENOEMEN (Romeinse cijfers)
========================================================= */
function renderLabels(q, v){
  $R('visual').innerHTML = SVGS[q.svg]();
  $R('answer').innerHTML = q.rows.map((r, i) =>
    '<div class="lbrow"><span class="lbnum">'+r+'</span><div class="lbchips">' +
    q.choices.map((c, j) => '<button type="button" class="lbchip'+(v.c[i] === j ? ' on' : '')+'" data-lb="'+i+'" data-v="'+j+'">'+esc(c)+'</button>').join('') + '</div></div>').join('');
  $R('answer').querySelectorAll('[data-lb]').forEach(b => b.onclick = () => { const val = getVal(q); val.c[Number(b.dataset.lb)] = Number(b.dataset.v); saveAnswer(q, val); render(); });
}

/* =========================================================
   KOPPELEN — lijntjes trekken
========================================================= */
const KP_COL = ['#08845f', '#127a7f', '#b26a00', '#1565c0'];
function renderKoppel(q, v){
  const used = {}; Object.keys(v.m).forEach(k => { used[v.m[k]] = Number(k); });
  $R('visual').innerHTML = '';
  $R('answer').innerHTML = '<div class="kpwrap" data-r="kpwrap"><div class="kpcol">' +
    q.left.map((l, i) => '<button type="button" class="kpitem left'+(ui.klsel === i ? ' sel' : '')+(v.m[i] != null ? ' linked' : '')+'" data-kl="'+i+'"'+(v.m[i] != null ? ' style="--kc:'+KP_COL[i]+'"' : '')+'>'+richOrMath(l)+'</button>').join('') +
    '</div><div class="kpgap"></div><div class="kpcol">' +
    q.right.map((r, j) => '<button type="button" class="kpitem right'+(used[j] != null ? ' linked' : '')+'" data-kr="'+j+'"'+(used[j] != null ? ' style="--kc:'+KP_COL[used[j]]+'"' : '')+'>'+richOrMath(r)+'</button>').join('') +
    '</div></div>';
  $R('answer').querySelectorAll('[data-kl]').forEach(b => b.onclick = () => {
    const i = Number(b.dataset.kl);
    if(v.m[i] != null){ const val = getVal(q); delete val.m[i]; saveAnswer(q, val); ui.klsel = i; render(); return; }
    ui.klsel = ui.klsel === i ? null : i; render();
  });
  $R('answer').querySelectorAll('[data-kr]').forEach(b => b.onclick = () => {
    if(ui.klsel == null) return;
    const j = Number(b.dataset.kr), val = getVal(q);
    Object.keys(val.m).forEach(k => { if(val.m[k] === j) delete val.m[k]; });
    val.m[ui.klsel] = j; ui.klsel = null; saveAnswer(q, val); render();
  });
  ui.afterDraw = () => {
    const w = $R('kpwrap'); if(!w) return;
    drawLinks(w, Object.keys(v.m).map(k => ({a:w.querySelector('[data-kl="'+k+'"]'), b:w.querySelector('[data-kr="'+v.m[k]+'"]'), color:KP_COL[k]})));
  };
  rafC(ui.afterDraw);
}

/* =========================================================
   RANGSCHIKKEN — termen in volgorde aanklikken
========================================================= */
function renderOrden(q, v){
  $R('visual').innerHTML = '';
  $R('answer').innerHTML = q.parts.map((p, r) => {
    const T = parsePoly(p), o = v.o[r];
    const ans = o.map((ti, k) => '<button type="button" class="otile placed" data-oa="'+r+'.'+k+'">'+sgHTML(T[ti].s, k === 0)+termBody(T[ti].c, T[ti].l)+'</button>').join('') +
      T.slice(o.length).map(() => '<span class="oslot"></span>').join('');
    const pool = T.map((t, ti) => o.indexOf(ti) >= 0 ? '' : '<button type="button" class="otile" data-op="'+r+'.'+ti+'">'+(t.s === '−' ? '<span class="sg-m">−</span>' : '<span class="sg-p">+</span>')+termBody(t.c, t.l)+'</button>').join('');
    return '<div class="ordrow"><div class="ordlab"><span class="rl">'+letterOf(r)+'</span>'+polyHTML(p)+'</div>' +
      '<div class="ordans"><span class="eqs big">=</span>'+ans+'</div><div class="ordpool">'+(pool || '<span class="hint">Alle termen staan in je antwoord.</span>')+'</div></div>';
  }).join('');
  $R('answer').querySelectorAll('[data-op]').forEach(b => b.onclick = () => { const [r, ti] = b.dataset.op.split('.').map(Number), val = getVal(q); val.o[r].push(ti); saveAnswer(q, val); render(); });
  $R('answer').querySelectorAll('[data-oa]').forEach(b => b.onclick = () => { const [r, k] = b.dataset.oa.split('.').map(Number), val = getVal(q); val.o[r].splice(k, 1); saveAnswer(q, val); render(); });
}

/* =========================================================
   KLEUREN — gelijksoortige eentermen markeren
========================================================= */
function mkGroups(map, items){
  const g = {}; items.forEach((html, i) => { if(map[i] != null){ (g[map[i]] = g[map[i]] || []).push(html); } });
  const keys = Object.keys(g);
  if(!keys.length) return '';
  return '<div class="mkgroups">'+keys.map(c => '<span class="mkg" style="--mk:'+MK_COL[c]+'">'+g[c].join('<span class="mkgsep"></span>')+'</span>').join('')+'</div>';
}
function renderKleur(q, v){
  $R('visual').innerHTML = '';
  $R('answer').innerHTML = markerBar() + '<div class="tilegrid">' +
    q.tiles.map((t, i) => mkTile('mk', i, polyHTML(t), v.mk, 'big')).join('') + '</div>';
  bindMarkers(q);
}

/* =========================================================
   TABEL — eenterm · coëfficiënt · lettergedeelte
========================================================= */
function renderTabel(q, v){
  const cell = (row, i, k) => {
    if(row[k] != null) return '<td class="given">'+(k === 't' ? polyHTML(row[k]) : mathHTML(row[k]))+'</td>';
    const p = 'r.'+i+'.'+k, o = v.r[i];
    if(k === 't') return '<td>'+trHTML(p, o.t, {fixed:true, compact:true})+'</td>';
    if(k === 'c') return '<td>'+snField(p, o.c, 'q')+'</td>';
    return '<td>'+letField(p, o.l, 'sm')+'</td>';
  };
  $R('visual').innerHTML = '';
  $R('answer').innerHTML = '<table class="atab"><tr>'+q.cols.map(c => '<th>'+esc(c.h)+'</th>').join('')+'</tr>' +
    q.rows.map((row, i) => '<tr>'+q.cols.map(c => cell(row, i, c.k)).join('')+'</tr>').join('') + '</table>' + FMT + TRHINT;
  bindAll(q);
}

/* =========================================================
   REGELS — per regel een uitdrukking of getal
========================================================= */
function rdFac(f, wrap){ return mathHTML(wrap && String(f).charAt(0) === '−' ? '(' + f + ')' : f); }
function rdExpr(row, i, bg){
  const d = row.dist, T = parsePoly(d.t);
  const fac = '<button type="button" class="dfac sm'+(ui.rdsel === i ? ' sel' : '')+'" data-rdf="'+i+'" title="Klik eerst hier, daarna op een term tussen de haakjes">'+mathHTML(d.f)+'</button>';
  const par = PW(T.map((t, ti) => '<button type="button" class="dterm sm'+(bg.indexOf(ti) >= 0 ? ' on' : '')+'" data-rdt="'+i+'.'+ti+'" style="--dc:'+DCOL[ti % 3]+';--da:'+DAREA[ti % 3]+'">'+dTerm(t, ti === 0)+'</button>').join(''));
  return '<span class="rdwrap" data-rdw="'+i+'">'+(d.after ? par + '<span class="mop">⋅</span>' + fac : fac + '<span class="mop">⋅</span>' + par)+'</span>';
}
function rdStep(row, i, bg){
  const d = row.dist, T = parsePoly(d.t), done = T.map((t, ti) => ti).filter(ti => bg.indexOf(ti) >= 0);
  if(ui.rdhint === i) return '<span class="hint warnhint">Klik eerst op de factor '+(d.after ? 'achter' : 'voor')+' de haakjes, daarna op een term tussen de haakjes.</span>';
  if(!done.length) return '<span class="hint">Tussenstap nodig? Klik op de factor en daarna op elke term tussen de haakjes.</span>';
  return '<span class="eqs">=</span>' + done.map((ti, k) => {
    const prod = d.after ? termPar(T[ti]) + '<span class="mop">⋅</span>' + rdFac(d.f, true) : rdFac(d.f, k > 0) + '<span class="mop">⋅</span>' + termPar(T[ti]);
    return (k ? '<span class="sg-p bop">+</span>' : '') + '<span class="rdprod" style="--dc:'+DCOL[ti % 3]+'">'+prod+'</span>';
  }).join('') + (done.length < T.length ? '<span class="hint">… nog '+(T.length - done.length)+' boogje'+(T.length - done.length > 1 ? 's' : '')+'</span>' : '');
}
function renderRows(q, v){
  $R('visual').innerHTML = '';
  $R('answer').innerHTML = q.rows.map((row, i) => {
    const field = q.kind === 'nat' ? inp('r.'+i, v.r[i], 'nat', 'dn sm') : trHTML('r.'+i, v.r[i], {compact:true});
    if(row.dist){
      const bg = (v.bg && v.bg[i]) || [];
      return '<div class="rrow rdist"><div class="rdtop"><span class="rl">'+letterOf(i)+'</span>'+rdExpr(row, i, bg)+'</div>' +
        '<div class="rdstep">'+rdStep(row, i, bg)+'</div>' +
        '<div class="rin"><span class="rpre">'+rich(row.pre || q.pre || '=')+'</span>'+field+'</div></div>';
    }
    const lab = row.seg || row.img ? '<b class="rl">'+esc(row.lab)+')</b>'+(row.text ? ' '+rich(row.text) : '') : '<span class="rl">'+letterOf(i)+'</span> '+rich(row.lab);
    return '<div class="rrow'+(row.seg || row.img ? ' withpic' : '')+'"><div class="rlab">'+lab+'</div>' +
      (row.seg ? segSVG(row.seg) : '') + (row.img ? picHTML(row.img, row.imgAlt, 'small') : '') +
      '<div class="rin"><span class="rpre">'+rich(row.pre || q.pre || '=')+'</span>'+field+'</div>' +
      (row.note ? '<div class="signhint warnhint">'+rich(row.note)+'</div>' : '') + '</div>';
  }).join('') + FMT + (q.kind === 'nat' ? '' : TRHINT);
  if(q.rows.some(r => r.dist)){
    const fresh = ui.freshArc; ui.freshArc = null;
    ui.afterDraw = () => {
      const bgs = getVal(q).bg || [];
      $R('answer').querySelectorAll('[data-rdw]').forEach(w => {
        const i = Number(w.dataset.rdw);
        drawLinks(w, (bgs[i] || []).map(ti => ({a:w.querySelector('[data-rdf="'+i+'"]'), b:w.querySelector('[data-rdt="'+i+'.'+ti+'"]'),
          arc:true, nohead:true, color:DCOL[ti % 3], fresh:(i+'.'+ti) === fresh})));
      });
    };
    $R('answer').querySelectorAll('[data-rdf]').forEach(b => b.onclick = () => {
      const i = Number(b.dataset.rdf); ui.rdsel = ui.rdsel === i ? null : i; ui.rdhint = null; render();
    });
    $R('answer').querySelectorAll('[data-rdt]').forEach(b => b.onclick = () => {
      const p = b.dataset.rdt.split('.').map(Number), i = p[0], ti = p[1], val = getVal(q);
      val.bg = val.bg || q.rows.map(() => []);
      const a = val.bg[i] = val.bg[i] || [], k = a.indexOf(ti);
      if(k >= 0){ a.splice(k, 1); saveAnswer(q, val); render(); return; }        // boogje weghalen
      if(ui.rdsel !== i){ ui.rdhint = i; render(); return; }
      a.push(ti); a.sort((x, y) => x - y); ui.freshArc = i+'.'+ti; ui.rdhint = null; saveAnswer(q, val); render();
    });
  }
  bindAll(q);
  if(q.rows.some(r => r.dist)) rafC(ui.afterDraw);
}

/* =========================================================
   HERLEID INDIEN MOGELIJK — korte regels
========================================================= */
function renderHerlrows(q, v){
  $R('visual').innerHTML = '';
  $R('answer').innerHTML = q.rows.map((e, i) => {
    const o = v.r[i];
    return '<div class="hrow"><span class="rl">'+letterOf(i)+'</span><span class="hexpr">'+polyHTML(e)+'</span><span class="eqs big">=</span>' +
      (o.nh ? '<span class="nhtxt">kan niet herleid worden</span>' : trHTML('r.'+i+'.t', o.t, {compact:true})) + nhBtn('r.'+i+'.nh', o.nh) + '</div>';
  }).join('') + FMT + TRHINT;
  bindAll(q);
}

/* =========================================================
   HERLEIDEN — markeerstiften + eindresultaat
========================================================= */
function renderHerl(q, v){
  const T = parsePoly(q.expr), inner = T.map((t, i) => dTerm(t, i === 0));
  $R('visual').innerHTML = opgaveBox(polyHTML(q.expr));
  $R('answer').innerHTML = '<div class="schrift fs">' +
    SR('', markerBar() + '<div class="tilerow">'+T.map((t, i) => mkTile('mk', i, inner[i], v.mk)).join('')+'</div>' + mkGroups(v.mk, inner), '① gelijksoortig kleuren') +
    SR('=', trHTML('res', v.res), '② herleid') + '</div>' + FMT + TRHINT;
  bindAll(q);
}

/* =========================================================
   SOM EN VERSCHIL — tegengestelde, haakjes weg, kleuren, herleiden
========================================================= */
function hwOriginal(q){ return q.g.map((g, i) => (i ? ' '+g.op+' ' : '')+'('+g.t+')').join(''); }
function renderHw(q, v){
  const F = flatTerms(q), minus = q.g.some(g => g.op === '−'), needTg = minus && !q.kort;
  const plan = minus
    ? (q.kort ? ['Staat er een + voor de haakjes: laat de haakjes weg.', 'Staat er een − voor de haakjes: verander het teken van elke term en laat de haakjes weg.', 'Tel de gelijksoortige eentermen op.']
              : ['stap 1: tel het tegengestelde van de tweede veelterm op', 'stap 2: werk de haakjes weg', 'stap 3: tel de gelijksoortige eentermen op'])
    : ['stap 1: laat de haakjes weg', 'stap 2: tel de gelijksoortige eentermen op'];
  $R('visual').innerHTML = opgaveBox(mathHTML(hwOriginal(q))) + '<div class="plan">'+plan.map(p => '<span>'+esc(p)+'</span>').join('')+'</div>';
  let h = '<div class="schrift fs">';
  if(needTg){
    const line = q.g.map((g, gi) => {
      const T = parsePoly(g.t);
      if(g.op !== '−') return (gi ? '<span class="sg-p bop">+</span>' : '') + PW(T.map((t, ti) => dTerm(t, ti === 0)).join(''));
      return '<span class="sg-p bop">+</span>' + PW(T.map((t, ti) => (ti === 0 ? tsBtn('tg.'+gi+'.0', v.tg[gi][0].s) : pmBtn('tg.'+gi+'.'+ti+'.s', v.tg[gi][ti].s)) + '<span class="tb">'+termBody(t.c, t.l)+'</span>').join(''));
    }).join('');
    h += SR('=', '<span class="hwline">'+line+'</span>', 'tegengestelde optellen');
  }
  h += SR('=', '<span class="hwline">'+F.map((f, k) => (k === 0 ? tsBtn('hw.0', v.hw[0].s) : pmBtn('hw.'+k+'.s', v.hw[k].s)) + '<span class="tb">'+termBody(f.t.c, f.t.l)+'</span>').join('')+'</span>', 'haakjes weg');
  const inner = F.map((f, k) => sgHTML(v.hw[k].s, k === 0) + termBody(f.t.c, f.t.l));
  h += SR('', markerBar() + '<div class="tilerow">'+inner.map((x, k) => mkTile('mk', k, x, v.mk)).join('')+'</div>' + mkGroups(v.mk, inner), 'gelijksoortig kleuren');
  h += SR('=', trHTML('res', v.res), 'herleid');
  $R('answer').innerHTML = h + '</div>' + FMT + '<div class="signhint">Klik in elk vakje het juiste teken aan: + of −. Een + vooraan schrijf je niet, dus die verdwijnt. Klik op een teken om het te wijzigen.</div>' + TRHINT;
  bindAll(q);
}

/* =========================================================
   GETALWAARDE — letters vervangen, termen uitrekenen
========================================================= */
function valHTML(val, e){
  const neg = val.charAt(0) === '−', abs = val.replace('−', '');
  const inner = abs.indexOf('/') >= 0 ? frHTML2(abs.split('/')[0], abs.split('/')[1]) : '<span class="mn">'+abs+'</span>';
  const par = neg || (e > 1 && /[\/,]/.test(abs));
  const base = par ? PW((neg ? '<span class="sg-m">−</span>' : '') + inner) : inner;
  return e > 1 ? '<span class="lt">'+base+'<sup>'+e+'</sup></span>' : base;
}
function gwTermHTML(q, t, ti, sub, first){
  const L = parseLett(t.l) || [], items = [];
  if(t.c) items.push({h:coefHTML(t.c), val:false});
  L.forEach((o, li) => {
    const key = ti+'.'+li;
    if(sub.indexOf(key) >= 0) items.push({h:'<button type="button" class="subv'+(ui.freshSub === key ? ' fresh' : '')+'" data-unsub="'+key+'" title="Klik om de letter weer te tonen">'+valHTML(q.vals[o.v], o.e)+'</button>', val:true});
    else items.push({h:'<button type="button" class="subbtn" data-sub="'+key+'" title="Vervang deze letter"><i class="lv">'+o.v+'</i></button>'+(o.e > 1 ? '<sup>'+o.e+'</sup>' : ''), val:false});
  });
  let h = sgHTML(t.s, first);
  items.forEach((it, k) => { if(k && (it.val || items[k-1].val)) h += '<span class="mop">⋅</span>'; h += it.h; });
  return '<span class="gwt">'+h+'</span>';
}
function renderGw(q, v){
  const T = parsePoly(q.expr), n = letterCount(q), done = v.sub.length === n;
  const vals = Object.keys(q.vals).map(k => mathHTML(k+' = '+q.vals[k])).join(' <span class="vanw">en</span> ');
  $R('visual').innerHTML = (q.intro ? '<div class="ctxcard">'+rich(q.intro)+'</div>' : '') +
    '<div class="visrow">' + (q.img ? picHTML(q.img, q.imgAlt || '', 'mid') : '') +
    opgaveBox(mathHTML(q.expr) + ' <span class="vanw">voor</span> ' + vals) + '</div>';
  let h = '<div class="schrift fs">';
  h += SR('', '<span class="gwline">'+T.map((t, ti) => gwTermHTML(q, t, ti, v.sub, ti === 0)).join('')+'</span>' +
    '<span class="hint gwh">'+(done ? 'Klik op een waarde om de letter weer te zien.' : 'Klik op elke letter om ze te vervangen. Klik op een waarde om terug te keren.')+'</span>', '① vervang de letters');
  if(v.tv){
    h += SR('=', done ? '<span class="hwline">'+v.tv.map((o, k) => k === 0 ? snField('tv.0', o, 'q', 'sm') : pmField('tv.'+k, o, 'sm')).join('')+'</span>'
                          : '<span class="hint">Vervang eerst alle letters: dan kan je elke term uitrekenen.</span>', '② reken elke term uit');
  }
  h += SR('=', snField('res', v.res, 'q') + (q.unit ? ' <span class="unit">'+esc(q.unit)+'</span>' : ''), v.tv ? '③ getalwaarde' : '② getalwaarde');
  $R('answer').innerHTML = h + '</div>' + FMT +
    '<div class="signhint">Typ het teken gewoon mee: <b>−6</b> of <b>+24</b>. Een breuk maak je met <b>/</b> (typ <b>2/3</b>), een kommagetal schrijf je als <b>0,5</b>.</div>';
  ui.freshSub = null;
  $R('answer').querySelectorAll('[data-sub]').forEach(b => b.onclick = () => {
    const val = getVal(q); if(val.sub.indexOf(b.dataset.sub) < 0) val.sub.push(b.dataset.sub);
    ui.freshSub = b.dataset.sub; saveAnswer(q, val); render();
  });
  $R('answer').querySelectorAll('[data-unsub]').forEach(b => b.onclick = () => {   // terug naar de letter
    const val = getVal(q), k = val.sub.indexOf(b.dataset.unsub);
    if(k >= 0) val.sub.splice(k, 1);
    ui.freshSub = null; saveAnswer(q, val); render();
  });
  bindAll(q);
}

/* =========================================================
   GETALWAARDEN IN EEN TABEL (Scratch)
========================================================= */
function scratchHTML(s){
  const pill = p => p[1] === 'var' ? '<span class="spill o">'+esc(p[0])+'</span>' : '<span class="spill w">'+esc(p[0])+'</span>';
  const e = s.expr;
  const expr = '<span class="sop"><span class="sop">'+pill(e[0])+' '+e[1]+' '+pill(e[2])+'</span> '+e[3]+' '+pill(e[4])+'</span>';
  return '<div class="scr" aria-label="Scratch-programma">' +
    '<div class="sb hat">wanneer op <span class="flag">⚑</span> wordt geklikt</div>' +
    '<div class="sb var">maak <span class="sdd">a ▾</span> <span class="spill w">'+esc(s.a)+'</span></div>' +
    '<div class="sb var">maak <span class="sdd">getalwaarde ▾</span> '+expr+'</div>' +
    '<div class="sb look">zeg <span class="sop">voeg <span class="spill w">De getalwaarde is</span> en <span class="spill o">getalwaarde</span> samen</span> <span class="spill w">2</span> sec.</div></div>';
}
function renderGwtabel(q, v){
  $R('visual').innerHTML = q.scratch ? scratchHTML(q.scratch) : '';
  $R('answer').innerHTML = '<div class="tabscroll"><table class="atab gwtab"><tr><th><i class="lv">'+esc(q.letter)+'</i></th>' + q.vals.map(x => '<td class="given">'+mathHTML(x)+'</td>').join('') + '</tr>' +
    '<tr><th>'+mathHTML(q.expr)+'</th>' + q.vals.map((x, i) => '<td>'+snField('r.'+i, v.r[i], 'q', 'sm')+'</td>').join('') + '</tr></table></div>' + FMT;
  bindAll(q);
}

/* =========================================================
   EENTERM MAAL EENTERM — getallen samen, letters samen
========================================================= */
function monoShow(f, t){
  const tf = parsePoly(f)[0], tt = parsePoly(t)[0];
  const numOnly = !(parseLett(tf.l) || []).length;
  return mathHTML(f) + '<span class="mop">⋅</span>' + (numOnly || tt.s === '−' ? mathHTML('('+t+')') : mathHTML(t));
}
function monoParts(f, t){
  const a = parsePoly(f)[0], b = parsePoly(t)[0];
  const ca = (a.s === '−' ? '−' : '') + (a.c || '1'), cb = (b.s === '−' ? '−' : '') + (b.c || '1');
  const nums = mathHTML(ca) + '<span class="mop">⋅</span>' + (cb.charAt(0) === '−' ? mathHTML('('+cb+')') : mathHTML(cb));
  const lets = (parseLett(a.l) || []).concat(parseLett(b.l) || []).map(o => lettHTML([o])).join('<span class="mop">⋅</span>');
  return {nums, lets};
}
function monoRes(o){
  if(!qOK(o.g) || !letOK(o.l)) return '';
  const g = tbArr(o.g)[0], n = tbStr(g);
  return '<span class="simpres"><span class="eqs">=</span> '+(g.s === '−' ? '<span class="sg-m">−</span>' : '') +
    (n === '1' ? '' : coefHTML(n)) + lettHTML(parseLett(tbStr(tbArr(o.l)[0]))) + '</span>';
}
function renderMono(q, v){
  $R('visual').innerHTML = '';
  $R('answer').innerHTML = q.rows.map((r, i) => {
    const P = monoParts(r.f, r.t), o = v.r[i];
    return '<div class="mrow"><div class="mopg"><span class="rl">'+letterOf(i)+'</span>'+monoShow(r.f, r.t)+'</div><div class="msteps">' +
      '<div class="mst"><span class="mstl">getallen</span>'+P.nums+'<span class="eqs">=</span>'+snField('r.'+i+'.g', o.g, 'q', 'sm')+'</div>' +
      '<div class="mst"><span class="mstl">letters</span>'+P.lets+'<span class="eqs">=</span>'+letField('r.'+i+'.l', o.l, 'sm')+'</div></div>' +
      '<div class="mres" data-mres="'+i+'">'+monoRes(o)+'</div></div>';
  }).join('') + FMT + '<div class="signhint">Staat er geen getal voor de letters, dan is het getalgedeelte 1. Een exponent zet je met het puntje rechtsboven de letter, of typ <b>²</b> (de toets onder Esc).</div>';
  bindAll(q, () => { const val = getVal(q); $R('answer').querySelectorAll('[data-mres]').forEach(el => { el.innerHTML = monoRes(val.r[Number(el.dataset.mres)]); }); });
}

/* =========================================================
   VERMENIGVULDIGTABEL
========================================================= */
function renderProdtab(q, v){
  $R('visual').innerHTML = '';
  $R('answer').innerHTML = '<div class="tabscroll"><table class="atab ptabx"><tr><th class="corner">⋅</th>'+q.cf.map(c => '<th>'+polyHTML(c)+'</th>').join('')+'</tr>' +
    q.rf.map((r, i) => '<tr><th>'+mathHTML(r)+'</th>'+q.cf.map((c, j) => '<td class="ptd"><span class="ptask">'+mathHTML(r)+'<span class="mop">⋅</span>'+mathHTML(String(c).charAt(0) === '−' ? '(' + c + ')' : c)+'<span class="eqs">=</span></span>'+trHTML('r.'+i+'.'+j, v.r[i][j], {fixed:true, compact:true, noprev:true})+'</td>').join('')+'</tr>').join('') +
    '</table></div>' + FMT + TRHINT1;
  bindAll(q);
}

/* =========================================================
   DISTRIBUTIVITEIT — boogjes trekken, producten, eindresultaat
========================================================= */
function effFactor(it){ return it.op === '−' ? (it.f.charAt(0) === '−' ? it.f.slice(1) : '−' + it.f) : it.f; }
function termPar(t){ return t.s === '−' ? PW('<span class="sg-m">−</span>'+termBody(t.c, t.l)) : termBody(t.c, t.l); }
/* kleuren per term: de boog, de lichte oppervlakte en de donkere versie zodra de boog er staat */
const DCOL  = ['#127a7f', '#b07400', '#1f78b4'];
const DAREA = ['#dff1f1', '#fff4d6', '#e2f2ff'];
const DAREAD= ['#cdbdf7', '#ffdf8a', '#b9dffa'];
function numOf(c){
  if(c === '' || c == null) return 1;
  const t = String(c).replace(',', '.');
  if(t.indexOf('/') >= 0){ const q2 = t.split('/'); return Number(q2[0]) / Number(q2[1]); }
  return Number(t) || 1;
}
function qLen(t){                                   // hoe lang tekenen we deze grootheid?
  const L = (parseLett(t.l) || []).length ? 3.2 : 1;  // een letter telt als ongeveer 3,2 eenheden
  return Math.max(0.4, numOf(t.c) * L);
}
function rectSVG(q, v){
  const it = q.items[0], T = parsePoly(it.t), y0 = 34;
  const fp = String(it.f).match(/^([0-9,\/]*)(.*)$/), fh = qLen({c:fp[1], l:fp[2]});
  const lens = T.map(qLen), tot = lens.reduce((x, y) => x + y, 0);
  const u = Math.max(15, Math.min(40, 430 / tot, 235 / fh));
  const W = lens.map(L => L * u), H = fh * u, x0 = 62;
  let x = x0, h = '';
  T.forEach((t, ti) => {
    const on = v.bg.indexOf('0.'+ti) >= 0, c = ti % 3;
    h += '<rect x="'+x+'" y="'+y0+'" width="'+W[ti]+'" height="'+H+'" fill="'+(on ? DAREAD[c] : DAREA[c])+'" stroke="#35545a" stroke-width="2"/>';
    h += '<line x1="'+(x+4)+'" y1="18" x2="'+(x+W[ti]-4)+'" y2="18" stroke="'+DCOL[c]+'" stroke-width="2" marker-start="url(#ra'+c+')" marker-end="url(#ra'+c+')"/>';
    h += '<foreignObject x="'+(x-10)+'" y="0" width="'+(W[ti]+20)+'" height="18"><div xmlns="http://www.w3.org/1999/xhtml" class="rlabel" style="color:'+DCOL[c]+'">'+termBody(t.c, t.l)+'</div></foreignObject>';
    const pr = trPrev(v.pr[0][ti]);
    h += '<foreignObject x="'+(x-6)+'" y="'+(y0 + H/2 - 20)+'" width="'+(W[ti]+12)+'" height="44"><div xmlns="http://www.w3.org/1999/xhtml" class="rarea">'+(on ? (pr || '?') : '')+'</div></foreignObject>';
    x += W[ti];
  });
  h += '<line x1="'+(x0-16)+'" y1="'+(y0+4)+'" x2="'+(x0-16)+'" y2="'+(y0+H-4)+'" stroke="#35545a" stroke-width="2" marker-start="url(#raf)" marker-end="url(#raf)"/>';
  h += '<foreignObject x="0" y="'+(y0 + H/2 - 14)+'" width="'+(x0-22)+'" height="30"><div xmlns="http://www.w3.org/1999/xhtml" class="rlabel r">'+mathHTML(it.f)+'</div></foreignObject>';
  let defs = '<defs>';
  DCOL.forEach((col, i) => { defs += '<marker id="ra'+i+'" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="'+col+'"/></marker>'; });
  defs += '<marker id="raf" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="#35545a"/></marker></defs>';
  return '<svg class="vis-svg rectsvg" viewBox="0 0 '+(x + 20)+' '+(y0 + H + 14)+'" style="max-width:'+(x + 20)+'px" aria-label="Rechthoekmodel">'+defs+h+'</svg>';
}
function needsHerl(q){ return q.items.length > 1; }      // meer dan één product: er valt nog te herleiden
function samTerms(v){ return tbArr(v.sam).filter(t => !tbEmpty(t)); }
function allProductsOK(q, v){
  let n = 0;
  const ok = q.items.every((it, pi) => it.loose || parsePoly(it.t).every((t, ti) => {
    if(v.bg.indexOf(pi+'.'+ti) < 0) return false;
    n++; return trOK(v.pr[pi][ti]);
  }));
  return ok && n > 0;
}
/* de producten (en een losse term) achter elkaar zetten als vertrekpunt voor het eindantwoord */
function distrAssemble(q, v){
  const out = [];
  q.items.forEach((it, pi) => {
    if(it.loose){ tbParse(it.loose).filter(t => !tbEmpty(t)).forEach(t => out.push(t)); return; }
    parsePoly(it.t).forEach((t, ti) => {
      (v.pr[pi][ti] || []).filter(x => !tbEmpty(x)).forEach(x => out.push(clone(x)));
    });
  });
  out.forEach((t, i) => {
    if(i === 0){ if(t.s == null) t.s = ''; }
    else if(t.s == null || t.s === '') t.s = '+';
  });
  return out.length ? out : TRV();
}
/* een ingevuld product laten doorschuiven naar de eindregel */
function flyAnswer(fromEl, toEl){
  if(!fromEl || !toEl || !fromEl.innerHTML.trim()) return;
  const a = fromEl.getBoundingClientRect(), b = toEl.getBoundingClientRect();
  if(!a.width || !b.width) return;
  const g = document.createElement('div');
  g.className = 'flyer'; g.innerHTML = fromEl.innerHTML;
  g.style.left = a.left + 'px'; g.style.top = a.top + 'px';
  document.body.appendChild(g);
  rafC(() => {
    g.style.transform = 'translate('+(b.left + 8 - a.left)+'px,'+(b.top + 4 - a.top)+'px) scale(.8)';
    g.style.opacity = '0';
  });
  setTimeoutC(() => g.remove(), 800);
}

function renderDistr(q, v){
  const it0 = q.items;
  const expr = it0.map((it, pi) => {
    if(it.loose){ return '<span class="dloose">'+parsePoly(it.loose).map((t, k) => dTerm(t, pi === 0 && k === 0)).join('')+'</span>'; }
    const T = parsePoly(it.t), enkelMin = it.op === '−' && String(it.f) === '1';   // −(a + 5): de min is de factor
    return (pi && it.op === '+' ? '<span class="sg-p bop">+</span>' : '') +
      '<button type="button" class="dfac'+(ui.dsel === pi ? ' sel' : '')+'" data-df="'+pi+'"'+(enkelMin ? ' title="−(…) betekent −1 ⋅ (…)"' : '')+'>'+(it.op === '−' ? '<span class="sg-m">−</span>' : '')+(enkelMin ? '' : mathHTML(it.f))+'</button>'+(enkelMin ? '' : '<span class="mop">⋅</span>') +
      PW(T.map((t, ti) => '<button type="button" class="dterm'+(v.bg.indexOf(pi+'.'+ti) >= 0 ? ' on' : '')+'" data-dt="'+pi+'.'+ti+'" style="--dc:'+DCOL[ti % 3]+';--da:'+DAREA[ti % 3]+'">'+dTerm(t, ti === 0)+'</button>').join(''));
  }).join('');
  $R('visual').innerHTML = '<div class="dwrap" data-r="dwrap"><div class="dexpr">'+expr+'</div></div>' +
    (ui.dhint ? '<div class="signhint warnhint center">Klik eerst op de factor voor de haakjes, daarna op een term tussen de haakjes.</div>' : '<div class="signhint center">Klik op de factor voor de haakjes en daarna op elke term tussen de haakjes: zo trek je de boogjes.</div>') +
    (q.rect ? '<div class="center">'+rectSVG(q, v)+'</div>' : '');
  let h = '<div class="schrift fs">', any = false;
  it0.forEach((it, pi) => {
    if(it.loose) return;
    const T = parsePoly(it.t), ef = effFactor(it);
    T.forEach((t, ti) => {
      if(v.bg.indexOf(pi+'.'+ti) < 0) return;
      h += SR('', '<span class="prodline" data-pw="'+pi+'.'+ti+'" style="--dc:'+DCOL[ti % 3]+'">' +
        '<span class="pfac" data-pf="'+pi+'.'+ti+'">'+mathHTML(ef)+'</span><span class="mop">⋅</span>' +
        '<span class="ptrm" data-pt="'+pi+'.'+ti+'">'+termPar(t)+'</span><span class="eqs">=</span></span>' +
        trHTML('pr.'+pi+'.'+ti, v.pr[pi][ti], {fixed:true, compact:true}), any ? '' : 'producten');
      any = true;
    });
  });
  if(!any) h += SR('', '<span class="hint">Trek eerst de boogjes in de opgave hierboven. Per boogje verschijnt hier een product.</span>', 'producten');
  const joinBtn = '<button type="button" class="ghostbtn joinbtn" data-join="1"'+(allProductsOK(q, v) ? '' : ' disabled')+
    ' title="Zet de producten hierboven onder elkaar">↓ voeg samen</button>';
  if(needsHerl(q)){
    h += SR('=', trHTML('sam', v.sam) + joinBtn, 'alle termen samen');
    const ST = samTerms(v), inner = ST.map((t, i) => tbTermHTML(t, i === 0));
    h += SR('', ST.length
      ? markerBar() + '<div class="tilerow">'+ST.map((t, i) => mkTile('mk', i, inner[i], v.mk)).join('')+'</div>' + mkGroups(v.mk, inner)
      : '<span class="hint">Voeg eerst de termen samen: hier kan je daarna de gelijksoortige eentermen kleuren.</span>',
      'gelijksoortig kleuren');
    h += SR('=', trHTML('res', v.res), 'herleid');
  } else {
    h += SR('=', trHTML('res', v.res) + joinBtn, 'eindresultaat');
  }
  $R('answer').innerHTML = h + '</div>' + FMT + TRHINT;
  const fresh = ui.freshArc; ui.freshArc = null;
  ui.afterDraw = () => {
    $R('answer').querySelectorAll('[data-pw]').forEach(pw => {
      const k = pw.dataset.pw;
      drawLinks(pw, [{a:pw.querySelector('[data-pf="'+k+'"]'), b:pw.querySelector('[data-pt="'+k+'"]'),
                      arc:true, nohead:true, color:DCOL[Number(k.split('.')[1]) % 3]}]);
    });
    const w = $R('dwrap'); if(!w) return;
    drawLinks(w, v.bg.map(k => ({a:w.querySelector('[data-df="'+k.split('.')[0]+'"]'), b:w.querySelector('[data-dt="'+k+'"]'),
      arc:true, nohead:true, color:DCOL[Number(k.split('.')[1]) % 3], fresh:k === fresh})));
  };
  rafC(ui.afterDraw);
  $R('visual').querySelectorAll('[data-df]').forEach(b => b.onclick = () => { const pi = Number(b.dataset.df); ui.dsel = ui.dsel === pi ? null : pi; ui.dhint = false; render(); });
  $R('visual').querySelectorAll('[data-dt]').forEach(b => b.onclick = () => {
    const key = b.dataset.dt, pi = Number(key.split('.')[0]), val = getVal(q), k = val.bg.indexOf(key);
    if(k >= 0){ val.bg.splice(k, 1); saveAnswer(q, val); render(); return; }
    if(ui.dsel !== pi){ ui.dhint = true; render(); return; }
    val.bg.push(key); ui.freshArc = key; ui.dhint = false; saveAnswer(q, val); render();
  });
  if(ui.flownQ !== q.id){ ui.flownQ = q.id; ui.flown = {}; }
  const jb = $R('answer').querySelector('[data-join]');
  if(jb) jb.onclick = () => {
    const val = getVal(q), doel = $R('answer').querySelector('[data-tb="'+(needsHerl(q) ? 'sam' : 'res')+'"]');
    let n = 0;
    $R('answer').querySelectorAll('[data-tb^="pr."]').forEach(el => {
      const d = n++; setTimeoutC(() => flyAnswer(el, doel), d * 160);
    });
    setTimeoutC(() => {
      const val2 = getVal(q);
      if(needsHerl(q)){ val2.sam = distrAssemble(q, val2); val2.mk = {}; }
      else val2.res = distrAssemble(q, val2);
      saveAnswer(q, val2); render();
    }, n * 160 + 380);
  };
  bindAll(q, () => {
    const val = getVal(q);
    if(q.rect){ const s2 = $R('visual').querySelector('.rectsvg'); if(s2) s2.outerHTML = rectSVG(q, val); }
    const jb2 = $R('answer').querySelector('[data-join]');
    if(jb2) jb2.disabled = !allProductsOK(q, val);
    val.bg.forEach(k => {
      const pi = Number(k.split('.')[0]), ti = Number(k.split('.')[1]);
      if(!trOK(val.pr[pi][ti]) || ui.flown[k]) return;
      ui.flown[k] = true;
      flyAnswer($R('answer').querySelector('[data-tbmath="pr.'+k+'"]'), $R('answer').querySelector('[data-tb="res"]'));
    });
  });
}

/* =========================================================
   OPPERVLAKTE — delen van een figuur
========================================================= */
function renderOpp(q, v){
  $R('visual').innerHTML = '<div class="visrow center">' + (q.img ? picHTML(q.img, q.imgAlt || '', 'mid') : '') + FIGS[q.fig].draw(v) + '</div>';
  let h = '<div class="schrift fs">';
  q.parts.forEach((p, i) => { h += SR('', '<span class="prodline">oppervlakte '+p.lab+' ('+esc(p.txt)+')<span class="eqs">=</span></span>'+trHTML('p.'+i, v.p[i], {compact:true}), i ? '' : 'delen'); });
  h += SR('', '<span class="prodline">totale oppervlakte<span class="eqs">=</span></span>'+trHTML('tot', v.tot, {compact:true}), 'samen');
  h += SR('', '<span class="prodline"><b>Besluit:</b> '+mathHTML(q.besluit)+'<span class="eqs">=</span></span>'+trHTML('bes', v.bes, {compact:true}), 'besluit');
  $R('answer').innerHTML = h + '</div>' + FMT + TRHINT;
  bindAll(q, () => { const s = $R('visual').querySelector('.figsvg'); if(s) s.outerHTML = FIGS[q.fig].draw(getVal(q)); });
}

/* =========================================================
   OMTREK — zijden aanklikken en optellen
========================================================= */
function renderOmtrek(q, v){
  const F = FIGS[q.fig];
  $R('visual').innerHTML = '<div class="center">'+F.draw(v)+'</div>';
  const labs = v.sd.map(i => F.sides[i].lab);
  let h = '<div class="schrift fs">';
  h += SR('', labs.length ? '<span class="sumline">'+mathHTML(labs.map(l => /\s/.test(l) ? '(' + l + ')' : l).join(' + '))+'</span>' + (labs.length < F.sides.length ? ' <span class="hint">… klik nog '+(F.sides.length - labs.length)+' zijde'+(F.sides.length - labs.length > 1 ? 'n' : '')+' aan</span>' : '')
                         : '<span class="hint">Klik in de figuur op elke zijde. De lengte verschijnt hier.</span>', '① zijden optellen');
  h += SR('=', trHTML('res', v.res), '② herleid');
  $R('answer').innerHTML = h + '</div>' + FMT + TRHINT;
  $R('visual').querySelectorAll('[data-side]').forEach(s => s.onclick = () => {
    const i = Number(s.getAttribute('data-side')), val = getVal(q), k = val.sd.indexOf(i);
    if(k >= 0) val.sd.splice(k, 1); else val.sd.push(i);
    saveAnswer(q, val); render();
  });
  bindAll(q);
}

/* =========================================================
   PATRONEN — tabel, woordformule, lettervorm
========================================================= */
const LAMP = '<svg viewBox="0 0 24 24" width="17" height="17" aria-hidden="true">' +
  '<path d="M9 18h6M10 21h4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" fill="none"/>' +
  '<path d="M12 2.6a6.4 6.4 0 0 0-3.6 11.7c.5.4.8.9.9 1.5l.1.7h5.2l.1-.7c.1-.6.4-1.1.9-1.5A6.4 6.4 0 0 0 12 2.6z" ' +
  'fill="#ffd24a" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>';
function renderPat(q, v){
  const P = PATS[q.fig];
  const NL = q.nletter || 'n';
  $R('visual').innerHTML = '<div class="pfigs">' + [1, 2, 3].map(n => '<div class="pfig"><div class="pnum">'+n+'</div>'+P(n, ui.patHi)+'</div>').join('') +
    '<div class="pfig dots"><div class="pnum pn3">…</div></div>' +
    '<div class="pfig"><div class="pnum"><i class="lv">'+esc(NL)+'</i></div><div class="pgen">?</div></div>' + '</div>' +
    '';
  const th = (txt, lt) => '<th>'+esc(txt)+' <span class="thlet">(<i class="lv">'+esc(lt)+'</i>)</span></th>';
  let h = '<div class="tabscroll"><table class="atab ptab"><tr>'+th(q.nlab, NL)+q.cols.map(c => '<td class="given">'+c+'</td>').join('')+'<td class="given">…</td><td class="given"><i class="lv">'+esc(NL)+'</i></td></tr>' +
    '<tr>'+th(q.qty, q.letter)+q.cols.map((c, i) => '<td>'+inp('t.'+i, v.t[i], 'nat', 'sm pt')+'</td>').join('')+'<td class="given">…</td><td class="given pn">zie ↓</td></tr></table></div>';
  if(q.wf) h += '<h3 class="sub">Woordformule: welke zin klopt?</h3>' + optList(q.wf, v.wf, 'data-wf');
  h += '<h3 class="sub">Lettervorm</h3><p class="sub sml">Schrijf '+esc(q.qty)+' (<i class="lv">'+esc(q.letter)+'</i>) in functie van '+esc(q.nlab)+' (<i class="lv">'+esc(NL)+'</i>).</p>' +
    '<div class="row"><span class="rpre">'+mathHTML(q.letter+' =')+'</span>'+trHTML('f', v.f)+'</div>';
  if(q.ask) h += '<h3 class="sub">'+rich(q.ask.lab)+'</h3><div class="row">'+snField('ask', v.ask, 'q')+' <span class="unit">'+esc(q.ask.unit)+'</span></div>';
  $R('answer').innerHTML = h + FMT + TRHINT;
  bindOpts(q, 'data-wf', (val, id) => { val.wf = Number(id); });
  bindAll(q);
}

/* =========================================================
   PIRAMIDE
========================================================= */
function renderPira(q, v){
  const cell = k => '<div class="pcell in">'+trHTML('c.'+k, v.c[k], {compact:true, noprev:true})+prevHTML('c.'+k)+'</div>';
  $R('visual').innerHTML = '';
  $R('answer').innerHTML = '<div class="pira">' +
    '<div class="prow">'+cell(2)+'</div><div class="prow">'+cell(0)+cell(1)+'</div>' +
    '<div class="prow">'+q.base.map(b => '<div class="pcell given"><span class="pgiven">'+polyHTML(b)+'</span></div>').join('')+'</div></div>' + FMT + TRHINT;
  bindAll(q);
}

/* =========================================================
   VRAAGSTUK — situatie met deelvragen
========================================================= */
function renderCtx(q, v){
  $R('visual').innerHTML = (q.img ? picHTML(q.img, q.imgAlt) : '') + (q.svg ? '<div class="center">'+SVGS[q.svg]()+'</div>' : '') +
    (q.seg ? '<div class="center">'+segABC(q.seg)+'</div>' : '');
  $R('answer').innerHTML = '<div class="ctxcard">'+rich(q.intro)+'</div>' + q.parts.map((p, i) => {
    let f;
    if(p.k === 'tr' || p.k === 'gs') f = '<div class="row">'+(p.pre ? '<span class="rpre">'+(p.prePlain ? esc(p.pre) : mathHTML(p.pre))+'</span>' : '<span class="eqs big">=</span>')+trHTML('p.'+i, v.p[i])+'</div>';
    else if(p.k === 'nf') f = '<div class="row">'+snField('p.'+i, v.p[i], 'q')+(p.unit ? ' <span class="unit">'+esc(p.unit)+'</span>' : '')+'</div>';
    else f = optList(p.opts, v.p[i], 'data-cp'+i);
    return '<div class="cpart"><div class="cplab">'+rich(p.lab)+'</div>'+f+'</div>';
  }).join('') + FMT;
  q.parts.forEach((p, i) => { if(p.k === 'kies') bindOpts(q, 'data-cp'+i, (val, id) => { val.p[i] = Number(id); }); });
  bindAll(q);
}

/* Antwoordsleutel — hoort bij de OEFENVERSIE met verbeterknop. */

/* =========================================================
   M02 — VERBETEREN (oefenversie)
   Vergelijkt het werk van de leerling met SLEUTEL en geeft per
   onderdeel terugkoppeling. Draait pas wanneer de leerling zelf
   op 'Verbeteren' klikt; tot dan ziet ze niets.
========================================================= */

/* ---------- vergelijken ---------- */
function rnd(x){ return Math.round(x * 1e6) / 1e6; }
function kNum(x){                                  // '−3/4', '0,5', '12' -> getal
  const t = String(x == null ? '' : x).replace(/\s+/g, '').replace(/,/g, '.').replace(/−/g, '-');
  if(t.indexOf('/') >= 0){ const p = t.split('/'); return Number(p[0]) / Number(p[1]); }
  return Number(t);
}
function keyNum(k){                                // sleutelwaarde ['−','2/3'] of '12'
  if(Array.isArray(k)) return (k[0] === '−' ? -1 : 1) * kNum(k[1]);
  return kNum(k);
}
function keyNumText(k){ return Array.isArray(k) ? (k[0] === '−' ? '−' : '') + k[1] : String(k); }
function canonTerm(t){                             // "x^1y^2|−3"  (lettergedeelte | coëfficiënt)
  let num = 1, den = 1, lit = null; const L = {};
  (t.toks || []).forEach(tk => {
    if(tk.k === 'n'){
      num *= kNum(tk.v);
      if(tk.d != null && tk.d !== '') den *= kNum(tk.d);
    } else if(tk.k === 'l'){
      L[tk.v] = (L[tk.v] || 0) + (tk.e || 1);
    } else lit = (lit || '') + tk.v;               // haakjes of bewerkingstekens: letterlijk
  });
  if(lit != null) return 'L:' + (t.s === '−' ? '-' : '') + tbStr(t);
  const c = (t.s === '−' ? -1 : 1) * num / den;
  if(!isFinite(c)) return 'L:?';
  return Object.keys(L).sort().map(k => k + '^' + L[k]).join('') + '|' + rnd(c);
}
function canonPoly(x){
  const arr = typeof x === 'string' ? tbParse(x) : tbArr(x);
  return arr.filter(t => !tbEmpty(t)).map(canonTerm).sort();
}
function eqPoly(a, b){
  const A = canonPoly(a), B = canonPoly(b);
  return A.length === B.length && A.every((x, i) => x === B[i]);
}
function mergePoly(x){                             // gelijksoortige termen samengenomen
  const m = {};
  canonPoly(x).forEach(s => {
    const i = s.indexOf('|');
    if(i < 0){ m[s] = (m[s] || 0) + 1; return; }
    const l = s.slice(0, i);
    m[l] = (m[l] || 0) + Number(s.slice(i + 1));
  });
  return Object.keys(m).filter(k => Math.abs(m[k]) > 1e-9).sort()
    .map(k => k + '|' + rnd(m[k])).join(' ');
}
function numOfVal(x){                              // één term zonder letters -> getal, anders null
  const a = tbArr(x).filter(t => !tbEmpty(t));
  if(a.length !== 1) return null;
  const c = canonTerm(a[0]);
  return c.indexOf('|') === 0 ? Number(c.slice(1)) : null;
}
function eqNum(stud, k){
  const a = numOfVal(stud);
  return a != null && rnd(a) === rnd(keyNum(k));
}
function eqLet(stud, k){                           // enkel het lettergedeelte
  const A = canonPoly(stud), B = canonPoly(k);
  const strip = arr => arr.map(s => s.split('|')[0]).join(' ');
  return A.length === B.length && strip(A) === strip(B);
}
function samePartition(a, b, n){                   // markeerstiften: enkel de groepering telt
  if(!n || Object.keys(b || {}).length !== n) return false;
  const grp = m => {
    const g = {};
    for(let i = 0; i < n; i++){ const c = m ? m[i] : null; if(c == null) return null; (g[c] = g[c] || []).push(i); }
    return Object.keys(g).map(k => g[k].join(',')).sort().join(' | ');
  };
  const A = grp(a), B = grp(b);
  return A != null && B != null && A === B;
}
function sameSet(a, b){
  const A = (a || []).map(String).sort(), B = (b || []).map(String).sort();
  return A.length === B.length && A.every((x, i) => x === B[i]);
}

/* ---------- tips bij een fout ---------- */
function flipTerm(s){ const i = s.indexOf('|'); return i < 0 ? s : s.slice(0, i) + '|' + rnd(-Number(s.slice(i + 1))); }
function D(code, tip){ return {code:code, tip:tip}; }
function polyDiag(stud, key, inner){
  const A = canonPoly(stud), B = canonPoly(key);
  if(!A.length) return D('F-LEEG', 'Je hebt hier niets ingevuld.');
  if(mergePoly(stud) === mergePoly(key) && A.length !== B.length)
    return D('F-HERL', 'Je termen kloppen, maar je antwoord is nog niet volledig herleid: neem de gelijksoortige eentermen samen.');
  const rest = A.slice(), mist = [];
  B.forEach(x => { const i = rest.indexOf(x); if(i >= 0) rest.splice(i, 1); else mist.push(x); });
  if(mist.length && A.length === B.length &&
     mist.every(x => { const i = rest.indexOf(flipTerm(x)); if(i >= 0){ rest.splice(i, 1); return true; } return false; }))
    return D('F-TEKEN', mist.length === 1 ? 'Eén term heeft het verkeerde teken. Kijk na welk teken die term krijgt.'
                                          : mist.length + ' termen hebben het verkeerde teken.');
  if(inner){                                       // distributiviteit: een term van tussen de haakjes staat er nog onveranderd
    const I = [].concat(inner).reduce((acc, s) => acc.concat(canonPoly(s)), []);
    if(A.some(x => B.indexOf(x) < 0 && I.indexOf(x) >= 0))
      return D('F-DISTR', 'Vermenigvuldig de factor voor de haakjes met élke term tussen de haakjes. Er staat nog een term van tussen de haakjes onveranderd in je antwoord.');
  }
  if(mist.length && mist.length < B.length)
    return D('F-DEELS', (B.length - mist.length) + ' van de ' + B.length + ' termen kloppen al. Kijk de andere nog eens na.');
  const letters = arr => arr.map(x => x.split('|')[0]).sort().join(' ');
  if(A.length === B.length && letters(A) === letters(B))
    return D('F-COEF', 'De lettergedeeltes kloppen; kijk de getallen voor de letters na.');
  const coef = arr => arr.map(x => x.split('|')[1]).sort().join(' ');
  if(A.length === B.length && coef(A) === coef(B))
    return D('F-LETTER', 'De getallen kloppen; kijk de letters en hun exponenten na.');
  if(A.length !== B.length)
    return D('F-AANTAL', 'Jij schreef ' + A.length + (A.length === 1 ? ' term' : ' termen') + ', het juiste antwoord telt er ' + B.length + '.');
  return D('F-ANDERS', 'Vergelijk term per term met het juiste antwoord.');
}
function numDiag(stud, k){
  const a = numOfVal(stud), b = keyNum(k);
  if(a == null) return D('F-LEEG', 'Hier hoort enkel een getal te staan.');
  if(rnd(a) === rnd(-b)) return D('F-TEKEN', 'De grootte klopt, maar het teken niet.');
  return D('F-REKEN', 'Reken deze stap nog eens na.');
}
function polyTip(stud, key){ return polyDiag(stud, key).tip; }

/* ---------- één onderdeel ---------- */
function VB(lab, ok, jouw, juist, tip, path, code){
  return {lab:lab, ok:!!ok, jouw:jouw || '—', juist:juist || '', tip: ok ? '' : (tip || ''),
          path:path || null, code: ok ? '' : (code || 'F-ANDERS')};
}
/* graad van elke term in de volgorde waarin de leerling ze schreef */
function graden(x){
  const arr = typeof x === 'string' ? tbParse(x) : tbArr(x);
  return arr.filter(t => !tbEmpty(t)).map(canonTerm).map(s => s.indexOf('L:') === 0 ? null :
    s.split('|')[0].split(/[a-z]/i).filter(Boolean).reduce((a, e) => a + Number(e.replace('^', '')), 0));
}
function dalend(x){ const g = graden(x); return g.every((d, i) => i === 0 || d == null || g[i-1] == null || d <= g[i-1]); }
function vbPoly(lab, stud, key, path, inner){
  if(path !== 'sam' && eqPoly(stud, key) && !dalend(stud))           // keuze leerkracht: dalende machten zijn verplicht
    return VB(lab, false, tbText(stud), tbText(tbParse(key)), 'Juist herleid, maar rangschik nog volgens dalende machten: de hoogste exponent vooraan.', path, 'F-RANG');
  const ok = eqPoly(stud, key), d = ok ? null : polyDiag(stud, key, inner);
  return VB(lab, ok, tbText(stud), tbText(tbParse(key)), ok ? '' : d.tip, path, ok ? '' : d.code);
}
function vbNum(lab, stud, key, path){
  const ok = eqNum(stud, key), d = ok ? null : numDiag(stud, key);
  return VB(lab, ok, tbText(stud), keyNumText(key), ok ? '' : d.tip, path, ok ? '' : d.code);
}
function plat(t){ return String(t == null ? '' : t).replace(/`/g, '').replace(/\^([2-6])/g, (m, e) => SUPS[e]); }

/* ---------- verbeteren per vraagtype ---------- */
function verbeter(q, v){
  const k = SLEUTEL[q.id] || {}, out = [];
  const L = i => String.fromCharCode(97 + i) + ')';
  switch(q.type){
    case 'kies': case 'fout': {
      const opts = q.options, juist = opts.filter(o => String(o.id != null ? o.id : opts.indexOf(o)) === String(k.kies))[0];
      const jouw = opts.filter(o => String(o.id != null ? o.id : opts.indexOf(o)) === String(v.choice))[0];
      out.push(VB(q.type === 'fout' ? 'Wat ging er fout?' : 'Je keuze', String(v.choice) === String(k.kies),
        plat(jouw && (jouw.text != null ? jouw.text : jouw)), plat(juist && (juist.text != null ? juist.text : juist)),
        'Lees de opgave nog eens en kijk welke uitspraak er echt bij past.', null, 'F-KEUZE'));
      if(q.type === 'fout') out.push(vbPoly('De juiste uitkomst', v.res, k.res, 'res'));
      break;
    }
    case 'sorteer':
      q.chips.forEach((c, i) => out.push(VB(plat(c), String(v.a[i]) === String(k.sorteer[i]),
        q.bins[v.a[i]], q.bins[k.sorteer[i]], 'Kijk de afspraak in de theorie na.', null, 'F-BEGRIP')));
      break;
    case 'omkring':
      q.rows.forEach((r, i) => out.push(VB(L(i), sameSet(v.c[i], k.omkring[i]),
        (v.c[i] || []).length + ' aangeduid', k.omkring[i].length + ' juiste', 'Je duidde niet precies de juiste termen aan.', null, 'F-GELIJKS')));
      break;
    case 'isgelijk':
      q.rows.forEach((r, i) => out.push(VB(plat(r[0]) + ' … ' + plat(r[1]), v.c[i] === k.isgelijk[i], v.c[i], k.isgelijk[i],
        'Herleid eerst de linkerkant en vergelijk dan pas.', null, 'F-HERL')));
      break;
    case 'bewteken':
      q.rows.forEach((r, i) => out.push(VB(Array.isArray(r) ? plat('(' + r[0] + ') … (' + r[1] + ') = ' + r[2]) : plat(r), v.c[i].s === k.pm[i], v.c[i].s, k.pm[i],
        'Probeer + en − allebei uit en vergelijk met de uitkomst rechts.', null, 'F-KEUZE')));
      break;
    case 'labels':
      q.rows.forEach((r, i) => out.push(VB(r, v.c[i] === k.labels[i], q.choices[v.c[i]], q.choices[k.labels[i]],
        'Kijk de begrippen in de woordenlijst na.', null, 'F-BEGRIP')));
      break;
    case 'koppel':
      q.left.forEach((l, i) => out.push(VB(plat(l), String(v.m[i]) === String(k.koppel[i]),
        plat(q.right[v.m[i]]), plat(q.right[k.koppel[i]]), 'Lees de situatie nog eens traag.', null, 'F-KEUZE')));
      break;
    case 'orden':
      q.parts.forEach((p, i) => out.push(VB(plat(p), sameSet(v.o[i], k.orden[i]) && v.o[i].join() === k.orden[i].join(),
        'jouw volgorde', 'dalende machten', 'Zet de term met de hoogste exponent vooraan.', null, 'F-RANG')));
      break;
    case 'kleur':
      out.push(VB('Gelijksoortige eentermen', samePartition(v.mk, k.mk, q.tiles.length), 'jouw groepen', 'de juiste groepen',
        'Gelijksoortig betekent: precies hetzelfde lettergedeelte, exponenten inbegrepen.', null, 'F-GELIJKS'));
      break;
    case 'tabel':
      q.rows.forEach((row, i) => {
        const kk = k.tabel[i], o = v.r[i];
        if(kk.t != null) out.push(vbPoly('rij ' + (i + 1) + ' · eenterm', o.t, kk.t, 'r.'+i+'.t'));
        if(kk.c != null) out.push(vbNum('rij ' + (i + 1) + ' · coëfficiënt', o.c, kk.c, 'r.'+i+'.c'));
        if(kk.l != null) out.push(VB('rij ' + (i + 1) + ' · lettergedeelte', eqLet(o.l, kk.l), tbText(o.l), tbText(tbParse(kk.l)),
          'Schrijf enkel de letters met hun exponenten.', 'r.'+i+'.l', 'F-LETTER'));
      });
      break;
    case 'rows':
      if(k.nat) q.rows.forEach((r, i) => out.push(VB(L(i), String(parseNatStr(v.r[i])) === String(k.nat[i]), v.r[i], k.nat[i],
        'De graad is de hoogste exponent — maar herleid eerst.', null, 'F-GRAAD')));
      else q.rows.forEach((r, i) => out.push(vbPoly(L(i), v.r[i], k.tr[i], 'r.'+i, r.inner)));
      break;
    case 'herlrows':
      q.rows.forEach((r, i) => {
        const kk = k.herlrows[i];
        if(kk === null) out.push(VB(plat(r), !!v.r[i].nh, v.r[i].nh ? 'kan niet herleid worden' : tbText(v.r[i].t),
          'kan niet herleid worden', 'Deze eentermen zijn niet gelijksoortig, dus je kan ze niet samennemen.', null, 'F-GELIJKS'));
        else if(v.r[i].nh) out.push(VB(plat(r), false, 'kan niet herleid worden', kk, 'Deze eentermen zijn wél gelijksoortig.', null, 'F-GELIJKS'));
        else out.push(vbPoly(plat(r), v.r[i].t, kk, 'r.'+i+'.t'));
      });
      break;
    case 'herl':
      out.push(VB('Gelijksoortig kleuren', samePartition(v.mk, k.mk, parsePoly(q.expr).length), 'jouw groepen', 'de juiste groepen',
        'Gelijksoortig betekent: precies hetzelfde lettergedeelte.', null, 'F-GELIJKS'));
      out.push(vbPoly('Herleid', v.res, k.res, 'res'));
      break;
    case 'hw': {
      const kk = k.hw;
      if(kk.tg) Object.keys(kk.tg).forEach(gi => kk.tg[gi].forEach((sg, ti) => {
        const o = v.tg[gi][ti];
        out.push(VB('tegengestelde ' + (Number(ti) + 1), o.s === sg, o.s === '' ? '+' : (o.s || '—'), sg || '+',
          'Het tegengestelde van een veelterm: elk teken keert om.', null, 'F-TEGENG'));
      }));
      const ft = flatTerms(q);
      kk.hw.forEach((sg, i) => out.push(VB('teken ' + (i + 1) + ' na de haakjes', v.hw[i].s === sg, v.hw[i].s === '' ? '+' : (v.hw[i].s || '—'), sg || '+',
        'Staat er een min voor de haakjes, dan keert elk teken binnen die haakjes om.', null, 'F-TEKEN')));
      out.push(VB('Gelijksoortig kleuren', samePartition(v.mk, kk.mk, ft.length), 'jouw groepen', 'de juiste groepen',
        'Neem enkel termen met hetzelfde lettergedeelte samen.', null, 'F-GELIJKS'));
      out.push(vbPoly('Herleid', v.res, kk.res, 'res'));
      break;
    }
    case 'gw': {
      const kk = k.gw;
      if(kk.tv) kk.tv.forEach((t, i) => out.push(vbNum('term ' + (i + 1), v.tv[i], t, 'tv.'+i)));
      out.push(vbNum('Getalwaarde', v.res, kk.res, 'res'));
      break;
    }
    case 'gwtabel':
      q.vals.forEach((x, i) => out.push(vbNum(q.letter + ' = ' + x, v.r[i], k.gwtabel[i], 'r.'+i)));
      break;
    case 'mono':
      q.rows.forEach((r, i) => {
        out.push(vbNum(L(i) + ' getallen', v.r[i].g, k.mono[i][0], 'r.'+i+'.g'));
        out.push(VB(L(i) + ' letters', eqLet(v.r[i].l, k.mono[i][1]), tbText(v.r[i].l), tbText(tbParse(k.mono[i][1])),
          'Zelfde letter maal zelfde letter: de exponenten tel je op.', 'r.'+i+'.l', 'F-EXP'));
      });
      break;
    case 'prodtab':
      q.rf.forEach((r, i) => q.cf.forEach((c, j) => out.push(vbPoly(plat(r) + ' · ' + (String(c).charAt(0) === '−' ? '(' + plat(c) + ')' : plat(c)), v.r[i][j], k.prodtab[i][j], 'r.'+i+'.'+j))));
      break;
    case 'distr': {
      const kk = k.distr, inner = q.items.filter(it => !it.loose).map(it => it.t);
      Object.keys(kk.pr).forEach(path => {
        const pi = Number(path.split('.')[0]), ti = Number(path.split('.')[1]);
        out.push(vbPoly('product ' + (out.length + 1), v.pr[pi][ti], kk.pr[path], 'pr.'+path));
      });
      if(kk.sam != null){
        out.push(vbPoly('Alle termen samen', v.sam, kk.sam, 'sam', inner));
        out.push(VB('Gelijksoortig kleuren', samePartition(v.mk, kk.mk, samTerms(v).length), 'jouw groepen', 'de juiste groepen',
          'Neem enkel termen met hetzelfde lettergedeelte samen.', null, 'F-GELIJKS'));
      }
      out.push(vbPoly('Eindresultaat', v.res, kk.res, 'res', inner));
      break;
    }
    case 'opp':
      q.parts.forEach((p, i) => out.push(vbPoly('oppervlakte ' + p.lab, v.p[i], k.opp.p[i], 'p.'+i)));
      out.push(vbPoly('Totale oppervlakte', v.tot, k.opp.tot, 'tot'));
      out.push(vbPoly('Besluit', v.bes, k.opp.bes, 'bes'));
      break;
    case 'omtrek':
      out.push(vbPoly('Omtrek', v.res, k.omtrek, 'res'));
      break;
    case 'pat': {
      const kk = k.pat;
      kk.t.forEach((x, i) => out.push(VB(plat(q.nlab) + ' = ' + q.cols[i], String(parseNatStr(v.t[i])) === String(x), v.t[i], x,
        'Tel de figuur nog eens na of gebruik de hint.', null, 'F-TABEL')));
      if(kk.wf != null) out.push(VB('Woordformule', v.wf === kk.wf, q.wf[v.wf], q.wf[kk.wf], 'Kijk hoeveel er telkens bijkomt.', null, 'F-KEUZE'));
      out.push(vbPoly('Lettervorm', v.f, kk.f, 'f'));
      if(kk.ask) out.push(vbNum(plat(q.ask.lab), v.ask, kk.ask, 'ask'));
      break;
    }
    case 'pira':
      k.pira.forEach((x, i) => out.push(vbPoly('steen ' + (i + 1), v.c[i], x, 'c.'+i)));
      break;
    case 'ctx':
      q.parts.forEach((p, i) => {
        const kk = k.ctx[i];
        if(p.k === 'tr') out.push(vbPoly(plat(p.lab), v.p[i], kk, 'p.'+i));
        else if(p.k === 'gs'){                         // zelf een gelijksoortige eenterm geven
          const A = canonPoly(v.p[i]), R = canonPoly(p.ref), anders = q.parts.some((p2, j) => j < i && p2.k === 'gs' && eqPoly(v.p[j], v.p[i]));
          const ok = A.length === 1 && A[0].indexOf('L:') !== 0 && eqLet(v.p[i], p.ref) && !eqPoly(v.p[i], p.ref) && !anders;
          out.push(VB(plat(p.lab), ok, tbText(v.p[i]), 'bv. ' + tbText(tbParse(kk)),
            A.length !== 1 ? 'Schrijf één eenterm.' : (anders ? 'Geef telkens een andere eenterm.' : (eqPoly(v.p[i], p.ref) ? 'Kies een andere coëfficiënt dan in de opgave.' : 'Neem precies hetzelfde lettergedeelte: dezelfde letters met dezelfde exponenten.')), 'p.'+i, 'F-GELIJKS'));
        }
        else if(p.k === 'nf') out.push(vbNum(plat(p.lab), v.p[i], kk, 'p.'+i));
        else out.push(VB(plat(p.lab), String(v.p[i]) === String(kk), plat(p.opts[v.p[i]]), plat(p.opts[kk]),
          'Lees de uitspraken traag na en controleer met de tekening.', null, 'F-KEUZE'));
      });
      break;
  }
  return {items:out, goed:out.filter(o => o.ok).length, totaal:out.length};
}

/* ---------- terugkoppeling tonen ---------- */
/* Waar staat elk verbeterd onderdeel in de oefening? (zelfde volgorde als verbeter) */
function vbSels(q, v, items){
  const sign = p => '[data-pmopen="'+p+'"], [data-pmset="'+p+'"]';
  const row = (cls, i, sub) => '[data-r=answer] > .'+cls+':nth-child('+(i + 1)+')' + (sub ? ' ' + sub : '');
  let perItem = null, queue = [];
  switch(q.type){
    case 'kies': case 'fout': queue = ['.opt.selected[data-opt]']; break;
    case 'sorteer':  perItem = q.chips.map((c, i) => '[data-chip="'+i+'"]'); break;
    case 'omkring':  perItem = q.rows.map((r, i) => row('okrow', i)); break;
    case 'isgelijk': perItem = q.rows.map((r, i) => row('cmprow', i, '.cmpbtns')); break;
    case 'bewteken': perItem = q.rows.map((r, i) => sign('c.'+i+'.s')); break;
    case 'labels':   perItem = q.rows.map((r, i) => row('lbrow', i, '.lbchips')); break;
    case 'koppel':   perItem = q.left.map((l, i) => '[data-kl="'+i+'"]'); break;
    case 'orden':    perItem = q.parts.map((p, i) => row('ordrow', i, '.ordans')); break;
    case 'kleur':    queue = ['.tilegrid']; break;
    case 'herlrows': perItem = q.rows.map((r, i) => v.r[i] && !v.r[i].nh ? '[data-tb="r.'+i+'.t"]' : row('hrow', i)); break;
    case 'rows':     if(q.kind === 'nat') perItem = q.rows.map((r, i) => '[data-path="r.'+i+'"]'); break;
    case 'herl': case 'distr': queue = ['.tilerow']; break;
    case 'hw': {
      const kk = (SLEUTEL[q.id] || {}).hw || {};
      if(kk.tg) Object.keys(kk.tg).forEach(gi => kk.tg[gi].forEach((s, ti) => queue.push(sign('tg.'+gi+'.'+ti+'.s'))));
      (kk.hw || []).forEach((s, i) => queue.push(sign('hw.'+i+'.s')));
      queue.push('.tilerow');
      break;
    }
    case 'pat':  q.cols.forEach((c, i) => queue.push('[data-path="t.'+i+'"]')); if(q.wf) queue.push('.opt.selected[data-wf]'); break;
    case 'ctx':  q.parts.forEach((p, i) => { if(p.k === 'kies') queue.push('.opt.selected[data-cp'+i+']'); }); break;
  }
  return items.map((o, i) => perItem ? perItem[i] : (o.path ? '[data-tb="'+o.path+'"]' : (queue.shift() || null)));
}
function vbNummers(r){ let n = 0; return r.items.map(o => o.ok ? 0 : ++n); }
function vbPanel(q){
  const r = (CUR && CUR.st.check);
  if(!r) return '';
  const alles = r.goed === r.totaal, nr = vbNummers(r);
  let h = '<div class="vb'+(alles ? ' alles' : '')+'">' +
    '<div class="vbkop"><span class="vbscore">'+r.goed+' van de '+r.totaal+' juist</span>' +
    '<span class="vbtxt">'+(alles ? 'Alles correct — knap gedaan.' : (CUR && CUR.st.sol ? 'Hieronder zie je bij elke fout het juiste antwoord.' : 'Elke fout heeft een nummer: je vindt ze met een rode kring in de oefening. Pas je antwoord aan en verbeter opnieuw, of bekijk de oplossing.'))+'</span></div>' +
    '<ul class="vblijst">';
  r.items.forEach((o, i) => {
    h += '<li class="'+(o.ok ? 'goed' : 'mis')+'">'+(o.ok ? '<span class="vbmerk">✓</span>' : '<span class="vbnr">'+nr[i]+'</span>') +
      '<span class="vbinh"><span class="vblab">'+esc(o.lab)+'</span>' +
      (o.ok ? '' : '<span class="vbreg">jij schreef <b>'+esc(o.jouw)+'</b>'+(CUR && CUR.st.sol ? ' · juist is <b>'+esc(o.juist)+'</b>' : '')+'</span>' +
              (o.tip ? '<span class="vbtip">'+esc(o.tip)+'</span>' : '')) +
      '</span></li>';
  });
  return h + '</ul></div>';
}
/* rode kringen met nummer rond de fouten in de oefening */
function drawVbRings(){
  const ws = $R('workspace');
  if(!ws) return;
  let layer = $R('vbLayer');
  if(!layer){ layer = document.createElement('div'); layer.dataset.r = 'vbLayer'; layer.className = 'vblayer'; }
  if(layer.parentNode !== ws) ws.appendChild(layer);
  layer.innerHTML = '';
  if(!CUR) return;
  const q = CUR.q, r = CUR.st.check;
  if(!r) return;
  const sels = vbSels(q, getVal(q), r.items), nr = vbNummers(r), W = ws.getBoundingClientRect();
  let html = '';
  r.items.forEach((o, i) => {
    if(o.ok || !sels[i]) return;
    let el = ws.querySelector(sels[i]);
    if(!el) return;
    el = el.closest('.sgch') || el;
    if(el.matches('[data-tb]')) el = el.querySelector('.mq-editable-field, input.tbtxt') || el;   // enkel het invulvak zelf
    let R = el.getBoundingClientRect();
    if(el.matches('.tilerow, .tilegrid, .cmpbtns, .lbchips, .ordans, .okrow') && el.children.length){   // enkel de inhoud, niet de hele breedte
      let l = 1e9, t = 1e9, r2 = -1e9, b = -1e9;
      Array.from(el.children).forEach(c => { const C = c.getBoundingClientRect(); if(!C.width) return; l = Math.min(l, C.left); t = Math.min(t, C.top); r2 = Math.max(r2, C.right); b = Math.max(b, C.bottom); });
      if(r2 > l) R = {left:l, top:t, width:r2 - l, height:b - t};
    }
    if(!R.width && !R.height) return;
    const pad = el.matches('.sgch, .sgdone') ? 2 : 6, x = R.left - W.left - pad, y = R.top - W.top - pad, w = R.width + 2 * pad, hh = R.height + 2 * pad;
    html += '<div class="vbring" style="left:'+x+'px;top:'+y+'px;width:'+w+'px;height:'+hh+'px;border-radius:'+(hh < 70 ? hh / 2 + 'px' : '20px')+'"></div>' +
            '<div class="vbnr vbpin" style="left:'+(x + w - 13)+'px;top:'+(y - 12)+'px">'+nr[i]+'</div>';
  });
  const key = q.id + '|' + r.items.length;
  layer.classList.toggle('still', layer.dataset.key === key);   // de animatie speelt enkel de eerste keer
  layer.dataset.key = key;
  layer.innerHTML = html;
}
function toonVerbetering(q){
  const a = $R('answer');
  if(!a) return;
  a.insertAdjacentHTML('beforeend', vbPanel(q));
  const r = (CUR && CUR.st.check);
  if(r) r.items.forEach(o => {
    if(!o.path) return;
    const el = a.querySelector('[data-tb="'+o.path+'"]');
    if(el) el.classList.add(o.ok ? 'tbgoed' : 'tbmis');
  });
  const L = $R('vbLayer'); if(L){ L.innerHTML = ''; if(ui.vbAnim){ L.dataset.key = ''; ui.vbAnim = false; } }
  if(r){ rafC(drawVbRings); setTimeoutC(drawVbRings, 350); }
}

/* =========================================================
   OEFENINGEN UIT DE TWEE OUDE PAGINA'S (algebraïsche uitdrukkingen · som en verschil, distributiviteit)
   Elke vraag in het formaat van de algebramotor; sleutels in SLEUTEL, hints in HINTS.
========================================================= */
const Q = {
  "ex01":{"id":"ex01","num":"1","block":"A","type":"kies","img":"muntjes","imgAlt":"Nora en Kobe kopen bonnetjes aan de bonnetjesstand van het schoolfeest","title":"Op het schoolfeest kopen Nora en Kobe elk een stapeltje met `x` bonnetjes. Kobe haalt er meteen drie drankjes mee en geeft daarvoor 3 bonnetjes af. Hoeveel bonnetjes hebben Nora en Kobe samen nog?","options":[{"id":"a","text":"`2x + 3`"},{"id":"b","text":"`x − 3`"},{"id":"c","text":"`2x − 3`"},{"id":"d","text":"`2 · (x − 3)`"}],"shortLabel":"Situatie → uitdrukking (muntjes)"},
  "ex64":{"id":"ex64","num":"64","block":"A","type":"kies","title":"Een zak met 12 mandarijnen weegt 1,8 kg. Je krijgt de vergelijking `12m = 1,8`. Wat stelt `m` voor?","options":[{"id":"a","text":"het aantal mandarijnen in de zak"},{"id":"b","text":"het gewicht van de hele zak in kg"},{"id":"c","text":"het gewicht van één mandarijn in kg"},{"id":"d","text":"het aantal zakken"}],"shortLabel":"Wat stelt m voor? (mandarijnen)"},
  "ex69":{"id":"ex69","num":"69","block":"A","type":"kies","title":"Een cinematicket kost 9 euro. Voor een groep betaal je samen 72 euro. De letter `g` stelt het aantal tickets voor. Welke vergelijking past bij deze situatie?","options":[{"id":"a","text":"`72g = 9`"},{"id":"b","text":"`9g = 72`"},{"id":"c","text":"`g + 9 = 72`"},{"id":"d","text":"`9 + 72 = g`"}],"shortLabel":"Welke vergelijking? (cinema)"},
  "ex05":{"id":"ex05","num":"5","block":"B","type":"sorteer","bins":["eenterm","veelterm"],"chips":["`12a`","`x^2 − 5x`","`−b`","`y + 1`","`−2/5p^2`","`7xy`","`m − n`","`0,4k^3`"],"title":"Is het een eenterm of een veelterm? Zet elke kaart in de juiste bak.","shortLabel":"Eenterm of niet"},
  "ex06":{"id":"ex06","num":"6","block":"B","type":"tabel","cols":[{"k":"t","h":"eenterm"},{"k":"c","h":"coëfficiënt"},{"k":"l","h":"lettergedeelte"}],"rows":[{"t":"−7p"},{"t":"3xy"},{"t":"−1,5a^4"},{"t":"2/9m^2n"},{"t":"−y^5"},{"c":"−1","l":"x^2y^3"},{"c":"8","l":"t^4"},{"c":"4,25","l":"q"},{"c":"−7/3","l":"b^2"}],"title":"Vul de tabel aan.","shortLabel":"Tabel eenterm · coëfficiënt · lettergedeelte"},
  "ex07":{"id":"ex07","num":"7","block":"B","type":"labels","svg":"benoem","choices":["coëfficiënt","veelterm","lettergedeelte","term","constante"],"rows":["I","II","III","IV","V"],"title":"Welk begrip hoort bij elk Romeins cijfer?","shortLabel":"Begrippen bij −8y + 5"},
  "ex08":{"id":"ex08","num":"8","block":"B","type":"rows","kind":"tr","rows":[{"lab":"`−1a^3`"},{"lab":"`y · 6`"},{"lab":"`3 · b · a`"},{"lab":"`z · x · 4`"},{"lab":"`−x · 5 · y`"},{"lab":"`1m + 1m^2`","note":"rangschik volgens dalende machten"}],"title":"Noteer volgens de afspraken.","shortLabel":"Afspraken noteren (6)"},
  "ex61":{"id":"ex61","num":"61","block":"B","type":"rows","kind":"tr","pre":"eenterm =","rows":[{"lab":"De coëfficiënt is 7. De letters zijn `x` en `y`. De graad in `x` is 2, de graad in `y` is 1."},{"lab":"De coëfficiënt is −3. De enige letter is `b`, met graad 4."},{"lab":"De coëfficiënt is −1. De letters zijn `m` en `n`. De graad in `m` is 1, de graad in `n` is 3."},{"lab":"De coëfficiënt is 2/5. De letters zijn `a`, `b` en `c`, elk met graad 1."},{"lab":"De coëfficiënt is 1. De letters zijn `p` en `q`. De graad in `p` is 3, de graad in `q` is 2."}],"title":"Noteer de eenterm die bij de beschrijving past. Hou rekening met de afspraken.","shortLabel":"Eenterm uit een beschrijving (5)"},
  "ex14":{"id":"ex14","num":"14","block":"B","type":"rows","kind":"nat","pre":"graad =","rows":[{"lab":"`−5x^3` in de letter `x`"},{"lab":"`y` in de letter `y`"},{"lab":"`4a^2b^3` in de letter `a`"},{"lab":"`4a^2b^3` in de letter `b`"},{"lab":"`−7xy^5` in de letter `x`"},{"lab":"`−7xy^5` in de letter `y`"}],"title":"Bepaal de graad van de eenterm in de gegeven letter.","shortLabel":"Graad van een eenterm in een letter (6)"},
  "ex16":{"id":"ex16","num":"16","block":"B","type":"kies","title":"Welke zin over `−7a^2` klopt?","options":[{"id":"a","text":"Het is een tweeterm van de tweede graad in `a`."},{"id":"b","text":"Het is een eenterm van de eerste graad in `a`."},{"id":"c","text":"Het is geen veelterm, want er staat maar één letter."},{"id":"d","text":"Het is een eenterm van de tweede graad in `a`."}],"shortLabel":"−7a²: soort en graad"},
  "ex09":{"id":"ex09","num":"9","block":"C","type":"kleur","tiles":["3ab","−5a^2b","a^2","−ab","0,5ab^2","7a^2b","−4a^2","2/3ab","ab^2","9a^2","−a^2b","−3ab^2"],"title":"Geef gelijksoortige eentermen dezelfde kleur.","shortLabel":"Gelijksoortig kleuren (12)"},
  "ex10":{"id":"ex10","num":"10","block":"C","type":"omkring","rows":[{"ref":"8t","items":["−t","3t^2","0,6t","t^3","−12t"]},{"ref":"4m^2","items":["4m","−m^2","2m^3","1/5m^2","−4m"]},{"ref":"xy^2","items":["x^2y","−3xy^2","2xy","5xy^2","−x^2y^2"]}],"title":"Omkring in elke rij alle eentermen die gelijksoortig zijn met de eerste eenterm.","shortLabel":"Gelijksoortig omkringen (3 rijen)"},
  "ex11":{"id":"ex11","num":"11","block":"C","type":"kies","title":"Waarom zijn `6x` en `6x^2` géén gelijksoortige eentermen?","options":[{"id":"a","text":"Omdat ze niet dezelfde coëfficiënt hebben."},{"id":"b","text":"Ze zijn wél gelijksoortig: ze hebben allebei de letter `x`."},{"id":"c","text":"Omdat ze niet hetzelfde lettergedeelte hebben."},{"id":"d","text":"Omdat een eenterm met een exponent nooit gelijksoortig is."}],"shortLabel":"Waarom niet gelijksoortig?"},
  "ex62":{"id":"ex62","num":"62","block":"C","type":"kies","title":"Welke eenterm is gelijksoortig met `−4a^2b`?","options":[{"id":"a","text":"`4ab^2`"},{"id":"b","text":"`−4a^2`"},{"id":"c","text":"`3/4a^2b`"},{"id":"d","text":"`−4ab`"}],"shortLabel":"Gelijksoortig met −4a²b"},
  "ex12":{"id":"ex12","num":"12","block":"C","type":"ctx","img":"stickers","imgAlt":"Twee pakjes en zeven zakjes voetbalstickers, en twee losse stickers","intro":"Op school ruilen de leerlingen voetbalstickers. In één pakje zitten `x` stickers, in één zakje zitten `y` stickers.","parts":[{"lab":"a) Welke algebraïsche uitdrukking geeft het totaal aantal stickers op de foto weer?","k":"tr"},{"lab":"b) Bereken het totaal aantal stickers als `x = 12` en `y = 5`.","k":"nf","unit":"stickers"},{"lab":"c) Je uitdrukking uit a) is een …","k":"kies","opts":["eenterm","tweeterm","drieterm"]}],"title":"Stickers ruilen","shortLabel":"Stickers: uitdrukking + getalwaarde"},
  "ex13":{"id":"ex13","num":"13","block":"D","type":"sorteer","bins":["eenterm","tweeterm","drieterm"],"chips":["`4n + 1`","`−3k^2`","`x^2 − 2x + 7`","`2l + 2b`","`ab`","`−p^2 + p − 1`","`5 − y`","`2/3t^3 + t − 4`"],"title":"Is het een eenterm, een tweeterm of een drieterm?","shortLabel":"Eenterm, tweeterm, drieterm"},
  "ex21":{"id":"ex21","num":"21","block":"F","type":"herlrows","rows":["7a + 5a","15y + y","−6z^2 + 10z^2","−3 + 3b^2","9c^3 − 12c^3","0,4t + 1,2t","4m^2 + 4m","−7d − 2d + 3d"],"title":"Herleid indien mogelijk","shortLabel":"Herleiden indien mogelijk (8)"},
  "ex65":{"id":"ex65","num":"65","block":"F","type":"herlrows","rows":["3m + 4 − m − 7","6 − 2p + 5p − 1","a − 3 + 4a + 3","−2y + 8 + 5y − 2 − 3y","7x^2 + 2 − 3x^2","5b + 1 − 4 + b"],"title":"Herleid. Let goed op de termen zonder letter.","shortLabel":"Herleiden met constante termen (6)"},
  "ex22":{"id":"ex22","num":"22","block":"F","type":"herl","expr":"9x + 4y − 2x + 5y","title":"Herleid `9x + 4y − 2x + 5y`","shortLabel":"Herleid 9x + 4y − 2x + 5y"},
  "ex23":{"id":"ex23","num":"23","block":"F","type":"herl","expr":"−3a^2 + 5a^2 + 6a + 8a − 2a^2","title":"Herleid `−3a^2 + 5a^2 + 6a + 8a − 2a^2`","shortLabel":"Herleid −3a² + 5a² + 6a + 8a − 2a²"},
  "ex24":{"id":"ex24","num":"24","block":"F","type":"herl","expr":"2k^2 + 5k − 3k^2 − k + 4","title":"Herleid `2k^2 + 5k − 3k^2 − k + 4`","shortLabel":"Herleid 2k² + 5k − 3k² − k + 4"},
  "ex25":{"id":"ex25","num":"25","block":"F","type":"herl","expr":"xy − 2x^2y + 3xy^2 + 4x^2y − xy^2 − 3xy","title":"Herleid `xy − 2x^2y + 3xy^2 + 4x^2y − xy^2 − 3xy`","shortLabel":"Herleid met drie soorten termen"},
  "ex26":{"id":"ex26","num":"26","block":"F","type":"herl","expr":"1/4x^2 − 2/3x + 3/4x^2 + x","title":"Herleid `1/4x^2 − 2/3x + 3/4x^2 + x`","shortLabel":"Herleid met breuken"},
  "ex63":{"id":"ex63","num":"63","block":"F","type":"rows","kind":"tr","pre":"… =","rows":[{"lab":"`6y + … = 10y`"},{"lab":"`−2ab^2 + … = 5ab^2`"},{"lab":"`8x − … = 3x`"},{"lab":"`… − 4m^3 = −m^3`"},{"lab":"`−x^2y + … = −6x^2y`"}],"title":"Vul aan zodat de gelijkheid klopt.","shortLabel":"Vul aan zodat het klopt (5)"},
  "ex27":{"id":"ex27","num":"27","block":"F","type":"isgelijk","rows":[["8x + 3x","11x"],["4 + 6y","10y"],["−5a + 9a","−14a"],["12m − m","11m"],["7x^2 − x^2","6"],["−9t + 4t","−5t"],["3x + 3x","6x^2"],["10p^2 − 3p^2","7p^2"]],"title":"Vul in met = of ≠","shortLabel":"= of ≠ (8)"},
  "ex28":{"id":"ex28","num":"28","block":"G","type":"gw","expr":"4t − 3","vals":{"t":"0,5"},"title":"Bereken de getalwaarde van `4t − 3` voor `t = 0,5`","shortLabel":"Getalwaarde 4t − 3 (t = 0,5)"},
  "ex66":{"id":"ex66","num":"66","block":"G","type":"gw","expr":"3a^2b","vals":{"a":"−2","b":"5"},"title":"Bereken de getalwaarde van `3a^2b` voor `a = −2` en `b = 5`","shortLabel":"Getalwaarde 3a²b (a = −2, b = 5)"},
  "ex29":{"id":"ex29","num":"29","block":"G","type":"gw","expr":"x^3 − 2x^2","vals":{"x":"−1"},"title":"Bereken de getalwaarde van `x^3 − 2x^2` voor `x = −1`","shortLabel":"Getalwaarde x³ − 2x² (x = −1)"},
  "ex30":{"id":"ex30","num":"30","block":"G","type":"gw","expr":"−x^2 + 3x − 2","vals":{"x":"−2"},"title":"Bereken de getalwaarde van `−x^2 + 3x − 2` voor `x = −2`","shortLabel":"Getalwaarde −x² + 3x − 2 (x = −2)"},
  "ex31":{"id":"ex31","num":"31","block":"G","type":"gw","expr":"−9y^2 + y","vals":{"y":"1/3"},"title":"Bereken de getalwaarde van `−9y^2 + y` voor `y = 1/3`","shortLabel":"Getalwaarde −9y² + y (y = 1/3)"},
  "ex32":{"id":"ex32","num":"32","block":"G","type":"gw","expr":"a^2 − 3ab + b^2","vals":{"a":"2","b":"−1"},"title":"Bereken de getalwaarde van `a^2 − 3ab + b^2` voor `a = 2` en `b = −1`","shortLabel":"Getalwaarde a² − 3ab + b² (a = 2, b = −1)"},
  "ex17":{"id":"ex17","num":"17","block":"E","type":"pat","fig":"hexa","qty":"aantal stoelen","letter":"s","nlab":"aantal tafels","nletter":"t","cols":[1,2,3,4,10],"title":"Zeshoekige tafels worden in een rij tegen elkaar geschoven. Aan elke vrije zijde staat een stoel.","shortLabel":"Patroon zeshoekige tafels"},
  "ex18":{"id":"ex18","num":"18","block":"E","type":"pat","fig":"luc","qty":"aantal lucifers","letter":"l","nlab":"nummer figuur","nletter":"n","cols":[1,2,3,4,10],"ask":{"lab":"Hoeveel lucifers heb je nodig voor figuur 50?","unit":"lucifers"},"title":"Met lucifers leg je een rij vierkantjes.","shortLabel":"Patroon lucifers"},
  "ex19":{"id":"ex19","num":"19","block":"E","type":"pat","fig":"lvorm","qty":"aantal blokjes","letter":"b","nlab":"nummer figuur","nletter":"n","cols":[1,2,3,4,10],"ask":{"lab":"Hoeveel blokjes telt figuur 100?","unit":"blokjes"},"title":"Met blokjes bouw je een L-vorm die telkens groter wordt.","shortLabel":"Patroon L-vorm"},
  "ex56":{"id":"ex56","num":"56","block":"V","type":"omtrek","fig":"tent","title":"Op een festival zet je een tentje op. Druk de omtrek van de voorkant uit met een veelterm. Klik eerst elke zijde aan.","shortLabel":"Omtrek festivaltent"},
  "ex67":{"id":"ex67","num":"67","block":"V","type":"omtrek","fig":"para","title":"Druk de omtrek van het parallellogram uit met een veelterm. Klik eerst elke zijde aan.","shortLabel":"Omtrek parallellogram"},
  "ex68":{"id":"ex68","num":"68","block":"V","type":"omtrek","fig":"vierkant","title":"Druk de omtrek van het vierkant uit met een eenterm. Klik eerst elke zijde aan.","shortLabel":"Omtrek vierkant"},
  "ex58":{"id":"ex58","num":"58","block":"X","type":"fout","who":"Jonas","work":"5x + 3x = 8x^2","options":[{"id":"a","text":"Niets, de berekening is juist."},{"id":"b","text":"`5x` en `3x` zijn niet gelijksoortig, dus je kan ze niet optellen."},{"id":"c","text":"Hij moest de coëfficiënten vermenigvuldigen."},{"id":"d","text":"Je telt de coëfficiënten op, maar het lettergedeelte blijft hetzelfde."}],"title":"Jonas maakte een fout. Kan jij ze vinden?","shortLabel":"Foutenjager 5x + 3x"},
  "sv01":{"id":"sv01","num":"1","block":"S","type":"hw","g":[{"t":"3x + 2"},{"op":"+","t":"5x − 7"}],"title":"Bereken de som en herleid.","shortLabel":"Som (3x + 2) + (5x − 7)"},
  "sv02":{"id":"sv02","num":"2","block":"S","type":"hw","g":[{"t":"5a^2 − 2a + 3"},{"op":"+","t":"−2a^2 + 6a − 1"}],"title":"Bereken de som en herleid.","shortLabel":"Som (5a² − 2a + 3) + (−2a² + 6a − 1)"},
  "sv03":{"id":"sv03","num":"3","block":"S","type":"omtrek","fig":"driehoek","title":"Druk de omtrek van de driehoek uit met een veelterm. Klik eerst elke zijde aan.","shortLabel":"Omtrek driehoek: som van drie veeltermen"},
  "sv04":{"id":"sv04","num":"4","block":"V","type":"rows","kind":"tr","rows":[{"lab":"tegengestelde van `3x − 5`","pre":"`−(3x − 5)` ="},{"lab":"tegengestelde van `−a^2 + 4a`","pre":"`−(−a^2 + 4a)` ="},{"lab":"tegengestelde van `2y^2 − y + 7`","pre":"`−(2y^2 − y + 7)` ="},{"lab":"tegengestelde van `−m + 1`","pre":"`−(−m + 1)` ="}],"title":"Geef het tegengestelde van elke veelterm: werk de haakjes weg.","shortLabel":"Tegengestelde van een veelterm (4)"},
  "sv05":{"id":"sv05","num":"5","block":"V","type":"rows","kind":"tr","rows":[{"lab":"`−(4x − 3)`"},{"lab":"`+(2a − 5)`"},{"lab":"`−(−x^2 + 2x − 1)`"},{"lab":"`−(−6 + y)`"},{"lab":"`−(3m^2 − m)`"}],"title":"Werk de haakjes weg. Let goed op het teken voor de haakjes.","shortLabel":"Haakjes weg met + of − ervoor (5)"},
  "sv06":{"id":"sv06","num":"6","block":"V","type":"hw","g":[{"t":"6x + 4"},{"op":"−","t":"2x + 9"}],"title":"Bereken het verschil en herleid.","shortLabel":"Verschil (6x + 4) − (2x + 9)"},
  "sv07":{"id":"sv07","num":"7","block":"V","type":"hw","g":[{"t":"3p^2 − 2p"},{"op":"−","t":"−p^2 + 5p − 4"}],"title":"Bereken het verschil en herleid.","shortLabel":"Verschil (3p² − 2p) − (−p² + 5p − 4)"},
  "sv08":{"id":"sv08","num":"8","block":"V","type":"hw","kort":true,"g":[{"t":"5y^2 + 3y − 2"},{"op":"−","t":"2y^2 − y + 6"}],"title":"Werk de haakjes weg en herleid.","shortLabel":"Verschil (5y² + 3y − 2) − (2y² − y + 6)"},
  "sv09":{"id":"sv09","num":"9","block":"V","type":"hw","kort":true,"g":[{"t":"a^2 − 4"},{"op":"+","t":"3a − 1"},{"op":"−","t":"2a^2 + a − 5"}],"title":"Werk de haakjes weg en herleid.","shortLabel":"Drie veeltermen: som en verschil"},
  "sv10":{"id":"sv10","num":"10","block":"V","type":"bewteken","rows":[["3x^2 + 4x","−x^2 + 2x","2x^2 + 6x"],["5a − 2","−a + 3","6a − 5"],["2y^2 − y","y^2 − 4y","y^2 + 3y"],["−4m + 7","−2m − 3","−6m + 4"],["x − 1","−x + 1","2x − 2"]],"title":"Vul het juiste bewerkingsteken in: + of −.","shortLabel":"Bewerkingsteken + of − (5)"},
  "sv11":{"id":"sv11","num":"11","block":"V","type":"koppel","left":["`(2x + 3) − (x − 1)`","`(2x + 3) + (x − 1)`","`(2x − 3) − (x + 1)`","`−(2x + 3) − (x − 1)`"],"right":["`x + 2`","`−3x − 2`","`x + 4`","`3x + 2`","`−3x + 4`","`x − 4`"],"title":"Welke uitkomst hoort bij welke opgave?","shortLabel":"Koppel opgave en uitkomst"},
  "sv12":{"id":"sv12","num":"12","block":"M","type":"mono","rows":[{"f":"3x","t":"2x"},{"f":"−x","t":"4x"},{"f":"2a","t":"−5"},{"f":"−3y","t":"−2y^2"},{"f":"4p","t":"3p^2"},{"f":"−2x","t":"7"}],"title":"Vermenigvuldig de eentermen.","shortLabel":"Eenterm maal eenterm (6)"},
  "sv13":{"id":"sv13","num":"13","block":"M","type":"prodtab","rf":["4","−2x","3x^2"],"cf":["5x","−3","x^2"],"title":"Vul de vermenigvuldigtabel aan.","shortLabel":"Vermenigvuldigtabel eentermen"},
  "sv14":{"id":"sv14","num":"14","block":"D","type":"distr","rect":true,"items":[{"f":"3","t":"x + 4"}],"title":"Werk de haakjes weg: `3 · (x + 4)`","shortLabel":"3 · (x + 4) met rechthoek"},
  "sv15":{"id":"sv15","num":"15","block":"D","type":"distr","items":[{"f":"−2","t":"3a − 4"}],"title":"Werk de haakjes weg: `−2 · (3a − 4)`","shortLabel":"−2 · (3a − 4)"},
  "sv16":{"id":"sv16","num":"16","block":"D","type":"distr","items":[{"f":"2x","t":"x − 5"}],"title":"Werk de haakjes weg: `2x · (x − 5)`","shortLabel":"2x · (x − 5)"},
  "sv17":{"id":"sv17","num":"17","block":"D","type":"distr","items":[{"f":"−a","t":"−3a + 2"}],"title":"Werk de haakjes weg: `−a · (−3a + 2)`","shortLabel":"−a · (−3a + 2)"},
  "sv18":{"id":"sv18","num":"18","block":"D","type":"distr","items":[{"f":"−4","t":"y^2 − 2y + 3"}],"title":"Werk de haakjes weg: `−4 · (y^2 − 2y + 3)`","shortLabel":"−4 · (y² − 2y + 3)"},
  "sv19":{"id":"sv19","num":"19","block":"D","type":"distr","items":[{"f":"0,5","t":"8x^2 − 6x + 2"}],"title":"Werk de haakjes weg: `0,5 · (8x^2 − 6x + 2)`","shortLabel":"0,5 · (8x² − 6x + 2)"},
  "sv20":{"id":"sv20","num":"20","block":"D","type":"rows","kind":"tr","rows":[{"lab":"`6 · (2x − 3)`","inner":"2x − 3","dist":{"f":"6","t":"2x − 3"}},{"lab":"`−3 · (a^2 − 4a + 2)`","inner":"a^2 − 4a + 2","dist":{"f":"−3","t":"a^2 − 4a + 2"}},{"lab":"`4x · (3x − 2)`","inner":"3x − 2","dist":{"f":"4x","t":"3x − 2"}},{"lab":"`−2y · (−y + 6)`","inner":"−y + 6","dist":{"f":"−2y","t":"−y + 6"}},{"lab":"`0,5 · (4p^2 − 10p + 8)`","inner":"4p^2 − 10p + 8","dist":{"f":"0,5","t":"4p^2 − 10p + 8"}},{"lab":"`(x + 7) · 3`","inner":"x + 7","dist":{"f":"3","t":"x + 7","after":true}}],"instr":"Werk de haakjes weg. Wil je een tussenstap? Klik op de factor en daarna op elke term tussen de haakjes: de boogjes en de tussenstap verschijnen.","title":"Werk de haakjes weg.","shortLabel":"Haakjes weg: distributiviteit (6)"},
  "sv21":{"id":"sv21","num":"21","block":"D","type":"isgelijk","rows":[["3 · (x + 2)","3x + 2"],["−2 · (a − 5)","−2a + 10"],["x · (x + 4)","x^2 + 4x"],["−(y − 3)","−y − 3"],["4 · (2m − 1)","8m − 4"],["2a · (3a + 1)","6a + 2a"],["0,5 · (6x − 2)","3x − 1"],["−x · (x − 1)","−x^2 + x"]],"title":"Vul in met = of ≠","shortLabel":"= of ≠ bij distributiviteit (8)"},
  "sv22":{"id":"sv22","num":"22","block":"H","type":"distr","items":[{"f":"2","t":"3x − 1"},{"op":"+","f":"4","t":"x + 2"}],"title":"Werk de haakjes weg en herleid: `2 · (3x − 1) + 4 · (x + 2)`","shortLabel":"2 · (3x − 1) + 4 · (x + 2)"},
  "sv23":{"id":"sv23","num":"23","block":"H","type":"distr","items":[{"f":"4","t":"3a − 2"},{"op":"−","f":"1","t":"a + 5"}],"title":"Werk de haakjes weg en herleid: `4 · (3a − 2) − (a + 5)`","shortLabel":"4 · (3a − 2) − (a + 5)"},
  "sv24":{"id":"sv24","num":"24","block":"H","type":"distr","items":[{"f":"5","t":"x − 2"},{"op":"−","f":"3","t":"2x − 4"}],"title":"Werk de haakjes weg en herleid: `5 · (x − 2) − 3 · (2x − 4)`","shortLabel":"5 · (x − 2) − 3 · (2x − 4)"},
  "sv25":{"id":"sv25","num":"25","block":"H","type":"distr","items":[{"loose":"7x"},{"op":"+","f":"2","t":"x − 3"}],"title":"Werk de haakjes weg en herleid: `7x + 2 · (x − 3)`","shortLabel":"7x + 2 · (x − 3)"},
  "sv26":{"id":"sv26","num":"26","block":"H","type":"distr","items":[{"f":"x","t":"x + 3"},{"op":"−","f":"2","t":"x^2 − x"}],"title":"Werk de haakjes weg en herleid: `x · (x + 3) − 2 · (x^2 − x)`","shortLabel":"x · (x + 3) − 2 · (x² − x)"},
  "sv27":{"id":"sv27","num":"27","block":"T","type":"ctx","seg":{"ab":"2x + 4","bc":null,"ac":"7x − 1","fB":0.4},"intro":"Het punt B ligt op het lijnstuk [AC]. Je kent |AB| en |AC|.","parts":[{"lab":"a) Hoe bereken je |BC|?","k":"kies","opts":["|AB| + |AC|","|AC| − |AB|","|AB| − |AC|"]},{"lab":"b) Bepaal |BC| als veelterm in `x`. Werk de haakjes weg en herleid.","k":"tr","pre":"|BC| =","prePlain":true},{"lab":"c) Hoe lang is [BC] als `x = 4`?","k":"nf"}],"title":"Lijnstuk: bepaal |BC|","shortLabel":"Lijnstuk: |BC| = |AC| − |AB|"},
  "sv28":{"id":"sv28","num":"28","block":"T","type":"ctx","seg":{"ab":null,"bc":"4a − 3","ac":"9a + 2","fB":0.5},"intro":"Het punt B ligt op het lijnstuk [AC]. Je kent |BC| en |AC|.","parts":[{"lab":"a) Hoe bereken je |AB|?","k":"kies","opts":["|AC| + |BC|","|BC| − |AC|","|AC| − |BC|"]},{"lab":"b) Bepaal |AB| als veelterm in `a`. Werk de haakjes weg en herleid.","k":"tr","pre":"|AB| =","prePlain":true}],"title":"Lijnstuk: bepaal |AB|","shortLabel":"Lijnstuk: |AB| = |AC| − |BC|"},
  "sv29":{"id":"sv29","num":"29","block":"T","type":"omtrek","fig":"rechthoek","title":"Een rechthoek heeft breedte `x` en lengte `x + 3`. Stel een veelterm op voor de omtrek. Klik eerst elke zijde aan.","shortLabel":"Omtrek rechthoek x bij x + 3"},
  "sv30":{"id":"sv30","num":"30","block":"T","type":"distr","rect":true,"items":[{"f":"x","t":"x + 3"}],"title":"Dezelfde rechthoek: stel een veelterm op voor de oppervlakte `x · (x + 3)`.","shortLabel":"Oppervlakte rechthoek x · (x + 3)"},
  "sv31":{"id":"sv31","num":"31","block":"T","type":"opp","fig":"mat","besluit":"x · (3 + x)","parts":[{"lab":"①","txt":"3 bij x"},{"lab":"②","txt":"x bij x"}],"title":"Een sportmat bestaat uit twee delen. Druk de oppervlakte uit met een veelterm.","shortLabel":"Oppervlakte sportmat (2 delen)"},
  "sv32":{"id":"sv32","num":"32","block":"T","type":"ctx","svg":"rechthoek2","intro":"Een rechthoek heeft breedte `2a` en lengte `3a − 1`.","parts":[{"lab":"a) Stel een veelterm op voor de omtrek. Werk de haakjes weg en herleid.","k":"tr","pre":"omtrek =","prePlain":true},{"lab":"b) Stel een veelterm op voor de oppervlakte. Werk de haakjes weg.","k":"tr","pre":"oppervlakte =","prePlain":true}],"title":"Omtrek en oppervlakte van een rechthoek","shortLabel":"Rechthoek 2a bij 3a − 1"},
  "sv33":{"id":"sv33","num":"33","block":"X","type":"fout","who":"Lotte","work":"(5x + 2) − (3x − 4) = 2x − 2","options":[{"id":"a","text":"Niets, de berekening is juist."},{"id":"b","text":"Bij een min voor de haakjes verander je enkel het teken van de eerste term."},{"id":"c","text":"Ze veranderde het teken van `−4` niet. Een min voor de haakjes verandert het teken van élke term."},{"id":"d","text":"`5x` en `3x` zijn niet gelijksoortig, dus je kan ze niet aftrekken."}],"title":"Lotte maakte een fout. Kan jij ze vinden?","shortLabel":"Foutenjager (5x + 2) − (3x − 4)"},
  "sv34":{"id":"sv34","num":"34","block":"X","type":"fout","who":"Milan","work":"−3 · (2a − 5) = −6a − 15","options":[{"id":"a","text":"Niets, de berekening is juist."},{"id":"b","text":"`−3 · (−5)` is `+15`: min maal min is plus."},{"id":"c","text":"Hij moest `−3` enkel met `2a` vermenigvuldigen."},{"id":"d","text":"Hij moest `−3` en `2a` optellen."}],"title":"Milan maakte een fout. Kan jij ze vinden?","shortLabel":"Foutenjager −3 · (2a − 5)"},
  "sv35":{"id":"sv35","num":"35","block":"X","type":"fout","who":"Sara","work":"2x · (x + 4) = 2x^2 + 4","options":[{"id":"a","text":"Niets, de berekening is juist."},{"id":"b","text":"`2x · x` is `2x`, niet `2x^2`."},{"id":"c","text":"Ze vermenigvuldigde `2x` niet met de tweede term `4`."},{"id":"d","text":"Ze moest de haakjes gewoon weglaten."}],"title":"Sara maakte een fout. Kan jij ze vinden?","shortLabel":"Foutenjager 2x · (x + 4)"},
  "sv36":{"id":"sv36","num":"36","block":"X","type":"fout","who":"Wout","work":"4x · (3x − 1) = 12x − 4x","options":[{"id":"a","text":"Niets, de berekening is juist."},{"id":"b","text":"Hij moest `4x` en `3x` optellen."},{"id":"c","text":"`4x · (−1)` is `+4x`."},{"id":"d","text":"`4x · 3x = 12x^2`: zelfde letter maal zelfde letter, dan tel je de exponenten op."}],"title":"Wout maakte een fout. Kan jij ze vinden?","shortLabel":"Foutenjager 4x · (3x − 1)"}
};
const SLEUTEL = {
  "ex01":{"kies":"c"},
  "ex05":{"sorteer":[0,1,0,1,0,0,1,0]},
  "ex06":{"tabel":[{"c":"−7","l":"p"},{"c":"3","l":"xy"},{"c":"−1,5","l":"a4"},{"c":"2/9","l":"m2n"},{"c":"−1","l":"y5"},{"t":"−x2y3"},{"t":"8t4"},{"t":"4,25q"},{"t":"−7/3b2"}]},
  "ex07":{"labels":[3,2,0,4,1]},
  "ex08":{"tr":["−a3","6y","3ab","4xz","−5xy","m2 + m"]},
  "ex09":{"mk":{"0":0,"1":1,"2":2,"3":0,"4":3,"5":1,"6":2,"7":0,"8":3,"9":2,"10":1,"11":3}},
  "ex10":{"omkring":[[0,2,4],[1,3],[1,3]]},
  "ex11":{"kies":"c"},
  "ex12":{"ctx":["2x + 7y + 2",["","61"],2]},
  "ex13":{"sorteer":[1,0,2,1,0,2,1,2]},
  "ex14":{"nat":["3","1","2","3","1","5"]},
  "ex16":{"kies":"d"},
  "ex17":{"pat":{"t":["6","10","14","18","42"],"f":"4t + 2"}},
  "ex18":{"pat":{"t":["4","7","10","13","31"],"f":"3n + 1","ask":["","151"]}},
  "ex19":{"pat":{"t":["3","5","7","9","21"],"f":"2n + 1","ask":["","201"]}},
  "ex21":{"herlrows":["12a","16y","4z2",null,"−3c3","1,6t",null,"−6d"]},
  "ex22":{"mk":{"0":0,"1":1,"2":0,"3":1},"res":"7x + 9y"},
  "ex23":{"mk":{"0":0,"1":0,"2":1,"3":1,"4":0},"res":"14a"},
  "ex24":{"mk":{"0":0,"1":1,"2":0,"3":1,"4":2},"res":"−k2 + 4k + 4"},
  "ex25":{"mk":{"0":0,"1":1,"2":2,"3":1,"4":2,"5":0},"res":"2x2y + 2xy2 − 2xy"},
  "ex26":{"mk":{"0":0,"1":1,"2":0,"3":1},"res":"x2 + 1/3x"},
  "ex27":{"isgelijk":["=","≠","≠","=","≠","=","≠","="]},
  "ex28":{"gw":{"tv":[["","2"],["−","3"]],"res":["−","1"]}},
  "ex29":{"gw":{"tv":[["−","1"],["−","2"]],"res":["−","3"]}},
  "ex30":{"gw":{"tv":[["−","4"],["−","6"],["−","2"]],"res":["−","12"]}},
  "ex31":{"gw":{"tv":[["−","1"],["+","1/3"]],"res":["−","2/3"]}},
  "ex32":{"gw":{"tv":[["","4"],["+","6"],["+","1"]],"res":["","11"]}},
  "ex56":{"omtrek":"7a + 2b"},
  "ex58":{"kies":"d","res":"8x"},
  "ex61":{"tr":["7x2y","−3b4","−mn3","2/5abc","p3q2"]},
  "ex62":{"kies":"c"},
  "ex63":{"tr":["4y","7ab2","5x","3m3","−5x2y"]},
  "ex64":{"kies":"c"},
  "ex65":{"herlrows":["2m − 3","3p + 5","5a","6","4x2 + 2","6b − 3"]},
  "ex66":{"gw":{"res":["","60"]}},
  "ex67":{"omtrek":"8a + 3b"},
  "ex68":{"omtrek":"10y"},
  "ex69":{"kies":"b"},
  "sv01":{"hw":{"hw":["","+","+","−"],"mk":{"0":0,"1":1,"2":0,"3":1},"res":"8x − 5"}},
  "sv02":{"hw":{"hw":["","−","+","−","+","−"],"mk":{"0":0,"1":1,"2":2,"3":0,"4":1,"5":2},"res":"3a2 + 4a + 2"}},
  "sv03":{"omtrek":"6x + 3"},
  "sv04":{"tr":["−3x + 5","a2 − 4a","−2y2 + y − 7","m − 1"]},
  "sv05":{"tr":["−4x + 3","2a − 5","x2 − 2x + 1","−y + 6","−3m2 + m"]},
  "sv06":{"hw":{"tg":{"1":["−","−"]},"hw":["","+","−","−"],"mk":{"0":0,"1":1,"2":0,"3":1},"res":"4x − 5"}},
  "sv07":{"hw":{"tg":{"1":["","−","+"]},"hw":["","−","+","−","+"],"mk":{"0":0,"1":1,"2":0,"3":1,"4":2},"res":"4p2 − 7p + 4"}},
  "sv08":{"hw":{"hw":["","+","−","−","+","−"],"mk":{"0":0,"1":1,"2":2,"3":0,"4":1,"5":2},"res":"3y2 + 4y − 8"}},
  "sv09":{"hw":{"hw":["","−","+","−","−","−","+"],"mk":{"0":0,"1":2,"2":1,"3":2,"4":0,"5":1,"6":2},"res":"−a2 + 2a"}},
  "sv10":{"pm":["+","−","−","+","−"]},
  "sv11":{"koppel":[2,3,5,1]},
  "sv12":{"mono":[["6","x2"],["−4","x2"],["−10","a"],["6","y3"],["12","p3"],["−14","x"]]},
  "sv13":{"prodtab":[["20x","−12","4x2"],["−10x2","6x","−2x3"],["15x3","−9x2","3x4"]]},
  "sv14":{"distr":{"pr":{"0.0":"3x","0.1":"12"},"res":"3x + 12"}},
  "sv15":{"distr":{"pr":{"0.0":"−6a","0.1":"8"},"res":"−6a + 8"}},
  "sv16":{"distr":{"pr":{"0.0":"2x2","0.1":"−10x"},"res":"2x2 − 10x"}},
  "sv17":{"distr":{"pr":{"0.0":"3a2","0.1":"−2a"},"res":"3a2 − 2a"}},
  "sv18":{"distr":{"pr":{"0.0":"−4y2","0.1":"8y","0.2":"−12"},"res":"−4y2 + 8y − 12"}},
  "sv19":{"distr":{"pr":{"0.0":"4x2","0.1":"−3x","0.2":"1"},"res":"4x2 − 3x + 1"}},
  "sv20":{"tr":["12x − 18","−3a2 + 12a − 6","12x2 − 8x","2y2 − 12y","2p2 − 5p + 4","3x + 21"]},
  "sv21":{"isgelijk":["≠","=","=","≠","=","≠","=","="]},
  "sv22":{"distr":{"pr":{"0.0":"6x","0.1":"−2","1.0":"4x","1.1":"8"},"sam":"6x − 2 + 4x + 8","mk":{"0":0,"1":1,"2":0,"3":1},"res":"10x + 6"}},
  "sv23":{"distr":{"pr":{"0.0":"12a","0.1":"−8","1.0":"−a","1.1":"−5"},"sam":"12a − 8 − a − 5","mk":{"0":0,"1":1,"2":0,"3":1},"res":"11a − 13"}},
  "sv24":{"distr":{"pr":{"0.0":"5x","0.1":"−10","1.0":"−6x","1.1":"12"},"sam":"5x − 10 − 6x + 12","mk":{"0":0,"1":1,"2":0,"3":1},"res":"−x + 2"}},
  "sv25":{"distr":{"pr":{"1.0":"2x","1.1":"−6"},"sam":"7x + 2x − 6","mk":{"0":0,"1":0,"2":1},"res":"9x − 6"}},
  "sv26":{"distr":{"pr":{"0.0":"x2","0.1":"3x","1.0":"−2x2","1.1":"2x"},"sam":"x2 + 3x − 2x2 + 2x","mk":{"0":0,"1":1,"2":0,"3":1},"res":"−x2 + 5x"}},
  "sv27":{"ctx":[1,"5x − 5",["","15"]]},
  "sv28":{"ctx":[2,"5a + 5"]},
  "sv29":{"omtrek":"4x + 6"},
  "sv30":{"distr":{"pr":{"0.0":"x2","0.1":"3x"},"res":"x2 + 3x"}},
  "sv31":{"opp":{"p":["3x","x2"],"tot":"x2 + 3x","bes":"x2 + 3x"}},
  "sv32":{"ctx":["10a − 2","6a2 − 2a"]},
  "sv33":{"kies":"c","res":"2x + 6"},
  "sv34":{"kies":"b","res":"−6a + 15"},
  "sv35":{"kies":"c","res":"2x2 + 8x"},
  "sv36":{"kies":"d","res":"12x2 − 4x"}
};
const HINTS = {
  "ex01":"Hoeveel bonnetjes hebben Nora en Kobe samen vóór Kobe iets afgeeft? Trek daarna af wat Kobe afgeeft.",
  "ex64":"`12 · m` is het gewicht van de hele zak. Wat is dan het gewicht dat maar één keer in de zak zit?",
  "ex69":"Per ticket betaal je 9 euro. Voor `g` tickets betaal je dus `9 · g` euro. Dat bedrag is gelijk aan wat je in totaal betaalt.",
  "ex05":"Een eenterm is een getal maal letters. Staat er een + of een − tussen twee delen, dan heb je meer dan één term. Een min helemaal vooraan (zoals `−b`) mag wel: dat is het teken van de coëfficiënt.",
  "ex06":"De coëfficiënt is het getal vooraan, met het teken erbij. Staat er geen getal, dan is de coëfficiënt 1. Staat er enkel een min, dan is ze −1. Het lettergedeelte zijn de letters met hun exponenten, zonder getal en zonder teken.",
  "ex07":"Een term is één deel van een som. Een constante is een term zonder letter. De coëfficiënt is het getal voor de letters, het lettergedeelte zijn de letters zelf. De hele uitdrukking is een veelterm.",
  "ex08":"De afspraken: eerst de coëfficiënt, daarna de letters in alfabetische volgorde, zonder maalteken. De coëfficiënt 1 schrijf je niet: `1a^3 = a^3` en `−1x = −x`. Staat dezelfde letter meer dan één keer, gebruik dan een exponent: `x · x = x^2`.",
  "ex61":"Begin met de coëfficiënt. Zet daarna de letters in alfabetische volgorde, met de graad als exponent. Graad 1 schrijf je niet. Is de coëfficiënt 1, dan schrijf je ze niet; is ze −1, dan schrijf je enkel een min.",
  "ex14":"De graad in een letter is de exponent van die letter. Staat er geen exponent bij de letter, dan is de graad 1.",
  "ex16":"Tel eerst het aantal termen: één term is een eenterm. De graad in `a` is de exponent van `a`.",
  "ex09":"Gelijksoortig betekent: precies hetzelfde lettergedeelte, met dezelfde exponenten. `ab` en `ab^2` zijn dus niet gelijksoortig. Het getal ervoor mag wel verschillen.",
  "ex10":"Kijk enkel naar het lettergedeelte en vergelijk het met dat van de eerste eenterm: dezelfde letters én dezelfde exponenten. Het getal ervoor maakt niet uit.",
  "ex11":"Schrijf het lettergedeelte van beide eentermen op: `x` en `x^2`. Zijn die hetzelfde?",
  "ex62":"Het lettergedeelte van `−4a^2b` is `a^2b`. Zoek de eenterm met precies dat lettergedeelte. Het getal ervoor mag anders zijn.",
  "ex12":"a) Tel apart: hoeveel pakjes (`x`), hoeveel zakjes (`y`) en hoeveel losse stickers. b) Vervang `x` door 12 en `y` door 5 en reken uit. c) Tel de termen van je uitdrukking.",
  "ex13":"Termen worden gescheiden door een + of een −. Tel ze: 1 term is een eenterm, 2 termen een tweeterm, 3 termen een drieterm.",
  "ex21":"Enkel gelijksoortige eentermen kan je samennemen: tel de coëfficiënten op, het lettergedeelte blijft hetzelfde. Zijn de lettergedeeltes verschillend, dan kan je niet herleiden.",
  "ex65":"Neem de termen met dezelfde letter samen. Tel daarna de getallen zonder letter apart samen. Het teken vóór een term hoort bij die term.",
  "ex22":"Geef termen met hetzelfde lettergedeelte dezelfde kleur. Tel per kleur de coëfficiënten op, met het teken dat ervoor staat. Het lettergedeelte blijft hetzelfde.",
  "ex23":"Let op de exponenten: `a^2` en `a` zijn niet gelijksoortig. Kleur ze met een andere kleur en tel per kleur de coëfficiënten op.",
  "ex24":"Er zijn drie soorten termen: met `k^2`, met `k` en zonder letter. Neem elke soort apart samen. Staat er geen getal voor `k`, dan is de coëfficiënt 1.",
  "ex25":"`x^2y`, `xy^2` en `xy` zijn drie verschillende lettergedeeltes. Kijk goed bij welke letter de exponent staat.",
  "ex26":"Breuken met dezelfde noemer tel je op door de tellers op te tellen. `x` betekent `1x`, en 1 kan je schrijven als `3/3`.",
  "ex63":"Het lettergedeelte blijft hetzelfde, je zoekt enkel het getal. Denk bijvoorbeeld: 6 plus hoeveel is 10?",
  "ex27":"Herleid eerst de linkerkant. Enkel gelijksoortige eentermen kan je samennemen, en het lettergedeelte verandert daarbij niet.",
  "ex28":"Vervang de letter door haar waarde. Reken eerst vermenigvuldigen uit, dan optellen en aftrekken.",
  "ex66":"Vervang elke letter door haar waarde, een negatief getal tussen haakjes: `3 · (−2)^2 · 5`. Reken eerst de macht uit: `(−2)^2 = 4`. Vermenigvuldig daarna.",
  "ex29":"Een negatief getal zet je tussen haakjes: `(−1)^3` en `(−1)^2`. Een even exponent maakt het resultaat positief, een oneven exponent laat het min-teken staan.",
  "ex30":"Let op: `−x^2` betekent `−(x^2)`. Reken eerst `(−2)^2` uit en zet het min-teken er daarna voor.",
  "ex31":"`(1/3)^2 = 1/9`. Vermenigvuldig daarna met −9. Tel op het einde de twee termen op.",
  "ex32":"Vervang `a` en `b` door hun waarde, `b` tussen haakjes. Reken elke term apart uit en tel ze daarna samen.",
  "ex56":"De omtrek is de som van de lengtes van alle zijden. Tel alles op en neem daarna de gelijksoortige eentermen samen.",
  "ex67":"Zijden met evenveel streepjes zijn even lang. In een parallellogram zijn de overstaande zijden even lang. Tel alle vier de zijden op en herleid.",
  "ex68":"Alle zijden met een streepje zijn even lang. Tel de vier zijden op en herleid.",
  "ex58":"Als je gelijksoortige eentermen optelt, tel je de coëfficiënten op. Het lettergedeelte blijft hetzelfde: de exponent verandert niet.",
  "sv01":"Staat er een + voor de haakjes, dan laat je de haakjes gewoon weg: elke term houdt zijn teken. Neem daarna de termen met `x` samen en de getallen zonder letter samen.",
  "sv02":"Een + voor de haakjes: elke term houdt zijn teken, ook de min van `−2a^2`. Er zijn drie soorten termen: met `a^2`, met `a` en zonder letter.",
  "sv03":"De omtrek is de som van de drie zijden. Zet elke zijde tussen haakjes: er staat telkens een + voor, dus je mag de haakjes gewoon weglaten. Neem daarna de termen met `x` samen en de getallen samen.",
  "sv04":"`−(3x − 5)` is het tegengestelde van `3x − 5`. Een min voor de haakjes verandert het teken van élke term: + wordt −, − wordt +.",
  "sv05":"Een + voor de haakjes: laat de haakjes gewoon weg. Een − voor de haakjes: verander het teken van élke term tussen de haakjes en laat dan de haakjes weg.",
  "sv06":"Een veelterm aftrekken is hetzelfde als het tegengestelde ervan optellen. Het tegengestelde van `2x + 9` is `−2x − 9`.",
  "sv07":"Het tegengestelde van `−p^2 + 5p − 4`: elk teken verandert. Let op de eerste term: `−p^2` wordt `+p^2`.",
  "sv08":"De eerste haakjes mag je zomaar weglaten. Bij de tweede haakjes staat een min: elk teken binnen die haakjes verandert.",
  "sv09":"Werk elke haakjes apart weg: een + ervoor, dan blijven de tekens; een − ervoor, dan verandert elk teken. Let op: de getallen zonder letter kunnen samen 0 worden.",
  "sv10":"Probeer eerst + en reken uit. Klopt de uitkomst niet, probeer dan −. Kijk bijvoorbeeld enkel naar de termen met de hoogste exponent.",
  "sv11":"Werk de haakjes weg en herleid zelf, op een kladblad. Zoek daarna je uitkomst. Let op elke min voor de haakjes.",
  "sv12":"Vermenigvuldig eerst de getallen (let op het teken: min maal min is plus). Daarna de letters: `x · x = x^2`, je telt de exponenten op. Staat er geen getal, dan is het getal 1.",
  "sv13":"Getal maal getal, letter maal letter. Zelfde letter: tel de exponenten op, `x · x^2 = x^3`. Let op de tekens.",
  "sv14":"De rechthoek heeft hoogte 3 en is verdeeld in twee delen: `x` en `4`. De oppervlakte van elk deel is een product. Samen is dat `3 · (x + 4)`.",
  "sv15":"Vermenigvuldig `−2` met élke term tussen de haakjes. Min maal min is plus: `−2 · (−4) = +8`.",
  "sv16":"`2x · x = 2x^2`: zelfde letter, dus tel je de exponenten op. Vergeet ook `2x · (−5)` niet.",
  "sv17":"`−a · (−3a) = +3a^2`: min maal min is plus en `a · a = a^2`. Daarna `−a · 2`.",
  "sv18":"Drie termen tussen de haakjes: je trekt drie boogjes. Vermenigvuldig `−4` met elke term en let telkens op het teken.",
  "sv19":"Vermenigvuldigen met 0,5 is de helft nemen. De helft van `8x^2` is `4x^2`.",
  "sv20":"Vermenigvuldig de factor met élke term tussen de haakjes. De boogjes helpen: per boogje één product. Staat de factor achter de haakjes, zoals bij f), dan werkt het net zo.",
  "sv21":"Werk de haakjes links weg en vergelijk met rechts. Klopt elk teken? Werd elke term vermenigvuldigd?",
  "sv22":"Werk eerst beide haakjes weg met de distributieve eigenschap. Zet alle termen achter elkaar en neem de gelijksoortige eentermen samen.",
  "sv23":"`−(a + 5)` is hetzelfde als `−1 · (a + 5)`: elk teken binnen de haakjes verandert.",
  "sv24":"De factor voor de tweede haakjes is `−3`, met de min erbij. Dus `−3 · 2x` en `−3 · (−4)`.",
  "sv25":"Bij `7x` staan geen haakjes: die term schrijf je gewoon over. Werk enkel `2 · (x − 3)` uit en herleid daarna.",
  "sv26":"Werk beide haakjes weg. De factor van de tweede haakjes is `−2`. Neem daarna de termen met `x^2` samen en de termen met `x` samen.",
  "sv27":"|AB| en |BC| samen zijn even lang als |AC|. Dus |BC| is |AC| min |AB|. Zet beide veeltermen tussen haakjes: `(7x − 1) − (2x + 4)`.",
  "sv28":"|AB| is het stuk dat overblijft als je |BC| van |AC| aftrekt. Zet beide veeltermen tussen haakjes en let op de min voor de tweede haakjes.",
  "sv29":"Een rechthoek heeft vier zijden: twee keer de lengte en twee keer de breedte. Tel ze op en neem de gelijksoortige eentermen samen.",
  "sv30":"Oppervlakte van een rechthoek = lengte · breedte. Vermenigvuldig `x` met elke term van `x + 3`. Het rechthoekmodel toont de twee delen.",
  "sv31":"Deel ① is 3 breed en `x` hoog, deel ② is `x` breed en `x` hoog. Tel beide oppervlaktes op. De hele mat is `(3 + x)` breed en `x` hoog.",
  "sv32":"Omtrek: `2 · (3a − 1) + 2 · 2a`. Oppervlakte: `2a · (3a − 1)`. Werk telkens de haakjes weg.",
  "sv33":"Een min voor de haakjes verandert het teken van élke term binnen de haakjes, ook van de laatste.",
  "sv34":"Vermenigvuldig `−3` met elke term. Let op het teken van `−3 · (−5)`.",
  "sv35":"De factor voor de haakjes vermenigvuldig je met élke term tussen de haakjes.",
  "sv36":"Zelfde letter maal zelfde letter: tel de exponenten op. `x · x = x^2`."
};
const GLOSSARY = {
  "algebraïsche uitdrukking":"Een uitdrukking met getallen, letters en bewerkingstekens, bijvoorbeeld 3x + 2.",
  "lettervorm":"Een uitdrukking of formule waarin letters voorkomen, bijvoorbeeld s = 3n + 1.",
  "woordformule":"Een regel in woorden, bijvoorbeeld: het aantal stippen is 3 keer het nummer van de figuur plus 1.",
  "eenterm":"Een product van een coëfficiënt en letterfactoren met positieve exponenten, bijvoorbeeld −2ab of 4x².",
  "eentermen":"Producten van een coëfficiënt en letterfactoren, zoals 3x, −a² of ½bh.",
  "veelterm":"Een som van eentermen, bijvoorbeeld 2n + 3.",
  "tweeterm":"Een veelterm met precies 2 termen, bijvoorbeeld 5n + 2.",
  "drieterm":"Een veelterm met precies 3 termen, bijvoorbeeld x² + 4x − 1.",
  "coëfficiënt":"Het getal vooraan in een eenterm (het getalgedeelte). In −2ab is de coëfficiënt −2.",
  "coëfficiënten":"De getallen vooraan in de eentermen (de getalgedeelten).",
  "lettergedeelte":"De letters met hun exponenten in een eenterm. In −2ab is het lettergedeelte ab.",
  "gelijksoortige eentermen":"Eentermen die hetzelfde lettergedeelte hebben, zoals 3x en −x.",
  "gelijksoortig":"Met hetzelfde lettergedeelte, zoals 3x² en −x².",
  "herleid":"Gelijksoortige eentermen samengenomen, zodat je uitdrukking zo kort mogelijk is.",
  "herleiden":"Gelijksoortige eentermen optellen of aftrekken, zodat de uitdrukking zo kort mogelijk wordt.",
  "getalwaarde":"Wat je uitkomt als je de letters vervangt door getallen en de uitdrukking uitrekent.",
  "graad":"De grootste exponent waarmee de letter voorkomt in de herleide veelterm.",
  "dalende machten":"Eerst de term met de grootste exponent, dan de volgende … en de constante term achteraan.",
  "tegengestelde":"Het tegengestelde van een veelterm krijg je door het teken van elke term te veranderen. Het tegengestelde van 3x − 5 is −3x + 5.",
  "distributiviteit":"a · (b + c) = a · b + a · c: je vermenigvuldigt de factor met elke term tussen de haakjes.",
  "constante":"Een term zonder letter, bijvoorbeeld de 3 in 2n + 3.",
  "variabele":"Een letter die voor een (onbekend) getal staat.",
  "omtrek":"De lengte van de rand van een figuur: de som van de lengtes van alle zijden.",
  "oppervlakte":"De grootte van een vlak. Bij een rechthoek: lengte · breedte.",
  "formatie":"De vaste manier waarop een groep opgesteld staat.",
  "veeltermen":"Sommen van eentermen, zoals 2n + 3 en x² − 4x + 1.",
  "distributieve eigenschap":"a · (b + c) = a · b + a · c: je vermenigvuldigt de factor voor de haakjes met elke term tussen de haakjes.",
  "bewerkingsteken":"Het teken van een bewerking, zoals + of −.",
  "lijnstuk":"Het stuk van een rechte tussen twee punten, bijvoorbeeld [AC]. Met |AC| bedoel je de lengte ervan."
};
const INSTR = {
  "kies":"Kies het juiste antwoord.",
  "rows":"Vul elke regel in.",
  "sorteer":"Klik op een kaart en daarna op de bak waar ze hoort. Slepen mag ook.",
  "tabel":"Vul de lege vakjes in. Hou rekening met de afspraken.",
  "labels":"Kies bij elk Romeins cijfer het passende begrip.",
  "kleur":"Kies een markeerstift en klik de eentermen aan. Gelijksoortige eentermen krijgen dezelfde kleur, eentermen die niet gelijksoortig zijn een andere kleur.",
  "omkring":"Klik de eentermen aan die je wil omkringen. Nog eens klikken haalt de cirkel weg.",
  "orden":"Klik de termen aan in de juiste volgorde. Klik een term in je antwoord aan om hem terug te leggen.",
  "pat":"Vul de tabel aan. Schrijf daarna de lettervorm.",
  "herlrows":"Herleid. Kan het niet, klik dan op “kan niet herleid worden”.",
  "herl":"① Kies een markeerstift en geef gelijksoortige eentermen dezelfde kleur. ② Tel de coëfficiënten van gelijksoortige eentermen op en schrijf het eindresultaat, gerangschikt volgens dalende machten.",
  "isgelijk":"Werk in gedachten de haakjes weg en kies telkens = of ≠.",
  "gw":"① Vervang elke letter door haar waarde: klik op de letter. ② Reken elke term uit: eerst de machten, dan vermenigvuldigen. ③ Noteer de getalwaarde.",
  "gwtabel":"Reken voor elke waarde van de letter de getalwaarde uit.",
  "hw":"Volg de methode. Klik in elk vakje het juiste teken aan: + of −. Kleur daarna de gelijksoortige eentermen en herleid.",
  "pira":"Tel telkens de twee stenen eronder op en herleid.",
  "bewteken":"Klik in het vakje tussen de haakjes het juiste teken aan: + of −. Controleer met de uitkomst rechts.",
  "koppel":"Klik een opgave aan en daarna de juiste uitkomst. Er blijven twee uitkomsten over.",
  "mono":"Vermenigvuldig de getallen met elkaar en de letters met elkaar.",
  "prodtab":"Vermenigvuldig de eenterm van de rij met de eenterm van de kolom.",
  "distr":"① Trek de boogjes: klik op de factor voor de haakjes en daarna op een term tussen de haakjes. ② Reken elk product uit. ③ Voeg de termen samen. ④ Staan er gelijksoortige eentermen bij, kleur ze dan en neem ze samen.",
  "opp":"Reken de oppervlakte van elk deel uit en tel ze op.",
  "omtrek":"① Klik elke zijde van de figuur aan. Streepjes op zijden betekenen: even lang. ② Tel de lengtes op en herleid.",
  "ctx":"Lees de situatie goed en beantwoord de vragen.",
  "fout":"Kies wat er fout ging en schrijf de juiste uitkomst."
};

/* ============================================================
   KLEINE ALGEBRA: veeltermen ontleden, rekenen en netjes noteren.
   Hiermee maken we de antwoordsleutels van de nieuwe oefeningen en
   van de generatoren (↻ Nieuwe opgave), zodat geen sleutel met de
   hand moet worden uitgerekend.
   Term = {c:getal, L:{x:2, y:1}}
   ============================================================ */
const ALG = (() => {
  const r6 = x => Math.round(x * 1e6) / 1e6;
  function getal(s){ s = String(s).replace(',', '.').replace(/[−–]/g, '-'); if(s.indexOf('/') >= 0){ const p = s.split('/'); return Number(p[0]) / Number(p[1]); } return Number(s); }
  /* '3x^2 − 2xy + 5' -> [{c:3,L:{x:2}}, {c:-2,L:{x:1,y:1}}, {c:5,L:{}}] */
  function parse(str){
    const s = String(str).replace(/[−–]/g, '-').replace(/\s+/g, '').replace(/·/g, '');
    const out = []; let i = 0;
    while(i < s.length){
      let sg = 1;
      while(s[i] === '+' || s[i] === '-'){ if(s[i] === '-') sg = -sg; i++; }
      let num = '';
      while(i < s.length && /[0-9,./]/.test(s[i])) num += s[i++];
      const L = {};
      while(i < s.length && /[a-z]/i.test(s[i])){
        const l = s[i++]; let e = '';
        if(s[i] === '^'){ i++; while(i < s.length && /[0-9]/.test(s[i])) e += s[i++]; }
        L[l] = (L[l] || 0) + (e ? Number(e) : 1);
      }
      out.push({c:sg * (num === '' ? 1 : getal(num)), L});
    }
    return out;
  }
  const lk = t => Object.keys(t.L).sort().map(k => k + (t.L[k] > 1 ? '^' + t.L[k] : '')).join('');
  const graad = t => Object.keys(t.L).reduce((a, k) => a + t.L[k], 0);
  /* gelijksoortige termen samennemen, gerangschikt volgens dalende machten */
  function merge(ts){
    const m = {}, order = [];
    ts.forEach(t => { const k = lk(t); if(!(k in m)){ m[k] = {c:0, L:Object.assign({}, t.L)}; order.push(k); } m[k].c = r6(m[k].c + t.c); });
    return order.map(k => m[k]).filter(t => Math.abs(t.c) > 1e-9).sort((a, b) => graad(b) - graad(a) || (lk(a) < lk(b) ? -1 : lk(a) > lk(b) ? 1 : 0));
  }
  function mul(a, b){ const L = Object.assign({}, a.L); Object.keys(b.L).forEach(k => { L[k] = (L[k] || 0) + b.L[k]; }); return {c:r6(a.c * b.c), L}; }
  const neg = t => ({c:-t.c, L:t.L});
  function fmtC(c){ const a = Math.abs(c); return String(r6(a)).replace('.', ','); }
  /* één term met teken: '−3x^2' ; eerste = geen + vooraan */
  function term(t, eerste){
    const l = lk(t), a = Math.abs(t.c);
    const c = (l && a === 1) ? '' : fmtC(t.c);
    const body = c + l;
    if(eerste) return (t.c < 0 ? '−' : '') + body;
    return (t.c < 0 ? ' − ' : ' + ') + body;
  }
  function fmt(ts){ if(!ts.length) return '0'; return ts.map((t, i) => term(t, i === 0)).join(''); }
  const tekenVan = (t, eerste) => t.c < 0 ? '−' : (eerste ? '' : '+');
  /* groepen voor de markeerstiften: zelfde lettergedeelte -> zelfde kleur */
  function groepen(ts){ const g = {}, m = {}; ts.forEach((t, i) => { const k = lk(t); if(!(k in g)) g[k] = Object.keys(g).length; m[i] = g[k]; }); return m; }
  const kanHerleid = ts => new Set(ts.map(lk)).size < ts.length;
  /* getalwaarde */
  function waarde(t, vals){ return Object.keys(t.L).reduce((a, k) => a * Math.pow(getal(vals[k]), t.L[k]), t.c); }
  const numKey = x => [x < 0 ? '−' : '', String(r6(Math.abs(x))).replace('.', ',')];
  return { parse, merge, mul, neg, fmt, term, lk, graad, groepen, kanHerleid, waarde, numKey, tekenVan, getal, r6,
    /* tekst met backticks voor wiskunde in titels */
    m:s => '`' + s + '`' };
})();

/* ---------- sleutels maken ---------- */
const MAAK = {
  /* som/verschil met haakjes: g = [{t}, {op:'+'|'−', t}] */
  hw(g, kort){
    const flat = [], tg = {};
    g.forEach((gr, gi) => {
      const ts = ALG.parse(gr.t);
      const na = gr.op === '−' ? ts.map(ALG.neg) : ts;
      if(gr.op === '−' && !kort) tg[gi] = na.map((t, i) => ALG.tekenVan(t, i === 0));
      na.forEach(t => flat.push(t));
    });
    const k = { hw:flat.map((t, i) => ALG.tekenVan(t, i === 0)), mk:ALG.groepen(flat), res:ALG.fmt(ALG.merge(flat)) };
    if(Object.keys(tg).length) k.tg = tg;
    return {hw:k};
  },
  /* distributief: items = [{f, t}] of {loose} met eventueel op */
  distr(items){
    const pr = {}, sam = [];
    items.forEach((it, pi) => {
      const s = it.op === '−' ? -1 : 1;
      if(it.loose){ ALG.parse(it.loose).forEach(t => sam.push({c:s * t.c, L:t.L})); return; }
      const f = ALG.parse(it.f)[0];
      ALG.parse(it.t).forEach((t, ti) => { const p = ALG.mul(f, t), ps = {c:s * p.c, L:p.L}; pr[pi + '.' + ti] = ALG.fmt([ps]); sam.push(ps); });
    });
    const k = {pr, res:ALG.fmt(ALG.merge(sam))};
    if(items.length > 1){ k.sam = ALG.fmt(sam); k.mk = ALG.groepen(sam); }
    return {distr:k};
  },
  herl(expr){ const ts = ALG.parse(expr); return {mk:ALG.groepen(ts), res:ALG.fmt(ALG.merge(ts))}; },
  herlrows(rows){ return {herlrows:rows.map(r => { const ts = ALG.parse(r); return ALG.kanHerleid(ts) ? ALG.fmt(ALG.merge(ts)) : null; })}; },
  gw(expr, vals){
    const ts = ALG.parse(expr), w = ts.map(t => ALG.waarde(t, vals));
    const k = {res:ALG.numKey(w.reduce((a, b) => a + b, 0))};
    if(ts.length > 1) k.tv = w.map(ALG.numKey);
    return {gw:k};
  },
  gwtabel(expr, letter, vals){ const ts = ALG.parse(expr); return {gwtabel:vals.map(x => ALG.numKey(ts.reduce((a, t) => a + ALG.waarde(t, {[letter]:x}), 0)))}; },
  mono(rows){ return {mono:rows.map(r => { const p = ALG.mul(ALG.parse(r.f)[0], ALG.parse(r.t)[0]); return [String(ALG.r6(p.c)).replace('.', ',').replace('-', '−'), ALG.lk(p)]; })}; },
  prodtab(rf, cf){ return {prodtab:rf.map(a => cf.map(b => ALG.fmt([ALG.mul(ALG.parse(a)[0], ALG.parse(b)[0])])))}; },
  tr(rows){ return {tr:rows.map(r => ALG.fmt(ALG.merge(ALG.parse(r))))}; }
};

/* f · (t) uitgewerkt en herleid, als tekst */
function UIT(f, t){ const fs = ALG.parse(f)[0]; return ALG.fmt(ALG.merge(ALG.parse(t).map(x => ALG.mul(fs, x)))); }

/* nieuwe vraag toevoegen aan Q en SLEUTEL */
function NV(q, key, hint){
  Q[q.id] = q; SLEUTEL[q.id] = key; if(hint) HINTS[q.id] = hint;
  return q;
}

/* ============================================================
   NIEUWE FIGUREN: omtrekfiguren (aanklikbare zijden) en patronen
   ============================================================ */
FIGS.ruit = polyFig({
  label:'Ruit met zijde 3x', view:'40 20 420 290', max:420,
  pts:[[250,40], [420,165], [250,290], [80,165]],
  sides:[{a:0, b:1, lab:'3x', lp:[352,92], ticks:1}, {a:1, b:2, lab:'3x', show:false, ticks:1},
         {a:2, b:3, lab:'3x', show:false, ticks:1}, {a:3, b:0, lab:'3x', show:false, ticks:1}]
});
FIGS.trapezium = polyFig({
  label:'Gelijkbenig trapezium', view:'20 40 470 260', max:480,
  pts:[[60,250], [440,250], [340,80], [160,80]],
  sides:[{a:0, b:1, lab:'a + 6', lp:[250,284]}, {a:1, b:2, lab:'2b', lp:[414,158], ticks:1},
         {a:2, b:3, lab:'a', lp:[250,66]}, {a:3, b:0, lab:'2b', show:false, ticks:1}]
});
FIGS.zeshoek = (() => {
  const P = [], cx = 250, cy = 165, r = 120;
  for(let i = 0; i < 6; i++){ const t = (-120 + 60 * i) * Math.PI / 180; P.push([Math.round(cx + r * Math.cos(t)), Math.round(cy + r * Math.sin(t))]); }
  return polyFig({ label:'Regelmatige zeshoek met zijde 1,5y', view:'90 20 330 290', max:340, pts:P,
    sides:P.map((p, i) => ({a:i, b:(i + 1) % 6, lab:'1,5y', show:i === 0, lp:[cx, 42], ticks:1})) });
})();
FIGS.lvorm = polyFig({
  label:'L-vormige figuur', view:'20 10 470 330', max:470,
  pts:[[70,50], [410,50], [410,140], [170,140], [170,300], [70,300]],
  sides:[{a:0, b:1, lab:'4x', lp:[240,36]}, {a:1, b:2, lab:'y', lp:[432,102]},
         {a:2, b:3, lab:'3x', show:false}, {a:3, b:4, lab:'2y', show:false},
         {a:4, b:5, lab:'x', lp:[120,326]}, {a:5, b:0, lab:'3y', lp:[46,182]}],
  right:[[0,1,5], [1,0,2], [2,1,3], [4,3,5], [5,4,0]]
});
FIGS.rechthoek2a = polyFig({
  label:'Rechthoek met breedte 2a en lengte 3a + 4', view:'20 10 470 260', max:480,
  pts:[[70,60], [410,60], [410,230], [70,230]],
  sides:[{a:0, b:1, lab:'3a + 4', lp:[150,44], ticks:1}, {a:1, b:2, lab:'2a', lp:[440,150], ticks:2},
         {a:2, b:3, lab:'3a + 4', show:false, ticks:1}, {a:3, b:0, lab:'2a', show:false, ticks:2}],
  right:[[0,1,3], [1,0,2], [2,1,3], [3,2,0]]
});

/* ---------- patronen ---------- */
/* kruis van stippen: een middelste stip + 4 armen van n stippen */
PATS.kruis = function(n, hi){
  const S = 15, R = 5.5, c = (n + 0.5) * S + 4, W = 2 * c;
  let h = '<circle cx="'+c+'" cy="'+c+'" r="'+R+'" fill="'+(hi ? VAST : '#127a7f')+'" stroke="'+(hi ? VASTD : '#0e5f63')+'"/>';
  for(let k = 1; k <= n; k++){
    const G = hi ? grp(k - 1) : null;
    [[0,-1], [1,0], [0,1], [-1,0]].forEach(d => {
      h += '<circle cx="'+(c + d[0] * k * S)+'" cy="'+(c + d[1] * k * S)+'" r="'+R+'" fill="'+(G ? G.c : '#127a7f')+'" stroke="'+(G ? G.d : '#0e5f63')+'"/>';
    });
  }
  return '<svg class="patsvg" viewBox="0 0 '+W+' '+W+'" style="width:'+(W * 1.15).toFixed(0)+'px" aria-label="Figuur '+n+'">'+h+'</svg>';
};
/* huisjes van lucifers naast elkaar: per huisje 5 lucifers + de eerste muur */
PATS.huis = function(n, hi){
  const S = 44, x0 = 10, yd = 8, y1 = yd + 28, y2 = y1 + S;
  const st = (x1, ya, x2, yb, col) => {
    const c = col ? col.c : '#e8c27a', hd = col ? col.d : '#b33a1f';
    const dx = x2 - x1, dy = yb - ya, L = Math.hypot(dx, dy), ux = dx / L, uy = dy / L;
    return '<line x1="'+(x1 + ux * 4)+'" y1="'+(ya + uy * 4)+'" x2="'+(x2 - ux * 4)+'" y2="'+(yb - uy * 4)+'" stroke="#8a6a2b" stroke-width="7" stroke-linecap="round"/>' +
      '<line x1="'+(x1 + ux * 4)+'" y1="'+(ya + uy * 4)+'" x2="'+(x2 - ux * 4)+'" y2="'+(yb - uy * 4)+'" stroke="'+c+'" stroke-width="5" stroke-linecap="round"/>' +
      '<circle cx="'+(x2 - ux * 6)+'" cy="'+(yb - uy * 6)+'" r="4" fill="'+hd+'"/>';
  };
  let h = '';
  for(let k = 0; k < n; k++){
    const G = hi ? grp(k) : null, x = x0 + k * S;
    h += st(x, y2, x + S, y2, G) + st(x, y1, x + S, y1, G) + st(x, y1, x + S / 2, yd, G) + st(x + S / 2, yd, x + S, y1, G) + st(x + S, y1, x + S, y2, G);
  }
  h += st(x0, y1, x0, y2, hi ? VASTP : null);
  const W = x0 * 2 + n * S;
  return '<svg class="patsvg" viewBox="0 0 '+W+' '+(y2 + 10)+'" style="width:'+(W * 1.05).toFixed(0)+'px" aria-label="Figuur '+n+'">'+h+'</svg>';
};
PATHINT.kruis = 'Elke ring rond het midden krijgt een eigen kleur: bij elke stap komen er 4 stippen bij, één op elke arm. De grijze stip in het midden komt er maar één keer bij.';
PATHINT.huis = 'Elk huisje krijgt een eigen kleur: bij elk huisje horen even veel lucifers. De grijze muur vooraan komt er maar één keer bij.';

/* ---------- vlakke figuren voor het spiekbriefje ---------- */
const VF = (() => {
  const box = (inner, lab) => '<figure class="vf"><svg viewBox="0 0 120 90" aria-hidden="true">'+inner+'</svg><figcaption>'+lab+'</figcaption></figure>';
  const P = 'fill="#e3f3f1" stroke="#127a7f" stroke-width="2.5" stroke-linejoin="round"';
  const t = (x, y, s) => '<text x="'+x+'" y="'+y+'" text-anchor="middle" font-size="13" font-style="italic" font-weight="700" fill="#b86e00">'+s+'</text>';
  const tick = (x1, y1, x2, y2) => '<line x1="'+x1+'" y1="'+y1+'" x2="'+x2+'" y2="'+y2+'" stroke="#17313a" stroke-width="2"/>';
  const dash = 'stroke="#35545a" stroke-width="1.5" stroke-dasharray="4 3"';
  return {
    vierkant: box('<rect x="32" y="12" width="56" height="56" '+P+'/>' + t(60, 84, 'z') + tick(60,64,60,72) + tick(84,40,92,40) + rhoekL([32,68],[88,68],[32,12], 3, 8, '#35545a', 1.5), 'vierkant'),
    rechthoek: box('<rect x="14" y="18" width="92" height="50" '+P+'/>' + t(60, 84, 'l') + t(114, 47, 'b') + rhoekL([14,68],[106,68],[14,18], 3, 8, '#35545a', 1.5), 'rechthoek'),
    ruit: box('<polygon points="60,6 100,44 60,82 20,44" '+P+'/><line x1="60" y1="6" x2="60" y2="82" '+dash+'/><line x1="20" y1="44" x2="100" y2="44" '+dash+'/>' + t(68, 30, 'D') + t(82, 40, 'd') + t(88, 22, 'z') + rhoekL([60,44],[100,44],[60,82], 3, 8, '#35545a', 1.5), 'ruit'),
    para: box('<polygon points="10,70 82,70 110,18 38,18" '+P+'/><line x1="44" y1="18" x2="44" y2="70" '+dash+'/>' + t(46, 86, 'b') + t(52, 50, 'h') + t(104, 50, 'a') + rhoekL([44,70],[82,70],[44,18], 3, 8, '#35545a', 1.5), 'parallellogram'),
    driehoek: box('<polygon points="10,72 110,72 72,10" '+P+'/><line x1="72" y1="10" x2="72" y2="72" '+dash+'/>' + t(60, 87, 'b') + t(80, 46, 'h') + rhoekL([72,72],[110,72],[72,10], 3, 8, '#35545a', 1.5), 'driehoek'),
    trapezium: box('<polygon points="8,72 112,72 86,16 34,16" '+P+'/><line x1="40" y1="16" x2="40" y2="72" '+dash+'/>' + t(60, 87, 'B') + t(60, 12, 'b') + t(48, 50, 'h') + rhoekL([40,72],[112,72],[40,16], 3, 8, '#35545a', 1.5), 'trapezium'),
    cirkel: box('<circle cx="60" cy="42" r="32" '+P+'/><line x1="60" y1="42" x2="92" y2="42" stroke="#17313a" stroke-width="2"/><circle cx="60" cy="42" r="2.5" fill="#17313a"/>' + t(76, 37, 'r'), 'cirkel')
  };
})();

/* ============================================================
   NIEUWE OEFENINGEN (aanvulling op de twee oude pagina's)
   Accenten uit de toetsen: eenterm uit beschrijving, afspraken,
   gelijksoortig ja/nee en omcirkelen, vul aan, patroon n-de figuur,
   wat stelt x voor, bewerkingsteken, lijnstuk, rechthoek.
   Getallen en situaties zijn nieuw: gelijkaardig, nooit identiek.
   De sleutels worden berekend met MAAK (31_alg.js) waar dat kan.
   ============================================================ */
const M = ALG.m;

/* ---------- 1. letters gebruiken ---------- */
NV({ id:'nl1', type:'ctx', title:'Wat stelt de letter voor?',
  intro:'Lees elke situatie. Kies wat de letter voorstelt.',
  parts:[
    {lab:'a) Een zwembadbeurt kost 4 euro. Mila betaalt in totaal 36 euro: `4b = 36`.', k:'kies', opts:['de prijs van één beurt','het aantal beurten','het totale bedrag']},
    {lab:'b) Een lint van 270 cm wordt in 6 even lange stukken geknipt: `6s = 270`.', k:'kies', opts:['het aantal stukken','de lengte van het hele lint','de lengte van één stuk']},
    {lab:'c) Oma is 4 keer zo oud als Wout. Oma is 64 jaar: `4w = 64`.', k:'kies', opts:['de leeftijd van oma','de leeftijd van Wout','het leeftijdsverschil']},
    {lab:'d) Een fietsherstelling kost 12 euro vast plus 15 euro per uur. De rekening is 42 euro: `12 + 15u = 42`.', k:'kies', opts:['de prijs per uur','het aantal uren','de vaste kost']},
    {lab:'e) Een doos koekjes kost 1,50 euro meer dan een pak sap. De doos kost 3,20 euro: `p + 1,5 = 3,2`.', k:'kies', opts:['de prijs van de doos koekjes','de prijs van het pak sap','het prijsverschil']}
  ] }, {ctx:[1, 2, 1, 1, 1]},
  'Vraag je af: wat ken je nog niet in de situatie? Dat is de letter. Controleer door een getal in te vullen.');

NV({ id:'nl2', type:'rows', kind:'tr', pre:'lettervorm =', title:'Druk uit met een eenterm of een veelterm.',
  rows:[{lab:'vijf minder dan een getal `a`'}, {lab:'het viervoud van een getal `b`'}, {lab:'drie keer het kwadraat van een getal `c`'},
        {lab:'het dubbel van een getal `x`, vermeerderd met 7'}, {lab:'de som van de getallen `p`, `q` en `r`'}, {lab:'het kwadraat van `k`, verminderd met het drievoud van `k`'}] },
  MAAK.tr(['a − 5', '4b', '3c^2', '2x + 7', 'p + q + r', 'k^2 − 3k']),
  'Het viervoud van b is 4 · b = 4b. Het kwadraat van c is c². Minder dan of verminderd met: je trekt af.');

NV({ id:'nl3', type:'ctx', title:'Stiften',
  intro:'In één doos zitten `d` stiften. Lien koopt 4 dozen. Thuis heeft ze nog 6 losse stiften.',
  parts:[{lab:'a) Welke algebraïsche uitdrukking geeft het totaal aantal stiften van Lien?', k:'tr', pre:'aantal stiften =', prePlain:true},
         {lab:'b) Hoeveel stiften heeft Lien als er 12 stiften in een doos zitten?', k:'nf', unit:'stiften'},
         {lab:'c) Je uitdrukking uit a) is een …', k:'kies', opts:['eenterm','tweeterm','drieterm']}] },
  {ctx:['4d + 6', ['', '54'], 1]},
  '4 dozen met elk d stiften: dat is 4 · d. Tel daarna de losse stiften erbij.');

NV({ id:'nl4', type:'ctx', title:'Proteïnerepen',
  intro:'Een proteïnereep weegt `x` gram. Op sportdag eet elk van de 24 leerlingen van de klas één reep.',
  parts:[{lab:'a) Welke uitdrukking geeft de totale massa van de repen?', k:'tr', pre:'massa =', prePlain:true},
         {lab:'b) Een maand later is elke reep 5 gram lichter, aan dezelfde prijs. Welke uitdrukking geeft nu de totale massa? Werk de haakjes weg.', k:'tr', pre:'massa =', prePlain:true},
         {lab:'c) Een reep woog eerst 45 gram. Hoeveel gram eten de 24 leerlingen nu samen?', k:'nf', unit:'gram'}] },
  {ctx:['24x', '24x − 120', ['', '960']]},
  'Eén reep weegt nu x − 5 gram. Voor 24 repen schrijf je 24 · (x − 5).');

/* ---------- 2. eentermen ---------- */
NV({ id:'ne1', type:'tabel', title:'Vul de tabel aan. Hou rekening met de afspraken.',
  cols:[{k:'t', h:'eenterm'}, {k:'c', h:'coëfficiënt'}, {k:'l', h:'lettergedeelte'}],
  rows:[{t:'−3/8pq'}, {t:'−k^7'}, {t:'0,6x^3y'}, {c:'14', l:'a^2bc'}, {c:'−1', l:'mn^4'}] },
  {tabel:[{c:'−3/8', l:'pq'}, {c:'−1', l:'k^7'}, {c:'0,6', l:'x^3y'}, {t:'14a^2bc'}, {t:'−mn^4'}]},
  'Het minteken hoort bij de coëfficiënt. Staat er geen getal, dan is de coëfficiënt 1 of −1. Coëfficiënt −1 schrijf je als een minteken.');

NV({ id:'ne2', type:'rows', kind:'nat', pre:'graad =', title:'Bepaal de graad van de eenterm: tel de exponenten van alle letters op.',
  rows:[{lab:'`−4a^2b^3`'}, {lab:'`7xyz`'}, {lab:'`−m^4`'}, {lab:'`2/3p^3q`'}, {lab:'`0,1x^2y^2`'}] },
  {nat:['5', '3', '4', '4', '4']},
  'Bij 7xyz heeft elke letter exponent 1: de graad is 1 + 1 + 1 = 3.');

/* ---------- 3. gelijksoortige eentermen ---------- */
NV({ id:'ng1', type:'ctx', title:'Gelijksoortig of niet?',
  intro:'Zijn de twee eentermen gelijksoortig? Kies telkens ja of nee.',
  parts:[['`−5x` en `8x`'], ['`3a^2` en `3a^3`'], ['`−mn` en `4nm`'], ['`2xy^2` en `2x^2y`'], ['`1/3p^2q` en `−p^2q`'], ['`7` en `7k`']]
    .map((r, i) => ({lab:String.fromCharCode(97 + i) + ') ' + r[0], k:'kies', opts:['ja', 'nee']})) },
  {ctx:[0, 1, 0, 1, 0, 1]},
  'Kijk enkel naar het lettergedeelte: dezelfde letters met dezelfde exponenten? Het getal ervoor maakt niets uit. nm schrijf je als mn.');

NV({ id:'ng2', type:'ctx', title:'Gelijksoortige eentermen: uitleggen en zelf maken',
  intro:'Toon dat je weet wat gelijksoortige eentermen zijn.',
  parts:[{lab:'a) Wat zijn gelijksoortige eentermen?', k:'kies', opts:['eentermen met dezelfde coëfficiënt', 'eentermen met hetzelfde lettergedeelte', 'eentermen met dezelfde letters, de exponenten mogen verschillen', 'eentermen met dezelfde graad']},
         {lab:'b) Geef een eenterm die gelijksoortig is met `−6ab^2`.', k:'gs', ref:'−6ab^2', pre:'eenterm =', prePlain:true},
         {lab:'c) Geef nog een andere eenterm die gelijksoortig is met `−6ab^2`.', k:'gs', ref:'−6ab^2', pre:'eenterm =', prePlain:true}] },
  {ctx:[1, '2ab^2', '−ab^2']},
  'Houd het lettergedeelte ab² precies hetzelfde en kies zelf een ander getal ervoor.');

NV({ id:'ng3', type:'omkring', title:'Omcirkel in elke rij alle eentermen die gelijksoortig zijn met de eerste eenterm.',
  rows:[{ref:'−4x^2y', items:['x^2y', '−4xy^2', '3yx^2', '−4x^2', '0,5x^2y', 'x^2y^2']},
        {ref:'9pq', items:['9p', '−qp', 'pq^2', '2/5pq', '−9pq']}] },
  {omkring:[[0, 2, 4], [1, 3, 4]]},
  'yx² is hetzelfde als x²y: de volgorde van de letters speelt geen rol.');

NV({ id:'ng4', type:'kleur', title:'Geef gelijksoortige eentermen dezelfde kleur.',
  tiles:['2xy', '−x^2y', 'yx', '5xy^2', '−3xy', '4yx^2', '0,1xy^2', '−y^2x', '7x^2y'] },
  {mk:{0:0, 1:1, 2:0, 3:2, 4:0, 5:1, 6:2, 7:2, 8:1}},
  'Schrijf de letters eerst in alfabetische volgorde: yx² = x²y en y²x = xy².');

NV({ id:'ng5', type:'ctx', title:'Gelijksoortig: denk een stap verder',
  intro:'Soms moet je een eenterm eerst korter schrijven voor je ziet of hij gelijksoortig is.',
  parts:[{lab:'a) Zijn `x^2 · x` en `−4x^3` gelijksoortig?', k:'kies', opts:['ja', 'nee']},
         {lab:'b) Zijn `2ab · b` en `5a^2b` gelijksoortig?', k:'kies', opts:['ja', 'nee']},
         {lab:'c) Welke graad heeft elke eenterm die gelijksoortig is met `5a^3b^2`?', k:'nf'},
         {lab:'d) Geef de eenterm die gelijksoortig is met `−3pq^2` en waarvan de coëfficiënt drie keer zo groot is.', k:'tr', pre:'eenterm =', prePlain:true},
         {lab:'e) Geef de eenterm die gelijksoortig is met `4x^2y` en die samen met `4x^2y` als som 0 geeft.', k:'tr', pre:'eenterm =', prePlain:true},
         {lab:'f) Kunnen twee gelijksoortige eentermen een verschillende graad hebben?', k:'kies', opts:['ja', 'nee']}] },
  {ctx:[0, 1, ['', '5'], '−9pq^2', '−4x^2y', 1]},
  'Schrijf eerst korter: x² · x = x³ en ab · b = ab². Gelijksoortige eentermen hebben dezelfde exponenten, dus ook dezelfde graad.');

/* ---------- 4. veeltermen en graad ---------- */
NV({ id:'nv1', type:'sorteer', title:'Is het een eenterm, een tweeterm of een drieterm?', bins:['eenterm', 'tweeterm', 'drieterm'],
  chips:['`−9q^3`', '`3a − 7`', '`x^2 + x + 1`', '`2/5mn`', '`6 − y^2`', '`p^3 − 2p + 4`', '`0,8k`', '`ab + b`'] },
  {sorteer:[0, 1, 2, 0, 1, 2, 0, 1]},
  'Tel de termen: ze worden gescheiden door + of −. Een minteken vooraan hoort bij de eerste term.');

NV({ id:'nv2', type:'rows', kind:'nat', pre:'graad =', title:'Bepaal de graad van de veelterm in de gegeven letter.',
  rows:[{lab:'`5y^3 − 2` in de letter `y`'}, {lab:'`−x + 4x^2 − 7` in de letter `x`'}, {lab:'`8 − a^5 + 3a^2` in de letter `a`'},
        {lab:'`−6m` in de letter `m`'}, {lab:'`2p^2q − pq^4` in de letter `q`'}, {lab:'`2p^2q − pq^4` in de letter `p`'}] },
  {nat:['3', '2', '5', '1', '4', '2']},
  'De graad van een veelterm in een letter is de hoogste exponent van die letter.');

NV({ id:'nv3', type:'rows', kind:'tr', title:'Noteer volgens de afspraken en rangschik volgens dalende machten.',
  rows:[{lab:'`7 + 2y − 6y^2`'}, {lab:'`a · 4 − a^3`'}, {lab:'`1k^2 + 1k^3`'}, {lab:'`p^2 − p^4 + p − p^3`'}, {lab:'`b · 5 − 2 + b^2 · 3`'}] },
  MAAK.tr(['7 + 2y − 6y^2', '4a − a^3', 'k^2 + k^3', 'p^2 − p^4 + p − p^3', '5b − 2 + 3b^2']),
  'Zet de term met de hoogste exponent vooraan, daarna de volgende … De term zonder letter komt achteraan.');

NV({ id:'nv4', type:'kies', title:'Welke veelterm is een drieterm van de graad 3 in `x`?',
  options:[{id:'a', text:'`x^3 + 3`'}, {id:'b', text:'`3x^2 − x + 1`'}, {id:'c', text:'`−x^3 + x − 6`'}, {id:'d', text:'`x^3 − 2x^2 + x − 1`'}] },
  {kies:'c'}, 'Een drieterm heeft 3 termen. De graad is de hoogste exponent van x.');

NV({ id:'nv5', type:'kies', title:'Herleid eerst. Welke uitdrukking is na herleiden een tweeterm?',
  options:[{id:'a', text:'`4x + 2 − 4x`'}, {id:'b', text:'`x^2 + 3x − x^2 + 1`'}, {id:'c', text:'`5a − 2a + a`'}, {id:'d', text:'`y^2 + y + 1`'}] },
  {kies:'b'}, 'Neem eerst de gelijksoortige termen samen. Tel dan pas hoeveel termen er overblijven.');

/* ---------- 5. patronen ---------- */
NV({ id:'np1', type:'pat', fig:'kruis', qty:'aantal stippen', letter:'s', nlab:'nummer figuur', nletter:'n', cols:[1, 2, 3, 4, 10],
  ask:{lab:'Hoeveel stippen telt figuur 320?', unit:'stippen'}, title:'Een kruis van stippen wordt telkens groter.' },
  {pat:{t:['5', '9', '13', '17', '41'], f:'4n + 1', ask:['', '1281']}});

NV({ id:'np2', type:'pat', fig:'huis', qty:'aantal lucifers', letter:'l', nlab:'nummer figuur', nletter:'n', cols:[1, 2, 3, 4, 10],
  ask:{lab:'Hoeveel lucifers heb je nodig voor figuur 50?', unit:'lucifers'}, title:'Met lucifers leg je een rij huisjes.' },
  {pat:{t:['6', '11', '16', '21', '51'], f:'5n + 1', ask:['', '251']}});

NV({ id:'np3', type:'pat', fig:'theater', qty:'aantal stoelen', letter:'s', nlab:'nummer patroon', nletter:'n', cols:[1, 2, 3, 4, 10],
  ask:{lab:'Hoeveel stoelen staan er bij patroon 15?', unit:'stoelen'}, title:'In een theaterzaal worden stoelen geplaatst volgens dit patroon.' },
  {pat:{t:['2', '6', '12', '20', '110'], f:'n^2 + n', ask:['', '240']}});

NV({ id:'np4', type:'ctx', title:'Dansgroep',
  intro:'Een dansgroep stelt zich op voor een optreden. Vooraan staan altijd 5 dansers. Daarachter komen `r` rijen van 3 dansers.',
  parts:[{lab:'a) Druk het aantal dansers uit in functie van het aantal rijen `r`.', k:'tr', pre:'aantal dansers =', prePlain:true},
         {lab:'b) Hoeveel dansers zijn er bij 14 rijen?', k:'nf', unit:'dansers'},
         {lab:'c) Kan de groep met precies 40 dansers zo opgesteld worden?', k:'kies', opts:['ja, met 11 rijen', 'ja, met 13 rijen', 'nee, want 40 − 5 = 35 en 35 is geen veelvoud van 3']}] },
  {ctx:['3r + 5', ['', '47'], 2]},
  'Bij 1 rij: 5 + 3. Bij 2 rijen: 5 + 3 · 2. Bij r rijen: …');

/* ---------- 6. herleiden ---------- */
NV({ id:'nh1', type:'koppel', title:'Welke uitkomst hoort bij welke opgave? Herleid eerst.',
  left:['`3k^2 − k + 2k − 2k^2`', '`−k + 4k − 2k^2 + k^2`', '`k − 3k + 2k^2`', '`k^2 − 2k^2 − k`'],
  right:['`k^2 + k`', '`−k^2 − k`', '`2k^2 − 2k`', '`k^2 − k`', '`−k^2 + 3k`', '`−k^2 + k`'] },
  {koppel:[0, 4, 2, 1]},
  'Neem de termen met k² samen en de termen met k samen. Let op het teken vóór elke term.');

NV({ id:'nh2', type:'herlrows', title:'Herleid indien mogelijk. Let op kommagetallen en termen die wegvallen.',
  rows:['0,3t + 1,5t − 0,8t', '−y + y − y − y', '2,5k + 10 − 4k + 3', '6p − 9 − 5p + 4 − p + 5', '0,4m^2 − 0,4m − 0,6m + 0,2m^2', 'a + b + 3b − 4a − b', '3x^2 − 3x'] },
  MAAK.herlrows(['0,3t + 1,5t − 0,8t', '−y + y − y − y', '2,5k + 10 − 4k + 3', '6p − 9 − 5p + 4 − p + 5', '0,4m^2 − 0,4m − 0,6m + 0,2m^2', 'a + b + 3b − 4a − b', '3x^2 − 3x']),
  'Valt alles weg, dan is de uitkomst 0.');

NV({ id:'nh3', type:'ctx', title:'Eerst uitrekenen, dan herleiden',
  intro:'Reken eerst de machten en de vierkantswortels uit. Herleid daarna en rangschik volgens dalende machten.',
  parts:[{lab:'a) `2^3a + 3^2a − √16a`', k:'tr', pre:'=', prePlain:true},
         {lab:'b) `√36x^2 − 2^2x + (−3)^2x − 5x^2`', k:'tr', pre:'=', prePlain:true},
         {lab:'c) `10^2p − 7^2p + √100 − 2^3`', k:'tr', pre:'=', prePlain:true},
         {lab:'d) `−√81k + 4^2 − (−2)^3k − √4`', k:'tr', pre:'=', prePlain:true},
         {lab:'e) `3^2y^2 − √121y + 1^5y^2 + 2^4y`', k:'tr', pre:'=', prePlain:true}] },
  {ctx:['13a', 'x^2 + 5x', '51p + 2', '−k + 14', '10y^2 + 5y']},
  'Bv. 2³ = 8 en √16 = 4, dus 2³a − √16a = 8a − 4a. Let op: (−2)³ = −8 en − (−8)k = + 8k.');

/* ---------- 7. getalwaarde ---------- */
NV({ id:'nw1', type:'gwtabel', expr:'3x^2 − 2', letter:'x', vals:['−2', '−1', '0', '1', '2'], title:'Vul de tabel aan voor `3x^2 − 2`. Wat valt je op?' },
  MAAK.gwtabel('3x^2 − 2', 'x', ['−2', '−1', '0', '1', '2']),
  'Zet een negatief getal tussen haakjes: (−2)² = 4. Reken eerst de macht, dan maal 3, dan min 2.');

NV({ id:'nw2', type:'gw', expr:'−2p^2q^3', vals:{p:'−3', q:'−1'}, title:'Bereken de getalwaarde van `−2p^2q^3` voor `p = −3` en `q = −1`' },
  MAAK.gw('−2p^2q^3', {p:'−3', q:'−1'}),
  '(−3)² = 9 en (−1)³ = −1. Tel daarna het aantal mintekens.');

NV({ id:'nw3', type:'ctx', title:'Een bal omhoog gooien',
  intro:'Je gooit een bal omhoog. De hoogte (in meter) na `t` seconden is de getalwaarde van `−5t^2 + 15t + 2`.',
  parts:[{lab:'a) Hoe hoog is de bal na 1 seconde?', k:'nf', unit:'m'},
         {lab:'b) Hoe hoog is de bal na 2 seconden?', k:'nf', unit:'m'},
         {lab:'c) Wat valt je op?', k:'kies', opts:['de bal is na 1 s en na 2 s even hoog', 'de bal is na 2 s hoger dan na 1 s', 'de bal ligt na 2 s al op de grond']}] },
  {ctx:[['', '12'], ['', '12'], 0]},
  'Vul t = 1 in: −5 · 1² + 15 · 1 + 2. Reken eerst de macht.');

NV({ id:'nw4', type:'ctx', title:'Het ontbrekende getal',
  intro:'Soms ken je de getalwaarde al en zoek je een getal in de uitdrukking.',
  parts:[{lab:'a) De getalwaarde van `ax + 5` voor `x = 3` is 17. Hoe groot is de coëfficiënt `a`?', k:'nf'},
         {lab:'b) De getalwaarde van `−2x^2y` voor `x = −3` is 36. Hoe groot is `y`?', k:'nf'}] },
  {ctx:[['', '4'], ['−', '2']]},
  'Vul in wat je kent: a · 3 + 5 = 17. Welk getal maal 3 geeft 12?');

/* ---------- 8. omtrek als veelterm ---------- */
NV({ id:'no1', type:'omtrek', fig:'ruit', title:'Druk de omtrek van de ruit uit met een eenterm.' }, {omtrek:'12x'});
NV({ id:'no2', type:'omtrek', fig:'trapezium', title:'Druk de omtrek van het gelijkbenig trapezium uit met een veelterm.' }, {omtrek:'2a + 4b + 6'});
NV({ id:'no3', type:'omtrek', fig:'zeshoek', title:'Druk de omtrek van de regelmatige zeshoek uit met een eenterm.' }, {omtrek:'9y'});
NV({ id:'no4', type:'omtrek', fig:'rechthoek2a', title:'Een rechthoek heeft breedte `2a` en lengte `3a + 4`. Druk de omtrek uit met een veelterm.' }, {omtrek:'10a + 8'});
NV({ id:'no5', type:'omtrek', fig:'lvorm', title:'Druk de omtrek van de L-vormige figuur uit met een veelterm. Alle hoeken zijn recht. Twee zijden staan er niet bij: bereken ze eerst.' }, {omtrek:'8x + 6y'},
  'De onderste rand en de binnenste horizontale zijde zijn samen even lang als de bovenkant: x + … = 4x.');

/* ---------- 9. som van veeltermen ---------- */
const HW = (id, g, kort, extra) => NV(Object.assign({ id, type:'hw', g, kort:!!kort, title:'Werk de haakjes weg en herleid.' }, extra || {}), MAAK.hw(g, kort));
HW('ns1', [{t:'3m^2 + 2m − 5'}, {op:'+', t:'−m^2 − 6m + 4'}]);
HW('ns2', [{t:'−7q − 2'}, {op:'+', t:'3q − 8'}]);
HW('ns3', [{t:'0,4n^2 − 0,3n + 0,2'}, {op:'+', t:'−0,1n^2 + 0,3n − 0,5'}], true);
HW('ns4', [{t:'−b^4 − b'}, {op:'+', t:'b^3 − 2b^2'}], true, {title:'Werk de haakjes weg, herleid en rangschik volgens dalende machten.'});

/* ---------- 10. verschil van veeltermen ---------- */
HW('nd1', [{t:'1,5m − 0,2'}, {op:'−', t:'2,5m + 0,6'}], true);
HW('nd2', [{t:'−3a^3 − 2a'}, {op:'−', t:'a^3 − 4a^2'}], true, {title:'Werk de haakjes weg, herleid en rangschik volgens dalende machten.'});
NV({ id:'nd3', type:'koppel', title:'Welke uitwerking hoort bij welke opgave?',
  left:['`(2x − 5) + (x − 3)`', '`(2x − 5) − (x − 3)`', '`(4p + 1) + (−p − 6)`', '`(4p + 1) − (−p − 6)`'],
  right:['`3x − 8`', '`x − 2`', '`x − 8`', '`3p − 5`', '`5p + 7`', '`5p − 5`'] },
  {koppel:[0, 1, 3, 4]}, 'Bij een − voor de haakjes verandert het teken van élke term tussen de haakjes.');
NV({ id:'nd4', type:'bewteken', title:'Vul het juiste bewerkingsteken in: + of −.',
  rows:[['4y^2 + 3y', '−2y^2 + y', '2y^2 + 4y'], ['6b − 1', '−b + 4', '7b − 5'], ['x^2 − 5x', '3x^2 + x', '−2x^2 − 6x'], ['−2k + 9', '−3k − 2', '−5k + 7'], ['a^2 + 2', 'a^2 − 2', '4']] },
  {pm:['+', '−', '−', '+', '−']}, 'Reken beide mogelijkheden uit voor de eerste term en vergelijk met de uitkomst.');

/* ---------- 11. eenterm maal eenterm ---------- */
const MONO1 = [{f:'−5a', t:'3a'}, {f:'2x^2', t:'4x'}, {f:'−y', t:'−6y'}, {f:'7', t:'−2b^2'}, {f:'3m', t:'m^3'}, {f:'−4p^2', t:'−p^2'}];
NV({ id:'nm1', type:'mono', rows:MONO1, title:'Vermenigvuldig de eentermen.' }, MAAK.mono(MONO1));
NV({ id:'nm2', type:'prodtab', rf:['−3', '2a', '−a^2'], cf:['4a', '−5', 'a^3'], title:'Vul de vermenigvuldigtabel aan.' }, MAAK.prodtab(['−3', '2a', '−a^2'], ['4a', '−5', 'a^3']));
const MONO2 = [{f:'3xy', t:'−2x'}, {f:'−ab^2', t:'4a^2b'}, {f:'0,5p', t:'6pq'}, {f:'−2m^2n', t:'−3mn^3'}];
NV({ id:'nm3', type:'mono', rows:MONO2, title:'Vermenigvuldig de eentermen met meer letters.' }, MAAK.mono(MONO2),
  'Vermenigvuldig de getallen. Daarna elke letter apart: x · x = x², b² · b = b³.');
NV({ id:'nm4', type:'isgelijk', title:'Vul in met = of ≠',
  rows:[['3x · 4x', '12x'], ['−2a · 5a^2', '−10a^3'], ['x^2 · x^3', 'x^6'], ['4y · (−y)', '−4y^2'], ['2p + 3p', '6p^2'], ['(−3k) · (−3k)', '9k^2']] },
  {isgelijk:['≠', '=', '≠', '=', '≠', '=']}, 'Bij maal tel je de exponenten op. Bij plus neem je enkel gelijksoortige termen samen en blijft de exponent gelijk.');

/* ---------- 12. distributieve eigenschap ---------- */
const DI1 = [['k', '3p − 2q'], ['3a', 'b − 2c'], ['−2xy', 'x − 3y'], ['5pq', 'p + 2q'], ['−m', 'm^2 − 4m + 1']];
NV({ id:'ndi1', type:'rows', kind:'tr', title:'Werk de haakjes weg.',
  rows:DI1.map(r => ({lab:'`' + r[0] + ' · (' + r[1] + ')`', inner:r[1], dist:{f:r[0], t:r[1]}})) },
  {tr:DI1.map(r => UIT(r[0], r[1]))},
  'Vermenigvuldig de factor voor de haakjes met elke term. Schrijf de letters in alfabetische volgorde.');
const DI2 = [{f:'−0,5', t:'8y^2 − 6y + 2'}];
NV({ id:'ndi2', type:'distr', items:DI2, title:'Werk de haakjes weg: `−0,5 · (8y^2 − 6y + 2)`' }, MAAK.distr(DI2));

/* ---------- 13. distributief en herleiden ---------- */
const DH = (id, items, title) => NV({ id, type:'distr', items, title:'Werk de haakjes weg en herleid: `' + title + '`' }, MAAK.distr(items));
DH('ndh1', [{f:'4', t:'a − 3'}, {op:'−', f:'2', t:'3a − 5'}], '4 · (a − 3) − 2 · (3a − 5)');
DH('ndh2', [{f:'3', t:'2m + 1'}, {op:'−', f:'1', t:'m − 4'}], '3 · (2m + 1) − (m − 4)');
DH('ndh3', [{f:'b', t:'b + 2'}, {op:'−', f:'4', t:'b^2 + b − 3'}], 'b · (b + 2) − 4 · (b^2 + b − 3)');
DH('ndh4', [{f:'−10', t:'2 − x'}, {op:'+', f:'5', t:'4 − 2x'}], '−10 · (2 − x) + 5 · (4 − 2x)');
NV({ id:'ndh5', type:'ctx', title:'Vervolledig zodat de gelijkheid klopt.',
  intro:'Zoek de ontbrekende factor of term. Controleer door uit te werken.',
  parts:[{lab:'a) `3 · (y + 2) − … · (y − 1) = y + 8`', k:'nf'},
         {lab:'b) `5 · (2 − a) + 2 · (a + 3) = …`', k:'tr'},
         {lab:'c) `2 · (k + 4) − 3 · ( … ) = −k + 2`', k:'tr', pre:'( … ) =', prePlain:true}] },
  {ctx:[['', '2'], '−3a + 16', 'k + 2']},
  'Werk uit wat je kent. Wat moet er nog bijkomen of af gaan om de uitkomst rechts te krijgen?');

/* ---------- 14. toepassingen ---------- */
NV({ id:'nt1', type:'ctx', title:'Lijnstuk: bepaal |BC|', seg:{ab:'3x − 1', bc:null, ac:'8x + 4', fB:0.4},
  intro:'Het punt B ligt op het lijnstuk [AC]. Je kent |AB| en |AC|.',
  parts:[{lab:'a) Hoe bereken je |BC|?', k:'kies', opts:['|AB| + |AC|', '|AC| − |AB|', '|AB| − |AC|']},
         {lab:'b) Bepaal |BC| als veelterm in `x`. Werk de haakjes weg en herleid.', k:'tr', pre:'|BC| =', prePlain:true},
         {lab:'c) Hoe lang is [BC] als `x = 3`?', k:'nf'}] },
  {ctx:[1, '5x + 5', ['', '20']]});
NV({ id:'nt2', type:'ctx', title:'Lijnstuk: bepaal |AC|', seg:{ab:'2a + 5', bc:'4a − 1', ac:null, fB:0.42},
  intro:'Het punt B ligt op het lijnstuk [AC]. Je kent |AB| en |BC|.',
  parts:[{lab:'a) Hoe bereken je |AC|?', k:'kies', opts:['|AB| + |BC|', '|AB| − |BC|', '|BC| − |AB|']},
         {lab:'b) Bepaal |AC| als veelterm in `a`.', k:'tr', pre:'|AC| =', prePlain:true}] },
  {ctx:[0, '6a + 4']});
const T3 = [{f:'2a', t:'3a + 4'}];
NV({ id:'nt3', type:'distr', rect:true, items:T3, title:'Een rechthoek heeft breedte `2a` en lengte `3a + 4`. Stel een veelterm op voor de oppervlakte `2a · (3a + 4)`.' }, MAAK.distr(T3));
SVGS.lopp = function(){
  const L = s => esc(s).replace(/([a-z])/g, '<tspan font-style="italic">$1</tspan>');
  let h = '<rect x="40" y="30" width="210" height="140" fill="#e3f3f1" stroke="#127a7f" stroke-width="2.5"/>' +
          '<rect x="250" y="110" width="170" height="60" fill="#fff3d6" stroke="#b86e00" stroke-width="2.5"/>';
  h += '<text x="145" y="108" text-anchor="middle" font-size="22" font-weight="900" fill="#127a7f">①</text><text x="335" y="148" text-anchor="middle" font-size="22" font-weight="900" fill="#b86e00">②</text>';
  const t = (x, y, s) => '<text x="'+x+'" y="'+y+'" text-anchor="middle" font-size="18" font-weight="800" fill="#1d4ed8">'+L(s)+'</text>';
  h += t(145, 22, '3a') + t(18, 106, '2a') + t(335, 196, 'a + 5') + t(438, 146, '4');
  return '<svg class="vis-svg" viewBox="0 0 460 210" style="max-width:460px" aria-label="Figuur uit twee rechthoeken">'+h+'</svg>';
};
NV({ id:'nt4', type:'ctx', svg:'lopp', title:'Oppervlakte van een samengestelde figuur',
  intro:'De figuur bestaat uit twee rechthoeken.',
  parts:[{lab:'a) Oppervlakte van rechthoek ①', k:'tr', pre:'opp. ① =', prePlain:true},
         {lab:'b) Oppervlakte van rechthoek ②: werk de haakjes weg.', k:'tr', pre:'opp. ② =', prePlain:true},
         {lab:'c) Oppervlakte van de hele figuur', k:'tr', pre:'opp. =', prePlain:true}] },
  {ctx:['6a^2', '4a + 20', '6a^2 + 4a + 20']},
  'Rechthoek ① is 3a lang en 2a breed: 3a · 2a. Rechthoek ② is a + 5 lang en 4 breed: 4 · (a + 5).');
NV({ id:'nt5', type:'ctx', title:'Rechthoek in woorden',
  intro:'Een rechthoek is `3x` breed. De lengte is 2 meer dan het dubbel van de breedte.',
  parts:[{lab:'a) Schrijf de lengte als veelterm.', k:'tr', pre:'lengte =', prePlain:true},
         {lab:'b) Stel een veelterm op voor de omtrek. Werk de haakjes weg en herleid.', k:'tr', pre:'omtrek =', prePlain:true},
         {lab:'c) Stel een veelterm op voor de oppervlakte. Werk de haakjes weg.', k:'tr', pre:'oppervlakte =', prePlain:true}] },
  {ctx:['6x + 2', '18x + 4', '18x^2 + 6x']},
  'Het dubbel van de breedte is 2 · 3x = 6x. Omtrek = 2 · lengte + 2 · breedte.');

/* ---------- 15. zoek de fout ---------- */
const OPT_JUIST = {id:'a', text:'Niets, de berekening is juist.'};
NV({ id:'nf1', type:'fout', who:'Emma', work:'−6y + 2y = −8y', title:'Emma herleidde `−6y + 2y`. Kan jij de fout vinden?',
  options:[OPT_JUIST, {id:'b', text:'`−6 + 2` is `−4`, niet `−8`.'}, {id:'c', text:'Ze moest de exponenten optellen: `y^2`.'}, {id:'d', text:'`−6y` en `2y` zijn niet gelijksoortig.'}] },
  {kies:'b', res:'−4y'}, 'Teken een getallenas: van −6 ga je 2 stappen naar rechts.');
NV({ id:'nf2', type:'fout', who:'Noah', work:'(−6)^2 = −36', title:'Noah berekende de getalwaarde van `x^2` voor `x = −6`. Kan jij de fout vinden?',
  options:[OPT_JUIST, {id:'b', text:'`(−6)^2 = (−6) · (−6)` en min maal min is plus.'}, {id:'c', text:'Het kwadraat van 6 is 12.'}, {id:'d', text:'Hij moest de haakjes weglaten.'}] },
  {kies:'b', res:'36'});
NV({ id:'nf3', type:'fout', who:'Fien', work:'4a^2 = (4 · 3)^2 = 144', title:'Fien berekende de getalwaarde van `4a^2` voor `a = 3`. Kan jij de fout vinden?',
  options:[OPT_JUIST, {id:'b', text:'De exponent hoort enkel bij de letter: `4 · 3^2 = 4 · 9`.'}, {id:'c', text:'Ze moest `4 + 3` doen in plaats van `4 · 3`.'}, {id:'d', text:'`12^2` is `24`.'}] },
  {kies:'b', res:'36'});
NV({ id:'nf4', type:'fout', who:'Rune', work:'(3x^2 − x) − (x^2 − 4x) = 2x^2 − 5x', title:'Rune maakte een fout. Kan jij ze vinden?',
  options:[OPT_JUIST, {id:'b', text:'`3x^2` en `x^2` mag je niet samennemen.'}, {id:'c', text:'Hij veranderde het teken van `−4x` niet: `−(−4x) = +4x`.'}, {id:'d', text:'Hij moest enkel het teken van `x^2` veranderen.'}] },
  {kies:'c', res:'2x^2 + 3x'});
NV({ id:'nf5', type:'fout', who:'Ines', work:'2 · (a − 4) − 3 · (a − 1) = −a − 11', title:'Ines maakte een fout. Kan jij ze vinden?',
  options:[OPT_JUIST, {id:'b', text:'`2 · (a − 4)` is `2a − 4`.'}, {id:'c', text:'`−3 · a` is `3a`.'}, {id:'d', text:'`−3 · (−1)` is `+3`: min maal min is plus.'}] },
  {kies:'d', res:'−a − 5'});

/* basketbal (verdieping, foto van de leerkracht) */
NV({ id:'nt6', type:'ctx', img:'basket', imgAlt:'Een jongen gooit een basketbal naar de ring', title:'Basketbal',
  intro:'Bij basketbal levert een gewone korf 2 punten op, een korf van ver 3 punten en een vrijworp 1 punt. Jonas scoort `x` korven van 2 punten, `y` korven van 3 punten en 4 vrijworpen.',
  parts:[{lab:'a) Druk het aantal punten van Jonas uit met een veelterm.', k:'tr', pre:'punten Jonas =', prePlain:true},
         {lab:'b) Hoeveel punten scoort Jonas als `x = 6` en `y = 3`?', k:'nf', unit:'punten'},
         {lab:'c) Bram scoort 2 korven van 2 punten méér en 1 korf van 3 punten minder dan Jonas, en geen vrijworpen. Druk zijn punten uit. Werk de haakjes weg en herleid.', k:'tr', pre:'punten Bram =', prePlain:true},
         {lab:'d) Hoeveel punten scoren Jonas en Bram samen? Herleid.', k:'tr', pre:'samen =', prePlain:true}] },
  {ctx:['2x + 3y + 4', ['', '25'], '2x + 3y + 1', '4x + 6y + 5']},
  'Bram scoort x + 2 korven van 2 punten: dat geeft 2 · (x + 2) punten.');

/* ============================================================
   GENERATOREN (↻ Nieuwe opgave): R is een toevalsgenerator met
   zaadje, dus dezelfde opgave komt terug na herladen.
   Elke generator geeft een vraag terug met q.key (de sleutel).
   ============================================================ */
const LET = ['a', 'b', 'k', 'm', 'p', 't', 'x', 'y'];
const TM = (c, L) => ({c, L:L || {}});
const lt = (l, e) => ({[l]:e});
/* veelterm in één letter: graden is een lijst exponenten, bv. [2,1,0] */
function rndPoly(R, l, graden, max){ return graden.map(e => TM(R.nz(-(max || 9), max || 9), e ? lt(l, e) : {})); }

const GEN = {
  /* herleiden met markeerstiften */
  herl(R){
    const l = R.pick(LET), soort = R.pick([[1, 0], [2, 1], [2, 1, 0]]);
    let ts = [];
    soort.forEach(e => { const n = R.int(2, soort.length === 3 ? 2 : 3); for(let i = 0; i < n; i++) ts.push(TM(R.nz(-9, 9), e ? lt(l, e) : {})); });
    ts = R.shuffle(ts);
    const expr = ALG.fmt(ts);
    return { type:'herl', expr, title:'Herleid ' + M(expr), key:MAAK.herl(expr),
      hint:'Geef termen met hetzelfde lettergedeelte dezelfde kleur. Tel dan de coëfficiënten op.' };
  },
  /* getalwaarde */
  gw(R){
    const l = R.pick(['a', 'x', 'y', 'p']), v = R.nz(-4, 4);
    const vorm = R.pick(['k2', 'k2k', 'k1c', 'k2kc']);
    const g = {k2:[2], k2k:[2, 1], k1c:[1, 0], k2kc:[2, 1, 0]}[vorm];
    const ts = rndPoly(R, l, g, 6), expr = ALG.fmt(ts), vs = (v < 0 ? '−' : '') + Math.abs(v);
    return { type:'gw', expr, vals:{[l]:vs}, title:'Bereken de getalwaarde van ' + M(expr) + ' voor ' + M(l + ' = ' + vs),
      key:MAAK.gw(expr, {[l]:vs}), hint:'Vervang ' + l + ' door (' + vs + '). Reken eerst de machten, dan maal, dan plus en min.' };
  },
  /* som of verschil van twee veeltermen */
  hw(R, op){
    const l = R.pick(LET), g1 = R.pick([[1, 0], [2, 1], [2, 1, 0]]), g2 = R.pick([[1, 0], [2, 1], [2, 0]]);
    const a = ALG.fmt(rndPoly(R, l, g1, 8)), b = ALG.fmt(rndPoly(R, l, g2, 8));
    const g = [{t:a}, {op, t:b}];
    return { type:'hw', g, kort:false, title:op === '+' ? 'Bereken de som en herleid.' : 'Bereken het verschil en herleid.', key:MAAK.hw(g, false),
      hint:op === '+' ? 'Een + voor de haakjes: laat de haakjes weg. Neem daarna de gelijksoortige termen samen.' : 'Een − voor de haakjes: verander het teken van elke term tussen de haakjes.' };
  },
  /* eenterm maal eenterm */
  mono(R){
    const rows = [];
    for(let i = 0; i < 5; i++){
      const l = R.pick(LET), l2 = R.f() < .3 ? R.pick(LET.filter(x => x !== l)) : l;
      const f = ALG.fmt([TM(R.nz(-7, 7), lt(l, R.int(1, 3)))]), t = ALG.fmt([TM(R.nz(-6, 6), R.f() < .2 ? {} : lt(l2, R.int(1, 3)))]);
      rows.push({f, t});
    }
    return { type:'mono', rows, title:'Vermenigvuldig de eentermen.', key:MAAK.mono(rows),
      hint:'Getallen maal getallen, letters maal letters. Zelfde letter: tel de exponenten op.' };
  },
  /* één factor maal een veelterm */
  distr(R){
    const l = R.pick(LET), fe = R.f() < .45 ? 1 : 0;
    const f = ALG.fmt([TM(R.nz(-6, 6), fe ? lt(l, 1) : {})]);
    const t = ALG.fmt(rndPoly(R, l, R.pick([[1, 0], [2, 1], [2, 1, 0]]), 7));
    const items = [{f, t}];
    return { type:'distr', items, title:'Werk de haakjes weg: ' + M(f + ' · (' + t + ')'), key:MAAK.distr(items),
      hint:'Trek een boogje van de factor naar elke term tussen de haakjes. Let op de tekens: min maal min is plus.' };
  },
  /* twee producten en herleiden */
  distrherl(R){
    const l = R.pick(LET), op = R.pick(['+', '−']);
    const f1 = String(R.int(2, 6)), f2 = String(R.int(1, 5));
    const t1 = ALG.fmt(rndPoly(R, l, [1, 0], 7)), t2 = ALG.fmt(rndPoly(R, l, [1, 0], 7));
    const items = [{f:f1, t:t1}, {op, f:f2, t:t2}];
    const txt = f1 + ' · (' + t1 + ') ' + op + ' ' + (f2 === '1' ? '' : f2 + ' · ') + '(' + t2 + ')';
    return { type:'distr', items, title:'Werk de haakjes weg en herleid: ' + M(txt), key:MAAK.distr(items),
      hint:'Werk eerst beide haakjes weg. Let op het teken voor de tweede factor. Neem daarna de gelijksoortige termen samen.' };
  }
};

/* ============================================================
   OPLOSSING INVULLEN, TOON MIJ HOE EN BORDMODUS
   ============================================================ */

/* ---------- de volledige oplossing als antwoord (bordmodus) ---------- */
function VULIN(q){
  const k = SLEUTEL[q.id] || {}, v = defaultVal(q);
  const P = s => tbParse(String(s));
  const N = x => Array.isArray(x) ? P((x[0] === '−' ? '−' : '') + x[1]) : P(x);
  switch(q.type){
    case 'kies': v.choice = k.kies; break;
    case 'fout': v.choice = k.kies; v.res = P(k.res); break;
    case 'sorteer': k.sorteer.forEach((b, i) => { v.a[i] = b; }); break;
    case 'omkring': v.c = k.omkring.map(r => r.slice()); break;
    case 'isgelijk': v.c = k.isgelijk.slice(); break;
    case 'bewteken': v.c = k.pm.map(s => ({s})); break;
    case 'labels': v.c = k.labels.slice(); break;
    case 'koppel': k.koppel.forEach((r, i) => { v.m[i] = r; }); break;
    case 'kleur': v.mk = Object.assign({}, k.mk); break;
    case 'tabel': k.tabel.forEach((kk, i) => { if(kk.t != null) v.r[i].t = P(kk.t); if(kk.c != null) v.r[i].c = P(kk.c); if(kk.l != null) v.r[i].l = P(kk.l); }); break;
    case 'rows': if(k.nat) v.r = k.nat.slice(); else { v.r = k.tr.map(P); if(v.bg) v.bg = q.rows.map(r => r.dist ? parsePoly(r.dist.t).map((t, ti) => ti) : []); } break;
    case 'herlrows': v.r = k.herlrows.map(x => x === null ? {t:TRV(), nh:true} : {t:P(x), nh:false}); break;
    case 'herl': v.mk = Object.assign({}, k.mk); v.res = P(k.res); break;
    case 'hw': { const kk = k.hw; if(kk.tg) Object.keys(kk.tg).forEach(g => { v.tg[g] = kk.tg[g].map(s => ({s})); }); v.hw = kk.hw.map(s => ({s})); v.mk = Object.assign({}, kk.mk); v.res = P(kk.res); break; }
    case 'gw': v.sub = []; parsePoly(q.expr).forEach((t, ti) => (parseLett(t.l) || []).forEach((o, li) => v.sub.push(ti + '.' + li)));
      if(k.gw.tv) v.tv = k.gw.tv.map(N); v.res = N(k.gw.res); break;
    case 'gwtabel': v.r = k.gwtabel.map(N); break;
    case 'mono': v.r = k.mono.map(x => ({g:P(x[0]), l:P(x[1])})); break;
    case 'prodtab': v.r = k.prodtab.map(r => r.map(P)); break;
    case 'distr': { const kk = k.distr; v.bg = Object.keys(kk.pr);
      Object.keys(kk.pr).forEach(p => { const ab = p.split('.').map(Number); v.pr[ab[0]][ab[1]] = P(kk.pr[p]); });
      if(kk.sam != null){ v.sam = P(kk.sam); v.mk = Object.assign({}, kk.mk); } v.res = P(kk.res); break; }
    case 'opp': v.p = k.opp.p.map(P); v.tot = P(k.opp.tot); v.bes = P(k.opp.bes); break;
    case 'omtrek': v.sd = FIGS[q.fig].sides.map((s, i) => i); v.res = P(k.omtrek); break;
    case 'pat': v.t = k.pat.t.slice(); v.f = P(k.pat.f); if(k.pat.ask) v.ask = N(k.pat.ask); if(k.pat.wf != null) v.wf = k.pat.wf; break;
    case 'pira': v.c = k.pira.map(P); break;
    case 'ctx': q.parts.forEach((p, i) => { const kk = k.ctx[i]; v.p[i] = p.k === 'kies' ? kk : (p.k === 'nf' ? N(kk) : P(kk)); }); break;
  }
  return v;
}

/* ---------- toon mij hoe: uitwerking met de getallen van de oefening ---------- */
const TCOL = ['#fde7b0', '#c9eef0', '#f9d3e0', '#dfe8c4'];
const mh = s => mathHTML(s);
const kleurTerm = (t, i, g) => '<span class="tmh-t" style="background:'+TCOL[g % TCOL.length]+'">'+mh(ALG.term(t, i === 0).trim())+'</span>';
function groepTekst(ts){                         /* (2k − 3k + 5k) + (5 + 2 − 6) */
  const g = ALG.groepen(ts), keys = [...new Set(Object.values(g))];
  return keys.map((gk, n) => { const sel = ts.filter((t, i) => g[i] === gk); return '<span class="tmh-t" style="background:'+TCOL[gk % TCOL.length]+'">'+mh(sel.length > 1 ? '(' + ALG.fmt(sel) + ')' : ALG.fmt(sel))+'</span>'; }).join(' ' + mh('+') + ' ');
}
function coefTekst(ts){                          /* (2 − 3 + 5)k + (5 + 2 − 6) */
  const g = ALG.groepen(ts), keys = [...new Set(Object.values(g))];
  return keys.map(gk => {
    const sel = ts.filter((t, i) => g[i] === gk), l = ALG.lk(sel[0]);
    const cs = sel.map((t, i) => (t.c < 0 ? (i ? ' − ' : '−') : (i ? ' + ' : '')) + String(Math.abs(t.c)).replace('.', ',')).join('');
    return '<span class="tmh-t" style="background:'+TCOL[gk % TCOL.length]+'">'+mh(sel.length > 1 ? '(' + cs + ')' + l : ALG.fmt(sel))+'</span>';
  }).join(' ' + mh('+') + ' ');
}
const TMH = {
  herl(q){ const ts = ALG.parse(q.expr), g = ALG.groepen(ts);
    return [
      ['Zoek de gelijksoortige termen. Termen met hetzelfde lettergedeelte krijgen dezelfde kleur. Het teken vóór een term hoort erbij.', ts.map((t, i) => kleurTerm(t, i, g[i])).join(' ')],
      ['Zet de gelijksoortige termen bij elkaar.', groepTekst(ts)],
      ['Tel de coëfficiënten op. Het lettergedeelte blijft hetzelfde.', coefTekst(ts)],
      ['Schrijf de uitkomst volgens dalende machten.', mh(ALG.fmt(ALG.merge(ts)))]
    ]; },
  gw(q){
    const ts = ALG.parse(q.expr), vals = q.vals;
    const fx = c => String(Math.abs(c)).replace('.', ',');
    const metPunt = ts.map((t, i) => { const p = []; if(Math.abs(t.c) !== 1 || !Object.keys(t.L).length) p.push(fx(t.c)); Object.keys(t.L).sort().forEach(l => p.push(l + (t.L[l] > 1 ? '^' + t.L[l] : ''))); return (t.c < 0 ? (i ? ' − ' : '−') : (i ? ' + ' : '')) + p.join(' · '); }).join('');
    const pv = x => { const s = String(x); return s.charAt(0) === '−' || /[\/,]/.test(s) ? '(' + s + ')' : s; };
    const inv = ts.map((t, i) => { const p = []; if(Math.abs(t.c) !== 1 || !Object.keys(t.L).length) p.push(fx(t.c)); Object.keys(t.L).sort().forEach(l => p.push(pv(vals[l]) + (t.L[l] > 1 ? '^' + t.L[l] : ''))); return (t.c < 0 ? (i ? ' − ' : '−') : (i ? ' + ' : '')) + p.join(' · '); }).join('');
    const mach = ts.map((t, i) => { const p = []; if(Math.abs(t.c) !== 1 || !Object.keys(t.L).length) p.push(fx(t.c)); Object.keys(t.L).sort().forEach(l => { const w = Math.pow(ALG.getal(vals[l]), t.L[l]); p.push(w < 0 ? '(−' + fx(w) + ')' : fx(w)); }); return (t.c < 0 ? (i ? ' − ' : '−') : (i ? ' + ' : '')) + p.join(' · '); }).join('');
    const w = ts.map(t => ALG.waarde(t, vals)), som = w.reduce((a, b) => a + b, 0);
    const per = w.map((x, i) => (x < 0 ? (i ? ' − ' : '−') : (i ? ' + ' : '')) + fx(x)).join('');
    const st = [
      ['Schrijf de verborgen maaltekens erbij.', mh(metPunt)],
      ['Vervang elke letter door haar getal. Zet een negatief getal tussen haakjes.', mh(inv)],
      ['Reken eerst de machten uit.', mh(mach)]
    ];
    if(ts.length > 1) st.push(['Vermenigvuldig in elke term.', mh(per)]);
    st.push(['Reken uit.', mh('= ' + (som < 0 ? '−' : '') + fx(som))]);
    return st; },
  hw(q){
    const flat = []; q.g.forEach(gr => { const ts = ALG.parse(gr.t); (gr.op === '−' ? ts.map(ALG.neg) : ts).forEach(t => flat.push(t)); });
    const g = ALG.groepen(flat), heeftMin = q.g.some(gr => gr.op === '−');
    return [
      ['Werk de haakjes weg.' + (heeftMin ? ' Staat er een − voor de haakjes, dan verander je het teken van élke term tussen die haakjes.' : ' Een + voor de haakjes: je laat de haakjes gewoon weg.'), mh(ALG.fmt(flat))],
      ['Zoek de gelijksoortige termen en zet ze bij elkaar.', groepTekst(flat)],
      ['Tel de coëfficiënten op.', coefTekst(flat)],
      ['Schrijf de uitkomst volgens dalende machten.', mh(ALG.fmt(ALG.merge(flat)))]
    ]; },
  distr(q){
    const st = [], sam = [];
    q.items.forEach((it, pi) => {
      const s = it.op === '−' ? -1 : 1;
      if(it.loose){ ALG.parse(it.loose).forEach(t => sam.push({c:s * t.c, L:t.L})); return; }
      const fT = ALG.parse(it.f)[0], f = {c:s * fT.c, L:fT.L}, fs = ALG.fmt([f]);
      const pr = ALG.parse(it.t).map(t => { const p = ALG.mul(f, t); sam.push(p); const ts = ALG.fmt([t]); return mh((fs === '−1' ? '−1' : fs) + ' · ' + (t.c < 0 ? '(' + ts + ')' : ts) + ' = ' + ALG.fmt([p])); });
      st.push(['Vermenigvuldig ' + mh(fs) + ' met elke term tussen de haakjes.', pr.join('<br>')]);
    });
    if(q.items.length > 1){ st.push(['Schrijf alle termen na elkaar.', mh(ALG.fmt(sam))]); st.push(['Neem de gelijksoortige termen samen.', coefTekst(sam)]); }
    st.push(['Uitkomst', mh(ALG.fmt(ALG.merge(sam)))]);
    return st; },
  mono(q){
    return q.rows.slice(0, 3).map((r, i) => {
      const a = ALG.parse(r.f)[0], b = ALG.parse(r.t)[0], p = ALG.mul(a, b);
      const cs = (x => x < 0 ? '(−' + String(-x).replace('.', ',') + ')' : String(x).replace('.', ','));
      const lts = [ALG.lk(a), ALG.lk(b)].filter(Boolean);
      return [String.fromCharCode(97 + i) + ') Getallen maal getallen, letters maal letters. Zelfde letter: tel de exponenten op.',
        mh('(' + cs(a.c) + ' · ' + cs(b.c) + ') · (' + (lts.join(' · ') || '1') + ') = ' + ALG.fmt([p]))];
    }); }
};
TMH.herlrows = q => q.rows.slice(0, 4).map((r, i) => { const ts = ALG.parse(r); return [String.fromCharCode(97 + i) + ') ' + (ALG.kanHerleid(ts) ? 'Neem de gelijksoortige termen samen.' : 'Geen gelijksoortige termen: je kan niet herleiden.'), mh(r + ' = ' + (ALG.kanHerleid(ts) ? ALG.fmt(ALG.merge(ts)) : r))]; });

/* het paneel met de stappen; open(n) toont de eerste n stappen */
function tmhPaneel(body, q){
  const stappen = TMH[q.type](q), p = el('div', 'tmh'); p.hidden = true;
  const lijst = el('ol', 'tmh-lijst'), bar = el('div', 'tmh-bar');
  const vlg = el('button', 'btn', 'Volgende stap ▶'), opn = el('button', 'btn ghost', '↺ Van voor af aan'), sl = el('button', 'btn ghost', '✕ Sluiten');
  [vlg, opn, sl].forEach(b => { b.type = 'button'; });
  bar.append(vlg, opn, sl); p.append(el('div', 'tmh-kop', icon('play') + 'Zo los je het op, met de getallen van deze oefening'), lijst, bar);
  let n = 0;
  const teken = () => {
    lijst.innerHTML = ''; stappen.slice(0, n).forEach((s, i) => { const li = el('li', i === n - 1 ? 'nieuw' : '', '<div class="tmh-uitleg">'+s[0]+'</div><div class="tmh-wis mhead">'+s[1]+'</div>'); lijst.append(li); });
    vlg.disabled = n >= stappen.length; vlg.innerHTML = n >= stappen.length ? 'Klaar ✓' : 'Volgende stap ▶';
  };
  const api = { el:p, aantal:stappen.length, open(k){ p.hidden = false; n = Math.max(1, Math.min(k == null ? 1 : k, stappen.length)); teken(); }, sluit(){ p.hidden = true; n = 0; } };
  vlg.addEventListener('click', () => { if(n < stappen.length){ n++; teken(); } });
  opn.addEventListener('click', () => { n = 1; teken(); });
  sl.addEventListener('click', () => api.sluit());
  body.append(p);
  return api;
}

/* ---------- extra knoppen per kaart (Toon mij hoe) ---------- */
function voegExtrasToe(body, q, card){
  const kaart = body.closest('.card'); if(!kaart) return;
  kaart._q = q;
  if(!TMH[q.type]) return;
  const slot = body.querySelector('[data-r="extra"]'); if(!slot) return;
  const api = tmhPaneel(body, q); kaart._tmh = api;
  const b = el('button', 'btn ghost tmh-btn', icon('play') + 'Toon mij hoe'); b.type = 'button';
  b.addEventListener('click', () => { if(api.el.hidden){ api.open(1); api.el.scrollIntoView({behavior:'smooth', block:'nearest'}); } else api.sluit(); });
  slot.append(b);
}

/* ---------- bordmodus: één kaart groot, oplossing stap voor stap ---------- */
let BORD = null;
function aqVan(kaart){ const r = kaart.querySelector('.aq'); return AQS.filter(c => c.root === r)[0]; }
function bordOpen(kaart){
  if(BORD) bordSluit();
  const c0 = aqVan(kaart); if(!c0) return;
  const thuis = {ouder:kaart.parentElement, volgende:kaart.nextSibling};
  const ov = el('div', 'bord'); ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-label', 'Bordmodus');
  const bar = el('div', 'bord-bar'), cnt = el('span', 'bord-cnt');
  const vorige = el('button', 'btn ghost', '◀ Vorige stap'), volgende = el('button', 'btn', 'Volgende stap ▶'), sluit = el('button', 'btn ghost', '✕ Sluiten');
  [vorige, volgende, sluit].forEach(b => { b.type = 'button'; });
  bar.append(cnt, vorige, volgende, sluit); ov.append(bar, kaart); document.body.append(ov);
  /* stappen: hint, de stappen van Toon mij hoe, de volledige oplossing */
  const c = aqVan(kaart), q = c.q, stappen = [];
  if(hintText(q)) stappen.push('hint');
  if(kaart._tmh) for(let i = 1; i <= kaart._tmh.aantal; i++) stappen.push('tmh' + i);
  stappen.push('opl');
  const bewaard = {val:c.st.val, check:c.st.check, sol:c.st.sol};
  let k = 0;
  function zet(){
    const c2 = aqVan(kaart);
    withCard(c2, () => { ui.hintOn = stappen.slice(0, k).indexOf('hint') >= 0; });
    const t = stappen.slice(0, k).filter(s => /^tmh/.test(s)).length;
    if(kaart._tmh){ if(t) kaart._tmh.open(t); else kaart._tmh.sluit(); }
    const opl = stappen.slice(0, k).indexOf('opl') >= 0;
    if(opl){ c2.st.val = VULIN(q); c2.st.check = verbeter(q, withCard(c2, () => getVal(q))); c2.st.sol = true; c2.locked = true; }
    else { c2.st.val = bewaard.val; c2.st.check = bewaard.check; c2.st.sol = bewaard.sol; c2.locked = false; }
    renderCard(c2); withCard(c2, () => { if(c2.afterDraw) c2.afterDraw(); drawVbRings(); });
    cnt.textContent = 'Oplossing: stap ' + k + ' van ' + stappen.length + (k ? ' · ' + ({hint:'hint', opl:'volledige oplossing'}[stappen[k - 1]] || 'toon mij hoe') : '');
    vorige.disabled = k === 0; volgende.disabled = k >= stappen.length;
    const doel = opl ? kaart.querySelector('.vb') : (t ? kaart._tmh.el : kaart.querySelector('.hintbox'));
    if(doel) doel.scrollIntoView({block:'center', behavior:'smooth'});
  }
  volgende.addEventListener('click', () => { if(k < stappen.length){ k++; zet(); } });
  vorige.addEventListener('click', () => { if(k > 0){ k--; zet(); } });
  sluit.addEventListener('click', () => bordSluit());
  const toets = e => { if(e.key === 'Escape'){ bordSluit(); return; } if(e.target.closest && e.target.closest('input, textarea, [contenteditable], .mq-editable-field')) return;
    if(e.key === 'ArrowRight' || e.key === 'PageDown'){ e.preventDefault(); volgende.click(); } else if(e.key === 'ArrowLeft' || e.key === 'PageUp'){ e.preventDefault(); vorige.click(); } };
  document.addEventListener('keydown', toets);
  const html = document.documentElement, fs0 = html.style.fontSize; html.style.fontSize = window.innerWidth > 900 ? '140%' : '115%';
  document.body.style.overflow = 'hidden';
  BORD = {kaart, thuis, ov, toets, fs0, herstel:() => { const c2 = aqVan(kaart); if(!c2) return; c2.st.val = bewaard.val; c2.st.check = bewaard.check; c2.st.sol = bewaard.sol; c2.locked = false; withCard(c2, () => { ui.hintOn = false; }); if(kaart._tmh) kaart._tmh.sluit(); renderCard(c2); }};
  try{ if(ov.requestFullscreen && window.innerWidth > 900) ov.requestFullscreen().catch(() => {}); }catch(e){}
  zet(); sluit.focus();
  setTimeout(hertekenAQ, 60);
}
function bordSluit(){
  const B = BORD; if(!B) return; BORD = null;
  document.removeEventListener('keydown', B.toets);
  try{ if(document.fullscreenElement) document.exitFullscreen().catch(() => {}); }catch(e){}
  document.documentElement.style.fontSize = B.fs0; document.body.style.overflow = '';
  if(B.thuis.volgende && B.thuis.volgende.parentElement === B.thuis.ouder) B.thuis.ouder.insertBefore(B.kaart, B.thuis.volgende); else B.thuis.ouder.append(B.kaart);
  B.ov.remove(); B.herstel(); B.kaart.scrollIntoView({block:'start'});
  setTimeout(hertekenAQ, 60);
  const bb = B.kaart.querySelector('.bord-btn'); if(bb) bb.focus({preventScroll:true});
}

/* ============================================================
   ONDERDELEN (volgorde van het handboek)
   Kaart: K(vraag-id, niveau) uit Q, of G(niveau, generator).
   Nieuwe kaarten ALTIJD achteraan een onderdeel toevoegen: de
   opslagsleutel is onderdeel-id + kaartnummer.
   ============================================================ */
const K = (id, lvl) => ({ lvl, q:Q[id] });
const G = (lvl, gen) => ({ lvl, gen });
const SEC = {};
const ORDER = ['letters','eentermen','gelijksoortig','veeltermen','patronen','herleiden','getalwaarde','omtrek',
               'som','verschil','maal','distr','distrherl','toepassingen','fout','quiz','toets1','toets2','toets3','nadetoets'];

SEC.letters = { id:'letters', nav:'Letters gebruiken', title:'Letters gebruiken', ic:'letter',
  tip:'Een letter staat voor een getal dat je (nog) niet kent. Lees de situatie traag en vraag je af: waar staat de letter voor?',
  cards:[ K('ex01',1), K('ex64',2), K('ex69',2), K('nl1',2), K('nl2',2), K('nl3',2), K('nl4',3) ] };

SEC.eentermen = { id:'eentermen', nav:'Eentermen', title:'Eentermen', ic:'eenterm',
  tip:'Een eenterm is een getal maal letters, zoals <i>−7a²b</i>. Het getal is de <b>coëfficiënt</b>, de letters met hun exponenten vormen het <b>lettergedeelte</b>.',
  cards:[ K('ex05',1), K('ex06',2), K('ex07',2), K('ex08',2), K('ex61',2), K('ex14',2), K('ex16',2), K('ne1',2), K('ne2',3) ] };

SEC.gelijksoortig = { id:'gelijksoortig', nav:'Gelijksoortige eentermen', title:'Gelijksoortige eentermen', ic:'gelijk',
  tip:'Gelijksoortige eentermen hebben hetzelfde lettergedeelte: dezelfde letters met dezelfde exponenten. Het getal ervoor mag verschillen.',
  cards:[ K('ex09',1), K('ex10',2), K('ex11',2), K('ex62',2), K('ng1',2), K('ng2',2), K('ng3',2), K('ng4',2), K('ng5',3) ] };

SEC.veeltermen = { id:'veeltermen', nav:'Veeltermen en graad', title:'Veeltermen en graad', ic:'veelterm',
  tip:'Een veelterm is een som van eentermen. Met 1 term heb je een eenterm, met 2 termen een tweeterm, met 3 termen een drieterm.',
  cards:[ K('ex13',1), K('nv1',2), K('nv2',2), K('nv3',2), K('nv4',2), K('nv5',3), K('ex12',2) ] };

SEC.patronen = { id:'patronen', nav:'Patronen en formules', title:'Patronen en formules', ic:'patroon',
  tip:'Zoek wat er telkens bijkomt. Dat getal staat in de formule voor de letter.',
  cards:[ K('ex17',1), K('ex18',2), K('ex19',2), K('np1',2), K('np2',2), K('np3',3), K('np4',3) ] };

SEC.herleiden = { id:'herleiden', nav:'Herleiden', title:'Herleiden', ic:'herleid',
  tip:'Herleiden = gelijksoortige eentermen samennemen. Je telt de coëfficiënten op, het lettergedeelte blijft hetzelfde.',
  cards:[ K('ex21',1), K('ex65',2), K('ex22',2), K('ex23',2), K('ex24',2), K('ex25',3), K('ex26',3), K('ex63',2), K('ex27',2), G(2, GEN.herl), K('nh1',3), K('nh2',3), K('nh3',3) ] };

SEC.getalwaarde = { id:'getalwaarde', nav:'Getalwaarde', title:'Getalwaarde', ic:'getal',
  tip:'Vervang elke letter door haar waarde. Zet een negatief getal tussen haakjes. Reken eerst de machten, dan vermenigvuldigen, dan optellen en aftrekken.',
  cards:[ K('ex28',1), K('ex66',2), K('ex29',2), K('ex30',2), K('ex31',3), K('ex32',2), G(2, GEN.gw), K('nw1',2), K('nw3',2), K('nw2',3), K('nw4',3) ] };

SEC.omtrek = { id:'omtrek', nav:'Omtrek als veelterm', title:'Omtrek als veelterm', ic:'omtrek',
  tip:'De omtrek is de som van de lengtes van alle zijden. Zijden met evenveel streepjes zijn even lang.',
  cards:[ K('ex68',1), K('ex67',2), K('ex56',2), K('no1',1), K('no2',2), K('no3',2), K('no4',2), K('no5',3) ] };

SEC.som = { id:'som', nav:'Som van veeltermen', title:'Som van veeltermen', ic:'som',
  tip:'Staat er een + voor de haakjes, dan laat je de haakjes gewoon weg. Daarna herleid je.',
  cards:[ K('sv01',1), K('sv02',2), K('sv03',2), K('ns1',2), K('ns2',2), G(2, R=>GEN.hw(R,'+')), K('ns3',3), K('ns4',3) ] };

SEC.verschil = { id:'verschil', nav:'Verschil van veeltermen', title:'Verschil van veeltermen', ic:'verschil',
  tip:'Staat er een − voor de haakjes, dan verander je het teken van <b>elke</b> term tussen de haakjes.',
  cards:[ K('sv04',1), K('sv05',2), K('sv06',2), K('sv07',2), K('sv08',2), K('sv09',3), K('sv10',2), K('sv11',2), G(2, R=>GEN.hw(R,'−')), K('nd4',2), K('nd1',3), K('nd2',3), K('nd3',3) ] };

SEC.maal = { id:'maal', nav:'Eenterm maal eenterm', title:'Eenterm maal eenterm', ic:'maal',
  tip:'Vermenigvuldig de getallen met elkaar en de letters met elkaar. Zelfde letter: tel de exponenten op.',
  cards:[ K('sv12',1), K('sv13',2), K('nm1',2), K('nm2',2), G(2, GEN.mono), K('nm4',2), K('nm3',3) ] };

SEC.distr = { id:'distr', nav:'Distributieve eigenschap', title:'Distributieve eigenschap', ic:'distr',
  tip:'Vermenigvuldig de factor voor de haakjes met <b>elke</b> term tussen de haakjes: <i>a</i> · (<i>b</i> + <i>c</i>) = <i>a</i> · <i>b</i> + <i>a</i> · <i>c</i>.',
  cards:[ K('sv14',1), K('sv15',2), K('sv16',2), K('sv17',2), K('sv18',2), K('sv19',2), K('sv20',2), K('sv21',2), G(2, GEN.distr), K('ndi1',3), K('ndi2',3) ] };

SEC.distrherl = { id:'distrherl', nav:'Distributief en herleiden', title:'Distributief en herleiden', ic:'distr',
  tip:'Werk eerst alle haakjes weg. Neem daarna de gelijksoortige eentermen samen.',
  cards:[ K('sv22',1), K('sv23',2), K('sv24',2), K('sv25',2), K('sv26',3), K('ndh1',2), K('ndh2',2), G(2, GEN.distrherl), K('ndh3',3), K('ndh4',3), K('ndh5',3) ] };

SEC.toepassingen = { id:'toepassingen', nav:'Toepassingen', title:'Toepassingen', ic:'toep',
  tip:'Teken of bekijk de figuur goed. Schrijf eerst de bewerking met haakjes en werk daarna uit.',
  cards:[ K('sv29',1), K('sv30',1), K('sv27',2), K('sv28',2), K('sv31',2), K('sv32',2), K('nt1',2), K('nt2',2), K('nt3',2), K('nt4',3), K('nt5',3), K('nt6',3) ] };

SEC.fout = { id:'fout', nav:'Zoek de fout', title:'Zoek de fout', ic:'fout',
  tip:'Een klasgenoot maakte een fout. Zoek wat er misging en schrijf het juiste antwoord.',
  cards:[ K('ex58',1), K('sv33',2), K('sv34',2), K('sv35',2), K('sv36',2), K('nf1',2), K('nf2',2), K('nf3',2), K('nf4',3), K('nf5',3) ] };

/* ============================================================
   SNELLE QUIZ: 10 vragen in 3 minuten, telt niet mee
   Vraagsoorten: ch (kiezen), num (getal), expr (eenterm of veelterm)
   ============================================================ */
const QZ = {
  ch:(q, opts, ans, show) => ({kind:'ch', q, opts, ans, show}),
  num:(q, ans, show) => ({kind:'num', q, ans, show:show || String(ans).replace('.', ',').replace('-', '−')}),
  expr:(q, ans) => ({kind:'expr', q, ans, show:ans})
};
const mq = s => '<span class="mhead qz-m">' + mathHTML(s) + '</span>';
const QUIZ = {
  eentermen:[
    R => { const l = R.pick(LET), t = {c:R.nz(-12, 12), L:{[l]:R.int(1, 4)}}; if(R.f() < .2) t.c = R.pick([1, -1]); const s = ALG.fmt([t]);
      return QZ.num('Wat is de <b>coëfficiënt</b> van ' + mq(s) + '?', t.c); },
    R => { const a = R.pick(['a', 'x', 'p']), b = R.pick(['b', 'y', 'q']), ea = R.int(1, 4), eb = R.int(1, 4), w = R.pick([a, b]); const s = ALG.fmt([{c:R.nz(-9, 9), L:{[a]:ea, [b]:eb}}]);
      return QZ.num('Wat is de <b>graad</b> van ' + mq(s) + ' in de letter ' + mq(w) + '?', w === a ? ea : eb); },
    R => { const l = R.pick(LET), e = R.int(1, 3), ja = R.f() < .5, e2 = ja ? e : (e === 1 ? 2 : e - 1);
      const c1 = R.nz(-9, 9); let c2 = R.nz(-9, 9); if(c2 === c1) c2 = -c1;
      const s1 = ALG.fmt([{c:c1, L:{[l]:e}}]), s2 = ALG.fmt([{c:c2, L:{[l]:e2}}]);
      return QZ.ch('Zijn ' + mq(s1) + ' en ' + mq(s2) + ' gelijksoortig?', [['j', 'ja'], ['n', 'nee']], ja ? 'j' : 'n', ja ? 'ja' : 'nee'); },
    R => { const l = R.pick(LET), ts = [0, 1, 2].slice(0, R.int(2, 3)).map(() => ({c:R.nz(-9, 9), L:{[l]:1}})); const e = ALG.fmt(ts);
      return QZ.expr('Herleid: ' + mq(e), ALG.fmt(ALG.merge(ts))); },
    R => { const l = R.pick(LET), a = R.nz(-9, 9); let d = R.nz(-9, 9); if(a + d === 0) d = -2 * a;
      return QZ.expr('Vul aan: ' + mq(ALG.fmt([{c:a, L:{[l]:2}}]) + ' + … = ' + ALG.fmt([{c:a + d, L:{[l]:2}}])), ALG.fmt([{c:d, L:{[l]:2}}])); },
    R => { const n = R.int(1, 3), l = R.pick(LET); const ts = [2, 1, 0].slice(0, n).map(e => ({c:R.nz(-7, 7), L:e ? {[l]:e} : {}})); const nm = ['eenterm', 'tweeterm', 'drieterm'];
      return QZ.ch(mq(ALG.fmt(ts)) + ' is een …', nm.map((x, i) => [String(i), x]), String(n - 1), nm[n - 1]); }
  ],
  getalwaarde:[
    R => { const l = R.pick(['x', 'a', 'y']), v = R.nz(-5, 5), c = R.nz(-6, 6); const s = ALG.fmt([{c, L:{[l]:1}}]);
      return QZ.num('Getalwaarde van ' + mq(s) + ' voor ' + mq(l + ' = ' + String(v).replace('-', '−')) + '?', c * v); },
    R => { const l = R.pick(['x', 'a', 'y']), v = R.nz(-5, 5);
      return QZ.num('Getalwaarde van ' + mq(l + '^2') + ' voor ' + mq(l + ' = ' + String(v).replace('-', '−')) + '?', v * v); },
    R => { const l = R.pick(['x', 'a', 'y']), v = R.nz(-4, 4), c = R.pick([-1, 2, -2, 3, -3]); const s = ALG.fmt([{c, L:{[l]:2}}]);
      return QZ.num('Getalwaarde van ' + mq(s) + ' voor ' + mq(l + ' = ' + String(v).replace('-', '−')) + '?', c * v * v); },
    R => { const v = R.nz(-4, 4), a = R.nz(-5, 5), b = R.nz(-9, 9); const s = ALG.fmt([{c:a, L:{x:1}}, {c:b, L:{}}]);
      return QZ.num('Getalwaarde van ' + mq(s) + ' voor ' + mq('x = ' + String(v).replace('-', '−')) + '?', a * v + b); },
    R => { const a = R.int(2, 6), b = R.int(1, 5), n = R.pick([10, 20, 25, 50, 100]);
      return QZ.num('Bij een patroon geldt ' + mq('s = ' + a + 'n + ' + b) + '. Hoeveel is ' + mq('s') + ' bij figuur ' + n + '?', a * n + b); },
    R => { const x = R.int(2, 9), y = R.nz(-4, 4); return QZ.num('Getalwaarde van ' + mq('xy') + ' voor ' + mq('x = ' + x) + ' en ' + mq('y = ' + String(y).replace('-', '−')) + '?', x * y); }
  ],
  rekenen:[
    R => { const l = R.pick(LET), a = {c:R.nz(-7, 7), L:{[l]:R.int(1, 2)}}, b = {c:R.nz(-6, 6), L:{[l]:R.int(1, 3)}}; const bs = ALG.fmt([b]);
      return QZ.expr('Bereken: ' + mq(ALG.fmt([a]) + ' · ' + (b.c < 0 ? '(' + bs + ')' : bs)), ALG.fmt([ALG.mul(a, b)])); },
    R => { const l = R.pick(LET), ts = [{c:R.nz(-7, 7), L:{[l]:1}}, {c:R.nz(-9, 9), L:{}}];
      return QZ.expr('Werk de haakjes weg: ' + mq('−(' + ALG.fmt(ts) + ')'), ALG.fmt(ts.map(ALG.neg))); },
    R => { const l = R.pick(LET), f = R.nz(-5, 5), ts = [{c:R.nz(-6, 6), L:{[l]:1}}, {c:R.nz(-9, 9), L:{}}]; const fT = {c:f, L:{}};
      return QZ.expr('Werk de haakjes weg: ' + mq(String(f).replace('-', '−') + ' · (' + ALG.fmt(ts) + ')'), ALG.fmt(ts.map(t => ALG.mul(fT, t)))); },
    R => { const l = R.pick(LET), f = {c:R.nz(-4, 4), L:{[l]:1}}, ts = [{c:R.nz(-5, 5), L:{[l]:1}}, {c:R.nz(-9, 9), L:{}}];
      return QZ.expr('Werk de haakjes weg: ' + mq(ALG.fmt([f]) + ' · (' + ALG.fmt(ts) + ')'), ALG.fmt(ts.map(t => ALG.mul(f, t)))); },
    R => { const l = R.pick(LET), op = R.pick(['+', '−']); const A = [{c:R.nz(-8, 8), L:{[l]:1}}, {c:R.nz(-9, 9), L:{}}], B = [{c:R.nz(-8, 8), L:{[l]:1}}, {c:R.nz(-9, 9), L:{}}];
      return QZ.expr('Werk uit: ' + mq('(' + ALG.fmt(A) + ') ' + op + ' (' + ALG.fmt(B) + ')'), ALG.fmt(ALG.merge(A.concat(op === '+' ? B : B.map(ALG.neg))))); },
    R => { const l = R.pick(LET), op = R.pick(['+', '−']); const A = [{c:R.nz(-8, 8), L:{[l]:1}}, {c:R.nz(-9, 9), L:{}}], B = [{c:R.nz(-8, 8), L:{[l]:1}}, {c:R.nz(-9, 9), L:{}}];
      const res = ALG.fmt(ALG.merge(A.concat(op === '+' ? B : B.map(ALG.neg))));
      return QZ.ch('Welk teken hoort op de puntjes? ' + mq('(' + ALG.fmt(A) + ') … (' + ALG.fmt(B) + ') = ' + res), [['+', '+'], ['−', '−']], op, op); }
  ]
};
function quizKaart(gens){ return (b, st, save) => {
  const N = 10, T = 180, root = el('div', 'qz'); b.append(root);
  let timer = null; const stop = () => { if(timer){ clearInterval(timer); timer = null; } };
  const mm = s => Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
  function intro(){
    stop(); root.innerHTML = '';
    root.append(el('p', 'qz-intro', N + ' vragen, ' + mm(T) + ' minuten. Hoeveel krijg jij juist? Deze quiz telt niet mee.'));
    if(st.best) root.append(el('p', 'qz-sub', 'Jouw beste score: <b>' + st.best.score + ' / ' + N + '</b>' + (st.best.time != null ? ' in ' + mm(st.best.time) : '') + '.'));
    const go = el('button', 'btn', '▶ Start de quiz'); go.type = 'button'; go.addEventListener('click', run); root.append(go);
  }
  function run(){
    stop(); root.innerHTML = '';
    const R = makeR({seed:1 + Math.floor(Math.random() * 2e9)});
    const order = []; while(order.length < N) R.shuffle(gens.map((g, i) => i)).forEach(i => { if(order.length < N) order.push(i); });
    const Q = []; order.forEach(i => { let q, t = 0; do{ q = gens[i](R); }while(t++ < 20 && Q.some(x => x.q === q.q)); Q.push(q); });
    const top = el('div', 'qz-top'), klok = el('span', 'qz-klok', mm(T)), prog = el('span'), sc = el('span');
    top.append(klok, prog, sc);
    const balk = el('div', 'qz-balk', '<span style="width:100%"></span>'), vak = el('div', 'qz-vak'), fb = el('div', 'fb');
    root.append(top, balk, vak, fb);
    let k = 0, score = 0, over = T, bezig = false; const mis = [], t0 = Date.now();
    timer = setInterval(() => { if(!root.isConnected){ stop(); return; } over--; klok.textContent = mm(Math.max(0, over)); klok.classList.toggle('laag', over <= 20); balk.firstChild.style.width = Math.max(0, over / T * 100) + '%'; if(over <= 0) einde(true); }, 1000);
    function toon(){
      bezig = false; fb.className = 'fb'; fb.textContent = '';
      prog.textContent = 'Vraag ' + (k + 1) + ' / ' + N; sc.textContent = '✓ ' + score;
      const q = Q[k]; vak.innerHTML = ''; vak.append(el('div', 'qz-q', q.q));
      const ant = el('div', 'qz-ant'); vak.append(ant);
      if(q.kind === 'ch') q.opts.forEach(o => { const bt = el('button', 'btn ghost qz-opt', o[1]); bt.type = 'button'; bt.addEventListener('click', () => antwoord(o[0], bt)); ant.append(bt); });
      else {
        const inp = el('input', 'qz-inp'); inp.type = 'text'; inp.autocomplete = 'off'; inp.setAttribute('aria-label', 'antwoord'); inp.placeholder = q.kind === 'expr' ? 'bv. 3x^2 − 2x' : 'getal';
        const ok = el('button', 'btn', 'OK'); ok.type = 'button'; ant.append(inp, ok);
        const go = () => { if(!inp.value.trim()){ fb.className = 'fb'; fb.textContent = 'Vul eerst je antwoord in.'; return; } antwoord(inp.value); };
        ok.addEventListener('click', go); inp.addEventListener('keydown', e => { if(e.key === 'Enter'){ e.preventDefault(); go(); } });
        inp.focus({preventScroll:true});
      }
    }
    function antwoord(v, bt){
      if(bezig) return; bezig = true; const q = Q[k];
      let goed;
      if(q.kind === 'ch') goed = v === q.ans;
      else if(q.kind === 'num') goed = Math.abs(ALG.getal(String(v).replace(/\s/g, '')) - q.ans) < 1e-9;
      else { try{ goed = eqPoly(tbParse(String(v)), q.ans); }catch(e){ goed = false; } }
      if(goed) score++; else mis.push(q);
      if(bt) bt.classList.add(goed ? 'goed' : 'fout');
      vak.querySelectorAll('input, button').forEach(x => { x.disabled = true; });
      fb.className = 'fb ' + (goed ? 'ok' : 'bad'); fb.innerHTML = goed ? 'Juist!' : 'Juist was: ' + (q.kind === 'expr' ? mq(q.show) : '<b>' + q.show + '</b>');
      sc.textContent = '✓ ' + score;
      setTimeout(() => { if(!timer) return; k++; if(k >= N) einde(false); else toon(); }, goed ? 700 : 2000);
    }
    function einde(tijdOm){
      if(!timer && !tijdOm) return; stop(); const gebruikt = Math.min(T, Math.round((Date.now() - t0) / 1000));
      const best = !st.best || score > st.best.score || (score === st.best.score && gebruikt < (st.best.time || 1e9));
      if(best){ st.best = {score, time:tijdOm ? null : gebruikt}; save(); }
      root.innerHTML = '';
      root.append(el('div', 'qz-groot', score + ' / ' + N));
      root.append(el('p', '', (tijdOm ? 'De tijd is om. ' : 'Klaar in ' + mm(gebruikt) + '. ') + (best && score > 0 ? 'Dat is jouw beste score!' : 'Jouw beste score: ' + st.best.score + ' / ' + N + '.')));
      if(mis.length){ root.append(el('p', 'qz-sub', 'Dit ging nog mis:')); const ul = el('ul', 'qz-mis'); mis.forEach(q => ul.append(el('li', '', q.q + ' → ' + (q.kind === 'expr' ? mq(q.show) : '<b>' + q.show + '</b>')))); root.append(ul); }
      if(tijdOm && k < N) root.append(el('p', 'qz-sub', (N - k) + ' vragen kwamen niet meer aan bod.'));
      const nog = el('button', 'btn', '↻ Nog eens'); nog.type = 'button'; nog.addEventListener('click', run); root.append(nog);
    }
    toon();
  }
  intro();
}; }
SEC.quiz = { id:'quiz', nav:'Snelle quiz', title:'Snelle quiz: hoe snel ben jij?', ic:'quiz',
  tip:'Tien korte vragen tegen de klok. De quiz telt niet mee: speel hem zo vaak je wil en probeer je beste score te verbeteren. Typ ^ voor een exponent: x^2.',
  cards:[
    { title:'Quiz eentermen en herleiden', noReset:true, build:quizKaart(QUIZ.eentermen) },
    { title:'Quiz getalwaarde', noReset:true, build:quizKaart(QUIZ.getalwaarde) },
    { title:'Quiz rekenen met veeltermen', noReset:true, build:quizKaart(QUIZ.rekenen) }
  ] };

/* ============================================================
   PROEFTOETSEN 1-3: gemengd over de hele module, op 20 punten.
   Eigen vragen op het niveau van de twee kleine toetsen (KT),
   met andere getallen en situaties. Feedback pas na
   "Verbeter mijn proeftoets"; de laatste poging telt (CLtoets).
   ============================================================ */
FIGS.vlieger = polyFig({
  label:'Vlieger', view:'90 15 330 300', max:330,
  pts:[[250,30], [370,125], [250,300], [130,125]],
  sides:[{a:0, b:1, lab:'2a', lp:[328,64], ticks:1}, {a:1, b:2, lab:'b + 3', lp:[350,222], ticks:2},
         {a:2, b:3, lab:'b + 3', show:false, ticks:2}, {a:3, b:0, lab:'2a', show:false, ticks:1}]
});
FIGS.rechthoekB = polyFig({
  label:'Rechthoek met breedte b en lengte 3b − 2', view:'20 10 470 260', max:480,
  pts:[[70,60], [410,60], [410,230], [70,230]],
  sides:[{a:0, b:1, lab:'3b − 2', lp:[150,44], ticks:1}, {a:1, b:2, lab:'b', lp:[436,150], ticks:2},
         {a:2, b:3, lab:'3b − 2', show:false, ticks:1}, {a:3, b:0, lab:'b', show:false, ticks:2}],
  right:[[0,1,3], [1,0,2], [2,1,3], [3,2,0]]
});
FIGS.gelijkzijdig = polyFig({
  label:'Gelijkzijdige driehoek met zijde 2y + 1', view:'60 10 380 290', max:380,
  pts:[[100,270], [400,270], [250,10]],
  sides:[{a:0, b:1, lab:'2y + 1', lp:[250,296], ticks:1}, {a:1, b:2, lab:'2y + 1', show:false, ticks:1}, {a:2, b:0, lab:'2y + 1', show:false, ticks:1}]
});

/* vraag aanmaken met sleutel; geeft {q, pts} terug */
const TV = (pts, q, key, hint) => ({pts, q:NV(q, key, hint)});
const T_HW = (id, g, kort, title) => ({type:'hw', id, g, kort:!!kort, title:title || 'Werk de haakjes weg en herleid.'});
const T_DI = (rows) => ({rows:rows.map(r => ({lab:'`' + r[0] + ' · (' + r[1] + ')`', inner:r[1], dist:{f:r[0], t:r[1]}})), key:{tr:rows.map(r => UIT(r[0], r[1]))}});
const T_WAT = (id, items) => ({ id, type:'ctx', title:'Wat stelt de letter voor?', intro:'Kies wat de letter voorstelt.',
  parts:items.map((it, i) => ({lab:String.fromCharCode(97 + i) + ') ' + it[0], k:'kies', opts:it[1]})) });

const TOETS = {};
(() => {
  const d1 = T_DI([['5', '2x − 3'], ['−4', 'y^2 − 2y + 3'], ['2a', '3a − 4'], ['−x', '−2x + 7']]);
  TOETS.toets1 = [
    TV(1.5, { id:'p1a', type:'ctx', title:'Gelijksoortige eentermen', intro:'',
      parts:[{lab:'a) Wat zijn gelijksoortige eentermen?', k:'kies', opts:['eentermen met hetzelfde lettergedeelte', 'eentermen met dezelfde coëfficiënt', 'eentermen met evenveel letters']},
             {lab:'b) Geef een eenterm die gelijksoortig is met `5x^2y`.', k:'gs', ref:'5x^2y', pre:'eenterm =', prePlain:true}] }, {ctx:[0, '−x^2y']}),
    TV(1.5, { id:'p1b', type:'tabel', title:'Vul de tabel aan. Hou rekening met de afspraken.', cols:[{k:'t', h:'eenterm'}, {k:'c', h:'coëfficiënt'}, {k:'l', h:'lettergedeelte'}],
      rows:[{t:'−2/7ab'}, {c:'−18', l:'p^2q'}, {t:'−y^6'}] }, {tabel:[{c:'−2/7', l:'ab'}, {t:'−18p^2q'}, {c:'−1', l:'y^6'}]}),
    TV(1.5, { id:'p1c', type:'gw', expr:'5x^2y', vals:{x:'−2', y:'3'}, title:'Bereken de getalwaarde van `5x^2y` voor `x = −2` en `y = 3`' }, MAAK.gw('5x^2y', {x:'−2', y:'3'})),
    TV(2, { id:'p1d', type:'pat', fig:'luc', qty:'aantal lucifers', letter:'l', nlab:'nummer figuur', nletter:'n', cols:[1, 2, 3, 4, 10],
      ask:{lab:'Hoeveel lucifers telt figuur 40?', unit:'lucifers'}, title:'Met lucifers leg je een rij vierkantjes.' }, {pat:{t:['4', '7', '10', '13', '31'], f:'3n + 1', ask:['', '121']}}),
    TV(2, { id:'p1e', type:'herlrows', title:'Herleid indien mogelijk.', rows:['4y − 11y', '3x + 9x − 5x', '6a^2 − 2a', '7k − 3 − 4k + 8 − k + 1'] },
      MAAK.herlrows(['4y − 11y', '3x + 9x − 5x', '6a^2 − 2a', '7k − 3 − 4k + 8 − k + 1'])),
    TV(1, { id:'p1f', type:'rows', kind:'tr', pre:'… =', title:'Vul aan zodat de gelijkheid klopt.', rows:[{lab:'`−5ab^2 + … = 2ab^2`'}, {lab:'`… − 3x = −8x`'}] }, {tr:['7ab^2', '−5x']}),
    TV(1.5, { id:'p1g', type:'omtrek', fig:'vlieger', title:'Noteer de omtrek van de vlieger als een eenterm of veelterm.' }, {omtrek:'4a + 2b + 6'}),
    TV(2, T_HW('p1h', [{t:'3p^2 − 2p + 4'}, {op:'−', t:'−p^2 + 5p − 1'}], true), MAAK.hw([{t:'3p^2 − 2p + 4'}, {op:'−', t:'−p^2 + 5p − 1'}], true)),
    TV(1, { id:'p1i', type:'bewteken', title:'Vul het juiste bewerkingsteken in: + of −.', rows:[['6x^2 − x', '2x^2 + 4x', '4x^2 − 5x'], ['−3a + 2', '5a − 7', '2a − 5']] }, {pm:['−', '+']}),
    TV(2, { id:'p1j', type:'rows', kind:'tr', title:'Werk de haakjes weg.', rows:d1.rows }, d1.key),
    TV(2, { id:'p1k', type:'distr', items:[{f:'4', t:'3x − 2'}, {op:'−', f:'1', t:'2x + 5'}], title:'Werk de haakjes weg en herleid: `4 · (3x − 2) − (2x + 5)`' }, MAAK.distr([{f:'4', t:'3x − 2'}, {op:'−', f:'1', t:'2x + 5'}])),
    TV(2, { id:'p1l', type:'ctx', title:'Rechthoek', intro:'Een rechthoek heeft breedte `a` en lengte `a + 5`.',
      parts:[{lab:'a) Stel een veelterm op voor de omtrek.', k:'tr', pre:'omtrek =', prePlain:true}, {lab:'b) Stel een veelterm op voor de oppervlakte.', k:'tr', pre:'oppervlakte =', prePlain:true}] }, {ctx:['4a + 10', 'a^2 + 5a']})
  ];
  const d2 = T_DI([['3', '4m + 5'], ['−6', '2 − b'], ['4x', 'x^2 − 3x'], ['−0,5', '10y − 4']]);
  TOETS.toets2 = [
    TV(1.5, T_WAT('p2a', [['Een pakje kauwgom kost 2 euro. Je betaalt 14 euro: `2k = 14`.', ['de prijs van één pakje', 'het aantal pakjes', 'het totale bedrag']],
      ['Een plank van 180 cm wordt in 4 gelijke stukken gezaagd: `4p = 180`.', ['het aantal stukken', 'de lengte van één stuk', 'de lengte van de hele plank']],
      ['Een taxirit kost 4 euro instap plus 2 euro per km. De rit kost 26 euro: `4 + 2x = 26`.', ['het aantal km', 'de prijs per km', 'de totale prijs']]]), {ctx:[1, 1, 0]}),
    TV(1, { id:'p2b', type:'rows', kind:'tr', pre:'eenterm =', title:'Noteer de eenterm.', rows:[{lab:'De coëfficiënt is −8. De letters zijn `m` en `n`. De graad in `m` is 2, de graad in `n` is 3.'}, {lab:'De coëfficiënt is −1. De enige letter is `z`, met graad 4.'}] }, {tr:['−8m^2n^3', '−z^4']}),
    TV(1, { id:'p2c', type:'ctx', title:'Gelijksoortig of niet?', intro:'Kies telkens ja of nee.',
      parts:[['`9pq` en `−qp`'], ['`4a^3` en `4a^2`'], ['`x^2y` en `xy^2`'], ['`−0,5t` en `t`']].map((r, i) => ({lab:String.fromCharCode(97 + i) + ') ' + r[0], k:'kies', opts:['ja', 'nee']})) }, {ctx:[0, 1, 1, 0]}),
    TV(1.5, { id:'p2d', type:'gw', expr:'−a^2 + 4b', vals:{a:'−3', b:'2'}, title:'Bereken de getalwaarde van `−a^2 + 4b` voor `a = −3` en `b = 2`' }, MAAK.gw('−a^2 + 4b', {a:'−3', b:'2'})),
    TV(2, { id:'p2e', type:'pat', fig:'hexa', qty:'aantal stoelen', letter:'s', nlab:'aantal tafels', nletter:'t', cols:[1, 2, 3, 4, 10],
      ask:{lab:'Hoeveel stoelen staan er bij 30 tafels?', unit:'stoelen'}, title:'Zeshoekige tafels worden in een rij tegen elkaar geschoven. Aan elke vrije zijde staat een stoel.' }, {pat:{t:['6', '10', '14', '18', '42'], f:'4t + 2', ask:['', '122']}}),
    TV(1.5, { id:'p2f', type:'herl', expr:'3m^2 − 5m + 2 − m^2 + 7m − 6', title:'Herleid `3m^2 − 5m + 2 − m^2 + 7m − 6`' }, MAAK.herl('3m^2 − 5m + 2 − m^2 + 7m − 6')),
    TV(1.5, { id:'p2g', type:'omtrek', fig:'rechthoekB', title:'Noteer de omtrek van de rechthoek als een eenterm of veelterm.' }, {omtrek:'8b − 4'}),
    TV(1.5, T_HW('p2h', [{t:'−2x^2 + 6x − 3'}, {op:'+', t:'5x^2 − x + 7'}], true), MAAK.hw([{t:'−2x^2 + 6x − 3'}, {op:'+', t:'5x^2 − x + 7'}], true)),
    TV(1.5, T_HW('p2i', [{t:'4a − 7'}, {op:'−', t:'6a − 2'}], true), MAAK.hw([{t:'4a − 7'}, {op:'−', t:'6a − 2'}], true)),
    TV(2, { id:'p2j', type:'ctx', title:'Lijnstuk', seg:{ab:'x + 6', bc:null, ac:'5x + 2', fB:0.36}, intro:'Het punt B ligt op het lijnstuk [AC].',
      parts:[{lab:'a) Hoe bereken je |BC|?', k:'kies', opts:['|AB| + |AC|', '|AC| − |AB|', '|AB| − |AC|']}, {lab:'b) Bepaal |BC| als veelterm in `x`.', k:'tr', pre:'|BC| =', prePlain:true}] }, {ctx:[1, '4x − 4']}),
    TV(2, { id:'p2k', type:'rows', kind:'tr', title:'Werk de haakjes weg.', rows:d2.rows }, d2.key),
    TV(2, { id:'p2l', type:'distr', items:[{f:'2', t:'5a − 1'}, {op:'−', f:'3', t:'a + 4'}], title:'Werk de haakjes weg en herleid: `2 · (5a − 1) − 3 · (a + 4)`' }, MAAK.distr([{f:'2', t:'5a − 1'}, {op:'−', f:'3', t:'a + 4'}])),
    TV(1, { id:'p2m', type:'fout', who:'Mats', work:'(−4)^2 = −16', title:'Mats berekende de getalwaarde van `n^2` voor `n = −4`. Wat ging er fout?',
      options:[{id:'a', text:'Niets, de berekening is juist.'}, {id:'b', text:'`(−4)^2 = (−4) · (−4)` en min maal min is plus.'}, {id:'c', text:'Het kwadraat van 4 is 8.'}, {id:'d', text:'Hij moest `−4 · 2` rekenen.'}] }, {kies:'b', res:'16'})
  ];
  const d3 = T_DI([['−7', 'a − 3'], ['5p', '2p + 1'], ['−2y', 'y^2 − 4y + 1']]);
  TOETS.toets3 = [
    TV(1.5, { id:'p3a', type:'tabel', title:'Vul de tabel aan. Hou rekening met de afspraken.', cols:[{k:'t', h:'eenterm'}, {k:'c', h:'coëfficiënt'}, {k:'l', h:'lettergedeelte'}],
      rows:[{t:'4/9mn^2'}, {t:'−b'}, {c:'0,8', l:'xy^3'}] }, {tabel:[{c:'4/9', l:'mn^2'}, {c:'−1', l:'b'}, {t:'0,8xy^3'}]}),
    TV(1.5, { id:'p3b', type:'rows', kind:'tr', title:'Noteer volgens de afspraken. Rangschik volgens dalende machten.', rows:[{lab:'`y · (−4) · x`'}, {lab:'`1 · a · a · a`'}, {lab:'`−1p^2 + 3 − 2p^3`'}] }, {tr:['−4xy', 'a^3', '−2p^3 − p^2 + 3']}),
    TV(1, { id:'p3c', type:'omkring', title:'Omcirkel alle eentermen die gelijksoortig zijn met de eerste eenterm.', rows:[{ref:'6pq^2', items:['−q^2p', '6p^2q', 'pq^2', '0,3pq^2', '6pq', '−pq^2']}] }, {omkring:[[0, 2, 3, 5]]}),
    TV(2, { id:'p3d', type:'gwtabel', expr:'2x^2 − 3x', letter:'x', vals:['−2', '−1', '0', '1', '2'], title:'Vul de tabel aan voor `2x^2 − 3x`.' }, MAAK.gwtabel('2x^2 − 3x', 'x', ['−2', '−1', '0', '1', '2'])),
    TV(2, { id:'p3e', type:'pat', fig:'lvorm', qty:'aantal blokjes', letter:'b', nlab:'nummer figuur', nletter:'n', cols:[1, 2, 3, 4, 10],
      ask:{lab:'Hoeveel blokjes telt figuur 75?', unit:'blokjes'}, title:'Met blokjes bouw je een L-vorm die telkens groter wordt.' }, {pat:{t:['3', '5', '7', '9', '21'], f:'2n + 1', ask:['', '151']}}),
    TV(1.5, { id:'p3f', type:'herlrows', title:'Herleid indien mogelijk.', rows:['−8t + 3t', '2b^2 + 5b', 'x^2 + 4x − 3x^2 − x + 2'] }, MAAK.herlrows(['−8t + 3t', '2b^2 + 5b', 'x^2 + 4x − 3x^2 − x + 2'])),
    TV(1, T_WAT('p3g', [['Een bus met 52 zitplaatsen is vol. Er stappen nog enkele mensen bij en dan zijn er 60 reizigers: `52 + r = 60`.', ['het aantal zitplaatsen', 'het aantal reizigers dat bijstapt', 'het totaal aantal reizigers']],
      ['Een fles limonade van 1,5 liter wordt verdeeld over 6 even volle glazen: `6g = 1,5`.', ['het aantal glazen', 'de inhoud van één glas in liter', 'de inhoud van de fles']]]), {ctx:[1, 1]}),
    TV(1.5, { id:'p3h', type:'omtrek', fig:'gelijkzijdig', title:'Noteer de omtrek van de gelijkzijdige driehoek als een eenterm of veelterm.' }, {omtrek:'6y + 3'}),
    TV(2, T_HW('p3i', [{t:'x^2 − 3'}, {op:'−', t:'2x^2 + x − 4'}, {op:'+', t:'5x − 1'}], true), MAAK.hw([{t:'x^2 − 3'}, {op:'−', t:'2x^2 + x − 4'}, {op:'+', t:'5x − 1'}], true)),
    TV(1, { id:'p3j', type:'bewteken', title:'Vul het juiste bewerkingsteken in: + of −.', rows:[['2y^2 + 3y', '−y^2 + 3y', '3y^2'], ['5m − 4', '−2m − 1', '3m − 5']] }, {pm:['−', '+']}),
    TV(1, { id:'p3k', type:'rows', kind:'tr', title:'Werk de haakjes weg.', rows:d3.rows }, d3.key),
    TV(2, { id:'p3l', type:'distr', items:[{f:'x', t:'x + 6'}, {op:'−', f:'2', t:'x^2 − 3x'}], title:'Werk de haakjes weg en herleid: `x · (x + 6) − 2 · (x^2 − 3x)`' }, MAAK.distr([{f:'x', t:'x + 6'}, {op:'−', f:'2', t:'x^2 − 3x'}])),
    TV(2, { id:'p3m', type:'ctx', title:'Rechthoek', intro:'Een rechthoek heeft breedte `3a` en lengte `2a + 1`.',
      parts:[{lab:'a) Stel een veelterm op voor de omtrek.', k:'tr', pre:'omtrek =', prePlain:true}, {lab:'b) Stel een veelterm op voor de oppervlakte.', k:'tr', pre:'oppervlakte =', prePlain:true}] }, {ctx:['10a + 2', '6a^2 + 3a']})
  ];
})();

/* ---------- een proeftoets opbouwen ---------- */
function toetsNiveau(p){ return p >= .9 ? 'prima' : p >= .7 ? 'goed' : p >= .5 ? 'voldoende' : 'nog niet voldoende'; }
function bouwToets(sec, s){
  const vragen = TOETS[sec.id], totaal = vragen.reduce((a, v) => a + v.pts, 0);
  const res = load(sec.id + '_res');
  s.append(el('div', 'tip', icon('info') + '<div>Maak de proeftoets zoals een echte toets: zonder hints. Klik pas op het einde op <b>Verbeter mijn proeftoets</b>. Je krijgt dan je score op ' + totaal + ', en bij elke fout het juiste antwoord. Je mag opnieuw beginnen: de laatste poging telt.</div>'));
  const kaarten = [];
  vragen.forEach((v, i) => {
    const key = sec.id + '_q' + i, st = load(key), save = () => store(key, st);
    const kaart = el('div', 'card toetsvraag');
    const kop = el('div', 'card-head', '<h3 class="mhead"><span class="ttl">Vraag ' + (i + 1) + ' · ' + rich(v.q.title) + '</span></h3><span class="tpunt">/ ' + String(v.pts).replace('.', ',') + '</span>');
    const body = el('div'); kaart.append(kop, body); s.append(kaart);
    const c = mountAQ(body, v.q, st, save, {key, mode:'toets'});
    kaarten.push({v, c, st, save, kop});
  });
  const voet = el('div', 'toets-voet'), knop = el('button', 'btn', icon('toets') + 'Verbeter mijn proeftoets'), opnieuw = el('button', 'btn ghost', '↺ Opnieuw beginnen');
  knop.type = opnieuw.type = 'button';
  const uitslag = el('div', 'toets-uitslag'); uitslag.hidden = true;
  voet.append(knop, opnieuw); s.append(voet, uitslag);
  function toonUitslag(score){
    const p = score / totaal;
    uitslag.hidden = false;
    uitslag.innerHTML = '<div class="tu-score">' + String(score).replace('.', ',') + ' / ' + totaal + '</div><div class="tu-niveau">Niveau: <b>' + toetsNiveau(p) + '</b></div>' +
      '<p>Kijk bij elke vraag naar de rode kringen en het juiste antwoord. Ga naar <b>Na de toets</b> om te zien welke onderdelen je best nog eens oefent.</p>';
    knop.disabled = true;
  }
  function verbeterAlles(bewaar){
    let score = 0;
    kaarten.forEach(k => {
      const r = verbeter(k.v.q, withCard(k.c, () => getVal(k.v.q)));
      const pt = r.totaal ? Math.round(k.v.pts * r.goed / r.totaal * 2) / 2 : 0;
      score += pt;
      k.st.check = r; k.st.sol = true; k.c.locked = true; k.save();
      renderCard(k.c);
      const tp = k.kop.querySelector('.tpunt'); tp.textContent = String(pt).replace('.', ',') + ' / ' + String(k.v.pts).replace('.', ','); tp.classList.add(pt === k.v.pts ? 'vol' : (pt ? 'deels' : 'nul'));
    });
    score = Math.round(score * 2) / 2;
    if(bewaar){ store(sec.id + '_res', {score, n:totaal}); CLtoets(sec.id, score, totaal); }
    toonUitslag(score);
    requestAnimationFrame(hertekenAQ);
  }
  knop.addEventListener('click', () => { verbeterAlles(true); uitslag.scrollIntoView({behavior:'smooth', block:'center'}); });
  opnieuw.addEventListener('click', () => {
    if(!confirm('Wil je deze proeftoets leegmaken en opnieuw beginnen?')) return;
    kaarten.forEach((k, i) => wipe(sec.id + '_q' + i)); wipe(sec.id + '_res');
    s.innerHTML = ''; secBuilt[sec.id] = false; show(sec.id, true);
  });
  if(res.score != null) verbeterAlles(false);
}
['toets1', 'toets2', 'toets3'].forEach((id, i) => {
  SEC[id] = { id, nav:'Proeftoets ' + (i + 1), title:'Proeftoets ' + (i + 1), ic:'toets', toets:true, build:s => bouwToets(SEC[id], s) };
});

/* ============================================================
   NA DE TOETS: de leerling duidt aan welke toetsvragen fout
   waren en krijgt de onderdelen om nog te oefenen.
   ============================================================ */
const KT_LIJST = [
  { naam:'Toets lettervormen (eentermen, getalwaarde en formules)', vragen:[
    ['1', 'Wat zijn gelijksoortige eentermen? Een voorbeeld geven.', ['gelijksoortig']],
    ['2', 'Tabel: eenterm, coëfficiënt en lettergedeelte', ['eentermen']],
    ['3', 'De getalwaarde berekenen', ['getalwaarde']],
    ['4', 'Een eenterm noteren uit een beschrijving (coëfficiënt en graad)', ['eentermen']],
    ['5', 'Patroon: tabel, figuur n en een formule', ['patronen']],
    ['6', 'Herleiden indien mogelijk', ['herleiden']],
    ['7', 'Aanvullen zodat de gelijkheid klopt', ['herleiden']],
    ['8', 'De omtrek als eenterm of veelterm', ['omtrek']],
    ['9', 'Wat stelt x voor?', ['letters']] ]},
  { naam:'Toets som en verschil van veeltermen, distributieve eigenschap', vragen:[
    ['1', 'Haakjes wegwerken en herleiden: som en verschil', ['som', 'verschil']],
    ['2', 'Het juiste bewerkingsteken + of −', ['verschil']],
    ['4', 'Lijnstuk: een lengte als veelterm', ['toepassingen']],
    ['5', 'Haakjes wegwerken met de distributieve eigenschap', ['maal', 'distr']],
    ['6', 'Haakjes wegwerken en herleiden', ['distrherl']],
    ['7', 'Rechthoek: omtrek en oppervlakte als veelterm', ['omtrek', 'toepassingen']] ]}
];
SEC.nadetoets = { id:'nadetoets', nav:'Na de toets', title:'Na de toets: waar werk ik aan?', ic:'na', toets:true,
  build(s){
    const st = load('nadetoets'); st.fout = st.fout || {};
    const save = () => store('nadetoets', st);
    s.append(el('div', 'tip', icon('bulb') + '<div>Kreeg je je toets terug? Vink aan welke vragen fout waren. Je ziet dan meteen welke onderdelen je best nog eens oefent.</div>'));
    const advies = el('div', 'card nd-advies');
    KT_LIJST.forEach((kt, ki) => {
      const kaart = el('div', 'card');
      kaart.append(el('div', 'card-head', '<h3>' + kt.naam + '</h3>'));
      const tab = el('table', 'nd-tab');
      tab.innerHTML = '<thead><tr><th>Vraag</th><th>Onderwerp</th><th>Oefen in</th><th>Fout op de toets?</th></tr></thead>';
      const tb = el('tbody');
      kt.vragen.forEach(v => {
        const id = ki + '_' + v[0], tr = el('tr');
        const links = v[2].map(sid => SEC[sid] ? '<button type="button" class="nd-link" data-sec="' + sid + '">' + SEC[sid].nav + '</button>' : '').join(' ');
        tr.innerHTML = '<td class="nd-nr">' + v[0] + '</td><td>' + v[1] + '</td><td>' + links + '</td><td class="nd-vink"><label><input type="checkbox"' + (st.fout[id] ? ' checked' : '') + '> fout</label></td>';
        tr.querySelector('input').addEventListener('change', e => { if(e.target.checked) st.fout[id] = true; else delete st.fout[id]; save(); teken(); });
        tb.append(tr);
      });
      tab.append(tb); const wrap = el('div', 'tabscroll'); wrap.append(tab); kaart.append(wrap); s.append(kaart);
    });
    s.append(advies);
    function teken(){
      const tel = {};
      KT_LIJST.forEach((kt, ki) => kt.vragen.forEach(v => { if(st.fout[ki + '_' + v[0]]) v[2].forEach(sid => { tel[sid] = (tel[sid] || 0) + 1; }); }));
      const ids = ORDER.filter(id => tel[id] && SEC[id]);
      advies.innerHTML = '<div class="card-head"><h3>Mijn plan</h3></div>' + (ids.length
        ? '<p>Oefen deze onderdelen, in deze volgorde. Begin telkens met <b>Basis en oefenen</b>.</p><ol class="nd-plan">' + ids.map(id => '<li><button type="button" class="nd-link" data-sec="' + id + '">' + SEC[id].nav + '</button></li>').join('') + '</ol>' +
          '<p>Klaar met oefenen? Maak daarna een proeftoets.</p>'
        : '<p>Vink hierboven aan welke vragen fout waren. Alles juist? Probeer dan de <b>Verdieping</b> of de <b>Snelle quiz</b>.</p>');
    }
    s.addEventListener('click', e => { const b = e.target.closest('.nd-link'); if(b) show(b.dataset.sec, true); });
    teken();
  } };

/* ============================================================
   SPIEKBRIEFJES (rechtsboven bij elk onderdeel)
   Tekst met `...` wordt als wiskunde getoond.
   ============================================================ */
const spRich = t => String(t).split('`').map((p, i) => i % 2 ? mathHTML(p) : p).join('');
const SP = (...blokken) => '<div class="mhead spiek">' + blokken.map(b => '<div class="sp-blok">' + spRich(b) + '</div>').join('') + '</div>';
const SPIEK = {
  letters: SP('<b>Lettervorm</b>: een letter staat voor een getal dat je (nog) niet kent.',
    '<b>Zo vertaal je</b>: het dubbel van `x` = `2x` · het drievoud van `x` = `3x` · het kwadraat van `x` = `x^2` · 5 meer dan `x` = `x + 5` · 5 minder dan `x` = `x − 5`.',
    '<b>Wat stelt x voor?</b> Lees de vergelijking: `4b = 36` met 4 euro per beurt → `b` is het aantal beurten.'),
  eentermen: SP('<b>Eenterm</b> = getal · letters, bv. `−7a^2b`. Het getal is de <b>coëfficiënt</b> (`−7`), de letters met exponenten het <b>lettergedeelte</b> (`a^2b`).',
    '<b>Afspraken</b>: geen maalteken · getal vooraan · letters alfabetisch · gelijke letters als macht · coëfficiënt 1 schrijf je niet (`xy`) · coëfficiënt −1 wordt een minteken (`−x^8`).',
    '<b>Graad in een letter</b> = de exponent van die letter. <b>Graad van de eenterm</b> = de som van alle exponenten: `−7a^2b` heeft graad 2 + 1 = 3.'),
  gelijksoortig: SP('<b>Gelijksoortige eentermen</b> hebben hetzelfde lettergedeelte: dezelfde letters met dezelfde exponenten. Het getal mag verschillen.',
    '`3x^2y` en `−7x^2y`: ja · `5a` en `5b`: nee (andere letter) · `2a^2` en `2a`: nee (andere exponent) · `4ab` en `−ba`: ja (`ba` = `ab`).'),
  veeltermen: SP('<b>Veelterm</b> = som van eentermen. 1 term: eenterm · 2 termen: tweeterm · 3 termen: drieterm.',
    '<b>Graad van een veelterm in een letter</b> = de hoogste exponent van die letter: `5x^3 − 2x + 1` heeft graad 3 in `x`.',
    '<b>Dalende machten</b>: de hoogste exponent vooraan, de term zonder letter achteraan: `−6y^2 + 2y + 7`.'),
  patronen: SP('<b>Stappenplan</b>: 1. Tel de figuren en vul de tabel aan. 2. Wat komt er telkens bij? Dat getal staat voor de letter. 3. Wat blijft vast? Dat tel je erbij.',
    'Telkens 3 erbij en figuur 1 telt 4 → `l = 3n + 1`. Controle: figuur 2 → `3 · 2 + 1 = 7`.'),
  herleiden: SP('<b>Herleiden</b> = gelijksoortige termen samennemen. Tel de coëfficiënten op, het lettergedeelte blijft hetzelfde.',
    '`2k + 5 − 3k + 2 + 5k − 6 = (2 − 3 + 5)k + (5 + 2 − 6) = 4k + 1`',
    '<b>Let op</b>: `3a + 2a = 5a`, niet `5a^2`. `5a^2 − 10a` kan je niet herleiden.',
    '<b>Vul aan</b>: `−3a^3b + … = 4a^3b` → doel − start: `4 − (−3) = 7`, dus `7a^3b`.'),
  getalwaarde: SP('<b>Getalwaarde in 4 stappen</b>: 1. maaltekens erbij · 2. letter vervangen door het getal tussen haakjes · 3. eerst de machten · 4. dan maal en gedeeld door, dan plus en min.',
    '`2x^2y` voor `x = −3` en `y = 5`: `2 · (−3)^2 · 5 = 2 · 9 · 5 = 90`',
    '<b>Valkuilen</b>: `(−3)^2 = 9`, niet `−9` · bij `2x^2` hoort de exponent enkel bij `x`: `2 · 3^2 = 18`.'),
  omtrek: '<div class="mhead spiek"><div class="sp-blok">' + spRich('<b>Omtrek</b> = de som van de lengtes van alle zijden. Zijden met evenveel streepjes zijn even lang. Herleid op het einde.') + '</div>' +
    '<div class="vf-rij">' + [VF.vierkant, VF.rechthoek, VF.ruit, VF.para, VF.driehoek, VF.trapezium, VF.cirkel].join('') + '</div>' +
    '<table class="vf-tab"><tr><th>figuur</th><th>omtrek</th><th>oppervlakte</th></tr>' +
    [['vierkant', '4 · z', 'z · z = z^2'], ['rechthoek', '2 · (l + b)', 'l · b'], ['ruit', '4 · z', '(D · d) / 2'], ['parallellogram', '2 · (a + b)', 'b · h'],
     ['driehoek', 'som van de 3 zijden', '(b · h) / 2'], ['trapezium', 'som van de 4 zijden', '((B + b) · h) / 2'], ['cirkel', '2 · π · r', 'π · r^2']]
      .map(r => '<tr><td>' + r[0] + '</td><td>' + (/[a-z]{3}/.test(r[1]) ? r[1] : mathHTML(r[1])) + '</td><td>' + mathHTML(r[2]) + '</td></tr>').join('') + '</table></div>',
  som: SP('<b>Een + voor de haakjes</b>: laat de haakjes weg, de tekens blijven. Daarna herleid je.',
    '`(3x + 2) + (5x − 7) = 3x + 2 + 5x − 7 = 8x − 5`'),
  verschil: SP('<b>Een − voor de haakjes</b>: verander het teken van élke term tussen de haakjes. Daarna herleid je.',
    '`(6x + 4) − (2x + 9) = 6x + 4 − 2x − 9 = 4x − 5`',
    '<b>Tegengestelde</b>: `−(3x − 5) = −3x + 5`.'),
  maal: SP('<b>Eenterm maal eenterm</b>: getallen maal getallen, letters maal letters. Zelfde letter: tel de exponenten op.',
    '`−2a · 5a^2 = (−2 · 5) · (a · a^2) = −10a^3`',
    '<b>Tekens</b>: plus maal plus = plus · min maal min = plus · plus maal min = min.'),
  distr: SP('<b>Distributieve eigenschap</b>: vermenigvuldig de factor voor de haakjes met élke term tussen de haakjes.',
    '`a · (b + c) = a · b + a · c`',
    '`−3 · (2a − 5) = −6a + 15` · `2x · (x − 5) = 2x^2 − 10x`'),
  distrherl: SP('<b>Stappenplan</b>: 1. werk alle haakjes weg (let op het teken voor elke factor) · 2. neem de gelijksoortige termen samen.',
    '`4 · (3a − 2) − (a + 5) = 12a − 8 − a − 5 = 11a − 13`'),
  toepassingen: SP('<b>Lijnstuk</b>: B ligt op [AC], dan is `|AB| + |BC| = |AC|`. Zoek je een stuk, dan trek je af: `|BC| = |AC| − |AB|`. Zet haakjes rond een veelterm die je aftrekt.',
    '<b>Rechthoek</b> met breedte `b` en lengte `l`: omtrek `2 · l + 2 · b`, oppervlakte `l · b`. Bv. breedte `x`, lengte `x + 3`: omtrek `4x + 6`, oppervlakte `x · (x + 3) = x^2 + 3x`.'),
  fout: SP('<b>Veelgemaakte fouten</b>: `5x + 3x = 8x`, niet `8x^2` · `−(3x − 4)` = `−3x + 4`: elk teken keert om · `−3 · (−5) = +15` · `(−4)^2 = 16` · `2x · x = 2x^2`.')
};
Object.keys(SPIEK).forEach(id => { if(SEC[id]) SEC[id].cheat = SPIEK[id]; });

/* ============================================================
   OPBOUW VAN DE SITE (zijbalk, onderdelen, tabbladen, kaarten)
   ============================================================ */
const SECTIONS = ORDER.map(id=>SEC[id]).filter(Boolean);
/* onderdelen die de leerkracht uitzette, verbergen */
if(window.CL_VERBORGEN){ for(let i = SECTIONS.length - 1; i >= 0; i--) if(window.CL_VERBORGEN.has(SECTIONS[i].id)) SECTIONS.splice(i, 1); }
const app = document.getElementById('app');
const nav = document.getElementById('nav');
const pager = document.getElementById('pager');
const renderers = {};
const secEls = {}, navLinks = {}, secBuilt = {};

/* kaart = {lvl, q:vraag} of {lvl, gen:R=>vraag} of {lvl, title, build:(body, st, save, key, head)} */
function buildCard(sec, card, ci, pane){
  const key = sec.id + '_' + ci;
  const c = el('div','card' + (card.lvl===3 ? ' lvl3' : ''));
  const h3 = el('h3','mhead');
  const ch = el('div','card-head'); ch.append(h3);
  const rb = el('button','refresh-btn', card.gen ? '↻ Nieuwe opgave' : '↺ Opnieuw beginnen'); rb.type='button';
  if(!sec.toets && !card.build){                    /* bordmodus (niet in de proeftoetsen) */
    const bb = el('button','bord-btn','⛶ Bord'); bb.type='button'; bb.title='Toon deze oefening groot op het bord, met de oplossing stap voor stap';
    bb.addEventListener('click', ()=>bordOpen(c)); ch.append(bb);
  }
  if(!card.noReset) ch.append(rb);
  c.append(ch);
  const body = el('div'); c.append(body); pane.append(c);
  const setTitle = t => { h3.innerHTML = '<span class="ttl">' + t + '</span>' + (card.lvl ? LVL[card.lvl] : ''); };
  renderers[key] = ()=>{
    body.innerHTML = ''; const st = load(key); const save = ()=>store(key, st);
    try{
      if(card.build){ setTitle(card.title || ''); card.build(body, st, save, key, setTitle); }
      else {
        let q = card.q;
        if(card.gen){ const R = makeR(st); q = card.gen(R); q.id = 'g_' + key; SLEUTEL[q.id] = q.key; if(q.hint) HINTS[q.id] = q.hint; }
        setTitle(rich(q.title));
        mountAQ(body, q, st, save, {key, mode:'oef'});
        voegExtrasToe(body, q, card);
      }
    }catch(err){ console.error(err); body.append(el('p','fb bad','Er liep iets mis bij het maken van deze oefening. Klik op “Opnieuw beginnen”.')); }
    save();
  };
  rb.addEventListener('click', ()=>{ wipe(key); renderers[key](); hertekenAQ(); });
  renderers[key]();
}

function buildSection(sec, num){
  const s = secEls[sec.id];
  const head = el('div','sec-head', `<span class="sec-ic">${icon(sec.ic)}</span><h2><span class="num">${num}.</span>${sec.title}</h2>`);
  s.append(head);
  if(sec.cheat){
    const cb = el('button','cheat-btn', icon('cheat')); cb.type='button'; cb.dataset.tip='spiekbriefje'; cb.setAttribute('aria-label','spiekbriefje'); cb.setAttribute('aria-expanded','false');
    const panel = el('div','cheat', sec.cheat); panel.hidden = true;
    cb.addEventListener('click', ()=>{ panel.hidden = !panel.hidden; cb.setAttribute('aria-expanded', String(!panel.hidden)); });
    head.append(cb); s.append(panel);
  }
  if(sec.tip) s.append(el('div','tip', icon('bulb') + `<div>${sec.tip}</div>`));
  if(sec.intro) s.append(el('div','', sec.intro));
  if(sec.build){ sec.build(s); return; }
  /* tabbladen: basis en oefenen / verdieping */
  const hasCh = sec.cards.some(c=>c.lvl===3) && sec.cards.some(c=>c.lvl!==3);
  let panes = {b:s, c:s};
  if(hasCh){
    const bar = el('div','tabs'); bar.setAttribute('role','tablist');
    const tb1 = el('button','tab', 'Basis en oefenen'), tb2 = el('button','tab', 'Verdieping');
    [tb1,tb2].forEach(b=>{ b.type='button'; b.setAttribute('role','tab'); bar.append(b); });
    const p1 = el('div','tabpane'), p2 = el('div','tabpane');
    s.append(bar, p1, p2); panes = {b:p1, c:p2};
    const setTab = k => { p1.hidden = k!=='b'; p2.hidden = k!=='c'; tb1.setAttribute('aria-selected', String(k==='b')); tb2.setAttribute('aria-selected', String(k==='c')); try{ localStorage.setItem(PREFIX+'stab_'+sec.id, k); }catch(e){} requestAnimationFrame(hertekenAQ); };
    tb1.addEventListener('click', ()=>setTab('b')); tb2.addEventListener('click', ()=>setTab('c'));
    let k0 = 'b'; try{ k0 = localStorage.getItem(PREFIX+'stab_'+sec.id) || 'b'; }catch(e){}
    setTab(k0);
    p2.append(el('div','tip', icon('bulb') + '<div>Verdieping is moeilijker. Probeer deze oefeningen als je <b>Basis en oefenen</b> goed kan.</div>'));
  }
  sec.cards.forEach((card,ci)=> buildCard(sec, card, ci, card.lvl===3 ? panes.c : panes.b));
}

SECTIONS.forEach((sec, si)=>{
  const num = si+1;
  if(sec.id==='toets1'){ nav.append(el('li','sep')); }
  const li = el('li');
  const a = el('button','', `${icon(sec.ic)}<span class="n">${num}</span><span class="lbl">${sec.nav}</span>`);
  a.type = 'button'; a.addEventListener('click', ()=>show(sec.id, true));
  li.append(a); nav.append(li); navLinks[sec.id] = a;
  const s = el('section','group'); s.id = sec.id; s.hidden = true;
  app.append(s); secEls[sec.id] = s;
});

function show(id, scroll){
  const idx = SECTIONS.findIndex(s=>s.id===id); if(idx<0) return;
  if(!secBuilt[id]){ secBuilt[id] = true; buildSection(SECTIONS[idx], idx+1); }
  SECTIONS.forEach(s=>{ secEls[s.id].hidden = s.id!==id; navLinks[s.id].removeAttribute('aria-current'); });
  navLinks[id].setAttribute('aria-current','page');
  try{ const ol = nav; const a = navLinks[id]; if(ol.scrollWidth > ol.clientWidth) ol.scrollLeft = a.offsetLeft - 16; }catch(e){}
  pager.innerHTML = '';
  if(idx>0){ const p=SECTIONS[idx-1]; const b=el('button','prev',`<small>← Vorige</small>${idx}. ${p.nav}`); b.type='button'; b.addEventListener('click',()=>show(p.id,true)); pager.append(b); }
  if(idx<SECTIONS.length-1){ const n=SECTIONS[idx+1]; const b=el('button','next',`<small>Volgende →</small>${idx+2}. ${n.nav}`); b.type='button'; b.addEventListener('click',()=>show(n.id,true)); pager.append(b); }
  try{ localStorage.setItem(PREFIX+'tab', id); }catch(e){}
  if(scroll) window.scrollTo({top:0, behavior:'smooth'});
  requestAnimationFrame(hertekenAQ);
}
let startId = SECTIONS[0].id;
try{ const h = location.hash.slice(1); const t = localStorage.getItem(PREFIX+'tab'); if(secEls[h]) startId=h; else if(t && secEls[t]) startId=t; }catch(e){}
show(startId, false);
try{ window.scrollTo(0,0); requestAnimationFrame(()=>window.scrollTo(0,0)); }catch(e){}
/* voor test/catalogus.js (de rest van de code zit in een functie) */
window.SECTIONS = SECTIONS; window.show = show;
})();
