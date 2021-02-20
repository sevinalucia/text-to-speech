var audio = {
  "play": {
    "message": {
      '2': "To prevent this error, please avoid pausing the audio when a sentence is close to its end.",
      '1': "An error has occurred due to a bug in HTML5 TTS API! Please restart the browser and try again.",
      '3': "To prevent this error, please avoid canceling the audio (i.e. reloading the page) before it ends.",
    },
    "icon": {
      "placeholder": function (state) {
        if ("icon" in config) config.icon.update(state);
      }
    },
    "start": function () {
      config.isplaying = true;
      audio.play.icon.placeholder("pause");
      if (config.log) console.error(">> audio.play.start");
    },
    "pause": function () {
      config.isplaying = false;
      audio.play.icon.placeholder("play");
      if (config.log) console.error(">> audio.play.pause");
    },
    "error": function (code) {
      if (config.log) console.error(">> audio.play.error");
      config.state = "voice";
      config.isplaying = false;
      if ("hidebubble" in config) config.hidebubble();
      window.alert(audio.play.message['1'] + ' ' + audio.play.message[code]);
    },
    "end": function () {
      config.isplaying = false;
      tts.engine.highlight.remove();
      audio.play.icon.placeholder("replay");
      if (config.log) console.error(">> audio.play.end");
      if ("removeloader" in config) config.removeloader();
      if (config.selected.parent) config.selected.parent.style.backgroundColor = "transparent";
    },
    "match": function (word) {
      if (config.log) console.error(">> audio.play.match");
      if (word) {
        var a = config.page.url === "local";
        var b = document.location.href === config.page.url;
        if (a || b) tts.engine.highlight.add(word);
      }
    },
    "index": function (i) {
      config.isplaying = false;
      tts.engine.highlight.remove();
      if (config.log) console.error(">> audio.play.index", i);
      var flag = config.audiotextarray[i] && config.audiotextarray[i] !== " ";
      if (flag) {
        var a = config.page.url === "local";
        var b = document.location.href === config.page.url;
        if (a || b) tts.engine.highlight.add(config.audiotextarray[i]);
        /*  */
        config.isplaying = true;
      }
    }
  }
};
