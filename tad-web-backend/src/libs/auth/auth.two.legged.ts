import  axios from 'axios';
import env from '../../config/index';

/**
 * libs/auth/auth.two.legged.ts
 *
 * Exports getAPSTwoLeggedToken():
 *  - Encodes client credentials
 *  - Posts to Forge /authentication/v2/token with grant_type=client_credentials
 *  - Returns the access_token string
 *
 * Throws on missing env vars or HTTP errors.
 */

export async function getAPSTwoLeggedToken () : Promise<string> {
    const { APS_CLIENT_ID, APS_CLIENT_SECRET, TWO_LEGGED_TOKEN_SCOPES, AUTODESK_BASE_URL } = env;

    if (!APS_CLIENT_ID || !APS_CLIENT_SECRET) {
        throw new Error ('Missing credentials');
    }

    const credentials = `${APS_CLIENT_ID}:${APS_CLIENT_SECRET}`;
  const encodedCredentials = Buffer.from(credentials).toString('base64');
 
  const requestData = new URLSearchParams({
        grant_type: "client_credentials",
        scope: TWO_LEGGED_TOKEN_SCOPES,
    }).toString();

    const  headers = {
       "Content-Type": "application/x-www-form-urlencoded",
    Accept: "application/json",
    Authorization: `Basic ${encodedCredentials}`, 
    }

    try {
        const { data } = await axios.post<{ access_token: string }>(
           `${AUTODESK_BASE_URL}/authentication/v2/token`,
      requestData,
      { headers }
    );
    return data.access_token;
  } catch (err: any) {
    console.error('Error fetching two-legged token:', err.message);
    if (err.response) {
      console.error('Response data:', err.response.data);
    }
    throw err;
  }
}