import type { Flight } from '@prisma/client';
import { db, flightAware, app } from '../index';

export class FlightUpdater {
  private updateInterval: NodeJS.Timeout | null = null;
  private flightIntervals: Map<string, NodeJS.Timeout> = new Map();

  public start() {
    if (this.updateInterval) return;
    
    console.log('flight updater starting');
    
    this.updateInterval = setInterval(() => this.manageFlightPolling(), 10 * 60 * 1000);
    this.manageFlightPolling();
  }

  public stop() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
    
    this.flightIntervals.forEach(interval => clearInterval(interval));
    this.flightIntervals.clear();
  }

  private async manageFlightPolling() {
    try {
      const flights = await db.flight.findMany({
        where: {
          actualIn: null,
          cancelled: false,
          scheduledOff: {
            gte: new Date(Date.now() - 4 * 60 * 60 * 1000),
            lte: new Date(Date.now() + 24 * 60 * 60 * 1000),
          }
        }
      });

      const currentlyTracked = new Set(this.flightIntervals.keys());
      const activeFlightIds = new Set(flights.map(f => f.id));

      // remove intervals for flights no longer active
      for (const flightId of currentlyTracked) {
        if (!activeFlightIds.has(flightId)) {
          clearInterval(this.flightIntervals.get(flightId)!);
          this.flightIntervals.delete(flightId);
          console.log(`Stopped tracking flight ${flightId}`);
        }
      }

      // add intervals for new flights
      for (const flight of flights) {
        if (!this.flightIntervals.has(flight.id)) {
          this.setupFlightPolling(flight);
        }
      }

      console.log(`Managing ${this.flightIntervals.size} flight polling intervals`);
    } catch (error) {
      console.error('Error managing flight polling:', error);
    }
  }

  private setupFlightPolling(flight: Flight) {
    const pollInterval = this.calculatePollInterval(flight);
    
    console.log(`Setting up polling for flight ${flight.ident} every ${pollInterval / 60000} minutes`);
    
    // initial update
    this.updateSingleFlight(flight);
    
    // set up interval
    const interval = setInterval(() => this.updateSingleFlight(flight), pollInterval);
    this.flightIntervals.set(flight.id, interval);
  }

  private calculatePollInterval(flight: Flight): number {
    const now = new Date();
    const scheduledOff = new Date(flight.scheduledOff);
    const scheduledOn = new Date(flight.scheduledOn);

    // pre-departure phase (more than 2 hours before takeoff)
    if (now < new Date(scheduledOff.getTime() - 2 * 60 * 60 * 1000)) {
      return 30 * 60 * 1000; // 30 minutes
    }
    
    // pre-departure phase (less than 2 hours before takeoff)
    if (now < scheduledOff) {
      return 5 * 60 * 1000; // 5 minutes
    }
    
    // In-flight phase
    if (!flight.actualOn && now < new Date(scheduledOn.getTime() + 2 * 60 * 60 * 1000)) {
      // frequent updates during takeoff and initial 5 minute climb
      if (now < new Date(scheduledOff.getTime() + 5 * 60 * 1000)) {
        return 2 * 60 * 1000; // 2 minutes
      }
      
      // Medium frequency during cruise
      const flightDuration = scheduledOn.getTime() - scheduledOff.getTime();
      const timeInFlight = now.getTime() - scheduledOff.getTime();
      const progressPercent = (timeInFlight / flightDuration) * 100;
      
      // frequent updates during landing
      if (progressPercent > 80) {
        return 3 * 60 * 1000; // 3 minutes
      }
      
      return 8 * 60 * 1000; // 8 minutes during cruise
    }
    
    // flight arrived
    return 15 * 60 * 1000;
  }

  private async updateSingleFlight(flight: Flight) {
    console.log(`updating flight ${flight.ident} (${flight.id})`);
    try {
      const currentFlight = await db.flight.findUnique({
        where: { id: flight.id }
      });
      
      if (!currentFlight || currentFlight.actualIn) {
        this.removeFlightPolling(flight.id);
        return;
      }

      const flightInfo = await flightAware.getFlightInfo(currentFlight.faFlightId);
      const newData = flightInfo.flights[0];
      
      if (!newData) return;

      const changes = [];
      
      if (currentFlight.status !== newData.status) {
        changes.push(`Status: ${newData.status}`);
      }
      
      if (Math.abs((currentFlight.departureDelay || 0) - (newData.departure_delay || 0)) > 10) {
        changes.push(`Departure delay: ${newData.departure_delay || 0} minutes`);
      }
      
      if (currentFlight.gateOrigin !== newData.gate_origin && newData.gate_origin) {
        changes.push(`Gate changed to: ${newData.gate_origin}`);
      }
      
      if (!currentFlight.actualOff && newData.actual_off) {
        changes.push('✈️ Flight has taken off!');
        this.adjustFlightPolling(flight.id, flight);
      }
      
      if (!currentFlight.actualOn && newData.actual_on) {
        changes.push('🛬 Flight has landed!');
        this.removeFlightPolling(flight.id);
      }
      
      if (!currentFlight.cancelled && newData.cancelled) {
        changes.push('❌ Flight cancelled');
        this.removeFlightPolling(flight.id);
      }

      if (!currentFlight.diverted && newData.diverted) {
        changes.push(`🚨 Flight diverted to ${newData.destination.code_iata} (${newData.destination.name})`);
      }

      // 10 multiple updates (0 - 10, 10 - 20, etc.)
      if (currentFlight.progressPercent !== null && newData.progress_percent !== null && newData.actual_off && !newData.actual_on) {
        const oldTens = Math.floor((currentFlight.progressPercent || 0) / 10);
        const newTens = Math.floor(newData.progress_percent / 10);
        
        if (oldTens !== newTens && newData.progress_percent !== 100) {
          changes.push(`🔄 Flight progress: ${newData.progress_percent}%\n${this.slackProgressbar(newData.progress_percent)}`);
        }
      }

      const updatedFlight = await db.flight.update({
        where: { id: flight.id },
        data: {
          status: newData.status,
          departureDelay: newData.departure_delay,
          arrivalDelay: newData.arrival_delay,
          actualOut: newData.actual_out,
          actualOff: newData.actual_off,
          actualOn: newData.actual_on,
          actualIn: newData.actual_in,
          cancelled: newData.cancelled,
          diverted: newData.diverted,
          gateOrigin: newData.gate_origin,
          progressPercent: newData.progress_percent,
        }
      });

      // stop polling on completion
      if (updatedFlight.actualIn) {
        this.removeFlightPolling(flight.id);
      }

      if (changes.length > 0) {
        const message = `🔔 *${currentFlight.ident}* (${currentFlight.originIata} → ${currentFlight.destinationIata})\n${changes.join('\n')}`;
        
        await app.client.chat.postMessage({
          channel: currentFlight.channelId,
          text: message
        });
      }
    } catch (error) {
      console.error(`error updating flight ${flight.ident}:`, error);
      
      // adjust polling for error
      this.adjustFlightPolling(flight.id, flight, true);
    }
  }

  private adjustFlightPolling(flightId: string, flight: Flight, isError: boolean = false) {
    const existingInterval = this.flightIntervals.get(flightId);
    if (existingInterval) {
      clearInterval(existingInterval);
    }

    let newInterval = this.calculatePollInterval(flight);
    
    if (isError) {
      newInterval *= 2;
    }

    const interval = setInterval(() => this.updateSingleFlight(flight), newInterval);
    this.flightIntervals.set(flightId, interval);
  }

  private removeFlightPolling(flightId: string) {
    const interval = this.flightIntervals.get(flightId);
    if (interval) {
      clearInterval(interval);
      this.flightIntervals.delete(flightId);
      console.log(`Stopped polling completed flight ${flightId}`);
    }
  }

  private slackProgressbar(percent: number): string {
    const filled = Math.round(percent / 10);
    const empty = 10 - filled;
    return `\`${'█'.repeat(filled)}${'░'.repeat(empty)}\` ${percent}%`;
  }
}