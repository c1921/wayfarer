import type { EventCard } from './types';

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
