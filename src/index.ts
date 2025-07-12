import { PrismaClient } from '@prisma/client';
import BunCache from '@samocodes/bun-cache';
import { App } from '@slack/bolt';
import { OpenskyService } from './util/opensky';
import { parseDate, formatDate } from './util/dates';
import { Airports } from './util/airports';
import { AdsBDB } from './util/adsbdb';

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  socketMode: true,
  appToken: process.env.SLACK_APP_TOKEN,
});

export const db = new PrismaClient();
export const airports = new Airports();
export const cache = new BunCache();
export const openSky = new OpenskyService();
export const adsbDb = new AdsBDB();

app.command('/flight-add', async ({ command, ack, respond }) => {
  await ack();

  let [airportCode, dateInput] = command.text.split(' ');
  if (!airportCode || airportCode.length !== 3) {
    await respond({ text: 'Please provide a valid airport code.' });
    return;
  }

  let airport = await airports.getAirportByCode(airportCode, 'iata');
  if (!airport) {
    airport = await airports.getAirportByCode(airportCode, 'icao');
  }

  if (!airport || !airport.iata_code) {
    await respond({
      text: `Airport code "${airportCode}" not found. Please provide a valid IATA or ICAO airport code.`,
    });
    return;
  }

  airportCode = airport.icao_code.toUpperCase();

  const { date, error } = parseDate(dateInput);
  if (error) {
    await respond({ text: `Invalid date format. ${error}` });
    return;
  }

  try {
    const flights = await openSky.getAirportFlights(
      airportCode,
      'departure',
      date!.begin,
      date!.end
    );

    if (flights.length === 0) {
      await respond({
        text: `No flights found for ${airportCode} on ${formatDate(new Date(date!.begin * 1000))}`,
      });
      return;
    }

    const CONCURRENCY_LIMIT = 20;
    const flightOptions = [];

    for (let i = 0; i < Math.min(flights.length, 50); i += CONCURRENCY_LIMIT) {
      const batch = flights.slice(i, i + CONCURRENCY_LIMIT);

      const batchResults = await Promise.all(
        batch.map(async (flight) => {
          if (!flight.callsign) return null;

          const now = performance.now();
          try {
            const { departure: hexDeparture, arrival: hexArrival } = await adsbDb
              .getRoute(flight.callsign)
              .catch(() => ({ departure: undefined, arrival: undefined }));

            if (
              (!hexDeparture || !hexArrival) &&
              (!flight.estDepartureAirport || !flight.estArrivalAirport)
            ) {
              return null;
            }

            const departure =
              hexDeparture ||
              (await airports.changeAirportCode(flight.estDepartureAirport!, 'icao'));
            const arrival =
              hexArrival || (await airports.changeAirportCode(flight.estArrivalAirport!, 'icao'));

            if (!departure || !arrival) {
              console.warn(`Missing route for flight ${flight.callsign}`);
              return null;
            }

            console.log(
              `Route lookup took ${performance.now() - now}ms for flight ${flight.callsign}`
            );

            return {
              text: {
                type: 'plain_text' as const,
                text: `${flight.callsign?.trim()} - ${departure} → ${arrival}`,
              },
              value: JSON.stringify({
                callsign: flight.callsign,
                icao24: flight.icao24,
                departureAirport: flight.estDepartureAirport,
                arrivalAirport: flight.estArrivalAirport,
                firstSeen: flight.firstSeen,
                lastSeen: flight.lastSeen,
              }),
            };
          } catch (error) {
            console.warn(`Error processing flight ${flight.callsign}:`, error);
            return null;
          }
        })
      );

      flightOptions.push(...batchResults.filter((option) => option !== null));

      // Small delay between batches to be nice to the API
      if (i + CONCURRENCY_LIMIT < flights.length) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }

    await respond({
      text: `Found ${flights.length} flights for ${airportCode} on ${formatDate(
        new Date(date!.begin * 1000)
      )}`,
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*Found ${flights.length} flights for ${airportCode}* on ${formatDate(
              new Date(date!.begin * 1000)
            )}`,
          },
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: 'Choose a flight:',
          },
          accessory: {
            type: 'static_select',
            placeholder: {
              type: 'plain_text',
              text: 'Select a flight',
            },
            options: flightOptions,
            action_id: 'flight_selection',
          },
        },
      ],
    });
  } catch (error) {
    console.error('Error fetching flights:', error);
    await respond({ text: 'Error fetching flights. Check the airport code and try again!' });
  }
});

app.action('flight_selection', async ({ body, ack, respond }) => {
  await ack();

  try {
    // I LOVE TYPESCRIPT
    const selectedValue =
      'actions' in body && body.actions?.[0] && 'selected_option' in body.actions[0]
        ? body.actions[0].selected_option?.value
        : undefined;

    if (!selectedValue) {
      await respond({ text: 'No flight selected.' });
      return;
    }

    const flightData = JSON.parse(selectedValue);

    // save to database for tracking

    await respond({
      text: `✅ Added flight ${flightData.callsign || 'Unknown'} from ${
        flightData.departureAirport
      } to ${flightData.arrivalAirport} to your tracking list!`,
      replace_original: true,
    });
  } catch (error) {
    console.error('Error handling flight selection:', error);
    await respond({ text: 'Error adding flight to tracking. Please try again.' });
  }
});

await app.start();
console.log("We're up and running :)");
