const { address, username, password } = require('./config.json')

const SolisInverter = require('./lib/solis_inverter.js')
const inverter = new SolisInverter(address, username, password)

const onData = data => {
  console.log('inverter data', data)
}

inverter.fetchData().then(data => {
  onData(data)

  setInterval(() => {
    inverter.fetchData().then(onData)
  }, 10000)
})
