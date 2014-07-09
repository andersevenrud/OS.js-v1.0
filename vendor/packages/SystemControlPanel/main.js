/*!
 * OS.js - JavaScript Operating System - Contains SystemControlPanel JavaScript
 *
 * Copyright (c) 2011-2012, Anders Evenrud <andersevenrud@gmail.com>
 * All rights reserved.
 * 
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met: 
 * 
 * 1. Redistributions of source code must retain the above copyright notice, this
 *    list of conditions and the following disclaimer. 
 * 2. Redistributions in binary form must reproduce the above copyright notice,
 *    this list of conditions and the following disclaimer in the documentation
 *    and/or other materials provided with the distribution. 
 * 
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
 * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR
 * ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 *
 * @package OSjs.Packages
 * @author Anders Evenrud <andersevenrud@gmail.com>
 * @licence Simplified BSD License
 * @class
 */
OSjs.Packages.SystemControlPanel = (function($, undefined) {
  "$:nomunge";

  var _LINGUAS = {
    'en_US' : {
      "title" : "Control Panel",
      "locale" : "Changing locales requires a restart to fully take effect!",
      "invalid_locale" : "Invalid locale location given!",
      "titles"  : {
        "user"      : "User",
        "settings"  : "Settings",
        "ui"        : "UI",
        "ui_display": "Display",
        "ui_sound"  : "Sounds",
        "locale"    : "Localization",
        "pkg"       : "Packages"
      },
      "packages" : {
        "protected"     : "Protected",
        "btn_install"   : "Install package",
        "btn_uninstall" : "Uninstall selected"
      },
      "not_title"         : "Configuration changes",
      "not_description"   : "Your settings have been saved",
      "userdata_error"    : "Error loading user data!"
    },
    'nb_NO' : {
      "title" : "Kontrollpanel",
      "locale" : "Endring av lokalisering trenger omstart for å bli iverksatt!",
      "invalid_locale" : "Ugyldig kokalisering angitt!",
      "titles"  : {
        "user"      : "Bruker",
        "settings"  : "Instillinger",
        "ui"        : "UI",
        "ui_display": "Visning",
        "ui_sound"  : "Lyder",
        "locale"    : "Lokalisering",
        "pkg"       : "Pakker"
      },
      "packages" : {
        "protected"     : "Protected",
        "btn_install"   : "Install package",
        "btn_uninstall" : "Uninstall selected"
      },
      "not_title"         : "Konfigurasjon endringer",
      "not_description"   : "Dine instillinger har blitt lagret",
      "userdata_error"    : "Klarte ikke laste brukerdata!"
    }
  };

  return function(GtkWindow, Application, API, argv, windows) {
    "GtkWindow:nomunge, Application:nomunge, API:nomunge, argv:nomunge, windows:nomunge";

    var LABELS = _LINGUAS[API.system.language()] || _LINGUAS['en_US'];

    ///////////////////////////////////////////////////////////////////////////
    // CONTENTS
    ///////////////////////////////////////////////////////////////////////////

    /**
     * Create 'User' Content
     * @function
     */
    var Content_User = function(app) {
      var container = $("<div class=\"Inner IUser\"></div>");
      container.append("<h1>" + LABELS.titles.user+ "</h1>");

      var avatar = $("<div class=\"Avatar\"><img src=\"/img/blank.gif\" alt=\"\" /></div>");
      container.append(avatar);


      var inner = $("<div>Loading</div>"); // FIXME: Locale
      var table = $("<table></table>");
      var blabels = LABELS.browser;

      app._event("avatar", {}, function(data) {
        if ( data ) {
          $(avatar).find("img").attr("src", data);
        }
      }, false);

      API.system.post({"action" : "user"}, function(data) {
        if ( data.success ) {
          forEach(data.result, function(key, val) {
            $(table).append($(sprintf("<tr><td class=\"pri\">%s</td><td class=\"sec\">%s</td></tr>", key, val)));
          });
          inner.html(table);
        } else {
          inner.html(LABELS.userdata_error);
        }
      });

      container.append(inner);

      return container.hide();
    };

    /**
     * Create 'Display' Content
     * @function
     */
    var Content_UI = function(App) {

      var themes  = API.user.settings.options("desktop.theme");
      var fonts   = API.user.settings.options("desktop.font");
      var wtypes  = API.user.settings.options("desktop.wallpaper.type");
      var effen   = API.user.settings.options("wm.effects.enable");

      var sthemes = API.user.settings.options("system.sounds.theme");

      var __createElement = function(table, key, title, options) {
        var ktype = API.user.settings.type(key);

        var val = API.user.settings.get(key);
        var row = $("<tr><td class=\"pri\">" + title + "</td></tr>");
        var lkey = key.replace(/\./g, "_");
        var select, tmp, e;

        if ( options ) {
          select = $("<select class=\"" + lkey + "\"></select>");
          for  ( var i in options ) {
            if ( options.hasOwnProperty(i) ) {
              e = $("<option value=\"" + options[i] + "\">" + options[i] + "</option>");
              select.append(e);
            }
          }
          tmp = $("<td></td>");
          tmp.append(select);
          row.append(tmp);
          select.val(val);
        } else {
          var it;
          if ( key == "desktop.background.color" ) {
            it = $(sprintf("<input class=\"%s ColorChooser\" type=\"text\" value=\"%s\" style=\"background-color:%s;\" /></td>", lkey, val, val));
            it.click((function(curcolor, input) {
              return function() {
                App.createColorDialog({'color' : curcolor, 'on_apply' : function(rgb, hex) {
                  input.css("background-color", hex);
                  input.val(hex);
                }});
              };
            })(val, it));

            it.focus(function() {
              $(this).blur();
            });

            row.append(it);
          } else if ( key == "system.sounds.volume" ) {
            it = $("<div></div>").slider({
              min   : 0,
              max   : 100,
              step  : 1,
              value : val
            });
            it.addClass(lkey);

            row.append(it);
          } else {
            if ( ktype == "boolean" || ktype == "bool" ) {
              select = $("<select class=\"" + lkey + "\"></select>");
              options = ["true", "false"];
              for ( var b in  options ) {
                if ( options.hasOwnProperty(b) ) {
                  e = $("<option value=\"" + options[b] + "\">" + options[b] + "</option>");
                  select.append(e);
                }
              }
              val = val === true ? "true" : "false";

              tmp = $("<td></td>");
              tmp.append(select);
              row.append(tmp);
              select.val(val);
              row.append(tmp);
              select.val(val);
            } else {
              it = $(sprintf("<input class=\"%s\" type=\"text\" value=\"%s\" /></td>", lkey, val));
              if ( key == "desktop.wallpaper.path" ) {
                it.addClass("Browse");
                it.attr("disabled", "disabled");
                row.append(it);

                var button = $("<button class=\"BrowseButton\">...</button>");
                button.click((function(curfile, input) {
                  return function() {
                    App.createFileDialog({'on_apply' : function(fname) {
                      input.val(fname);
                    }, 'mime' : ["image/*"], 'type' : "open", 'cwd' : dirname(curfile)});
                  };
                })(val, it));

                it.after(button);
              } else {
                row.append(it);
              }
            }
          }
        }
        table.append(row);
      };


      var container = $("<div class=\"Inner IUI\"></div>");
      var table;

      table = $("<table></table>");
      __createElement(table, "desktop.wallpaper.path", "Wallpaper Path");
      __createElement(table, "desktop.wallpaper.type", "Wallpaper Type", wtypes);
      __createElement(table, "desktop.background.color", "Background Color");
      __createElement(table, "desktop.theme", "Theme", themes);
      __createElement(table, "desktop.font", "Font Scheme", fonts);
      __createElement(table, "wm.effects.enable", "Effects & Animations", effen);
      container.append("<h1>" + LABELS.titles.ui_display + "</h1>");
      container.append(table);

      table = $("<table></table>");
      container.append("<h1>" + LABELS.titles.ui_sound + "</h1>");
      __createElement(table, "system.sounds.enable", "Sound Enabled");
      __createElement(table, "system.sounds.theme", "Sound Theme", sthemes);
      __createElement(table, "system.sounds.volume", "Sound Volume");
      container.append(table);

      return container.hide();
    };

    /**
     * Create 'Settings' Content
     * @function
     */
    var Content_Settings = function() {
      var container = $("<div class=\"Inner ISettings\"></div>");
      var table = $("<table></table>");
      container.append("<h1>" + LABELS.titles.settings + "</h1>");

      var __createElement = function(key, title) {
        var val   = API.user.settings.get(key);
        var row   = $("<tr></tr>");
        var lkey  = key.replace(/\./g, "_");
        var check = $(sprintf("<input type=\"checkbox\" class=\"%s\" />", lkey));

        if ( val === true || val === "true" ) {
          check.attr("checked", "checked");
        } else {
          check.removeAttr("checked");
        }

        row.append($(sprintf("<td class=\"pri\">%s</td>", title)));
        row.append($("<td class=\"sec\"></td>").append(check));


        table.append(row);
      };

      var __reloadSessions = function() {
        var select = container.find(".Snapshots select");
        select.empty();

        API.session.snapshot_list(function(response) {
          if ( !response.error && (response.result instanceof Array) ) {
            for ( var i = 0; i < response.result.length; i++ ) {
              var el = $("<option value\"" + response.result[i] + "\">" + response.result[i] + "</option>");
              select.append(el);
            }
          }
        });
      };

      var __createSession = function(name) {
        if ( name ) {
          API.session.snapshot_create(name, function(response) {
            if ( response.error ) {
              API.application.notification("Snapshot failed", "Failed to create '" + name + "'.", "status/appointment-missed.png"); // FIXME: Locale
            } else {
              API.application.notification("Snapshot saved", "Created '" + name + "'.", "status/appointment-soon.png"); // FIXME: Locale
            }
            __reloadSessions();
          });
        }
      };

      var __restoreSession = function(name) {
        if ( name ) {
          API.session.snapshot_restore(name, function(response) {
            if ( response.error ) {
              API.application.notification("Snapshot failed", "Failed to load '" + name + "'.", "status/appointment-missed.png"); // FIXME: Locale
            } else {
              API.session.restart();
            }
          });
        }
      };

      var __deleteSession = function(name) {
        if ( name ) {
          API.session.snapshot_delete(name, function(response) {
            if ( response.error ) {
              API.application.notification("Snapshot error", "Failed to delete '" + name + "'.", "status/dialog-warning.png"); // FIXME: Locale
            } else {
              API.application.notification("Snapshot success", "Deleted '" + name + "'.", "status/user-trash-full.png"); // FIXME: Locale
            }

            __reloadSessions();
          });
        }
      };

      var __reloadProcesses = function() {
        var select = container.find(".Autoruns select");
        select.empty();

        var result = API.user.settings.get("user.autorun");
        if ( result && result.length ) {
          for ( var i = 0; i < result.length; i++ ) {
            var el = $("<option value\"" + i + "\">" + result[i] + "</option>");
            select.append(el);
          }
        }
      };

      var __createProcess = function(name) {
        if ( name ) {
          var result = API.user.settings.get("user.autorun");
          var found  = false;
          for ( var i = 0; i < result.length; i++ ) {
            if ( result[i] == name ) {
              found = true;
              break;
            }
          }
          if ( !found ) {
            result.push(name);
            API.user.settings.save({"user.autorun" : result});
            __reloadProcesses();
          }
        }
      };

      var __deleteProcess = function(name) {
        var result = API.user.settings.get("user.autorun");
        if ( result && result.length ) {
          for ( var i = 0; i < result.length; i++ ) {
            if ( result[i] == name ) {
              result.splice(i, 1);
              API.user.settings.save({"user.autorun" : result});
              __reloadProcesses();
              break;
            }
          }
        }
      };

      __createElement("user.session.confirm", "Confirm Logout");
      __createElement("user.session.autorestore", "Automatic session restore");
      __createElement("user.session.autosave", "Automatic session saving");

      container.append(table);

      //
      // Snapshots
      //
      var cbutton = false;
      var csession = null;

      container.append("<div class=\"Snapshots\"><h1>Session Snapshots</h1><div class=\"SnapshotsInner\"><div class=\"List\"><select size=\"5\"></select></div><div class=\"SessionButtons\"><button class=\"Restore\">Restore</button><button class=\"Delete\">Delete</button><button class=\"Create\">Create</button></div><div class=\"CreateSession\"><label>New session name:</label><input type=\"text\" /></div></div></div>"); // FIXME: Locale
      container.find(".CreateSession").hide();

      container.find(".Snapshots select").change(function() {
        csession = $(this).val();
      });
      container.find(".SessionButtons button").click(function() {
        container.find(".CreateSession").hide();
      });
      container.find(".SessionButtons .Delete").click(function() {
        __deleteSession(csession);
      });
      container.find(".SessionButtons .Restore").click(function() {
        __restoreSession(csession);
      });
      container.find(".SessionButtons .Create").click(function() {
        if ( cbutton ) {
          var name = container.find(".CreateSession input").val();
          __createSession(name);

          container.find(".SessionButtons button").removeAttr("disabled");
          container.find(".CreateSession").hide();

          cbutton = false;
        } else {
          container.find(".CreateSession").show();
          container.find(".SessionButtons button").attr("disabled", "disabled");
          container.find(".SessionButtons .Create").removeAttr("disabled");

          cbutton = true;
        }
      });

      __reloadSessions();

      //
      // Autorun
      //
      var abutton = false;
      var aprocess = null;
      container.append("<div class=\"Autoruns\"><h1>Autorun Processes</h1><div class=\"AutorunsInner\"><div class=\"List\"><select size=\"5\"></select></div><div class=\"ProcessButtons\"><button class=\"Delete\">Delete</button><button class=\"Create\">Add</button></div><div class=\"CreateProcess\"><label>Process name:</label><input type=\"text\" /></div></div></div>"); // FIXME: Locale
      container.find(".CreateProcess").hide();

      container.find(".Autoruns select").change(function() {
        aprocess = $(this).val();
      });
      container.find(".ProcessButtons button").click(function() {
        container.find(".CreateProcess").hide();
      });
      container.find(".ProcessButtons .Delete").click(function() {
        __deleteProcess(aprocess);
      });
      container.find(".ProcessButtons .Create").click(function() {
        if ( abutton ) {
          var name = container.find(".CreateProcess input").val();
          __createProcess(name);

          container.find(".ProcessButtons button").removeAttr("disabled");
          container.find(".CreateProcess").hide();

          abutton = false;
        } else {
          container.find(".CreateProcess").show();
          container.find(".ProcessButtons button").attr("disabled", "disabled");
          container.find(".ProcessButtons .Create").removeAttr("disabled");

          abutton = true;
        }
      });

      __reloadProcesses();

      return container.hide();
    };

    /**
     * Create 'Localization' Content
     * @function
     */
    var Content_Localization = function() {
      var container = $("<div class=\"Inner ILocalization\"></div>");
      var table = $("<table></table>");
      container.append("<h1>" + LABELS.titles.locale + "</h1>");

      var languages = API.system.languages();
      var locations = API.user.settings.options("system.locale.location");
      var language = API.user.settings.get("system.locale.language");

      var __createElement = function(key, title, options) {
        var val = API.user.settings.get(key);
        var row = $("<tr><td class=\"pri\">" + title + "</td></tr>");

        var lkey = key.replace(/\./g, "_");
        if ( options ) {
          var select = $("<select class=\"" + lkey + "\"></select>");
          for  ( var i in options ) {
            if ( options.hasOwnProperty(i) ) {
              var e = $("<option class=\"" + lkey + "\" value=\"" + i + "\">" + options[i] + "</option>");
              select.append(e);
            }
          }
          var tmp = $("<td></td>");
          tmp.append(select);
          row.append(tmp);

          select.val(val);
        } else {
          row.append(sprintf("<input class=\"" + lkey + "\" type=\"text\" value=\"%s\" /></td>", val));
        }
        table.append(row);
      };

      __createElement("system.locale.location", "Timezone");
      __createElement("system.locale.time-format", "Time Format");
      __createElement("system.locale.date-format", "Date Format");
      __createElement("system.locale.timestamp-format", "Timestamp Format");
      __createElement("system.locale.language", "Language", languages);

      container.append(table);

      return container.hide();
    };

    /**
     * Create 'Packages' Content
     * @function
     */
    var Content_Packages = function(app) {
      var container = $("<div class=\"Inner IPackages\"></div>");
      container.append("<h1>" + LABELS.titles.pkg + "</h1>");

      var outer = $("<div class=\"PackageList\"></div>");
      var list  = [];
      var current_packages = null;
      var options = $("<div class=\"PackageOptions\"></div>");
      options.append($("<button class=\"Install\">" + LABELS.packages.btn_install + "</button>"));
      options.append($("<button class=\"Uninstall\">" + LABELS.packages.btn_uninstall + "</button>").attr("disabled", "disabled"));

      options.find(".Install").click(function() {
        app.createUploadDialog({'path' : "/User/.osjs/tmp", 'on_success' : function(fpath, fmime, response) {
          API.user.settings.package_install(fpath, function(res) {
            if ( res ) {
              updatelist();
            }
          });
        }});
      });
      options.find(".Uninstall").click(function() {
        for ( var cp in current_packages ) {
          if ( current_packages.hasOwnProperty(cp) ) {
            API.user.settings.package_uninstall(current_packages[cp], function(res) {
              if ( res ) {
                updatelist();
              }
            });
          }
        }
      });

      var guilist = new OSjs.Classes.CheckList();
      outer.append(guilist.$element);
      container.append(options);
      container.append(outer);

      var updatebuttons = function() {
        options.find(".Uninstall").attr("disabled", "disabled");

        if ( current_packages !== null ) {
          options.find(".Uninstall").removeAttr("disabled");
        }
      };

      var changeelement = function(it, en) {
        if ( current_packages === null ) {
          if ( en ) {
            current_packages = {};
            current_packages[it.name] = it;
          }
        } else {
          if ( en ) {
            current_packages[it.name] = it;
          } else {
            delete current_packages[it.name];
            if ( !sizeof(current_packages) )
              current_packages = null;
          }
        }

        updatebuttons();
      };

      var draw = function() {
        guilist.draw(list, null, function(el, iter) {
          var newinner = $("<div class=\"Item\"></div>");
          var label = el.find("label").detach();
          var input = el.find("input");
          var image = $("<img alt=\"\" src=\"" + iter.icon + "\"/>");
          var type = $("<span class=\"type\">" + iter.type + "</span>");

          input.prop("checked", false);

          if ( iter.locked ) {
            input.attr("disabled", "disabled");
            type.append(sprintf("<span class=\"%s\"> %s</span>", "protected", LABELS.packages['protected']));
          } else {
            $(input).change(function() {
              changeelement(iter, input.is(":checked"));
            });

            el.click(function() {
              input.prop("checked", !input.is(":checked"));
              input.change();
            });
          }


          newinner.append(image);
          newinner.append(label);
          newinner.append(type);
          el.append(newinner);
        });
      };

      var updatelist = function() {
        current_packages = null;
        list = API.user.settings.packages(true);

        updatebuttons();
        draw();
      };

      // Main
      updatelist();

      return container.hide();
    };

    ///////////////////////////////////////////////////////////////////////////
    // WINDOWS
    ///////////////////////////////////////////////////////////////////////////

    var Window_window1 = GtkWindow.extend({

      init : function(app) {
        this._super("Window_window1", false, app, windows);
        this._content = $("<div> <div class=\"GtkWindow window1\"> <div class=\"ControlPanel GUIPanned\"></div> </div> </div> ").html();
        this._title = LABELS.title;
        this._icon = 'categories/preferences-system.png';
        this._is_draggable = true;
        this._is_resizable = false;
        this._is_scrollable = false;
        this._is_sessionable = true;
        this._is_minimizable = false;
        this._is_maximizable = false;
        this._is_closable = true;
        this._is_orphan = true;
        this._width = 600;
        this._height = 450;
        this._gravity = 'center';
      },

      destroy : function() {
        this._super();
      },

      create : function(id, mcallback) {
        var el = this._super(id, mcallback);
        var self = this;

        if ( el ) {
          // Do your stuff here

          // Create main containers
          var inner = el.find(".ControlPanel");
          var buttons = $("<div class=\"Buttons\"><button class=\"Save\">Apply</button><button class=\"Close\">Close</button></div>"); // FIXME: Translate
          buttons.find(".Save").click(function() {
            self.applyChanges();
          });
          buttons.find(".Close").click(function() {
            self.$element.find(".ActionClose").click();
          });

          // Create the main table
          var table = $("<div class=\"Main\"><div class=\"CMenu\"><ul></ul></div><div class=\"Content\"></div></div>");
          var menu = table.find(".CMenu ul");
          var content = table.find(".Content");

          // Content displayer function
          var nbid = self._name + "_CurrentItem";
          var show_content = function(index, sel) {
            console.log("SystemControlPanel::create::(show_content)", index, sel);

            content.find(".Inner").hide();
            $(content.find(".Inner").get(index)).show();

            self.app._setArgv(nbid, index);

            menu.find("li").removeClass("Current");
            if ( sel ) {
              sel.addClass("Current");
            } else {
              menu.find("li").first().addClass("Current");
            }
          };

          // Apply content
          content.append(Content_User(self.app));
          content.append(Content_Settings());
          content.append(Content_UI(self.app));
          content.append(Content_Localization());
          content.append(Content_Packages(self.app));

          // Create menu items etc
          var menu_items = [
            {
              "icon"  : "/img/icons/32x32/apps/user-info.png",
              "title" : LABELS.titles.user //"User"
            },
            {
              "icon"  : "/img/icons/32x32/categories/preferences-desktop.png",
              "title" : LABELS.titles.settings //"Settings"
            },
            {
              "icon"  : "/img/icons/32x32/apps/preferences-desktop-theme.png",
              "title" : LABELS.titles.ui //"UI"
            },
            {
              "icon"  : "/img/icons/32x32/apps/locale.png",
              "title" : LABELS.titles.locale //"Localization"
            },
            {
              "icon"  : "/img/icons/32x32/apps/system-software-install.png",
              "title" : LABELS.titles.pkg //"Packages"
            }
          ];

          for ( var i = 0; i < menu_items.length; i++ ) {
            el = $("<li></li>");
            el.append($("<div class=\"Icon\"><img alt=\"\" src=\"" + menu_items[i].icon + "\" /></div>"));
            el.append($("<div class=\"Title\"><span>" + menu_items[i].title + "</span></div>"));
            el.click((function(ii, iter) {
              return function() {
                show_content(ii, $(this));
              };
            })(i, menu_items[i]));

            menu.append(el);
          }

          // Append to DOM
          inner.append(table);
          inner.append(buttons);

          setTimeout(function() {
            var cur = self.app._getArgv(nbid);
            if ( cur !== null  ) {
              show_content(cur, $(menu.find("li").get(cur)));
            } else {
              show_content(0, null);
            }
          }, 0);
        }
      },


      applyChanges : function() {
        var self = this;
        var args = {};
        var keys = [
          "desktop.wallpaper.path",
          "desktop.theme",
          "desktop.font",
          "desktop.wallpaper.type",
          "desktop.background.color",

          "system.sounds.enable",
          "system.sounds.theme",
          "system.sounds.volume",

          "system.locale.location",
          "system.locale.time-format",
          "system.locale.date-format",
          "system.locale.timestamp-format",
          "system.locale.language",

          "user.session.confirm",
          "user.session.autorestore",
          "user.session.autosave",

          "wm.effects.enable"
        ];

        var o, el, val, t;
        for ( o = 0; o < keys.length; o++ ) {
          el = self.$element.find("." + keys[o].replace(/\./g, "_"));
          if ( el.length ) {
            t = API.user.settings.type(keys[o]);

            if ( el.is("input") && el.is(':checkbox') ) {
              val = el.is(":checked") ? true : false;
            } else {
              if ( el.hasClass("ui-slider") ) {
                val = parseInt(el.slider("value"), 10);
              } else {
                val = el.val();
                if ( t == "bool" || t == "boolean" ) {
                  val = val === "true";
                } else if ( t == "int" || t == "integer" ) {
                  val = parseInt(val, 10);
                }
              }
            }

            args[keys[o]] = val;
          }
        }

        self.app.applyChanges(args);
      }

    });


    ///////////////////////////////////////////////////////////////////////////
    // APPLICATION
    ///////////////////////////////////////////////////////////////////////////

    var __SystemControlPanel = Application.extend({

      init : function() {
        this._super("SystemControlPanel", argv);
      },

      destroy : function() {
        this._super();
      },

      run : function() {
        var self = this;

        var root_window = new Window_window1(self);
        this._super(root_window);
        root_window.show();

        // Do your stuff here
      },

      applyChanges : function(args) {
        var self = this;

        // Reset any fields containing errors
        var _confirm = false;

        for ( var x in args ) {
          if ( args.hasOwnProperty(x) ) {
            var deflt = API.user.settings.get(x);
            var reset = false;

            if ( args[x] === undefined || args[x] === null || args[x] === "" ) {
              args[x] = deflt;
              reset = true;
            }

            switch ( x ) {
              case "system.locale.location" :
                if ( !reset ) {
                  var found = false;
                  var locations = API.user.settings.options("system.locale.location");
                  for ( var l = 0; l < locations.length; l++ ) {
                    if ( locations[l] == args[x] ) {
                      found = true;
                      break;
                    }
                  }
                  if ( !found ) {
                    args[x] = deflt;
                    API.ui.alert(LABELS.invalid_locale);
                  }
                }

                self._root_window.$element.find(".entry_locale_location").val(args[x]);
              break;
              case "system.locale.time-format" :
                if ( !reset ) {
                  (function() {})(); // FIXME: Validate stamp
                }
              break;
              case "system.locale.date-format" :
                if ( !reset ) {
                  (function() {})(); // FIXME: Validate stamp
                }
              break;
              case "system.locale.timestamp-format" :
                if ( !reset ) {
                  (function() {})(); // FIXME: Validate stamp
                }
              break;

              case "system.locale.language" :
                if ( args[x] != deflt ) {
                  _confirm = true;
                }
              break;

              default :
              break;
            }
          }
        }

        if ( _confirm ) {
          API.ui.alert(LABELS.locale, "info");
        }

        API.user.settings.save(args);

      }
    });

    return new __SystemControlPanel();
  };
})($);

