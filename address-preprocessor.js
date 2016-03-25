var R = require('ramda')

// Examples:
// Morris
// Sullivan
// W. 25th
// Rivington
// Amos
// Columbia
// Fourth
// Monroe
// Fourth
// Broadway
// W. 17th
// Rivington
// W. 18th
// Madison
// Cedar
// Hudson
// Fourth
// Broadway
// W. 20th
// Hudson
// Merchants Ex
// Anthony
// E.
// Fourth
// W. 25th
// W. Broadway
// Goerck
// Av. 8
// W. 35th

var avenues = [
  'First',
  'Second',
  'Third',
  'Fourth',
  'Fifth',
  'Sixth',
  'Seventh',
  'Eighth',
  'Ninth',
  'Tenth',
  'Eleventh',
  'Twelth'
]

var avenue = (s) => {
  if (R.contains(s, avenues)) {
    return `${s} Avenue`
  }

  // Check for strings like 'Avenue 8'
  var aveN = s.match(/Avenue (\d+)/)
  if (aveN) {
    var ave = parseInt(aveN[1])
    return `${avenues[ave - 1]} Avenue`
  }

  return s
}

// TODO: use abbreviations list

var notStreets = [
  'Avenue',
  'Broadway',
  'Bowery',
  'Market',
  'Place',
  'Court',
  'Square',
  'Lane',
  'Exchange'
]

var street = (s) => {
  if (!s.length) {
    return s
  }

  if (R.any(R.contains(R.__, s.toLowerCase()), notStreets.map((str) => str.toLowerCase()))) {
    return s
  }

  return `${s} Street`
}

var fixes = [
  ['2d', '2nd'],
  ['3d', '3rd'],
  [/ [Cc]t\.?/, ' Court'],
  [/ [sS]t\.?/, ' Street'],
  [/ [aA]v\.?/, ' Avenue'],
  [/^[aA]v\.?/, 'Avenue'],
  [/^E\.? /, 'East '],
  [/^W\.? /, 'West '],
  [/^N\.? /, 'North '],
  [/^S\.? /, 'South '],
  [/ mkt$/, ' Market'],
  [/ pl$/, ' Place'],
  [/ la$/, ' Lane'],
  [/ sq$/, ' Square'],
  [/[bB]\'way/, 'Broadway'],
  ['Broadwry', 'Broadway'],
  ['Chanv bers', 'Chambers'],
  ['Exch\'nge', 'Exchange'],
  ['Nassaii', 'Nassau'],
  ['llth', '11th'],
  ['WalL', 'Wall'],
  ['Gouvei\'neur', 'Gouverneur'],
  ['Div\'sn', 'Division'],
  ['Bow\'y', 'Bowery'],
  ['G\'wich', 'Greenwich'],
  ['C\'hrystie', 'Chrystie']
]

var fix = (s) => {
  fixes.forEach(f => {
    s = s.replace(f[0], f[1])
  })
  return s
}

var reject = (s) => {
  return s
}

var functions = [
  R.trim,
  fix,
  avenue,
  street,
  reject
]

module.exports = R.reduce((v, f) => f(v), R.__, functions)
