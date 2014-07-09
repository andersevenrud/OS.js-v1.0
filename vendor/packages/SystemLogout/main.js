/*!
 * OS.js - JavaScript Operating System - Contains SystemLogout JavaScript
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
OSjs.Packages.SystemLogout = (function($, undefined) {
  "$:nomunge";

  var _LINGUAS = {
    'en_US' : {
      "title"       : "Logout",
      "message"     : "Are you sure you want to log out?",
      "alternative" : "Save your session for next login?",
      "cancel"      : "Cancel",
      "confirm"     : "Confirm"
    },
    'nb_NO' : {
      "title"       : "Utlogging",
      "message"     : "Er du sikker på at du vil logge ut?",
      "alternative" : "Lagre sessjonen for neste innlogging?",
      "cancel"      : "Avbryt",
      "confirm"     : "Bekreft"
    }
  };

  return function(GtkWindow, Application, API, argv, windows) {
    "GtkWindow:nomunge, Application:nomunge, API:nomunge, argv:nomunge, windows:nomunge";

    var LABELS = _LINGUAS[API.system.language()] || _LINGUAS['en_US'];

    var Window_dialog1 = GtkWindow.extend({

      init : function(app) {
        this._super("Window_dialog1", false, app, windows);
        this._content = $("<div> <div class=\"GtkDialog dialog1\"> </div> </div> ").html();
        this._title = LABELS.title;
        this._icon = 'actions/gnome-logout.png';
        this._is_draggable = true;
        this._is_resizable = false;
        this._is_scrollable = false;
        this._is_sessionable = false;
        this._is_minimizable = false;
        this._is_maximizable = false;
        this._is_closable = true;
        this._is_orphan = true;
        this._is_ontop = true;
        this._width = 300;
        this._height = 130;
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

          var table = $("<div class=\"Content\"></div>");
          var row_one = $(sprintf("<div class=\"Message\">%s</div>", LABELS.message));
          var row_two = $(sprintf("<div class=\"Alternatives\"><label><input name=\"save\" class=\"SaveCheck\" type=\"checkbox\" /> %s</label></div>", LABELS.alternative));
          var row_three = $(sprintf("<div class=\"Buttons\"><button class=\"Confirm\">%s</button><button class=\"Cancel\">%s</button></div>", LABELS.confirm, LABELS.cancel));

          row_three.find(".Cancel").click(function() {
            $(el).find(".ActionClose").click();
          });
          row_three.find(".Confirm").click(function() {
            var save = row_two.find(".SaveCheck").is(":checked") ? true : false;
            if ( !save ) {
              save = row_two.find(".SaveCheck").attr("checked") ? true : false;
            }
            API.user.logout(save);
            self.close();
          }).focus();

          table.append(row_one, row_two, row_three);

          el.find(".dialog1").append(table);
        }
      },

      checkSettings : function(doconfirm, arestore) {
        var el = this.$element;

        if ( arestore ) {
          el.find(".SaveCheck").attr("checked", "checked");
        } else {
          el.find(".SaveCheck").removeAttr("checked");
        }
        if ( !doconfirm ) {
          el.find(".Confirm").click();
        }
      }

    });


    ///////////////////////////////////////////////////////////////////////////
    // APPLICATION
    ///////////////////////////////////////////////////////////////////////////

    var __SystemLogout = Application.extend({

      init : function() {
        this._super("SystemLogout", argv);
      },

      destroy : function() {
        this._super();
      },

      run : function() {
        var self = this;

        var root_window = new Window_dialog1(self);
        this._super(root_window);
        root_window.show();

        // Do your stuff here
        root_window.checkSettings(API.user.settings.get("user.session.confirm"), API.user.settings.get("user.session.autosave"));
      }
    });

    return new __SystemLogout();
  };
})($);

