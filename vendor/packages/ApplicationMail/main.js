/*!
 * OS.js - JavaScript Operating System - Contains ApplicationMail JavaScript
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
OSjs.Packages.ApplicationMail = (function($, undefined) {
  "$:nomunge";

  /**
   * Locales
   */
  var _LINGUAS = {
    'en_US' : {
      "title"         : "Mail v0.5",
      "title_options" : "Mail Options",
      "title_mail"    : "Mail - %s",
      "title_compose" : "Mail - Compose"
    },
    'nb_NO' : {
      "title"         : "Epost v0.5",
      "title_options" : "Epost Instillinger",
      "title_mail"    : "Mail - %s",
      "title_compose" : "Mail - Komponere"
    }
  };

  /**
   * Default account/connection settings
   */
  var defaultAccountSettings = {
    "name"        : "John Doe",
    "email"       : "johndoe@gmail.com",
    "server_in"   : {
      "host"        : "{imap.gmail.com:993/imap/ssl/novalidate-cert}",
      "username"    : "johndoe",
      "password"    : null
    },

    "server_out"  : {
      "host"        : "ssl://smtp.gmail.com:465",
      "username"    : "johndoe@gmail.com",
      "password"    : null
    }
  };

  /**
   * Current View
   */
  var CURRENT_FOLDER  = "INBOX";
  var CURRENT_MESSAGE = 0;
  var BUSY            = false;

  /**
   * Storage/Cache helpers
   */
  var _initCursors = function() {
    var cur = {};
    try {
      cur = JSON.parse(sessionStorage.getItem("ApplicationMailFolderCursors"));
      if ( !cur || !(cur instanceof Object) )
        cur = {};
    } catch (e) {}

    return cur;
  };

  var _initCache = function() {
    var fld = [];
    try {
      fld = JSON.parse(sessionStorage.getItem("ApplicationMailFolderCache"));
      if ( !fld || !(fld instanceof Array) )
        fld = [];
    } catch (e) {}

    var msg = {};
    try {
      msg = JSON.parse(sessionStorage.getItem("ApplicationMailMessageCache"));
      if ( !msg || !(msg instanceof Object) || (msg instanceof Array) )
        msg = {};
    } catch (e) {}

    return {
      messages : msg,
      folders  : fld
    };
  };

  var _setFolderCache = function(cache) {
    sessionStorage.setItem("ApplicationMailFolderCache", JSON.stringify(cache));
  };

  var _setMessageCache = function(cache) {
    sessionStorage.setItem("ApplicationMailMessageCache", JSON.stringify(cache));
  };

  var _setCursorCache = function(cache) {
    sessionStorage.setItem("ApplicationMailFolderCursors", JSON.stringify(cache));
  };

  /**
   * Email -- IMAP/SMTP Email Helper
   * @class
   */
  var Email = Class.extend({

    _settings : {},     //!< Settings object
    _cursors  : {},     //!< Cursors for last message id
    _cache    : {       //!< Cache for Storage
      messages : {},
      folders  : []
    },

    _ev       : null,   //!< Application Event call function ref.
    _callback : null,   //!< Global Event callback function ref.

    /**
     * Email::init() -- Constructor
     * @constructor
     */
    init : function(settings, ev, callback) {
      this._settings  = settings;
      this._ev        = ev;
      this._callback  = callback;
      this._cursors   = _initCursors();
      this._cache     = _initCache();
    },

    /**
     * Email::destroy() -- Destructor
     * @destructor
     */
    destroy : function() {
      this._settings  = {};
      this._cursors   = {};
      this._cache     = {
        messages : {},
        folders  : []
      };
    },

    /**
     * Email::checkSettings() -- Check settings for errors etc.
     * @return  bool
     */
    checkSettings : function() {
      var i;
      var s = this._settings;

      for ( i in s.server_in ) {
        if ( s.server_in.hasOwnProperty(i) ) {
          if ( !s.server_in[i] )
            return false;
        }
      }
      for ( i in s.server_out ) {
        if ( s.server_out.hasOwnProperty(i) ) {
          if ( !s.server_out[i] )
            return false;
        }
      }

      return true;
    },

    /**
     * Email::deleteMessages() -- Delete a list of messages by IDs
     * @return  void
     */
    deleteMessages : function(ids) {
      var self = this;
      var args = {
        "user"    : this.getUserSettings(),
        "account" : this.getAccountSettings("server_in"),
        "uids"    : ids,
        "method"  : "delete"
      };

      this._ev("updateMessage", args, function(result, error) {
        self._callback("deleteMessages", result, error || result.error);
      });
    },

    /**
     * Email::toggleMessageRead() -- Update message status by IDs
     * @return  void
     */
    toggleMessageRead : function(ids, state) {
      var self = this;
      var args = {
        "user"    : this.getUserSettings(),
        "account" : this.getAccountSettings("server_in"),
        "uids"    : ids,
        "method"  : state ? "read" : "unread"
      };

      this._ev("updateMessage", args, function(result, error) {
        self._callback("toggleMessageRead", result, error || result.error);
      });
    },

    /**
     * Email::sendMessage() -- Send a message
     * @return  void
     */
    sendMessage : function(msg, callback) {
      var self = this;
      var args = {
        "user"    : this.getUserSettings(),
        "account" : this.getAccountSettings("server_out"),
        "message" : msg
      };

      this._ev("sendMessage", args, function(result, error) {
        self._callback("sendMessage", result, error || result.error);

        callback(result, error);
      });
    },

    /**
     * Email::readMessage() -- Request to read a message
     * @return  void
     */
    readMessage : function(item, respond) {
      var args = {
        "account" : this.getAccountSettings("server_in"),
        "id"      : item.uid,
        "respond" : respond
      };

      var self = this;
      this._ev("readMessage", args, function(result, error) {
        self._callback("readMessage", {"respond" : respond, message : result ? result.result : null, "item" : item}, error || result.error);
      });
    },

    /**
     * Email::enumFolders() -- Enumerate all folders
     * @return  void
     */
    enumFolders : function(callback) {
      var args = {
        "account" : this.getAccountSettings("server_in")
      };

      var self = this;
      this._ev("enumFolders", args, function(result, error) {
        self._callback("enumFolders", result, error || result.error);

        callback(error);
      });
    },

    /**
     * Email::enumMessages() -- Enumerate messages in given path
     * @return  void
     */
    enumMessages : function(path) {
      var args = {
        "account"   : this.getAccountSettings("server_in"),
        "folder"    : path,
        "filter"    : this.getFolderLastId(path) || 0
      };

      var self = this;
      this._ev("enumMessages", args, function(result, error) {
        self._callback("enumMessages", result, error || result.error);
      });
    },

    /**
     * Email::setAccountSettings() -- Set the account/connection settings
     * @param   Object    cfg           Settings object
     * @return  void
     */
    setAccountSettings : function(cfg) {
      this._settings = cfg;
      return this._settings;
    },

    /**
     * Email::setFolderCache() -- Set folder cache
     * @param   Array       folders     Folder list
     * @return  void
     */
    setFolderCache : function(folders) {
      this._cache.folders = folders;
      _setFolderCache(folders);
    },

    /**
     * Email::setMessageCache() -- Set folder message cache
     * @param   String      folder        Folder Name
     * @param   Object      items         Message Item(s)
     * @param   bool        append        Add to list instead of overwrite
     * @return  void
     */
    setMessageCache : function(folder, items, append) {
      var list = this._cache.messages[folder];
      if ( list === undefined ) {
        list = [];
      }

      if ( append ) {
        var i = 0, l = items.length;
        for ( i; i < l; i++ ) {
          list.unshift(items[i]);
        }
      } else {
        list = items;
      }

      this._cache.messages[folder] = list;

      _setMessageCache(this._cache.messages);
    },

    /**
     * Email::setMessageCacheProperty() -- Set a message property
     * @param   int     id        Message UID
     * @param   String  prop      Property ID
     * @param   Mixed   val       Propery value
     * @return  void
     */
    setMessageCacheProperty : function(id, prop, val) {
      var list = this._cache.messages;
      var x, y, z;
      for ( x in list ) {
        if ( list.hasOwnProperty(x) ) {
          for ( y in list[x] ) {
            if ( list[x].hasOwnProperty(y) ) {
              if ( list[x][y].uid == id ) {
                list[x][y][prop] = val;
                break;
              }
            }
          }
        }
      }

      this._cache.messages = list;
      _setMessageCache(this._cache.messages);
    },

    /**
     * Email::setMessageCacheDeleted() -- Mark a message as deleted
     * @param   int     id        Message UID
     * @return  void
     */
    setMessageCacheDeleted : function(id) {
      var list = this._cache.messages;
      var x, y, z;
      for ( x in list ) {
        if ( list.hasOwnProperty(x) ) {
          for ( y in list[x] ) {
            if ( list[x].hasOwnProperty(y) ) {
              if ( list[x][y].uid == id ) {
                list[x].splice(y, 1);
                break;
              }
            }
          }
        }
      }

      this._cache.messages = list;
      _setMessageCache(this._cache.messages);
    },

    /**
     * Email::setFolderLastId() -- Set last folder message id cache
     * @param   String      folder      Folder name
     * @param   int         id          Message UID
     * @return  void
     */
    setFolderLastId : function(folder, id) {
      this._cursors[folder] = id;

      _setCursorCache(this._cursors);
    },

    /**
     * Email::getFolderCache() -- Get folder cache
     * @return Aray
     */
    getFolderCache : function() {
      return this._cache.folders;
    },

    /**
     * Email::getMessageCache() -- Get message cache
     * @return Object
     */
    getMessageCache : function(folder) {
      if ( folder ) {
        if ( this._cache.messages[folder] ) {
          return this._cache.messages[folder];
        }
        return [];
      }

      return this._cache.messages;
    },

    /**
     * Email::getAccountSettings() -- Get account/connection settings
     * @return  Object
     */
    getAccountSettings : function(key) {
      if ( key )
        return this._settings[key];

      return this._settings;
    },

    /**
     * Email::getDefaultAccountSettings() -- Get Default account/connection settings
     * @return  Object
     */
    getDefaultAccountSettings : function() {
      return defaultAccountSettings;
    },

    /**
     * Email::getFolderLastId() -- Get the last id of a message from folder (cache)
     * @return  int
     */
    getFolderLastId : function(folder) {
      if ( this._cursors[folder] ) {
        return this._cursors[folder];
      }
      return 0;
    },

    /**
     * Email::getUserSettings() -- Get current user settings
     * @return Object
     */
    getUserSettings : function() {
      return {
        "name"  : this._settings.name,
        "email" : this._settings.email
      };
    }
  });

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
    var Window_window_compose = GtkWindow.extend({

      init : function(app, msg, headers) {
        this._super("Window_window_compose", false, app, windows);
        this._content = $("<div class=\"GtkWindow window_compose\"> <div class=\"GtkBox box4 GtkBoxVertical\"> <div class=\"GtkBoxPackage Position_0\"> <ul class=\"GtkMenuBar menubar1\"> <li class=\"GtkMenuItem menuitem2\"> <div class=\"GtkMenuItemInner\"> <span><u>F</u>ile</span> </div> <ul class=\"GtkMenu menu3\"> <li class=\"GtkImageMenuItem imagemenuitem5\"> <div class=\"GtkMenuItemInner\"> <img alt=\"Close\" src=\"/img/icons/16x16/actions/gtk-close.png\"/> <span>Close</span> </div> </li> </ul> </li> <li class=\"GtkMenuItem menuitem3\"> <div class=\"GtkMenuItemInner\"> <span><u>S</u>end</span> </div> </li> </ul> </div> <div class=\"GtkBoxPackage Position_1\"> <div class=\"GtkGrid grid1\"> <div class=\"GtkBoxPackage\"> <div class=\"GtkLabel label1\"> <span>To</span> </div> </div> <div class=\"GtkBoxPackage\"> <div class=\"GtkLabel label2\"> <span>Subject</span> </div> </div> <div class=\"GtkBoxPackage\"> <input type=\"text\" class=\"GtkEntry entry_to\"/> </div> <div class=\"GtkBoxPackage\"> <input type=\"text\" class=\"GtkEntry entry_subject\"/> </div> </div> </div> <div class=\"GtkBoxPackage Position_2 Expand Fill\"> <textarea class=\"GtkTextView textview\"></textarea> </div> </div> </div> ");
        this._title = LABELS.title_compose;
        this._icon = 'status/mail-unread.png';
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
        this._width = 500;
        this._height = 300;
        this._gravity = null;

        // Locals
        this.richtext     = null;
        this.message      = msg;
        this.headers      = headers || {};
      },

      destroy : function() {
        if ( this.richtext ) {
          this.richtext.destroy();
          this.richtext = null;
        }
        this._super();
      },

      // Override normal close function
      close : function(force) {
        if ( !force ) {
          var self = this;
          if ( this.app ) {
            this.app.createMessageDialog({
              "type"      : "confirm",
              "message"   : "Close window and delete draft?",
              "on_ok"     : function() {
                self.close(true);
              }
            });
          }

          return;
        }
        this._super();
      },


      EventMenuQuit : function(el, ev) {
        this.close();
      },

      EventMenuSend : function(el, ev) {
        var self = this;

        if ( el.hasClass("Disabled") )
          return;

        var content = self.richtext.getContent();

        var margs = {
          "to"          : self.$element.find(".entry_to").val(),
          "subject"     : self.$element.find(".entry_subject").val(),
          "plain"       : "", // TODO
          "html"        : content,
          "attachments" : [], // TODO
          "headers"     : self.headers
        };

        var _send = function() {
          self.app._root_window.MailSend(margs, function(result, response) {
            el.removeClass("Disabled");
            if ( result )
              self.close(true);
          });
        };

        // Validate input
        if ( !margs.to.match(/\S+@\S+/) && !margs.to.match(/[\S\s]+ \<\S+@\S+\>/) ) {
          this.app.createMessageDialog({"type" : "error", "message" : "You need to enter a valid email-address!"});
          el.removeClass("Disabled");
          return;
        }

        if ( !margs.subject ) {
          this.app.createMessageDialog({
            "type"      : "confirm",
            "message"   : "This message has no subject. Contine?",
            "on_ok"     : function() {
              _send();
            },
            "on_cancel" : function() {
              el.removeClass("Disabled");
            }
          });
          return;
        }

        _send();
      },

      create : function(id, mcallback) {
        var el = this._super(id, mcallback);
        var self = this;

        if ( el ) {

          el.find(".imagemenuitem5").click(function(ev) {
            self.EventMenuQuit(this, ev);
          });

          el.find(".menuitem3").click(function(ev) {
            self.EventMenuSend($(this), ev);
          });

          // Do your stuff here
          var css = 'body {margin:5px !important;}';
          var par = this.$element.find(".textview").parent();
          var area = $("<iframe frameborder=\"0\" border=\"0\" cellspacing=\"0\" src=\"about:blank\" class=\"GtkRichtext\"></iframe>");
          this.$element.find(".textview").remove();
          par.append(area);

          //this.$element.find(".entry_to").attr("type", "email");
          this.richtext = new OSjs.Classes.RichtextEditor(area);
          this.richtext.setContent("", css);
          this._addObject(this.richtext);

          el.find(".entry_to").attr("placeholder", "Ex: johndoe@inter.net OR John Doe <johndoe@inter.net>");
          el.find(".entry_subject").attr("placeholder", "Message title");

          if ( this.message ) {
            el.find(".entry_to").val((this.message.to) || "");
            el.find(".entry_subject").val((this.message.subject) || "");

            if ( this.message.html ) {
              this.richtext.setContent(this.message.html, css);
            } else {
              if ( this.message.plain ) {
                this.richtext.setContent("<pre>" + this.message.plain + "</pre>", css);
              }
            }
          }

          return true;
        }

        return false;
      }
    });

    /**
     * GtkWindow Class
     * @class
     */
    var Window_window_mail = GtkWindow.extend({

      init : function(app, message, headers) {
        this._super("Window_window_mail", false, app, windows);
        this._content = $("<div class=\"GtkWindow window_mail\"> <div class=\"GtkBox box3 GtkBoxVertical\"> <div class=\"GtkBoxPackage Position_0\"> <ul class=\"GtkMenuBar menubar_mail\"> <li class=\"GtkMenuItem menuitem_mail\"> <div class=\"GtkMenuItemInner\"> <span><u>F</u>ile</span> </div> <ul class=\"GtkMenu menu2\"> <li class=\"GtkImageMenuItem imagemenuitem_mail_quit\"> <div class=\"GtkMenuItemInner\"> <img alt=\"Close\" src=\"/img/icons/16x16/actions/gtk-close.png\"/> <span>Close</span> </div> </li> </ul> </li> </ul> </div> <div class=\"GtkBoxPackage Position_1 Expand Fill\"> <textarea class=\"GtkTextView textview_mail\"></textarea> </div> <div class=\"GtkBoxPackage Position_2\"> <div class=\"GtkStatusbar statusbar_mail\"></div> </div> </div> </div> ");
        this._title = sprintf(LABELS.title_mail, "Loading");
        this._icon = 'status/mail-unread.png';
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
        this._width = 440;
        this._height = 300;
        this._gravity = null;

        // Locals
        this.message  = message;
        this.headers  = headers;
        this.richtext = null;
      },

      destroy : function() {
        if ( this.richtext ) {
          this.richtext.destroy();
          this.richtext = null;
        }
        this._super();
      },


      EventMenuQuit : function(el, ev) {
        this.$element.find(".ActionClose").click();
      },

      create : function(id, mcallback) {
        var el = this._super(id, mcallback);
        var self = this;

        if ( el ) {

          el.find(".imagemenuitem_mail_quit").click(function(ev) {
            self.EventMenuQuit(this, ev);
          });

          this._setTitle(sprintf(LABELS.title_mail, "Message"));

          // Do your stuff here
          var css = 'body {margin:5px !important;}';
          var par = this.$element.find(".textview_mail").parent();
          var area = $("<iframe frameborder=\"0\" border=\"0\" cellspacing=\"0\" src=\"about:blank\" class=\"GtkRichtext\"></iframe>");
          this.$element.find(".textview_mail").remove();
          par.append(area);

          this.richtext = new OSjs.Classes.RichtextEditor(area);
          this.richtext.disable();
          this._addObject(this.richtext);

          if ( this.message ) {
            if ( this.message.html ) {
              this.richtext.setContent(this.message.html, css);
            } else {
              if ( this.message.plain )
                this.richtext.setContent("<pre>" + this.message.html + "</pre>", css);
            }
          }

          if ( this.headers ) {
            this.$element.find(".statusbar_mail").html(sprintf("From %s, %s", escapeHtml(this.headers.sender) || "Unknown", escapeHtml(this.headers.date)));
            this._setTitle(sprintf(LABELS.title_mail, escapeHtml(this.headers.subject) || escapeHtml("<No Subject>")));
          }

          this.$element.find(".statusbar_mail").html("Message loaded...");

          return true;
        }

        return false;
      }
    });


    /**
     * GtkWindow Class
     * @class
     */
    var Window_window_main = GtkWindow.extend({

      init : function(app) {
        this._super("Window_window_main", false, app, windows);
        this._content = $("<div class=\"GtkWindow window_main\"> <div class=\"GtkBox box1 GtkBoxVertical\"> <div class=\"GtkBoxPackage Position_0\"> <ul class=\"GtkMenuBar menubar_main\"> <li class=\"GtkMenuItem menuitem1\"> <div class=\"GtkMenuItemInner\"> <span><u>F</u>ile</span> </div> <ul class=\"GtkMenu menu1\"> <li class=\"GtkImageMenuItem imagemenuitem_main_new\"> <div class=\"GtkMenuItemInner\"> <img alt=\"New\" src=\"/img/icons/16x16/actions/gtk-new.png\"/> <span>New</span> </div> </li> <li class=\"GtkImageMenuItem imagemenuitem_main_options\"> <div class=\"GtkMenuItemInner\"> <img alt=\"Preferences\" src=\"/img/icons/16x16/categories/gtk-preferences.png\"/> <span>Preferences</span> </div> </li> <li> <div class=\"GtkSeparatorMenuItem separatormenuitem1\"></div> </li> <li class=\"GtkImageMenuItem imagemenuitem_main_quit\"> <div class=\"GtkMenuItemInner\"> <img alt=\"Quit\" src=\"/img/icons/16x16/actions/gtk-quit.png\"/> <span>Quit</span> </div> </li> </ul> </li> <li class=\"GtkMenuItem gtk-refresh\"> <div class=\"GtkMenuItemInner\"> <span><u>R</u>efresh</span> </div> </li> </ul> </div> <div class=\"GtkBoxPackage Position_1 Expand Fill\"> <div class=\"GtkBox box2 GtkBoxHorizontal\"> <div class=\"GtkBoxPackage Position_0\"> <div class=\"GtkIconView iconview_list\" style=\"width:200px\"></div> </div> <div class=\"GtkBoxPackage Position_1 Expand Fill\"> <div class=\"GtkIconView iconview_mail\"></div> </div> </div> </div> <div class=\"GtkBoxPackage Position_2\"> <div class=\"GtkStatusbar statusbar1\"></div> </div> </div> </div> ");
        this._title = LABELS.title;
        this._icon = 'status/mail-unread.png';
        this._is_draggable = true;
        this._is_resizable = true;
        this._is_scrollable = false;
        this._is_sessionable = true;
        this._is_minimizable = true;
        this._is_maximizable = true;
        this._is_closable = true;
        this._is_orphan = true;
        this._skip_taskbar = false;
        this._skip_pager = false;
        this._width = 700;
        this._height = 440;
        this._gravity = null;
      },

      destroy : function() {
        this._super();
      },

      create : function(id, mcallback) {
        var el = this._super(id, mcallback);
        var self = this;

        if ( el ) {

          el.find(".imagemenuitem_main_new").click(function(ev) {
            self.EventMenuNew(this, ev);
          });

          el.find(".imagemenuitem_main_options").click(function(ev) {
            self.EventMenuOptions(this, ev);
          });

          el.find(".gtk-refresh").click(function(ev) {
            if ( !$(this).hasClass("Disabled") )
              self.EventMenuFetch(this, ev);
          });

          el.find(".imagemenuitem_main_quit").click(function(ev) {
            self.EventMenuQuit(this, ev);
          });

          // Do your stuff here

          return true;
        }

        return false;
      },

      //
      // UI EVENTS
      //

      EventMenuNew : function(el, ev) {
        this.app.OpenComposeWindow();
      },

      EventMenuOptions : function(el, ev) {
        this.app.OpenOptionsWindow();
      },

      EventMenuFetch : function(el, ev) {
        this.app.connect();
      },

      EventMenuQuit : function(el, ev) {
        this.$element.find(".ActionClose").click();
      },

      EventMenuItemContext : function(ev, el, iter, ids) {
        var self = this;

        if ( !ids.length )
          ids = [iter.uid];

        var title = "Menu";
        if ( ids.length == 1 ) {
          title = sprintf("%d Message", ids.length);
        } else if ( !ids.length || ids.length > 1 ) {
          title = sprintf("%d Messages", ids.length);
        }

        API.application.context_menu(ev, $(el), [
          {"title" : title, "attribute" : "header"},
          {"title" : "Reply", "disabled" : (ids.length > 1) ,"method" : function() {
            self.app.handleRequest("respond", iter);
          }},
          {"title" : "Mark as unread", "disabled" : !ids.length, "method" : function() {
            self.app.handleRequest("unread", ids || []);
          }},
          {"title" : "Mark as read", "disabled" : !ids.length, "method" : function() {
            self.app.handleRequest("read", ids || []);
          }},
          {"title" : "Delete", "disabled" : !ids.length, "method" : function() {
            self.app.handleRequest("delete", ids || []);
          }}
        ], true);
      },

      //
      // APP UI
      //

      toggleFetching : function(m) {
        if ( m ) {
          this.$element.find(".iconview_list").addClass("Disabled");
          this.$element.find(".iconview_mail").addClass("Disabled");
          this.$element.find(".iconview_mail input").attr("disabled", true);
          this.$element.find(".gtk-refresh").addClass("Disabled");
          BUSY = true;
        } else {
          this.$element.find(".gtk-refresh").removeClass("Disabled");
          this.$element.find(".iconview_list").removeClass("Disabled");
          this.$element.find(".iconview_mail").removeClass("Disabled");
          this.$element.find(".iconview_mail input").removeAttr("disabled");
          BUSY = false;
        }
      },

      setStatusbarText : function(str) {
        this.$element.find(".statusbar1").html(str);
      },

      setMessageList : function(content) {
        this.$element.find(".iconview_list").html(content);
      },

      ChangeFolder : function(name) {
        if ( BUSY )
          return;

        CURRENT_FOLDER = name;

        this.UpdateMessages(this.app.mailer.getMessageCache(CURRENT_FOLDER));
        this.MailReadFolder();
      },

      UpdateFolders : function(folders) {
        var self = this;
        var el, iter;
        var i = 0;
        var l = folders.length;
        var r = this.$element.find(".iconview_list");
        var currentItem;

        r.empty();
        for ( i; i < l; i++ ) {
          iter = folders[i];
          el = $(sprintf('<div>%s</div>', escapeHtml(iter.name)));
          if ( !currentItem && (CURRENT_FOLDER == iter.name) ) {
            el.addClass("Current");
            currentItem = el;
          }

          el.click((function(iiter) {
            return function() {
              if ( BUSY )
                return;

              if ( currentItem ) {
                $(currentItem).removeClass("Current");
              }

              if ( $(currentItem) != $(this) ) {
                $(this).addClass("Current");
              }

              currentItem = this;

              self.ChangeFolder(iiter.name);
            };
          })(iter));

          r.append(el);
        }

        console.log("ApplicationMail::window_main::UpdateFolders", folders);
      },

      UpdateMessages : function(result) {
        var r = this.$element.find(".iconview_mail");
        var self = this;

        var el, iter;
        var i = 0;
        var l = result.length;
        var currentItem, className;
        var ids = [];

        r.animate({scrollTop : 0});
        r.empty();
        for ( i; i < l; i++ ) {
          iter = result[i];
          className = iter.status;

          if ( !currentItem && (CURRENT_MESSAGE == iter.uid) ) {
            el.addClass("Current");
            currentItem = el;
          }

          el = $(sprintf('<div class="%s"><input type="checkbox" name="message_%s" /><span class="Sender">%s</span><span class="Date">%s</span><span class="Subject">%s</span></div>', 
                         className,
                         iter.uid,
                         escapeHtml(iter.sender) || "Unknown sender",
                         escapeHtml(iter.date),
                         escapeHtml(iter.subject) || "No subject"));

          el.click((function(iiter) {
            return function() {
              if ( BUSY )
                return;

              if ( currentItem ) {
                $(currentItem).removeClass("Current");
              }

              if ( $(currentItem) != $(this) ) {
                $(this).addClass("Current");
              }

              currentItem = this;
            };
          })(iter));

          el.dblclick((function(iiter) {
            return function() {
              if ( BUSY )
                return;

              self.MailRead(iiter);
            };
          })(iter));

          el.bind("contextmenu", (function(iiter) {
            return function(ev) {
              ev.preventDefault();
              if ( BUSY )
                return false;

              if ( !in_array(iiter.uid, ids) ) {
                ids.push(iiter.uid);
              }
              $(this).find("input").attr("checked", true);

              self.EventMenuItemContext(ev, this, iiter, ids);
              return false;
            };
          })(iter));

          el.find("input").change((function(iiter) {
            return function() {
              if ( BUSY )
                return;

              if ( $(this).is(":checked") ) {
                if ( !in_array(iiter.uid, ids) ) {
                  ids.push(iiter.uid);
                }
              } else {
                for ( var xx = 0; xx < ids.length; xx++ ) {
                  if ( ids[xx] == iiter.uid ) {
                    ids.splice(xx, 1);
                    break;
                  }
                }
              }
            };
          })(iter));

          r.append(el);
        }

      },

      MailReadAccount : function(callback) {
        this.toggleFetching(true);
        this.setStatusbarText("Loading folders...");

        this.app.mailer.enumFolders(callback);
      },

      MailReadFolder : function(folder) {
        folder = folder || CURRENT_FOLDER;

        this.toggleFetching(true);
        this.setStatusbarText(sprintf("Loading messages in '%s'...", folder));

        this.app.mailer.enumMessages(folder);
      },

      MailRead : function(item, respond) {
        this.toggleFetching(true);
        this.setStatusbarText("Fetching message...");

        this.app.mailer.readMessage(item, respond);
      },

      MailSend : function(margs, callback) {
        var self = this;

        this.toggleFetching(true);
        this.setStatusbarText("Sending message...");

        this.app.mailer.sendMessage(margs, function(result, error) {
          if ( error || !result.result ) {
            error = error || "Failed to send, no response from server!";
            self.app.createMessageDialog({type : "error", message : error});
            return callback(false, result);
          }
          return callback(true, result);
        });
      }

    });


    /**
     * GtkWindow Class
     * @class
     */
    var Window_window_options = GtkWindow.extend({

      init : function(app) {
        this._super("Window_window_options", false, app, windows);
        this._content = $("<div class=\"GtkWindow window_options\"></div>");
        this._title = LABELS.title_options;
        this._icon = 'status/mail-unread.png';
        this._is_draggable = true;
        this._is_resizable = false;
        this._is_scrollable = false;
        this._is_sessionable = true;
        this._is_minimizable = true;
        this._is_maximizable = false;
        this._is_closable = true;
        this._is_orphan = true;
        this._skip_taskbar = false;
        this._skip_pager = false;
        this._width = 350;
        this._height = 380;
        this._gravity = "center";
      },

      destroy : function() {
        this._super();
      },

      create : function(id, mcallback) {
        var el = this._super(id, mcallback);
        var self = this;

        if ( el ) {

          // Do your stuff here
          var root      = el.find(".GtkWindow");
          var buttons   = $("<div class=\"Buttons\"><button class=\"Save\">Save</button><button class=\"Close\">Close</button></div>");

          buttons.find(".Save").click(function() {
            var config = {
              "name" : root.find("input[name=name]").val(),
              "email" : root.find("input[name=email]").val(),
              "server_in" : {
                "host"      : root.find("input[name=server_in-host]").val(),
                "username"  : root.find("input[name=server_in-username]").val(),
                "password"  : root.find("input[name=server_in-password]").val()
              },
              "server_out" : {
                "host"      : root.find("input[name=server_out-host]").val(),
                "username"  : root.find("input[name=server_out-username]").val(),
                "password"  : root.find("input[name=server_out-password]").val()
              }
            };

            if ( self.app.setConfig(config, true) ) {
              self.close();
            }
          });

          buttons.find(".Close").click(function() {
            self.close();
          });

          var table;
          var cfg = this.app.mailer.getAccountSettings();
          if ( !cfg.server_in )
            cfg = defaultAccountSettings;

          var row_name  = sprintf("<tr><td>Full Name</td><td><input type=\"text\" value=\"%s\" name=\"name\" /></td></tr>", cfg.name || "");
          var row_mail  = sprintf("<tr><td>Email</td><td><input type=\"text\" value=\"%s\" name=\"email\" /></td></tr>", cfg.email || "");
          table         = $("<table>" + row_name + row_mail + "</table>");

          root.append(sprintf("<div class=\"Header\">%s</div>", "General"));
          root.append(table);

          var row_host  = sprintf("<tr><td>Host</td><td><input type=\"text\" value=\"%s\" name=\"server_in-host\" /></td></tr>", cfg.server_in.host || "");
          var row_user  = sprintf("<tr><td>Username</td><td><input type=\"text\" value=\"%s\" name=\"server_in-username\" /></td></tr>", cfg.server_in.username || "");
          var row_pass  = sprintf("<tr><td>Password</td><td><input type=\"password\" value=\"%s\" name=\"server_in-password\" /></td></tr>", cfg.server_in.password || "");
          table         = $("<table>" + row_host + row_user + row_pass + "</table>");

          root.append(sprintf("<div class=\"Header\">%s</div>", "Incoming mail"));
          root.append(table);

          row_host  = sprintf("<tr><td>Host</td><td><input type=\"text\" value=\"%s\" name=\"server_out-host\" /></td></tr>", cfg.server_out.host || "");
          row_user  = sprintf("<tr><td>Username</td><td><input type=\"text\" value=\"%s\" name=\"server_out-username\" /></td></tr>", cfg.server_out.username || "");
          row_pass  = sprintf("<tr><td>Password</td><td><input type=\"password\" value=\"%s\" name=\"server_out-password\" /></td></tr>", cfg.server_out.password || "");
          table     = $("<table>" + row_host + row_user + row_pass + "</table>");

          root.append(sprintf("<div class=\"Header\">%s</div>", "Outgoing mail"));
          root.append(table);

          root.append(buttons);

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
    var __ApplicationMail = Application.extend({

      init : function() {
        var self = this;

        this._super("ApplicationMail", argv);

        this._compability     = ["richtext"];
        this._storage_on      = true;
        this._storage_restore = true;
        this._storage         = defaultAccountSettings;
      },

      destroy : function() {
        if ( this.mailer ) {
          // Make sure we store latest settings and cache!
          this._storage = this.mailer.getAccountSettings();

          this.mailer.destroy();
          this.mailer = null;
        }

        this._super();
      },

      run : function() {
        var self = this;

        var root_window = new Window_window_main(self);
        this._super(root_window);
        root_window.show();

        // Do your stuff here


        setTimeout(function() {
          self.mailer = new Email(self._storage, function() { self._event.apply(self, arguments); }, function() { self.handleCallback.apply(self, arguments); });
          self.connect();
        }, 10);
      },

      connect : function(skipcheck) {
        var self = this;

        if ( !this._root_window )
          return;

        console.log("ApplicationMail::connect()", skipcheck);

        if ( skipcheck || this.mailer.checkSettings() ) {
          // First read from cache
          this._root_window.setStatusbarText("Loading cache...");

          this._root_window.UpdateFolders(this.mailer.getFolderCache());
          this._root_window.UpdateMessages(this.mailer.getMessageCache(CURRENT_FOLDER));

          // Update/Load from server
          this._root_window.setStatusbarText("Connecting...");
          this._root_window.MailReadAccount(function(error) {
            if ( !error ) {
              self._root_window.MailReadFolder(CURRENT_FOLDER);
              return;
            }
          });
        } else {
          this._root_window.setStatusbarText("Please configure your account!");

          this.OpenOptionsWindow();
        }
      },

      handleRequest : function(method, vars) {
        if ( !this._root_window )
          return;

        var self = this;
        switch ( method ) {
          case "respond" :
            this._root_window.MailRead(vars, true);
          break;

          case "delete" :
            if ( vars.length ) {
              this._root_window.toggleFetching(true);
              this._root_window.setStatusbarText(sprintf("Deleting %d message(s)...", vars.length));
              this.mailer.deleteMessages(vars);
            }
          break;

          case "read" :
            if ( vars.length ) {
              this._root_window.toggleFetching(true);
              this._root_window.setStatusbarText(sprintf("Marking %d as read...", vars.length));
              this.mailer.toggleMessageRead(vars, true);
            }
          break;

          case "unread" :
            if ( vars.length ) {
              this._root_window.toggleFetching(true);
              this._root_window.setStatusbarText(sprintf("Marking %d as unread...", vars.length));
              this.mailer.toggleMessageRead(vars, false);
            }
          break;

          default:
            (function() {})();
          break;
        }
      },

      handleCallback : function(method, response, error) {
        var self = this;

        if ( response instanceof Object ) {
          if ( response.error )
            error = response.error;
        }

        if ( !this._root_window )
          return;

        if ( error )
          this._root_window.setStatusbarText("An error occured!");
        else
          this._root_window.setStatusbarText("");

        this._root_window.toggleFetching(false);

        switch ( method ) {
          case "enumFolders" :
            if ( error ) {
              this._root_window.setStatusbarText("Error loading folders: " + error);
            } else {
              if ( response.result === false ) {
                this._root_window.setStatusbarText("Failed to load folders!");
              } else {
                this._root_window.setStatusbarText(sprintf("Loaded %d folder(s)", 0));
                if ( response.result instanceof Array ) {
                  this._root_window.UpdateFolders(response.result);
                  this._root_window.setStatusbarText(sprintf("Loaded %d folder(s)", response.result.length));

                  this.mailer.setFolderCache(response.result);
                }
              }
            }
          break;

          case "enumMessages" :
            if ( error ) {
              this._root_window.setStatusbarText("Error loading messages: " + error);
            } else {
              if ( response.result === false ) {
                this._root_window.setStatusbarText("Failed to load messages!");
              } else {
                this._root_window.setStatusbarText(sprintf("Loaded %d message(s)", 0));
                var res = response.result.messages;
                if ( res instanceof Array ) {

                  var folder  = response.result.folder;
                  var lastId  = response.result.lastId;
                  var flastId = this.mailer.getFolderLastId(folder);
                  var append  = this.mailer.getMessageCache(folder).length ? true : false;

                  this.mailer.setMessageCache(folder, res, append);

                  if ( lastId > flastId )
                    this.mailer.setFolderLastId(folder, lastId);

                  // Always get from cache
                  //this._root_window.UpdateMessages(res);
                  res = this.mailer.getMessageCache(folder);
                  this._root_window.UpdateMessages(res);

                  this._root_window.setStatusbarText(sprintf("Loaded %d message(s)", res.length));
                }
              }
            }
          break;

          case "readMessage" :
            if ( error ) {
              this._root_window.setStatusbarText("Failed to read message: " + error);
            } else {
              this._root_window.setStatusbarText("Message loaded");
              if ( response.respond ) {
                this.OpenComposeWindow({
                  "to"      : response.item.sender,
                  "subject" : sprintf("RE: %s", response.item.subject),
                  "html"    : response.html,
                  "plain"   : response.plain
                });
              } else {
                this.OpenReaderWindow(response.message, response.item);
              }
            }
          break;

          case "sendMessage" :
            if ( !error )
              this._root_window.setStatusbarText("Message sendt...");
          break;

          case "deleteMessages" :
            if ( !error ) {
              for ( var y in response.result.items ) {
                if ( response.result.items.hasOwnProperty(y) ) {
                  if ( response.result.items[y] )
                    this.mailer.setMessageCacheDeleted(y);
                }
              }
              this._root_window.UpdateMessages(this.mailer.getMessageCache(CURRENT_FOLDER));
            }
          break;

          case "toggleMessageRead" :
            if ( !error ) {
              for ( var x in response.result.items ) {
                if ( response.result.items.hasOwnProperty(x) ) {
                  if ( response.result.items[x] )
                    this.mailer.setMessageCacheProperty(x, "status", (response.result.method));
                }
              }
              this._root_window.UpdateMessages(this.mailer.getMessageCache(CURRENT_FOLDER));
            }
          break;

          default :
            console.warn("ApplicationMail::handleCallback()", method, response, error);

            if ( error ) {
              self.createMessageDialog({"type" : "error", "message" : error});
              return;
            }
          break;
        }
      },

      OpenComposeWindow : function(msg, headers) {
        return this._addWindow(new Window_window_compose(this, msg, headers));
      },

      OpenReaderWindow : function(msg, item) {
        return this._addWindow(new Window_window_mail(this, msg, item));
      },

      OpenOptionsWindow : function() {
        var config_window = new Window_window_options(this);
        if ( this._addWindow(config_window) ) {
          config_window.show();
        }
      },

      setConfig : function(cfg, connect) {
        console.log("ApplicationMail::setConfig()", cfg, connect);

        this._storage = this.mailer.setAccountSettings(cfg);
        this._saveStorage();

        if ( connect ) {
          if ( this.mailer.checkSettings()) {
            this.connect(true);

            return true;
          }

          return false;
        }

        return true;
      }

    });

    return new __ApplicationMail();
  };
})($);

