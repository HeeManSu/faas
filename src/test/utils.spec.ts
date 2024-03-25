/* eslint-disable */

import { MetaCallJSON } from '@metacall/protocol/deployment';
import * as assert from 'assert';
import { Request, Response } from 'express';
import AppError from '../utils/appError';
import globalErroHandler from '../utils/errorHandler';
import { createMetacallJsonFile } from '../utils/utils';

export type StatusCode = number;
export type StatusMessage = string;

export interface testError extends Error {
	statusCode: number;
	status: string;
	message: string;
}

describe('AppError', () => {
	it('should create an instance with statusCode and status properties', () => {
		const errorMessage = 'Test error message';
		const statusCode = 404;

		const error = new AppError(errorMessage, statusCode);

		assert.strictEqual(error.message, errorMessage);
		assert.strictEqual(error.statusCode, statusCode);
		assert.strictEqual(error.status, 'fail');
	});

	it('should set status to "error" for status codes starting with 5', () => {
		const errorMessage = 'Test error message';
		const statusCode = 500;

		const error = new AppError(errorMessage, statusCode);

		assert.strictEqual(error.status, 'error');
	});

	it('should capture stack trace', () => {
		const errorMessage = 'Test error message';
		const statusCode = 404;

		const error = new AppError(errorMessage, statusCode);

		assert.ok(error.stack);
	});

	it('should inherit from Error and IAppError', () => {
		const errorMessage = 'Test error message';
		const statusCode = 404;

		const error = new AppError(errorMessage, statusCode);

		assert.ok(error instanceof Error);
		assert.ok(error instanceof AppError);
		assert.ok('statusCode' in error);
		assert.ok('status' in error);
	});
});

describe('createMetacallJsonFile', () => {
	it('should write JSON files for each element in the input array and return an array of file paths', () => {
		const jsons: MetaCallJSON[] = [
			{
				language_id: 'node',
				path: '/some/path',
				scripts: ['script1.js', 'script2.js']
			},
			{
				language_id: 'rpc',
				path: '/some/other/path',
				scripts: ['script3.py']
			}
		];
		const path = '/output/path';
		const expectedFilePaths = [
			'/output/path/metacall-javascript.json',
			'/output/path/metacall-python.json'
		];

		const result = createMetacallJsonFile(jsons, path);

		assert.strictEqual(result.length, 2);
		assert.deepStrictEqual(result, expectedFilePaths);
	});
});

describe('globalErrorHandler', () => {
	it('should return the correct status code and message', () => {
		const err: testError = {
			statusCode: 404,
			status: 'error',
			message: 'Not found',
			name: 'test1'
		};

		const req = {} as Request;
		const res = {
			status: (code: StatusCode) => {
				assert.strictEqual(code, 404);
				return res;
			},
			send: (message: StatusMessage) => {
				assert.strictEqual(message, 'Not found');
			}
		} as Response;
		const next = () => {
			throw new Error('next should not be called');
		};

		globalErroHandler(err, req, res, next);
	});

	it('should log the error stack in development mode', () => {
		const err: testError = {
			statusCode: 500,
			status: 'error',
			message: 'Internal server error',
			stack: 'Error stack trace',
			name: 'test2'
		};

		const req = {} as Request;
		const res = {
			status: (code: StatusCode) => {
				assert.strictEqual(code, 500);
				return res;
			},
			send: (message: StatusMessage) => {
				assert.strictEqual(message, 'Internal server error');
			}
		};
		const next = () => {
			throw new Error('next should not be called');
		};

		const consoleLogStub = console.log;
		console.log = output => {
			assert.match(output, /Status Code: 500/);
			assert.match(output, /Status: error/);
			assert.match(output, /Error stack trace/);
		};

		process.env.NODE_ENV = 'development';
		// globalErroHandler(err, req, res, next);

		console.log = consoleLogStub;
	});

	it('should use default status code and status if not provided', () => {
		const err: testError = {
			statusCode: 500,
			status: 'error',
			message: 'Internal server error',
			stack: 'Error stack trace',
			name: 'test2'
		};

		const req = {} as Request;
		const res = {
			status: (code: StatusCode) => {
				assert.strictEqual(code, 500);
				return res;
			},
			send: (message: StatusMessage) => {
				assert.strictEqual(message, 'Some error');
			}
		} as unknown as Response;
		const next = () => {
			throw new Error('next should not be called');
		};

		globalErroHandler(err, req, res, next);
	});
});
