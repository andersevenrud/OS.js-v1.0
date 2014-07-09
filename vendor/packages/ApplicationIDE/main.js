/*!
 * OS.js - JavaScript Operating System - Contains ApplicationIDE JavaScript
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
OSjs.Packages.ApplicationIDE = (function($, undefined) {
  "$:nomunge";

  /**
   * @param GtkWindow     GtkWindow            GtkWindow API Reference
   * @param Application   Application          Application API Reference
   * @param API           API                  Public API Reference
   * @param Object        argv                 Application arguments (like cmd)
   * @param Array         windows              Application windows from session (restoration)
   */
  return function(GtkWindow, Application, API, argv, windows) {
    "GtkWindow:nomunge, Application:nomunge, API:nomunge, argv:nomunge, windows:nomunge";

    ///////////////////////////////////////////////////////////////////////////
    // WINDOWS
    ///////////////////////////////////////////////////////////////////////////

    /**
     * CodeEditor -- Custom RichtextEditor for coding
     * @class
     */
    var CodeEditor = OSjs.Classes.RichtextEditor.extend({
      setContent : function(content) {
        var css = "body { white-space : pre; font-size : 12px; font-family : monospace; padding : 10px; margin : 0; }";
        this._super(content, css);
      }
    });

    /**
     * GtkWindow Class
     * @class
     */
    var Window_window_main = GtkWindow.extend({

      init : function(app) {
        this._super("Window_window_main", false, app, windows);
        this._content = $("<div><div class=\"GtkWindow window_main\"> <div class=\"GtkBox box1 GtkBoxVertical\"> <div class=\"GtkBoxPackage Position_0\"> <ul class=\"GtkMenuBar menubar_main\"> <li class=\"GtkMenuItem menuitem_file\"> <div class=\"GtkMenuItemInner\"> <span><u>F</u>ile</span> </div> <ul class=\"GtkMenu menu_file\"> <li class=\"GtkImageMenuItem imagemenuitem_new\"> <div class=\"GtkMenuItemInner\"> <img alt=\"New\" src=\"/img/icons/16x16/actions/gtk-new.png\"/> <span>New</span> </div> </li> <li class=\"GtkImageMenuItem imagemenuitem_open\"> <div class=\"GtkMenuItemInner\"> <img alt=\"Open\" src=\"/img/icons/16x16/actions/gtk-open.png\"/> <span>Open</span> </div> </li> <li class=\"GtkImageMenuItem imagemenuitem_save\"> <div class=\"GtkMenuItemInner\"> <img alt=\"Save\" src=\"/img/icons/16x16/actions/gtk-save.png\"/> <span>Save</span> </div> </li> <li class=\"GtkImageMenuItem imagemenuitem_saveas\"> <div class=\"GtkMenuItemInner\"> <img alt=\"Save as...\" src=\"/img/icons/16x16/actions/gtk-save-as.png\"/> <span>Save as...</span> </div> </li> <li> <div class=\"GtkSeparatorMenuItem separatormenuitem1\"></div> </li> <li class=\"GtkImageMenuItem imagemenuitem_quit\"> <div class=\"GtkMenuItemInner\"> <img alt=\"Quit\" src=\"/img/icons/16x16/actions/gtk-quit.png\"/> <span>Quit</span> </div> </li> </ul> </li> <li class=\"GtkMenuItem menuitem_view\"> <div class=\"GtkMenuItemInner\"> <span><u>V</u>iew</span> </div> </li> <li class=\"GtkMenuItem menuitem_help\"> <div class=\"GtkMenuItemInner\"> <span><u>H</u>elp</span> </div> <ul class=\"GtkMenu menu_help\"> <li class=\"GtkImageMenuItem imagemenuitem_about\"> <div class=\"GtkMenuItemInner\"> <img alt=\"About\" src=\"/img/icons/16x16/actions/gtk-about.png\"/> <span>About</span> </div> </li> </ul> </li> </ul> </div> <div class=\"GtkBoxPackage Position_1 Expand Fill\"> <div class=\"GtkFixed fixed\"></div> </div> <div class=\"GtkBoxPackage Position_2\"> <div class=\"GtkStatusbar statusbar_main\"></div> </div> </div> </div> </div>").html();
        this._title = 'OS.js Package IDE';
        this._icon = 'categories/applications-development.png';
        this._is_draggable = true;
        this._is_resizable = true;
        this._is_scrollable = false;
        this._is_sessionable = true;
        this._is_minimizable = true;
        this._is_maximizable = true;
        this._is_closable = true;
        this._is_orphan = false;
        this._skip_taskbar = false;
        this._skip_pager = false;
        this._width = 700;
        this._height = 400;
        this._gravity = null;

        this.richtext = null;
      },

      destroy : function() {
        if ( this.richtext ) {
          this.richtext.destroy();
          this.richtext = null;
        }
        this._super();
      },


      EventEventMenuNew : function(el, ev) {
        this.app.CloseProject();
      },


      EventEventMenuOpen : function(el, ev) {
        var self = this;
        this.app.defaultFileOpen({
          "callback" : function(fname) {
            self.app.OpenProject(fname, self);
          },
          "mimes" : ["OSjs/Application"],
          "dir"   :  "/System/Packages"
        });
      },


      EventEventMenuSave : function(el, ev) {
        this.app.SaveProject();
      },


      EventEventMenuSaveAs : function(el, ev) {
        this.app.SaveProject();
      },


      EventEventMenuQuit : function(el, ev) {
        this.$element.find(".ActionClose").click();
      },


      EventEventMenuAbout : function(el, ev) {
      },

      create : function(id, mcallback) {
        var el = this._super(id, mcallback);
        var self = this;

        if ( el ) {

          el.find(".imagemenuitem_new").click(function(ev) {
            self.EventEventMenuNew(this, ev);
          });

          el.find(".imagemenuitem_open").click(function(ev) {
            self.EventEventMenuOpen(this, ev);
          });

          el.find(".imagemenuitem_save").click(function(ev) {
            self.EventEventMenuSave(this, ev);
          });

          el.find(".imagemenuitem_saveas").click(function(ev) {
            self.EventEventMenuSaveAs(this, ev);
          });

          el.find(".imagemenuitem_quit").click(function(ev) {
            self.EventEventMenuQuit(this, ev);
          });

          el.find(".imagemenuitem_about").click(function(ev) {
            self.EventEventMenuAbout(this, ev);
          });

          // Do your stuff here
          var filePanel = $('<div class="FilePanel"></div>');
          var textPanel = $('<div class="TextPanel"></div>');

          var area = $("<iframe frameborder=\"0\" border=\"0\" cellspacing=\"0\" src=\"about:blank\" class=\"GtkRichtext\"></iframe>");
          textPanel.append(area);

          el.find(".fixed").append(filePanel);
          el.find(".fixed").append(textPanel);

          this.richtext = new CodeEditor(area);

          return true;
        }

        return false;
      },

      UpdateFilePanel : function(files, pname, click_callback) {
        var box = this.$element.find(".FilePanel");
        box.empty();

        if ( files !== null ) {
          var lst = $('<ul></ul>');
          var item;
          for ( var f in files ) {
            if ( files.hasOwnProperty(f) ) {
              item = $('<li>' + f + '</li>');

              item.click((function(i) {
                return function() {
                  click_callback(pname, i);
                };
              })(f));

              lst.append(item);
            }
          }
          box.append(lst);
        }
      },

      UpdateStatusbar : function(txt) {
        this.$element.find(".statusbar_main").html(txt);
      },

      UpdateRichtext : function(content) {
        if ( this.richtext ) {
          this.richtext.setContent(content);
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
    var __ApplicationIDE = Application.extend({

      init : function() {
        this._super("ApplicationIDE", argv);
        this._compability = ["richtext"];

        this.ResetView();
      },

      destroy : function() {
        this.view = null;
        this._super();
      },

      run : function() {
        var self = this;

        var root_window = new Window_window_main(self);
        this._super(root_window);
        root_window.show();

        // Do your stuff here
        this.OpenProject(((argv && argv.path) ? argv.path : null));
      },

      /**
       * Reset view and windows
       * @return void
       */
      ResetView : function() {
        this.view = {
          name  : "",
          path  : null,
          files : {},
          current_file : null
        };

        if ( this._root_window ) {
          this._root_window.UpdateFilePanel(null);
          this._root_window.UpdateStatusbar("");
          this._root_window.UpdateRichtext("");
        }
      },

      /**
       * Opens up a project
       * @return void
       */
      OpenProject : function(pname) {
        if ( !pname )
          return;

        var self = this;
        this._event('OpenProject', {'name' : pname}, function(data, error) {
          if ( error ) {
            self._setArgv("path", null);
            self.createMessageDialog({"type" : "error", "message" : error});
          } else {
            self._setArgv("path", pname);
            self.LoadProject(pname, data);
          }
        }, true);
      },

      /**
       * Loads up a project
       * @return void
       */
      LoadProject : function(path, data) {
        var pname = basename(path);
        this.view = {
          "name"          : pname,
          "path"          : path,
          "files"         : (data instanceof Object) ? (data.files) : {},
          "current_file"  : null
        };

        var self  = this;
        this._root_window.UpdateFilePanel(this.view.files, pname, function(project, name) {
          self.LoadProjectFile(project, name);
        });
      },

      /**
       * Load up a project file
       * @return void
       */
      LoadProjectFile : function(project, filename) {
        var self = this;

        if ( this.view.current_file ) {
          this.view.files[this.view.current_file] = this._root_window.richtext.getContent();
        }

        this._root_window.UpdateStatusbar(sprintf("%s in %s", filename, project));
        this._root_window.UpdateRichtext(self.view.files[filename]);

        this.view.current_file = filename;
      },

      /**
       * Save all changes in project
       * @return void
       */
      SaveProject : function() {
      },

      /**
       * Close project}
       * @return void
       */
      CloseProject : function(save) {
        if ( save ) {
          this.SaveProject();
        }

        this.ResetView();
      }
    });

    return new __ApplicationIDE();
  };
})($);
