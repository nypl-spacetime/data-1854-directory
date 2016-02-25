'use strict'
var fs = require('fs')
var path = require('path')
var csv = require('csv-parser')
var H = require('highland')
var preprocessor = require('./address-preprocessor')
const chalk = require('chalk');

var writeObjects = function (writer, object, callback) {
  writer.writeObject(object, function (err) {
    callback(err)
  })
}

const DEBUG = false

// Example row:
//   scan_id: '3977623',
//   entry_number: '41164106',
//   last_name: 'Allen',
//   first_name: 'John',
//   profession: 'physician',
//   street_number: '70',
//   street_name: 'Nassaii',
//   address_raw: '70 Nassaii, ',
//   home_street_number: '79',
//   home_street_name: 'E. 40th',
//   home_address_raw: '79 E. 40th',
//   raw_text: 'Allen John, physician, 70 Nassaii, h. 79 E. 40th'

function convertRow (row) {
  // TODO: also use row.home_address_raw (in that case, two addresses per person)

  // TODO: use official names from ontology
  var streetNumber = row.street_number
  var streetName = row.street_name

  // Apply all address preprocess functions over original street name
  var before = streetName

  streetName = preprocessor(streetName)

  if (!streetName) {
    if (DEBUG) {
      console.log(chalk.red('No street name 😩 '), chalk.gray(row.raw_text))
    }

    return []
  } else {
    var address = `${streetNumber} ${streetName}`
    var name = `${row.first_name} ${row.last_name}`

    if (DEBUG) {
      var nameProfession = `${name} - ${row.profession}`
      console.log(chalk.blue(before), '→', chalk.green(streetName), chalk.magenta(nameProfession), chalk.gray(row.raw_text))
    }

    var id = `${row.scan_id}.${row.entry_number}`
    var personId = `${id}p`
    var addressId = `${id}a`

    return [
      {
        type: 'pit',
        obj: {
          id: personId,
          name: name,
          type: 'st:Person',
          validSince: 1854,
          validUntil: 1864,
          data: {
            scanId: parseInt(row.scan_id),
            entryNumber: parseInt(row.entry_number),
            profession: row.profession,
            firstName: row.first_name,
            lastName: row.last_name
          }
        }
      },

      {
        type: 'relation',
        obj: {
          from: personId,
          to: addressId,
          type: 'hg:liesIn'
        }
      },

      {
        type: 'pit',
        obj: {
          id: addressId,
          name: address,
          type: 'hg:Address',
          validSince: 1854,
          validUntil: 1864,
          data: {
            number: streetNumber,
            street: streetName
          }
        }
      }
    ]
  }
}

function convert (config, dir, writer, callback) {
  var lines = fs.createReadStream(path.join(__dirname, '1854-directory.csv'))
    .pipe(csv())

  H(lines)
    .map(convertRow)
    .errors(function (err) {
      console.error(err)
    })
    .flatten()
    .compact()
    .map(H.curry(writeObjects, writer))
    .nfcall([])
    .series()
    .stopOnError(function (err) {
      callback(err)
    })
    .done(function () {
      callback()
    })
}

// ==================================== API ====================================

module.exports.steps = [
  convert
]
