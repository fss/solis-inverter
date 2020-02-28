const SolisInverterClient = require('./lib/solis_inverter_client.js')
const { name } = require('./package.json')

let { address, username, password, port, interval } = require('yargs').argv
if (!address) {
  console.error('port not given')
  process.exit(1)
}

if (!port) {
  console.error('port not given')
  process.exit(1)
}

if (!interval || interval < 30000) {
  interval = 30000
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

const server = require('http').createServer((req, res) => {
  if (lastResponse) {
    res.writeHead(200, { 'Last-Modified': lastDate.toString() })
    res.end(JSON.stringify(lastResponse))
  } else {
    res.writeHead(500)
    res.end('No data')
  }
})

/**
 * @return {Promise}
 */
const fetchData = () => inverter.fetchData()
  .then(data => {
    lastResponse = data
    lastDate.setTime(Date.now())
  })
  .catch(err => log(`Could not fetch data from inverter: ${err}`))

server.listen(port, err => {
  if (err) {
    log(`unable to listen on port ${port}: ${err}`)
  } else {
    log(`listening on port ${port}`)
    fetchData().then(() => setInterval(fetchData, interval))
  }
})
