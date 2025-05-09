import crypto from 'crypto';
import { AuthMethodNames } from "./Constants";
import packageData from "../../package.json" assert { type: 'json' };

/***
 * The TeleSign RestClient is a generic HTTP REST client that can be extended to make
 * requests against any of TeleSign's REST API endpoints.
 *
 * See https://developer.telesign.com for detailed API documentation.
 */
export default class RestClient {
  constructor(requestWrapper, customerId, apiKey) {
    var restEndpoint = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : "https://rest-api.telesign.com";
    var timeout = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : 15000;
    var userAgent = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : null;
    var contentType = arguments.length > 6 && arguments[6] !== undefined ? arguments[6] : "application/x-www-form-urlencoded";
    this.requestWrapper = requestWrapper;
    this.customerId = customerId;
    this.apiKey = apiKey;
    this.restEndpoint = restEndpoint === null ? "https://rest-api.telesign.com" : restEndpoint;
    this.timeout = timeout;
    this.contentType = contentType;
    if (userAgent === null) {
      var version = packageData.version;
      this.userAgent = "TeleSignSDK/ECMAScript-Node v ".concat(version) + " ".concat(process.arch) + "/".concat(process.platform) + " ".concat(process.release.name) + "/".concat(process.version); // Generates a Node useragent - helpful in diagnosing errors
    }
  }

  /***
   * Generates the TeleSign REST API headers used to authenticate requests.
   *
   * Creates the canonicalized stringToSign and generates the HMAC signature. This is used to
   * authenticate requests against the TeleSign REST API.
   *
   * See https://developer.telesign.com/docs/authentication for detailed API documentation.
   *
   * @param customerId: Your account customerId.
   * @param apiKey: Your account apiKey.
   * @param methodName: The HTTP method name of the request as a upper case string, should be one
   * of 'POST', 'GET', 'PUT' or 'DELETE'.
   * @param resource: The partial resource URI to perform the request against, as a string.
   * @param urlEncodedFields: HTTP body parameters to perform the HTTP request with, must be a
   * urlencoded string.
   * @param date: The date and time of the request formatted in rfc 2616, as a string.
   * @param nonce: A unique cryptographic nonce for the request, as a string.
   * @param userAgent: (optional) User Agent associated with the request, as a string.
   * @param authMethod : (optional) Authentication type. For ex: Basic, HMAC etc
   * @returns headers: {{Authorization: string, Date: *, Content-Type: string,
   * x-ts-auth-method: string, x-ts-nonce: *}}
   */
  static generateTeleSignHeaders(customerId, apiKey, methodName, resource, contentType, encodedFields) {
    var date = arguments.length > 6 && arguments[6] !== undefined ? arguments[6] : null;
    var nonce = arguments.length > 7 && arguments[7] !== undefined ? arguments[7] : null;
    var userAgent = arguments.length > 8 && arguments[8] !== undefined ? arguments[8] : null;
    var authMethod = arguments.length > 9 && arguments[9] !== undefined ? arguments[9] : null;
    return function (contentType, authMethod) {
      if (date == null) {
        date = new Date().toUTCString();
      }
      if (nonce == null) {
        nonce = crypto.randomUUID(); // generates a Random NONCE (Number Used Only Once)
      }
      var contentType = methodName == "POST" || methodName == "PUT" ? contentType : "";
      var authMethod = authMethod != null ? authMethod : AuthMethodNames.HMAC_SHA256;
      var urlencoded = "";
      if (encodedFields != null && encodedFields.length > 0) {
        urlencoded = "\n" + encodedFields;
      }
      /** @type {any} */
      var stringToSignBuilder = methodName + "\n" + contentType + "\n" + date + "\n" + "x-ts-auth-method:" + authMethod + "\n" + "x-ts-nonce:" + nonce + urlencoded + "\n" + resource;
      if (authMethod === AuthMethodNames.BASIC) {
        var authorization = "Basic " + Buffer.from(customerId + ":" + apiKey).toString('base64');
      } else {
        var signedStrUTF8 = stringToSignBuilder.toString('utf8');
        var decodedAPIKey = Buffer.from(apiKey, 'base64');

        /** @type {any} */
        var jsSignature = crypto.createHmac("sha256", decodedAPIKey).update(signedStrUTF8).digest("base64");
        jsSignature = jsSignature.toString('utf8');
        // console.log("js Signature: " + jsSignature);

        var authorization = "TSA " + customerId + ":" + jsSignature;
      }
      var headers = {
        "Authorization": authorization,
        "Date": date,
        "Content-Type": contentType,
        "x-ts-auth-method": authMethod,
        "x-ts-nonce": nonce
      };
      if (userAgent != null) headers["User-Agent"] = userAgent;
      return headers;
    }(contentType, authMethod);
  } // method generateTeleSignHeaders

  /***
   * Generic TeleSign REST API request handler.
   *
   * @param callback: Callback method to handle response.
   * @param methodName: The HTTP method name, as an upper case string.
   * @param resource: The partial resource URI to perform the request against, as a string.
   * @param authMethod: (optional) Authentication type. For ex: Basic, HMAC etc
   * @param params: Body params to perform the HTTP request with, as a dictionary.
   */
  execute(callback, methodName, resource) {
    var params = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : null;
    var authMethod = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : null;
    var nonce = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : null;
    var date = arguments.length > 6 && arguments[6] !== undefined ? arguments[6] : null;
    var telesignURL = this.restEndpoint + resource;
    var bodyData = this.contentType == "application/json" ? "{}" : null;
    if (methodName == "POST" || methodName == "PUT") {
      if (params != null && Object.keys(params).length > 0) {
        if (this.contentType == "application/x-www-form-urlencoded") {
          var urlSearchParams = new URLSearchParams(params);
          bodyData = urlSearchParams.toString();
        } else {
          bodyData = JSON.stringify(params);
        }
      }
    } else {
      // GET method
      if (params != null) {
        var url = new URL(this.restEndpoint + resource);
        Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));
        telesignURL = url.toString();
      } else {
        telesignURL = new URL(this.restEndpoint + resource).toString();
      }
    }
    var headers = RestClient.generateTeleSignHeaders(this.customerId, this.apiKey, methodName, resource, this.contentType, bodyData, date !== null ? date : null, nonce, this.userAgent, authMethod);
    var requestParams = {
      headers: headers,
      url: telesignURL,
      method: methodName,
      timeout: this.timeout
    };
    if (bodyData != null) {
      requestParams.body = bodyData;
    }
    this.requestWrapper.request(requestParams, function (err, res, bodyStr) {
      if (err) {
        console.error("FATAL ERROR: ".concat(date !== null ? date : new Date()) + " Problems contacting Telesign Servers. Check your internet connection.");
        if (callback) {
          callback(err, bodyStr);
        }
      }
      if (res) {
        var body = JSON.parse(bodyStr);
        if (callback) {
          callback(err, body);
        }
      }
    });
  }
}