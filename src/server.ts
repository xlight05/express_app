/**
 * Setup express server.
 */

import express, { Request, Response, NextFunction } from 'express';
import logger from 'jet-logger';
import axios, { AxiosRequestConfig, Method } from 'axios';
// import queryString from 'query-string';

import 'express-async-errors';

import BaseRouter from '@src/routes/api';
import Paths from '@src/constants/Paths';

import EnvVars from '@src/constants/EnvVars';
import HttpStatusCodes from '@src/constants/HttpStatusCodes';

import { NodeEnvs } from '@src/constants/misc';
import { RouteError } from '@src/other/classes';


// **** Variables **** //

const app = express();


// **** Setup **** //

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({extended: true}));
// app.use(cookieParser(EnvVars.CookieProps.Secret));

// // Show routes called in console during development
// if (EnvVars.NodeEnv === NodeEnvs.Dev.valueOf()) {
//   app.use(morgan('dev'));
// }

// Security
// if (EnvVars.NodeEnv === NodeEnvs.Production.valueOf()) {
//   app.use(helmet());
// }

// Add APIs, must be after middleware
app.use(Paths.Base, BaseRouter);

// Add error handler
app.use((
  err: Error,
  _: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction,
) => {
  if (EnvVars.NodeEnv !== NodeEnvs.Test.valueOf()) {
    logger.err(err, true);
  }
  let status = HttpStatusCodes.BAD_REQUEST;
  if (err instanceof RouteError) {
    status = err.status;
  }
  return res.status(status).json({ error: err.message });
});


// Nav to users pg by default
app.get('/', async (_: Request, res: Response) => {
  // const docJson = await getReq(`docs/ballerina/http/2.10.1`);

  const payload = {
    "modules": [
        {
            "organization": "ballerina",
            "moduleName": "http",
            "version": "2.10.1"
        }
    ]
};
const resolveModulesRes = await postReq(`registry/packages/resolve-modules`, payload);

  return res.json(resolveModulesRes);
});


const instance = axios.create({
  baseURL: "https://api.staging-central.ballerina.io",
});

axios.defaults.headers.common['Content-Type'] = 'application/json';
axios.defaults.headers.common['Accept'] = 'application/json';

function postReq<T>(
  path: string,
  data: any,
  queryParams: any = null,
  token = ''
) {
  return apiRequest<T>(
    'post',
    '2.0',
    path,
    data,
    token,
    queryParams
  );
}

function getReq<T>(
  path: string,
  queryParams: any = null,
  token = ''
) { 
  return apiRequest<T>(
    'get',
    '2.0',
    path,
    null,
    token,
    queryParams
  );
}

function apiRequest<T>(
  method: Method,
  apiVersion: string,
  path: string,
  data: any,
  token  = '',
  queryParams: any = null
) { 
  const url = createUrl(apiVersion, path, queryParams); 
  const options = createRequestOptions(url, method, data, token);
  return instance
    .request<T>(options)
    .then((res) => res && res.data)
    .catch((error) => {
      console.log(error);

      if (!error.response) {
        console.log(error);
      }
      throw error;
    });
}

function createUrl(
  apiVersion: string,
  path: string,
  queryParams: any = null
) {
  let url = `${apiVersion}/${path}`;

  return (url);
}

function createRequestOptions(
  url: string,
  method: Method,
  data: any,
  token: string,
  responseType?: any,
) {
  let jwtToken = "";
  const options: AxiosRequestConfig = {
    url,
    method,
    data,
    // params: {meow:"hello",hello:"qqq"},
    headers: jwtToken === '' 
    ? {
      'Content-Type': 'application/json; charset=utf-8',
      'Accept-Encoding': 'application/json',
      'Accept': 'application/json',
      'X-Central-Frontend': true,
      'X-Lib-Site': true
    } 
    : {
      Authorization: 'Bearer ' + jwtToken,
      'Content-Type': 'application/json; charset=utf-8',
      'Accept-Encoding': 'application/json',
      'Accept': 'application/json',
      'X-Central-Frontend': true,
      'X-Lib-Site': true
    },
    timeout: 30000, // 30 seconds
    withCredentials: true,
    // adapter: cache.adapter,
  };

  if (responseType) {
    options.responseType = responseType;
  }

  return options;
}



// **** Export default **** //

export default app;
