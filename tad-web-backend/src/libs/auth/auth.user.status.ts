import axios from 'axios';
import { config } from '../../config';

export interface UserStatus {
    authenticated: boolean;
}

export async function getUserStatus(token: string): Promise<UserStatus> {
  const url = `${config.aps.baseUrl}/userprofile/v1/users/@me`;
  
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