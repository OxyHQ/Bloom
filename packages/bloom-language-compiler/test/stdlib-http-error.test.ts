/**
 * @jest-environment node
 *
 * `HTTPError.cast` (`stdlib/Bloom/runtime.ts`'s `httpErrorFrom`): the error `HTTPClient`
 * throws is itself, a TS client's (Axios's `response`) becomes one, anything else is not one.
 */
import { httpErrorFrom } from '../stdlib/Bloom/runtime';

describe('httpErrorFrom', () => {
  it('keeps the standard library’s own error', () => {
    const response = { status: 404, headers: {}, text: 'missing' };
    const error = { status: 404, body: 'missing', message: 'GET /x: 404', response };
    expect(httpErrorFrom(error)).toBe(error);
  });

  it('reads an Axios error’s response, its data as text', () => {
    const error = Object.assign(new Error('Request failed with status code 409'), {
      isAxiosError: true,
      response: {
        status: 409,
        data: { error: 'taken' },
        headers: { 'Content-Type': 'application/json' },
      },
    });
    expect(httpErrorFrom(error)).toEqual({
      status: 409,
      body: '{"error":"taken"}',
      message: 'Request failed with status code 409',
      response: {
        status: 409,
        headers: { 'content-type': 'application/json' },
        text: '{"error":"taken"}',
      },
    });
  });

  it('is undefined for a network failure or a value that is not an error', () => {
    expect(httpErrorFrom(new TypeError('Network request failed'))).toBeUndefined();
    expect(httpErrorFrom({ response: { status: 'nope' } })).toBeUndefined();
    expect(httpErrorFrom(undefined)).toBeUndefined();
    expect(httpErrorFrom('boom')).toBeUndefined();
  });
});
