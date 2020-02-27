const axios = require('axios')
const { JSDOM } = require('jsdom')

const { username, password, address } = require('./config.json')

const client = axios.create({
  baseURL: `http://${address}`,
  auth: { username, password },
  responseType: 'document'
})

/**
 * @param variableName
 * @return {function(*=): string}
 */
const createVariableExtractor = variableName => scriptContents => {
  const rx = new RegExp(`var ${variableName} = "(.*)";`)
  const res = rx.exec(scriptContents)
  return res ? res[1].trim() : null
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
extractors.set('serialNumber', createVariableExtractor('webdata_sn'))
extractors.set('firmwareMain', createVariableExtractor('webdata_msvn'))
extractors.set('firmwareSlave', createVariableExtractor('webdata_ssvn'))
extractors.set('inverterModel', createVariableExtractor('webdata_pv_type'))
extractors.set('powerNow', createVariableExtractor('webdata_now_p'))
extractors.set('powerToday', createVariableExtractor('webdata_today_e'))
extractors.set('powerTotal', createVariableExtractor('webdata_total_e'))

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
