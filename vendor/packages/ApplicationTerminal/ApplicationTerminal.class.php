<?php
/*!
 * @file
 * OS.js - JavaScript Operating System - Contains ApplicationTerminal Class
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
 * ApplicationTerminal Class
 *
 * @author  Anders Evenrud <andersevenrud@gmail.com>
 * @package OSjs.Applications
 * @class
 */
class ApplicationTerminal
  extends Application
{

  /**
   * Create a new instance
   */
  public function __construct() {
    parent::__construct();
  }


  public static function Event($action, Array $args) {
    if ( $action == "version" ) {
      return Array(
        "author" => PROJECT_AUTHOR,
        "contact" => PROJECT_CONTACT,
        "version" => PROJECT_VERSION,
        "codename" => PROJECT_CODENAME,
        "copyright" => PROJECT_COPYRIGHT
      );
    } else if ( $action == "dump" ) {
      if ( !($user = Core::get()->getUser()) || !$user->isAdmin() ) {
        return sprintf("You do not have permissions to perform this operation (%s)!", $user ? ($user->privilege) : -1);
      }

      $data = Array();
      $arg  = explode(" ", $args["arg"]);
      $arg2 = isset($arg[1]) ? $arg[1] : null;

      switch ( $arg[0] ) {
        case "define" :
          $data = get_defined_constants(true);
          if ( $arg2 !== null ) {
            if ( isset($data[$arg2]) ) {
              $data = $data[$arg2];
            } else {
              $data = Array("keys" => array_keys($data));
            }
          }
        break;

        default :
          $data = Array("commands" => Array("define"));
        break;
      }

        return @JSON::encode($data);
    }
    return false;
  }

}

?>
