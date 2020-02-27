const axios = require('axios')
const { JSDOM } = require('jsdom')

const { username, password, address } = require('./config.json')

const client = axios.create({
  baseURL: `http://${address}`,
  auth: { username, password },
  responseType: 'document'
})

/**
 * @param {string} variableName
 * @return {RegExp}
 */
const createRegexp = variableName => new RegExp(`var ${variableName} = "(.*)";`)

/**
 * @param {String} variableName
 * @return {function(*=): string}
 */
const extractString = variableName => scriptContents => {
  const rx = createRegexp(variableName)
  const res = rx.exec(scriptContents)
  return res ? res[1].trim() : null
}

/**
 * @param {String} variableName
 * @return {function(*=): number}
 */
const extractFloat = variableName => scriptContents => {
  const rx = createRegexp(variableName)
  const res = rx.exec(scriptContents)
  return res ? parseFloat(res[1].trim()) : 0
}

/**
 * unused vars:
 *  cover_mid
 *  cover_ver
 *  cover_wmode
 *  cover_ap_ssid
 *  cover_ap_ip
 *  cover_ap_mac
 *  cover_sta_ssid
 *  cover_sta_rssi
 *  cover_sta_ip
 *  cover_sta_mac
 *  status_a
 *  status_b
 *  status_c
 */
const extractors = new Map()
extractors.set('serialNumber', extractString('webdata_sn'))
extractors.set('firmwareMain', extractString('webdata_msvn'))
extractors.set('firmwareSlave', extractString('webdata_ssvn'))
extractors.set('inverterModel', extractString('webdata_pv_type'))
extractors.set('powerNow', extractFloat('webdata_now_p'))
extractors.set('powerToday', extractFloat('webdata_today_e'))
extractors.set('powerTotal', extractFloat('webdata_total_e'))

client.get('/status.html')
  .then(resp => {
    const doc = new JSDOM(resp.data)
    const script = doc.window.document.documentElement.getElementsByTagName('script').item(1).text

    const inverterInfo = {}

    extractors.forEach((fn, key) => {
      inverterInfo[key] = fn(script)
    })

    console.log(inverterInfo)
  })
