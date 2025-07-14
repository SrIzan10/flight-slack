import ky from 'ky';

export class FlightAware {
  public async getAirportFlights(
    airportIcao: string, 
    begin?: number, 
    end?: number, 
    cursor?: string,
    hour?: number
  ): Promise<ScheduledDeparturesResponse> {
    const apiKey = process.env.FLIGHTAWARE;
    if (!apiKey) {
      throw new Error('FLIGHTAWARE environment variable is required');
    }

    const baseUrl = `https://aeroapi.flightaware.com/aeroapi/airports/${airportIcao}/flights/scheduled_departures`;
    const searchParams: Record<string, string> = {
      type: 'Airline',
      max_pages: '1'
    };

    if (begin) {
      const startDate = new Date(begin * 1000);
      if (hour !== undefined) {
        startDate.setHours(hour, 0, 0, 0);
      }
      searchParams.start = startDate.toISOString();
    }
    if (end) {
      const endDate = new Date(end * 1000);
      if (hour !== undefined) {
        endDate.setHours(hour + 1, 0, 0, 0);
      }
      searchParams.end = endDate.toISOString();
    }
    if (cursor) {
      searchParams.cursor = cursor;
    }

    return ky.get(baseUrl, {
      searchParams,
      headers: {
        'Accept': 'application/json; charset=UTF-8',
        'User-Agent': 'flight-slack/1.0',
        'x-apikey': apiKey,
      }
    }).json<ScheduledDeparturesResponse>();
  }
  public async getFlightInfo(flightId: string): Promise<FlightsData> {
    const apiKey = process.env.FLIGHTAWARE;
    if (!apiKey) {
      throw new Error('FLIGHTAWARE environment variable is required');
    }

    const url = `https://aeroapi.flightaware.com/aeroapi/flights/${flightId}`;
    return ky.get(url, {
      headers: {
        'Accept': 'application/json; charset=UTF-8',
        'User-Agent': 'flight-slack/1.0',
        'x-apikey': apiKey,
      }
    }).json<FlightsData>();
  }
}

interface Airport {
  code: string;
  code_icao: string;
  code_iata: string;
  code_lid: string | null;
  timezone: string;
  name: string;
  city: string;
  airport_info_url: string;
}

export interface ScheduledDeparture {
  ident: string;
  ident_icao: string;
  ident_iata: string;
  actual_runway_off: string | null;
  actual_runway_on: string | null;
  fa_flight_id: string;
  operator: string;
  operator_icao: string;
  operator_iata: string;
  flight_number: string;
  registration: string | null;
  atc_ident: string | null;
  inbound_fa_flight_id: string | null;
  codeshares: string[];
  codeshares_iata: string[];
  blocked: boolean;
  diverted: boolean;
  cancelled: boolean;
  position_only: boolean;
  origin: Airport;
  destination: Airport;
  departure_delay: number | null;
  arrival_delay: number | null;
  filed_ete: number;
  scheduled_out: string;
  estimated_out: string | null;
  actual_out: string | null;
  scheduled_off: string;
  estimated_off: string | null;
  actual_off: string | null;
  scheduled_on: string;
  estimated_on: string | null;
  actual_on: string | null;
  scheduled_in: string;
  estimated_in: string | null;
  actual_in: string | null;
  progress_percent: number;
  status: string;
  aircraft_type: string;
  route_distance: number;
  filed_airspeed: number;
  filed_altitude: number | null;
  route: string | null;
  baggage_claim: string | null;
  seats_cabin_business: number | null;
  seats_cabin_coach: number | null;
  seats_cabin_first: number | null;
  gate_origin: string | null;
  gate_destination: string | null;
  terminal_origin: string | null;
  terminal_destination: string | null;
  type: string;
}

export interface ScheduledDeparturesResponse {
  scheduled_departures: ScheduledDeparture[];
  links: {
    next?: string;
  } | null;
  num_pages: number;
}

export interface Flight {
  ident: string;
  ident_icao: string;
  ident_iata: string;
  actual_runway_off: string;
  actual_runway_on: string;
  fa_flight_id: string;
  operator: string;
  operator_icao: string;
  operator_iata: string;
  flight_number: string;
  registration: string;
  atc_ident: string;
  inbound_fa_flight_id: string;
  codeshares: any[];
  codeshares_iata: any[];
  blocked: boolean;
  diverted: boolean;
  cancelled: boolean;
  position_only: boolean;
  origin: {
    code: string;
    code_icao: string;
    code_iata: string;
    code_lid: null;
    timezone: string;
    name: string;
    city: string;
    airport_info_url: string;
  };
  destination: {
    code: string;
    code_icao: string;
    code_iata: string;
    code_lid: null;
    timezone: string;
    name: string;
    city: string;
    airport_info_url: string;
  };
  departure_delay: number;
  arrival_delay: number;
  filed_ete: number;
  foresight_predictions_available: boolean;
  scheduled_out: string;
  estimated_out: string;
  actual_out: string;
  scheduled_off: string;
  estimated_off: string;
  actual_off: string;
  scheduled_on: string;
  estimated_on: string;
  actual_on: string;
  scheduled_in: string;
  estimated_in: string;
  actual_in: null;
  progress_percent: number;
  status: string;
  aircraft_type: string;
  route_distance: number;
  filed_airspeed: number;
  filed_altitude: null;
  route: null;
  baggage_claim: null;
  seats_cabin_business: null;
  seats_cabin_coach: null;
  seats_cabin_first: null;
  gate_origin: string;
  gate_destination: null;
  terminal_origin: null;
  terminal_destination: string;
  type: string;
}

export interface FlightsData {
  flights: Flight[];
  links: null;
  num_pages: number;
}