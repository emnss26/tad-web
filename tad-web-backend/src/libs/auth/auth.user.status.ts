import axios from 'axios';
import env from '../../config/index';

/**
 * libs/auth/auth.user.status.ts
 *
 * Exports getUserStatus(token):
 *  - Sends GET to Forge /userprofile/v1/users/@me with Bearer token
 *  - Returns { authenticated: true } if userId present, else false
 *
 * Catches errors and returns authenticated: false.
 */

export interface UserStatus {
    authenticated: boolean;
}

export async function getUserStatus(token: string): Promise<UserStatus> {
  const url = `${env.AUTODESK_BASE_URL}/userprofile/v1/users/@me`;
  try {
    const { data } = await axios.get<{ userId: string }>(url, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return { authenticated: Boolean(data.userId) };
  } catch (err: any) {
    console.error('Error fetching user status:', err.message);
    return { authenticated: false };
  }
}