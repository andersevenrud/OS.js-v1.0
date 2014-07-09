/*!
 * @file
 * OS.js - JavaScript Operating System - ApplicationArchiver node.js script
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
 * @author  Anders Evenrud <andersevenrud@gmail.com>
 * @licence Simplified BSD License
 * @created 2013-01-27
 */
"use strict";

///////////////////////////////////////////////////////////////////////////////
// IMPORTS
///////////////////////////////////////////////////////////////////////////////

var _config = require('../../../config.js'), // vendor/packages/<package>
    _user   = require(_config.PATH_SRC + '/user.js'),
    _vfs    = require(_config.PATH_SRC + '/vfs.js');

var _path     = require('path'),
    _fs       = require('fs'),
    _sprintf  = require('sprintf').sprintf;

///////////////////////////////////////////////////////////////////////////////
// FUNCTIONS
///////////////////////////////////////////////////////////////////////////////

/**
 * Perform XHR event from API
 * @param   Object      req         external request object
 * @param   String      action      Action name
 * @param   Object      args        Arguments
 * @param   Function    callback    Callback function [success, result/error]
 * @return  void
 */
function DefaultEvent(req, action, args, callback) {
  var user = req.session.user || null;

  switch ( action ) {
    case 'extract' :
      _vfs.call(user, 'extract_archive', args, callback);
    break;

    case 'browse' :
      _vfs.call(user, 'ls_archive', args.path, function(success, result) {
        if ( success ) {
          var items = [];
          var bytes = 0;

          var iter;
          for ( var i in result ) {
            if ( result.hasOwnProperty(i) ) {
              iter = result[i];
              iter.name = i;

              bytes += iter.size;
              items.push(iter);
            }
          }

          callback(true, {
            items : items,
            bytes : bytes
          });
        } else {
          callback(false, result);
        }
      });
    break;

    default :
      callback(false, action + ' is not implemented in ApplicationArchiver!');
    break;
  }
}

///////////////////////////////////////////////////////////////////////////////
// EXPORTS
///////////////////////////////////////////////////////////////////////////////

module.exports = {

  /**
   * package::Event() -- Perform Package API Event
   * @see DefaultEvent()
   */
  Event : function(req, action, args, callback) {
    console.log('ApplicationArchiver::Event()', req, action, args);

    DefaultEvent(req, action, args, callback);
  }

};

