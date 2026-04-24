const configuredApiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5045/api';

export const apiBaseUrl = configuredApiUrl.replace(/\/+$/, '');
export const apiOrigin = apiBaseUrl.replace(/\/api$/, '');

export const getHubUrl = (hubPath) => {
    const normalizedHubPath = hubPath.startsWith('/') ? hubPath : `/${hubPath}`;
    return `${apiOrigin}${normalizedHubPath}`;
};

export const getAbsoluteApiUrl = (relativePath) => {
    if (relativePath.startsWith('http')) {
        return relativePath;
    }

    const normalizedPath = relativePath.startsWith('/') ? relativePath : `/${relativePath}`;
    return `${apiBaseUrl}${normalizedPath}`;
};
