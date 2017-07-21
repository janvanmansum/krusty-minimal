define([
  'config/BaseConfig',
], function(
  BaseConfig
) {
  var QSResponseParser = function(options) {
    var self = {};
    var settings = {
      data: null,
      ticket: null,
      videos: null,
      audios: null,
      screenshot: null
    };
    $.extend(settings, options);

    function initialize() {
      parseSources();
      parseScreenshot();
    }

    function parseSources() {
      var data = $(settings.data);
       
      //get playout mode
      var playMode = !$(data).find('presentation > videoplaylist > properties > play-mode').text() ? "continuous" : $(data).find('presentation > videoplaylist > properties > play-mode').text();
      
      //Go through all video's in the videoplaylist in the response, and parse them into PlaylistItem objects.
      var playlistVideos = data.find('presentation > videoplaylist').first().find('video');
      var playlistAudios = data.find('presentation > videoplaylist').first().find('audio');
      
      var videos = {};
      videos.duration = 0;
      videos.length = playlistVideos.length;
      
      var audios = {};
      audios.duration = 0;
      audios.length = playlistAudios.length;
      
      if (playlistVideos.length > 0) { 	
	      $.each(playlistVideos, function(k, video) {
		      var referVid = $(data.find('fsxml > video[fullid|="' + $(video).attr('referid') + '"]'));
		      var v = {};
		      
		      //Starttime and duration set are in ms
		      v.starttime = !$(video).find('starttime').text() ? 0.0 : parseFloat($(video).find('starttime').text()); 
		      v.duration = !$(video).find('duration').text() ? -1.0 : parseFloat($(video).find('duration').text()); 
		      var webvtt = !$(video).find('webvtt').text() ? undefined : BaseConfig.baseURI+'/data'+ referVid.attr('fullid') +"/"+ $(video).find('webvtt').text(); 
		      v.title = !$(video).find('title').text() ? undefined : $(video).find('title').text(); 
		      
	    	  if (settings.ticket != undefined && webvtt != undefined) {
	    		 webvtt = webvtt + "?ticket="+options.ticket;
	    	  } 
	    	  
	    	  var subtitleObj = [];
	    	  
	    	  if (webvtt == undefined) {
		    	  var multiSubtitles = $(video).find('*').filter(function() {
		    		 return /^webvtt_/i.test(this.nodeName);
		    	  });

		    	  for (i = 0; i < multiSubtitles.length; i++) {
		    		  sObj = {};
		    		  sObj.language = multiSubtitles[i].tagName.substr(multiSubtitles[i].tagName.indexOf("_")+1);
		    		  var content = BaseConfig.baseURI+'/data'+ referVid.attr('fullid') +"/"+ multiSubtitles[i].textContent;
		    		  
		    		  if (settings.ticket != undefined) {
		    			  content = content + "?ticket="+options.ticket;
		 	    	  } 
		    		  
		    		  sObj.subtitle = content;
		    		  subtitleObj.push(sObj);
		    	  }
	    	  } else {
	    		  sObj = {};
	    		  
	    		  sObj.language = undefined;
	    		  sObj.subtitle = webvtt;
	    		  subtitleObj.push(sObj);
	    	  }
	    	  
	    	  v.subtitles = subtitleObj;
	    	  
		      v.position = k;
		      v.sources = [];
		      
		      var duration = 0;
		      
		      if (referVid.children('rawvideo').length > 0) {
		        $.each(referVid.children('rawvideo'), function(key, rawVideo) {
		          rawVideo = $(rawVideo);
	
		          //Only use video's that are not the original and which have a wantedheight defined.
		          if ((!rawVideo.find('original').text() && rawVideo.find('wantedheight').text() !== "") || referVid.children('rawvideo').length === 1) {  	  
		        	var add = false;
		            
		            //Check if there is already a source defined with the given wantedheight, if there is skip it, otherwise there will be duplicates.
		            var source = $.grep(v.sources, function(source) {
		              return source.quality == (rawVideo.find('wantedheight').text());
		            });
		            if (source === null) {
		              add = true;
		              source = {};
		            }
		
		            //Set the String by which we can retrieve the quality. Add a p behind the height, so that 360 become 360p.
		            source.quality = rawVideo.find('height').text() + "p";
		            //Set the codecs available for the source.
		            if (source.codecs === undefined)
		              source.codecs = [];
		
		            var codec = {};
		
		            //Set the video MIME type of the codec.
		            switch (rawVideo.find('extension').text()) {
		              case 'mp4':
		                codec.type = 'video/mp4';
		            }
		            
		            //Get the mount where we can find the video.
		            var mount = rawVideo.find('mount').text().split(',')[0];
		            codec.src = BaseConfig.baseURI+'/rafael/' + referVid.attr('fullid') + '/rawvideo/' + rawVideo.attr('id') + '/'+ rawVideo.find('filename').text();
		            var fullId = referVid.attr('fullid');
		            
		            //Add the codec to the source.
		            source.codecs.push(codec);
		            v.sources.push(source);
		            
		            //we need the duration to calculate the total duration, duration is in seconds, convert to miliseconds
		            duration = rawVideo.find('duration').text() !== "" ? parseFloat(rawVideo.find('duration').text()) * 1000 : duration;
		            v.oduration = duration;
		          }
		        });
		      }
		      videos[k] = v;
		      videos.duration = v.duration == -1 ? videos.duration + duration : videos.duration + v.duration;
	      });	      
      } 
      if (playlistAudios.length > 0) {
    	  $.each(playlistAudios, function(k, audio) {
		      var referAud = $(data.find('fsxml > audio[fullid|="' + $(audio).attr('referid') + '"]'));
		      var a = {};
		      
		      //Starttime and duration set are in ms
		      a.starttime = !$(audio).find('starttime').text() ? 0.0 : parseFloat($(audio).find('starttime').text()); 
		      a.duration = !$(audio).find('duration').text() ? -1.0 : parseFloat($(audio).find('duration').text()); 
		      a.title = !$(audio).find('title').text() ? undefined : $(audio).find('title').text(); 
		      
		      a.position = k;
		      a.sources = [];
		      
		      var duration = 0;
		      
		      if (referAud.children('rawaudio').length > 0) {
		        $.each(referAud.children('rawaudio'), function(key, rawAudio) {
		          rawAudio = $(rawAudio);
	
		          //Only use audio's that are not the original and which have a wantedheight defined.
		          if (!rawAudio.find('original').text() || referAud.children('rawaudio').length === 1) {  	  
		        	add = true;
		            var source = {};
		            
		            //Set the codecs available for the source.
		            if (source.codecs === undefined)
		              source.codecs = [];
		
		            var codec = {};
		
		            //Set the audio MIME type of the codec.
		            switch (rawAudio.find('extension').text()) {
		              case 'm4a':
		                codec.type = 'audio/mp4';
		            }
		            
		            //Get the mount where we can find the audio.
		            var mount = rawAudio.find('mount').text().split(',')[0];
		            codec.src = BaseConfig.baseURI+'/rafael/' + referAud.attr('fullid') + '/rawaudio/' + rawAudio.attr('id') + '/'+ rawAudio.find('filename').text();
		            var fullId = referAud.attr('fullid');
		            
		            //Add the codec to the source.
		            source.codecs.push(codec);
		            a.sources.push(source);
		            
		            //we need the duration to calculate the total duration, duration is in seconds, convert to miliseconds
		            duration = rawAudio.find('duration').text() !== "" ? parseFloat(rawAudio.find('duration').text()) * 1000 : duration;
		            a.oduration = duration;
		          }
		        });
		      }
		      audios[k] = a;
		      audios.duration = a.duration == -1 ? audios.duration + duration : audios.duration + a.duration;
	      });
      }
      
      settings.playMode = playMode;
      settings.videos = videos;
      settings.audios = audios;
    }

    function parseScreenshot() {
      var data = $(settings.data);
      var video = data.find('presentation > videoplaylist').first().find('video').first();
      var starttime = !$(video).find('starttime').text() ? 0 : $(video).find('starttime').text(); 
      var referVid = $(data.find('fsxml > video[fullid|="' + video.attr('referid') + '"]'));
      var screenshotElement = referVid.find('screens');
      var uri = screenshotElement.find('properties > uri').text();     
      uri = uri.replace("http://", "");
      uri = uri.replace(".noterik.com", BaseConfig.baseURI+"/data");      
      //var screenshotTime = Math.floor(parseInt(referVid.find('rawvideo[id=1] > properties > duration').text()) / 2);
      var screenshotTime =  Math.floor(parseInt(starttime) / 1000) + 1;
      var hours = Math.floor(screenshotTime / 3600);
      var minutes = Math.floor((screenshotTime % 3600) / 60);
      var seconds = Math.floor((screenshotTime % 3600) % 60);
      settings.screenshot = uri + "/h/" + hours + "/m/" + minutes + "/sec" + seconds + ".jpg";      
    }

    self.getVideos = function() {
      return settings.videos;
    };
    
    self.getAudios = function() {
    	return settings.audios;
    }
    
    self.getPlayMode = function() {
    	return settings.playMode;
    }

    self.getScreenshot = function() {
      return settings.screenshot;
    };

    initialize();

    return self;
  };

  return QSResponseParser;
});
