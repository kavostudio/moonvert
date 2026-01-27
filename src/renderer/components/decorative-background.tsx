import { useUnit } from 'effector-react';
import { motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { $$theme } from 'renderer/entities/theme/model';
import { cn } from 'renderer/lib/utils';

type Star = {
    x: number;
    y: number;
    opacity: number;
};

const stars: Star[] = [
    { x: 7, y: 29, opacity: 0.65 },
    { x: 8, y: 12, opacity: 0.75 },
    { x: 15, y: 22, opacity: 0.85 },
    { x: 24, y: 17, opacity: 0.8 },
    { x: 32, y: 18, opacity: 0.9 },
    { x: 35, y: 8, opacity: 0.7 },
    { x: 41, y: 15, opacity: 0.9 },
    { x: 52, y: 10, opacity: 0.7 },
    { x: 58, y: 16, opacity: 0.95 },
    { x: 64, y: 24, opacity: 0.75 },
    { x: 75, y: 17, opacity: 0.75 },
    { x: 69, y: 11, opacity: 0.85 },
    { x: 80, y: 27, opacity: 0.9 },
    { x: 85, y: 9, opacity: 0.7 },
    { x: 88, y: 25, opacity: 0.85 },
    { x: 92, y: 20, opacity: 0.8 },
    { x: 92, y: 5, opacity: 0.8 },
];

function RenderStars({ ready }: { ready: boolean }) {
    return (
        <div className="pointer-events-none relative h-full w-full">
            {stars.map((star, index) => (
                <motion.div
                    animate={ready ? { opacity: star.opacity } : { opacity: 0 }}
                    className="absolute"
                    initial={{ opacity: 0 }}
                    key={index}
                    style={{
                        left: `${star.x}%`,
                        top: `${star.y}%`,
                    }}
                    transition={{ duration: 0.15, delay: index * 0.02, ease: 'easeOut' }}
                >
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <g opacity="0.93">
                            <path
                                className="fill-popover-foreground"
                                d="M5.7193 0C5.83097 3.11125 8.32734 5.60763 11.4386 5.7193C8.32734 5.83097 5.83097 8.32734 5.7193 11.4386C5.60763 8.32734 3.11125 5.83097 0 5.7193C3.11125 5.60763 5.60763 3.11125 5.7193 0Z"
                            />
                        </g>
                    </svg>
                </motion.div>
            ))}
        </div>
    );
}

type DecorativeBackgroundProps = {
    className?: string;
    topCloudOffset?: number;
};

export function DecorativeBackground(props: DecorativeBackgroundProps) {
    const { className = '', topCloudOffset } = props;
    const theme = useUnit($$theme.$theme);
    const [ready, setReady] = useState(false);

    // Defer animations until after initial render to prevent lag
    useEffect(() => {
        const frameId = requestAnimationFrame(() => {
            setReady(true);
        });
        return () => cancelAnimationFrame(frameId);
    }, []);

    return (
        <div className={cn(`relative z-0 h-full w-full overflow-hidden`, className)}>
            <RenderStars ready={ready} />

            {/* Top right cloud */}
            <motion.div
                animate={ready ? { opacity: 1, scale: 0.8 } : { opacity: 0, scale: 0.6 }}
                className="absolute right-15 rotate-8"
                initial={{ opacity: 0, scale: 0.6 }}
                style={{
                    top: typeof topCloudOffset === 'number' ? -topCloudOffset : -80,
                    width: '234',
                    height: '212',
                    transform: 'rotate(5.922deg)',
                }}
                transition={{ duration: 0.1, delay: 0.2 }}
            >
                <svg fill="none" height="212" style={{ filter: 'blur(50px)' }} viewBox="0 0 234 212" width="234" xmlns="http://www.w3.org/2000/svg">
                    <g>
                        <path
                            d="M49.8589 108.152L62.1397 129.928L62.5721 129.684L62.9944 129.423L49.8589 108.152ZM86.7273 94.8854L85.883 69.8997L86.7273 94.8854ZM139.233 118.999C153.04 118.87 164.128 107.573 163.999 93.7669C163.87 79.9604 152.574 68.8724 138.767 69.001L139 94L139.233 118.999ZM-9.00002 115.883L-11.5792 140.749C23.2312 144.36 50.0253 136.76 62.1397 129.928L49.8589 108.152L37.578 86.3765C37.6274 86.3486 36.5559 86.9224 34.1218 87.7351C31.8225 88.5027 28.6822 89.3575 24.77 90.0751C16.9568 91.5083 6.35753 92.3414 -6.42081 91.016L-9.00002 115.883ZM49.8589 108.152L62.9944 129.423C65.3017 127.998 70.0184 125.437 75.3856 123.259C81.1334 120.927 85.4217 119.944 87.5716 119.871L86.7273 94.8854L85.883 69.8997C75.0126 70.267 64.2989 73.7981 56.5836 76.9291C48.4877 80.2146 41.2804 84.067 36.7234 86.881L49.8589 108.152ZM86.7273 94.8854L87.5716 119.871C95.4253 119.606 108.257 119.387 119.313 119.234C124.8 119.158 129.784 119.099 133.397 119.059C135.203 119.04 136.665 119.024 137.674 119.014C138.178 119.009 138.569 119.005 138.834 119.003C138.966 119.001 139.067 119 139.134 119C139.167 118.999 139.192 118.999 139.209 118.999C139.217 118.999 139.224 118.999 139.228 118.999C139.23 118.999 139.231 118.999 139.232 118.999C139.232 118.999 139.233 118.999 139.233 118.999C139.233 118.999 139.233 118.999 139 94C138.767 69.001 138.767 69.001 138.766 69.001C138.766 69.0011 138.765 69.0011 138.765 69.0011C138.764 69.0011 138.762 69.0011 138.759 69.0011C138.755 69.0012 138.748 69.0012 138.739 69.0013C138.721 69.0015 138.694 69.0017 138.659 69.0021C138.589 69.0027 138.485 69.0037 138.35 69.005C138.079 69.0077 137.681 69.0116 137.169 69.0167C136.146 69.027 134.669 69.0424 132.845 69.0625C129.2 69.1027 124.167 69.1621 118.621 69.2389C107.61 69.3912 94.3047 69.6151 85.883 69.8997L86.7273 94.8854Z"
                            fill="none"
                            stroke={theme === 'light' ? '#FFF' : '#2E2E44'}
                            strokeWidth="50"
                        />
                    </g>
                </svg>
            </motion.div>

            {/* Top right decorative shape */}
            <motion.div
                animate={ready ? { opacity: 1 } : { opacity: 0 }}
                className="absolute right-0 bottom-0 rotate-0 overflow-hidden"
                initial={{ opacity: 0 }}
                transition={{ duration: 0.15, delay: 0.05, ease: 'easeOut' }}
            >
                {theme === 'light' ? (
                    <svg fill="none" height="160" viewBox="0 0 110 160" width="110" xmlns="http://www.w3.org/2000/svg">
                        <path
                            clipRule="evenodd"
                            d="M65.4155 151.214C45.6401 154.23 22.1905 167.932 7.78007 153.528C-6.61966 139.135 2.36986 113.586 7.76074 93.5863C11.6031 79.3312 25.2793 72.3183 33.0187 59.8931C45.3061 40.1659 43.5467 6.95432 65.4155 1.02306C87.1251 -4.86501 109.814 15.7005 120.671 36.1202C129.991 53.6506 117.036 73.7113 114.629 93.5863C112.752 109.09 118.288 126.515 108.311 138.198C98.0286 150.238 80.7356 148.878 65.4155 151.214Z"
                            fill="#EADACD"
                            fillRule="evenodd"
                        />
                        <path
                            clipRule="evenodd"
                            d="M65.4155 151.214C45.6401 154.23 22.1905 167.932 7.78007 153.528C-6.61966 139.135 2.36986 113.586 7.76074 93.5863C11.6031 79.3312 25.2793 72.3183 33.0187 59.8931C45.3061 40.1659 43.5467 6.95432 65.4155 1.02306C87.1251 -4.86501 109.814 15.7005 120.671 36.1202C129.991 53.6506 117.036 73.7113 114.629 93.5863C112.752 109.09 118.288 126.515 108.311 138.198C98.0286 150.238 80.7356 148.878 65.4155 151.214Z"
                            fill="url(#paint0_linear_14_133)"
                            fillRule="evenodd"
                        />
                        <path
                            clipRule="evenodd"
                            d="M65.4155 151.214C45.6401 154.23 22.1905 167.932 7.78007 153.528C-6.61966 139.135 2.36986 113.586 7.76074 93.5863C11.6031 79.3312 25.2793 72.3183 33.0187 59.8931C45.3061 40.1659 43.5467 6.95432 65.4155 1.02306C87.1251 -4.86501 109.814 15.7005 120.671 36.1202C129.991 53.6506 117.036 73.7113 114.629 93.5863C112.752 109.09 118.288 126.515 108.311 138.198C98.0286 150.238 80.7356 148.878 65.4155 151.214Z"
                            fill="url(#paint1_radial_14_133)"
                            fillRule="evenodd"
                        />
                        <defs>
                            <linearGradient gradientUnits="userSpaceOnUse" id="paint0_linear_14_133" x1="115.061" x2="-16.6373" y1="66.5428" y2="117.649">
                                <stop offset="0.136077" stopColor="#FA5503" />
                                <stop offset="1" stopColor="#FA9113" />
                            </linearGradient>
                            <radialGradient
                                cx="0"
                                cy="0"
                                gradientTransform="matrix(-46.0245 91.8399 -49.9779 -52.3549 45.8344 31.6216)"
                                gradientUnits="userSpaceOnUse"
                                id="paint1_radial_14_133"
                                r="1"
                            >
                                <stop stopColor="#FC891F" stopOpacity="0" />
                                <stop offset="0.783032" stopColor="#FC1D01" />
                            </radialGradient>
                        </defs>
                    </svg>
                ) : (
                    <svg fill="none" height="160" viewBox="0 0 110 160" width="110" xmlns="http://www.w3.org/2000/svg">
                        <path
                            clipRule="evenodd"
                            d="M65.4155 151.214C45.6401 154.23 22.1905 167.932 7.78007 153.528C-6.61966 139.135 2.36986 113.586 7.76074 93.5863C11.6031 79.3312 25.2793 72.3183 33.0187 59.8931C45.3061 40.1659 43.5467 6.95432 65.4155 1.02306C87.1251 -4.86501 109.814 15.7005 120.671 36.1202C129.991 53.6506 117.036 73.7113 114.629 93.5863C112.752 109.09 118.288 126.515 108.311 138.198C98.0286 150.238 80.7356 148.878 65.4155 151.214Z"
                            fill="url(#paint0_radial_16_820)"
                            fillRule="evenodd"
                        />
                        <defs>
                            <radialGradient
                                cx="0"
                                cy="0"
                                gradientTransform="matrix(87.0281 -111.273 96.6732 128.033 36.7817 162.561)"
                                gradientUnits="userSpaceOnUse"
                                id="paint0_radial_16_820"
                                r="1"
                            >
                                <stop offset="0.282766" stopColor="#C24000" />
                                <stop offset="0.500701" stopColor="#9D001A" />
                                <stop offset="1" stopColor="#C64607" />
                            </radialGradient>
                        </defs>
                    </svg>
                )}
            </motion.div>

            {/* Bottom right shape */}
            <motion.div
                animate={ready ? { opacity: 1 } : { opacity: 0 }}
                className="absolute right-0 bottom-0 h-[98px] w-[182px] overflow-hidden"
                initial={{ opacity: 0 }}
                transition={{ duration: 0.15, delay: 0.08, ease: 'easeOut' }}
            >
                {theme === 'light' ? (
                    <svg fill="none" height="98" viewBox="0 0 182 98" width="182" xmlns="http://www.w3.org/2000/svg">
                        <path
                            clipRule="evenodd"
                            d="M2.23609 76.088C14.4951 44.3661 65.2838 61.0521 95.25 45.0156C115.524 34.166 121.241 1.96946 144.156 0.139624C168.786 -1.82721 189.736 17.3082 205.68 36.1973C222.494 56.1165 235.948 80.1073 233.582 106.081C231.143 132.861 217.423 160.589 193.276 172.379C171.179 183.168 147.818 163.088 123.449 159.854C99.2328 156.64 73.3145 167.682 53.2135 153.791C26.7307 135.49 -9.37658 106.137 2.23609 76.088Z"
                            fill="url(#paint0_radial_14_149)"
                            fillRule="evenodd"
                        />
                        <defs>
                            <radialGradient
                                cx="0"
                                cy="0"
                                gradientTransform="matrix(135.009 195.674 -263.087 -31.3343 52.2824 -5.08041)"
                                gradientUnits="userSpaceOnUse"
                                id="paint0_radial_14_149"
                                r="1"
                            >
                                <stop offset="0.135417" stopColor="#FF9075" />
                                <stop offset="0.494188" stopColor="#ED3DC7" />
                                <stop offset="1" stopColor="#A552E3" />
                            </radialGradient>
                        </defs>
                    </svg>
                ) : (
                    <svg fill="none" height="98" viewBox="0 0 182 98" width="182" xmlns="http://www.w3.org/2000/svg">
                        <path
                            clipRule="evenodd"
                            d="M2.23609 76.0882C14.4951 44.3664 65.2838 61.0523 95.25 45.0159C115.524 34.1662 121.241 1.96971 144.156 0.139868C168.786 -1.82696 189.736 17.3085 205.68 36.1975C222.494 56.1167 235.948 80.1076 233.582 106.081C231.143 132.861 217.423 160.589 193.276 172.379C171.179 183.168 147.818 163.088 123.449 159.854C99.2328 156.641 73.3145 167.682 53.2135 153.791C26.7307 135.49 -9.37658 106.138 2.23609 76.0882Z"
                            fill="url(#paint0_radial_16_836)"
                            fillRule="evenodd"
                        />
                        <defs>
                            <radialGradient
                                cx="0"
                                cy="0"
                                gradientTransform="translate(87.486 8.72706) rotate(4.01049) scale(135.833 131.108)"
                                gradientUnits="userSpaceOnUse"
                                id="paint0_radial_16_836"
                                r="1"
                            >
                                <stop stopColor="#FF4F1F" />
                                <stop offset="0.505812" stopColor="#B0006E" />
                                <stop offset="0.864583" stopColor="#6A00A8" />
                            </radialGradient>
                        </defs>
                    </svg>
                )}
            </motion.div>

            {/* Top left shape */}
            <motion.div
                animate={ready ? { opacity: 1 } : { opacity: 0 }}
                className="absolute bottom-0 left-0"
                initial={{ opacity: 0 }}
                transition={{ duration: 0.15, delay: 0.1, ease: 'easeOut' }}
            >
                {theme === 'light' ? (
                    <svg fill="none" height="111" viewBox="0 0 157 111" width="157" xmlns="http://www.w3.org/2000/svg">
                        <path
                            clipRule="evenodd"
                            d="M73.2342 179.807C89.8718 178.316 103.989 168.26 116.689 157.41C133.105 143.385 159.944 129.84 156.694 108.504C153.3 86.2273 122.701 81.2633 103.333 69.7378C91.6852 62.8063 77.3327 63.0838 66.5562 54.864C45.5616 38.8505 38.3584 2.31085 12.0391 0.10381C-11.9659 -1.90915 -28.2127 25.8029 -41.6548 45.7899C-54.8519 65.4124 -71.162 89.4514 -62.9635 111.624C-54.5908 134.268 -24.385 137.725 -3.30573 149.505C8.31446 155.999 20.0827 160.053 32.4606 164.953C46.2471 170.411 58.4631 181.13 73.2342 179.807Z"
                            fill="url(#paint0_radial_14_150)"
                            fillRule="evenodd"
                        />
                        <defs>
                            <radialGradient
                                cx="0"
                                cy="0"
                                gradientTransform="matrix(-182.503 -80.1546 -104.529 199.333 112.822 171.093)"
                                gradientUnits="userSpaceOnUse"
                                id="paint0_radial_14_150"
                                r="1"
                            >
                                <stop offset="0.282766" stopColor="#FE031C" />
                                <stop offset="0.500701" stopColor="#F71300" />
                                <stop offset="0.71094" stopColor="#FB560D" />
                                <stop offset="1" stopColor="#FC7000" />
                            </radialGradient>
                        </defs>
                    </svg>
                ) : (
                    <svg fill="none" height="111" viewBox="0 0 157 111" width="157" xmlns="http://www.w3.org/2000/svg">
                        <path
                            clipRule="evenodd"
                            d="M73.2342 179.806C89.8718 178.316 103.989 168.26 116.689 157.41C133.105 143.385 159.944 129.839 156.694 108.503C153.3 86.2271 122.701 81.263 103.333 69.7375C91.6852 62.806 77.3327 63.0835 66.5562 54.8638C45.5616 38.8503 38.3584 2.31061 12.0391 0.103566C-11.9659 -1.90939 -28.2127 25.8026 -41.6548 45.7896C-54.8519 65.4122 -71.162 89.4512 -62.9635 111.624C-54.5908 134.268 -24.385 137.725 -3.30573 149.505C8.31446 155.999 20.0827 160.053 32.4606 164.953C46.2471 170.411 58.4631 181.129 73.2342 179.806Z"
                            fill="url(#paint0_radial_16_837)"
                            fillRule="evenodd"
                        />
                        <defs>
                            <radialGradient
                                cx="0"
                                cy="0"
                                gradientTransform="matrix(-182.503 -80.1546 -104.529 199.333 112.822 171.093)"
                                gradientUnits="userSpaceOnUse"
                                id="paint0_radial_16_837"
                                r="1"
                            >
                                <stop offset="0.282766" stopColor="#C24000" />
                                <stop offset="0.548077" stopColor="#9D001A" />
                                <stop offset="1" stopColor="#CC4B0C" />
                            </radialGradient>
                        </defs>
                    </svg>
                )}
            </motion.div>

            {/* bottom left shape */}
            <motion.div
                animate={ready ? { opacity: 1 } : { opacity: 0 }}
                className="absolute bottom-0 left-24"
                initial={{ opacity: 0 }}
                transition={{ duration: 0.15, delay: 0.12, ease: 'easeOut' }}
            >
                {theme === 'light' ? (
                    <svg fill="none" height="56" viewBox="0 0 107 56" width="107" xmlns="http://www.w3.org/2000/svg">
                        <path
                            clipRule="evenodd"
                            d="M2.33317 47.7838C-1.26267 56.1436 -0.100005 65.5148 1.81008 74.412C4.27908 85.9127 3.81819 102.285 14.8857 106.254C26.441 110.398 36.7469 97.0192 47.2879 90.7226C53.6273 86.9358 57.2123 79.9853 63.9435 76.9499C77.0568 71.0363 96.4349 77.0497 104.311 65.0076C111.494 54.0244 102.421 39.059 96.3246 27.4391C90.3389 16.0309 83.0431 1.98679 70.2926 0.172091C57.2713 -1.68116 47.7897 11.8999 36.6832 18.9507C30.5606 22.8375 25.5692 27.4274 20.0142 32.0903C13.827 37.2838 5.52562 40.3619 2.33317 47.7838Z"
                            fill="url(#paint0_linear_14_151)"
                            fillRule="evenodd"
                        />
                        <path
                            clipRule="evenodd"
                            d="M2.33317 47.7838C-1.26267 56.1436 -0.100005 65.5148 1.81008 74.412C4.27908 85.9127 3.81819 102.285 14.8857 106.254C26.441 110.398 36.7469 97.0192 47.2879 90.7226C53.6273 86.9358 57.2123 79.9853 63.9435 76.9499C77.0568 71.0363 96.4349 77.0497 104.311 65.0076C111.494 54.0244 102.421 39.059 96.3246 27.4391C90.3389 16.0309 83.0431 1.98679 70.2926 0.172091C57.2713 -1.68116 47.7897 11.8999 36.6832 18.9507C30.5606 22.8375 25.5692 27.4274 20.0142 32.0903C13.827 37.2838 5.52562 40.3619 2.33317 47.7838Z"
                            fill="url(#paint1_radial_14_151_bottom)"
                            fillRule="evenodd"
                        />
                        <defs>
                            <linearGradient gradientUnits="userSpaceOnUse" id="paint0_linear_14_151" x1="70.6865" x2="-4.78729" y1="8.56959" y2="105.147">
                                <stop offset="0.136077" stopColor="#FA5503" />
                                <stop offset="1" stopColor="#FA9113" />
                            </linearGradient>
                            <radialGradient
                                cx="0"
                                cy="0"
                                gradientTransform="matrix(78 31.5 -10.5872 -71.9216 70.2858 -7.80176)"
                                gradientUnits="userSpaceOnUse"
                                id="paint1_radial_14_151_bottom"
                                r="1"
                            >
                                <stop offset="0.135417" stopColor="#FF9075" />
                                <stop offset="0.494188" stopColor="#ED3DC7" />
                                <stop offset="1" stopColor="#A552E3" />
                            </radialGradient>
                        </defs>
                    </svg>
                ) : (
                    <svg fill="none" height="56" viewBox="0 0 107 56" width="107" xmlns="http://www.w3.org/2000/svg">
                        <path
                            clipRule="evenodd"
                            d="M2.33317 47.7838C-1.26267 56.1436 -0.100005 65.5148 1.81008 74.412C4.27908 85.9127 3.81819 102.285 14.8857 106.254C26.441 110.398 36.7469 97.0192 47.2879 90.7226C53.6273 86.9358 57.2123 79.9853 63.9435 76.9499C77.0568 71.0363 96.4349 77.0497 104.311 65.0076C111.494 54.0244 102.421 39.059 96.3246 27.4391C90.3389 16.0309 83.0431 1.98679 70.2926 0.172091C57.2713 -1.68116 47.7897 11.8999 36.6832 18.9507C30.5606 22.8375 25.5692 27.4274 20.0142 32.0903C13.827 37.2838 5.52562 40.3619 2.33317 47.7838Z"
                            fill="url(#paint0_radial_16_838)"
                            fillRule="evenodd"
                        />
                        <defs>
                            <radialGradient
                                cx="0"
                                cy="0"
                                gradientTransform="matrix(78 31.5 -10.5872 -71.9216 70.2858 -7.80176)"
                                gradientUnits="userSpaceOnUse"
                                id="paint0_radial_16_838"
                                r="1"
                            >
                                <stop offset="0.135417" stopColor="#FF4F1F" />
                                <stop offset="0.494188" stopColor="#B0006E" />
                                <stop offset="1" stopColor="#6A00A8" />
                            </radialGradient>
                        </defs>
                    </svg>
                )}
            </motion.div>

            {/* Top left cloud */}
            <motion.div
                animate={ready ? { opacity: 1 } : { opacity: 0 }}
                className="absolute top-0 left-0"
                initial={{ opacity: 0 }}
                transition={{ duration: 0.15, delay: 0.02, ease: 'easeOut' }}
            >
                <svg fill="none" height="212" viewBox="0 0 234 212" width="234" xmlns="http://www.w3.org/2000/svg">
                    <g filter="url(#filter0_f_14_152)">
                        <path
                            d="M49.8589 108.152L62.1397 129.928L62.5721 129.684L62.9944 129.423L49.8589 108.152ZM86.7273 94.8854L85.883 69.8997L86.7273 94.8854ZM139.233 118.999C153.04 118.87 164.128 107.573 163.999 93.7669C163.87 79.9604 152.574 68.8724 138.767 69.001L139 94L139.233 118.999ZM-9.00002 115.883L-11.5792 140.749C23.2312 144.36 50.0253 136.76 62.1397 129.928L49.8589 108.152L37.578 86.3765C37.6274 86.3486 36.5559 86.9224 34.1218 87.7351C31.8225 88.5027 28.6822 89.3575 24.77 90.0751C16.9568 91.5083 6.35753 92.3414 -6.42081 91.016L-9.00002 115.883ZM49.8589 108.152L62.9944 129.423C65.3017 127.998 70.0184 125.437 75.3856 123.259C81.1334 120.927 85.4217 119.944 87.5716 119.871L86.7273 94.8854L85.883 69.8997C75.0126 70.267 64.2989 73.7981 56.5836 76.9291C48.4877 80.2146 41.2804 84.067 36.7234 86.881L49.8589 108.152ZM86.7273 94.8854L87.5716 119.871C95.4253 119.606 108.257 119.387 119.313 119.234C124.8 119.158 129.784 119.099 133.397 119.059C135.203 119.04 136.665 119.024 137.674 119.014C138.178 119.009 138.569 119.005 138.834 119.003C138.966 119.001 139.067 119 139.134 119C139.167 118.999 139.192 118.999 139.209 118.999C139.217 118.999 139.224 118.999 139.228 118.999C139.23 118.999 139.231 118.999 139.232 118.999C139.232 118.999 139.233 118.999 139.233 118.999C139.233 118.999 139.233 118.999 139 94C138.767 69.001 138.767 69.001 138.766 69.001C138.766 69.0011 138.765 69.0011 138.765 69.0011C138.764 69.0011 138.762 69.0011 138.759 69.0011C138.755 69.0012 138.748 69.0012 138.739 69.0013C138.721 69.0015 138.694 69.0017 138.659 69.0021C138.589 69.0027 138.485 69.0037 138.35 69.005C138.079 69.0077 137.681 69.0116 137.169 69.0167C136.146 69.027 134.669 69.0424 132.845 69.0625C129.2 69.1027 124.167 69.1621 118.621 69.2389C107.61 69.3912 94.3047 69.6151 85.883 69.8997L86.7273 94.8854Z"
                            fill={theme === 'light' ? '#FFF' : '#2E2E44'}
                        />
                    </g>
                    <defs>
                        <filter colorInterpolationFilters="sRGB" filterUnits="userSpaceOnUse" height="212.679" id="filter0_f_14_152" width="315.579" x="-81.5792" y="-1">
                            <feFlood floodOpacity="0" result="BackgroundImageFix" />
                            <feBlend in="SourceGraphic" in2="BackgroundImageFix" mode="normal" result="shape" />
                            <feGaussianBlur result="effect1_foregroundBlur_14_152" stdDeviation="35" />
                        </filter>
                    </defs>
                </svg>
            </motion.div>
        </div>
    );
}
