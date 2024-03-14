import { PackageError } from '@metacall/protocol/package';
import * as assert from 'assert';
import { Request, Response } from 'express';
import { describe, it } from 'mocha'; // Import describe and it from Mocha
import * as sinon from 'sinon';
import { deploy, validateAndDeployEnabled } from '../api';

interface ApiResponse {
	status: string;
	data: boolean;
}

describe('validateAndDeployEnabled', () => {
	it('should return status 200 and true data', () => {
		const req = {} as Request;
		const res = {
			status: (statusCode: number) => ({
				json: (data: ApiResponse) => {
					assert.strictEqual(statusCode, 200);
					assert.deepStrictEqual(data, {
						status: 'success',
						data: true
					});
				}
			})
		} as unknown as Response;

		validateAndDeployEnabled(req, res);
	});
});

describe('deploy function', () => {
	let req: Partial<Request>, res: Partial<Response>, next: sinon.SinonStub;

	beforeEach(() => {
		req = { body: {} };
		res = { status: sinon.stub().returnsThis(), json: sinon.stub() };
		next = sinon.stub();
	});

	it('should install dependencies when resourceType is "Repository"', async () => {
		req.body.resourceType = 'Repository';
		const calculatePackagesStub = sinon.stub().resolves();
		const installDependenciesStub = sinon.stub().resolves();
		sinon.replace(deploy, 'calculatePackages', calculatePackagesStub);
		sinon.replace(deploy, 'installDependencies', installDependenciesStub);

		await deploy(req as Request, res as Response, next as NextFunction);

		sinon.assert.calledOnce(calculatePackagesStub);
		sinon.assert.calledOnce(installDependenciesStub);
		sinon.assert.calledWith(res.status as sinon.SinonStub, 200);
		sinon.assert.calledWith(
			res.json as sinon.SinonStub,
			sinon.match({
				suffix: sinon.match.string,
				prefix: sinon.match.string,
				version: 'v1'
			})
		);
	});

	it('should send the correct message to the child process', async () => {
		// Stubbing spawn and proc objects
		const sendStub = sinon.stub();
		const stdoutOnStub = sinon.stub();
		const stderrOnStub = sinon.stub();
		const onStub = sinon.stub();

		const spawnStub = sinon.stub().returns({
			send: sendStub,
			stdout: { on: stdoutOnStub },
			stderr: { on: stderrOnStub },
			on: onStub
		});

		sinon.replace(deploy, 'spawn', spawnStub);

		await deploy(req as Request, res as Response, next as NextFunction);

		sinon.assert.calledOnce(sendStub);
		sinon.assert.calledWith(
			sendStub,
			sinon.match({
				type: 'loadFunctions',
				currentFile: sinon.match.object
			})
		);
	});

	it('should handle the "message" event from the child process correctly', async () => {
		const childProcessResponse = {
			type: 'getApplicationMetadata',
			data: {}
		};

		const procOnStub = sinon.stub();
		const spawnStub = sinon.stub().returns({
			on: procOnStub
		});

		sinon.replace(deploy, 'spawn', spawnStub);

		await deploy(req as Request, res as Response, next as NextFunction);

		const [, messageCallback] = procOnStub.firstCall.args;
		messageCallback(childProcessResponse);

		// Assert whatever logic you have for handling the message event
	});

	it('should return a JSON response with the correct status code, suffix, prefix, and version', async () => {
		await deploy(req as Request, res as Response, next as NextFunction);

		sinon.assert.calledWith(res.status as sinon.SinonStub, 200);
		sinon.assert.calledWith(
			res.json as sinon.SinonStub,
			sinon.match({
				suffix: sinon.match.string,
				prefix: sinon.match.string,
				version: 'v1'
			})
		);
	});

	it('should handle PackageError.Empty error', async () => {
		const calculatePackagesStub = sinon.stub().rejects(PackageError.Empty);
		sinon.replace(deploy, 'calculatePackages', calculatePackagesStub);

		await deploy(req as Request, res as Response, next as NextFunction);

		sinon.assert.calledOnce(next);
		sinon.assert.calledWith(next, PackageError.Empty);
	});

	it('should handle other errors', async () => {
		const error = new Error('Some error');
		const calculatePackagesStub = sinon.stub().rejects(error);
		sinon.replace(deploy, 'calculatePackages', calculatePackagesStub);

		await deploy(req as Request, res as Response, next as NextFunction);

		sinon.assert.calledOnce(next);
		sinon.assert.calledWith(next, error);
	});
});
