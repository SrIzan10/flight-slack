import ky from 'ky';
import { cache } from '..';

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
