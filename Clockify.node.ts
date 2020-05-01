import { IExecuteFunctions } from 'n8n-core';
import {
	IDataObject,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	ILoadOptionsFunctions,
	INodePropertyOptions
} from 'n8n-workflow';

import { clockifyApiRequest } from './Clockify/GenericFunctions';
import { IWorkspaceDto } from './Clockify/WorkspaceInterfaces';
import { ClockifyFunctions } from './Clockify/ClockifyFunctionEnum';
import { ICurrentUserDto } from './Clockify/UserDtos';
import { IProjectImpl } from './Clockify/ProjectInterfaces';

export class Clockify implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Clockify',
		name: 'clockify',
		icon: 'file:clockify.png',
		group: ['transform'],
		version: 1,
		description: 'Calls the clockify api',
		defaults: {
			name: 'Clockify',
			color: '#00FF00',
		},
		inputs: ['main'],
		outputs: ['main'],
		credentials: [
			{
				name: 'clockifyApi',
				required: true,
			}
		],
		properties: [
			{
				displayName: 'Workspace',
				name: 'workspaceId',
				type: 'options',
				typeOptions: { loadOptionsMethod: 'listWorkspaces' },
				default: '',
				required: true
			},
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				options: [
					{
						name: "Find tasks",
						value: ClockifyFunctions.FIND_TASKS
					},
					{
						name: "Create task",
						value: ClockifyFunctions.CREATE_TASK
					}
				],
				required: true,
				default: ClockifyFunctions.FIND_TASKS
			},
			{
				displayName: 'Project',
				name: 'projectId',
				type: 'options',
				displayOptions: {
					show: {
						resource: [ ClockifyFunctions.FIND_TASKS ]
					}
				},
				typeOptions: { loadOptionsMethod: 'listProjects', loadOptionsDependsOn: ['workspaceId'] },
				default: ''
			},
			{
				displayName: 'Task Name',
				name: 'taskname',
				type: 'string',
				displayOptions: {
					show: {
						resource: [ ClockifyFunctions.FIND_TASKS ]
					}
				},
				default: ''
			}
		]
	};

	methods = {
		loadOptions: {
			async listWorkspaces(this: ILoadOptionsFunctions) : Promise<INodePropertyOptions[]> {
				const rtv : INodePropertyOptions[] = [];
				const  workspaces: IWorkspaceDto[] = await clockifyApiRequest.call(this,'GET', 'workspaces');
				if(undefined !== workspaces) {
					workspaces.forEach(value => {
						rtv.push(
						{
							name: value.name,
							value: value.id,
						});
					});
				}
				return rtv;
			},
			async listProjects(this: ILoadOptionsFunctions) : Promise<INodePropertyOptions[]> {
				const rtv : INodePropertyOptions[] = [];
				const workspaceId = this.getCurrentNodeParameter('workspaceId')
				if (workspaceId != null) {
					const  projects: IProjectImpl[] = await clockifyApiRequest.call(this,'GET', `workspaces/${workspaceId}/projects?archived=false`);
					if(undefined !== projects) {
						projects.forEach(value => {
							rtv.push(
							{
								name: value.name,
								value: value.id,
							});
						});
					}
				}
				
				return rtv;
			},
		},
	};


	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();

		const webhookData = this.getWorkflowStaticData('node');
		const apiResource = this.getNodeParameter('resource', 0) as ClockifyFunctions;
		const workspaceId  = this.getNodeParameter('workspaceId', 0);
		

		if (!webhookData.userId) {
			// Cache the user-id that we do not have to request it every time
			const userInfo: ICurrentUserDto = await clockifyApiRequest.call(this, 'GET', 'user');
			webhookData.userId = userInfo.id;
		}

		const qs : IDataObject = {};
		let resource: string;
		let body: {};
		let method: string = 'GET';
		let result = null;

		switch (apiResource) {
			case ClockifyFunctions.FIND_TASKS :
			default:
				const projectId  = this.getNodeParameter('projectId', 0);
				const taskName  = this.getNodeParameter('taskname', 0);
				resource = `/workspaces/${workspaceId}/projects/${projectId}/tasks`
				if (taskName) {
					qs.name = taskName
				}
				break;
		}

		result = await clockifyApiRequest.call(this, method, resource, body, qs);

		if (Array.isArray(result) && result.length !== 0) {
			result = [this.helpers.returnJsonArray(result)];
		}

		return result;
	}
}
