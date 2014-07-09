/*!
 * OS.js - JavaScript Operating System - Contains PanelItemDock JavaScript
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
 * @package OSjs.Panel
 * @author Anders Evenrud <andersevenrud@gmail.com>
 * @licence Simplified BSD License
 * @class
 */
OSjs.Packages.PanelItemDock = (function($, undefined) {
  "$:nomunge";

  var _LINGUAS = {
    "en_US" : {
      "title" : "Launcher Dock",
      "remove" : "Remove",
      "create" : "Insert item"
    },
    "nb_NO" : {
      "title" : "Launcher Dock",
      "remove" : "Fern",
      "create" : "Legg til"
    }
  };

  return function(PanelItem, panel, API, argv) {
    "PanelItem:nomunge, panel:nomunge, API:nomunge, argv:nomunge";

    var LABELS = _LINGUAS[API.system.language()] || _LINGUAS['en_US'];

    var _PanelItemDock = PanelItem.extend({
      init : function(items) {
        this._super("PanelItemDock");
        this._named = LABELS.title;
        this._dynamic = true;

        this.items = items || [];

        this._configurable = true;
      },

      create : function(pos) {
        var self = this;
        var el = this._super(pos);

        this._create(el, this.items);

        setTimeout(function() {
          self.onRedraw();
        }, 0);

        return el;
      },


      destroy : function() {
        this._super();
      },

      _create : function(el, items, save) {
        el.empty();

        var e, o;
        for ( var i = 0; i < items.length; i++ ) {
          e = items[i];
          o = $("<div class=\"PanelItem PanelItemLauncher\"><span class=\"\"><img alt=\"\" src=\"/img/blank.gif\" title=\"\" width=\"16\" height=\"16\" /></span></div>");
          o.find("span").addClass("launch_" + e.launch);
          o.find("img").attr("src", '/img/icons/16x16/' + e.icon);
          o.find("img").attr("title", e.title).addClass("TT");
          el.append(o);
        }

        $(el).find(".PanelItemLauncher").click(function(ev) {
          var app = $(this).find("span").attr("class").replace("launch_", ""); //.replace("TT", "").replace(" ", "");
          if ( app == "About" ) {
            $("#DialogAbout").show();
            $("#DialogAbout").css({
              "top" : (($(document).height() / 2) - ($("#DialogAbout").height() / 2)) + "px",
              "left" : (($(document).width() / 2) - ($("#DialogAbout").width() / 2)) + "px"
            });
          } else {
            API.system.launch(app);
          }
        });

        if ( save ) {
          (function() {})(); // TODO
          this.items = items;
        }
      },

      configure : function() {
        var self = this;

        var list = $("<ul></ul>");

        var _removeItem = function(el) {
          el.remove();
        };

        var _createItem = function(item) {
          var el = $("<li></li>");
          var edit = $("<div class=\"Edit\"></div>");
          edit.append($("<div class=\"row\"><div class=\"label\">Launch</div><div class=\"value\"><input type=\"text\" value=\"" + item.launch + "\" class=\"InputLaunch\"/></div></div>"));
          edit.append($("<div class=\"row\"><div class=\"label\">Title</div><div class=\"value\"><input type=\"text\" value=\"" + item.title + "\" class=\"InputTitle\" /></div></div>"));
          //edit.append($("<div class=\"row\"><div class=\"label\">Arguments</div><div class=\"value\"><input type=\"text\" value=\"" + self.items[i]['arguments'] + "\" class=\"InputArguments\" /></div></div>"));
          edit.append($("<div class=\"row\"><div class=\"label\">Icon</div><div class=\"value\"><input type=\"text\" value=\"" + item.icon + "\" class=\"InputIcon\" /></div></div>"));
          edit.append($("<div class=\"row buttons\"><button>" + LABELS.remove + "</button></div>"));

          edit.find("button").click(function() {
            _removeItem(el);
          });

          el.append(edit);
          list.append(el);
        };

        var _insertItem = function() {
          _createItem({
            launch : "",
            title  : "",
            icon   : ""
          });
        };

        return this._super(function(diag) {

          var content = $("<div class=\"Wrap\"></div>");
          var i = 0;
          var l = self.items.length;
          for ( i; i < l; i++ ) {
            _createItem(self.items[i]);
          }

          var newButton = $("<button class=\"\">" + LABELS.create + "</button>");
          newButton.click(function() {
            _insertItem();
          });

          content.append(list);

          diag.$element.find(".DialogContent").addClass("PanelItemDock").html(content);
          diag.$element.find(".DialogButtons .Close").after(newButton);
        }, function(diag) {
          var els = diag.$element.find(".DialogContent .Wrap .Edit");
          var cfg = [];

          for ( var i = 0; i < els.length; i++ ) {
            var el = $(els.get(i));
            var iter = {
              "launch" : el.find(".InputLaunch").val(),
              "title"  : el.find(".InputTitle").val(),
              "icon"   : el.find(".InputIcon").val()
            };

            if ( iter.launch && iter.title && iter.icon ) {
              cfg.push(iter);
            }
          }

          self._create(self.$element, cfg, true);
        });
      },

      getSession : function() {
        var sess = this._super();
        sess.opts = [this.items];
        return sess;
      }
    });

    return construct(_PanelItemDock, argv);
  };
})($);
