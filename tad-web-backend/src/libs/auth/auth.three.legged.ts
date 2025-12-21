import axios from 'axios';
import { config } from '../../config';

export async function getAPSThreeLeggedToken(code: string): Promise<string> {
    const { clientId, clientSecret, scopes, baseUrl } = config.aps;
    const { apsCallback } = config.urls;

    if (!clientId || !clientSecret) {
        throw new Error('Missing APS credentials in configuration');
    }

    const credentials = `${clientId}:${clientSecret}`;
    const encodedCredentials = Buffer.from(credentials).toString('base64');

    // Scopes are arrays in config, join them with spaces for the API
    const scopeString = scopes.threeLegged.join(' ');

    const requestData = new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: apsCallback,
        scope: scopeString
    }).toString();

    const headers = {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
        'Authorization': `Basic ${encodedCredentials}`
    };

    try {
        const { data } = await axios.post<{ access_token: string }>(
            `${baseUrl}/authentication/v2/token`,
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