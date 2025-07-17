# flight-slack

this is a slack bot that sends flight information and updates to a selected slack channel.

it's currently wip and a submission for [Converge](https://converge.hackclub.com/).

## Stack
- [Bun](https://bun.sh/)
- [FlightAware AeroAPI](https://flightaware.com/aeroapi/)
- [Slack Bolt](https://slack.dev/bolt-js/)
- [TypeScript](https://www.typescriptlang.org/)
- [Prisma](https://www.prisma.io/)

## Development setup
1. Clone the repository
2. Fill out .env values
3. `bun install`
4. `bunx prisma migrate dev`
5. `bun dev`