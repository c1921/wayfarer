import type { LocationId, LocationNode } from './types';

export const START_LOCATION: LocationId = 'mist-path';

export const LOCATIONS: Record<LocationId, LocationNode> = {
    'mist-path': {
        id: 'mist-path',
        name: '寒雾林径',
        subtitle: '雾在树根间缓慢流动。',
        description: '旧路被苔痕分成细碎的线，远处没有鸟声。',
        eventId: 'mist-bell',
        routes: [
            {
                target: 'old-bridge',
                label: '旧桥营地',
                travelText: '沿着湿冷的车辙往低处走。',
                distance: 18800
            },
            {
                target: 'moonwell',
                label: '月井村口',
                travelText: '顺着银白色的溪声穿过林影。',
                distance: 22400
            }
        ]
    },
    'old-bridge': {
        id: 'old-bridge',
        name: '旧桥营地',
        subtitle: '桥下的水看不见尽头。',
        description: '几根焦黑木桩围着冷灰，像有人刚离开很久。',
        eventId: 'camp-ashes',
        routes: [
            {
                target: 'mist-path',
                label: '寒雾林径',
                travelText: '回到雾气更深的林间旧路。',
                distance: 17600
            },
            {
                target: 'gray-tower',
                label: '灰塔遗址',
                travelText: '踩过断桥石缝，向山脊的残塔前行。',
                distance: 23600
            }
        ]
    },
    'gray-tower': {
        id: 'gray-tower',
        name: '灰塔遗址',
        subtitle: '风从无门的塔身穿过。',
        description: '残墙投下狭长阴影，石阶上积着细小的白霜。',
        eventId: 'tower-shadow',
        routes: [
            {
                target: 'old-bridge',
                label: '旧桥营地',
                travelText: '离开高处，沿碎石坡回到桥边。',
                distance: 19600
            },
            {
                target: 'moonwell',
                label: '月井村口',
                travelText: '越过矮丘，跟随井水反射出的微光。',
                distance: 20800
            }
        ]
    },
    'moonwell': {
        id: 'moonwell',
        name: '月井村口',
        subtitle: '空村外的井还映着月亮。',
        description: '木门半掩，井绳轻晃，整条街像在屏息。',
        eventId: 'moonwell-water',
        routes: [
            {
                target: 'mist-path',
                label: '寒雾林径',
                travelText: '离开村口，回到树影和雾交叠的地方。',
                distance: 21000
            },
            {
                target: 'gray-tower',
                label: '灰塔遗址',
                travelText: '从空村背后的石径走向残塔。',
                distance: 19200
            }
        ]
    }
};

export const TOTAL_LOCATIONS = Object.keys(LOCATIONS).length;
