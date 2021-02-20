var core = {
  "start": function () {
    core.load();
  },
  "install": function () {
    core.load();
  },
  "update": {
    "options": {
      "page": function () {
        app.page.send("options-storage", {
          "isBubbleIcon": config.settings.isBubbleIcon,
          "isTextSelection": config.settings.selection,
          "showHighlight": config.settings.showHighlight,
          "enableInputArea": config.settings.enableInputArea,
          "placeholderIconShow": config.settings.placeholderIconShow,
          "placeholderIconTime": config.settings.placeholderIconTime,
        }, null, null);
      }
    }
  },
  "load": function () {
    var context = config.interface.context;
    var url = app.interface.path + '?' + context;
    /*  */
    app.button.popup(context === "popup" ? url : '');
    /*  */
    app.contextmenu.create({
      "id": "tab", 
      "type": "radio", 
      "title": "Open in tab",  
      "checked": context === "tab",
      "contexts": ["browser_action"],
    });
    /*  */
    app.contextmenu.create({
      "id": "win", 
      "type": "radio", 
      "title": "Open in win",  
      "checked": context === "win",
      "contexts": ["browser_action"],
    });
    /*  */
    app.contextmenu.create({
      "id": "popup", 
      "type": "radio", 
      "title": "Open in popup",  
      "checked": context === "popup",
      "contexts": ["browser_action"],
    });
  }
};

app.options.receive("changed", function (o) {
  config.set(o.pref, o.value);
  app.options.send("set", {"pref": o.pref, "value": config.get(o.pref)});
  core.update.options.page();
});

app.window.on.removed(function (e) {
  if (e === app.interface.id) {
    app.interface.id = '';
  }
});

app.contextmenu.on.clicked(function (e) {
  app.interface.close(config.interface.context);
  config.interface.context = e.menuItemId;
  /*  */
  var context = config.interface.context;
  var url = app.interface.path + '?' + context;
  app.button.popup(context === "popup" ? url : '');
});

app.button.on.clicked(function () {
  var context = config.interface.context;
  var url = app.interface.path + '?' + context;
  /*  */
  if (context === "popup") app.button.popup(url);
  else {
    if (app.interface.id) {
      if (context === "tab") {
        app.tab.get(app.interface.id, function (tab) {
          if (tab) {
            app.tab.update(app.interface.id, {"active": true});
          }
        });
      }
      /*  */
      if (context === "win") {
        app.window.get(app.interface.id, function (win) {
          if (win) {
            app.window.update(app.interface.id, {"focused": true});
          }
        });
      }
    } else {
      if (context === "tab") app.tab.open(url);
      if (context === "win") app.interface.create(url);
    }
  }
});

app.page.receive("storage", core.update.options.page);
app.interface.receive("support", function () {app.tab.open(app.homepage())});
app.interface.receive("donation", function () {app.tab.open(app.homepage() + "?reason=support")});
app.options.receive("get", function (pref) {app.options.send("set", {"pref": pref, "value": config.get(pref)})});

app.on.startup(core.start);
app.on.connect(app.connect);
app.on.installed(core.install);