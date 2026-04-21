export const downloadFile = (url) => {
    const token = localStorage.getItem('token');
    if (!token) {
        console.error('No authorization token found!');
        return;
    }

    const baseUrl = 'http://localhost:5045/api';
    const absoluteUrl = url.startsWith('http') ? url : `${baseUrl}${url}`;
    const separator = absoluteUrl.includes('?') ? '&' : '?';

    window.open(`${absoluteUrl}${separator}access_token=${token}`, '_blank');
};
