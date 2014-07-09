/*!
 * OS.js - JavaScript Operating System - Contains ApplicationWriter JavaScript
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
 * https://developer.mozilla.org/en/rich-text_editing_in_mozilla
 * http://dev.opera.com/articles/view/rich-html-editing-in-the-browser-part-1/
 *
 * @package OSjs.Packages
 * @author Anders Evenrud <andersevenrud@gmail.com>
 * @licence Simplified BSD License
 * @class
 */
OSjs.Packages.ApplicationWriter = (function($, undefined) {
  "$:nomunge";

  /**
   * Translations
   */
  var _LINGUAS = {
    'en_US' : {
      "title"     : "Writer",
      "title_new" : "Writer: New Document",
      "title_open": "Writer: %s"
    },
    'nb_NO' : {
      "title"     : "Skriveprogram",
      "title_new" : "Skriveprogram: Nytt Dokument",
      "title_open": "Skriveprogram: %s"
    }
  };

  /**
   * Default Settings
   */
  var CURRENT_FONT  = "Arial";
  var CURRENT_COLOR = "#000000";
  var CURRENT_SIZE  = 3; // 1-7

  var FONT_LIST = [
    "Arial",
    "Arial Black",
    "Comic Sans MS",
    "Courier New",
    "Georgia",
    "Impact",
    "Times New Roman",
    "Trebuchet MS",
    "Verdana",
    "Symbol",
    "Webdings"
  ];

  /**
   * Custom Editor
   * @class
   */
  var WriterEditor = OSjs.Classes.RichtextEditor.extend({
    init : function(area, font, size, color) {
      this._super(area, true);
      this.toggleFontStyle(font, size, color);
    }
  });

  /**
   * Application
   */
  return function(GtkWindow, Application, API, argv, windows) {
    "GtkWindow:nomunge, Application:nomunge, API:nomunge, argv:nomunge, windows:nomunge";

    var LABELS = _LINGUAS[API.system.language()] || _LINGUAS['en_US'];
    var MIMES = ["text/*"];

    /////////////////////////////////////////////////////////////////////////////////////
    // WINDOWS
    /////////////////////////////////////////////////////////////////////////////////////

    var Window_window1 = GtkWindow.extend({

      init : function(app) {
        this._super("Window_window1", false, app, windows);
        this._content         = $("<div class=\"GtkWindow window1\"> <div class=\"GtkBox box1 GtkBoxVertical\"> <div class=\"GtkBoxPackage Position_0\"> <ul class=\"GtkMenuBar menubar1\"> <li class=\"GtkMenuItem menuitem_file\"> <div class=\"GtkMenuItemInner\"> <span><u>F</u>ile</span> </div> <ul class=\"GtkMenu menu_file\"> <li class=\"GtkImageMenuItem imagemenuitem_new\"> <div class=\"GtkMenuItemInner\"> <img alt=\"New\" src=\"/img/icons/16x16/actions/gtk-new.png\"/> <span>New</span> </div> </li> <li class=\"GtkImageMenuItem imagemenuitem_open\"> <div class=\"GtkMenuItemInner\"> <img alt=\"Open\" src=\"/img/icons/16x16/actions/gtk-open.png\"/> <span>Open</span> </div> </li> <li class=\"GtkImageMenuItem imagemenuitem_save\"> <div class=\"GtkMenuItemInner\"> <img alt=\"Save\" src=\"/img/icons/16x16/actions/gtk-save.png\"/> <span>Save</span> </div> </li> <li class=\"GtkImageMenuItem imagemenuitem_saveas\"> <div class=\"GtkMenuItemInner\"> <img alt=\"Save as...\" src=\"/img/icons/16x16/actions/gtk-save-as.png\"/> <span>Save as...</span> </div> </li> <li> <div class=\"GtkSeparatorMenuItem separatormenuitem1\"></div> </li> <li class=\"GtkImageMenuItem imagemenuitem_quit\"> <div class=\"GtkMenuItemInner\"> <img alt=\"Quit\" src=\"/img/icons/16x16/actions/gtk-quit.png\"/> <span>Quit</span> </div> </li> </ul> </li> </ul> </div> <div class=\"GtkBoxPackage Position_1\"> <ul class=\"GtkToolbar toolpalette1\"> <li> <button class=\"GtkToggleToolButton toggletoolbutton1\"> <img alt=\"Bold\" src=\"/img/icons/16x16/actions/gtk-bold.png\"/> <span>Bold</span> </button> </li> <li> <button class=\"GtkToggleToolButton toggletoolbutton2\"> <img alt=\"Underline\" src=\"/img/icons/16x16/actions/gtk-underline.png\"/> <span>Underline</span> </button> </li> <li> <button class=\"GtkToggleToolButton toggletoolbutton3\"> <img alt=\"Italic\" src=\"/img/icons/16x16/actions/gtk-italic.png\"/> <span>Italic</span> </button> </li> <li> <button class=\"GtkToggleToolButton toggletoolbutton4\"> <img alt=\"Strikethrough\" src=\"/img/icons/16x16/actions/gtk-strikethrough.png\"/> <span>Strikethrough</span> </button> </li> <li> <hr class=\"GtkSeparatorToolItem separatortoolitem1\"/> </li> <li> <button class=\"GtkToggleToolButton toggletoolbutton5\"> <img alt=\"Align Left\" src=\"/img/icons/16x16/actions/format-justify-left.png\"/> <span>Align Left</span> </button> </li> <li> <button class=\"GtkToggleToolButton toggletoolbutton6\"> <img alt=\"Align Center\" src=\"/img/icons/16x16/actions/format-justify-center.png\"/> <span>Align Center</span> </button> </li> <li> <button class=\"GtkToggleToolButton toggletoolbutton7\"> <img alt=\"Align Right\" src=\"/img/icons/16x16/actions/format-justify-right.png\"/> <span>Align Right</span> </button> </li> <li> <hr class=\"GtkSeparatorToolItem separatortoolitem2\"/> </li> <li> <button class=\"GtkToolButton toolbutton1\"> <img alt=\"Font Selection\" src=\"/img/icons/16x16/apps/fonts.png\"/> <span>Font Selection</span> </button> </li> <li> <button class=\"GtkToolButton toolbutton2\"> <img alt=\"Color Selection\" src=\"/img/icons/16x16/apps/preferences-desktop-theme.png\"/> <span>Color Selection</span> </button> </li> </ul> </div> <div class=\"GtkBoxPackage Position_2 Expand Fill\"> <textarea class=\"GtkTextView textview1\"></textarea> </div> <div class=\"GtkBoxPackage Position_3\"> <div class=\"GtkStatusbar statusbar1\"></div> </div> </div> </div> ");
        this._title           = LABELS.title;
        this._icon            = 'apps/libreoffice34-writer.png';
        this._is_draggable    = true;
        this._is_resizable    = true;
        this._is_scrollable   = false;
        this._is_sessionable  = true;
        this._is_minimizable  = true;
        this._is_maximizable  = true;
        this._is_closable     = true;
        this._is_orphan       = false;
        this._width           = 550;
        this._height          = 400;
        this._gravity         = null;
        this._global_dnd      = true;

        this.richtext = null;
      },

      destroy : function() {
        if ( this.richtext ) {
          this.richtext.destroy();
          this.richtext = null;
        }
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
          "file"    : this.app._getArgv('path'),
          "options" : {
            "preview" : true
          }
        });
      },

      EventMenuSave : function(el, ev) {
        var self = this;
        if ( argv && argv['path'] ) {
          var path = argv['path'];
          var data = self.richtext.getContent();

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
        var data = self.$element.find(".textarea").html();
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


      EventClickBold : function(el, ev) {
        var checked = true;
        if ( !$(el).hasClass("Checked") ) {
          checked = false;
        }
        this.richtext.toggleBold();
      },


      EventClickUnderline : function(el, ev) {
        var checked = true;
        if ( !$(el).hasClass("Checked") ) {
          checked = false;
        }
        this.richtext.toggleUnderline();
      },


      EventClickItalic : function(el, ev) {
        var checked = true;
        if ( !$(el).hasClass("Checked") ) {
          checked = false;
        }
        this.richtext.toggleItalic();
      },


      EventClickStrikethrough : function(el, ev) {
        var checked = true;
        if ( !$(el).hasClass("Checked") ) {
          checked = false;
        }
        this.richtext.toggleStrikeThrough();
      },


      EventClickAlignLeft : function(el, ev) {
        var checked = true;
        if ( !$(el).hasClass("Checked") ) {
          checked = false;
        }
        this.richtext.toggleJustification("Left");
      },


      EventClickAlignCenter : function(el, ev) {
        var checked = true;
        if ( !$(el).hasClass("Checked") ) {
          checked = false;
        }
        this.richtext.toggleJustification("Center");
      },


      EventClickAlignRight : function(el, ev) {
        var checked = true;
        if ( !$(el).hasClass("Checked") ) {
          checked = false;
        }
        this.richtext.toggleJustification("Right");
      },


      EventActivateFont : function(el, ev) {
        var self = this;

        var args = {
          "font_name" : CURRENT_FONT,
          "font_size" : CURRENT_SIZE,
          "font_list" : FONT_LIST,
          "size_min"  : 1,
          "size_max"  : 7,
          "size_unit" : "",
          "on_apply" : function(font, size) {
            CURRENT_FONT = font;
            CURRENT_SIZE = size;

            setTimeout(function() {
              self.richtext.toggleFontStyle(font, size);
            }, 0);

          }
        };

        this.app.createFontDialog(args);
      },


      EventActivateColor : function(el, ev) {
        var self = this;
        this.app.createColorDialog({'color' : CURRENT_COLOR, 'on_apply' : function(rgb, hex) {
          CURRENT_COLOR = hex;

          setTimeout(function() {
            self.richtext.toggleFontStyle(undefined, undefined, hex);
          }, 0);

        }});
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

          el.find(".toggletoolbutton1").click(function(ev) {
            self.EventClickBold(this, ev);
          });

          el.find(".toggletoolbutton2").click(function(ev) {
            self.EventClickUnderline(this, ev);
          });

          el.find(".toggletoolbutton3").click(function(ev) {
            self.EventClickItalic(this, ev);
          });

          el.find(".toggletoolbutton4").click(function(ev) {
            self.EventClickStrikethrough(this, ev);
          });

          el.find(".toggletoolbutton5").click(function(ev) {
            self.EventClickAlignLeft(this, ev);
          });

          el.find(".toggletoolbutton6").click(function(ev) {
            self.EventClickAlignCenter(this, ev);
          });

          el.find(".toggletoolbutton7").click(function(ev) {
            self.EventClickAlignRight(this, ev);
          });

          el.find(".toolbutton1").click(function(ev) {
            self.EventActivateFont(this, ev);
          });

          el.find(".toolbutton2").click(function(ev) {
            self.EventActivateColor(this, ev);
          });

          // Do your stuff here
          this._bind("dnd", function(data) {
            if ( data && data.path && data.mime && checkMIME(data.mime, MIMES) ) {
              self.app.openFile(data.path, true);
            }
          });

          el.find(".GtkToolbar span").hide();

          var p = el.find("textarea").parent();
          var area = $("<iframe frameborder=\"0\" border=\"0\" cellspacing=\"0\" src=\"about:blank\" class=\"GtkRichtext\"></iframe>");
          el.find("textarea").remove();
          p.append(area);

          this.richtext = new WriterEditor(area, CURRENT_FONT, CURRENT_SIZE, CURRENT_COLOR);
          this._addObject(this.richtext);
        }
      },

      openFile : function(file, content) {
        this.$element.find(".statusbar1").html("");

        if ( file === null ) {
          this._setTitle(LABELS.title);
          content = "";
        } else if ( file === true ) {
          this._setTitle(LABELS.title_new);
          this.app._setArgv("path", null);
          content = "";
        } else {
          this.changeFile(file);
        }

        this.richtext.setContent(content);
      },

      changeFile : function(file) {
        this._setTitle(sprintf(LABELS.title_open, basename(file)));
        this.app._setArgv("path", file);
        this.$element.find(".statusbar1").html(file);
      }
    });


    ///////////////////////////////////////////////////////////////////////////
    // APPLICATION
    ///////////////////////////////////////////////////////////////////////////

    var __ApplicationWriter = Application.extend({

      init : function() {
        this._super("ApplicationWriter", argv);
        this._compability = ["richtext"];
      },

      destroy : function() {
        this._super();
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
              self._root_window.focus();
            }
          });
          return;
        }

        this._root_window.openFile(null);
      },

      run : function() {
        var root_window = new Window_window1(this);
        this._super(root_window);
        root_window.show();

        // Do your stuff here
        this.openFile(this._getArgv("path"));
      }
    });

    return new __ApplicationWriter();
  };
})($);
