/*!
 * OS.js - JavaScript Operating System - Contains Application Archiver JavaScript
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
OSjs.Packages.ApplicationArchiver = (function($, undefined) {
  "$:nomunge";

  var _LINGUAS = {
    'en_US' : {
      "title"           : "File Archiver",
      "title_file"      : "File Archiver: %s",
      "error_open"      : "Cannot open archive '%s'. Server responded: %s",
      "error_extract"   : "Cannot extract archive '%s'. Server responded: %s",
      "error_noarchive" : "No archive to extract",
      "extracted"       : "Archive '%s' extracted."
    },
    'nb_NO' : {
      "title"           : "Fil Arkiverer",
      "title_file"      : "Fil Arkiverer: %s",
      "error_open"      : "Kan ikke åpne arkivet '%s'. Server svarte: %s",
      "error_extract"   : "Kan ikke pakke ut '%s'. Server svarte: %s",
      "error_noarchive" : "Ingen arkiv å pakke ut",
      "extracted"       : "Arkiv '%s' pakket ut."
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
    var MIMES  = [
      "application/zip",
      "application/x-bzip2",
      "application/x-gzip",
      "application/x-rar",
      "application/x-tar"
    ];

    var ArchiverIconView = OSjs.Classes.IconView.extend({
      init : function(app, el) {
        this._super(el);
        this.app = app;
      },

      createItem : function(view, iter) {
        var el = $(sprintf("<tr><td><img alt=\"\" src=\"%s\" /></td><td>%s</td><td>%s</td><td>%s</td></tr>",
                       API.ui.getIcon(iter.icon, "16x16"),
                       iter.name,
                       iter.size,
                       iter.mime));

        el.data("name", iter.name);
        el.data("mime", iter.mime);
        el.data("size", iter.size);
        el.data("path", iter.path);
        el.data("type", iter.type);

        return el;
      }
    });

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

        this._content         = $("<div><div class=\"GtkWindow window1\"> <div class=\"GtkBox box1 GtkBoxVertical\"> <div class=\"GtkBoxPackage Position_0\"> <ul class=\"GtkMenuBar menubar1\"> <li class=\"GtkMenuItem menuitem_file\"> <div class=\"GtkMenuItemInner\"> <span><u>F</u>ile</span> </div> <ul class=\"GtkMenu menu_file\"> <li class=\"GtkImageMenuItem imagemenuitem_new\"> <div class=\"GtkMenuItemInner\"> <img alt=\"New\" src=\"/img/icons/16x16/actions/gtk-new.png\"/> <span>New</span> </div> </li> <li class=\"GtkImageMenuItem imagemenuitem_open\"> <div class=\"GtkMenuItemInner\"> <img alt=\"Open\" src=\"/img/icons/16x16/actions/gtk-open.png\"/> <span>Open</span> </div> </li> <li class=\"GtkImageMenuItem imagemenuitem_save\"> <div class=\"GtkMenuItemInner\"> <img alt=\"Save\" src=\"/img/icons/16x16/actions/gtk-save.png\"/> <span>Save</span> </div> </li> <li class=\"GtkImageMenuItem imagemenuitem_saveas\"> <div class=\"GtkMenuItemInner\"> <img alt=\"Save as...\" src=\"/img/icons/16x16/actions/gtk-save-as.png\"/> <span>Save as...</span> </div> </li> <li> <div class=\"GtkSeparatorMenuItem separatormenuitem1\"></div> </li> <li class=\"GtkImageMenuItem imagemenuitem_quit\"> <div class=\"GtkMenuItemInner\"> <img alt=\"Quit\" src=\"/img/icons/16x16/actions/gtk-quit.png\"/> <span>Quit</span> </div> </li> </ul> </li> <li class=\"GtkMenuItem menuitem_actions\"> <div class=\"GtkMenuItemInner\"> <span><u>A</u>ctions</span> </div> <ul class=\"GtkMenu menu_actions\"> <li class=\"GtkImageMenuItem menuitem_add\"> <div class=\"GtkMenuItemInner\"> <img alt=\"Add\" src=\"/img/icons/16x16/actions/gtk-add.png\"/> <span>Add</span> </div> </li> <li class=\"GtkImageMenuItem menuitem_remove\"> <div class=\"GtkMenuItemInner\"> <img alt=\"Remove\" src=\"/img/icons/16x16/actions/gtk-remove.png\"/> <span>Remove</span> </div> </li> <li class=\"GtkImageMenuItem menuitem_execute\"> <div class=\"GtkMenuItemInner\"> <img alt=\"Execute\" src=\"/img/icons/16x16/actions/gtk-execute.png\"/> <span>Execute</span> </div> </li> </ul> </li> </ul> </div> <div class=\"GtkBoxPackage Position_1 Expand Fill\"> <div class=\"GtkIconView iconview1\"></div> </div> <div class=\"GtkBoxPackage Position_2\"> <div class=\"GtkStatusbar statusbar1\"></div> </div> </div> </div> </div>").html();
        this._title           = LABELS.title;
        this._icon            = "mimetypes/package-x-generic.png";
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
        this._width           = 500;
        this._height          = 500;
        this._gravity         = null;

        this.iconview = null;
      },

      destroy : function() {
        if ( this.iconview ) {
          this.iconview.destroy();
          this.iconview = null;
        }

        this._super();
      },

      EventMenuNew : function(el, ev) {
        this.openArchive(null, null);
      },

      EventMenuOpen : function(el, ev) {
        var self = this;
        this.app.defaultFileOpen({
          "callback" : function(fname) {
            self.app.openArchive(fname);
          },
          "mimes" : MIMES
        });
      },

      EventMenuQuit : function(el, ev) {
        var self = this;
        this.$element.find(".ActionClose").click();
      },

      EventMenuArchiveAdd : function(el, ev) {
        var self = this;
      },

      EventMenuArchiveRemove : function(el, ev) {
        var self = this;
      },

      EventMenuArchiveExecute : function(el, ev) {
        var self = this;
        var path = "/User/Temp";
        if ( this.app.extractArchive() ) {
          API.ui.dialog_input(path, "Extract to", function(value) {
            self.app.extractArchive(null, value);
          });
        }
      },

      create : function(id, mcallback) {
        var el    = this._super(id, mcallback);
        var self  = this;

        if ( el ) {
          el.find(".imagemenuitem_new").click(function(ev) {
            self.EventMenuNew(this, ev);
          });
          el.find(".imagemenuitem_open").click(function(ev) {
            self.EventMenuOpen(this, ev);
          });
          el.find(".imagemenuitem_quit").click(function(ev) {
            self.EventMenuQuit(this, ev);
          });
          el.find(".menuitem_add").click(function(ev) {
            self.EventMenuArchiveAdd(this, ev);
          });
          el.find(".menuitem_remove").click(function(ev) {
            self.EventMenuArchiveRemove(this, ev);
          });
          el.find(".menuitem_execute").click(function(ev) {
            self.EventMenuArchiveExecute(this, ev);
          });

          // Do your stuff here
          this.iconview = new ArchiverIconView(this.app, this.$element.find('.iconview1'));
          this._addObject(this.iconview);

          return true;
        }

        return false;
      },

      openArchive : function(filename, result) {
        var cols = ["", "Filename", "Size", "Type"];
        if ( !result ) {
          this.iconview.render([], cols, 'list');
          this.$element.find(".statusbar1").html("No archive loaded...");
          this._setTitle(LABELS.title);
          return;
        }

        this.iconview.render(result.items, cols, 'list');
        this.$element.find(".statusbar1").html(sprintf("Loaded archive, %d item(s), %db", result.items.length, result.bytes));
        this._setTitle(sprintf(LABELS.title_file, filename));
      }
    });


    ///////////////////////////////////////////////////////////////////////////
    // APPLICATION
    ///////////////////////////////////////////////////////////////////////////

    /**
     * Main Application Class
     * @class
     */
    var __ApplicationArchiver = Application.extend({

      init : function() {
        this._super("ApplicationArchiver", argv);
        this._compability = [];

        this.current_path = null;
      },

      destroy : function() {
        this._super();
      },

      run : function() {
        var root_window = new Window_window1(this);
        this._super(root_window);
        root_window.show();

        // Do your stuff here
        this.openArchive(this._getArgv("path"));
      },

      openArchive : function(path) {
        var self = this;

        if ( !path ) {
          this._root_window.openArchive(null, null);
          return;
        }

        this._event("browse", {"path" : path}, function(result, error) {
          if ( error ) {
            self.createMessageDialog({'type' : "error", 'message' : sprintf(LABELS.error_open, basename(path), error)});
            self.current_path = null;
            self._root_window.openArchive(null, null);
          } else {
            self.current_path = path;
            self._root_window.openArchive(basename(path), result);
          }
        });
      },

      extractArchive : function(path, destination) {
        var self = this;

        if ( path === undefined || path === null ) {
          if ( !this.current_path ) {
            this.createMessageDialog({'type' : "error", 'message' : LABELS.error_noarchive});
            return false;
          }

          path = this.current_path;
        }

        if ( path && destination ) {
          this._event("extract", {"path" : path, "destination" : destination}, function(result, error) {
            error = error || result.error;
            if ( error ) {
              self.createMessageDialog({'type' : "error", 'message' : sprintf(LABELS.error_extract, basename(path), error)});
            } else {
              self.createMessageDialog({'type' : "info", 'message' : sprintf(LABELS.extracted, basename(path))});
            }
          });
        }


        return true;
      }
    });

    return new __ApplicationArchiver();
  };
})($);
