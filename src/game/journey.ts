export type LocationId = 'mist-path' | 'old-bridge' | 'gray-tower' | 'moonwell';

export interface Route
{
    target: LocationId;
    label: string;
    travelText: string;
    distance: number;
}

export interface LocationNode
{
    id: LocationId;
    name: string;
    subtitle: string;
    description: string;
    routes: Route[];
    eventId: string;
}

export interface ChoiceDelta
{
    mood?: number;
    discoveries?: string[];
    keepsakes?: string[];
}

export interface EventChoice
{
    label: string;
    result: string;
    delta: ChoiceDelta;
}

export interface EventCard
{
    id: string;
    title: string;
    body: string;
    choices: EventChoice[];
}

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
                distance: 940
            },
            {
                target: 'moonwell',
                label: '月井村口',
                travelText: '顺着银白色的溪声穿过林影。',
                distance: 1120
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
                distance: 880
            },
            {
                target: 'gray-tower',
                label: '灰塔遗址',
                travelText: '踩过断桥石缝，向山脊的残塔前行。',
                distance: 1180
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
                distance: 980
            },
            {
                target: 'moonwell',
                label: '月井村口',
                travelText: '越过矮丘，跟随井水反射出的微光。',
                distance: 1040
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
                distance: 1050
            },
            {
                target: 'gray-tower',
                label: '灰塔遗址',
                travelText: '从空村背后的石径走向残塔。',
                distance: 960
            }
        ]
    }
};

export const EVENTS: Record<string, EventCard> = {
    'mist-bell': {
        id: 'mist-bell',
        title: '枝上的铃',
        body: '一只无声铜铃挂在枯枝上。\n它随风摆动，却没有发出任何声响。',
        choices: [
            {
                label: '取下铜铃',
                result: '铜铃冰冷，却让掌心有了重量。',
                delta: { keepsakes: ['无声铜铃'], mood: 1 }
            },
            {
                label: '记下风向',
                result: '你辨出雾里有一条稳定的风线。',
                delta: { discoveries: ['雾林的风向'] }
            }
        ]
    },
    'camp-ashes': {
        id: 'camp-ashes',
        title: '冷灰营火',
        body: '营火只剩灰白色的边缘。\n灰里压着半张写不完的地图。',
        choices: [
            {
                label: '添一把柴',
                result: '火光短暂亮起，桥上的影子退后一步。',
                delta: { mood: 1 }
            },
            {
                label: '收起残图',
                result: '残图上标着一口没有名字的井。',
                delta: { discoveries: ['残缺路图'] }
            }
        ]
    },
    'tower-shadow': {
        id: 'tower-shadow',
        title: '塔阶阴影',
        body: '灰塔的台阶没有脚印。\n只有你的影子，比人先走上一级。',
        choices: [
            {
                label: '跟上影子',
                result: '影子停在一枚裂开的石徽前。',
                delta: { keepsakes: ['裂石徽章'] }
            },
            {
                label: '停下倾听',
                result: '你听见塔心里空洞的回声。',
                delta: { discoveries: ['灰塔回声'], mood: -1 }
            }
        ]
    },
    'moonwell-water': {
        id: 'moonwell-water',
        title: '井中的月',
        body: '井水映着完整的月亮。\n可抬头时，天空只有薄云。',
        choices: [
            {
                label: '舀起井水',
                result: '水面碎开，月色留在瓶底。',
                delta: { keepsakes: ['一瓶月水'], mood: 1 }
            },
            {
                label: '望向空村',
                result: '你记住每一扇没有灯的窗。',
                delta: { discoveries: ['空村窗影'] }
            }
        ]
    }
};
