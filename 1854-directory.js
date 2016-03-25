'use strict'
var fs = require('fs')
var path = require('path')
var csv = require('csv-parser')
var H = require('highland')
var preprocessor = require('./address-preprocessor')
const chalk = require('chalk');

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

// Keep all address IDs to ensure each address is only added once
var addressIds = {}

function convertRow (row) {
  var objects = []

  // TODO: also use row.home_address_raw (in that case, two addresses per person)

  // TODO: use official names from ontology
  var streetNumber = row.street_number
  var streetName = row.street_name

  // Apply all address preprocess functions over original street name
  var before = streetName

  streetName = preprocessor(streetName)

  if (!streetName) {
    console.log(chalk.red('No street name 😩 '), chalk.gray(row.raw_text))
    objects.push({
      type: 'log',
      obj: {
        found: false,
        message: 'No street name 😩 ',
        raw_text: row.raw_text
      }
    })
  } else {
    var address = `${streetNumber} ${streetName}`
    var name = `${row.first_name} ${row.last_name}`

    var nameProfession = `${name} - ${row.profession}`
    console.log(chalk.blue(before), '→', chalk.green(streetName), chalk.magenta(nameProfession), chalk.gray(row.raw_text))
    objects.push({
      type: 'log',
      obj: {
        found: true,
        from: before,
        to: streetName,
        raw_text: row.raw_text
      }
    })

    var id = `${row.scan_id}.${row.entry_number}`
    var personId = `${id}p`

    // var addressId = `${id}a`
    // TODO: create util.stringNormalize or something similar
    var addressId = address.toLowerCase().replace(/\s+/g, '-').replace(/'/g, '')

    objects.push({
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
    })

    objects.push({
      type: 'relation',
      obj: {
        from: personId,
        to: addressId,
        type: 'hg:liesIn'
      }
    })

    if (!addressIds[addressId]) {
      objects.push({
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
      })
      addressIds[addressId] = true
    }
  }

  return objects
}

function transform (config, dirs, tools, callback) {
  var lines = fs.createReadStream(path.join(__dirname, '1854-directory.csv'))
    .pipe(csv())

  H(lines)
    .map(convertRow)
    .stopOnError(callback)
    .flatten()
    .compact()
    .map(H.curry(tools.writer.writeObject))
    .nfcall([])
    .series()
    .stopOnError(callback)
    .done(callback)
}

// ==================================== API ====================================

module.exports.steps = [
  transform
]
