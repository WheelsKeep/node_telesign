const RestClient = require('../src/RestClient');
const AxiosRequestWrapperMock = require('./RequestWrapperMock');
const { RequestWrapper, AxiosRequestWrapper } = require('../src/RequestWrapper');
const axios = require('axios');

jest.mock('axios');

// REST Client Tests -----------------------------
describe('AxiosRequestWrapper', () => {
  const customerId = 'FFFFFFFF-EEEE-DDDD-1234-AB1234567890';
  const apiKey = 'VGVzdCBLZXk=';
  const restEndpoint = 'https://rest-api.telesign.com';
  const timeout = 15000;
  const userAgent = 'unit_test';
  const contentType = 'application/json';
  const headers = { "field": "header-value" };
  const bodyStr = '{\"data\":\"data-value\"}';
  const errorBody = { "data": "error-value" };
  const successBody = { data: 'data-value' };
  const getOptions = { method: 'GET', field: 'value' };
  const postOptions = { method: 'POST', field: 'value' };
  const putOptions = { method: 'PUT', field: 'value' };

  describe('AxiosRequestWrapper', () => {

    afterEach(() => {
      jest.clearAllMocks();
    });

    it('should return response when POST is successful', async () => {
      axios.post.mockImplementation((options, callback) => {
        return Promise.resolve({ status: 200, data: successBody, headers: { field: 'header-value' }});
      });
      const requestWrapper = new AxiosRequestWrapper();

      const [response, bodyStr] = await new Promise((resolve) => {
        requestWrapper.request(postOptions, (err, res, bodyStr) => resolve([res, bodyStr]))
      });

      expect(response).toHaveProperty('status', 200);
      expect(response).toHaveProperty('headers', headers);
      expect(response).toHaveProperty('bodyStr', bodyStr);
      expect(bodyStr).toEqual(bodyStr);
    });

    it('should return error when POST fails', async () => {
      axios.post.mockImplementation((options, callback) => {
        return Promise.reject({ response: { status: 402, data: errorBody, headers: { field: 'header-value' }}});
      });
      const requestWrapper = new AxiosRequestWrapper();

      const [error, bodyStr] = await new Promise((resolve) => {
        requestWrapper.request(postOptions, (err, res, bodyStr) => resolve([err, bodyStr]))
      });

      expect(error.response).toHaveProperty('status', 402);
      expect(error.response).toHaveProperty('headers', headers);
      expect(error.response).toHaveProperty('data', errorBody);
      expect(bodyStr).toEqual(errorBody);
    });

    it('should return error when PUT is successful', async () => {
      axios.put.mockImplementation((options, callback) => {
        return Promise.resolve({ status: 200, data: successBody, headers: { field: 'header-value' }});
      });
      const requestWrapper = new AxiosRequestWrapper();

      const [response, bodyStr] = await new Promise((resolve) => {
        requestWrapper.request(putOptions, (err, res, bodyStr) => resolve([res, bodyStr]))
      });

      expect(response).toHaveProperty('status', 200);
      expect(response).toHaveProperty('headers', headers);
      expect(response).toHaveProperty('bodyStr', bodyStr);
      expect(bodyStr).toEqual(bodyStr);
    });

    it('should return error when PUT fails', async () => {
      axios.put.mockImplementation((options, callback) => {
        return Promise.reject({ response: { status: 400, data: errorBody, headers: { field: 'header-value' }}});
      });
      const requestWrapper = new AxiosRequestWrapper();

      const [error, bodyStr] = await new Promise((resolve) => {
        requestWrapper.request(putOptions, (err, res, bodyStr) => resolve([err, bodyStr]))
      });

      expect(error.response).toHaveProperty('status', 400);
      expect(error.response).toHaveProperty('headers', headers);
      expect(error.response).toHaveProperty('data', errorBody);
      expect(bodyStr).toEqual(errorBody);
    });

    it('should return error when GET is successful', async () => {
      axios.get.mockImplementation((options, callback) => {
        return Promise.resolve({ status: 200, data: successBody, headers: headers});
      });
      const requestWrapper = new AxiosRequestWrapper();

      const [response, bodyStr] = await new Promise((resolve) => {
        requestWrapper.request(getOptions, (err, res, bodyStr) => resolve([res, bodyStr]))
      });

      expect(response).toHaveProperty('status', 200);
      expect(response).toHaveProperty('headers', headers);
      expect(response).toHaveProperty('bodyStr', bodyStr);
      expect(bodyStr).toEqual(bodyStr);
    });

    it('should return error when GET fails with null response data', async () => {
      axios.get.mockImplementation((options, callback) => {
        return Promise.reject(null);
      });
      const requestWrapper = new AxiosRequestWrapper();

      const [error, bodyStr] = await new Promise((resolve) => {
        requestWrapper.request(getOptions, (err, res, bodyStr) => resolve([err, bodyStr]))
      });

      expect(bodyStr).toEqual(null);
      expect(error).toEqual(null);
    });

    it('should return error when GET fails with empty response data', async () => {
      axios.get.mockImplementation((options, callback) => {
        return Promise.reject({});
      });
      const requestWrapper = new AxiosRequestWrapper();

      const [error, bodyStr] = await new Promise((resolve) => {
        requestWrapper.request(getOptions, (err, res, bodyStr) => resolve([err, bodyStr]))
      });

      expect(bodyStr).toEqual(null);
      expect(error).toEqual({});
    });

     it('should return error when GET fails', async () => {
      axios.get.mockImplementation((options, callback) => {
        return Promise.reject({ response: { status: 400, data: errorBody, headers: headers}});
      });
      const requestWrapper = new AxiosRequestWrapper();

      const [error, bodyStr] = await new Promise((resolve) => {
        requestWrapper.request(getOptions, (err, res, bodyStr) => resolve([err, bodyStr]))
      });

      expect(error.response).toHaveProperty('status', 400);
      expect(error.response).toHaveProperty('headers', headers);
      expect(error.response).toHaveProperty('data', errorBody);
      expect(bodyStr).toEqual(errorBody);
    });

    it('should log error for an unsupported method', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      axios.patch.mockImplementation((options, callback) => {
        return Promise.reject({ response: { status: 400, data: errorBody, headers: headers}});
      });
      const options = { method: 'DELETE', field: 'value' }
      const requestWrapper = new AxiosRequestWrapper();

      requestWrapper.request(options, null);

      expect(consoleSpy).toHaveBeenCalledWith('Method: DELETE not supported!');
      consoleSpy.mockRestore();
    });

    describe('AxiosRequestWrapper', () => {
      it('should throw an error when request method is called', () => {
        const requestWrapper = new RequestWrapper();

        try {
          requestWrapper.request({}, () => {});
          fail('Expected an error to be thrown, but none was thrown.');
        } catch (error) {
          expect(error.message).toBe('makeRequest method must be implemented.');
        }
      });
    });
  });
});
