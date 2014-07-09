<?php
/*!
 * @file
 * OS.js - JavaScript Operating System - Contains ApplicationIDE Class
 *
 * * Copyright (c) 2011-2012, Anders Evenrud <andersevenrud@gmail.com> <andersevenrud@gmail.com>
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
 * @author Anders Evenrud <andersevenrud@gmail.com>
 * @licence Simplified BSD License
 * @created 2011-06-16
 */

/**
 * ApplicationIDE Class
 *
 * @author  Anders Evenrud <andersevenrud@gmail.com>
 * @package OSjs.Applications
 * @class
 */
class ApplicationIDE
  extends Application
{

  /**
   * Create a new instance
   */
  public function __construct() {
    parent::__construct();
  }

  public static function Event($action, Array $args) {
    if ( $action == "OpenProject" ) {
      if ( isset($args['name']) ) {
        $req_name = basename(trim(addslashes($args["name"])));
        $package = null;
        $basepath = "";

        $user = Core::get()->getUser();
        if ( $packages = PackageManager::GetPackages($user) ) {
          foreach ( $packages as $cat => $pkgs ) {
            foreach ( $pkgs as $name => $pkg ) {
              if ( $name == $req_name ) {
                if ( $cat == "System" ) {
                  $basepath = sprintf(RESOURCE_PACKAGE, $name, "");
                } else {
                  $basepath = sprintf(RESOURCE_VFS_PACKAGE, $user->id, $name, "");
                }
                $package = $pkg;
                break;
              }
            }
          }
        }

        if ( $package ) {
          $result = Array(
            "metadata" => "",
            "files"    => Array()
          );

          $path = sprintf("%s/%s", $basepath, "metadata.xml");
          $result["files"]["metadata.xml"] = file_get_contents($path);
          $result["metadata"] = $result["files"]["metadata.xml"];

          if ( isset($package["schema"]) && ($s = $package["schema"]) ) {
            $path = sprintf("%s/%s", $basepath, $s);
            $result["files"][$s] = file_get_contents($path);
          }

          foreach ( $package["resources"] as $res ) {
            $path = sprintf("%s/%s", $basepath, $res);
            $result["files"][$res] = file_get_contents($path);
          }

          // Clean up
          foreach ( $result['files'] as $k => $v ) {
            $k = htmlspecialchars($k);
            $result['files'][$k] = htmlentities($v);
          }

          return $result;
        }

      }
    }
    return false;
  }


}

?>
