import { AxiosRequestConfig } from 'axios';
// [INSERT CLIENT IMPORTS]

export type BaseParams = { baseUrl: string; headers: AxiosRequestConfig['headers'] };

export type AxiosClient = {
    setHeaders: (headers: BaseParams['headers']) => AxiosClient;
    setBaseUrl: (headers: BaseParams['baseUrl']) => AxiosClient;
    // [INSERT CLIENT TYPINGS]
};
