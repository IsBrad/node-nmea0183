var nmea = {
  utils : {
    parseLatLong(latNum, latChar, longNum, longChar) {
      //https://community.oracle.com/thread/3619431?start=0&tstart=0
      var out = {
        latitude : undefined,
        longitude : undefined
      };

      if (latNum.length > 6 && latChar.length > 0 && longNum.length > 6 && longChar.length > 0) {
        //Latitude and longitude exist
        var latDegrees = parseInt(latNum.substring(0, 2));
        var latMins = parseFloat(latNum.substring(2));
        var longDegrees = parseInt(longNum.substring(0, 3));
        var longMins = parseFloat(longNum.substring(3));

        out.latitude = latDegrees + (latMins / 60);
        out.longitude = longDegrees + (longMins / 60);

        if (latChar.toLowerCase() == 's') {
          //South
          out.latitude = -out.latitude;
        }

        if (longChar.toLowerCase() == 'w') {
          //West
          out.longitude = -out.longitude;
        }
      }

      return out;
    },
    parseTime : function (field) {
      if (field.length > 0) {
        //Time exists
        return new Date(
          new Date().getUTCFullYear(),
          new Date().getUTCMonth(),
          new Date().getUTCDate(),
          parseInt(field.substring(0, 2)), //Hour
          parseInt(field.substring(2, 4)), //Minute
          parseInt(field.substring(4, 6)), //Second
          parseInt(field.substring(5)) * 10 //Millisecond
        );
      } else {
        return undefined;
      }
    }
  },
  words : {
    //http://aprs.gids.nl/nmea/#rmc
    //https://www.sparkfun.com/datasheets/GPS/NMEA%20Reference%20Manual1.pdf
    GPRMC : function (word) {
      var parts = word.substring(0, word.length - 4).split(',');
      if (parts.length != 13) {
        throw "Word does not conatin correct number of parts";
      } else {
        var out = {
          word : 'GPRMC',
          time : undefined, //Includes date and time
          status : 'invalid', //'Invalid' or 'Ok'
          latitude : undefined,
          longitude : undefined,
          speed : undefined, //Speed in knots
          heading : undefined, //Angle from true north (degrees)
          declination : undefined //Magnetic variation/declination
        };

        if (parts[1].length > 0 && parts[9].length > 0) {
          //time and date exist
          out.time = new Date(
            parseInt('20' + parts[9].substring(4)), //Year
            parseInt(parts[9].substring(2, 4)) - 1, //Month (javascript counts months from 0)
            parseInt(parts[9].substring(0, 2)), //Day
            parseInt(parts[1].substring(0, 2)), //Hour
            parseInt(parts[1].substring(2, 4)), //Minute
            parseInt(parts[1].substring(4, 6)), //Second
            parseInt(parts[1].substring(5)) * 10 //Millisecond
          );
        }

        if (parts[2].length > 0) {
          //Validy flag exists
          var flag = parts[2].toLowerCase();
          if (flag == 'a') {
            out.status = 'ok';
          } else if (flag == 'v') {
            out.status = 'invalid';
          }
        }

        var latLong = nmea.utils.parseLatLong(parts[3], parts[4], parts[5], parts[6]);
        out.latitude = latLong.latitude;
        out.longitude = latLong.longitude;

        if (parts[7].length > 0) {
          //Speed exists
          out.speed = parseFloat(parts[7]);
        }

        if (parts[8].length > 0) {
          //Heading exists
          out.heading = parseFloat(parts[8]);
        }

        if (parts[10].length > 0 && parts[11].length > 0) {
          //Declination/variation exists
          out.declination = parseFloat(parts[10]);
          if (parts[11].toLowerCase() == 'w') {
            //West
            out.declination = -out.declination;
          }
        }

        return out;
      }
    },
    GPVTG : function (word) {
      var parts = word.substring(0, word.length - 4).split(',');
      if (parts.length != 10) {
        throw "Word does not conatin correct number of parts";
      } else {
        var out = {
          word : 'GPVTG',
          heading : undefined, //Relative to true north
          headingUncorrected : undefined, //Reletive to (to magnetic north)
          speedKnots : undefined, //Speed in knots
          speedKmph : undefined //Speed in Km per Hour
        };

        if (parts[1].length > 0 && parts[2].toLowerCase() == 't') {
          //Heading exists
          out.heading = parseFloat(parts[1]);
        }

        if (parts[3].length > 0 && parts[4].toLowerCase() == 'm') {
          //Uncorrected heading exists (to magnetic north)
          out.headingUncorrected = parseFloat(parts[3]);
        }

        if (parts[5].length > 0 && parts[6].toLowerCase() == 'n') {
          //Speed in knots exists
          out.speedKnots = parseFloat(parts[5]);
        }

        if (parts[7].length > 0 && parts[8].toLowerCase() == 'k') {
          //Speed in Km/h exits
          out.speedKmph = parseFloat(parts[7]);
        }

        return out;
      }
    },
    GPGGA : function (word) {
      var parts = word.substring(0, word.length - 4).split(',');
      if (parts.length != 15) {
        throw "Word does not conatin correct number of parts";
      } else {
        var out = {
          word : 'GPGGA',
          time : undefined, //Time of fix (with todays date from system clock)
          latitude : undefined,
          longitude : undefined,
          quality : 'none', //Quality of fix (none, fix or dgps)
          satellites : undefined, //Number of satellites in use (not those in view)
          accuracy : undefined,  //Horizontal dilution of position (meters)
          altitude : undefined, //Altitude above/below mean sea level (meters)
          geoidalSeparation : undefined, //Geoidal separation (Diff. between WGS-84 earth ellipsoid and mean sea level)
          dgpsTimeSinceUpdate : undefined, //Seconds since last update from dgps refrence station,
          dgpsStationId : undefined //Refrence id for dgps station
        };

        out.time = nmea.utils.parseTime(parts[1]);

        var latLong = nmea.utils.parseLatLong(parts[2], parts[3], parts[4], parts[5]);
        out.latitude = latLong.latitude;
        out.longitude = latLong.longitude;

        if (parts[6].length > 0) {
          //Quality exists
          if (parts[6].toLowerCase() == '0') {
            out.quality = 'none';
          } else if (parts[6].toLowerCase() == '1') {
            out.quality = 'fix';
          } else if (parts[6].toLowerCase() == '2') {
            out.quality = 'dgps';
          }
        }

        if (parts[7].length > 0) {
          //Satellites count exists
          out.satellites = parseInt(parts[7]);
        }

        if (parts[8].length > 0) {
          //Accuracy exists
          out.accuracy = parseFloat(parts[8]);
        }

        if (parts[9].length > 0 && parts[10].toLowerCase() == 'm') {
          //Altitude exists
          out.altitude = parseFloat(parts[9]);
        }

        if (parts[11].length > 0 && parts[12].toLowerCase() == 'm') {
          //Geoidal separation exists
          out.geoidalSeparation = parseFloat(parts[11]);
        }

        if (parts[13].length > 0 && parts[14].length > 0) {
          //Dpgs fields exist
          out.dgpsTimeSinceUpdate = parseInt(parts[13]);
          out.dgpsStationId = parseInt(parts[14]);
        }

        return out;
      }
    },
    GPGSA : function (word) {
      var parts = word.substring(0, word.length - 4).split(',');
      if (parts.length != 18) {
        throw "Word does not conatin correct number of parts";
      } else {
        var out = {
          word : 'GPGSA',
          mode : undefined, //Mode selected for 2d or 3d operation (Manual = forced 2d or 3d, Automatic = auto 2d or 3d)
          fix : undefined, //Fix type (None, 2D or 3D)
          satellites : [], //Array of satellite id's used for Fix
          accuracy : undefined, //Fix accuracy (PDOP) (meters)
          horizontalAccuracy : undefined, //Fix horizontal accuracy (HDOP) (meters)
          verticalAccuracy : undefined //Fix vertical accuracy (VDOP) (meters)
        };

        if (parts[1].length > 0) {
          //Mode exists
          if (parts[1].toLowerCase() == 'm') {
            //Manual
            out.mode = 'manual';
          } else if (parts[1].toLowerCase() == 'a') {
            //Auto
            out.mode = 'automatic';
          }
        }

        if (parts[2].length > 0) {
          //Fix type exists
          if (parts[2] == '1') {
            out.fix = 'none';
          } else if (parts[2] == '2') {
            out.fix = '2d';
          } else if (parts[2] == '3') {
            out.fix = '3d';
          }
        }

        for (var key = 3; key <= 14; key++) {
          if (parts[key].length > 0) {
            out.satellites.push(parseInt(parts[key]));
          }
        }

        if (parts[15].length > 0) {
          //Fix accuracy exists
          out.accuracy = parseFloat(parts[15]);
        }

        if (parts[16].length > 0) {
          //Fix horizontal accuracy exists
          out.horizontalAccuracy = parseFloat(parts[16]);
        }

        if (parts[17].length > 0) {
          //Fix vertical accuracy exists
          out.verticalAccuracy = parseFloat(parts[17]);
        }

        return out;
      }
    },
    GPGSV : function (word) {
      var parts = word.substring(0, word.length - 4).split(',');
      if (parts.length != 8 && parts.length != 12 && parts.length != 16 && parts.length != 20) {
        throw "Word does not conatin correct number of parts";
      } else {
        var out = {
          word : 'GPGSV',
          index : undefined, //Message number in cycle (of this message type)
          total : undefined, //Total number of messages in this cycle (of this message type)
          visible : undefined, //Total number of satellites in view
          satellites : [ //Info on satellites in view
            /*{ //Example data
              prn : undefined, //Satellite PRN number (id)
              elevation : undefined, //Elevation in degrees (90 maximum)
              azimuth : undefined, //Azimuth, degrees from true north (0 to 359)
              snr : undefined //SNR (Signal to noise ratio), 00-99 dB (undefined when not tracking)
            }*/
          ]
        };

        if (parts[1].length > 0) {
          //Index exists
          out.index = parseInt(parts[1]);
        }

        if (parts[2].length > 0) {
          //Total exists
          out.total = parseInt(parts[2]);
        }

        if (parts[3].length > 0) {
          //Visible exists
          out.visible = parseInt(parts[3]);
        }

        for (var key = 4; key < parts.length; key += 4) {

          var satellite = {};

          if (parts[key].length > 0) {
            //PRN (id number) exists
            satellite.prn = parseInt(parts[key]);
          }

          if (parts[key + 1].length > 0) {
            //Elevation exists
            satellite.elevation = parseFloat(parts[key + 1]);
          }

          if (parts[key + 2].length > 0) {
            //Azimuth exists
            satellite.azimuth = parseFloat(parts[key + 2]);
          }

          if (parts[key + 3].length > 0) {
            //SNR exists
            satellite.snr = parseFloat(parts[key + 3]);
          }

          out.satellites.push(satellite);

        }

        return out;
      }
    },
    GPGLL : function (word) {
      var parts = word.substring(0, word.length - 4).split(',');
      if (parts.length != 5 && parts.length != 6 && parts.length != 7 && parts.length != 8) {
        throw "Word does not conatin correct number of parts";
      } else {
        var out = {
          word : 'GPGLL',
          latitude : undefined,
          longitude : undefined,
          time : undefined, //Time of fix (with todays date from system clock)
          valid : undefined, //Validity of fix (true or false)
          mode: undefined //Aquisition mode (type of fix) (Autonomous, DGPS or Dead Reckoning) - 1 word lowercase
        };

        var latLong = nmea.utils.parseLatLong(parts[1], parts[2], parts[3], parts[4]);
        out.latitude = latLong.latitude;
        out.longitude = latLong.longitude;

        if (parts.length >= 6) {
          if (parts[5].length > 0) {
            //Time exists
            out.time = nmea.utils.parseTime(parts[5]);
          }
        }

        if (parts.length >= 7) {
          //Status of validity could exist
          if (parts[6].toLowerCase() == 'a') {
            //Valid
            out.valid = true;
          } else if (parts[6].toLowerCase() == 'v') {
            out.valid = false;
          }
        }

        if (parts.length >= 8) {
          //Mode could exist
          if (parts[7].toLowerCase() == 'a') {
            //Autonomous
            out.mode = 'autonomous';
          } else if (parts[7].toLowerCase() == 'd') {
            //DGPS
            out.mode = 'dgps';
          } else if (parts[7].toLowerCase() == 'e') {
            //Dead Reckoning
            out.mode = 'deadreckoning';
          }
        }

        return out;
      }
    }
  },
  parse : function (word) {
    if (word.length < 9) {
      throw "Word is too short to be valid";
    } else if (word[0] != '$') {
      throw "Word does not start with '$'";
    } else if (word[word.length - 4] != '*') {
      throw "Word does not contain checksum";
    } else {
      var parser = nmea.words[word.slice(1,6)];
      if (parser == undefined) {
        throw "Unrecognised word";
      } else {
        return parser(word);
      }
    }
  }
};

module.exports = nmea;
