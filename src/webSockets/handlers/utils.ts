import fs from 'fs';
import path from 'path';
import { URLSearchParams } from 'url';
import { verify } from 'jsonwebtoken';
import { CustomError } from '@/errors';

interface RouteParams {
  [key: string]: string;
}

interface ParsedRoute {
  path: string;
  params: RouteParams;
}

export function getPathAndParams<T>(url: string | undefined): ParsedRoute {
  if (!url) {
    return { path: '', params: {} };
  }

  const [pathPart, queryPart] = url.split('?');
  const params = new URLSearchParams(queryPart);
  const paramsObject = Object.fromEntries(params.entries()) as T & RouteParams;

  return {
    path: pathPart,
    params: paramsObject,
  };
}

/**
 * Converts a route pattern into a regular expression
 * @param pattern - The route pattern (e.g., '/conversation/:conversationID')
 * @returns RegExp and parameter names
 */
export function createRouteRegex(pattern: string): {
  regex: RegExp;
  paramNames: string[];
} {
  const paramNames: string[] = [];
  const regexPattern = pattern
    .replace(/:[a-zA-Z]+/g, (match) => {
      const paramName = match.slice(1);
      paramNames.push(paramName);
      return '([0-9]+)'; // Only matches positive integers
    })
    .replace(/\//g, '\\/');

  return {
    regex: new RegExp(`^${regexPattern}$`),
    paramNames,
  };
}

/**
 * Matches a path against a route pattern and extracts parameters
 * @param pattern - The route pattern (e.g., '/conversation/:conversationID')
 * @param path - The actual path (e.g., '/conversation/123')
 * @returns Matched parameters or null if no match
 */
export function matchRoute(pattern: string, path: string): RouteParams | null {
  const { regex, paramNames } = createRouteRegex(pattern);
  const match = path.match(regex);

  // console.log('[webSocket][matchRoute]: pattern', pattern);
  // console.log('[webSocket][matchRoute]: path', path);
  // console.log('[webSocket][matchRoute]: regex', regex);
  // console.log('[webSocket][matchRoute]: paramNames', paramNames);
  // console.log('[webSocket][matchRoute]: match', match);

  if (!match) {
    return null;
  }

  const params: RouteParams = {};
  paramNames.forEach((name, index) => {
    params[name] = match[index + 1];
  });

  return params;
}

export const validateWebSocketToken = (token: string) => {
  const pathToPublicKey = path.join(
    __dirname,
    '../../../keys',
    'jwt_public.key'
  );
  const PUB_KEY = fs.readFileSync(pathToPublicKey, 'utf8');
  const jwtPayload = verify(token, PUB_KEY);

  if (!jwtPayload || typeof jwtPayload === 'string') {
    throw new CustomError(401, 'Invalid JWT token');
  }

  const userID = jwtPayload.user.id;

  return userID;
};
