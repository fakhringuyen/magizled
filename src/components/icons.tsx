import Svg, { Path } from 'react-native-svg';

import { Palette } from '@/theme/tokens';

type IconProps = { size?: number; color?: string };

const base = (size: number) => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none' as const,
});

const stroke = (color: string) => ({
  stroke: color,
  strokeWidth: 1.9,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
});

export function ChevronLeft({ size = 22, color = Palette.text }: IconProps) {
  return (
    <Svg {...base(size)}>
      <Path d="M15 5 8 12l7 7" {...stroke(color)} />
    </Svg>
  );
}

export function Reload({ size = 22, color = Palette.text }: IconProps) {
  return (
    <Svg {...base(size)}>
      <Path d="M20 12a8 8 0 1 1-2.7-6" {...stroke(color)} />
      <Path d="M20 4v5h-5" {...stroke(color)} />
    </Svg>
  );
}

export function Gear({ size = 22, color = Palette.text }: IconProps) {
  return (
    <Svg {...base(size)}>
      <Path
        d="M12 15.2a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4Z"
        {...stroke(color)}
      />
      <Path
        d="M19.1 14.4a1.5 1.5 0 0 0 .3 1.7l.1.1a1.8 1.8 0 1 1-2.6 2.6l-.1-.1a1.5 1.5 0 0 0-2.6 1.1v.3a1.8 1.8 0 1 1-3.6 0v-.2a1.5 1.5 0 0 0-2.7-1.1l-.1.1a1.8 1.8 0 1 1-2.6-2.6l.1-.1a1.5 1.5 0 0 0-1.1-2.6h-.3a1.8 1.8 0 0 1 0-3.6h.2a1.5 1.5 0 0 0 1.1-2.7l-.1-.1a1.8 1.8 0 1 1 2.6-2.6l.1.1a1.5 1.5 0 0 0 2.6-1.1v-.3a1.8 1.8 0 1 1 3.6 0v.2a1.5 1.5 0 0 0 2.7 1.1l.1-.1a1.8 1.8 0 1 1 2.6 2.6l-.1.1a1.5 1.5 0 0 0 1.1 2.6h.3a1.8 1.8 0 0 1 0 3.6h-.2a1.5 1.5 0 0 0-1.4.9Z"
        {...stroke(color)}
      />
    </Svg>
  );
}

export function Power({ size = 22, color = Palette.text }: IconProps) {
  return (
    <Svg {...base(size)}>
      <Path d="M12 3v9" {...stroke(color)} />
      <Path d="M18.4 6.6a9 9 0 1 1-12.8 0" {...stroke(color)} />
    </Svg>
  );
}

export function Wifi({ size = 22, color = Palette.text }: IconProps) {
  return (
    <Svg {...base(size)}>
      <Path d="M2.5 9.5a15 15 0 0 1 19 0" {...stroke(color)} />
      <Path d="M6 13.2a10 10 0 0 1 12 0" {...stroke(color)} />
      <Path d="M9.4 16.9a5 5 0 0 1 5.2 0" {...stroke(color)} />
      <Path d="M12 20.4h.01" {...stroke(color)} />
    </Svg>
  );
}

export function Alert({ size = 22, color = Palette.warn }: IconProps) {
  return (
    <Svg {...base(size)}>
      <Path d="M12 3.6 1.9 20.4h20.2L12 3.6Z" {...stroke(color)} />
      <Path d="M12 9.6v4.4" {...stroke(color)} />
      <Path d="M12 17.4h.01" {...stroke(color)} />
    </Svg>
  );
}

export function Close({ size = 22, color = Palette.text }: IconProps) {
  return (
    <Svg {...base(size)}>
      <Path d="M6 6l12 12M18 6 6 18" {...stroke(color)} />
    </Svg>
  );
}
