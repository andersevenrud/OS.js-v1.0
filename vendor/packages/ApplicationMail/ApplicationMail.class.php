<?php
/*!
 * @file
 * OS.js - JavaScript Operating System - Contains ApplicationMail Class
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
 * @created 2011-05-23
 */

/**
 * ApplicationMail Class
 *
 * @author  Anders Evenrud <andersevenrud@gmail.com>
 * @package OSjs.Applications
 * @class
 */
class ApplicationMail
  extends Application
{

  /**
   * Create a new instance
   */
  public function __construct() {
    parent::__construct();
  }

  public static function Event($action, Array $args) {
    require_once PATH_LIB . "/IMAP.php";

    $result   = false;
    $error    = false;
    $host     = "";
    $username = "";
    $password = "";
    $folder   = isset($args['folder']) ? addslashes($args['folder']) : "INBOX";

    if ( isset($args['account']) ) {
      $host       = addslashes($args['account']['host']);
      $username   = addslashes($args['account']['username']);
      $password   = addslashes($args['account']['password']);
    }

    try {

      if ( $action == "updateMessage" ) {
        $result = false;
        $ids    = isset($args['uids']) ? $args['uids'] : Array();
        $method = isset($args['method']) ? $args['method'] : null;

        if ( $imap = IMAP::create($host, $username, $password, $folder) ) {
          if ( $ids && $method ) {
            $result = Array(
              "items" => Array(),
              "method" => $method
            );
            foreach ( $ids as $id ) {
              $res = false;
              if ( $method == "delete" ) {
                $res = $imap->deleteMessage($id);
              } else if ( $method == "read" ) {
                $res = $imap->toggleMessageRead($id, true);
              } else if ( $method == "unread" ) {
                $res = $imap->toggleMessageRead($id, false);
              }
              $result['items'][$id] = $res;
            }
          }

          // TODO: [Close connection and] check if any change occured
          unset($imap);
        }
      } else if ( $action == "sendMessage" ) {
        $headers = isset($args['headers']) ? $args['headers'] : Array();
        $myargs  = Array(
          "from"        => sprintf("%s <%s>", addslashes($args['user']['name']), addslashes($args['user']['email'])),
          "to"          => addslashes($args['message']['to']),
          "subject"     => addslashes($args['message']['subject']),
          "plain"       => $args['message']['plain'],
          "html"        => $args['message']['html'],
          "attachments" => isset($args['attachments']) ? $args['attachments'] : Array()
        );

        $result = SMTP::send(IMAPMail::compose($myargs), Array(
          "host"      => $host,
          "username"  => $username,
          "password"  => $password
        ), $headers);
      } else {

        if ( $imap = IMAP::create($host, $username, $password, $folder) ) {
          if ( $action == "enumFolders" ) {
            if ( $boxes = $imap->getMailboxes() ) {
              $result = Array();
              foreach ( $boxes as $box ) {
                $result[] = Array(
                  "name"        => ($box['name']),
                  "delimiter"   => ($box['delimiter']),
                  "attributes"  => ($box['attributes'])
                );
              }
            }
          } else if ( $action == "enumMessages" ) {
            $fname  = (isset($args['folder']) && ($args['folder'])) ? addslashes($args['folder']) : false;
            $filter = (isset($args['filter']) && ($args['filter'])) ? addslashes($args['filter']) : false;
            $items  = Array();
            $lastId = -1;

            if ( $messages = $imap->getMessages($filter) ) {
              foreach ( $messages as $msg ) {
                $id = (int) $msg['uid'];
                if ($id > $lastId )
                  $lastId = $id;

                $items[$id] = $msg;
              }

              krsort($items);
            }

            $result = Array(
              "folder"    => $fname,
              "filter"    => $filter,
              "lastId"    => (int) $lastId,
              "messages"  => array_values($items)
            );
          } else if ( ($action == "readMessage") && isset($args['id']) ) {
            $result = $imap->read((int) $args['id']);
          }
        }
      }
    } catch ( Exception $e ) {
      $error = $e->getMessage();
    }

    return Array("result" => $result, "error" => $error);
  }

}

?>
