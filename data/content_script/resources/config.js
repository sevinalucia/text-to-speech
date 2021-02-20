var config = {
  "backup": [],
  "log": false,
  "storage": {},
  "audio": null,
  "keycode": '',
  "voices": null,
  "audiotext": [],
  "loaderctx": null,
  "isplaying": false,
  "page": {"url": ''},
  "audiotextarray": [],
  "selected": {"parent": null},
  "timeout": {"hide": null, "show": null},
  "css": {"id": "tts-highlight-color-css"},
  "icon": {
    "play": chrome.runtime.getURL("data/content_script/icons/play.png"),
    "replay": chrome.runtime.getURL("data/content_script/icons/play.png"),
    "pause": chrome.runtime.getURL("data/content_script/icons/pause.png"),
    "voice": chrome.runtime.getURL("data/content_script/icons/voice.png"),
    "loading": chrome.runtime.getURL("data/content_script/icons/loading.gif"),
    "update": function (state) {
      if (state) {
        config.icon.placeholder.element.setAttribute("state", state);
        if (config.icon[state]) {
          config.icon.placeholder.element.style.backgroundImage = 'url("' + config.icon[state] + '")';
        }
      }
    },
    "placeholder": {
      "element": null,
      "hover": function (e) {
        while (e.parentNode && e.getAttribute) {
          if (e === config.icon.placeholder.element) return true;
          e = e.parentNode;
        }
        /*  */
        return false;
      },
      "show": function () {
        var rect = request.voice.rect;
        config.icon.placeholder.element.style.top = (rect.top + window.scrollY - 40) + 'px';
        config.icon.placeholder.element.style.left = (rect.left + window.scrollX + rect.width / 2 - 16) + 'px';
        if (config.timeout.show) window.clearTimeout(config.timeout.show);
        if (config.timeout.hide) window.clearTimeout(config.timeout.hide);
        /*  */
        var flag = config.storage.placeholderIconTime < 60;
        config.timeout.show = window.setTimeout(function () {config.icon.placeholder.element.style.display = "block"}, config.storage.placeholderIconShow * 1000);
        if (flag) config.timeout.hide = window.setTimeout(function () {config.icon.placeholder.element.style.display = "none"}, config.storage.placeholderIconTime * 1000);
      }
    }
  },
  "selected": {
    "text": function (t) {
      var selection = function (e) {
        var value = e.value;
        var end = e.selectionEnd;
        var start = e.selectionStart;
        if (value && start && end) return value.substring(start, end);
      };
      /*  */
      var selected = window.getSelection().toString();
      if (!selected) selected = selection(t);
      return selected;
    },
    "rect": function (e) {
      var range = e.getRangeAt(0).cloneRange();
      var dummy = document.createElement("span");
      if (range.startOffset !== range.endOffset) return range.getBoundingClientRect();
      else {
        var arr = range.startContainer.childNodes;
        for (var i = 0; i < arr.length; i++) {
          var target = arr[i].nodeName.toLowerCase();
          if (target === "textarea" || target === "input") {
            var rect = getboundingbox(arr[i], arr[i].selectionStart, arr[i].selectionEnd);
            if (rect.top && rect.left && rect.height && rect.width) return rect;
          }
        }
        /*  */
        range.collapse(false);
        range.insertNode(dummy);
        var rect = dummy.getBoundingClientRect();
        dummy.parentNode.removeChild(dummy);
        return rect;
      }
    }
  },
  "app": {
    "bubble": {
      "hide": function (e) {
        if (config.isplaying) return;
        if (e && e.button === 2) return;
        if (e && config.icon.placeholder.hover(e.target)) return;
        /*  */
        config.app.loader.remove();
        tts.engine.highlight.remove();
        var selection = window.getSelection();
        selection.collapse(config.selected.parent, 0);
        if ("voice" in config.app) config.app.voice.reset(document.location.href, 2);
        if (config.selected.parent) config.selected.parent.style.backgroundColor = "transparent";
        /*  */
        if (config.icon.placeholder.element) {
          config.icon.placeholder.element.style.display = "none";
          config.icon.placeholder.element.setAttribute("state", "voice");
          config.icon.placeholder.element.style.backgroundImage = 'url("' + config.icon.voice + '")';
        }
      }
    },
    "loader": {
      "canvas": null,
      "remove": function () {
        if (config.app.loader.canvas) {
          config.app.loader.canvas.style.display = "none";
        }
      },
      "draw": function (p) {
        if (config.app.loader.canvas) {
          config.app.loader.canvas.style.display = "block";
        }
        /*  */
        if (p) {
          var render = function (g, p) {
            var PI2 = Math.PI * 2;
            var quart = Math.PI / 2;
            var extent = parseInt((g.end - g.start) * p);
            var current = (g.end - g.start) / 100 * PI2 * p - quart;
            config.loaderctx.beginPath();
            config.loaderctx.arc(g.x, g.y, g.radius, -quart, current);
            config.loaderctx.strokeStyle = g.color;
            config.loaderctx.stroke();
            config.loaderctx.fillStyle = g.color;
          };
          /*  */
          config.loaderctx.clearRect(0, 0, config.app.loader.canvas.width, config.app.loader.canvas.height);
          render({'x': 18, 'y': 18, "radius": 15, "start": 0, "end": 100, "color": "rgba(0,0,0,0.4)"}, p);
        } else config.app.loader.canvas.classList.add("loading-circle-blink");
      }
    }
  }
};
