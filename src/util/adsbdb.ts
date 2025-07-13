import ky from 'ky';

export class AdsBDB {
  public async getRoute(icao24: string) {
    const url = `https://api.adsbdb.com/v0/callsign/${icao24.trim()}`;
    const response = await ky.get(url).json<AdsbdbFlightrouteResponse>();

    return {
      flight: response.response.flightroute.callsign,
      departure: response.response.flightroute.origin.iata_code,
      arrival: response.response.flightroute.destination.iata_code,
    };
  }
}

export interface AdsbdbFlightrouteResponse {
  response: {
    flightroute: {
      callsign: string;
      callsign_icao: string;
      callsign_iata: string;
      airline: {
        name: string;
        icao: string;
        iata: string;
        country: string;
        country_iso: string;
        callsign: string;
      };
      origin: {
        country_iso_name: string;
        country_name: string;
        elevation: number;
        iata_code: string;
        icao_code: string;
        latitude: number;
        longitude: number;
        municipality: string;
        name: string;
      };
      destination: {
        country_iso_name: string;
        country_name: string;
        elevation: number;
        iata_code: string;
        icao_code: string;
        latitude: number;
        longitude: number;
        municipality: string;
        name: string;
      };
    };
  };
}
