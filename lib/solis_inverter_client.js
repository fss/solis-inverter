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
const createStringExtractor = variableName => scriptContents => {
  const rx = createRegexp(variableName)
  const res = rx.exec(scriptContents)
  return res ? res[1].trim() : null
}

/**
 * @param {String} variableName
 * @return {function(*=): number}
 */
const createFloatExtractor = variableName => scriptContents => {
  const rx = createRegexp(variableName)
  const match = rx.exec(scriptContents)
  const val = match ? parseFloat(match[1].trim()) : 0
  return isNaN(val) ? 0 : val
}

class SolisInverterClient {
  /**
   * @param {string} address
   * @param {string} username
   * @param {string} password
   */
  constructor (address, username, password) {
    this._client = axios.create({
      baseURL: `http://${address}`,
      auth: { username, password },
      responseType: 'document',
      timeout: 4900 // slightly below 5 seconds
    })

    /**
     * @type {function(*=): string}
     * @private
     */
    this._inverterSerial =  createStringExtractor('webdata_sn')

    /**
     * @type {function(*=): string}
     * @private
     */
    this._inverterFirmwareMain = createStringExtractor('webdata_msvn')

    /**
     * @type {function(*=): string}
     * @private
     */
    this._inverterFirmwareSlave = createStringExtractor('webdata_ssvn')

    /**
     * @type {function(*=): string}
     * @private
     */
    this._inverterModel = createStringExtractor('webdata_pv_type')

    /**
     * @type {function(*=): number}
     * @private
     */
    this._inverterPower = createFloatExtractor('webdata_now_p')

    /**
     * @type {function(*=): number}
     * @private
     */
    this._inverterEnergyToday = createFloatExtractor('webdata_today_e')

    /**
     * @type {function(*=): number}
     * @private
     */
    this._inverterEnergyTotal = createFloatExtractor('webdata_total_e')

    /**
     * @type {function(*=): string}
     * @private
     */
    this._loggerSerial = createStringExtractor('cover_mid')

    /**
     * @type {function(*=): string}
     * @private
     */
    this._loggerVersion = createStringExtractor('cover_ver')

    /**
     * @type {function(*=): string}
     * @private
     */
    this._loggerWirelessMode = createStringExtractor('cover_wmode')

    /**
     * @type {function(*=): string}
     * @private
     */
    this._loggerAccessPointSsid = createStringExtractor('cover_ap_ssid')

    /**
     * @type {function(*=): string}
     * @private
     */
    this._loggerAccessPointIp = createStringExtractor('cover_ap_ip')

    /**
     * @type {function(*=): string}
     * @private
     */
    this._loggerAccessPointMac = createStringExtractor('cover_ap_mac')

    /**
     * @type {function(*=): string}
     * @private
     */
    this._loggerStaSsid = createStringExtractor('cover_sta_ssid')

    /**
     * @type {function(*=): string}
     * @private
     */
    this._loggerStaRssi = createStringExtractor('cover_sta_rssi')

    /**
     * @type {function(*=): string}
     * @private
     */
    this._loggerStaIp = createStringExtractor('cover_sta_ip')

    /**
     * @type {function(*=): string}
     * @private
     */
    this._loggerStaMac = createStringExtractor('cover_sta_mac')

    /**
     * @type {function(*=): number}
     * @private
     */
    this._remoteServerA = createFloatExtractor('status_a')

    /**
     * @type {function(*=): number}
     * @private
     */
    this._remoteServerB = createFloatExtractor('status_b')
  }

  /**
   * @return {Promise<{remoteServer: {a: boolean, b: boolean}, logger: {mode: string, sta: {rssi: string, ip: string, ssid: string, mac: string}, serial: string, version: string, ap: {ip: string, ssid: string, mac: string}}, inverter: {serial: string, firmwareMain: string, model: string, firmwareSlave: string}, power: number, energy: {total: number, today: number}}>}
   */
  fetchData () {
    return this._client.get('/status.html').then(response => {
      const doc = new JSDOM(response.data)
      const scriptContents = doc.window.document.documentElement.getElementsByTagName('script').item(1).text

      return {
        inverter: {
          model: this._inverterModel(scriptContents),
          serial: this._inverterSerial(scriptContents),
          firmwareMain: this._inverterFirmwareMain(scriptContents),
          firmwareSlave: this._inverterFirmwareSlave(scriptContents)
        },
        logger: {
          serial: this._loggerSerial(scriptContents),
          version: this._loggerVersion(scriptContents),
          mode: this._loggerWirelessMode(scriptContents),
          ap: {
            ssid: this._loggerAccessPointSsid(scriptContents),
            ip: this._loggerAccessPointIp(scriptContents),
            mac: this._loggerAccessPointMac(scriptContents)
          },
          sta: {
            ssid: this._loggerStaSsid(scriptContents),
            ip: this._loggerStaIp(scriptContents),
            mac: this._loggerStaMac(scriptContents),
            rssi: this._loggerStaRssi(scriptContents)
          }
        },
        remoteServer: {
          a: this._remoteServerA(scriptContents) > 0,
          b: this._remoteServerB(scriptContents) > 0
        },
        power: this._inverterPower(scriptContents),
        energy: {
          today: this._inverterEnergyToday(scriptContents),
          total: this._inverterEnergyTotal(scriptContents)
        }
      }
    })
  }
}

module.exports = SolisInverterClient
