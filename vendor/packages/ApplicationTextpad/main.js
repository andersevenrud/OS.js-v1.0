/*!
 * OS.js - JavaScript Operating System - Contains ApplicationTextpad JavaScript
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
OSjs.Packages.ApplicationTextpad = (function($, undefined) {
  "$:nomunge";

  var _LINGUAS = {
    'en_US' : {
      "title"       : "Textpad",
      "title_open"  : "Textpad: %s",
      "title_new"   : "Textpad: New File"
    },
    'nb_NO' : {
      "title"       : "Skriveblokk",
      "title_open"  : "Skriveblokk: %s",
      "title_new"   : "Skriveblokk: Ny Fil"
    }
  };

  return function(GtkWindow, Application, API, argv, windows) {
    "GtkWindow:nomunge, Application:nomunge, API:nomunge, argv:nomunge, windows:nomunge";

    var LABELS = _LINGUAS[API.system.language()] || _LINGUAS['en_US'];
    var MIMES  = ["text/*", "inode/x-empty", "application/x-empty"];

    var Window_window1 = GtkWindow.extend({

      init : function(app) {
        this._super("Window_window1", false, app, windows);

        this._content         = $("<div><div class=\"GtkWindow window1\"> <div class=\"GtkBox box1 GtkBoxVertical\"> <div class=\"GtkBoxPackage Position_0\"> <ul class=\"GtkMenuBar menubar1\"> <li class=\"GtkMenuItem menuitem_file\"> <div class=\"GtkMenuItemInner\"> <span><u>F</u>ile</span> </div> <ul class=\"GtkMenu menu_file\"> <li class=\"GtkImageMenuItem imagemenuitem_new\"> <div class=\"GtkMenuItemInner\"> <img alt=\"New\" src=\"/img/icons/16x16/actions/gtk-new.png\"/> <span>New</span> </div> </li> <li class=\"GtkImageMenuItem imagemenuitem_open\"> <div class=\"GtkMenuItemInner\"> <img alt=\"Open\" src=\"/img/icons/16x16/actions/gtk-open.png\"/> <span>Open</span> </div> </li> <li class=\"GtkImageMenuItem imagemenuitem_save\"> <div class=\"GtkMenuItemInner\"> <img alt=\"Save\" src=\"/img/icons/16x16/actions/gtk-save.png\"/> <span>Save</span> </div> </li> <li class=\"GtkImageMenuItem imagemenuitem_saveas\"> <div class=\"GtkMenuItemInner\"> <img alt=\"Save as...\" src=\"/img/icons/16x16/actions/gtk-save-as.png\"/> <span>Save as...</span> </div> </li> <li> <div class=\"GtkSeparatorMenuItem separatormenuitem1\"></div> </li> <li class=\"GtkImageMenuItem imagemenuitem_quit\"> <div class=\"GtkMenuItemInner\"> <img alt=\"Quit\" src=\"/img/icons/16x16/actions/gtk-quit.png\"/> <span>Quit</span> </div> </li> </ul> </li> </ul> </div> <div class=\"GtkBoxPackage Position_1 Expand Fill\"> <textarea class=\"GtkTextView textview1\"></textarea> </div> <div class=\"GtkBoxPackage Position_2\"> <div class=\"GtkStatusbar statusbar1\"></div> </div> </div> </div> </div>").html();
        this._title           = LABELS.title;
        this._icon            = 'apps/text-editor.png';
        this._is_draggable    = true;
        this._is_resizable    = true;
        this._is_scrollable   = false;
        this._is_sessionable  = true;
        this._is_minimizable  = true;
        this._is_maximizable  = true;
        this._is_closable     = true;
        this._is_orphan       = false;
        this._width           = 400;
        this._height          = 400;
        this._gravity         = null;
        this._global_dnd      = true;
      },

      destroy : function() {
        this._super();
      },

      EventMenuNew : function(el, ev) {
        this.openFile(true);
      },

      EventMenuOpen : function(el, ev) {
        var self = this;
        this.app.defaultFileOpen({
          "callback" : function(fname) {
            self.app.openFile(fname, true);
          },
          "mimes"   : MIMES,
          "file"    : self.app._getArgv('path')
        });
      },


      EventMenuSave : function(el, ev) {
        var self = this;

        if ( argv && argv['path'] ) {
          var path = argv['path'];
          var data = self.$element.find("textarea").val();

          this.app.defaultFileSave({
            "file"      : path,
            "content"   : data,
            "mimes"     : MIMES,
            "callback"  : function(fname) {
              (function() {})();
            }
          });
        }
      },


      EventMenuSaveAs : function(el, ev) {
        var self = this;
        var data = self.$element.find("textarea").val();
        var cur  = this.app._getArgv('path');

        this.app.defaultFileSave({
          "file"      : cur,
          "content"   : data,
          "mimes"     : MIMES,
          "saveas"    : true,
          "callback"  : function(fname, mime) {
            self.changeFile(fname);
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

          el.find(".imagemenuitem_new").click(function(ev) {
            self.EventMenuNew(this, ev);
          });

          el.find(".imagemenuitem_open").click(function(ev) {
            self.EventMenuOpen(this, ev);
          });

          el.find(".imagemenuitem_save").click(function(ev) {
            self.EventMenuSave(this, ev);
          });

          el.find(".imagemenuitem_saveas").click(function(ev) {
            self.EventMenuSaveAs(this, ev);
          });

          el.find(".imagemenuitem_quit").click(function(ev) {
            self.EventMenuQuit(this, ev);
          });

          // Do your stuff here
          this._bind("dnd", function(data) {
            if ( data && data.path && data.mime && checkMIME(data.mime, MIMES) ) {
              self.app.openFile(data.path, true);
            }
          });

          this._bind("focus", function() {
            el.find("textarea").focus();
            self.updateStatusBar();
          });

          $(el).find("textarea").mousedown(function(ev) {
            self.updateStatusBar();
            //ev.stopPropagation();
          }).focus(function() {
            self.updateStatusBar();
          }).keyup(function() {
            self.updateStatusBar();
          });
        }
      },

      openFile : function(file, content) {
        if ( file === null ) {
          this._setTitle(LABELS.title);
          content = "";
        } else if ( file === true ) {
          this.app._setArgv("path", null);
          this._setTitle(LABELS.title_new);
          content = "";
        } else {
          this.changeFile(file);
        }

        this.$element.find(".statusbar1").html("");
        this.updateStatusBar();

        var txt = this.$element.find("textarea");
        txt.val(content);
        setTimeout(function() {
          setSelectionRangeX(txt, 0, 0);
        }, 0);

      },

      changeFile : function(file) {
        this._setTitle(sprintf(LABELS.title_open, basename(file)));
        this.app._setArgv("path", file);
      },

      updateStatusBar : function() {
        var txt   = this.$element.find("textarea");
        var pos   = getTextareaCoordinates(txt);
        var text  = sprintf("Row: %d, Col: %d, Lines: %d, Characters: %d", pos.y, pos.x, pos.lines, pos.length);

        this.$element.find(".statusbar1").html(text);
      }

    });


    ///////////////////////////////////////////////////////////////////////////
    // APPLICATION
    ///////////////////////////////////////////////////////////////////////////

    var __ApplicationTextpad = Application.extend({

      init : function() {
        this._super("ApplicationTextpad", argv);
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
        this.openFile(this._getArgv("path"));
      },

      openFile : function(file, focus) {
        this._setArgv("path", null);
        if ( file && typeof file == "string" ) {
          var self = this;

          API.system.call("read", file, function(result, error) {
            if ( error ) {
              self._root_window.openFile(null);
            } else {
              self._root_window.openFile(file, result || "");
            }

            if ( focus ) {
              setTimeout(function() {
                self._root_window.focus();
              }, 10);
            }
          });
          return;
        }

        this._root_window.openFile(null);
        this._root_window.focus();
      }
    });

    return new __ApplicationTextpad();
  };
})($);
