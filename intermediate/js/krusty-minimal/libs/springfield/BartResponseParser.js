define([],function(){function a(c){var d={nic:null,response:null,uri:null,};var b=function(e,f){if(f===null){f=d.uri}e.children().each(function(g,h){if(h.nodeName=="properties"){$(h).children().each(function(k,m){var l=m.nodeName;d.nic.put(f+"/properties/"+l,$(m).text())})}else{var j=h.nodeName;var i=$(h).attr("id");if(i===undefined){i=""}d.nic.put(f+"/"+j,null);d.nic.put(f+"/"+j+"/"+i,null);b($(h),f+"/"+j+"/"+i)}})};$.extend(d,c);return{parse:function(){if(!(d.response instanceof jQuery)){d.response=$(d.response)}var e=d.response.find("fsxml");if(e!==null){b(d.response.find("fsxml"),null)}else{throw"Response does not contain fsxml."}}}}return a});