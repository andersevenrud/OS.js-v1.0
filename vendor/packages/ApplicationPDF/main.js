/*!
 * OS.js - JavaScript Operating System - Contains ApplicationPDF JavaScript
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
OSjs.Packages.ApplicationPDF = (function($, undefined) {
  "$:nomunge";

  var _LINGUAS = {
    'en_US' : {
      "title" : "PDF Viewer"
    },
    'nb_NO' : {
      "title" : "PDF Leser"
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

    var LABELS  = _LINGUAS[API.system.language()] || _LINGUAS['en_US'];
    var MIMES   = ["application\/pdf"];

    var CACHE       = [];
    var IS_LOADING  = false;

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
        this._content         = $("<div><div class=\"GtkWindow window1\"> <div class=\"GtkBox box1 GtkBoxVertical\"> <div class=\"GtkBoxPackage Position_0\"> <ul class=\"GtkMenuBar menubar1\"> <li class=\"GtkMenuItem menuitem_file\"> <div class=\"GtkMenuItemInner\"> <span><u>F</u>ile</span> </div> <ul class=\"GtkMenu menu_file\"> <li class=\"GtkImageMenuItem imagemenuitem_open\"> <div class=\"GtkMenuItemInner\"> <img alt=\"Open\" src=\"/img/icons/16x16/actions/gtk-open.png\"/> <span>Open</span> </div> </li> <li> <div class=\"GtkSeparatorMenuItem separatormenuitem1\"></div> </li> <li class=\"GtkImageMenuItem imagemenuitem_quit\"> <div class=\"GtkMenuItemInner\"> <img alt=\"Quit\" src=\"/img/icons/16x16/actions/gtk-quit.png\"/> <span>Quit</span> </div> </li> </ul> </li> </ul> </div> <div class=\"GtkBoxPackage Position_1\"> <div class=\"GtkBox box2 GtkBoxHorizontal\"> <div class=\"GtkBoxPackage Position_0\"> <button class=\"GtkButton button_prev\"> <img alt=\"Prev\" src=\"/img/icons/16x16/actions/media-skip-backward.png\"/> <span>Prev</span> </button> </div> <div class=\"GtkBoxPackage Position_1 Expand Fill\"> <div class=\"GtkLabel label_navigation\">&amp;nbsp;</div> </div> <div class=\"GtkBoxPackage Position_3\"> <button class=\"GtkButton button_next\"> <img alt=\"Next\" src=\"/img/icons/16x16/actions/media-skip-forward.png\"/> <span>Next</span> </button> </div> </div> </div> <div class=\"GtkBoxPackage Position_2 Expand Fill\"> <div class=\"GtkFixed fixed1\"></div> </div> <div class=\"GtkBoxPackage Position_3\"> <div class=\"GtkStatusbar statusbar1\"></div> </div> </div> </div> </div>").html();
        this._title           = LABELS.title;
        this._icon            = 'mimetypes/gnome-mime-application-pdf.png';
        this._is_draggable    = true;
        this._is_resizable    = true;
        this._is_scrollable   = false;
        this._is_sessionable  = true;
        this._is_minimizable  = true;
        this._is_maximizable  = true;
        this._is_closable     = true;
        this._is_orphan       = false;
        this._skip_taskbar    = false;
        this._skip_pager      = false;
        this._width           = 440;
        this._height          = 440;
        this._gravity         = null;
        this._global_dnd      = true;

        this.iframe = null;
      },

      destroy : function() {
        if ( this.iframe ) {
          this.iframe.destroy();
          this.iframe = null;
        }
        this._super();
      },


      EventMenuOpen : function(el, ev) {
        var self = this;
        this.app.defaultFileOpen({
          "callback" : function(fname) {
            self.app.loadDocument(fname, true);
          },
          "mimes" : MIMES,
          "file"  : this.app._getArgv('path')
        });
      },

      EventMenuQuit : function(el, ev) {
        this.$element.find(".ActionClose").click();
      },

      EventPreviousPage : function(el, ev) {
        this.app.navigatePage(false);
      },

      EventNextPage : function(el, ev) {
        this.app.navigatePage(true);
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

          el.find(".button_prev").click(function(ev) {
            self.EventPreviousPage(this, ev);
          }).attr("disabled", "disabled");

          el.find(".button_next").click(function(ev) {
            self.EventNextPage(this, ev);
          }).attr("disabled", "disabled");

          // Do your stuff here
          this._bind("dnd", function(data) {
            if ( data && data.path && data.mime && checkMIME(data.mime, MIMES) ) {
              //if ( data.path.match(/\.pdf$/i) ) {}
              self.app.loadDocument(data.path, true);
            }
          });

          var area = $("<iframe frameborder=\"0\" border=\"0\" cellspacing=\"0\" src=\"about:blank\" class=\"GtkRichtext\"></iframe>");
          el.find(".fixed1").append(area);

          this.iframe = new OSjs.Classes.IFrame(area);
          this._addObject(this.iframe);

          el.find(".label_navigation").html("No file loaded...");

          return true;
        }

        return false;
      },

      updateStatusbar : function(str) {
        this.$element.find(".statusbar1").html(str);
      },

      updateStatus : function(str) {
        this.$element.find(".label_navigation").html(str);
      },

      updateViewport : function(m) {
        this.iframe.setContent((typeof m == "string") ? m : m.html());
      },

      updateButtons : function(page, page_total) {
        var el  = this.$element;
        if ( !page_total || page_total < 0 ) {
          el.find(".button_prev").attr("disabled", "disabled");
          el.find(".button_next").attr("disabled", "disabled");
        } else {
          if ( page <= 1 ) {
            el.find(".button_prev").attr("disabled", "disabled");
          } else {
            el.find(".button_prev").removeAttr("disabled");
          }

          if ( page >= (page_total) ) {
            el.find(".button_next").attr("disabled", "disabled");
          } else {
            el.find(".button_next").removeAttr("disabled");
          }
        }
      }
    });


    ///////////////////////////////////////////////////////////////////////////
    // APPLICATION
    ///////////////////////////////////////////////////////////////////////////

    /**
     * Main Application Class
     * @class
     */
    var __ApplicationPDF = Application.extend({

      init : function() {
        this._super("ApplicationPDF", argv);
        this._compability = [];

        this.page_number  = -1;
        this.page_total   = -1;
        this.pdf_info     = null;
        this.pdf_cache    = null;
        this.pdf_path     = null;
      },

      destroy : function() {
        this.reset();

        this._super();
      },

      run : function() {
        var self = this;

        var root_window = new Window_window1(self);

        this._super(root_window);

        root_window.show();

        // Do your stuff here
        var path = this._getArgv("path");
        if ( path ) {
          this.loadDocument(path);
        }
      },

      /**
       * Reset internals
       * @return void
       */
      reset : function() {
        CACHE       = [];
        IS_LOADING  = false;

        this.page_number    = -1;
        this.page_total     = -1;
        this.pdf_info       = null;
        this.pdf_cache      = null;
        this.pdf_path       = null;
      },

      /**
       * Load a new document
       * @return void
       */
      loadDocument : function(path, focus) {
        var self = this;

        IS_LOADING = true;
        CACHE      = [];

        this._root_window.updateViewport(sprintf("Loading document: " + basename(path)));
        this._root_window.updateStatus("");
        this._root_window.updateButtons(-1, -1);
        this._root_window._setTitle(LABELS.title);
        this._setArgv("path", null);

        var page   = 1;
        var source = (page > 0) ? (sprintf("%s:%d", path, page)) : (path);

        API.system.call("readpdf", source, function(result, error) {
          if ( error === null ) {
            self.page_number  = page;
            self.page_total   = parseInt(result.info.PageCount, 10);
            self.pdf_info     = result.info;
            self.pdf_path     = path;

            self.drawDocument(result.document);

            self._root_window._setTitle(sprintf("%s: [%d/%d] %s", LABELS.title, self.page_number, self.page_total, basename(path)));

            if ( focus ) {
              self._root_window.focus();
            }

            self._setArgv("path", path);
          } else {
            self.drawError(path, error);
          }

          IS_LOADING = false;
        });
      },

      /**
       * Draw error document
       * @return void
       */
      drawError : function(path, error) {
        this._root_window.updateViewport(sprintf("<h1>Failed to open document:</h1><p>%s</p>", error));
        this._root_window.updateStatusbar(basename(path));
        this._root_window.updateStatus("Showing page 0 of 0");
        this._root_window.updateButtons(-1, -1);

        this.reset();

        this._root_window.$element.find(".fixed1").get(0).scrollTop = 0;
      },

      /**
       * Draw the document (page)
       * @return void
       */
      drawDocument : function(svg) {
        this._root_window.updateViewport(svg);
        this._root_window.updateStatusbar(basename(this.pdf_path));
        this._root_window.updateStatus(sprintf("Showing page %d of %d", this.page_number, this.page_total));
        this._root_window.updateButtons(this.page_number, this.page_total);
        this._root_window.$element.find(".fixed1").get(0).scrollTop = 0;
      },

      /**
       * Change page (Internal)
       * @return void
       */
      _navigatePage : function(page) {
        var self = this;

        if ( CACHE[page] !== undefined ) {
          this.drawDocument($(CACHE[page]));
        }

        this._root_window.updateViewport(sprintf("Loading page %d (please wait)...", page));

        var path   = this.pdf_path;
        var source = (page > 0) ? (sprintf("%s:%d", path, page)) : (path);
        API.system.call("readpdf", source, function(result, error) {
          if ( error === null ) {
            var svg = result.document;
            CACHE[page] = svg;

            self.drawDocument(svg);
          } else {
            self.drawError(self.pdf_path, error);
          }

          self._root_window.$element.find(".fixed1").get(0).scrollTop = 0;
        });

      },

      /**
       * Navigate to a page
       * @return void
       */
      navigatePage: function(op) {
        if ( !this.page_total ) {
          return;
        }

        if ( this.page_number == -1 || this.page_total == -1 ) {
          return;
        }

        if ( op === true ) {          // Next
          if ( this.page_number < this.page_total ) {
            this.page_number++;
          }
        }
        else if ( op === false ) {    // Prev
          if ( this.page_number >= 2 ) {
            this.page_number--;
          }
        }
        else {                        // Custom page
          if ( typeof op == "number" ) {
            op = parseInt(op, 10);
            if (!isNan(op) && op ) {
              if ( (op > 0) && (op < this.page_total) ) {
                this.page_number = op;
              }
            }
          }
        }

        this._navigatePage(this.page_number);
      }
    });

    return new __ApplicationPDF();
  };
})($);
