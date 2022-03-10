import { AxiosRequestHeaders } from 'axios';
// [INSERT CLIENT IMPORTS]

export type BaseParams = { baseUrl: string; headers: AxiosRequestHeaders };

export type AxiosClient = {
    setHeaders: (headers: BaseParams['headers']) => AxiosClient;
    setBaseUrl: (headers: BaseParams['baseUrl']) => AxiosClient;
    // [INSERT CLIENT TYPINGS]
};
