/*!
 * OS.js - JavaScript Operating System - Contains ApplicationVideoPlayer JavaScript
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
OSjs.Packages.ApplicationVideoPlayer = (function($, undefined) {
  "$:nomunge";

  var _LINGUAS = {
    'en_US' : {
      "title"       : "Video Player",
      "title_open"  : "Video Player: %s"
    },
    'nb_NO' : {
      "title"       : "Videospiller",
      "title_open"  : "Videospiller: %s"
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
    var MIMES  = ["video\/*"];

    var PLAYER_DIFFX = 0;
    var PLAYER_DIFFY = 85;

    ///////////////////////////////////////////////////////////////////////////
    // WINDOWS
    ///////////////////////////////////////////////////////////////////////////


    /**
     * GtkWindow Class
     * @class
     */
    var Window_window1 = GtkWindow.extend({

      init : function(app) {
        this._super("Window_window1", false, app, windows);

        this._content         = $("<div><div class=\"GtkWindow window1\"> <div class=\"GtkBox box1 GtkBoxVertical\"> <div class=\"GtkBoxPackage Position_0\"> <ul class=\"GtkMenuBar menubar1\"> <li class=\"GtkMenuItem menuitem_file\"> <div class=\"GtkMenuItemInner\"> <span><u>F</u>ile</span> </div> <ul class=\"GtkMenu menu_file\"> <li class=\"GtkImageMenuItem imagemenuitem_open\"> <div class=\"GtkMenuItemInner\"> <img alt=\"Open\" src=\"/img/icons/16x16/actions/gtk-open.png\"/> <span>Open</span> </div> </li> <li> <div class=\"GtkSeparatorMenuItem separatormenuitem1\"></div> </li> <li class=\"GtkImageMenuItem imagemenuitem_quit\"> <div class=\"GtkMenuItemInner\"> <img alt=\"Quit\" src=\"/img/icons/16x16/actions/gtk-quit.png\"/> <span>Quit</span> </div> </li> </ul> </li> </ul> </div> <div class=\"GtkBoxPackage Position_1 Expand Fill\"> <div class=\"GtkFixed fixed1\"></div> </div> <div class=\"GtkBoxPackage Position_2\"> <div class=\"GtkStatusbar statusbar1\"></div> </div> </div> </div> </div>").html();
        this._title           = LABELS.title;
        this._icon            = 'mimetypes/video-x-generic.png';
        this._is_draggable    = true;
        this._is_resizable    = false;
        this._is_scrollable   = false;
        this._is_sessionable  = true;
        this._is_minimizable  = true;
        this._is_maximizable  = true;
        this._is_closable     = true;
        this._is_orphan       = false;
        this._skip_taskbar    = false;
        this._skip_pager      = false;
        this._width           = 500;
        this._height          = 300;
        this._gravity         = null;
        this._global_dnd      = true;

        this.player = null;
      },

      destroy : function() {
        if ( this.player ) {
          this.player.destroy();
        }
        this.player = null;

        this._super();
      },


      EventMenuOpen : function(el, ev) {
        var self = this;
        this.app.defaultFileOpen({
          "callback" : function(fname) {
            self.app.openFile(fname, true);
          },
          "mimes"   : MIMES,
          "file"    : self.app._getArgv('path'),
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
              //if ( data.path.match(/\.(mpe?g|mp4|avi|vob|ogv|flv)$/i) ) {}
              self.app.openFile(data.path, true);
            }
          });

          this.player = new OSjs.Classes.VideoPlayer(null, undefined, function() {
            self.resizeContent();
          });
          el.find(".fixed1").append(this.player.$element);
          this.resizeContent();

          return true;
        }

        return false;
      },

      openFile : function(fname) {
        if ( fname === null ) {
          this.$element.find(".statusbar1").html("");
          this.player.setSource("");
          this._setTitle(LABELS.title);
        } else {
          this.$element.find(".statusbar1").html(fname);
          this.player.setSource("/media" + fname);
          this._setTitle(sprintf(LABELS.title_open, basename(fname)));
        }
      },

      resizeContent : function() {
        this._resize(this.player.getWidth() + PLAYER_DIFFX, this.player.getHeight() + PLAYER_DIFFY);
      }

    });


    ///////////////////////////////////////////////////////////////////////////
    // APPLICATION
    ///////////////////////////////////////////////////////////////////////////

    /**
     * Main Application Class
     * @class
     */
    var __ApplicationVideoPlayer = Application.extend({

      init : function() {
        this._super("ApplicationVideoPlayer", argv);
        this._compability = ["video"];
      },

      destroy : function() {
        this._super();
      },

      openFile : function(fname, focus) {
        this._root_window.openFile(fname);
        if ( fname && focus )
          this._root_window.focus();

        this._setArgv("path", fname || null);
      },

      run : function() {
        var self = this;
        var root_window = new Window_window1(this);
        this._super(root_window);
        root_window.show();

        // Do your stuff here
        this.openFile(this._getArgv("path"));
      }
    });

    return new __ApplicationVideoPlayer();
  };
})($);
