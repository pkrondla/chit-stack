import { getAbsoluteApiUrl } from '../config/apiConfig';

export const downloadFile = (url) => {
    const token = localStorage.getItem('token');
    if (!token) {
        console.error('No authorization token found!');
        return;
    }

    const absoluteUrl = getAbsoluteApiUrl(url);
    const separator = absoluteUrl.includes('?') ? '&' : '?';

    window.open(`${absoluteUrl}${separator}access_token=${token}`, '_blank');
};
