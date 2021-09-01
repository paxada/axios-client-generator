export type RequestError<
    T = {
        code: string;
        message: string;
    }
> = {
    hasFailed: true;
    status: number;
    error: T;
};

export type RequestSuccess<T> = {
    hasFailed: false;
    status: number;
    data: T;
};
