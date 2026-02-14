export const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const formatApiResponse = (data: any, message = 'Success', success = true) => {
    return {
        success,
        message,
        data
    };
};
