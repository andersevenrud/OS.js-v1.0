/*!
 * OS.js - JavaScript Operating System - Contains ApplicationDraw JavaScript
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
OSjs.Packages.ApplicationDraw = (function($, undefined) {
  "$:nomunge";

  var _LINGUAS = {
    'en_US' : {
      "title" : "Draw"
    },
    'nb_NO' : {
      "title" : "Tegne"
    }
  };

  return function(GtkWindow, Application, API, argv, windows) {
    "GtkWindow:nomunge, Application:nomunge, API:nomunge, argv:nomunge, windows:nomunge";

    var LABELS = _LINGUAS[API.system.language()] || _LINGUAS['en_US'];
    var MIMES  = ["image/*"];

    var IMAGE_MIME = "image/png";
    var IMAGE_ENCODING = 'data:image/png;base64';

    var Icons = {
      "selection"  : "/VFS/resource/ApplicationDraw/stock-selection-16.png",
      "pencil"     : "/VFS/resource/ApplicationDraw/stock-tool-pencil-16.png",
      "line"       : "/VFS/resource/ApplicationDraw/stock-tool-path-16.png",
      "square"     : "/VFS/resource/ApplicationDraw/stock-shape-square-16.png",
      "rectangle"  : "/VFS/resource/ApplicationDraw/stock-shape-rectangle-16.png",
      "circle"     : "/VFS/resource/ApplicationDraw/stock-shape-circle-16.png",
      "ellipse"    : "/VFS/resource/ApplicationDraw/stock-shape-ellipse-16.png",
      "fill"       : "/VFS/resource/ApplicationDraw/stock-tool-bucket-fill-16.png",
      "pick"       : "/VFS/resource/ApplicationDraw/stock-color-pick-from-screen-16.png"
    };

    // Get the mouse position relative to the canvas element.
    function mouseposX(ev) {
      var x;
      if (ev.layerX || ev.layerX === 0) { // Firefox
        x = ev.layerX;
      } else if (ev.offsetX || ev.offsetX === 0) { // Opera
        x = ev.offsetX;
      }
      return x;
    }

    // Get the mouse position relative to the canvas element.
    function mouseposY(ev) {
      var y;
      if (ev.layerX || ev.layerX === 0) { // Firefox
        y = ev.layerY;
      } else if (ev.offsetX || ev.offsetX === 0) { // Opera
        y = ev.offsetY;
      }
      return y;
    }

    /**
     * Color
     * @class
     */
    var DrawColor = function() {
      var red   = 0,
          green = 0,
          blue  = 0,
          alpha = 100,
          hex   = "#000000";


      if ( arguments.length == 1 ) {
        hex = arguments[0];

        if ( hex.match(/^rgba?/) ) {
          //var parts = hex.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
          var parts = hex.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)/);
          delete (parts[0]);
          for (var i = 1; i <= 3; ++i) {
            parts[i] = parseInt(parts[i], 10).toString(16);
            if (parts[i].length == 1) parts[i] = '0' + parts[i];
          }
          hex = parts.join('');
        }

        var rgb = parseInt(hex.replace("#", ""), 16);

        red   = (rgb & (255 << 16)) >> 16;
        green = (rgb & (255 << 8)) >> 8;
        blue  = (rgb & 255);
      } else {
        red   = arguments[0] || 0;
        green = arguments[1] || 0;
        blue  = arguments[2] || 0;
        alpha = arguments[3] || 0;

        hex   = hexFromRGB(red, green, blue);
      }

      return {
        hex : hex,
        r   : red,
        g   : green,
        b   : blue,
        a   : alpha
      };
    };

    /**
     * Tool Style
     * @class
     */
    var Style = function() {
      return {
        stroke : DrawColor("#000000"),
        fill   : DrawColor("#ffffff"),
        width  : 1,
        cap    : "butt",
        join   : "milter"
      };
    };

    /**
     * Tool
     * @class
     */
    var Tool = {

      type   : 'pencil',
      fill   : true,
      stroke : true,

      onMouseDown : function(ev, doc) {
        var button    = (ev.which <= 1) ? 1 : 2;

        if ( this.type == "pencil" || this.type == "brush" ) {
          doc.context.beginPath();
          doc.context.moveTo(doc.draw_start[0], doc.draw_start[1]);

          if ( button == 2 ) {
            doc.context.strokeStyle = Style.fill.hex;
          }
        } else if ( this.type == "selection" ) {
          API.ui.rectangle.init(ev);
        }

      },

      onMouseUp : function(ev, doc) {
        var button    = (ev.which <= 1) ? 1 : 2;

        if ( this.type == "pick" ) {
          var startPosX = doc.draw_start[0];
          var startPosY = doc.draw_start[1];
          var color = doc.getPixelColor(startPosX, startPosY);

          if ( ev.which === 1 ) {
            Style.stroke = color;
            $(doc.root).find(".colorbutton_foreground").css("background-color", "#" + Style.stroke.hex);
          } else {
            Style.fill = color;
            $(doc.root).find(".colorbutton_background").css("background-color", "#" + Style.fill.hex);
          }
        } else if ( this.type == "pencil" || this.type == "brush" ) {
          if ( button == 2 ) {
            doc.context.strokeStyle = Style.stroke.hex;
          }
        }
      },

      onMouseMove : function(ev, doc) {
        var startPosX = doc.draw_start[0];
        var startPosY = doc.draw_start[1];
        var mX        = doc.draw_current[0];
        var mY        = doc.draw_current[1];

        var posX, posY;
        var x, y, w, h, r;

        if ( this.type == "selection" ) {
          return;
        } else if ( this.type == "pencil" || this.type == "brush" ) {
          doc.context.lineTo(doc.draw_current[0], doc.draw_current[1]);
          doc.context.stroke();
        } else if ( this.type == "line" ) {
          doc.context.beginPath();
          doc.context.moveTo(doc.draw_start[0], doc.draw_start[1]);
          doc.context.lineTo(doc.draw_current[0], doc.draw_current[1]);
          doc.context.stroke();
          doc.context.closePath();
        } else if ( this.type == "rectangle" ) {
          x = Math.min(doc.draw_current[0], doc.draw_start[0]);
          y = Math.min(doc.draw_current[1], doc.draw_start[1]);
          w = Math.abs(doc.draw_current[0] - doc.draw_start[0]);
          h = Math.abs(doc.draw_current[1] - doc.draw_start[1]);

          if (!w || !h) {
            return;
          }

          if ( Tool.stroke ) {
            doc.context.strokeRect(x, y, w, h);
          }
          if ( Tool.fill ) {
            doc.context.fillRect(x, y, w, h);
          }
        } else if ( this.type == "square" ) {
            posX = Math.round(startPosX - mX);
            posY = Math.round(startPosY - mY);
            var or = Math.sqrt(Math.pow(posX, 2) + Math.pow(posY, 2));
            r = or;

            if ( mX < startPosX || mY < startPosY )
              r = -r;

            mX = startPosX + r;
            mY = startPosX + r;

            x = Math.min(mX, startPosX);
            y = Math.min(mY, startPosY);
            w = parseInt(or, 10);
            h = parseInt(or, 10);

            if (!w || !h) {
              return;
            }

            if ( Tool.stroke ) {
              doc.context.strokeRect(x, y, w, h);
            }
            if ( Tool.fill ) {
              doc.context.fillRect(x, y, w, h);
            }

        } else if ( this.type == "ellipse" ) {

          var width = Math.abs(startPosX - doc.draw_current[0]);
          var height = Math.abs(startPosY - doc.draw_current[1]);

          if ( width > 0 && height > 0 ) {
            doc.context.beginPath();

            doc.context.moveTo(doc.draw_start[0], doc.draw_start[1] - height*2); // A1

            doc.context.bezierCurveTo(
              startPosX + width*2, startPosY - height*2, // C1
              startPosX + width*2, startPosY + height*2, // C2
              startPosX, startPosY + height*2); // A2

            doc.context.bezierCurveTo(
              startPosX - width*2, startPosY + height*2, // C3
              startPosX - width*2, startPosY - height*2, // C4
              startPosX, startPosY - height*2); // A1

            doc.context.closePath();

            if ( Tool.stroke ) {
              doc.context.stroke();
            }

            if ( Tool.fill ) {
              doc.context.fill();
            }
          }
        } else if ( this.type == "circle" ) {
          posX = Math.abs(doc.draw_start[0] - doc.draw_current[0]);
          posY = Math.abs(doc.draw_start[1] - doc.draw_current[1]);
          r = Math.sqrt(Math.pow(posX, 2) + Math.pow(posY, 2));

          if ( r > 0 ) {
            doc.context.beginPath();
            doc.context.arc(doc.draw_start[0],doc.draw_start[1],r,0,Math.PI*2,true);
            doc.context.closePath();

            if ( Tool.stroke ) {
              doc.context.stroke();
            }
            if ( Tool.fill ) {
              doc.context.fill();
            }
          }
        }
      },

      onMouseClick : function(ev, doc) {
        if ( this.type == "fill" ) {
          doc.context.fillRect(0, 0, doc.canvas.width, doc.canvas.height);
          doc.redraw();
        }
      }
    };

    /**
     * @document
     */
    var DrawDocument = {

      init : function(el) {
        var self = this;

        this.loaded   = false;
        this.root     = el;
        this.canvaso  = el.find("canvas").get(0);
        this.contexto = this.canvaso.getContext('2d');
        this.canvas   = $(this.canvaso).parent().append("<canvas></canvas>").find("canvas").get(1);
        this.context  = this.canvas.getContext('2d'); // This layer gets drawn to 'context' on update
        this.loader   = el.find(".ApplicationDrawLoading");

        this.draw_on      = false;
        this.draw_start   = null;
        this.draw_current = null;
        this.image_width  = -1;
        this.image_height = -1;

        $(this.canvas).css({
          "position" : "absolute",
          "top"      : "0px",
          "left"     : "0px"
        });

        var _mousemove = function(ev) {
          self.onMouseMove(ev);
        };
        var _mouseup = function(ev) {
          $(self.canvas).unbind('mousemove', _mousemove);
          self.onMouseUp(ev);
        };
        var _mousedown = function(ev) {
          $(self.canvas).bind('mousemove', _mousemove);
          self.onMouseDown(ev);
        };


        $(self.canvas).bind('mousedown', _mousedown);
        $(document).bind('mouseup', _mouseup);

        $(this.canvas).bind("click", function(ev) {
          self.onMouseClick(ev);
        });
        $(this.canvas).bind("contextmenu",function(e) {
          return false;
        });

        this.setSize(this.image_width, this.image_height);
        this.setStyle();
        this.clear();

        this.loader.hide();

        this.loaded = true;
      },

      destroy : function() {
      },

      clear : function() {

        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.contexto.clearRect(0, 0, this.canvas.width, this.canvas.height);

        this.image_width  = 640;
        this.image_height = 480;
        this.setSize(this.image_width, this.image_height);
      },

      open : function(src, c_success, c_error) {
        this.clear();

        c_success = c_success || function() {};
        c_error   = c_error   || function() {};

        var self = this;
        var img = new Image();

        API.ui.cursor("wait");
        this.loader.show();

        img.onload = function() {
          self.canvas.width   = img.width;
          self.canvas.height  = img.height;
          self.canvaso.width  = img.width;
          self.canvaso.height = img.height;
          self.image_width    = img.width;
          self.image_height   = img.height;

          self.context.drawImage(img, 0, 0, self.canvas.width, self.canvas.height);
          self.redraw();

          c_success(src);

          API.ui.cursor("default");
          self.loader.hide();
        };
        img.onerror = function() {
          c_error(src);

          API.ui.cursor("default");
          self.loader.hide();
        };
        img.src = src;
      },

      redraw : function() {
       this.contexto.drawImage(this.canvas, 0, 0);
       this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
      },

      /* MOUSE EVENTS */

      onMouseDown : function(ev) {
        this.setStyle();

        if ( !this.draw_on ) {
          this.draw_on = true;
          this.draw_start = [mouseposX(ev), mouseposY(ev)];

          Tool.onMouseDown(ev, this);
        }

        ev.preventDefault();
      },

      onMouseMove : function(ev) {
        if ( this.draw_on ) {
          this.draw_current = [mouseposX(ev), mouseposY(ev)];

          this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);

          Tool.onMouseMove(ev, this);
        }
      },

      onMouseUp : function(ev) {
        if ( this.draw_on ) {
          Tool.onMouseUp(ev, this);

          this.redraw();

          this.draw_on = false;
        }

        ev.preventDefault();
      },

      onMouseClick : function(ev) {
        Tool.onMouseClick(ev, this);

        ev.preventDefault();
      },

      /* GETTERS */

      getImage : function(type) {
        type = type || IMAGE_MIME;
        return this.canvaso.toDataURL(type);
      },

      getPixelIndex : function(x, y) {
        var imageData = this.contexto.getImageData(0, 0, this.canvas.width, this.canvas.height).data;
        return ((x + y * this.canvas.width) * 4);
      },

      getPixelColor : function(x, y) {
        var imageData = this.contexto.getImageData(0, 0, this.canvas.width, this.canvas.height).data;
        var index = ((x + y * this.canvas.width) * 4);

        return DrawColor(imageData[index + 0], imageData[index + 1], imageData[index + 2], imageData[index + 3]);
      },

      /* SETTERS */

      setStyle : function() {
        this.context.strokeStyle = Style.stroke.hex;
        this.context.fillStyle   = Style.fill.hex;
        this.context.lineWidth   = Style.width;
        this.context.lineCap     = Style.cap;
        this.context.lineJoin    = Style.join;

        if ( Style.pattern ) {
          var self = this;
          var img = new Image();
          img.onload = function() {
            self.context.strokeStyle = self.context.createPattern(img, 'repeat');
          };
          img.src = Style.pattern;
        }

      },

      setPixel : function(x, y, a) {

      },

      setSize : function(w, h) {
        var oldImage;
        if ( this.loaded ) {
          oldImage = this.getImage();
        }

        this.canvas.width        = w || $(this.root).find(".WindowContent").width();
        this.canvas.height       = h || $(this.root).find(".WindowContent").height();
        this.canvaso.width       = this.canvas.width;
        this.canvaso.height      = this.canvas.height;

        $(this.canvaso).parent().css({
          "width" : this.canvas.width + "px",
          "height" : this.canvas.height + "px"
        });

        if ( oldImage ) {
          var self = this;
          var img  = new Image();
          img.onload = function() {
            self.contexto.drawImage(img, 0, 0);
          };
          img.src = oldImage;
        }
      }

    };

    //
    // Helpers
    //

    var Window_window1 = GtkWindow.extend({

      init : function(app) {
        this._super("Window_window1", false, app, windows);
        this._content = $("<div class=\"GtkWindow window1\"> <div class=\"GtkBox boxMain GtkBoxVertical\"> <div class=\"GtkBoxPackage Position_0\"> <ul class=\"GtkMenuBar menubarMain\"> <li class=\"GtkMenuItem menuitem_file\"> <div class=\"GtkMenuItemInner\"> <span><u>F</u>ile</span> </div> <ul class=\"GtkMenu menu_file\"> <li class=\"GtkImageMenuItem imagemenuitem_new\"> <div class=\"GtkMenuItemInner\"> <img alt=\"New\" src=\"/img/icons/16x16/actions/gtk-new.png\"/> <span>New</span> </div> </li> <li class=\"GtkImageMenuItem imagemenuitem_open\"> <div class=\"GtkMenuItemInner\"> <img alt=\"Open\" src=\"/img/icons/16x16/actions/gtk-open.png\"/> <span>Open</span> </div> </li> <li class=\"GtkImageMenuItem imagemenuitem_save\"> <div class=\"GtkMenuItemInner\"> <img alt=\"Save\" src=\"/img/icons/16x16/actions/gtk-save.png\"/> <span>Save</span> </div> </li> <li class=\"GtkImageMenuItem imagemenuitem_saveas\"> <div class=\"GtkMenuItemInner\"> <img alt=\"Save as...\" src=\"/img/icons/16x16/actions/gtk-save-as.png\"/> <span>Save as...</span> </div> </li> <li> <div class=\"GtkSeparatorMenuItem separatormenuitem1\"></div> </li> <li class=\"GtkImageMenuItem imagemenuitem_quit\"> <div class=\"GtkMenuItemInner\"> <img alt=\"Quit\" src=\"/img/icons/16x16/actions/gtk-quit.png\"/> <span>Quit</span> </div> </li> </ul> </li> <li class=\"GtkMenuItem menuitem_effects\"> <div class=\"GtkMenuItemInner\"> <span><u>E</u>ffects</span> </div> <ul class=\"GtkMenu menu_effects\"> <li class=\"GtkMenuItem menuitem_effect_noise\"> <div class=\"GtkMenuItemInner\"> <span>Noise</span> </div> </li> </ul> </li> </ul> </div> <div class=\"GtkBoxPackage Position_1\"> <ul class=\"GtkToolbar toolbarMain\"> <li> <button class=\"GtkToggleToolButton toolbutton_stroke\"> <span>Enable Stroke</span> </button> </li> <li> <button class=\"GtkToggleToolButton toolbutton_fill\"> <span>Enable Fill</span> </button> </li> <li class=\"GtkToolItem toolbutton1\"> <div class=\"GtkBox box1 GtkBoxHorizontal\" style=\"width:150px\"> <div class=\"GtkBoxPackage Position_0\"> <div class=\"GtkLabel label1\" style=\"width:80px\"> <span>Thickness</span> </div> </div> <div class=\"GtkBoxPackage Position_1\"> <div class=\"GtkScale scale1\" style=\"width:80px\"> <div></div> </div> </div> </div> </li> <li class=\"GtkToolItem toolbutton2\"> <div class=\"GtkBox box2 GtkBoxHorizontal\"> <div class=\"GtkBoxPackage Position_0\"> <div class=\"GtkLabel label2\"> <span>Line Join</span> </div> </div> <div class=\"GtkBoxPackage Position_1\"> <select class=\"GtkComboBox combobox_linejoin\"> <option class=\"GtkCellRendererText cellrenderertext_milter\"></option> <option class=\"GtkCellRendererText cellrenderertext_bevel\"></option> <option class=\"GtkCellRendererText cellrenderertext_round\"></option> </select> </div> </div> </li> <li class=\"GtkToolItem toolbutton3\"> <div class=\"GtkBox box4 GtkBoxHorizontal\"> <div class=\"GtkBoxPackage Position_0\"> <div class=\"GtkLabel label3\"> <span>Line Cap</span> </div> </div> <div class=\"GtkBoxPackage Position_1\"> <select class=\"GtkComboBox combobox_linecap\"> <option class=\"GtkCellRendererText cellrenderertext_butt\"></option> <option class=\"GtkCellRendererText cellrenderertext_round1\"></option> <option class=\"GtkCellRendererText cellrenderertext_square\"></option> </select> </div> </div> </li> </ul> </div> <div class=\"GtkBoxPackage Position_2 Expand Fill\"> <div class=\"GtkBox boxContent GtkBoxHorizontal\"> <div class=\"GtkBoxPackage Position_0\"> <div class=\"GtkBox box3 GtkBoxVertical\" style=\"width:100px\"> <div class=\"GtkBoxPackage Position_0 Expand Fill\"> <div class=\"GtkToolPalette toolpalette1\"> <button class=\"GtkToolItemGroup toolitemgroup_selection\"> <span>Selection Rectangle</span> </button> <button class=\"GtkToolItemGroup toolitemgroup_pencil\"> <span>Pencil</span> </button> <button class=\"GtkToolItemGroup toolitemgroup_line\"> <span>Brush</span> </button> <button class=\"GtkToolItemGroup toolitemgroup_square\"> <span>Square</span> </button> <button class=\"GtkToolItemGroup toolitemgroup_rectangle\"> <span>Rectangle</span> </button> <button class=\"GtkToolItemGroup toolitemgroup_circle\"> <span>Circle</span> </button> <button class=\"GtkToolItemGroup toolitemgroup_ellipse\"> <span>Ellipse</span> </button> <button class=\"GtkToolItemGroup toolitemgroup_fill\"> <span>Bucket</span> </button> <button class=\"GtkToolItemGroup toolitemgroup_pick\"> <span>Pick</span> </button> </div> </div> <div class=\"GtkBoxPackage Position_1\"> <hr class=\"GtkSeparator separator1\"/> </div> <div class=\"GtkBoxPackage Position_2\"> <div class=\"GtkFixed fixed1\" style=\"height:200px\"> <button class=\"GtkColorButton colorbutton_background\" style=\"width:50px;height:50px\"> <span class=\"GtkColorButtonColor\"></span> </button> <button class=\"GtkColorButton colorbutton_foreground\" style=\"width:50px;height:50px\"> <span class=\"GtkColorButtonColor\"></span> </button> </div> </div> </div> </div> <div class=\"GtkBoxPackage Position_1 Expand Fill\"> <div class=\"GtkViewport viewport1\"> <div class=\"GtkDrawingArea drawingarea1 Canvas\"></div> </div> </div> </div> </div> </div> </div> ").html();
        this._title = LABELS.title;
        this._icon = 'categories/gnome-graphics.png';
        this._is_draggable = true;
        this._is_resizable = true;
        this._is_scrollable = false;
        this._is_sessionable = true;
        this._is_minimizable = true;
        this._is_maximizable = true;
        this._is_closable = true;
        this._is_orphan = false;
        this._width = 800;
        this._height = 500;
        this._gravity = null;
        this._global_dnd = true;
      },

      destroy : function() {
        DrawDocument.destroy();

        this._super();
      },

      EventMenuNew : function(el, ev) {
        DrawDocument.clear();
        this._update(null, true);
      },


      EventMenuOpen : function(el, ev) {
        var self = this;
        this.app.defaultFileOpen({
          "callback" : function(fname) {
            DrawDocument.open("/media/" + fname);
            self._update(fname, true);
          },
          "mimes"   : MIMES,
          "file"    : self.app._getArgv('path'),
          "options" : {
            "preview" : true
          }
        });
      },


      EventMenuSave : function(el, ev) {
        var self = this;
        if ( argv && argv['path'] ) {
          var path = argv['path'];
          var data = DrawDocument.getImage();

          this.app.defaultFileSave({
            "file"      : path,
            "content"   : data,
            "mimes"     : MIMES,
            "encoding"  : IMAGE_ENCODING,
            "callback"  : function(fname) {
              self._update(argv['path']);
            }
          });
        }
      },


      EventMenuSaveAs : function(el, ev) {
        var self = this;
        var data = DrawDocument.getImage();
        var cur   = this.app._getArgv('path');

        this.app.defaultFileSave({
          "file"      : cur,
          "content"   : data,
          "mimes"     : MIMES,
          "encoding"  : IMAGE_ENCODING,
          "saveas"    : true,
          "callback"  : function(fname, mime) {
            self._update(fname, self);
          }
        });
      },


      EventMenuQuit : function(el, ev) {
        this.$element.find(".ActionClose").click();
      },


      EventToggleStroke : function(el, ev) {
        var checked = true;
        if ( !$(el).hasClass("Checked") ) {
          checked = false;
        }
        Tool.stroke = checked ? true : false;
      },


      EventToggleFill : function(el, ev) {
        var checked = true;
        if ( !$(el).hasClass("Checked") ) {
          checked = false;
        }
        Tool.fill = checked ? true : false;
      },


      EventChangeBackground : function(el, ev) {
        this.app.createColorDialog({'color' : Style.fill.hex, 'on_apply' : function(rgb, hex) {
          $(el).css("background-color", hex);

          Style.fill = DrawColor(hex);
        }});
      },


      EventChangeForeground : function(el, ev) {
        this.app.createColorDialog({'color' : Style.stroke.hex, 'on_apply' : function(rgb, hex) {
          $(el).css("background-color", hex);
          Style.stroke = DrawColor(hex);
        }});
      },


      _update : function(file, focus) {
        argv['path']  = file;
        this._argv    = argv;

        this._setTitle(this._origtitle + ": " + (basename(file) || " file"));

        if ( focus === true )
          this.focus();
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

          el.find(".toolbutton_stroke").click(function(ev) {
            self.EventToggleStroke(this, ev);
          });

          el.find(".toolbutton_fill").click(function(ev) {
            self.EventToggleFill(this, ev);
          });

          el.find(".colorbutton_background").click(function(ev) {
            self.EventChangeBackground(this, ev);
          });

          el.find(".colorbutton_foreground").click(function(ev) {
            self.EventChangeForeground(this, ev);
          });

          // Do your stuff here
          this._bind("dnd", function(data) {
            if ( data && data.path && data.mime && checkMIME(data.mime, MIMES) ) {
              //if ( data.path.match(/\.(png|bmp|gif|jpe?g)$/i) ) {}
              DrawDocument.open("/media/" + data.path, function() {
                self._update(data.path, true);
              }, null);
            }
          });

          el.find(".cellrenderertext_milter").html("milter");
          el.find(".cellrenderertext_bevel").html("bevel");
          el.find(".cellrenderertext_round").html("round");
          el.find(".cellrenderertext_butt").html("butt");
          el.find(".cellrenderertext_round1").html("round");
          el.find(".cellrenderertext_square").html("square");

          el.find(".toolbutton_stroke").addClass("Checked");
          el.find(".toolbutton_fill").addClass("Checked");

          // Tool buttons
          $(el).find(".toolpalette1 .GtkToolItemGroup").each(function() {
            var name = $(this).attr("class");
            var namem = name.match(/toolitemgroup\_(.*)/);
            if ( namem.length > 1 ) {
              name = namem[1].replace("select_", "");
            }

            var img = sprintf('<img alt="" src="%s" />', Icons[name]);
            $(this).html(img);

            $(this).click(function() {
              Tool.type = name;
            });

          });

          $(el).find(".GtkToolItemGroup").first().click();

          // Tool props
          $(el).find(".combobox_linecap").change(function() {
            Style.cap = $(el).find(".combobox_linecap").val();
          });
          $(el).find(".combobox_linejoin").change(function() {
            Style.join = $(el).find(".combobox_linejoin").val();
          });

          // Tool thickness
          $(el).find(".scale1 div").slider({
            'min'    : 1,
            'max'    : 50,
            'value'  : 1,
            'step'   : 1,
            'change' : function() {
              Style.width = $(el).find(".scale1").slider("value");
            },
            'slide'  : function() {
              Style.width = $(el).find(".scale1").slider("value");
            }
          });

          Tool.fill    = $(el).find(".toolbutton_fill").hasClass("Checked");
          Tool.stroke  = $(el).find(".toolbutton_stroke").hasClass("Checked");

          Style.stroke = DrawColor($(el).find(".colorbutton_foreground").css("background-color"));
          Style.fill   = DrawColor($(el).find(".colorbutton_background").css("background-color"));
          Style.width  = $(el).find(".scale1").slider("value");
          Style.cap    = $(el).find(".combobox_linecap").val();
          Style.join   = $(el).find(".combobox_linejoin").val();

          try {
          DrawDocument.init(el);

            var fname = null;
            if ( argv['path'] ) {
              fname = argv['path'];
              DrawDocument.open("/media/" + fname, function() {
                self._update(fname);
              }, null);
            } else {
              self._update(fname);
            }

          } catch ( e ) {
            console.error("Failed to init DrawDocument", e);
          }

        }

      }
    });


    ///////////////////////////////////////////////////////////////////////////
    // APPLICATION
    ///////////////////////////////////////////////////////////////////////////

    var __ApplicationDraw = Application.extend({

      init : function() {
        this._super("ApplicationDraw", argv);
        this._compability = ["canvas"];
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
      }
    });

    return new __ApplicationDraw();
  };
})($);
