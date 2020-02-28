const SolisInverterClient = require('./lib/solis_inverter_client.js')
const { name } = require('./package.json')

const { address, username, password, port } = require('yargs').argv
if (!address) {
  console.error('port not given')
  process.exit(1)
}

if (!port) {
  console.error('port not given')
  process.exit(1)
}

const solis = new SolisInverterClient(address, username, password)

let lastResponse = null
let lastDate = null

/**
 * @param what
 */
const log = what => console.log([(new Date()).toISOString(), name, what].join(' '))

const server = require('http').createServer((req, res) => {
  log(`received request from ${req.connection.remoteAddress}`)

  solis.fetchData()
    .then(data => {
      lastResponse = data
      lastDate = new Date()

      res.writeHead(200, { 'Last-Modified': lastDate.toString() })
      res.end(JSON.stringify(lastResponse))
    })
    .catch(error => {
      log(`got error: ${error}`)

      if (lastResponse) {
        res.writeHead(200, { 'Last-Modified': lastDate.toString() })
        res.end(JSON.stringify(lastResponse))
      } else {
        res.writeHead(500)
        res.end(JSON.stringify({ error: error.toString() }))
      }
    })
})

server.listen(port, err => {
  if (err) {
    log(`unable to listen on port ${port}: ${err}`)
  } else {
    log(`listening on port ${port}`)
  }
})
