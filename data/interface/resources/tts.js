var tts = {
  "engine": {
    "find": {
      "word": function (e, p) {
        e = String(e);
        p = Number(p) >>> 0;
        const left = e.slice(0, p + 1).search(/\S+$/);
        const right = e.slice(p).search(/\s/);
        if (right < 0) return e.slice(left);
        /*  */
        return e.slice(left, right + p);
      }
    },
    "get": {
      "voices": async function () {
        let voices = window.speechSynthesis.getVoices();
        if (voices && voices.length) {
          return voices;
        } else {
          await new Promise((resolve) => {
            window.speechSynthesis.addEventListener("voiceschanged", resolve);
          });
          /*  */
          return window.speechSynthesis.getVoices();
        }
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
      const check_1 = "speechSynthesis" in window;
      const check_2 = "SpeechSynthesisUtterance" in window;
      /*  */
      if (config.page.url === "local") {
        config[check_1 && check_2 ? "support" : "nosupport"]();
      }
    },
    "split": {
      "text": function (e) {
        const result = [];
        const text = e.split(/\. |\; |\u060c | \? | \! | \: | \n/g);
        for (let i = 0; i < text.length; i++) {
          const subtext = tts.engine.split.string(text[i], null);
          for (let j = 0; j < subtext.length; j++) {
            if (subtext[j].length) result.push(subtext[j]);
          }
        }
        /*  */
        return result;
      },
      "string": function (e, n) {
        const result = [];
        /*  */
        if (n) {
          let tmp = [];
          let count = 0;
          let words = e.split(/\s+/g);
          /*  */
          for (let i = 0; i < words.length; i++) {
            tmp.push(words[i]); count++;
            if (count === n || i === words.length - 1) {
              result.push(tmp.join(' '));
              tmp = [], count = 0;
            }
          }
        } else {
          result.push(e);
        }
        /*  */
        return result;
      }
    },
    "highlight": {
      "remove": function () {
        const css = document.getElementById(config.css.id);
        if (css) css.remove();
        if (config.selected.parent) {
          config.selected.parent.style.backgroundColor = "transparent";
        }
      },
      "add": function (word) {
        const selection = window.getSelection();
        if (config.selected.parent) {
          config.selected.parent.style.backgroundColor = "rgba(0,0,0,0.1)";
          selection.collapse(config.selected.parent, 0);
          config.selected.parent.click();
        } else {
          selection.removeAllRanges();
        }
        /*  */
        const flag = window.find(word, false, false, true, false, true, false);
        if (flag) {
          let style = document.getElementById(config.css.id);
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
        window.speechSynthesis.pause();
        if ("flash" in config.app) config.app.flash.stop();
      },
      "play": function () {
        if (window.speechSynthesis.speaking) {
          audio.play.start();
          config.state = "pause";
          window.speechSynthesis.resume();
          if ("flash" in config.app) config.app.flash.start();
        } else {
          tts.engine.methods.start(3);
        }
      },
      "reset": function (url) {
        if (config.page.url === url) {
          audio.play.pause();
          config.audiotext = [];
          config.state = "voice";
          window.speechSynthesis.cancel();
          if ("flash" in config.app) config.app.flash.stop();
        }
      },
      "start": function (loc) {
        chrome.storage.local.get(null, async function (e) {
          const voices = e.voices !== undefined ? Number(e.voices) : 0;
          const dialect = e.dialect !== undefined ? Number(e.dialect) : 11;
          const language = e.language !== undefined ? Number(e.language) : 10;
          /*  */
          const options = [];
          const languages = tts.language[language];
          const voicelist = await tts.engine.get.voices();
          const attribute = document.documentElement.getAttribute("lang");
          const code = languages[dialect + 1] !== undefined ? languages[dialect + 1][0] : null;
          /*  */
          config.audio = new SpeechSynthesisUtterance();
          config.audio.lang = code ? code : (attribute ? (attribute.indexOf('-') !== -1 ? attribute : "en-US") : "en-US");
          /*  */
          if (voicelist) {
            for (let i = 0; i < voicelist.length; i++) {
              if (code) {
                if (code === voicelist[i].lang) {
                  options.push(voicelist[i]);
                }
              }
            }
          }
          /*  */
          if (options.length) {
            config.audio.voice = options[voices];
            config.audio.lang = options[voices].lang;
          }
          /*  */
          audio.play.start();
          config.state = "pause";
          if ("flash" in config.app) config.app.flash.start();
          if ("loader" in config.app) config.app.loader.draw(0);
          config.audio.text = config.audiotext.shift() || '';
          window.speechSynthesis.speak(config.audio);
          /*  */
          config.audio.onend = function () {
            if (config.audiotext.length) {
              tts.engine.methods.start(4);
            } else {
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
            const index = e.charIndex;
            const text = e.target.text;
            const word = tts.engine.find.word(text, index);
            if (word) {
              const elapsed = text.substr(0, index + word.length);
              if (elapsed) tts.engine.highlight.add(elapsed);
              if ("loader" in config.app) {
                const remaining = text.substr(index + word.length + 1, text.length);
                const percent = remaining ? (config.audio.text.length - remaining.length) / config.audio.text.length : 1;
                config.app.loader.draw(percent);
              }
            } else {
              if ("loader" in config.app) {
                config.app.loader.draw(0);
              }
            }
          };
        });
      }
    }
  }
};
