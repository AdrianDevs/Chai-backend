import { parse } from 'url';

/**
 * Get path and params from a url
 * @param url - the url to get path and params from
 * @returns the path and params in an object of format { path: pathValue, params: paramsValue }
 */
export const getPathAndParams = (urlString: string) => {
  try {
    const parsed = parse(urlString, true);
    if (!parsed) {
      throw new Error('Invalid URL');
    }
    const path = parsed.pathname;
    const result = { path, params: {} as Record<string, string> };
    const params = parsed.query;
    for (const [key, value] of Object.entries(params)) {
      result.params[key] = value as string;
    }
    return result;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error parsing URL:', error);
    return { path: '', params: {} };
  }
};

export const getPath = (url: string) => {
  const { path } = getPathAndParams(url);
  return path;
};

export const getParams = (url: string) => {
  const { params } = getPathAndParams(url);
  return params;
};
