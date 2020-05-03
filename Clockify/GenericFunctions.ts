import { OptionsWithUri } from 'request';
import {
	ILoadOptionsFunctions
} from 'n8n-core';

import { IDataObject } from 'n8n-workflow';


// this is basically a copy of https://github.com/n8n-io/n8n/blob/master/packages/nodes-base/nodes/Clockify/GenericFunctions.ts
export async function clockifyApiRequest(this: ILoadOptionsFunctions, method: string, resource: string, body: any = {}, qs: IDataObject = {}, uri?: string, option: IDataObject = {}) : Promise<any> {
    const credentials = this.getCredentials('clockifyApi');
    if (credentials === undefined) {
		throw new Error('No credentials got returned!');
    }
    
    const BASE_URL = 'https://api.clockify.me/api/v1'

    const options: OptionsWithUri = {
		headers: {
			'Content-Type': 'application/json',
			'X-Api-Key': credentials.apiKey as string,
		},
		method,
		qs,
		body,
		uri: `${BASE_URL}/${resource}`,
		json: true
	};
	try {
		console.log(`Calling ${method} ${options.uri}`)
		return await this.helpers.request!(options);
	} catch (error) {
		console.log(error.response.body);
		let errorMessage = error.message;
		if (error.response.body && error.response.body.message) {
			errorMessage = `[${error.response.body.status_code}] ${error.response.body.message}`;
		}

		throw new Error('Clockify Error: ' + errorMessage);
	}
}