/*!
 * OS.js - JavaScript Operating System - Contains ApplicationTickTackToe JavaScript
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
OSjs.Packages.ApplicationTickTackToe = (function($, undefined) {
  "$:nomunge";

  var _LINGUAS = {
    'en_US' : {
      "title" : "Tick-tack-toe"
    },
    'nb_NO' : {
      "title" : "Bondesjakk"
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


    /**
     * GtkWindow Class
     * @class
     */
    var Window_window1 = GtkWindow.extend({

      init : function(app) {
        this._super("Window_window1", false, app, windows);
        //this._content = $("<div class=\"window1\"> <div class=\"GtkWindow ApplicationTickTackToe window1\"> <table class=\"GtkBox Vertical box1\"> <tr> <td class=\"Fill GtkBoxPosition Position_0\"> <div class=\"TableCellWrap\"> <ul class=\"GtkMenuBar menubar1\"> <li class=\"GtkMenuItem menuitem1\"> <span><u>F</u>ile</span> <ul class=\"GtkMenu menu1\"> <li class=\"GtkImageMenuItem imagemenuitem_new\"> <img alt=\"gtk-new\" src=\"/img/icons/16x16/actions/gtk-new.png\"/> <span>New</span> </li> <div class=\"GtkSeparatorMenuItem separatormenuitem1\"></div> <li class=\"GtkImageMenuItem imagemenuitem_quit\"> <img alt=\"gtk-quit\" src=\"/img/icons/16x16/actions/gtk-quit.png\"/> <span>Quit</span> </li> </ul> </li> </ul> </div> </td> </tr> <tr> <td class=\"Expand Fill GtkBoxPosition Position_1\"> <div class=\"TableCellWrap\"> <div class=\"GtkFixed fixed1\"></div> </div> </td> </tr> </table> </div> </div> ").html();
        this._content = $("<div><div class=\"GtkWindow window1\"> <div class=\"GtkBox box1 GtkBoxVertical\"> <div class=\"GtkBoxPackage Position_0\"> <ul class=\"GtkMenuBar menubar1\"> <li class=\"GtkMenuItem menuitem1\"> <div class=\"GtkMenuItemInner\"> <span><u>F</u>ile</span> </div> <ul class=\"GtkMenu menu1\"> <li class=\"GtkImageMenuItem imagemenuitem_new\"> <div class=\"GtkMenuItemInner\"> <img alt=\"New\" src=\"/img/icons/16x16/actions/gtk-new.png\"/> <span>New</span> </div> </li> <li> <div class=\"GtkSeparatorMenuItem separatormenuitem1\"></div> </li> <li class=\"GtkImageMenuItem imagemenuitem_quit\"> <div class=\"GtkMenuItemInner\"> <img alt=\"Quit\" src=\"/img/icons/16x16/actions/gtk-quit.png\"/> <span>Quit</span> </div> </li> </ul> </li> </ul> </div> <div class=\"GtkBoxPackage Position_1 Expand Fill\"> <div class=\"GtkFixed fixed1\"></div> </div> </div> </div> </div>").html();
        this._title = LABELS.title;
        this._icon = '/VFS/resource/ApplicationTickTackToe/pixmap.png';
        this._is_draggable = true;
        this._is_resizable = false;
        this._is_scrollable = false;
        this._is_sessionable = true;
        this._is_minimizable = true;
        this._is_maximizable = true;
        this._is_closable = true;
        this._is_orphan = false;
        this._skip_taskbar = false;
        this._skip_pager = false;
        this._width = 440;
        this._height = 440;
        this._gravity = null;
      },

      destroy : function() {
        this._super();
      },


      EventMenuNew : function(el, ev) {
        var self = this;

        this.reset_game();
      },


      EventMenuQuit : function(el, ev) {
        var self = this;


        this.$element.find(".ActionClose").click();

      },


      reset_game : function() {
        var self = this;

        this.finished = false;
        this.moves = 0;

        this.board = [
          ["", "", ""],
          ["", "", ""],
          ["", "", ""]
        ];

        var check = function() {
          var ret = "";
          var x, y, sum;

          // Rows
          for ( y = 0; y < 3; y++ ) {
            sum = self.board[y][0] + self.board[y][1] + self.board[y][2];
            if ( sum == "ooo" || sum == "xxx" ) {
              ret = sum;
              break;
            }
          }

          // Columns
          for ( x = 0; x < 3; x++ ) {
            sum = self.board[0][x] + self.board[1][x] + self.board[2][x];
            if ( sum == "ooo" || sum == "xxx" ) {
              ret = sum;
              break;
            }
          }

          // Diagonal
          if ( !ret ) {
            sum = self.board[0][0] + self.board[1][1] + self.board[2][2];
            if ( sum == "ooo" || sum == "xxx" ) {
              ret = sum;
            }
          }
          if ( !ret ) {
            sum = self.board[0][2] + self.board[1][1] + self.board[2][0];
            if ( sum == "ooo" || sum == "xxx" ) {
              ret = sum;
            }
          }

          // Check result
          if ( ret  ) {
            if ( ret === "xxx" ) {
              API.ui.alert("Player 1 (x) won!", "info");
            } else {
              API.ui.alert("Player 2 (o) won!", "info");
            }

            return true;
          }

          if ( self.moves == 9 ) {
            API.ui.alert("Game Over!", "info");
            return true;
          }

          return false;
        };

        // Do your stuff here
        var current = "x";

        var table = $("<table><tr><td></td><td></td><td></td></tr><tr><td></td><td></td><td></td></tr><tr><td></td><td></td><td></td></tr></table>");
        table.addClass("Table");
        table.find("td").each(function(i) {
          var x = (i % 3);
          var y = parseInt(i / 3, 10);

          $(this).click(function() {
            if ( !$(this).attr("class") ) {
              if ( !self.finished ) {
                self.moves++;

                $(this).append(current.toUpperCase()).addClass(current == "x" ? "Player" : "Computer");

                self.board[y][x] = current;
                if ( check() ) {
                  self.finished = true;
                }

                current = current == "x" ? "o" : "x";
              }

            }
          });
        });

        this.$element.find(".fixed1").html(table);
      },


      create : function(id, mcallback) {
        var el = this._super(id, mcallback);
        var self = this;

        if ( el ) {

          el.find(".imagemenuitem_new").click(function(ev) {
            self.EventMenuNew(this, ev);
          });

          el.find(".imagemenuitem_quit").click(function(ev) {
            self.EventMenuQuit(this, ev);
          });

          // Do your stuff here

          this.reset_game();

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
    var __ApplicationTickTackToe = Application.extend({

      init : function() {
        this._super("ApplicationTickTackToe", argv);
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

    return new __ApplicationTickTackToe();
  };
})($);
