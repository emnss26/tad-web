import axios from 'axios';
import { config } from '../../config';

export async function getAPSTwoLeggedToken(): Promise<string> {
    const { clientId, clientSecret, scopes, baseUrl } = config.aps;

    if (!clientId || !clientSecret) {
        throw new Error('Missing APS credentials');
    }

    const credentials = `${clientId}:${clientSecret}`;
    const encodedCredentials = Buffer.from(credentials).toString('base64');
    
    // Join scopes array into a space-separated string
    const scopeString = scopes.twoLegged.join(' ');

    const requestData = new URLSearchParams({
        grant_type: "client_credentials",
        scope: scopeString,
    }).toString();

    const headers = {
        "Content-Type": "application/x-www-form-urlencoded",
        "Accept": "application/json",
        "Authorization": `Basic ${encodedCredentials}`,
    };

    try {
        const { data } = await axios.post<{ access_token: string }>(
            `${baseUrl}/authentication/v2/token`,
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