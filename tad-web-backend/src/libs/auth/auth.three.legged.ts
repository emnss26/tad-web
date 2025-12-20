import  axios from 'axios';
import env from '../../config/index';

/**
 * libs/auth/auth.three.legged.ts
 *
 * Exports getAPSThreeLeggedToken(code):
 *  - Encodes client credentials
 *  - Posts to Forge /authentication/v2/token with grant_type=authorization_code
 *  - Returns the access_token string
 *
 * Throws on missing env vars or HTTP errors.
 */

export async function getAPSThreeLeggedToken (code:string): Promise<string> {

    const { APS_CLIENT_ID, APS_CLIENT_SECRET, APS_CALLBACK_URL, THREE_LEGGED_TOKEN_SCOPES, AUTODESK_BASE_URL } = env;
    
    if (!APS_CLIENT_ID || !APS_CLIENT_SECRET) {
        throw new Error ('Missing APS_CLIENT_ID or APS_CLIENT_SECRET environment variables')
    }

    const credentials = `${APS_CLIENT_ID}:${APS_CLIENT_SECRET}`;
  const encodedCredentials = Buffer.from(credentials).toString('base64');

    const requestData = new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: APS_CALLBACK_URL,
        scope: THREE_LEGGED_TOKEN_SCOPES
    }).toString();

    const headers = {
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json',
        'Authorization': `Basic ${encodedCredentials}`
    }

    try {
        const { data } = await axios.post<{ access_token: string }>(
           `${AUTODESK_BASE_URL}/authentication/v2/token`,
      requestData,
      { headers }
    );
    return data.access_token;
  } catch (err: any) {
    console.error('Error fetching three-legged token:', err.message);
    if (err.response) {
      console.error('Response data:', err.response.data);
    }
    throw err;
  }
}