/*!
 * PanelItem: PanelItemNotificationArea
 *
 * @package OSjs.Packages
 * @author Anders Evenrud <andersevenrud@gmail.com>
 * @licence Simplified BSD License
 * @class
 */
OSjs.Packages.PanelItemNotificationArea = (function($, undefined) {

  var _LINGUAS = {
    "en_US":{"title":"Notification Area"},
    "nb_NO":{"title":"Notifikasjons-område"}
  };

  /**
   * @param PanelItem     PanelItem           PanelItem API Reference
   * @param Panel         panel               Panel Instance Reference
   * @param API           API                 Public API Reference
   * @param Object        argv                Launch arguments (like cmd)
   */
  return function(PanelItem, panel, API, argv) {

    var LABELS = _LINGUAS[API.system.language()] || _LINGUAS["en_US"];

    ///////////////////////////////////////////////////////////////////////////
    // APPLICATION
    ///////////////////////////////////////////////////////////////////////////

    /**
     * @class
     */
    var NotificationItem = Class.extend({

      _index      : -1,
      _$element   : null,

      init : function(area, i) {
        var self  = this;
        var src   = API.ui.getIcon("status/network-idle.png", "16x16");
        var title = "Initializing...";
        var alt   = title;

        var s = $(sprintf("<div class=\"NotificationItem Item_%d\"><img alt=\"%s\" src=\"%s\" title=\"%s\" /></div>", i, alt, src, title));
        s.click(function(ev) {
          if ( ev.which > 1 ) {
            self._onRightClick();
          } else {
            self._onLeftClick();
          }
        });

        this._index     = i;
        this.$_element  = s;

        area.append(this.$_element);
      },

      destroy : function() {
        if ( this.$element ) {
          this.$element.remove();
        }
      },

      update : function(icon, title) {
        var img = this._$element.find("img");
        if ( icon ) {
          img.attr("src",   icon);
        }

        if ( title ) {
          img.attr("title", title);
          img.attr("alt",   title);
        }
      },

      _onLeftClick : function() {
        this.onLeftClick();
      },

      _onRightClick : function() {
        this.onRightClick();
      },

      onLeftClick : function() {},
      onRightClick : function() {},

      getIndex : function() {
        return this._index;
      },

      getElement : function() {
        return this._$element;
      }
    });

    /**
     * Main PanelItem Class
     * @class
     */
    var __PanelItemNotificationArea = PanelItem.extend({

      _items : [],

      init : function() {
        this._super("PanelItemNotificationArea");

        this._items = [];
      },

      destroy : function() {
        this.clearItems();

        this._super();
      },

      create : function(pos) {
        var ret = this._super(pos);
        // Do your stuff here

        ret.append("<div class=\"NotificationArea\"></div>");

        //this.createItem();

        return ret;
      },

      clearItems : function() {
        var i = 0, l = this._items.length;
        for ( i; i < l; i++ ) {
          this._items[i].destroy();
        }

        this._items = [];
      },

      createItem : function() {
        var l = this._items.length;
        var e = this.$element.find(".NotificationArea");
        var i = new NotificationItem(e, l);

        this._items.push(i);

        return i;
      },

      removeItem : function(ref) {
        if ( this._items[ref] ) {
          this._items[ref].destroy();
          this._items.splice(ref, 1);

          return true;
        }

        return false;
      }
    });

    return new __PanelItemNotificationArea();
  };
})($);

