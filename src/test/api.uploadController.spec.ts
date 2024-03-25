import busboy from 'busboy';
import { Request, Response } from 'express';

import * as fs from 'fs';
import * as sinon from 'sinon';

describe('Upload Controller Tests', () => {
	let req: Partial<Request>;
	let res: Partial<Response>;
	let next: sinon.SinonSpy;

	beforeEach(() => {
		req = {
			pipe: sinon.stub(),
			unpipe: sinon.stub(),
			headers: {}
		} as unknown as Request;
		res = {
			status: sinon.stub().returns({
				json: sinon.stub()
			})
		} as unknown as Response;
		next = sinon.spy();
	});

	afterEach(() => {
		sinon.restore();
	});

	it('should handle file upload properly', () => {
		const fileStream = fs.createReadStream('test.zip');
		const bb = busboy({ headers: req.headers });

		// Mock the 'on' method of busboy to simulate file upload
		sinon.stub(bb, 'on').callsFake((event, callback) => {
			if (event === 'file') {
				const fileStream = fs.createReadStream('test.zip');
				callback('file', fileStream, {
					mimeType: 'application/zip',
					filename: 'sample.zip'
				});
			}
			return bb;
		});
	});
});
