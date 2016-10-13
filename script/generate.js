/**
 * @author Titus Wormer
 * @copyright 2014 Titus Wormer
 * @license MIT
 * @module afinn-96:script
 * @fileoverview Generate
 */

'use strict';

/* eslint-disable babel/new-cap */

/* Dependencies. */
var fs = require('fs');
var http = require('http');
var Transform = require('readable-stream').Transform;
var unzip = require('unzip');
var csv = require('csv-streamify');
var wrap = require('wrap-stream');
var join = require('join-stream');
var bail = require('bail');

/* Constants. */
var url = 'http://www2.imm.dtu.dk/pubdb/views/edoc_download.php/6010/zip/imm6010.zip';

/* Read. */
http
  .get(url, function (res) {
    res
      .resume()
      .pipe(new unzip.Parse())
      .on('error', bail)
      .on('entry', function (entry) {
        if (entry.path !== 'AFINN/AFINN-96.txt') {
          entry.autodrain();
          return;
        }

        entry
          .pipe(csv({delimiter: '\t', objectMode: true}))
          .pipe(new Transform({
            objectMode: true,
            transform: function (chunk, encoding, callback) {
              this.push('  "' + chunk[0] + '": ' + chunk[1]);
              callback();
            }
          }))
          .pipe(join(',\n'))
          .pipe(wrap('{\n', '\n}\n'))
          .pipe(fs.createWriteStream('index.json'));
      });
  })
  .on('error', bail);
