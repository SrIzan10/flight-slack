import { PrismaClient } from '@prisma/client';
import BunCache from '@samocodes/bun-cache';
import { App } from '@slack/bolt';
import { OpenskyService } from './util/opensky';
import { FlightAware, type ScheduledDeparture } from './util/flightAware';
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
export const flightAware = new FlightAware();
export const adsbDb = new AdsBDB();

app.command('/flight-add', async ({ command, ack, respond }) => {
  const EXAMPLE = `_Example: \`/flight-add AGP today 11\` looks for flights from AGP today at 11:00 (24-hour)._`;
  await ack();

  const parts = command.text.split(' ');
  let [airportCode, dateInput, hourInput] = parts;
  
  if (!airportCode || airportCode.length !== 3) {
    await respond({ text: `Please provide a valid 3 character airport code.\n${EXAMPLE}` });
    return;
  }
  if (!dateInput) {
    await respond({ text: `Please provide a date in the format: today, tomorrow, 15-01-25, 2025-01-15, or 15/01/2025.\n${EXAMPLE}` });
    return;
  }

  if (!hourInput) {
    await respond({ text: `Please provide an hour (0-23) for the flight.\n${EXAMPLE}` });
    return;
  }

  const iataCode = await airports.changeAirportCode(airportCode, 'iata');
  if (!iataCode) {
    await respond({
      text: `Airport code "${airportCode}" not found. Please provide a valid airport code.`,
    });
    return;
  }

  let hour: number | undefined;
  if (hourInput) {
    const parsedHour = parseInt(hourInput);
    if (isNaN(parsedHour) || parsedHour < 0 || parsedHour > 23) {
      await respond({ text: 'Hour must be a number between 0 and 23.' });
      return;
    }
    hour = parsedHour;
  }

  const { date, error } = parseDate(dateInput, true);
  if (error) {
    await respond({ text: `Invalid date format. ${error}` });
    return;
  }

  try {
    const response = await flightAware.getAirportFlights(iataCode, date?.begin, date?.end, undefined, hour);

    const flights = response.scheduled_departures;

    if (flights.length === 0) {
      const timeInfo = hour !== undefined ? ` at hour ${hour}:00` : '';
      await respond({
        text: `No flights found for ${airportCode} on ${formatDate(new Date(date!.begin * 1000))}${timeInfo}`,
      });
      return;
    }

    // Store flight request params for pagination
    const requestParams = {
      iataCode,
      begin: date?.begin,
      end: date?.end,
      hour,
      airportCode,
      originalDate: date!.begin
    };

    await showFlightPage(respond, flights, requestParams, response.num_pages);
  } catch (error) {
    console.error('Error fetching flights:', error);
    await respond({ text: 'Error fetching flights. Check the airport code and try again!' });
  }
});

async function showFlightPage(
  respond: any,
  flights: ScheduledDeparture[],
  requestParams: {
    iataCode: string;
    begin?: number;
    end?: number;
    hour?: number;
    airportCode: string;
    originalDate: number;
  },
  pages: number = 1
) {
  // Limit to first 100 options (Slack limit)
  const limitedFlights = flights.slice(0, 100);
  
  const flightOptions = limitedFlights.map((flight) => {
    const originIata = flight.origin.code_iata;
    const destinationIata = flight.destination.code_iata;
    const takeoffDate = new Date(flight.scheduled_off || flight.actual_runway_off || 0);

    const displayText = `${flight.ident} (${takeoffDate.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
    })}) - ${originIata} → ${destinationIata}`;

    return {
      text: {
        type: 'plain_text' as const,
        text: displayText.substring(0, 75),
      },
      value: flight.ident_icao,
    };
  });

  const blocks: any[] = [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*Found flights for ${requestParams.airportCode}* on ${formatDate(
          new Date(requestParams.originalDate * 1000)
        )}${requestParams.hour !== undefined ? ` at hour ${requestParams.hour}:00` : ''}`,
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
  ];

  // Add next button if there are more pages
  if (pages > 1) {
    blocks.push({
      type: 'actions',
      elements: [
        {
          type: 'button',
          text: {
            type: 'plain_text',
            text: 'Next →',
          },
          action_id: 'flight_page_next',
          value: JSON.stringify({ ...requestParams }),
        }
      ],
    });
  }

  await respond({
    text: `Found flights for ${requestParams.airportCode} on ${formatDate(
      new Date(requestParams.originalDate * 1000)
    )}`,
    blocks,
  });
}

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

    const callsign = selectedValue;

    await respond({
      text: `✅ Added flight ${callsign} to your tracking list!`,
      replace_original: true,
    });
  } catch (error) {
    console.error('Error handling flight selection:', error);
    await respond({ text: 'Error adding flight to tracking. Please try again.' });
  }
});

app.action('flight_page_next', async ({ body, ack, respond }) => {
  await ack();

  try {
    const value =
      'actions' in body && body.actions?.[0] && 'value' in body.actions[0]
        ? body.actions[0].value
        : undefined;
    if (!value) return;

    const { cursor, iataCode, begin, end, hour, airportCode, originalDate } = JSON.parse(value as string);

    const response = await flightAware.getAirportFlights(iataCode, begin, end, cursor, hour);
    const flights = response.scheduled_departures;

    if (flights.length === 0) {
      await respond({ text: 'No more flights found.' });
      return;
    }

    const requestParams = {
      iataCode,
      begin,
      end,
      hour,
      airportCode,
      originalDate
    };

    await showFlightPage(respond, flights, requestParams, response.num_pages);
  } catch (error) {
    console.error('Error handling pagination:', error);
    await respond({ text: 'Error loading page. Please try again.' });
  }
});

await app.start();
console.log("We're up and running :)");
