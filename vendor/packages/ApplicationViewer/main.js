/*!
 * OS.js - JavaScript Operating System - Contains ApplicationViewer JavaScript
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
OSjs.Packages.ApplicationViewer = (function($, undefined) {
  "$:nomunge";

  var _LINGUAS = {
    'en_US' : {
      "title" : "Image Viewer",
      "error" : "Failed to open image '%s'",
      "none"  : "No Image"
    },
    'nb_NO' : {
      "title" : "Bilde-visning",
      "error" : "Kunne ikke åpne bildet '%s'",
      "none"  : "Inget bilde"
    }
  };

  return function(GtkWindow, Application, API, argv, windows) {
    "GtkWindow:nomunge, Application:nomunge, API:nomunge, argv:nomunge, windows:nomunge";

    var LABELS = _LINGUAS[API.system.language()] || _LINGUAS['en_US'];
    var MIMES  = ["image/*"];

    var Window_window1 = GtkWindow.extend({

      init : function(app) {
        this._super("ApplicationViewer", false, app, windows);
        this._content         = $("<div><div class=\"GtkWindow window1\"> <div class=\"GtkBox box1 GtkBoxVertical\"> <div class=\"GtkBoxPackage Position_0\"> <ul class=\"GtkMenuBar menubar1\"> <li class=\"GtkMenuItem menuitem_file\"> <div class=\"GtkMenuItemInner\"> <span><u>F</u>ile</span> </div> <ul class=\"GtkMenu menu_file\"> <li class=\"GtkImageMenuItem imagemenuitem_open\"> <div class=\"GtkMenuItemInner\"> <img alt=\"Open\" src=\"/img/icons/16x16/actions/gtk-open.png\"/> <span>Open</span> </div> </li> <li> <div class=\"GtkSeparatorMenuItem separatormenuitem1\"></div> </li> <li class=\"GtkImageMenuItem imagemenuitem_quit\"> <div class=\"GtkMenuItemInner\"> <img alt=\"Quit\" src=\"/img/icons/16x16/actions/gtk-quit.png\"/> <span>Quit</span> </div> </li> </ul> </li> </ul> </div> <div class=\"GtkBoxPackage Position_1 Expand Fill\"> <div class=\"GtkFixed fixed1\"></div> </div> <div class=\"GtkBoxPackage Position_2\"> <div class=\"GtkStatusbar statusbar1\"></div> </div> </div> </div> </div>").html();
        this._title           = LABELS.title;
        this._icon            = 'mimetypes/image-x-generic.png';
        this._is_draggable    = true;
        this._is_resizable    = true;
        this._is_scrollable   = false;
        this._is_sessionable  = true;
        this._is_minimizable  = true;
        this._is_maximizable  = true;
        this._is_closable     = true;
        this._is_orphan       = false;
        this._width           = 300;
        this._height          = 200;
        this._gravity         = null;
        this._global_dnd      = true;
      },

      destroy : function() {
        this._super();
      },


      EventMenuOpen : function(el, ev) {
        var self = this;
        this.app.defaultFileOpen({
          "callback" : function(fname) {
            self.app.openFile(fname, true);
          },
          "mimes"   : MIMES,
          "file"    : this.app._getArgv('path'),
          "options" : {
            "preview" : true
          }
        });
      },


      EventMenuQuit : function(el, ev) {
        this.$element.find(".ActionClose").click();
      },

      create : function(id, mcallback) {
        var el = this._super(id, mcallback);
        var self = this;

        if ( el ) {
          el.find(".imagemenuitem_open").click(function(ev) {
            self.EventMenuOpen(this, ev);
          });

          el.find(".imagemenuitem_quit").click(function(ev) {
            self.EventMenuQuit(this, ev);
          });

          // Do your stuff here
          this._bind("dnd", function(data) {
            if ( data && data.path && data.mime && checkMIME(data.mime, MIMES) ) {
              //if ( data.path.match(/\.(jpe?g|bmp|gif|png)$/i) ) {}
              self.app.openFile(data.path, true);
            }
          });

        }

      }
    });


    ///////////////////////////////////////////////////////////////////////////
    // APPLICATION
    ///////////////////////////////////////////////////////////////////////////

    var __ApplicationViewer = Application.extend({

      init : function() {
        this._super("ApplicationViewer", argv);
        this._compability = [];

        this.$image = null;
      },

      destroy : function() {
        if ( this.$image ) {
          this.$image.remove();
        }
        this._super();
      },

      openFile : function(fname, focus) {
        var self = this;

        if ( self.$image ) {
          self.$image.remove();
        }

        var win = this._root_window;
        var img = $("<img alt=\"\" />").attr("src", "/media" + fname);
        img.load(function() {
          var ws = API.ui.getWindowSpace();
          var w = this.width;
          var h = this.height;

          if ( w > 0 && h > 0 ) {
            if ( w > (ws.w - ws.x) ) {
              w = ws.w;
            }
            if ( h > (ws.h - ws.y) ) {
              h = ws.h;
            } else {
              h += 85;
            }

            self._root_window._resize(w, h);
          }

          win._setTitle(win._origtitle + ": " + (basename(fname) || LABELS.none));

        }).error(function() {
            self.createMessageDialog({'type' : "error", 'message' : sprintf(LABELS.error, fname)});

            win._setTitle(win._origtitle);
        }).each(function() {
          if ( !this._loaded && this.complete && this.naturalWidth !== 0 ) {
            $(this).trigger('load');
          }

          win._setTitle(win._origtitle + ": " + (basename(fname) || LABELS.none));
        });

        self.$image = img;
        self._root_window.$element.find(".fixed1").append(self.$image);
        self._root_window.$element.find(".statusbar1").html(fname);
        self._setArgv("path", fname);

        if ( focus ) {
          this._root_window.focus();
        }
      },

      run : function() {
        var self = this;

        var root_window = new Window_window1(self);
        this._super(root_window);
        root_window.show();


        // Do your stuff here
        var path = this._getArgv("path");
        if ( path ) {
          this.openFile(path);
        }
      }
    });

    return new __ApplicationViewer();
  };
})($);

