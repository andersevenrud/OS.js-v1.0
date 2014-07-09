/*!
 * OS.js - JavaScript Operating System - Contains ApplicationTerminal JavaScript
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
OSjs.Packages.ApplicationTerminal = (function($, undefined) {

  var _LINGUAS = {
    'en_US' : {
      "title" : "Terminal"
    },
    'nb_NO' : {
      "title" : "Terminal"
    }
  };

  var KEY_TAB         = 9;
  var KEY_ENTER       = 13;
  var KEY_BACKSPACE   = 8;
  var KEY_UP          = 38;
  var KEY_LEFT        = 37;
  var KEY_RIGHT       = 39;
  var KEY_DOWN        = 40;
  var KEY_SPACE       = 32;
  var KEY_SHIFT       = 16;
  var KEY_CTRL        = 17;
  var KEY_ALT         = 18;
  var KEY_ESC         = 27;

  /**
   * Get default help
   * @return String
   */
  function getHelp() {
    var help = "\n";
    help += "Basic commands:\n";
    help += "version      Print OS.js version\n";
    help += "clear        Clear text\n";
    help += "date         Print date / time\n";
    help += "echo         Print something\n";
    help += "cd           Change directory\n";
    help += "cp           Copy a file\n";
    help += "mv           Move a file\n";
    help += "rm           Remove a file/directory\n";
    help += "mkdir        Create a directory\n";
    help += "ls           List directory files\n";
    help += "touch        Create an empty file...\n";
    help += "cat          Output file contents\n";
    help += "file         File information\n";
    help += "exec         Execute file\n";
    help += "archive      Archive operations\n";
    help += "ps           List running processes\n";
    help += "kill         Kill a process by ID\n";
    help += "\nAdministration commands:\n";
    help += "pkg          Package Manager\n";
    help += "setting      Settings Manager\n";
    help += "user         User Manager\n";
    help += "dump         Backend dump operation\n";

    return help;
  }

  /**
   * Build a path string
   * @return String
   */
  function buildPath(args, cwd) {
    var path = false;
    if ( args ) {
      path = cwd;
      if ( args.match(/^\.\./) ) {
        var tmp = path.split(/\//);
        tmp.pop();
        path = tmp.join("/") || "/";
      } else {
        if ( args.match(/^\//) ) {
          path = args;
        } else if ( args.match(/^~\//) ) {
          path = "/User/" + args.replace(/^~\//, "");
        } else {
          if ( !path.match(/\/$/) ) {
            path += "/";
          }
          path += args;
        }

        path = path.replace(/\.*\//g, "/").replace(/\/\.*/g, "/").replace(/\/+/g, "/").replace(/~/g, "").replace(/\/$/, "") || "/";
      }

    }
    return path;
  }

  /**
   * Parse Command line
   * @return Array
   */
  function parseCmd(input) {
    var tmp   = input.split(" ");
    var cmd   = tmp.shift();
    var arg   = tmp.join(" ");

    var rest  = [];
    var cargs = {};
    var wait_param = null;

    // Remove quotes from string
    var remove_quotes = function(str) {
      var trim = str;
      var firstQuoteindex = trim.indexOf('"');
      var lastQuoteindex = trim.lastIndexOf('"');
      while (firstQuoteindex != lastQuoteindex)
      {
          trim = trim.Remove(firstQuoteindex, 1);
          trim = trim.Remove(lastQuoteindex - 1, 1); //-1 because we've shifted the indicies left by one
          firstQuoteindex = trim.indexOf('"');
          lastQuoteindex = trim.lastIndexOf('"');
      }

      return trim;
    };

    // Add a single value to argument list by key
    var add_single = function(key, val) {
      if ( !cargs[key] ) {
        cargs[key] = [];
      }
      cargs[key].push(val);
    };

    // Add a list of values to argument by key
    var add_list = function(key, vals) {
      for ( var i in vals ) {
        if ( vals.hasOwnProperty(i) ) {
          add_single(key, vals[i]);
        }
      }
    };

    // Check the waiting flag and add
    var add_wait_flag = function() {
      if ( wait_param === null )
        return;

      add_single(wait_param, "true");
      wait_param = null;
    };

    // Check the given argument for value and add
    var add_wait_args = function(val) {
      if ( wait_param === null ) {
        rest.push(val);
        return;
      }

      val = remove_quotes(val);

      add_single(wait_param, val);
      wait_param = null;
    };

    // Parse the string
    var re = /^\-{1,2}|=|:/i;
    var spl = arg.split(" ");
    var parts;

    for ( var i = 0; i < spl.length; i++ ) {
      parts = spl[i].split(re, 3);
      if ( parts.length == 1 ) {
        add_wait_args(parts[0]);
      } else if ( parts.length == 2 ) {
        add_wait_flag();
        wait_param = parts[1];
      } else if ( parts.length == 3 ) {
        add_wait_flag();
        var uq = remove_quotes(parts[2]);
        add_list(parts[1], uq.split(","));
      }
    }

    add_wait_flag();

    return [cmd, cargs, rest.join(" "), arg];
  }

  return function(GtkWindow, Application, API, argv, windows) {

    var LABELS = _LINGUAS[API.system.language()] || _LINGUAS['en_US'];

    ///////////////////////////////////////////////////////////////////////////
    // TERMINAL EMULATION
    ///////////////////////////////////////////////////////////////////////////

    /**
     * Terminal -- Terminal Emulation Class
     * @class
     */
    var Terminal = Class.extend({

      _element      : null,         //!< DOM Element to use (textarea)
      _cursorPos    : 0,            //!< Current cursor position
      _inputBuffer  : "",           //!< Current input buffer
      _inputHistory : [],           //!< Buffer history
      _inputTemp    : "",           //!< Temporary buffer
      _historyIndex : -1,           //!< Current history buffer index
      _cwd          : "/",          //!< Current Working Directory
      _callback     : null,         //!< Callback function for cmdline handling
      _lock         : false,        //!< Buffer lock

      /**
       * Terminal::init() -- Constructor
       * @constructor
       */
      init : function(el, callback) {
        this._element       = el;
        this._cursorPos     = 0;
        this._inputBuffer   = "";
        this._inputTemp     = "";
        this._historyIndex  = -1;
        this._inputHistory  = [];
        this._cwd           = "/";
        this._callback      = callback || function() {};
        this._lock          = false;

        //el.attr("contentEditable",  "true");
        //el.attr("designMode",       "On");

        var self = this;
        el.keypress(function(ev) {
          self._keypress(ev);
        });
        el.keydown(function(ev) {
          self._keydown(ev);
        });
        el.focus(function() {
          self.setCursor();
        });
        el.click(function() {
          self.setCursor();
        });
        el.bind("contextmenu", function(ev) {
          ev.preventDefault();
          ev.stopPropagation();
          return false;
        });

        //document.execCommand("bold", false, "true");
        this.appendText("=== OS.js Shell v0.5 ===\n");
        //document.execCommand("bold", false, "false");
        this.printPrompt();
      },

      /**
       * Terminal::destroy() -- Destructor
       * @destructor
       */
      destroy : function() {
        this._element       = null;
        this._cursorPos     = 0;
        this._inputBuffer   = "";
        this._inputTemp     = "";
        this._inputHistory  = [];
        this._historyIndex  = -1;
        this._cwd           = "/";
        this._callback      = null;
        this._lock          = false;
      },

      /**
       * Terminal::handleInput() -- Handle data from readBuffer()
       * @param  String     cmdline     The command line
       * @param  Function   fcallback   The callback when done
       * @return void
       */
      handleInput : function(cmdline, fcallback) {
        var self = this;
        this._callback(cmdline, function(out, func) {
          if ( out === null && func ) {
            if ( func == "clear" ) {
              self.clearText();
            }
            fcallback(true);
          } else {
            if ( out ) {
              self.printOutput(out);
            }
            fcallback();
          }
        }, this);
      },

      /**
       * Terminal::readBuffer() -- Read the buffer data and handle
       * @return void
       */
      readBuffer : function() {
        this._locked = true;

        if ( this._cursorPos && this._inputBuffer ) {
          var self  = this;
          var b     = this._inputBuffer;
          this.handleInput(b, function(no_prompt) {
            if ( !no_prompt ) {
              self.printPrompt();
            }
          });

          this._inputHistory.unshift(b);
        } else {
          this.printPrompt();
        }
      },

      /**
       * Terminal::printOutput() -- Print the command output
       * @param  String     str   The text to output
       * @return void
       */
      printOutput : function(str) {
        this.appendText("\n" + str);
        this.setCursor();
      },

      /**
       * Terminal::printPrompt() -- Print the command prompt
       * Used after handling a cmdline
       * @return void
       */
      printPrompt : function() {
        this._cursorPos     = 0;
        this._inputBuffer   = "";
        this._inputTemp     = "";
        this._historyIndex  = -1;
        this._locked        = false;

        this.appendText("\n" + this._cwd + " > ");
      },

      /**
       * Terminal::appendText() -- Append text to the view
       * @param  String       txt     The text to append
       * @return void
       */
      appendText : function(txt) {
        var term = this._element;
        term.val(term.val() + txt);
        term.get(0).scrollTop = term.get(0).scrollHeight;
      },

      /**
       * Terminal::removeText() -- Remove text from buffer/view
       * @param  int      len       Length of string
       * @return void
       */
      removeText : function(len) {
        var term = this._element;
        var val  = term.val();

        val = val.substr(0, val.length - len);
        term.val(val);
      },

      /**
       * Terminal::clearText() -- Clear all text
       * @return void
       */
      clearText : function() {
        var term = this._element;
        term.val("");

        this.appendText("");
        this.printPrompt();
        this.setCursor();
      },

      /**
       * Terminal::setCursor() -- Set the cursor position
       * @return void
       */
      setCursor : function() {
        var term = this._element;
        var pos = term.val().length;
        var el = term.get(0);
        if ( el.setSelectionRange ) {
          el.setSelectionRange(pos, pos);
        } else if ( el.createTextRange ) {
          var r = el.createTextRange();
          r.collapse(true);
          r.moveEnd('character', pos);
          r.moveStart('character', pos);
          r.select();
        }
      },

      /**
       * Terminal::triggerAutocomplete() -- Trigger autocompletion of buffer
       * @return void
       */
      triggerAutocomplete : function() {
        var self = this;

        var o = this._inputBuffer.replace(/^\s+/, "").replace(/\s+$/, "");
        var b = o;
        var l = this._cursorPos;
        var c = this._cwd;
        var s = b.split(" ");
        s.shift();

        if ( s.length ) {
          s = s.pop(); //s.join(" ");
          console.log("checking for", s);

          API.system.call("readdir", {'path' : c}, function(result, error) {
            var found;
            if ( result && !error ) {
              var r, c;
              for ( r in result ) {
                if ( result.hasOwnProperty(r) ) {
                  c = r.substr(0, s.length);
                  if ( c == s ) {
                    found = r;
                    break;
                  }
                }
              }
            }

            if ( found ) {
              self._inputBuffer = o.substr(0, (o.length - s.length)) + found;
              self._cursorPos   = self._inputBuffer.length;
              self.removeText(s.length);
              self.appendText(found);
              self.setCursor();
            }
          }, false);
        }

      },

      /**
       * Terminal::triggerHistory() -- Trigger history cmds event
       * @param  Mixed      dir       true = increment, false = decrement, undefined = reset
       * @return void
       */
      triggerHistory : function(dir) {
        if ( dir === undefined ) {
          this._cursorPos     = 0;
          this._inputTemp     = "";
          this._historyIndex  = -1;
          return;
        }

        // Store current
        if ( this._inputHistory[this._historyIndex] ) {
          this._inputTemp = this._inputHistory[this._historyIndex];
        }

        // Set position
        if ( dir ) {
          this._historyIndex++;
        } else {
          this._historyIndex--;
        }

        // Remove old insertion
        if ( this._cursorPos ) {
          this.removeText(this._cursorPos);
        }

        if ( this._inputTemp ) {
          this._cursorPos = this._inputTemp.length;
        }

        // Set new current
        var cur = "";
        if ( this._inputHistory[this._historyIndex] ) {
          cur = this._inputHistory[this._historyIndex];
        }

        if ( cur ) {
          this.appendText(cur);
        }

        this._cursorPos = cur.length;
        this._inputBuffer = cur || "";
        this.setCursor();
      },

      /**
       * Terminal::_keydown() -- Key Down DOM Event
       * @param  DOMEvent     ev        Event
       * @return bool
       */
      _keydown : function(ev) {
        if ( this._locked ) {
          ev.preventDefault();
          ev.stopPropagation();
          return false;
        }

        var key     = parseInt((ev.keyCode || ev.which), 10);
        var result  = true;
        var self    = this;

        switch ( key ) {
          case KEY_BACKSPACE :
            if ( !this._cursorPos ) { // Stop if we have zero input
              result = false;
            } else {
              this._inputBuffer = this._inputBuffer.substr(0, this._inputBuffer.length - 1);
              this._cursorPos--;
            }
          break;

          case KEY_ENTER :
            this.readBuffer();
            result = false;
          break;

          case KEY_UP :
            result = false;
            if ( this._historyIndex < (this._inputHistory.length - 1) ) {
              this.triggerHistory(true);
            }
          break;

          case KEY_DOWN :
            result = false;
            if ( this._historyIndex >= 0 ) {
              this.triggerHistory(false);
            } else {
              this.triggerHistory();
            }
          break;

          case KEY_LEFT  :
          case KEY_RIGHT :
            result = false;
          break;

          case KEY_SHIFT :
          case KEY_CTRL  :
          case KEY_ALT   :
          case KEY_ESC   :
            result = false;
          break;

          case KEY_TAB   :
            result = false;
            if ( this._cursorPos ) {
              this.triggerAutocomplete();
            }
          break;

          default :
            this._cursorPos++;
            this._inputBuffer += "";
          break;
        }

        if ( !result ) {
          ev.preventDefault();
          ev.stopPropagation();
        }

        return result;
      },

      /**
       * Terminal::_keypress() -- Key Press DOM Event
       * @param  DOMEvent     ev        Event
       * @return bool
       */
      _keypress : function(ev) {
        if ( this._locked ) {
          ev.preventDefault();
          ev.stopPropagation();
          return false;
        }

        var key = parseInt((ev.keyCode || ev.which), 10);
        var result = true;
        switch ( key ) {
          case KEY_SPACE :
            this._inputBuffer += " ";
          break;
          default :
            var ascii = (String.fromCharCode(key)).replace(/\s/, "");
            if ( ascii ) {
              this._inputBuffer += ascii;
            }
          break;
        }

        if ( !result ) {
          ev.preventDefault();
          ev.stopPropagation();
        }

        return result;
      }

    });

    ///////////////////////////////////////////////////////////////////////////
    // WINDOWS
    ///////////////////////////////////////////////////////////////////////////

    var Window_window1 = GtkWindow.extend({

      init : function(app) {
        this._super("Window_window1", false, app, windows);
        this._content = $("<div> <div class=\"GtkWindow window1\"> <textarea class=\"GtkTextView GtkObject textview1\"></textarea> </div> </div> ").html();
        this._title = LABELS.title;
        this._icon = 'apps/utilities-terminal.png';
        this._is_draggable = true;
        this._is_resizable = true;
        this._is_scrollable = false;
        this._is_sessionable = true;
        this._is_minimizable = true;
        this._is_maximizable = true;
        this._is_closable = true;
        this._is_orphan = false;
        this._width = 800;
        this._height = 340;
        this._gravity = null;
        this._lock_size = true;

        this.terminal = null;
      },

      destroy : function() {
        this._super();

        if ( this.terminal ) {
          this.terminal.destroy();
          this.terminal = null;
        }
      },

      create : function(id, mcallback) {
        var el = this._super(id, mcallback);
        var self = this;

        if ( el ) {
          // Do your stuff here
          el.find(".GtkWindow").append($(sprintf("<img src=\"%s\" alt=\"\" class=\"XHR\" />", '/VFS/resource/ApplicationTerminal/xhr.gif')));
        }

      },

      run : function(callback) {
        var term = new Terminal(this.$element.find("textarea"), callback);

        this._bind("focus", function() {
          term._element.focus();
        });
        this._bind("blur", function() {
          term._element.blur();
        });

        try {
          term.attr("spellcheck", "false");
        } catch ( eee ) {}

        this.terminal = term;
      }
    });


    ///////////////////////////////////////////////////////////////////////////
    // APPLICATION
    ///////////////////////////////////////////////////////////////////////////

    var __ApplicationTerminal = Application.extend({

      init : function() {
        this._super("ApplicationTerminal", argv);
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
        root_window.run(function(cmdline, outf, term) {
          self.exec(parseCmd(cmdline), outf, term);
        });
      },

      exec : function(input, outf, term) {
        var cmd  = input[0];
        var args = input[1];
        var path = buildPath(input[2], term._cwd);

        var noout = false;
        var out = null;
        var i, tmp, ps, pid;

        var loader = this._root_window.$element.find(".XHR");

        console.log("exec", cmd, args, path);

        switch ( cmd ) {
          case "help" :
            outf(getHelp());
          break;

          case "clear" :
            outf(null, "clear");
          break;

          case "dump" :
            loader.show();

            this._event("dump", {"arg" : input[2]}, function(result, error) {
              if ( result && !error ) {
                outf(result);
              } else {
                outf(sprintf("%s: %s", cmd, error || "Failed to request operation!"));
              }

              setTimeout(function() {
                loader.hide();
              }, 100);
            });
          break;

          case "version" :
            loader.show();
            this._event("version", {}, function(result, error) {
              if ( result && !error ) {
                var msg = sprintf("OS.js - Version %s (%s)\n", result.version, result.codename);
                msg += sprintf("Copyright %s\n", result.copyright);
                outf(msg);
              } else {
                outf(sprintf("%s: %s", cmd, "Failed to get version information!"));
              }

              setTimeout(function() {
                loader.hide();
              }, 100);
            });
          break;

          case "date" :
            outf((new Date()).toUTCString() + "\n");
          break;

          case "cd" :
            loader.show();
            API.system.call("exists", path, function(result, error) {
              if ( result && !error ) {
                term._cwd = path;
                outf(sprintf("%s: %s", cmd, path));
              } else {
                outf(sprintf("%s: %s", cmd, "No such file or directory"));
              }

              setTimeout(function() {
                loader.hide();
              }, 100);
            }, false);
          break;

          case "ls" :
            loader.show();

            path = path || term._cwd;

            var ignore = null;
            API.system.call("readdir", {'path' : path}, function(result, error) {
              if ( result ) {
                var out = sprintf("ls: %s\n", path);
                var i, iter;
                var items = 0;
                var size = 0;

                // List view
                if ( args.l ) {
                  out += sprintf("%s %s %s\n", str_pad("[size]", 12, " ", "STR_PAD_RIGHT"), str_pad("[filename]", 48, " ", "STR_PAD_RIGHT"), "[mime]");
                  for ( i in result ) {
                    if ( result.hasOwnProperty(i) ) {
                      iter = result[i];
                      if ( !iter.mime ) {
                        out += sprintf("%s %s %s\n", str_pad(iter.size, 12, " ", "STR_PAD_RIGHT"), str_pad("<"+i+">", 48, " ", "STR_PAD_RIGHT"), iter.mime || "<dir>");
                      } else {
                        out += sprintf("%s %s %s\n", str_pad(iter.size, 12, " ", "STR_PAD_RIGHT"), str_pad(i, 48, " ", "STR_PAD_RIGHT"), iter.mime || "<dir>");
                      }
                      items++;
                      size += iter.size;
                    }
                  }
                }

                // Normal view
                else {
                  var tc = 0;
                  for ( i in result ) {
                    if ( result.hasOwnProperty(i) ) {
                      iter = result[i];
                      if ( !iter.mime ) {
                        i = sprintf("<%s>", i);
                      }

                      i = str_pad(i, 20, " ", "STR_PAD_RIGHT");

                      out += i;

                      items++;
                      size += iter.size;
                      tc++;

                      if ( tc > 4 ) {
                        tc = 0;
                        out += "\n";
                      }
                    }
                  }
                  out += "\n";
                }

                out += sprintf("\n%d item(s) %d byte(s)\n", items, size);
                outf(out);
              } else {
                outf(sprintf("%s: %s", cmd, error));
              }

              setTimeout(function() {
                loader.hide();
              }, 100);
            }, false);
          break;

          case "cat" :
            loader.show();

            API.system.call("cat", path, function(result, error) {
              if ( !error ) {
                outf(result + "\n");
              } else {
                outf(sprintf("%s: %s", cmd, "invalid file"));
              }

              setTimeout(function() {
                loader.hide();
              }, 100);
            }, false);
          break;

          case "touch" :
            loader.show();

            API.system.call("touch", path, function(result, error) {
              if ( !error ) {
                outf("");
              } else {
                outf(sprintf("%s: %s", cmd, "invalid file"));
              }

              setTimeout(function() {
                loader.hide();
              }, 100);
            }, false);
          break;

          case "file" :
            loader.show();

            API.system.call("fileinfo", path, function(result, error) {
              if ( !error ) {
                var out = "File Information: \n";
                for ( var i in result ) {
                  if ( result.hasOwnProperty(i) ) {
                    if ( i == "info" && result[i] ) {
                      out += sprintf("%s: %s\n", i, "Media File information:");
                      for ( var x in result[i] ) {
                        if ( result[i].hasOwnProperty(x) ) {
                          out += sprintf("      %s: %s\n", x, result[i][x]);
                        }
                      }
                    } else {
                      out += sprintf("%s: %s\n", i, result[i]);
                    }
                  }
                }
                outf(out + "\n");
              } else {
                outf(sprintf("%s: %s", cmd, "invalid file"));
              }

              setTimeout(function() {
                loader.hide();
              }, 100);
            }, false);
          break;

          case "exec" :
            tmp = input[2].split(" ");
            var l = tmp.shift();

            if ( l ) {
              if ( l.match(/^Application|System|Service|BackgroundService/) ) {
                outf(sprintf("Launching: %s\n", l, tmp.join(" ")));
                API.system.launch(l, tmp.join(" "));
              } else {
                path = buildPath(l, term._cwd);

                loader.show();

                API.system.call("fileinfo", path, function(result, error) {
                  var derror = false;
                  if ( result && !error ) {
                    if ( result["mime"] ) {
                      outf(sprintf("Opening: %s (%s)\n", path, result["mime"]));

                      API.system.run(path, result["mime"]);
                    } else {
                      derror = sprintf("Cannot launch '%s' - Unknown MIME type!", basename(path));
                    }
                  } else {
                    derror = error;
                  }

                  if ( derror ) {
                    outf(sprintf("%s: %s\n", cmd, derror));
                  }

                  setTimeout(function() {
                    loader.hide();
                  }, 100);
                }, false);

              }
            } else {
              outf("Usage: <application-name> [,<arguments, ...>] or <filename>\n");
            }
          break;

          case "mkdir" :
            if ( path ) {
              loader.show();
              API.system.call("mkdir", path, function(result, error) {
                if ( result && !error ) {
                  outf("");
                } else {
                  outf(sprintf("Failed to reate directory '%s': %s\n", basename(path), "permission denied!"));
                }

                setTimeout(function() {
                  loader.hide();
                }, 100);
              }, false);
            } else {
              outf(sprintf("Usage: %s\n", "<file>"));
            }
          break;

          case "rm" :
            if ( path ) {
              loader.show();
              API.system.call("rm", path, function(result, error) {
                if ( result && !error ) {
                  outf("");
                } else {
                  outf(sprintf("Failed to delete '%s': %s\n", basename(path), "file not found or permission denied!"));
                }

                setTimeout(function() {
                  loader.hide();
                }, 100);
              }, false);
            } else {
              outf(sprintf("Usage: %s\n", "<file>"));
            }
          break;

          case "cp" :
          case "mv" :
            if ( input.length > 3 ) {
              tmp = input[2].split(" ");
              var dest  = buildPath(tmp.pop(), term._cwd);
              var src   = buildPath(tmp.pop(), term._cwd);
              var cargs = {"source" : src, "destination" : dest};
              if ( cmd == "mv" ) {
                cargs = {"path" : src, "file" : dest};
              }

              loader.show();
              API.system.call(cmd, cargs, function(result, error) {
                if ( result && !error ) {
                  outf(sprintf(""));
                } else {
                  outf(sprintf("Failed to %s '%s': %s\n", (cmd == "cp" ? "copy" : "move"), basename(src), "file not found or permission denied!"));
                }

                setTimeout(function() {
                  loader.hide();
                }, 100);
              }, false);
            } else {
              outf(sprintf("Usage: %s\n", "cp <src> <dest>"));
            }
          break;

          case "pkg" :
            var pkgs = API.user.settings.packages(false, true, true, true);

            if ( args.list ) {
              out = "Installed packages:\n";
              for ( i = 0; i < pkgs.length; i++ ) {
                out += pkgs[i].name + (pkgs[i].locked ? "" : " <user installed>") + "\n";
              }
            } else if ( args.install ) {
              loader.show();

              noout = true;
              path = buildPath(args.install.shift(), term._cwd);
              API.user.settings.package_install(path, function(res, error) {
                if ( res ) {
                  outf(sprintf("Package %s installed.\n", basename(path)));
                } else {
                  outf(sprintf("Failed to install Package %s!\n\n%s\n", basename(path), error));
                }

                setTimeout(function() {
                  loader.hide();
                }, 100);
              }, true);
            } else if ( args.uninstall ) {
              var pp = null;
              for ( i = 0; i < pkgs.length; i++ ) {
                if ( pkgs[i].name == args.uninstall ) {
                  pp = pkgs[i];
                  break;
                }
              }

              if ( pp ) {
                loader.show();

                noout = true;
                API.user.settings.package_uninstall(pp, function(res, error) {
                  if ( res ) {
                    outf(sprintf("Package %s uninstalled.\n", args.uninstall));
                  } else {
                    outf(sprintf("Failed to uninstall Package %s!\n\n%s\n", args.uninstall, error));
                  }

                  setTimeout(function() {
                    loader.hide();
                  }, 100);
                }, true);
              } else {
                out = sprintf("Package '%s' not found!\n", args.uninstall);
              }
            } else if ( args.info ) {
              out = "";
              for ( i = 0; i < pkgs.length; i++ ) {
                if ( pkgs[i].name == args.info ) {
                  out += sprintf("Package: %s\n", pkgs[i].name);
                  out += sprintf("---------------------------------------------\n");
                  out += sprintf("Type:           %s\n", pkgs[i].type);
                  out += sprintf("Category:       %s\n", pkgs[i].category);
                  out += sprintf("Name:           %s\n", pkgs[i].label);
                  out += "\n";
                }
              }
              if ( !out ) {
                out = sprintf("Package '%s' not found!\n", args.info);
              }
            }

            if ( !noout ) {
              if ( out === null ) {
                out = "Usage:\n";
                out += "--list       List packages\n";
                out += "--install    Install a package by archive\n";
                out += "--uninstall  Uninstall a package by name\n";
                out += "--info       Show package information\n";
                out += "\n";
              }
              outf(out);
            }
          break;

          case "setting" :
            if ( args.list ) {
              var sval, stype;

              out = "Registry keys:\n";
              tmp = sortObject(API.user.settings.values());
              for ( ls in tmp ) {
                if ( tmp.hasOwnProperty(ls) ) {
                  sval  = tmp[ls];
                  stype = API.user.settings.type(ls);
                  if ( stype == "bool" || stype == "boolean" ) {
                    sval = sval ? "true" : "false";
                  } else if ( stype == "list" ) {
                    try {
                      sval = JSON.stringify(sval);
                    } catch ( eee ) {
                      sval = "{}";
                    }
                  }

                  out += sprintf("%s: %s\n", ls, sval);
                }
              }
            } else if ( args.set ) {
              if ( API.user.settings.type(args.set) == "list" ) {
                out += "Cannot set this type :/\n";
              } else {
                var apply = {};
                if ( API.user.settings.type(args.set).match(/^bool/) ) {
                  input[2] = input[2] == "true";
                } else if ( API.user.settings.type(args.set).match(/^int/) ) {
                  input[2] = parseInt(input[2], 10);
                }

                apply[args.set] = input[2];
                var result = API.user.settings.save(apply);
                out = sprintf("Setting: %s to '%s'\n", args.set, input[2]);
                out += sprintf("Result: %s\n", result ? "true" : "false");
              }
            } else if ( args.get ) {
              out = sprintf("%s: %s\n", args.get, API.user.settings.get(args.get));
            }

            if ( out === null ) {
              out = "Usage:\n";
              out += "--list        List settings\n";
              out += "--set         Set a registry key value\n";
              out += "--get         Get a registry valye\n";
              out += "\n";
            }
            outf(out);
          break;

          case "user" :
            noout = false;
            if ( args.list ) {
              noout = true;
              loader.show();

              API.user.settings.user_admin({"method" : "list"}, function(res, data) {
                if ( res ) {
                  var users = "";
                  for ( var u = 0; u < data.length; u++ ) {
                    for ( var y in data[u] ) {
                      if ( data[u].hasOwnProperty(y) ) {
                        var d = data[u][y];
                        var val = d;
                        if ( y == "Groups" ) {
                          val = "";
                          for ( var g in d ) {
                            if ( d.hasOwnProperty(g) ) {
                              val += sprintf("%s/%s ", ""+g, d[g]);
                            }
                          }
                        }
                        users += sprintf("%s: %s\n", y, val);
                      }
                    }
                    users += "\n";
                  }

                  outf(sprintf("Registered Users:\n%s", users));
                } else {
                  outf(sprintf("Failed to list users: %s\n", data));
                }

                setTimeout(function() {
                  loader.hide();
                }, 100);
              }, true);
            } else if ( args.info ) {
              noout = true;
              loader.show();

              API.user.settings.user_admin({"method" : "info"}, function(res, data) {
                if ( res ) {
                  var user = "";
                  for ( var y in data ) {
                    if ( data.hasOwnProperty(y) ) {
                      var d = data[y];
                      var val = d;
                      if ( y == "Groups" ) {
                        val = "";
                        for ( var g in d ) {
                          if ( d.hasOwnProperty(g) ) {
                            val += sprintf("%s/%s ", ""+g, d[g]);
                          }
                        }
                      }

                      user += sprintf("%s: %s\n", y, val);
                    }
                  }

                  outf(user + "\n");
                } else {
                  outf(sprintf("Failed to fetch user information: %s\n", data));
                }

                setTimeout(function() {
                  loader.hide();
                }, 100);
              }, true);
            }

            if ( !noout ) {
              if ( out === null ) {
                out = "Usage:\n";
                out += "--info        User information (default: logged in user)\n";
                out += "--list        List settings\n";
                out += "--add         Add a new user\n";
                out += "--remove      Remove existing user - by ID\n";
                out += "--modify      Modfiy existing user - by ID\n";
                out += "--rreset      Reset user registry - by ID\n";
                out += "--sreset      Reset user session - by ID\n";
                out += "\n";
                out += "Parameters for add/modify:\n";
                out += "--username, --name, --password, --groups";
                out += "\n";
              }
              outf(out);
            }
          break;

          case "archive" :
            var arch, files;
            if ( (args['list'] !== undefined) && (args['list'].length) ) {
              loader.show();
              arch = buildPath(args['list'][0], term._cwd);

              API.system.call("ls_archive", arch, function(result, error) {
                if ( result && !error ) {
                  out = "";
                  for ( i in result ) {
                    if ( result.hasOwnProperty(i) ) {
                      out += sprintf("%s (%sb)\n", i, result[i].size || 0);
                    }
                  }
                  outf(out);
                } else {
                  outf(sprintf("%s: %s", cmd, error || "Failed to request operation!"));
                }

                setTimeout(function() {
                  loader.hide();
                }, 100);
              }, false);
            } else if ( (args['create'] !== undefined) && (args['create'].length) ) {
              loader.show();
              files = input[2].split(" ");
              arch  = buildPath(args['create'][0], term._cwd);

              API.system.call("create_archive", {"archive" : arch, "files" : files}, function(result, error) {
                if ( result && !error ) {
                  outf(result);
                } else {
                  outf(sprintf("%s: %s", cmd, error || "Failed to request operation!"));
                }

                setTimeout(function() {
                  loader.hide();
                }, 100);
              }, false);
            } else if ( (args['extract'] !== undefined) && (args['extract'].length) ) {
              loader.show();
              arch  = buildPath(args['extract'][0], term._cwd);

              API.system.call("extract_archive", {"archive" : arch, "destination" : path}, function(result, error) {
                if ( result && !error ) {
                  outf(result);
                } else {
                  outf(sprintf("%s: %s", cmd, error || "Failed to request operation!"));
                }

                setTimeout(function() {
                  loader.hide();
                }, 100);
              }, false);
            } else {
              out = "Usage:\n";
              out += "--list        List archive contents\n";
              out += "              <archive>\n";
              out += "--create      Create archive (format detected by extension)\n";
              out += "              <file>, <file>, ..., <archive>\n";
              out += "--extract     Extract archive to given path\n";
              out += "              <archive> <path>\n";
              out += "\n";
              outf(out);
            }
          break;

          case "ps" :
            ps = API.session.processes();
            tmp = "<pid>    <alive-time>    <name>\n";
            for ( i = 0; i < ps.length; i++ ) {
              var tmps = "";
              if ( ps[i].locked )
                tmps += " <locked>";
              if ( ps[i].subp )
                tmp += " (" + ps[i].subp + " subprocess(es))";
              if ( ps[i].service )
                tmps += " <service>";

              tmp += sprintf("%s %s %s\n", 
                             str_pad(ps[i].pid, 8, " ", "STR_PAD_RIGHT"),
                             str_pad(ps[i].time, 15, " ", "STR_PAD_RIGHT"),
                             ps[i].title + tmps);
            }
            outf(tmp);
          break;

          case "kill" :
            pid = parseInt(input[2], 10);
            tmp = null;
            if ( pid >= 0 ) {
              ps = API.session.processes();
              for ( i = 0; i < ps.length; i++ ) {
                if ( (ps[i].pid == pid) && (!ps[i].locked) && (ps[i].kill) ) {
                  tmp = ps[i];
                  break;
                }
              }
            }

            if ( tmp ) {
              tmp.kill();
              outf("Killing <" + tmp.pid + ">\n");
            } else {
              outf("Cannot kill invalid or locked process(es)\n");
            }
          break;

          default :
            outf(sprintf("%s: %s", cmd, "command not found"));
          break;
        }
      }

    });

    return new __ApplicationTerminal();
  };
})($);

