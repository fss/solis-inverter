const axios = require('axios')
const { JSDOM } = require('jsdom')

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

class SolisInverter {
  /**
   * @param {string} address
   * @param {string} username
   * @param {string} password
   */
  constructor (address, username, password) {
    this._client = axios.create({
      baseURL: `http://${address}`,
      auth: { username, password },
      responseType: 'document'
    })

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
    this._extractors = new Map()
    this._extractors.set('serialNumber', extractString('webdata_sn'))
    this._extractors.set('firmwareMain', extractString('webdata_msvn'))
    this._extractors.set('firmwareSlave', extractString('webdata_ssvn'))
    this._extractors.set('inverterModel', extractString('webdata_pv_type'))
    this._extractors.set('powerNow', extractFloat('webdata_now_p'))
    this._extractors.set('powerToday', extractFloat('webdata_today_e'))
    this._extractors.set('powerTotal', extractFloat('webdata_total_e'))
  }

  /**
   * @return {Promise<{}>}
   */
  fetchData () {
    return this._client.get('/status.html').then(response => {
      const doc = new JSDOM(response.data)
      const script = doc.window.document.documentElement.getElementsByTagName('script').item(1).text
      const inverterInfo = {}

      this._extractors.forEach((fn, key) => {
        inverterInfo[key] = fn(script)
      })

      return inverterInfo
    })
  }
}

module.exports = SolisInverter
