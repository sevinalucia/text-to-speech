var core = {
  "start": function () {
    core.load();
  },
  "install": function () {
    core.load();
  },
  "update": {
    "page": function () {
      app.page.send("storage", {
        "isBubbleIcon": config.settings.isBubbleIcon,
        "isTextSelection": config.settings.selection,
        "showHighlight": config.settings.showHighlight,
        "enableInputArea": config.settings.enableInputArea,
        "placeholderIconShow": config.settings.placeholderIconShow,
        "placeholderIconTime": config.settings.placeholderIconTime,
      }, null, null);
    }
  },
  "load": function () {
    const context = config.interface.context;
    const url = app.interface.path + '?' + context;
    /*  */
    app.interface.id = '';
    app.button.popup(context === "popup" ? url : '');
    /*  */
    app.contextmenu.create({
      "id": "tab", 
      "type": "radio", 
      "contexts": ["action"],
      "title": "Open in tab",  
      "checked": context === "tab"
    }, app.error);
    /*  */
    app.contextmenu.create({
      "id": "win", 
      "type": "radio", 
      "contexts": ["action"],
      "title": "Open in win",  
      "checked": context === "win"
    }, app.error);
    /*  */
    app.contextmenu.create({
      "id": "popup", 
      "type": "radio", 
      "contexts": ["action"],
      "title": "Open in popup",  
      "checked": context === "popup"
    }, app.error);
  },
  "action": {
    "storage": function (changes, namespace) {
      /*  */
    },
    "window": {
      "removed": function (e) {
        if (e === app.interface.id) {
          app.interface.id = '';
        }
      }
    },
    "contextmenu": function (e) {
      app.interface.close(config.interface.context);
      config.interface.context = e.menuItemId;
      /*  */
      const context = config.interface.context;
      const url = app.interface.path + '?' + context;
      app.button.popup(context === "popup" ? url : '');
    },
    "options": {
      "get": function (pref) {
        app.options.send("set", {
          "pref": pref, 
          "value": config.get(pref)
        });
      },
      "set": function (o) {
        config.set(o.pref, o.value);
        app.options.send("set", {
          "pref": o.pref, 
          "value": config.get(o.pref)
        });
        /*  */
        core.update.page();
      }
    },
    "button": function () {
      const context = config.interface.context;
      const url = app.interface.path + '?' + context;
      /*  */
      if (context === "popup") app.button.popup(url);
      else {
        if (app.interface.id) {
          if (context === "tab") {
            app.tab.get(app.interface.id, function (tab) {
              if (tab) {
                app.tab.update(app.interface.id, {"active": true});
              } else {
                app.interface.id = '';
                app.tab.open(url);
              }
            });
          }
          /*  */
          if (context === "win") {
            app.window.get(app.interface.id, function (win) {
              if (win) {
                app.window.update(app.interface.id, {"focused": true});
              } else {
                app.interface.id = '';
                app.interface.create();
              }
            });
          }
        } else {
          if (context === "tab") app.tab.open(url);
          if (context === "win") app.interface.create(url);
        }
      }
    }
  }
};

app.page.receive("load", core.update.page);

app.options.receive("changed", core.action.options.set);
app.options.receive("get", core.action.options.get);

app.button.on.clicked(core.action.button);
app.window.on.removed(core.action.window.removed);
app.contextmenu.on.clicked(core.action.contextmenu);

app.on.startup(core.start);
app.on.installed(core.install);
app.on.storage(core.action.storage);
