/*!
 * OS.js - JavaScript Operating System - Contains ApplicationMusicPlayer JavaScript
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
OSjs.Packages.ApplicationMusicPlayer = (function($, undefined) {

  var _LINGUAS = {
    'en_US' : {
      "title" : "Music Player"
    },
    'nb_NO' : {
      "title" : "Musikkspiller"
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

    var LABELS = _LINGUAS[API.system.language()] || _LINGUAS['en_US'];
    var MIMES  = ["audio\/*", "audio/x-mpegurl", "audio/mpeg-url", "application/x-winamp-playlist", "audio/scpls, audio/x-scpls"];

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
        this._content = $("<div><div class=\"GtkWindow window1\"> <div class=\"GtkBox box1 GtkBoxVertical\"> <div class=\"GtkBoxPackage Position_0\"> <ul class=\"GtkMenuBar menubar1\"> <li class=\"GtkMenuItem menuitem_file\"> <div class=\"GtkMenuItemInner\"> <span><u>F</u>ile</span> </div> <ul class=\"GtkMenu menu_file\"> <li class=\"GtkImageMenuItem imagemenuitem_new\"> <div class=\"GtkMenuItemInner\"> <img alt=\"New\" src=\"/img/icons/16x16/actions/gtk-new.png\"/> <span>New</span> </div> </li> <li class=\"GtkImageMenuItem imagemenuitem_open\"> <div class=\"GtkMenuItemInner\"> <img alt=\"Open\" src=\"/img/icons/16x16/actions/gtk-open.png\"/> <span>Open</span> </div> </li> <li class=\"GtkImageMenuItem imagemenuitem_save\"> <div class=\"GtkMenuItemInner\"> <img alt=\"Save\" src=\"/img/icons/16x16/actions/gtk-save.png\"/> <span>Save</span> </div> </li> <li class=\"GtkImageMenuItem imagemenuitem_saveas\"> <div class=\"GtkMenuItemInner\"> <img alt=\"Save as...\" src=\"/img/icons/16x16/actions/gtk-save-as.png\"/> <span>Save as...</span> </div> </li> <li> <div class=\"GtkSeparatorMenuItem separatormenuitem1\"></div> </li> <li class=\"GtkImageMenuItem imagemenuitem_quit\"> <div class=\"GtkMenuItemInner\"> <img alt=\"Quit\" src=\"/img/icons/16x16/actions/gtk-quit.png\"/> <span>Quit</span> </div> </li> </ul> </li> </ul> </div> <div class=\"GtkBoxPackage Position_1 Expand Fill\"> <div class=\"GtkBox box2 GtkBoxVertical\"> <div class=\"GtkBoxPackage Position_0\"> <div class=\"GtkBox box4 GtkBoxVertical\" style=\"padding:10px\"> <div class=\"GtkBoxPackage Position_0\"> <div class=\"GtkLabel label1\"> <span>Artist</span> </div> </div> <div class=\"GtkBoxPackage Position_1\"> <div class=\"GtkLabel label2\"> <span>Album</span> </div> </div> <div class=\"GtkBoxPackage Position_2\"> <div class=\"GtkLabel label3\"> <span>Track</span> </div> </div> <div class=\"GtkBoxPackage Position_3\"> <div class=\"GtkLabel label4\"> <span>Length</span> </div> </div> </div> </div> <div class=\"GtkBoxPackage Position_1 Expand Fill\"> <div class=\"GtkIconView iconview1\" style=\"padding:10px\"></div> </div> <div class=\"GtkBoxPackage Position_2\"> <div class=\"GtkAlignment alignment1\" style=\"padding:10px\"> <div class=\"GtkScale scale1\"></div> </div> </div> </div> </div> <div class=\"GtkBoxPackage Position_2\"> <div class=\"GtkButtonBox buttonbox1\" style=\"text-align:center\"> <button class=\"GtkButton button_prev\"> <img alt=\"Prev\" src=\"/img/icons/16x16/actions/media-skip-backward.png\"/> <span>Prev</span> </button> <button class=\"GtkButton button_stop\"> <img alt=\"Stop\" src=\"/img/icons/16x16/actions/media-playback-stop.png\"/> <span>Stop</span> </button> <button class=\"GtkButton button_play\"> <img alt=\"Play\" src=\"/img/icons/16x16/actions/media-playback-start.png\"/> <span>Play</span> </button> <button class=\"GtkButton button_pause\"> <img alt=\"Pause\" src=\"/img/icons/16x16/actions/media-playback-pause.png\"/> <span>Pause</span> </button> <button class=\"GtkButton button_next\"> <img alt=\"Next\" src=\"/img/icons/16x16/actions/media-skip-forward.png\"/> <span>Next</span> </button> </div> </div> </div> </div> </div>").html();
        this._title = LABELS.title;
        this._icon = 'status/audio-volume-high.png';
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
        this._width = 450;
        this._height = 450;
        this._gravity = null;
        this._global_dnd = true;
      },

      destroy : function() {
        this._super();
      },


      EventMenuNew : function(el, ev) {
        var self = this;
        this.app.Stop();
        this.app.ClearPlaylist();
      },


      EventMenuOpen : function(el, ev) {
        var self = this;
        this.app.defaultFileOpen({
          "callback" : function(fname) {
            self.app.Open(fname);
          },
          "mimes"   : MIMES,
          "file"    : self.app._getArgv("path"),
          "options" : {
            "preview" : true
          }
        });
      },


      EventMenuSave : function(el, ev) {
        var self = this;

        if ( this.app.is_playlist ) {
          var path = this.app._getArgv("path");
          if ( path ) {
            var data = this.app.getPlaylistData();

            this.app.defaultFileSave({
              "file"      : path,
              "content"   : data,
              "mimes"     : MIMES,
              "callback"  : function(fname) {
                self.app.is_playlist = true;
              }
            });
          }
        }
      },


      EventMenuSaveAs : function(el, ev) {
        var self = this;
        var data = this.app.getPlaylistData();
        var cur  = this.app._getArgv('path');

        this.app.defaultFileSave({
          "file"      : cur,
          "content"   : data,
          "mimes"     : MIMES,
          "saveas"    : true,
          "callback"  : function(fname, mime) {
            self.app.is_playlist = true;
          }
        });
      },


      EventMenuQuit : function(el, ev) {
        var self = this;
        this.$element.find(".ActionClose").click();
      },


      EventButtonPrev : function(el, ev) {
        var self = this;
        self.app.PlayPrev();
      },


      EventButtonStop : function(el, ev) {
        var self = this;
        self.app.Stop();
      },


      EventButtonPlay : function(el, ev) {
        var self = this;
        self.app.Resume();
      },


      EventButtonPause : function(el, ev) {
        var self = this;
        self.app.Pause();
      },


      EventButtonNext : function(el, ev) {
        var self = this;
        self.app.PlayNext();
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

          el.find(".button_prev").click(function(ev) {
            self.EventButtonPrev(this, ev);
          });

          el.find(".button_stop").click(function(ev) {
            self.EventButtonStop(this, ev);
          });

          el.find(".button_play").click(function(ev) {
            self.EventButtonPlay(this, ev);
          });

          el.find(".button_pause").click(function(ev) {
            self.EventButtonPause(this, ev);
          });

          el.find(".button_next").click(function(ev) {
            self.EventButtonNext(this, ev);
          });

          // Do your stuff here

          this._bind("dnd", function(data) {
            if ( data && data.path && data.mime && checkMIME(data.mime, MIMES) ) {
              //if ( data.path.match(/\.(mp3|ogg|vob|oga|wav|flac)$/i) ) {}
              self.app.Open(data.path);
            }
          });

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
    var __ApplicationMusicPlayer = Application.extend({

      init : function() {
        this._super("ApplicationMusicPlayer", argv);
        this._compability = ["audio"];

        this.player = null;
        this.$slider = null;
        this.playlist = [];
        this.playlist_index = 0;
        this.is_playlist = false;
      },

      destroy : function() {
        this.Stop();

        this.player.destroy();
        this.player = null;

        try {
          this.$slider.remove();
        } catch ( e ) {}

        this.playlist = [];
        this.playlist_index = 0;
        this.is_playlist = false;

        this._super();
      },

      Resume : function() {
        if ( this.player ) {
          this.player.play();
        }
      },

      Pause : function() {
        if ( this.player ) {
          this.player.pause();
        }
      },

      Stop : function() {
        if ( this.player ) {
          this.player.stop();
        }
      },

      ClearPlaylist : function() {
        this.playlist = [];
        this.playlist_index = 0;
        this._root_window.$element.find(".iconview1").html("");
      },

      PlayNext : function() {
        if ( this.playlist_index < this.playlist.length ) {
          this.playlist_index++;
          this._Play(this.playlist[this.playlist_index]);
        }
      },

      PlayPrev : function() {
        if ( this.playlist_index > 1 ) {
          this.playlist_index--;
          this._Play(this.playlist[this.playlist_index]);
        }
      },

      PlayIter : function(i) {
        this.playlist_index = i;
        if ( this.playlist[i] ) {
          this._Play(this.playlist[i]);
        }
      },

      _Play : function(fname) {
        var self = this;
        var el = this._root_window.$element;

        this._event("info", {"path" : fname}, function(result, error) {
          if ( result && !error ) {
            var invalid = true;
            if ( result['MIMEType'] ) {
              var mime = result['MIMEType'];
              if ( mime.match(/^audio\/mpeg/) ) {
                invalid = self._checkCompability("audio_mp3");
              } else if ( mime.match(/^audio\/ogg/) ) {
                invalid = self._checkCompability("audio_ogg");
              }
            }

            if ( !invalid ) {
              el.find(".label1").html(sprintf("<b>Artist:</b> %s", result.Artist || "Unknown"));
              el.find(".label2").html(sprintf("<b>Album:</b> %s (%s)", result.Album || "Unknown", result.Year || "Unknown year"));
              el.find(".label3").html(sprintf("<b>Track:</b> %s", result.Title || "Unknown"));
              el.find(".label4").html(sprintf("<b>Length:</b> %s", result.Length));

              self.player.setSource("/media" + fname);
            }
          }
        });

      },

      Open : function(fname) {
        var self = this;
        if ( !this.player ) {
          return;
        }

        if ( fname ) {
          this._event("info", {"path" : fname}, function(result, error) {
            if ( !error ) {
              var invalid = true;
              var type = "unknown";
              if ( result['MIMEType'] ) {
                var mime = result['MIMEType'];
                if ( mime.match(/^audio\/mpeg/) ) {
                  invalid = self._checkCompability("audio_mp3");
                  type = "mp3";
                } else if ( mime.match(/^audio\/ogg/) ) {
                  invalid = self._checkCompability("audio_ogg");
                  type = "ogg/vorbis";
                } else {
                  if ( in_array(mime, ["audio/x-mpegurl", "audio/mpeg-url", "application/x-winamp-playlist", "audio/scpls, audio/x-scpls"]) ) {
                    type = "playlist";
                    invalid = false;
                  }
                }
              }

              if ( invalid ) {
                API.ui.alert("Cannot play this media type (" + type + ")!"); // FIXME: Locale
              } else {
                if ( type == "playlist" ) {
                  API.system.call("cat", fname, function(res, error) {
                    var data = [];
                    if ( res && !error ) {
                      var tmp = res.split("\n");
                      for ( var i = 0; i < tmp.length; i++ ) {
                        if ( !tmp[i].match(/^\#/) ) {
                          data.push(tmp[i]);
                        }
                      }
                    }

                    self.setPlaylist(data);
                  });

                  self.is_playlist = true;
                } else {
                  self._Play(fname);
                  self.setPlaylist([fname]);
                  self.is_playlist = false;
                }

                self._setArgv("path", fname);
              }

            }
          }, true);
        }
      },

      run : function() {
        var self = this;

        var root_window = new Window_window1(self);
        this._super(root_window);
        root_window.show();

        // Do your stuff here
        this.$slider = root_window.$element.find(".scale1");

        var label       = root_window.$element.find(".label4");
        var src         = (argv && argv.path) ? argv.path : null;
        var manualSeek  = false;
        var loaded      = false;

        this.player = new OSjs.Classes.MusicPlayer(null, "invisible", null, function() {
          var s = this.getTimestamps();
          var c = this.getCurrentTime();
          var d = this.getEndTime();

          if ( s ) {
            label.html(sprintf("<b>Length:</b> %s / %s", s.current, s.total));
          }

          if (!manualSeek) {
            self.$slider.slider("value", c);
          }

          if (!loaded) {
            loaded = true;
            self.$slider.slider({
              value       : 0,
              step        : 0.01,
              orientation : "horizontal",
              range       : "min",
              max         : d,
              animate     : true,
              slide       : function() {
                manualSeek = true;
              },
              stop        : function(e,ui) {
                manualSeek = false;
                self.player.setSeek(ui.value);
              }
            });
          }
        });

        root_window.$element.append(this.player.$element);

        if ( src ) {
          this.Open(src);
        }
      },

      setPlaylist : function(arg) {
        var el = this._root_window.$element.find(".iconview1");
        el.html("");

        this.playlist = arg;
        for ( var i = 0; i < arg.length; i++ ) {
          el.append("<div>" + arg[i] + "</div>");
        }

        if ( arg.length ) {
          this._Play(this.playlist[0]);
        }
      },

      getPlaylistData : function() {
        var data = "# OS.js Playlist\n";
        for ( var i = 0; i < this.playlist.length; i++ ) {
          data += (this.playlist[i] + "\n");
        }
        return data;
      }
    });

    return new __ApplicationMusicPlayer();
  };
})($);
