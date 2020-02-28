# Solis inverter JSON API
A simple NodeJS application to read Solis PV inverter data using HTTP interface

Using HTTP interface, extracts and prints data in format as below:

`{
    inverter: {
     model: '0123',
     serial: '1234567890ABCDE',
     firmwareMain: '0123',
     firmwareSlave: '0122'
   },
   logger: {
     serial: '1234567890',
     version: 'MW_08_0501_1.58',
     mode: 'STA',
     ap: {
        ssid: 'AP_1213456789',
        ip: '1.1.1.1',
        mac: 'ABABABABABAB'
    },
     sta: {
       ssid: 'NETWORK_NAME',
       ip: '2.2.2.2',
       mac: 'AABBCCDDEEFF',
       rssi: '99%'
     }
   },
   remoteServer: { a: true, b: false },
   power: 9999,
   energy: { today: 0, total: 6 }
 }`
 
 Usage:
 
`node index.js --address <INVERTER_IP_ADDRESS> --username <INVERTER_WEB_USERNAME> --password <INVERTER_WEB_PASSWORD> --port <LISTEN_PORT>`
