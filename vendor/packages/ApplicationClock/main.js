/*!
 * OS.js - JavaScript Operating System - Contains ApplicationClock JavaScript
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
OSjs.Packages.ApplicationClock = (function($, undefined) {
  "$:nomunge";

  var _LINGUAS = {
    'en_US' : {
      "title" : "Clock"
    },
    'nb_NO' : {
      "title" : "Klokke"
    }
  };

  return function(GtkWindow, Application, API, argv, windows) {
    "GtkWindow:nomunge, Application:nomunge, API:nomunge, argv:nomunge, windows:nomunge";

    var LABELS = _LINGUAS[API.system.language()] || _LINGUAS['en_US'];

    var Window_window1 = GtkWindow.extend({

      init : function(app) {
        this._super("Window_window1", false, app, windows);
        this._content = $("<div> <div class=\"GtkWindow window1\"> <div class=\"Clock\"><div class=\"HourShadow\"></div><div class=\"Hour\"></div><div class=\"MinuteShadow\"></div><div class=\"Minute\"></div><div class=\"SecondShadow\"></div><div class=\"Second\"></div></div> </div> </div> ").html();
        this._title = LABELS.title;
        this._icon = 'status/appointment-soon.png';
        this._is_draggable = true;
        this._is_resizable = false;
        this._is_scrollable = false;
        this._is_sessionable = true;
        this._is_minimizable = false;
        this._is_maximizable = false;
        this._is_closable = true;
        this._is_orphan = false;
        this._width = 200;
        this._height = 230;
        this._gravity = 'center';

        this.int_sec = null;
        this.int_min = null;
        this.int_hour = null;
      },

      destroy : function() {
        clearTimeout(this.int_sec);
        clearTimeout(this.int_min);
        clearTimeout(this.int_hour);

        this._super();
      },



      create : function(id, mcallback) {
        var el = this._super(id, mcallback);
        var self = this;

        if ( el ) {
          // Do your stuff here

          var hour = $(el).find(".Hour, .HourShadow");
          var min  = $(el).find(".Minute, .MinuteShadow");
          var sec  = $(el).find(".Second, .SecondShadow");

          this.int_sec = setInterval( function() {
            var d = new Date();
            var seconds = d.getSeconds();
            var sdegree = seconds * 6;
            var srotate = "rotate(" + sdegree + "deg)";

            sec.css("-webkit-transform", srotate );
            sec.css("-moz-transform", srotate );
            if ( $.browser.msie ) {
              sec.css("-o-transform", srotate );
              sec.css("-ms-transform", srotate );
            }

          }, 1000 );

          this.int_hour = setInterval( function() {
            var d = new Date();
            var hours = d.getHours();
            var mins = d.getMinutes();
            var hdegree = hours * 30 + Math.round(mins / 2);
            var hrotate = "rotate(" + hdegree + "deg)";

            hour.css("-webkit-transform", hrotate );
            hour.css("-moz-transform", hrotate );
            if ( $.browser.msie ) {
              hour.css("-o-transform", hrotate );
              hour.css("-ms-transform", hrotate );
            }

          }, 1000 );

          this.int_min = setInterval( function() {
            var d = new Date();
            var mins = d.getMinutes();
            var mdegree = mins * 6;
            var mrotate = "rotate(" + mdegree + "deg)";

            min.css("-webkit-transform", mrotate );
            min.css("-moz-transform", mrotate );
            if ( $.browser.msie ) {
              min.css("-o-transform", mrotate );
              min.css("-ms-transform", mrotate );
            }
          }, 1000 );
        }

      }
    });


    ///////////////////////////////////////////////////////////////////////////
    // APPLICATION
    ///////////////////////////////////////////////////////////////////////////

    var __ApplicationClock = Application.extend({

      init : function() {
        this._super("ApplicationClock", argv);
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

    return new __ApplicationClock();
  };
})($);

