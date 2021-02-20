var tts = {
  "engine": {
    "find": {
      "word": function (e, p) {
        e = String(e);
        p = Number(p) >>> 0;
        var left = e.slice(0, p + 1).search(/\S+$/);
        var right = e.slice(p).search(/\s/);
        if (right < 0) return e.slice(left);
        /*  */
        return e.slice(left, right + p);
      }
    },
    "load": function () {
      config.app.voice = {
        "play": function () {tts.engine.methods.play()},
        "pause": function () {tts.engine.methods.pause()},
        "replay": function () {tts.engine.methods.start(2)},
        "reset": function (url, e) {tts.engine.methods.reset(url, e)},
        "start": function (data) {
          config.backup = data.text.concat();
          config.audiotext = data.text;
          config.page.url = data.url;
          tts.engine.methods.start(1);
        }
      };
      /*  */
      config.app.voice.reset("local", 1);
      var check_1 = "speechSynthesis" in window;
      var check_2 = "SpeechSynthesisUtterance" in window;
      /*  */
      if (config.page.url === "local") {
        config[check_1 && check_2 ? "support" : "nosupport"]();
      }
    },
    "split": {
      "text": function (e) {
        var result = [];
        var text = e.split(/\. |\; |\u060c | \? | \! | \: | \n/g);
        for (var i = 0; i < text.length; i++) {
          var subtext = tts.engine.split.string(text[i], null);
          for (var j = 0; j < subtext.length; j++) {
            if (subtext[j].length) result.push(subtext[j]);
          }
        }
        /*  */
        return result;
      },
      "string": function (e, n) {
        var result = [];
        if (n) {
          var tmp = [];
          var count = 0;
          var words = e.split(/\s+/g);
          /*  */
          for (var i = 0; i < words.length; i++) {
            tmp.push(words[i]); count++;
            if (count === n || i === words.length - 1) {
              result.push(tmp.join(' '));
              tmp = [], count = 0;
            }
          }
        } else result.push(e);
        /*  */
        return result;
      }
    },
    "highlight": {
      "remove": function () {
        var css = document.getElementById(config.css.id);
        if (css) css.remove();
        if (config.selected.parent) {
          config.selected.parent.style.backgroundColor = "transparent";
        }
      },
      "add": function (word) {
        var selection = window.getSelection();
        if (config.selected.parent) {
          config.selected.parent.style.backgroundColor = "rgba(0,0,0,0.1)";
          selection.collapse(config.selected.parent, 0);
          config.selected.parent.click();
        } else selection.removeAllRanges();
        /*  */
        var flag = window.find(word, false, false, false, false, false, false);
        if (flag) {
          var style = document.getElementById(config.css.id);
          if (!style) {
            style = document.createElement("style");
            style.type = "text/css";
            style.setAttribute("id", config.css.id);
            document.documentElement.appendChild(style);
            style.textContent = `
              ::selection {
                color: #333 !important;
                background: yellow !important;
                text-decoration: none !important;
              }
              ::-webkit-selection {
                color: #333 !important;
                background: yellow !important;
                text-decoration: none !important;
              }
              ::-moz-selection {
                color: #333 !important;
                background: yellow !important;
                text-decoration: none !important;
              }
            `;
          }
        }
      }
    },
    "methods": {
      "pause": function () {
        audio.play.pause();
        config.state = "play";
        speechSynthesis.pause();
        if ("flash" in config.app) config.app.flash.stop();
      },
      "play": function () {
        if (speechSynthesis.speaking) {
          audio.play.start();
          config.state = "pause";
          speechSynthesis.resume();
          if ("flash" in config.app) config.app.flash.start();
        } else tts.engine.methods.start(3);
      },
      "reset": function (url) {
        if (config.page.url === url) {
          audio.play.pause();
          config.audiotext = [];
          config.state = "voice";
          speechSynthesis.cancel();
          if ("flash" in config.app) config.app.flash.stop();
        }
      },
      "start": function (e) {
        config.audio = new SpeechSynthesisUtterance();
        var attribute = document.documentElement.getAttribute("lang") || "en-US";
        var lang = "button" in config ? config.button.dialect.value : attribute;
        /*  */
        config.audio.lang = lang;
        config.voices = speechSynthesis.getVoices();
        if (lang) {
          for (var i = 0; i < config.voices.length; i++) {
            if (config.voices[i].lang.indexOf(lang) !== -1) {
              config.audio.voice = config.voices[i];
              config.audio.lang = config.voices[i].lang;
              break;
            }
          }
        }
        /*  */
        audio.play.start();
        config.state = "pause";
        if ("flash" in config.app) config.app.flash.start();
        if ("loader" in config.app) config.app.loader.draw(0);
        config.audio.text = config.audiotext.shift() || '';
        speechSynthesis.speak(config.audio);
        /*  */
        config.audio.onend = function () {
          if (config.audiotext.length) tts.engine.methods.start(4);
          else {
            audio.play.end();
            config.audiotext = config.backup.concat();
            if ("flash" in config.app) config.app.flash.stop();
            if ("bubble" in config.app) config.app.bubble.hide();
            /*  */
            tts.engine.methods.reset("local");
          }
        };
        /*  */
        config.audio.onboundary = function (e) {
          var index = e.charIndex;
          var text = e.target.text;
          var word = tts.engine.find.word(text, index);
          if (word) {
            var elapsed = text.substr(0, index + word.length);
            if (elapsed) tts.engine.highlight.add(elapsed);
            if ("loader" in config.app) {
              var remaining = text.substr(index + word.length + 1, text.length);
              var percent = remaining ? (config.audio.text.length - remaining.length) / config.audio.text.length : 1;
              config.app.loader.draw(percent);
            }
          } else {
            if ("loader" in config.app) {
              config.app.loader.draw(0);
            }
          }
        };
      }
    }
  }
};
