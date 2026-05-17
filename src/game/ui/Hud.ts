import { GameObjects, Scene } from 'phaser';
import { UI_FONT } from '../config';
import { getMoodLabel, TOTAL_LOCATIONS, type JourneyState, type LocationNode } from '../journey';

export class GameHud
{
    private locationText: GameObjects.Text;
    private subtitleText: GameObjects.Text;
    private descriptionText: GameObjects.Text;
    private statsText: GameObjects.Text;
    private logText: GameObjects.Text;

    constructor (scene: Scene)
    {
        scene.add.rectangle(284, 72, 520, 112, 0x07111c, 0.72).setStrokeStyle(1, 0x8ca7b8, 0.45).setDepth(20);
        scene.add.rectangle(836, 76, 314, 120, 0x07111c, 0.7).setStrokeStyle(1, 0x8ca7b8, 0.4).setDepth(20);
        scene.add.rectangle(512, 620, 650, 44, 0x07111c, 0.66).setStrokeStyle(1, 0x8ca7b8, 0.35).setDepth(20);

        this.locationText = scene.add.text(46, 30, '', {
            fontFamily: UI_FONT,
            fontSize: 30,
            color: '#edf6fb'
        }).setDepth(21);

        this.subtitleText = scene.add.text(48, 66, '', {
            fontFamily: UI_FONT,
            fontSize: 16,
            color: '#b8cad8'
        }).setDepth(21);

        this.descriptionText = scene.add.text(48, 92, '', {
            fontFamily: UI_FONT,
            fontSize: 16,
            color: '#d6e1e8'
        }).setDepth(21);

        this.statsText = scene.add.text(704, 34, '', {
            fontFamily: UI_FONT,
            fontSize: 15,
            color: '#dcebf2',
            lineSpacing: 6
        }).setDepth(21);

        this.logText = scene.add.text(512, 620, '', {
            fontFamily: UI_FONT,
            fontSize: 17,
            color: '#edf6fb',
            align: 'center'
        }).setOrigin(0.5).setDepth(21);
    }

    renderLocation (location: LocationNode, state: JourneyState, logMessage?: string)
    {
        this.locationText.setText(location.name);
        this.subtitleText.setText(location.subtitle);
        this.descriptionText.setText(location.description);
        this.renderStats(state);

        if (logMessage)
        {
            this.setLog(logMessage);
        }
    }

    renderTravel (targetName: string, travelText: string)
    {
        this.locationText.setText(`前往 ${targetName}`);
        this.subtitleText.setText(travelText);
        this.descriptionText.setText('风景在身后退去，旅人没有回头。');
        this.setLog(travelText);
    }

    setLog (message: string)
    {
        this.logText.setText(message);
    }

    private renderStats (state: JourneyState)
    {
        const discoveries = state.discoveries.length === 0
            ? '无'
            : state.discoveries.slice(-2).join('、');
        const keepsakes = state.keepsakes.length === 0
            ? '无'
            : state.keepsakes.slice(-2).join('、');

        this.statsText.setText([
            `心情：${getMoodLabel(state.mood)}`,
            `见闻：${state.discoveries.length}  ${discoveries}`,
            `纪念品：${state.keepsakes.length}  ${keepsakes}`,
            `已抵达：${state.visited.size}/${TOTAL_LOCATIONS}`
        ].join('\n'));
    }
}
