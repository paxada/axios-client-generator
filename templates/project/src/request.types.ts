export type RequestError<
    T = {
        code: string;
        message: string;
    }
> = {
    hasFailed: true;
    status: number;
    data: T;
};

export type RequestSuccess<T> = {
    hasFailed: false;
    status: number;
    error: T;
};
