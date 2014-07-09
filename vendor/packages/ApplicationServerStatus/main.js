/*!
 * OS.js - JavaScript Operating System - Contains ApplicationServerStatus JavaScript
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
OSjs.Packages.ApplicationServerStatus = (function($, undefined) {
  "$:nomunge";

  var _LINGUAS = {
    'en_US' : {
      "title" : "Server Status"
    },
    'nb_NO' : {
      "title" : "Server Status"
    }
  };

  function DrawPie(label, free, total) {
    var myColor = ["#54b15d", "#b15454"];
    var myData = [total, free];
    var width = 100;
    var height = 100;

    // Create canvas
    var canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    var ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw chart
    var lastend = 0;
    var myTotal = 0;
    for (var j = 0; j < myData.length; j++) {
      myTotal += (typeof myData[j] == 'number') ? myData[j] : 0;
    }

    for (var i = 0; i < myData.length; i++) {
      ctx.fillStyle = myColor[i];
      ctx.beginPath();
      ctx.moveTo((width / 2), (height / 2));
      ctx.arc((width / 2), (height / 2) , (height / 2),lastend,lastend+
              (Math.PI*2*(myData[i]/myTotal)),false);
      ctx.lineTo((width / 2), (height / 2));
      ctx.fill();
      lastend += Math.PI*2*(myData[i]/myTotal);
    }

    // Draw labels
    var len = (ctx.measureText(label)).width;
    ctx.fillStyle = "#000000";
    //ctx.textAlign = "center";
    //ctx.textBaseline = "bottom"
    ctx.font = "14px Arial";
    ctx.fillText(label, ((width - len)/2), (height / 2));

    return canvas;
  }


  return function(GtkWindow, Application, API, argv, windows) {
    "GtkWindow:nomunge, Application:nomunge, API:nomunge, argv:nomunge, windows:nomunge";

    var LABELS = _LINGUAS[API.system.language()] || _LINGUAS['en_US'];

    var Window_window1 = GtkWindow.extend({

      init : function(app) {
        this._super("Window_window1", false, app, windows);
        this._content = $("<div> <div class=\"GtkWindow window1\"> <div class=\"fixed1\"></div> </div> </div> ").html();
        this._title = LABELS.title;
        this._icon = 'status/network-transmit-receive.png';
        this._is_draggable = true;
        this._is_resizable = true;
        this._is_scrollable = true;
        this._is_sessionable = true;
        this._is_minimizable = true;
        this._is_maximizable = true;
        this._is_closable = true;
        this._is_orphan = true;
        this._width = 800;
        this._height = 500;
        this._gravity = null;
      },

      destroy : function() {
        this._super();
      },

      create : function(id, mcallback) {
        var el = this._super(id, mcallback);
        var self = this;

        if ( el ) {
          // Do your stuff here
          var switcher = "<div class=\"Switch\"><img alt=\"\" src=\"/img/icons/16x16/actions/reload.png\" /></div>";
          var c_events = $("<div class=\"Section Events\"><h1>Events</h1><div class=\"Inner\"></div>" + switcher + "</div>");
          var c_services = $("<div class=\"Section Services\"><h1>Services</h1><div class=\"Inner\"></div>" + switcher + "</div>");
          var c_filesystem = $("<div class=\"Section Filesystem\"><h1>Filesystem</h1><div class=\"Inner\"></div>" + switcher + "</div>");
          var c_system = $("<div class=\"Section System\"><h1>System</h1><div class=\"Inner\"></div>" + switcher + "</div>");

          el.find(".fixed1").append(c_events);
          el.find(".fixed1").append(c_services);
          el.find(".fixed1").append(c_filesystem);
          el.find(".fixed1").append(c_system);

          el.find(".Switch img").click(function() {
            var inr = $(this).parent().parent().find(".Inner");
            console.log(inr, inr.is(":visible"));
            if ( inr.is(":visible") ) {
              inr.slideUp();
            } else {
              inr.slideDown();
            }
          });
        }

      },

      render : function(result) {
        var table, row, col, s, i, tmp;

        var events = $("<div><pre>" + result.events + "</pre></div>");
        var xx = this.$element.find(".Section.Events .Inner");
        xx.html(events);
        setTimeout(function() {
          xx.get(0).scrollTop = xx.get(0).scrollHeight;
        }, 0);

        if ( result.services ) {
          table = $("<table></table>");

          row = $("<tr class=\"head\"></tr>");
          row.append(sprintf("<td>%s</td>", "Service name"));
          row.append(sprintf("<td>%s</td>", "Status"));
          table.append(row);

          i = 0;
          for ( s in result.services ) {
            if ( result.services.hasOwnProperty(s) ) {
              tmp = result.services[s] === true ? "Running" : "Stopped";
              table.append(sprintf("<tr class=\"%s\"><td>%s</td><td class=\"Status\">%s</td></tr>", (i % 2 ? "even" : "odd"), s, tmp));
              i++;
            }
          }

          this.$element.find(".Services .Inner").html(table);
        }

        if ( result.filesystem ) {
          var ccc = $("<div class=\"Images\"></div>");
          table = $("<table></table>");

          row = $("<tr class=\"head\"></tr>");
          row.append(sprintf("<td>%s</td>", "Device"));
          row.append(sprintf("<td>%s</td>", "Filesystem"));
          row.append(sprintf("<td>%s</td>", "Mountpoint"));
          row.append(sprintf("<td>%s</td>", "Total space"));
          row.append(sprintf("<td>%s</td>", "Free space"));
          table.append(row);

          i = 0;

          for ( s in result.filesystem ) {
            if ( result.filesystem.hasOwnProperty(s) ) {
              row = $(sprintf("<tr class=\"%s\"></tr>", (i % 2 ? "even" : "odd")));
              row.append(sprintf("<td>%s</td>", result.filesystem[s].info.device));
              row.append(sprintf("<td>%s</td>", result.filesystem[s].info.filesystem));
              row.append(sprintf("<td>%s</td>", result.filesystem[s].info.mountpoint));
              row.append(sprintf("<td>%s</td>", result.filesystem[s].total_h));
              row.append(sprintf("<td>%s</td>", result.filesystem[s].free_h));
              table.append(row);

              i++;

              cc = $("<div class=\"Image\"></div>");
              cc.append(DrawPie(result.filesystem[s].info.device, result.filesystem[s].total, result.filesystem[s].free));
              ccc.append(cc);
            }
          }

          this.$element.find(".Filesystem .Inner").html(table);
          this.$element.find(".Filesystem .Inner").append(ccc);

        }

        if ( result.system ) {

          i = 0;
          tmp = result.system;
          table = $("<table></table>");

          row = $(sprintf("<tr class=\"hor %s\"></tr>", (i % 2 ? "even" : "odd")));
          row.append(sprintf("<td class=\"first\">%s</td><td class=\"second\">%s</td>", "Load Average", tmp.load.average));
          table.append(row);
          i++;

          row = $(sprintf("<tr class=\"hor %s\"></tr>", (i % 2 ? "even" : "odd")));
          row.append(sprintf("<td class=\"first\">%s</td><td class=\"second\">%s</td>", "Running Processes", tmp.load.running));
          table.append(row);
          i++;

          row = $(sprintf("<tr class=\"hor %s\"></tr>", (i % 2 ? "even" : "odd")));
          row.append(sprintf("<td class=\"first\">%s</td><td class=\"second\">%s</td>", "Total Memory", tmp.memory.MemTotal));
          table.append(row);
          i++;

          row = $(sprintf("<tr class=\"hor %s\"></tr>", (i % 2 ? "even" : "odd")));
          row.append(sprintf("<td class=\"first\">%s</td><td class=\"second\">%s</td>", "Free Memory", tmp.memory.MemFree));
          table.append(row);
          i++;

          row = $(sprintf("<tr class=\"hor %s\"></tr>", (i % 2 ? "even" : "odd")));
          row.append(sprintf("<td class=\"first\">%s</td><td class=\"second\">%s</td>", "Total Swap", tmp.memory.SwapTotal));
          table.append(row);
          i++;

          row = $(sprintf("<tr class=\"hor %s\"></tr>", (i % 2 ? "even" : "odd")));
          row.append(sprintf("<td class=\"first\">%s</td><td class=\"second\">%s</td>", "Free Swap", tmp.memory.SwapFree));
          table.append(row);
          i++;

          this.$element.find(".System .Inner").html(table);
        }
      }
    });


    ///////////////////////////////////////////////////////////////////////////
    // APPLICATION
    ///////////////////////////////////////////////////////////////////////////

    var __ApplicationServerStatus = Application.extend({

      init : function() {
        this._super("ApplicationServerStatus", argv);
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
        this._event("all", {}, function(result, error) {
          if ( !error ) {
            root_window.render(result);
          }
        });
      }
    });

    return new __ApplicationServerStatus();
  };
})($);

