import { AxiosClient, BaseParams } from './client.types';
// [INSERT IMPORTS]

export const getAxiosClient = (baseParams: BaseParams): AxiosClient => {
    return {
        setHeaders: (headers: Record<string, unknown>) => {
            return getAxiosClient({ ...baseParams, headers });
        },
        setBaseUrl: (baseUrl: string) => {
            return getAxiosClient({ ...baseParams, baseUrl });
        },
        // [INSERT CLIENT]
    };
};
