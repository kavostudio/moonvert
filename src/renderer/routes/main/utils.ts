export const Screens = {
    Home: 'home',
    Configuration: 'configuration',
    Processing: 'processing',
    Complete: 'complete',
} as const;

export type ScreenType = (typeof Screens)[keyof typeof Screens];

export const getScreenDimensions = (screen: ScreenType): { width: number; height: number } => {
    switch (screen) {
        case Screens.Home:
            return { width: 708, height: 448 };
        case Screens.Configuration:
            return { width: 708, height: 708 };
        case Screens.Processing:
            return { width: 708, height: 448 };
        case Screens.Complete:
            return { width: 708, height: 448 };
        default:
            return { width: 708, height: 448 };
    }
};
