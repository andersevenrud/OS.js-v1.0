<?php
/*!
 * @file
 * OS.js - JavaScript Operating System - template.php
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
 * @package OSjs.Frontend
 * template.php: Main HTML Template
 *
 * @author Anders Evenrud <andersevenrud@gmail.com>
 * @licence Simplified BSD License
 * @created 2012-02-10
 */

$current_locale = DEFAULT_LANGUAGE;
if ( $locale = Core::get()->getLocale() ) {
  $current_locale = $locale['locale_language'];
}

?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
  <!--
  OS.js - JavaScript Operating System - Main HTML Template

  Copyright (c) 2011-2012, Anders Evenrud <andersevenrud@gmail.com>
  All rights reserved.

  Redistribution and use in source and binary forms, with or without
  modification, are permitted provided that the following conditions are met: 

  1. Redistributions of source code must retain the above copyright notice, this
     list of conditions and the following disclaimer. 
  2. Redistributions in binary form must reproduce the above copyright notice,
     this list of conditions and the following disclaimer in the documentation
     and/or other materials provided with the distribution. 

  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
  ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
  WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
  DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR
  ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
  (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
  LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
  ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
  (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
  SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

  @package OSjs.Template
  @author  Anders Evenrud <andersevenrud@gmail.com>
  @licence Simplified BSD License
  -->

  <!-- Meta -->
  <title>OS.js Cloud/Web Desktop Platform Demo - <?php print PROJECT_VERSION; ?> (<?php print PROJECT_CODENAME; ?>)</title>

  <meta name="keywords" content="osjs,OS.js,Web Desktop,Cloud Desktop,Window Manager,Javascript OS" />
  <meta name="description" content="OS.js - A simple yet powerful JavaScript Web and Cloud Desktop Platfom using JavaScript and latest HTML5 and CSS features." />
  <meta name="author" content="<?php print PROJECT_AUTHOR; ?> <?php print PROJECT_CONTACT; ?>" />
  <meta name="viewport" content="width=device-width, initial-scale=1, user-scalable=no">
  <link rel="icon" type="image/png" href="/favicon.png" />

  <!-- Vendor -->
<?php
foreach ( CoreSettings::getPreload() as $key => $links ) {
  if ( $key == "code" ) {
    foreach ( $links as $code ) {
      print sprintf("  <script type=\"text/javascript\">\n%s\n  </script>\n", $code);
    }
  } else {
    foreach ( $links as $l ) {
      if ( preg_match("/\.css$/", $l) ) {
        print sprintf("  <link rel=\"stylesheet\" type=\"text/css\" href=\"/%s/%s\" />\n", $key, $l);
      } else {
        print sprintf("  <script charset=\"utf-8\" type=\"text/javascript\" src=\"/%s/%s\"></script>\n", $key, $l);
      }
    }
  }
}
?>

  <!-- OS.js --><?php if ( CACHE_COMBINED_RESOURCES ) { ?>

  <link rel="stylesheet" type="text/css" href="/VFS/resource/ALL.css" />
  <link rel="stylesheet" type="text/css" href="/VFS/theme/default" id="ThemeBase" />
  <link rel="stylesheet" type="text/css" href="/VFS/theme/none" id="ThemeFace" />
  <link rel="stylesheet" type="text/css" href="/VFS/cursor/default" id="CursorFace" />
  <link rel="stylesheet" type="text/css" href="/VFS/font/Sansation" id="FontFace" />
  <script charset="utf-8" type="text/javascript" src="/VFS/resource/ALL.js"></script>
  <script charset="utf-8" type="text/javascript" src="/VFS/language/<?php print $current_locale; ?>" id="LanguageFile"></script>
  <?php } else { ?>

  <link rel="stylesheet" type="text/css" href="/VFS/resource/main.css" />
  <link rel="stylesheet" type="text/css" href="/VFS/resource/dialogs.css" />
  <link rel="stylesheet" type="text/css" href="/VFS/resource/glade.css" />
  <link rel="stylesheet" type="text/css" href="/VFS/theme/default" id="ThemeBase" />
  <link rel="stylesheet" type="text/css" href="/VFS/theme/none" id="ThemeFace" />
  <link rel="stylesheet" type="text/css" href="/VFS/cursor/default" id="CursorFace" />
  <link rel="stylesheet" type="text/css" href="/VFS/font/Sansation" id="FontFace" />
  <script charset="utf-8" type="text/javascript" src="/VFS/resource/utils.js"></script>
  <script charset="utf-8" type="text/javascript" src="/VFS/resource/init.js"></script>
  <script charset="utf-8" type="text/javascript" src="/VFS/language/<?php print $current_locale; ?>" id="LanguageFile"></script>
  <script charset="utf-8" type="text/javascript" src="/VFS/resource/classes.js"></script>
  <script charset="utf-8" type="text/javascript" src="/VFS/resource/core.js"></script>
  <?php } ?>

<?php if ( GA_ENABLE ) { ?>
  <!-- Google Analytics -->
  <script type="text/javascript">
    var _gaq = _gaq || [];
    _gaq.push(['_setAccount', '<?php print GA_ACCOUNT_ID; ?>']);
    _gaq.push(['_trackPageview']);

    (function() {
      var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;
      ga.src = ('https:' == document.location.protocol ? 'https://ssl' : 'http://www') + '.google-analytics.com/ga.js';
      var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s);
    })();
  </script>
<?php } ?>

  <!-- OS.js Async -->

</head>
<body>

<!-- Home -->
<?php require_template ("index.home.php"); ?>

<script type="text/javascript"></script>
<noscript>Your browser does not support JavaScript and cannot launch the application.</noscript>

<!-- Login Window -->
<?php require_template ("index.login.php"); ?>

<?php if ( ENV_DEMO ) { ?>
<!-- Demo Notice -->
<div id="LoginDemoNotice">
  <p>
    <b>This is a demonstration version.</b> Some applications and features are disabled.
  </p>
  <p>
    <i>A user will be automatically created for you when you sign in if the given username is not taken.</i>
  </p>
</div>

<!-- Version Stamp -->
<div id="Version">
  OS.js version <?php print PROJECT_VERSION; ?> (<?php print PROJECT_CODENAME; ?>)<br />
  &copy; <?php print htmlspecialchars(PROJECT_COPYRIGHT); ?>
</div>
<?php } ?>


<!-- Main Container -->
<div id="Desktop">
  <!-- IconView -->
  <div id="DesktopGrid"></div>

  <!-- Notifications -->
  <div id="DesktopNotifications"></div>

  <!-- Context items -->
  <div id="ContextMenu">&nbsp;</div>
  <div id="ContextRectangle">&nbsp;</div>
  <div id="Tooltip">&nbsp;</div>
  <div id="WindowTogglerRect"></div>
  <div id="WindowToggler">
    <div id="WindowTogglerList"><ul></ul></div>
    <div id="WindowTogglerTitle"><span>Empty</span></div>
  </div>
  <div id="WindowDND"></div>

  <!-- Loaded content will appear here -->
</div>

</body>
</html>
