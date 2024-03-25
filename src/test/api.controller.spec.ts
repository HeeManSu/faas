import * as assert from 'assert';
import { Request, Response } from 'express';
import { describe, it } from 'mocha';
import { validateAndDeployEnabled } from '../api';

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

// describe('deploy function', () => {
// 	let req: Partial<Request>, res: Partial<Response>, next: sinon.SinonStub;

// 	beforeEach(() => {
// 		req = { body: {} };
// 		res = { status: sinon.stub().returnsThis(), json: sinon.stub() };
// 		next = sinon.stub();
// 	});

// 	it('should install dependencies when resourceType is "Repository"', async () => {
// 		req.body.resourceType = 'Repository';
// 		const calculatePackagesStub = sinon.stub().resolves();
// 		const installDependenciesStub = sinon.stub().resolves();
// 		sinon.replace(deploy, 'calculatePackages', calculatePackagesStub);
// 		sinon.replace(deploy, 'installDependencies', installDependenciesStub);

// 		await deploy(req as Request, res as Response, next);

// 		sinon.assert.calledOnce(calculatePackagesStub);
// 		sinon.assert.calledOnce(installDependenciesStub);
// 		sinon.assert.calledWith(res.status as sinon.SinonStub, 200);
// 		sinon.assert.calledWith(
// 			res.json as sinon.SinonStub,
// 			sinon.match({
// 				suffix: sinon.match.string,
// 				prefix: sinon.match.string,
// 				version: 'v1'
// 			})
// 		);
// 	});
// });
