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
    "load": async function () {
      if (config.element) {
        if (config.element.buttons) {
          config.element.buttons.setAttribute("loading", '');
        }
      }
      /*  */
      config.app.voice = {
        "play": function () {
          tts.engine.methods.play();
        },
        "pause": function () {
          tts.engine.methods.pause();
        },
        "replay": function () {
          tts.engine.methods.start(2);
        },
        "reset": function (url, e) {
          tts.engine.methods.reset(url, e);
        },
        "start": function (data) {
          config.backup = data.text.concat();
          config.audiotext = data.text;
          config.page.url = data.url;
          /*  */
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
      /*  */
      if (config.element) {
        if (config.element.buttons) {
          config.element.buttons.removeAttribute("loading");
        }
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
    "split": {
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
      },
      "text": function (e, q) {
        if (Intl !== undefined && Intl.Segmenter) {
          e = e.replace(/([a-z0-9])\.([A-Z])/g, "$1. $2");
          /*  */
          const result = [];
          const lines = e.split(/\r?\n/);
          const tmp = Intl.DateTimeFormat().resolvedOptions().locale;
          const locale = q ? q : (config.button ? config.button.dialect.value : tmp);
          const segmenter = new Intl.Segmenter(locale, {
            "granularity": "sentence"
          });
          /*  */
          for (let line of lines) {
            line = line.trim();
            if (!line) continue;
            /*  */
            let rawSegments = Array.from(segmenter.segment(line), s => s.segment.trim()).filter(segment => segment.length > 0);
            /*  */
            for (let i = 0; i < rawSegments.length - 1;) {
              const current = rawSegments[i];
              const next = rawSegments[i + 1];
              /*  */
              if (current.match(/\.\s*\[$/)) {
                const citationMatch = next.match(/^(\d+\](?:\s*:\s*[\d–]+(?:\s*–\s*[\d–]+)?)?)/u);
                if (citationMatch) {
                  const citation = citationMatch[1];
                  /*  */
                  rawSegments[i] += citation;
                  rawSegments[i + 1] = next.slice(citation.length).trim();
                  if (rawSegments[i + 1] === '') {
                    rawSegments.splice(i + 1, 1);
                  }
                  /*  */
                  continue;
                }
              }
              /*  */
              i++;
            }
            /*  */
            rawSegments.forEach(segment => {
              const fixed = segment.replace(/(\.)(\s*\[\d+(?:[\],:\d–\u200A-]*)?\])/g, "$1 $2");
              result.push(fixed);
            });
          }
          /*  */
          return result;
        } else {
          const result = [];
          const text = e.split(/\. |\; |\u060c | \? | \! | \: | \n/g);
          /*  */
          for (let i = 0; i < text.length; i++) {
            const subtext = tts.engine.split.string(text[i], null);
            /*  */
            for (let j = 0; j < subtext.length; j++) {
              if (subtext[j].length) result.push(subtext[j]);
            }
          }
          /*  */
          return result;
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
          try {
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
            config.audio.onend = async function () {
              if (config.audiotext.length) {
                tts.engine.methods.start(4);
              } else {
                audio.play.end();
                if (config.support) config.support();
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
          } catch (e) {
            config.nosupport();
            const reason = e && e.message ? e.message : "An unexpected error happened!";
            window.alert(reason + "\nPlease reload the app or try a different browser.");
          }
        });
      }
    }
  }
};

var kokoro = {
  "engine": {
    "instance": null,
    "init": function () {
      config.app.voice = {
        "start": function (data) {
          config.app.voice.replay(data.text, config.button.voices.value);
        },
        "play": function () {
          config.state = "pause";
          kokoro.engine.player.play();
          if ("flash" in config.app) config.app.flash.start();
        },
        "pause": function () {
          config.state = "play";
          kokoro.engine.player.pause();
          if ("flash" in config.app) config.app.flash.stop();
        },
        "replay": async function (text, voice) {
          config.state = "pause";
          config.button.audio.removeAttribute("href");
          config.button.audio.removeAttribute("download");
          if ("flash" in config.app) config.app.flash.start();
          if ("loader" in config.app) config.app.loader.draw(0);
          /*  */
          await kokoro.engine.player.replay(text, voice);
          /*  */
          config.state = "voice";
          kokoro.engine.player.stop();
          tts.engine.highlight.remove();
          if ("flash" in config.app) config.app.flash.stop();
        }
      };
    },
    "load": async function () {
      const remote = {};
      /*  */
      remote.host = "https://huggingface.co/onnx-community/Kokoro-82M-v1.0-ONNX";
      remote.permission = "Kokoro speech synthesis engine needs to download pre-trained model for: " + remote.host + " \n\nTo continue, press OK. Otherwise, press Cancel and change the speech synthesis engine. \n\nOnce downloaded, the data will be cached in memory, allowing the Speech to Text application to function offline."
      config.app.prefs.kokoro.permission = config.app.prefs.kokoro.permission || window.confirm(remote.permission);
      /*  */
      config.element.input.setAttribute("loading", '');
      config.element.buttons.setAttribute("loading", '');
      /*  */
      if (config.app.prefs.kokoro.permission) {
        try {
          const progress = {};
          const {env, KokoroTTS} = await import(chrome.runtime.getURL("/data/interface/vendor/kokoro.web.js"));
          /*  */
          env.telemetry = false;
          env.useNetwork = false;
          env.wasmPaths = {
            "mjs": chrome.runtime.getURL("/data/interface/vendor/wasm/ort-wasm-simd-threaded.jsep.mjs"),
            "wasm": chrome.runtime.getURL("/data/interface/vendor/wasm/ort-wasm-simd-threaded.jsep.wasm")
          };
          /*  */
          progress.size = {'a': 0, 'b': 0, 'c': 0};
          progress.percent = {'a': 0, 'b': 0, 'c': 0};
          config.show.info("loading", "Loading Koroko pre-trained model with 82 billion parameters.");
          await new Promise(resolve => window.setTimeout(resolve, 300));
          /*  */
          kokoro.engine.instance = await KokoroTTS.from_pretrained("onnx-community/Kokoro-82M-v1.0-ONNX", {
            "dtype": "fp32",
            "quantized": false,
            "device": config.app.prefs.backend,
            "progress_callback": async function (data) {
              if (data) {
                if (data.status === "done") {
                  /*  */
                } else {
                  if (data.file) {
                    progress.valid = data.loaded !== undefined && data.total !== undefined;
                    progress.model = data.file.indexOf("model.onnx");
                    progress.other = progress.model === -1;
                    /*  */
                    if (progress.valid) {
                      if (progress.other) progress.size.a = (data.total / (1024 * 1024)).toFixed(1);
                      if (progress.other) progress.percent.a = ((data.loaded / data.total) * 100).toFixed(1);
                      if (progress.model !== -1) progress.size.b = (data.total / (1024 * 1024)).toFixed(1);
                      if (progress.model !== -1) progress.percent.b = ((data.loaded / data.total) * 100).toFixed(1);
                    }
                    /*  */
                    progress.text = 
                      "Downloading model data for: " + remote.host + '\n' + ">> " + 
                      (progress.other ? "Loading " + data.file + ' ' + progress.percent.a + '%' + '\n' + ">> " : '') + 
                      "Loading model.onnx" + (progress.size.b ? " (" + progress.size.b + " MB)" : '') + ' ' + progress.percent.b + '%'
                    /*  */
                    config.show.info("loading", progress.text);
                  }
                }
              }
            }
          });
          /*  */
          await new Promise(resolve => window.setTimeout(resolve, 300));
          const gpuadapter = "gpu" in navigator ? await navigator.gpu.requestAdapter() : null;
          const gpudevice = gpuadapter ? await gpuadapter.requestDevice() : null;
          const supported = config.app.prefs.backend === "wasm" ? true : gpuadapter && gpudevice;
          /*  */
          if (supported) {
            config.support();
            kokoro.engine.init();
            config.show.info("start", "Please click on the speaker button to start the speech.");
          } else {
            config.nosupport();
            config.show.info("no_gpu", "Please reload the app or try a different browser.");
          }
        } catch (e) {
          config.nosupport();
          config.show.info("error", e && e.message ? e.message : "Please reload the app or try a different browser.");
        }
      }
      /*  */
      config.element.input.removeAttribute("loading");
      config.element.buttons.removeAttribute("loading");
    },
    "player": {
      "queue": [],
      "voice": null,
      "sentences": [],
      "ispaused": false,
      "preloadCount": 3,
      "currentIndex": 0,
      "currentSource": null,
      "context": new window.AudioContext(),
      "buffer": async function (text) {
        const output = await kokoro.engine.instance.generate(text, {"voice": this.voice});
        const buffer = this.context.createBuffer(1, output.audio.length, output.sampling_rate);
        /*  */
        buffer.getChannelData(0).set(output.audio);
        return buffer;
      },
      "pause": function () {
        if (this.currentSource) {
          this.ispaused = true;
          this.currentSource.stop();
          this.currentSource = null;
          config.show.info("start", "Playback stopped, please click the speaker button to start again.");
        }
      },
      "play": async function () {
        if (!this.ispaused) return;
        /*  */
        this.ispaused = false;
        await this.next(true);
        while (this.currentIndex < this.sentences.length && !this.ispaused) {
          await this.next();
        }
      },
      "replay": async function (sentences, voice) {
        this.queue = [];
        this.voice = voice;
        this.currentIndex = 0;
        this.sentences = sentences;
        /*  */
        await this.preload();
        /*  */
        while (this.currentIndex < this.sentences.length) {
          await this.next();
          if (this.ispaused) break;
        }
      },
      "stop": function () {
        this.ispaused = false;
        if (this.currentSource) this.currentSource.stop();
        /*  */
        this.audio.file();
        /*  */
        this.queue = [];
        config.support();
        this.currentIndex = 0;
        this.currentSource = null;
        config.show.info("start", "Playback stopped, please click the speaker button to start again.");
      },
      "preload": async function () {
        if (this.queue.length === 0) {
          config.element.input.setAttribute("loading", '');
          config.show.info("start", "Koroko AI engine is generating audio, please wait...");
        }
        /*  */
        const length = Math.min(this.preloadCount, this.sentences.length);
        for (let i = 0; i < length; i++) {
          this.queue.push({
            "sentenceIndex": i,
            "buffer": await this.buffer(this.sentences[i])
          });
        }
      },
      "next": async function (resumeSame = false) {
        try {
          config.element.input.removeAttribute("loading");
          if (this.currentIndex >= this.sentences.length) return;
          /*  */
          let currentBuffer;
          if (resumeSame && this._currentBuffer) {
            currentBuffer = this._currentBuffer;
          } else {
            currentBuffer = this.queue.find(q => q.sentenceIndex === this.currentIndex);
            if (!currentBuffer) {
              currentBuffer = {
                "buffer": await this.buffer(this.sentences[this.currentIndex])
              };
            }
            /*  */
            this._currentBuffer = currentBuffer;
          }
          /*  */
          if (!currentBuffer) return;
          /*  */
          const {buffer} = currentBuffer;
          this.currentSource = this.context.createBufferSource();
          this.currentSource.buffer = buffer;
          this.currentSource.connect(this.context.destination);
          tts.engine.highlight.add(this.sentences[this.currentIndex]);
          config.show.info("start", "Please click the speaker button to stop the playback.");
          this.currentSource.start(0);
          /*  */
          const nextIndex = this.currentIndex + this.preloadCount;
          if (nextIndex < this.sentences.length && !this.queue.find(q => q.sentenceIndex === nextIndex)) {
            this.buffer(this.sentences[nextIndex]).then(buf => {
              this.queue.push({
                "buffer": buf,
                "sentenceIndex": nextIndex
              });
            });
          }
          /*  */
          return new Promise(resolve => {
            this.currentSource.onended = () => {
              if (!this.ispaused) {
                this.currentIndex++;
                this._currentBuffer = null;
              }
              /*  */
              this.currentSource = null;
              resolve();
            };
          });
        } catch (e) {
          /*  */
        }
      },
      "audio": {
        "file": function () {
          const buffers = [];
          const queue = kokoro.engine.player.queue;
          const context = kokoro.engine.player.context;
          /*  */
          for (let q of queue) {
            if (q && q.buffer) {
              buffers.push(q.buffer);
            }
          }
          /*  */
          if (buffers.length > 0) {
            const length = buffers.reduce((sum, b) => sum + b.length, 0);
            const result = context.createBuffer(1, length, buffers[0].sampleRate);
            /*  */
            let offset = 0;
            for (let b of buffers) {
              result.getChannelData(0).set(b.getChannelData(0), offset);
              offset += b.length;
            }
            /*  */
            const filename = "tts-result.wav";
            const blob = this.buffer.to.wav(result);
            const href = URL.createObjectURL(blob);
            config.button.audio.setAttribute("href", href);
            config.button.audio.setAttribute("download", filename);
          }
        },
        "buffer": {
          "to": {
            "wav": function (buffer) {
              const channels = [];
              const numOfChan = buffer.numberOfChannels;
              const length = buffer.length * numOfChan * 2 + 44;
              const bufferArray = new ArrayBuffer(length);
              const view = new DataView(bufferArray);
              const sampleRate = buffer.sampleRate;
              /*  */
              const _write = function (view, offset, string) {
                for (let i = 0; i < string.length; i++) {
                  view.setUint8(offset + i, string.charCodeAt(i));
                }
              }
              /*  */
              let offset = 0;
              _write(view, offset, "RIFF"); offset += 4;
              view.setUint32(offset, length - 8, true); offset += 4;
              _write(view, offset, "WAVE"); offset += 4;
              _write(view, offset, "fmt "); offset += 4;
              view.setUint32(offset, 16, true); offset += 4;
              view.setUint16(offset, 1, true); offset += 2;
              view.setUint16(offset, numOfChan, true); offset += 2;
              view.setUint32(offset, sampleRate, true); offset += 4;
              view.setUint32(offset, sampleRate * numOfChan * 2, true); offset += 4;
              view.setUint16(offset, numOfChan * 2, true); offset += 2;
              view.setUint16(offset, 16, true); offset += 2;
              _write(view, offset, "data"); offset += 4;
              view.setUint32(offset, length - offset - 4, true); offset += 4;
              /*  */
              for (let i = 0; i < numOfChan; i++) {
                channels.push(buffer.getChannelData(i));
              }
              /*  */
              let pos = offset;
              for (let i = 0; i < buffer.length; i++) {
                for (let ch = 0; ch < numOfChan; ch++) {
                  let sample = Math.max(-1, Math.min(1, channels[ch][i]));
                  view.setInt16(pos, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
                  pos += 2;
                }
              }
              /*  */
              return new Blob([view], {"type": "audio/wav"});
            }
          }
        }
      }
    }
  }
};
