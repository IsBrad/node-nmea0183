# node-nmea0183
Node library for parsing data from a GPS (NMEA-0183). Specifically tested and used with GY-NEO6MV2

## Usage
The library is able to decode NMEA-0183 words. It does not itself handle connection over the serial port.

Decoding of words can be done as using the parse function
```javascript
var nmea = require('node-nmea0183');

var word = '$GPGGA,092750.000,5321.6802,N,00630.3372,W,1,8,1.03,61.7,M,55.2,M,,*76' //Example nmea word

var info = nmea.parse(word);

console.log(info);
```

### Serialport usage
Example usage with the serialport library to decode incoming messages.
```javascript
var nmea = require('node-nmea0183');
var serialport = require("serialport");

var uart = new serialport.SerialPort(options.port, {
  baudrate : 9600, //Usage rate for gps receiver
  parser : serialport.parsers.readline("\n")
});

uart.on('open', function () {
  uart.on('data', function (data) {

    var info = nmea.parse(data);
    console.log(info);

  });
});
```
