/**
 * MemberAvatar — shows member photo if available, otherwise a coloured initials circle.
 * Used in auction conduct screen, member list, and member details.
 */

const COLOURS = [
    '#1677ff', '#52c41a', '#fa8c16', '#eb2f96',
    '#722ed1', '#13c2c2', '#f5222d', '#faad14',
];

function getColour(name = '') {
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return COLOURS[Math.abs(hash) % COLOURS.length];
}

function getInitials(name = '') {
    const parts = name.trim().split(' ').filter(Boolean);
    if (parts.length === 0) return '?';
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const MemberAvatar = ({
    name = '',
    photoUrl = null,
    size = 40,
    className = '',
    style = {},
    onClick,
}) => {
    const baseStyle = {
        width: size,
        height: size,
        borderRadius: '50%',
        overflow: 'hidden',
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: onClick ? 'pointer' : 'default',
        ...style,
    };

    if (photoUrl) {
        return (
            <div style={baseStyle} className={className} onClick={onClick}>
                <img
                    src={photoUrl}
                    alt={name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={(e) => {
                        // Fall back to initials if image fails to load
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.parentElement.style.backgroundColor = getColour(name);
                        e.currentTarget.parentElement.innerHTML = `<span style="color:white;font-weight:700;font-size:${Math.round(size * 0.38)}px">${getInitials(name)}</span>`;
                    }}
                />
            </div>
        );
    }

    return (
        <div
            style={{ ...baseStyle, backgroundColor: getColour(name) }}
            className={className}
            onClick={onClick}
        >
            <span style={{ color: 'white', fontWeight: 700, fontSize: Math.round(size * 0.38) }}>
                {getInitials(name)}
            </span>
        </div>
    );
};

export default MemberAvatar;
