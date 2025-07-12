import { Database } from 'bun:sqlite';

export class Airports {
  constructor() {
    this.db = new Database('src/datasets/airports.db');
  }

  public db: Database;

  // ICAO: LEMG, IATA: AGP
  public async getAirportByCode(code: string, type: 'icao' | 'iata'): Promise<Airport | null> {
    const query = `SELECT * FROM airports WHERE ${type}_code = ?`;
    const result = (await this.db.query(query).get(code.toUpperCase())) as Airport;
    return result || null;
  }
  public async changeAirportCode(code: string, type: 'icao' | 'iata') {
    const now = performance.now();
    const res = await this.getAirportByCode(code, type);
    if (!res) return null;

    // console.log(`Airport lookup took ${performance.now() - now}ms`);
    return type === 'icao' ? res.iata_code : res.icao_code;
  }
}

interface Airport {
  id: string;
  ident: string;
  type: string;
  name: string;
  latitude_deg: string;
  longitude_deg: string;
  elevation_ft: string;
  continent: string;
  iso_country: string;
  iso_region: string;
  municipality: string;
  scheduled_service: string;
  icao_code: string;
  iata_code: string;
  gps_code: string;
  local_code: string;
  home_link: string;
  wikipedia_link: string;
  keywords: string;
}
