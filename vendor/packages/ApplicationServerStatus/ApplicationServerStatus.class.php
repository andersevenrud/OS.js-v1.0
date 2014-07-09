<?php
/*!
 * @file
 * OS.js - JavaScript Operating System - Contains ApplicationServerStatus Class
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
 * ApplicationServerStatus Class
 *
 * @author  Anders Evenrud <andersevenrud@gmail.com>
 * @package OSjs.Applications
 * @class
 */
class ApplicationServerStatus
  extends Application
{

  /**
   * Create a new instance
   */
  public function __construct() {
    //parent::__construct();
  }

  private static function ConvertSize($bytes, $base = 1024) {
    $si_prefix  = array( 'B', 'KB', 'MB', 'GB', 'TB', 'EB', 'ZB', 'YB' );
    $class      = min((int)log($bytes , $base) , count($si_prefix) - 1);
    return sprintf('%1.2f' , $bytes / pow($base,$class)) . ' ' . $si_prefix[$class];
  }

  private static function GetServiceInfo() {
    $result     = false;
    $services   = Array("apache2", "mysql", "rsync");

    foreach ( $services as $s ) {
      @exec("service $s status", $cmdout, $retval);
      if ( ($retval === 0) && sizeof($cmdout) ) {
        if ( !$result ) {
          $result = Array();
        }

        foreach ( $cmdout as $c ) {
          $result[$s] = true;
        }
      } else {
        $result[$s] = false;
      }
    }

    return $result;
  }

  private static function GetSystemInfo() {
    $result = Array(
      "memory" => Array(),
      "cpu"    => Array(),
      "uptime" => Array(),
      "load"   => Array()
    );

    if ( $tmeminfo = file_get_contents("/proc/meminfo") ) {
      foreach ( explode("\n", $tmeminfo) as $t ) {
        $tt = explode(": ", preg_replace("/\s+/", " ", $t));
        if ( !(trim($tt[0])) )
          continue;

        $result["memory"][$tt[0]] = isset($tt[1]) ? $tt[1] : null;
      }
    }

    if ( $tcpuinfo = file_get_contents("/proc/cpuinfo") ) {
      $index = 0;
      foreach ( explode("\n", $tcpuinfo) as $t ) {
        $tt = explode(" : ", preg_replace("/\s+/", " ", $t));
        if ( !trim($tt[0]) )
          continue;

        if ( !isset($result["cpu"][$index]) ) {
          $result["cpu"][$index] = Array();
        }
        if ( $tt[0] == "processor" ) {
          $index = ((int) $tt[1]);
        }

        $result["cpu"][$index][$tt[0]] = isset($tt[1]) ? $tt[1] : null;
      }
    }

    if ( $tmp = file_get_contents("/proc/uptime") ) {
      $expl = explode(" ", $tmp);
      if ( sizeof($expl) == 2 ) {
        $result["uptime"] = Array(
          "uptime" => (float)$expl[0],
          "idle"   => (float)$expl[1]
        );
      }
    }

    if ( $tmp = file_get_contents("/proc/loadavg") ) {
      $expl = explode(" ", $tmp);
      if ( sizeof($expl) == 5 ) {
        $result["load"] = Array(
          "average" => sprintf("%f %f %f", (float)$expl[0], (float)$expl[1], (float)$expl[2]),
          "running" => trim($expl[3]),
          "lastid"  => trim($expl[4])
        );
      }
    }

    return $result;
  }

  private static function GetFilesystemInfo() {
    $result = false;

    @exec("mount | grep ^/dev", $cmdout, $retval);
    if ( ($retval === 0) && sizeof($cmdout) ) {
      $mounts = Array();
      foreach ( $cmdout as $o ) {
        if ( preg_match("/^\/dev\/(.*) on (.*) type (.*) \((.*)\)/", $o, $m) ) {
          $mounts[$m[1]] = Array(
            "device"      => $m[1],
            "mountpoint"  => $m[2],
            "filesystem"  => $m[3],
            "options"     => explode(",", $m[4])
          );
        }
      }

      if ( sizeof($mounts) ) {
        $result = Array();
        foreach ( $mounts as $mount => $info ) {
          //$free   = disk_free_space("/dev/$mount");
          //$total  = disk_total_space("/dev/$mount");
          $free   = disk_free_space($info["mountpoint"]);
          $total  = disk_total_space($info["mountpoint"]);

          $result[$mount] = Array(
            "free"      => $free,
            "free_h"    => self::ConvertSize($free),

            "total"     => $total,
            "total_h"   => self::ConvertSize($total),

            "info"      => $info
          );

          unset($free);
          unset($total);
        }
      }
    }
    return $result;
  }

  public static function Event($action, Array $args) {
    $result = false;
    switch ( $action ) {
      case "services"   :
        $result = self::GetServiceInfo();
      break;
      case "system"     :
        $result = self::GetSystemInfo();
      break;
      case "filesystem" :
        $result = self::GetFilesystemInfo();
      break;
      default :

        $log = <<<EOTXT
Dec  4 09:19:42 amitop kernel: [    0.000000]   #31 [0001d83ac0 - 0001d83b28]         BOOTMEM
Dec  4 09:19:42 amitop kernel: [    0.000000]   #32 [0001d83b40 - 0001d83ba8]         BOOTMEM
Dec  4 09:19:42 amitop kernel: [    0.000000]   #33 [0001d83bc0 - 0001d83c28]         BOOTMEM
Dec  4 09:19:42 amitop kernel: [    0.000000]   #34 [0001d83c40 - 0001d83ca8]         BOOTMEM
Dec  4 09:19:42 amitop kernel: [    0.000000]   #35 [0001d83cc0 - 0001d83d28]         BOOTMEM
Dec  4 09:19:42 amitop kernel: [    0.000000]   #36 [0001d83d40 - 0001d83da8]         BOOTMEM
Dec  4 09:19:42 amitop kernel: [    0.000000]   #37 [0001d83dc0 - 0001d83e28]         BOOTMEM
Dec  4 09:19:42 amitop kernel: [    0.000000]   #38 [0001d83e40 - 0001d83ea8]         BOOTMEM
Dec  4 09:19:42 amitop kernel: [    0.000000]   #39 [0001d83ec0 - 0001d83f28]         BOOTMEM
Dec  4 09:19:42 amitop kernel: [    0.000000]   #40 [0001d83f40 - 0001d83fa8]         BOOTMEM
Dec  4 09:19:42 amitop kernel: [    0.000000]   #41 [0001d85000 - 0001d85068]         BOOTMEM
Dec  4 09:19:42 amitop kernel: [    0.000000]   #42 [0001d85080 - 0001d850e8]         BOOTMEM
Dec  4 09:19:42 amitop kernel: [    0.000000]   #43 [0001d85100 - 0001d85168]         BOOTMEM
Dec  4 09:19:42 amitop kernel: [    0.000000]   #44 [0001d85180 - 0001d851e8]         BOOTMEM
Dec  4 09:19:42 amitop kernel: [    0.000000]   #45 [0001d85200 - 0001d85268]         BOOTMEM
Dec  4 09:19:42 amitop kernel: [    0.000000]   #46 [0001d85280 - 0001d852e8]         BOOTMEM
Dec  4 09:19:42 amitop kernel: [    0.000000]   #47 [0001d85300 - 0001d85368]         BOOTMEM
Dec  4 09:19:42 amitop kernel: [    0.000000]   #48 [0001d85380 - 0001d853e8]         BOOTMEM
Dec  4 09:19:42 amitop kernel: [    0.000000]   #49 [0001d85400 - 0001d85468]         BOOTMEM
Dec  4 09:19:42 amitop kernel: [    0.000000]   #50 [0001d85480 - 0001d854e8]         BOOTMEM
Dec  4 09:19:42 amitop kernel: [    0.000000]   #51 [0001d85500 - 0001d85568]         BOOTMEM
Dec  4 09:19:42 amitop kernel: [    0.000000]   #52 [0001d85580 - 0001d855e8]         BOOTMEM
Dec  4 09:19:42 amitop kernel: [    0.000000]   #53 [0001d85600 - 0001d85668]         BOOTMEM
Dec  4 09:19:42 amitop kernel: [    0.000000]   #54 [0001d85680 - 0001d856e8]         BOOTMEM
Dec  4 09:19:42 amitop kernel: [    0.000000]   #55 [0001d83fc0 - 0001d83fe0]         BOOTMEM
Dec  4 09:19:42 amitop kernel: [    0.000000]   #56 [0001d85700 - 0001d85720]         BOOTMEM
Dec  4 09:19:42 amitop kernel: [    0.000000]   #57 [0001d85740 - 0001d85760]         BOOTMEM
Dec  4 09:19:42 amitop kernel: [    0.000000]   #58 [0001d85780 - 0001d857a0]         BOOTMEM
Dec  4 09:19:42 amitop kernel: [    0.000000]   #59 [0001d857c0 - 0001d857e0]         BOOTMEM
Dec  4 09:19:42 amitop kernel: [    0.000000]   #60 [0001d85800 - 0001d8586a]         BOOTMEM
Dec  4 09:19:42 amitop kernel: [    0.000000]   #61 [0001d85880 - 0001d858ea]         BOOTMEM
Dec  4 09:19:42 amitop kernel: [    0.000000]   #62 [0001e00000 - 0001e1e000]         BOOTMEM
Dec  4 09:19:42 amitop kernel: [    0.000000]   #63 [0001e80000 - 0001e9e000]         BOOTMEM
Dec  4 09:19:42 amitop kernel: [    0.000000]   #64 [0001f00000 - 0001f1e000]         BOOTMEM
Dec  4 09:19:42 amitop kernel: [    0.000000]   #65 [0001f80000 - 0001f9e000]         BOOTMEM
Dec  4 09:19:42 amitop kernel: [    0.000000]   #66 [0001d87900 - 0001d87908]         BOOTMEM
Dec  4 09:19:42 amitop kernel: [    0.000000]   #67 [0001d87940 - 0001d87948]         BOOTMEM
Dec  4 09:19:42 amitop kernel: [    0.000000]   #68 [0001d87980 - 0001d87990]         BOOTMEM
Dec  4 09:19:42 amitop kernel: [    0.000000]   #69 [0001d879c0 - 0001d879e0]         BOOTMEM
Dec  4 09:19:42 amitop kernel: [    0.000000]   #70 [0001d87a00 - 0001d87b30]         BOOTMEM
Dec  4 09:19:42 amitop kernel: [    0.000000]   #71 [0001d87b40 - 0001d87b90]         BOOTMEM
Dec  4 09:19:42 amitop kernel: [    0.000000]   #72 [0001d87bc0 - 0001d87c10]         BOOTMEM
Dec  4 09:19:42 amitop kernel: [    0.000000]   #73 [0001d87c40 - 0001d8fc40]         BOOTMEM
Dec  4 09:19:42 amitop kernel: [    0.000000]   #74 [0001d85900 - 0001d85b40]         BOOTMEM
Dec  4 09:19:42 amitop kernel: [    0.000000]   #75 [0001f9e000 - 0005f9e000]         BOOTMEM
Dec  4 09:19:42 amitop kernel: [    0.000000]   #76 [0001d8fc40 - 0001dafc40]         BOOTMEM
Dec  4 09:19:42 amitop kernel: [    0.000000]   #77 [0001dafc40 - 0001defc40]         BOOTMEM
Dec  4 09:19:42 amitop kernel: [    0.000000]   #78 [000001a800 - 0000022800]         BOOTMEM
EOTXT;

        $result = Array(
          "services"    => self::GetServiceInfo(),
          "system"      => self::GetSystemInfo(),
          "filesystem"  => self::GetFilesystemInfo(),
          "events"      => $log
        );
      break;
    }
    return $result;
  }
}

?>
