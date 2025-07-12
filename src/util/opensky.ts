import ky from 'ky';
import { cache } from '..';
import { getRange } from './dates';

export class OpenskyService {
  public async getAirportFlights(airportIcao: string, type: 'departure' | 'arrival', begin?: number, end?: number) {
    const todayDates = getRange();
    begin = begin || todayDates.begin;
    end = end || todayDates.end;

    const url = `https://opensky-network.org/api/flights/${type}?airport=${airportIcao}&begin=${begin}&end=${end}`;
    const response = await ky.get(url, {
      headers: {
        'Authorization': `Bearer ${await getOpenskyToken()}`,
      },
    }).json<AirportData[]>();
    console.log(response)
    return response;
  }
  public async getFlightStatus(flightNumber: string) {
    const response = await ky
      .get('https://opensky-network.org/api/states/all')
      .json<{ states: any[][] | null; time: number }>();
    if (!response.states) {
      return { status: 'NO_DATA' };
    }

    // janky fuzzy search because flight numbers SUCK
    const flight = response.states.find((state) => {
      const callsign = state[1]?.trim().toUpperCase();
      const searchFlight = flightNumber.replace(/\s/g, '').toUpperCase();

      return (
        callsign === searchFlight ||
        callsign?.includes(searchFlight) ||
        searchFlight?.includes(callsign)
      );
    });
    if (!flight) {
      return { status: 'NOT_FOUND' };
    }

    return {
      status: 'OK',
      flight: {
        icao24: flight[0],
        callsign: flight[1],
        originCountry: flight[2],
        timePosition: flight[3],
        lastContact: flight[4],
        longitude: flight[5],
        latitude: flight[6],
        baroAltitude: flight[7],
        onGround: flight[8],
        velocity: flight[9],
        trueTrack: flight[10],
        verticalRate: flight[11],
        sensors: flight[12],
        geoAltitude: flight[13],
      },
    };
  }
}

export async function getOpenskyToken(): Promise<string> {
  if (cache.hasKey('openskyToken')) {
    return cache.get('openskyToken')?.toString()!;
  }
  const { access_token: token } = await ky
    .post(
      'https://auth.opensky-network.org/auth/realms/opensky-network/protocol/openid-connect/token',
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'client_credentials',
          client_id: process.env.OPENSKY_CLIENT || '',
          client_secret: process.env.OPENSKY_SECRET || '',
        }),
      }
    )
    .json<{ access_token: string }>();
  cache.put('openskyToken', token, 30 * 60 * 1000); // 30min cache
  return token;
}

export interface AirportData {
  icao24: string;
  firstSeen: number;
  estDepartureAirport: string | null;
  lastSeen: number;
  estArrivalAirport: string | null;
  callsign: string | null;
  estDepartureAirportHorizDistance: number | null;
  estDepartureAirportVertDistance: number | null;
  estArrivalAirportHorizDistance: number | null;
  estArrivalAirportVertDistance: number | null;
  departureAirportCandidatesCount: number | null;
  arrivalAirportCandidatesCount: number | null;
}