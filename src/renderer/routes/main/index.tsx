import { useUnit } from 'effector-react';
import { AnimatePresence, motion } from 'motion/react';

import { HomeScreen } from './home';
import { ConfigurationScreen } from './configuration';
import { ProcessingScreen } from './processing/processing';
import { CompleteScreen } from './complete';
import { $$main } from './model';
import useMountedEvent from 'renderer/lib/hooks/use-mounted-event';

export function MainRoute() {
    const { currentScreen } = useUnit($$main.$appState);

    useMountedEvent($$main.mounted);

    return (
        <AnimatePresence mode="wait">
            {currentScreen === $$main.Screens.Home && <HomeScreen />}
            {currentScreen === $$main.Screens.Configuration && <ConfigurationScreen />}
            {currentScreen === $$main.Screens.Processing && <ProcessingScreen />}
            {currentScreen === $$main.Screens.Complete && <CompleteScreen />}
        </AnimatePresence>
    );
}
