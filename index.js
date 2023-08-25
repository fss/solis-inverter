const SolisInverterClient = require('./lib/solis_inverter_client.js')
const { name } = require('./package.json')

let interval = parseInt(process.env.INTERVAL)
if (isNaN(interval) || interval < 30) {
  interval = 30
}

const port = 8000
const address = process.env.SOLIS_ADDRESS
const username = process.env.SOLIS_USERNAME
const password = process.env.SOLIS_PASSWORD

if (!address) {
  console.error('address not given')
  process.exit(1)
}

if (!port) {
  console.error('port not given')
  process.exit(1)
}

const inverter = new SolisInverterClient(address, username, password)

/**
 * @type {Object|null}
 */
let lastResponse = null

/**
 * @type {Date|null}
 */
let lastDate = new Date()

/**
 * @param what
 */
const log = what => console.log([(new Date()).toISOString(), name, what].join(' '))

/**
 * @return {Promise}
 */
const fetchData = () => {
  log(`fetching data from ${address}...`)
  return inverter.fetchData()
    .then(response => {
      if (!response) {
        log('no response')
      } else if (!response.inverter) {
        log('invalid response (no inverter info)')
      } else if (!response.inverter.serial) {
        log('invalid response (no inverter serial)')
      } else {
        // only store valid responses
        lastResponse = response
        lastDate.setTime(Date.now())
      }
    })
    .catch(err => log(`Could not fetch data from inverter: ${err}`))
}

require('http').createServer((req, res) => {
  if (lastResponse) {
    res.writeHead(200, { 'Last-Modified': lastDate.toString() })
    res.end(JSON.stringify(lastResponse))
  } else {
    res.writeHead(500)
    res.end('No data')
  }
})
  .listen(port, err => {
    if (err) {
      log(`unable to listen on port ${port}: ${err}`)
    } else {
      log(`listening on port ${port}`)
      fetchData().then(() => setInterval(fetchData, interval * 1000))
    }
  })
