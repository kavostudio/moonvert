export function RenderSun() {
    return (
        <svg fill="none" height="208" viewBox="0 0 208 208" width="208" xmlns="http://www.w3.org/2000/svg">
            <g filter="url(#filter0_dd_14_515)">
                <circle cx="104" cy="104" fill="url(#paint0_linear_14_515)" r="40" />
            </g>
            <defs>
                <filter colorInterpolationFilters="sRGB" filterUnits="userSpaceOnUse" height="208" id="filter0_dd_14_515" width="208" x="0" y="0">
                    <feFlood floodOpacity="0" result="BackgroundImageFix" />
                    <feColorMatrix in="SourceAlpha" result="hardAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" />
                    <feOffset />
                    <feGaussianBlur stdDeviation="32" />
                    <feComposite in2="hardAlpha" operator="out" />
                    <feColorMatrix type="matrix" values="0 0 0 0 1 0 0 0 0 0.912398 0 0 0 0 0.638409 0 0 0 0.3 0" />
                    <feBlend in2="BackgroundImageFix" mode="normal" result="effect1_dropShadow_14_515" />
                    <feColorMatrix in="SourceAlpha" result="hardAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" />
                    <feOffset />
                    <feGaussianBlur stdDeviation="16" />
                    <feComposite in2="hardAlpha" operator="out" />
                    <feColorMatrix type="matrix" values="0 0 0 0 1 0 0 0 0 0.756863 0 0 0 0 0.196078 0 0 0 0.2 0" />
                    <feBlend in2="effect1_dropShadow_14_515" mode="normal" result="effect2_dropShadow_14_515" />
                    <feBlend in="SourceGraphic" in2="effect2_dropShadow_14_515" mode="normal" result="shape" />
                </filter>
                <linearGradient gradientUnits="userSpaceOnUse" id="paint0_linear_14_515" x1="122" x2="93.5" y1="68" y2="144">
                    <stop stopColor="#FFD359" />
                    <stop offset="1" stopColor="#FFEC73" />
                </linearGradient>
            </defs>
        </svg>
    );
}
