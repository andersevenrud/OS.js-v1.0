/*!
 * Application: ApplicationProcessingJS
 *
 * @package OSjs.Packages
 * @author Anders Evenrud <andersevenrud@gmail.com>
 * @licence Simplified BSD License
 * @class
 */
OSjs.Packages.ApplicationProcessingJS = (function($, undefined) {

  var _LINGUAS = {"en_US":{"title":"ProcessingJS"}};

  /**
   * @param GtkWindow     GtkWindow            GtkWindow API Reference
   * @param Application   Application          Application API Reference
   * @param API           API                  Public API Reference
   * @param Object        argv                 Application arguments (like cmd)
   * @param Array         windows              Application windows from session (restoration)
   */
  return function(GtkWindow, Application, API, argv, windows) {

    var LABELS = _LINGUAS[API.system.language()] || _LINGUAS["en_US"];

    ///////////////////////////////////////////////////////////////////////////
    // WINDOWS
    ///////////////////////////////////////////////////////////////////////////
    var Window_window1 = GtkWindow.extend({

      init : function(app) {
        this._super("Window_window1", false, app, windows);
        this._content = $('<div><div class="ApplicationProcessingJS GtkWindow window1"> </div></div>').html();
        this._title = LABELS.title;
        this._icon = 'emblems/emblem-system.png';
        this._is_draggable = true;
        this._is_resizable = false;
        this._is_scrollable = false;
        this._is_sessionable = true;
        this._is_minimizable = false;
        this._is_maximizable = false;
        this._is_closable = true;
        this._is_orphan = false;
        this._width = 210;
        this._height = 240;
        this._gravity = 'center';
      },

      destroy : function() {
        this._super();
      },

      create : function(id, mcallback) {
        var el = this._super(id, mcallback);
        var self = this;

        if ( el ) {
          // Do your stuff here
          var src = "/VFS/resource/ApplicationProcessingJS/processing.pjs";
          var canvas = $("<canvas width=\"200\" height=\"200\"></canvas>");
          el.find(".window1").append(canvas);

          console.log(canvas);

          $.ajax({
            url : src,
            data : {},
            success : function(data) {
              (function() {
                return (new Processing(canvas.get(0), data.toString()));
              })();
            },
            contentType : "application/processing",
            dataType : "text"
          });

        }

      }

    });

    ///////////////////////////////////////////////////////////////////////////
    // APPLICATION
    ///////////////////////////////////////////////////////////////////////////

    /**
     * Main Application Class
     * @class
     */
    var __ApplicationProcessingJS = Application.extend({

      init : function() {
        this._super("ApplicationProcessingJS", argv);
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

    return new __ApplicationProcessingJS();
  };
})($);

