/*!
 * OS.js - JavaScript Operating System - Contains ApplicationFileManager JavaScript
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
OSjs.Packages.ApplicationFileManager = (function($, undefined) {
  "$:nomunge";

  var _LINGUAS = {
    'en_US' : {
      "title" : "File Manager",
      "upload" : "Upload",
      "context" : {
        "prot"      : "Protected",
        "open"      : "Open",
        "openwith"  : "Open With...",
        "del"       : "Delete",
        "rename"    : "Rename",
        "download"  : "Download",
        "props"     : "Properties"
      },
      "context_def" : {
        "create" : "Create new...",
        "file"   : "Empty file",
        "dir"    : "Empty directory",
        "upload" : "Upload from computer"
      },
      "create_title"   : "New File",
      "create_desc"    : "File name:",
      "create_error"   : "Cannot create this file",
      "mkdir_title"    : "New Directory",
      "mkdir_desc"     : "Directory name",
      "mkdir_error"    : "Cannot create this directory",
      "confirm_delete" : "Are you sure you want to delete %s?",
      "confirm_deletem": "%d items",
      "confirm_replace": "Are you sure you want to overwrite '%s'?"
    },
    'nb_NO' : {
      "title" : "Fil Behandler",
      "upload" : "Last opp",
      "context" : {
        "prot"      : "Beskyttet",
        "open"      : "Åpne",
        "openwith"  : "Åpne Med...",
        "del"       : "Slett",
        "rename"    : "Gi nytt navn",
        "download"  : "Last ned",
        "props"     : "Egenskaper"
      },
      "context_def" : {
        "create" : "Lag ny...",
        "file"   : "Tom fil",
        "dir"    : "Tom mappe",
        "upload" : "Last opp fra maskin"
      },
      "create_title"   : "Ny Fil",
      "create_desc"    : "Filnavn",
      "create_error"   : "Kan ikke lage denne filen",
      "mkdir_title"    : "Ny Mappe",
      "mkdir_desc"     : "Navn på mappe:",
      "mkdir_error"    : "Kan ikke opprette denne mappen",
      "confirm_delete" : "Er du sikker på at du vil slette %s?",
      "confirm_deletem": "%d objekter",
      "confirm_replace": "Er du sikker på at du vil overskrive '%s'?"
    }
  };

  return function(GtkWindow, Application, API, argv, windows) {
    "GtkWindow:nomunge, Application:nomunge, API:nomunge, argv:nomunge, windows:nomunge";

    var LABELS      = _LINGUAS[API.system.language()] || _LINGUAS['en_US'];
    var CURRENT_DIR = "/";
    var STATUS_TEXT = "";

    var FileManagerIconView = OSjs.Classes.IconView.extend({
      init : function(app, el) {
        this._super(el, "icon", {
          "dnd"         : true,
          "multiselect" : true
        });

        // Locals
        this.app          = app;
        this._sortKey     = "name";
        this._sortDir     = "asc";
        this._ignoreFocus = false; // Fixes taking over focus when VFS event (etc) triggers
      },

      _createItem : function(iter, dnd) {
        return this._super(iter, iter.name != "..", iter.name == ".." ? "none" : "copy");
      },

      createItem : function(view, iter) {
        var ispkg = false;
        var el;
        if ( iter.mime.match(/^OSjs\/(Application|PanelItem|Service|BackgroundService)/) ) {
          ispkg = basename(iter.path);
        }

        if ( view == "icon" ) {
          el = $(sprintf("<li class=\"GtkIconViewItem\"><div class=\"Image\"><img alt=\"\" src=\"%s\" /></div><div class=\"Label\">%s</div></li>",
                         API.ui.getIcon(iter.icon, "32x32", ispkg),
                         iter.name));
        } else {
          el = $(sprintf("<tr class=\"GtkIconViewItem\"><td><img alt=\"\" src=\"%s\" /></td><td>%s</td><td>%s</td><td>%s</td></tr>",
                         API.ui.getIcon(iter.icon, "16x16", ispkg),
                         iter.name,
                         iter.hsize,
                         iter.mime));
        }

        el.data("icon", iter.icon);
        el.data("name", iter.name);
        el.data("mime", iter.mime);
        el.data("size", iter.size);
        el.data("path", iter.path);
        el.data("type", iter.type);

        return el;
      },

      onFocus : function() {
        if ( this._ignoreFocus ) {
          this._ignoreFocus = false;
          return;
        }
        this.app._root_window.focus();
      },

      onBlur : function() {
        this.app._root_window.blur();
      },

      onItemActivate : function(ev, el, item) {
        if ( el && item ) {
          if ( item.type == "dir" ) {
            this.app.chdir(item.path);
          } else {
            API.system.run(item.path, item.mime);
          }
        }
        return this._super(ev, el, item);
      },


      onItemSelect : function(ev, el, item, focus) {
        if ( item ) {
          if ( item.type == "dir" ) {
            this.app._root_window.setStatusbarText(sprintf('"%s" %s', item.name, "folder"));
          } else {
            this.app._root_window.setStatusbarText(sprintf('"%s" (%s) %s', item.name, (item.size ? item.hsize : "0 B"), item.mime));
          }
        } else {
          this.app._root_window.setStatusbarText(STATUS_TEXT);
        }

        return this._super(ev, el, item, focus);
      },

      onItemContextMenu : function(ev, el, item) {
        var self    = this;
        var lbls    = LABELS.context;
        var result  = this._super(ev, el, item);

        if ( item['protected'] ) {
          API.application.context_menu(ev, el, [
            {"title" : lbls.prot, "disabled" : true, "method" : function() {
              return false;
            }}
          ], true);
        } else {
          var dd = false;
          var ad = false;
          var items = this.getSelectedItems();

          if ( this._currentItem.length > 1 ) {
            dd = true;
            ad = true;
          } else {
            ad = false;
            dd = item.type == "dir" || !item.path.match(/^\/User/);
          }

          API.application.context_menu(ev, el, [
            {"disabled" : ad, "title" : lbls.open, "method" : function() {
              if ( item.type == "dir" ) {
                self.app.chdir(item.path);
              } else {
                API.system.run(item.path, item.mime, true);
              }
            }},
            {"disabled" : (ad || (item.type == "dir")), "title" : lbls.openwith, "method" : function() {
              if ( item.type == "dir" ) {
                self.app.chdir(item.path);
              } else {
                API.system.run(item.path, item.mime, false);
              }
            }},
            {"title" : lbls.del, "method" : function() {
              self.app.deleteFile(items);
            }},
            {"disabled" : ad, "title" : lbls.rename, "method" : function() {
              self.app.renameFile(item);
            }},
            {"title" : lbls.download, "disabled" : dd, "method" : function() {
                self.app.downloadFile(item);
            }},
            {"disabled" : ad, "title" : "Properties", "method" : function() {
              self.app.createFilePropertyDialog({'path' : item.path, 'on_apply' : function(result) {
                return;
              }});
            }}
          ], true);
        }

        return result;
      },

      onContextMenu : function(ev, el) {
        var self = this;
        var lbls = LABELS.context_def;
        var res  = this._super(ev);
        API.application.context_menu(ev, el, [
          {"title" : lbls.create, "items" : [
            {"title" : lbls.file, "method" : function() {
              self.app.mkfile();
            }},
            {"title" : lbls.dir, "method" : function() {
              self.app.mkdir();
            }},
            {"title" : lbls.upload, "method" : function() {
              self.app.upload();
            }}
          ]}
        ], true);

        return res;
      },

      onColumnActivate : function(ev, el, iter) {
        iter = iter.toLowerCase();
        var res = this._super(ev, el, iter);
        if ( this._sortKey && this._sortDir ) {
          this.app.chdir(CURRENT_DIR, null, true);
        }

        return res;
      },

      onDragAction : function(ev, action, item, args) {
        var result = this._super(ev, action, item, args);
        if ( (action == "drop") && (result instanceof Object) ) {
          if ( item ) {
            var idata = $(item).data();
            if ( idata.type == "dir" && idata.name != ".." ) { // FIXME: Relative '..'
              if ( result.json ) {
                this.app.copyFile(result.json.path, idata.path, result.json.name);
              } else if ( result.files && result.files.length ) {
                this.app.uploadFile(result.files, idata.path);
              }
            }
          } else {
            if ( result.json ) {
              if ( result.json.type != "dir" ) {
                this.app.copyFile(result.json.path, CURRENT_DIR, result.json.name);
              }
            } else if ( result.files && result.files.length ) {
              this.app.uploadFile(result.files, CURRENT_DIR);
            }
          }
        }
        return result;
      }

    });

    var Window_window1 = GtkWindow.extend({

      init : function(app) {
        this._super("ApplicationFileManager", false, app, windows);
        this._content = $("<div class=\"GtkWindow window1 ApplicationFileManager\"> <div class=\"GtkBox box1 GtkBoxVertical\"> <div class=\"GtkBoxPackage Position_0\"> <ul class=\"GtkMenuBar menubar1\"> <li class=\"GtkMenuItem menuitem_file\"> <div class=\"GtkMenuItemInner\"> <span><u>F</u>ile</span> </div> <ul class=\"GtkMenu menu_file\"> <li class=\"GtkImageMenuItem imagemenuitem_new\"> <div class=\"GtkMenuItemInner\"> <img alt=\"New\" src=\"/img/icons/16x16/actions/gtk-new.png\"/> <span>New</span> </div> </li> <li class=\"GtkImageMenuItem imagemenuitem_mkdir\"> <div class=\"GtkMenuItemInner\"> <img alt=\"New\" src=\"/img/icons/16x16/actions/gtk-new.png\"/> <span>New</span> </div> </li> <li class=\"GtkImageMenuItem imagemenuitem_close\"> <div class=\"GtkMenuItemInner\"> <img alt=\"Close\" src=\"/img/icons/16x16/actions/gtk-close.png\"/> <span>Close</span> </div> </li> </ul> </li> <li class=\"GtkMenuItem menuitem_go\"> <div class=\"GtkMenuItemInner\"> <span><u>G</u>o</span> </div> <ul class=\"GtkMenu menu_go\"> <li class=\"GtkImageMenuItem imagemenuitem_home\"> <div class=\"GtkMenuItemInner\"> <img alt=\"Home\" src=\"/img/icons/16x16/actions/gtk-home.png\"/> <span>Home</span> </div> </li> </ul> </li> <li class=\"GtkMenuItem menuitem_view\"> <div class=\"GtkMenuItemInner\"> <span><u>V</u>iew</span> </div> <ul class=\"GtkMenu menu_view\"> <li class=\"GtkImageMenuItem menuitem_refresh\"> <div class=\"GtkMenuItemInner\"> <img alt=\"Refresh\" src=\"/img/icons/16x16/actions/gtk-refresh.png\"/> <span>Refresh</span> </div> </li> <li class=\"GtkRadioMenuItem menuitem_list\"> <div class=\"GtkMenuItemInner\"> <span>List view</span> </div> </li> <li class=\"GtkRadioMenuItem menuitem_icon\"> <div class=\"GtkMenuItemInner\"> <span>Icon View</span> </div> </li> </ul> </li> </ul> </div> <div class=\"GtkBoxPackage Position_1 Expand Fill\"> <div class=\"GtkIconView iconview1\"></div> </div> <div class=\"GtkBoxPackage Position_2\"> <div class=\"GtkStatusbar statusbar1\"></div> </div> </div> </div>");
        this._title = LABELS.title;
        this._icon = 'apps/file-manager.png';
        this._is_draggable = true;
        this._is_resizable = true;
        this._is_scrollable = false;
        this._is_sessionable = true;
        this._is_minimizable = true;
        this._is_maximizable = true;
        this._is_closable = true;
        this._is_orphan = false;
        this._width = 500;
        this._height = 500;
        this._gravity = null;

        this.iconview = null;
        this.loading  = $("<div class=\"Loading\"><img alt=\"\" src=\"/img/ajaxload_surround_invert_64.gif\" /></div>");
      },

      destroy : function() {
        if ( this.iconview ) {
          this.iconview.destroy();
          this.iconview = null;
        }
        if ( this.loading ) {
          this.loading.remove();
          this.loading = null;
        }
        this._super();
      },


      EventMenuNew : function(el, ev) {
        this.app.upload();
      },
      EventMenuMkdir : function(el, ev) {
        this.app.mkdir();
      },
      EventMenuClose : function(el, ev) {
        this.$element.find(".ActionClose").click();
      },
      EventMenuHome : function(el, ev) {
        this.app.chdir(API.user.settings.get("user.env.home"));
      },
      EventRefresh : function(el, ev) {
        this.app.refreshView();
      },
      EventMenuListToggle : function(el, ev) {
        this.app.changeView("list");
        this._updateMenu();
      },
      EventMenuIconToggle : function(el, ev) {
        this.app.changeView("icon");
        this._updateMenu();
      },

      _updateMenu : function() {
        if ( this.app._getArgv("view_type") == 'icon' ) {
          this.$element.find(".menuitem_list").removeClass("Checked");
          this.$element.find(".menuitem_icon").addClass("Checked");
        } else {
          this.$element.find(".menuitem_list").addClass("Checked");
          this.$element.find(".menuitem_icon").removeClass("Checked");
        }
      },

      create : function(id, mcallback) {
        var el = this._super(id, mcallback);
        var self = this;

        if ( el ) {

          el.find(".imagemenuitem_new").click(function(ev) {
            self.EventMenuNew(this, ev);
          }).find("span").html(LABELS.upload);

          el.find(".imagemenuitem_mkdir").click(function(ev) {
            self.EventMenuMkdir(this, ev);
          });

          el.find(".imagemenuitem_close").click(function(ev) {
            self.EventMenuClose(this, ev);
          });

          el.find(".imagemenuitem_home").click(function(ev) {
            self.EventMenuHome(this, ev);
          });

          el.find(".menuitem_refresh").click(function(ev) {
            self.EventRefresh(this, ev);
          });

          el.find(".menuitem_list").click(function(ev) {
            self.EventMenuListToggle(this, ev);
          });

          el.find(".menuitem_icon").click(function(ev) {
            self.EventMenuIconToggle(this, ev);
          });

          // Do your stuff here
          var iv        = this.$element.find(".iconview1");
          this.iconview = new FileManagerIconView(this.app, iv);
          iv.parent().append(this.loading);
          this._addObject(this.iconview);

          this._updateMenu();
        }
      },

      setTitle : function(t) {
        if ( t ) {
          this._setTitle(sprintf("%s: %s", this._origtitle, t));
        } else {
          this._setTitle(this._origtitle);
        }
      },

      setStatusbarText : function(t) {
        t = t || STATUS_TEXT;
        this.$element.find(".statusbar1").html(t);
      },

      setLoading : function(l) {
        if ( l )
          this.loading.show();
        else
          this.loading.hide();
      },

      setList : function(list, cols, vt, background) {
        if ( this.iconview ) {
          this.iconview._ignoreFocus = (background === true);
          this.iconview.render(list, cols, vt);
        }
      }

    });

    ///////////////////////////////////////////////////////////////////////////
    // APPLICATION
    ///////////////////////////////////////////////////////////////////////////

    var __ApplicationFileManager = Application.extend({

      init : function() {
        this._super("ApplicationFileManager", argv);
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
        if ( !this._getArgv("view_type") ) {
          this._setArgv("view_type", "icon");
        }
        if ( !this._getArgv("path") ) {
          this._setArgv("path", "/");
        }

        if ( argv && argv.path ) {
          this._setArgv("path", argv.path);
        }

        this._bind("vfs", function(args) {
          if ( dirname(args.file) == CURRENT_DIR ) {
            self.chdir(CURRENT_DIR, null, true, true);
          }
        });
        this.chdir(this._getArgv("path"), null, true);
      },

      chdir : function(dir, callback, force, background) {
        callback = callback || function() {};

        if ( (CURRENT_DIR == dir) && !force ) {
          return;
        }

        var self = this;
        var vt = this._getArgv("view_type");
        var st = this._root_window.iconview._sortDir + ":" + this._root_window.iconview._sortKey;

        this._root_window.setLoading(true);

        API.system.call("lswrap", {"path" : dir, "view" : vt, "sort" : st}, function(result, error) {
          var title = "";
          if ( error ) {
            STATUS_TEXT = "";
          } else {
            CURRENT_DIR = dir;
            STATUS_TEXT = sprintf("%d items (%d bytes)", result.total, result.bytes);
            title = result.path;
          }

          self._root_window.setTitle(title);
          self._root_window.setStatusbarText(STATUS_TEXT);
          self._root_window.setLoading(false);
          self._root_window.setList(result ? result.items : [], ["", "Name", "Size", "Type"], vt, background);
          //self._setArgv("path", CURRENT_DIR); // NOPE!!
          callback(result, error);
        });
      },

      upload : function() {
        var self = this;
        this.defaultFileUpload(CURRENT_DIR, function(path, fname) {
          self.chdir(CURRENT_DIR, function(result, error) {
            if ( error === null ) {
              self._root_window.iconview.selectItem("name", fname);
            }
          }, true);
        });
      },

      mkfile : function() {
        var self = this;
        this.createInputDialog({'value' : LABELS.create_title, 'desc' : LABELS.create_desc, 'on_apply' : function(dir) {
          if ( dir ) {
            API.system.call("touch", (CURRENT_DIR + "/" + dir), function(result, error) {
              if ( error === null ) {
                self.chdir(CURRENT_DIR, function() {
                  self._root_window.iconview.selectItem("name", dir);
                }, true);
              }
            });
          } else {
            self.createMessageDialog({'type' : "error", 'message' : LABELS.create_error});
          }
        }});
      },

      mkdir : function() {
        var self = this;
        this.createInputDialog({'value' : LABELS.mkdir_title, 'desc' : LABELS.mkdir_desc, 'on_apply' : function(dir) {
          if ( dir ) {
            API.system.call("mkdir", (CURRENT_DIR + "/" + dir), function(result, error) {
              if ( error === null ) {
                self.chdir(CURRENT_DIR, function() {
                  self._root_window.iconview.selectItem("name", dir);
                }, true);
              }
            });
          } else {
            self.createMessageDialog({'type' : "error", 'message' : LABELS.mkdir_error});
          }
        }});
      },

      uploadFile : function(files, dest) {
        var self = this;
        for ( var i = 0; i < files.length; i++ ) {
          this.defaultFileUpload(dest, function(path, fname) {
            self.chdir(CURRENT_DIR, function() {
              self._root_window.iconview.selectItem("name", fname);
            }, true);
          }, {"dnd" : files[i]});
        }
      },

      _copyFile : function(src, dest, name) {
        var self = this;
        this.createFileCopyDialog({'error_on' : false, 'source' : src, 'dest' : dest, 'callback' : function(result, error) {
          self.chdir(CURRENT_DIR, function(result, error) {
            if ( error === null ) {
              self._root_window.iconview.selectItem("name", name);
            }
          }, true);
        }});
      },

      copyFile : function(src, dest, name) {
        var self = this;
        dest = dest + "/" + name;

        if ( (!src || !dest) || (src === dest) )
          return;

        var exists = this._root_window.iconview.getItem("path", dest) ? true : false;
        if ( exists ) {
          var lbl = sprintf(LABELS.confirm_replace, basename(dest));
          this.createMessageDialog({'type' : "confirm", 'message' : lbl, 'on_ok' : function() {
            self._copyFile(src, dest, name);
          }});
          return;
        }

        this._copyFile(src, dest, name);
      },

      _deleteFile : function(item, index, total) {
        var self = this;
        if ( item.type == "dir" ) {
          API.system.call("rmdir", item.path, function(result, error) {
            if ( index >= total ) {
              self.chdir(CURRENT_DIR, null, true);
            }
          });
        } else {
          API.system.call("rm", item.path, function(result, error) {
            if ( index >= total ) {
              self.chdir(CURRENT_DIR, null, true);
            }
          });
        }
      },

      deleteFile : function(items) {
        var self = this;
        var text = "";

        if ( items.length == 1 ) {
          text = items[0].name;
        } else if ( items.length > 1 ) {
          text = sprintf(LABELS.confirm_deletem, items.length);
        }

        var lbl = sprintf(LABELS.confirm_delete, text);

        this.createMessageDialog({'type' : "confirm", 'message' : lbl, 'on_ok' : function() {
          var i = 0, l = items.length;
          for ( i; i < l; i++ ) {
            self._deleteFile(items[i], i, l - 1);
          }
        }});
      },

      renameFile : function(item) {
        var self = this;
        this.createRenameDialog({'path' : item.name, 'on_apply' : function(nfname) {
          var src = item.path; // + '/' + item.name;
          var dst = item.root + '/' + nfname;

          API.system.call("rename", {"source" : src, "destination" : dst, "path" : item.path, "file" : nfname}, function(result, error) {
            if ( error === null ) {
              self.chdir(CURRENT_DIR, function(result, error) {
                if ( error === null ) {
                  self._root_window.iconview.selectItem("name", nfname);
                }
              }, true);
            }
          });
        }});
      },

      downloadFile : function(item) {
        var wurl = "/media-download/" + item.path;
        this._root_window.$element.find("iframe").remove();
        this._root_window.$element.append($(sprintf("<iframe src=\"%s\" style=\"display:none;\"></iframe>", wurl)));
      },

      changeView : function(v) {
        if ( v == "icon" ) {
          this._root_window.iconview._sortDir = "asc";
          this._root_window.iconview._sortCol = "name";
        }
        this._setArgv("view_type", v);
        this.chdir(CURRENT_DIR, null, true);
      },

      refreshView : function() {
        this.chdir(CURRENT_DIR, null, true);
      }
    });

    return new __ApplicationFileManager();
  };
})($);
