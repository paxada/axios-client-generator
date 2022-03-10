import { AxiosClient, BaseParams } from './client.types';
import { AxiosRequestHeaders } from 'axios';
// [INSERT IMPORTS]

export const getAxiosClient = (baseParams: BaseParams): AxiosClient => {
    return {
        setHeaders: (headers: AxiosRequestHeaders) => {
            return getAxiosClient({ ...baseParams, headers });
        },
        setBaseUrl: (baseUrl: string) => {
            return getAxiosClient({ ...baseParams, baseUrl });
        },
        // [INSERT CLIENT]
    };
};
