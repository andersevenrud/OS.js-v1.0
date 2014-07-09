/*!
 * OS.js - JavaScript Operating System - Contains SystemProcesses JavaScript
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
OSjs.Packages.SystemProcesses = (function($, undefined) {
  "$:nomunge";

  var _LINGUAS = {
    'en_US' : {
      "title"   : "Processes",
      "titlenum": "Processes (%d running)",
      "columns" : ["PID", "Process", "Alive", ""],
      "confirm" : "Are you sure you want to kill process \"%s\" (pid:%s)",
      "failkill": "Failed to kill process!",
      "subs"    : "sub-process(es)"
    },
    'nb_NO' : {
      "title"   : "Prosesser",
      "titlenum": "Prosesser (%d aktive)",
      "columns" : ["PID", "Prosess", "Våken", ""],
      "confirm" : "Er du sikker på at du vil drepe prosessen \"%s\" (pid:%s)",
      "failkill": "Klarte ikke drepe prosess!",
      "subs"    : "under-prosess(er)"
    }
  };

  /**
   * @param GtkWindow     GtkWindow            GtkWindow API Reference
   * @param Application   Application          Application API Reference
   * @param API           API                  Public API Reference
   * @param Object        argv                 Application arguments (like cmd)
   * @param Array         windows              Application windows from session (restoration)
   */
  return function(GtkWindow, Application, API, argv, windows) {
    "GtkWindow:nomunge, Application:nomunge, API:nomunge, argv:nomunge, windows:nomunge";

    var LABELS = _LINGUAS[API.system.language()] || _LINGUAS['en_US'];

    ///////////////////////////////////////////////////////////////////////////
    // WINDOWS
    ///////////////////////////////////////////////////////////////////////////

    //var LastItem = null;

    var ProcessIconView = OSjs.Classes.IconView.extend({
      init : function(app, el) {
        this._super(el, "list", {"dnd" : false, "dnd_items" : false});

        // Locals
        this.app        = app;
        this.tmp        = null;
        this.scrollTop  = 0;
      },

      onFocus : function() {
        this.app._root_window.focus();
      },

      onBlur : function() {
        this.app._root_window.blur();
      },

      render : function(items, columns, view) {
        var self = this;
        this.scrollTop = this.$element.get(0).scrollTop || 0;

        this._super(items, columns, view);

        if ( this.tmp ) {
          this.selectItem("pid", this.tmp);
        }

        setTimeout(function() {
          self.$element.get(0).scrollTop = self.scrollTop;
        }, 0);
      },
      onItemSelect : function(ev, el) {
        if ( el )
          this.tmp = $(el).data("pid");

        this._super(ev, el, undefined, false);
      },

      createItem : function(view, iter) {
        var name = iter.title || iter.name;
        if ( iter.subp ) {
          name += " (" + iter.subp + " " + LABELS.subs + ")";
        }

        var el = $(sprintf("<tr class=\"GtkIconViewItem\"><td>%s</td><td><img alt=\"\" src=\"%s\" /> %s</td><td>%s</td><td><img alt=\"\" src=\"/img/icons/16x16/actions/stop.png\" class=\"TT\" title=\"Kill process\" /></td></tr>",
                         iter.pid,
                         API.ui.getIcon(iter.icon, "16x16"),
                         name,
                         iter.time + "ms"));

        if ( iter.locked ) {
          el.find("img.TT").remove();
          el.addClass("Locked");
        } else {
          el.find("img.TT").click(function() {
            var msglabel = sprintf(LABELS.confirm, name, iter.pid);
            API.ui.dialog("confirm", msglabel, null, function() {
              if ( !iter.kill() ) {
                API.ui.alert(LABELS.failkill);
              }
            });
          });
        }

        el.data("name", name);
        el.data("time", iter.time);
        el.data("pid",  iter.pid);

        return el;
      }
    });

    /**
     * GtkWindow Class
     * @class
     */
    var Window_window1 = GtkWindow.extend({

      init : function(app) {
        this._super("Window_window1", false, app, windows);
        this._content = $("<div> <div class=\"GtkWindow window1\"> <div class=\"GtkIconView GtkObject iconview1\"></div> </div> </div> ").html();
        this._title = LABELS.title;
        this._icon = 'apps/utilities-system-monitor.png';
        this._is_draggable = true;
        this._is_resizable = true;
        this._is_scrollable = false;
        this._is_sessionable = true;
        this._is_minimizable = false;
        this._is_maximizable = true;
        this._is_closable = true;
        this._is_orphan = true;
        this._is_ontop = true;
        this._skip_taskbar = true;
        this._skip_pager = true;
        this._width = 500;
        this._height = 400;
        this._gravity = null;

        this.iconview  = null;
      },

      destroy : function() {
        if ( this.iconview ) {
          this.iconview.destroy();
          this.iconview = null;
        }
        this._super();
      },

      create : function(id, mcallback) {
        var el = this._super(id, mcallback);
        var self = this;
        if ( el ) {
          this.iconview = new ProcessIconView(this.app, el.find(".iconview1"));
          this._addObject(this.iconview);
          return true;
        }
        return false;
      }
    });


    ///////////////////////////////////////////////////////////////////////////
    // APPLICATION
    ///////////////////////////////////////////////////////////////////////////

    /**
     * Main Application Class
     * @class
     */
    var __SystemProcesses = Application.extend({

      init : function() {
        this._super("SystemProcesses", argv);
        this.pinterval = null;
      },

      destroy : function() {
        if ( this.pinterval ) {
          clearInterval(this.pinterval);
          this.pinerval = null;
        }
        this._super();
      },

      run : function() {
        var root_window = new Window_window1(this);
        this._super(root_window);
        root_window.show();

        var self = this;
        var UpdateTable = function() {
          var list = API.session.processes();
          self._root_window.iconview.render(list, LABELS.columns);
          self._root_window._setTitle(sprintf(LABELS.titlenum, list.length));
        };

        this.pinterval = setInterval(function() {
          UpdateTable();
        }, 3000);
        UpdateTable();
      }
    });

    return new __SystemProcesses();
  };
})($);
