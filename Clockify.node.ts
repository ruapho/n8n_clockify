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
import { Task, TaskRequest } from './Clockify/TaskInterfaces';

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
						resource: [ ClockifyFunctions.FIND_TASKS, ClockifyFunctions.CREATE_TASK ]
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
						resource: [ ClockifyFunctions.FIND_TASKS, ClockifyFunctions.CREATE_TASK ]
					}
				},
				default: ''
			},
			{
				displayName: 'Task Estimate',
				name: 'taskEstimate',
				type: 'string',
				description: 'Format in ISO 8601 (PT2H). See https://en.wikipedia.org/wiki/ISO_8601',
				displayOptions: {
					show: {
						resource: [ ClockifyFunctions.CREATE_TASK ]
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
		let projectId: string;
		let taskName: string;
		let taskEstimate: string;

		switch (apiResource) {
			case ClockifyFunctions.CREATE_TASK :
				projectId = this.getNodeParameter('projectId', 0) as string;
				taskName  = this.getNodeParameter('taskname', 0) as string;
				taskEstimate = this.getNodeParameter('taskEstimate', 0) as string;
				method = 'POST';
				resource = `/workspaces/${workspaceId}/projects/${projectId}/tasks`
				body = <TaskRequest>{
					name: taskName,
					projectId: projectId,
					estimate: taskEstimate
				}
				break;

			case ClockifyFunctions.FIND_TASKS :
			default:
				projectId  = this.getNodeParameter('projectId', 0) as string;
				taskName  = this.getNodeParameter('taskname', 0) as string;
				resource = `/workspaces/${workspaceId}/projects/${projectId}/tasks`
				if (taskName) {
					qs.name = taskName
				}
				break;
		}

		result = await clockifyApiRequest.call(this, method, resource, body, qs);

		if (Array.isArray(result) && result.length !== 0) {
			return [this.helpers.returnJsonArray(result)];
		}

		return null;
	}
}
