import { Spin } from 'antd';

const Loading = ({ fullScreen = false }) => {
    return (
        <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            height: fullScreen ? '100vh' : '100%',
            width: '100%',
            padding: '2rem'
        }}>
            <Spin size="large" description="Loading..." />
        </div>
    );
};

export default Loading;
