type IconName =
  | 'book'
  | 'zap'
  | 'clock'
  | 'chart'
  | 'database'
  | 'check'
  | 'x'
  | 'flag'
  | 'left'
  | 'right'
  | 'zoom'
  | 'upload'
  | 'refresh'
  | 'download'
  | 'alert'
  | 'target'
  | 'play'
  | 'pause'
  | 'home'
  | 'list'
  | 'spark'
  | 'chevron-down';

const paths: Record<IconName, string> = {
  book: 'M4 19.5A2.5 2.5 0 0 1 6.5 17H20M4 19.5V5a2 2 0 0 1 2-2h14v14H6.5A2.5 2.5 0 0 0 4 19.5Z',
  zap: 'M13 2 3 14h8l-1 8 10-12h-8l1-8Z',
  clock: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Zm0-14v5l3 2',
  chart: 'M4 20V10M10 20V4M16 20v-6M22 20H2',
  database: 'M12 8c4.4 0 8-1.3 8-3s-3.6-3-8-3-8 1.3-8 3 3.6 3 8 3Zm-8-3v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3',
  check: 'M20 6 9 17l-5-5',
  x: 'M18 6 6 18M6 6l12 12',
  flag: 'M4 22V4M4 4h12l-2 4 2 4H4',
  left: 'M15 18l-6-6 6-6',
  right: 'M9 18l6-6-6-6',
  zoom: 'M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm10 2-4.35-4.35M8 11h6M11 8v6',
  upload: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12',
  refresh: 'M21 12a9 9 0 1 1-3-6.7L21 8M21 3v5h-5',
  download: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3',
  alert: 'M12 9v4M12 17h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z',
  target: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Zm0-4a6 6 0 1 0 0-12 6 6 0 0 0 0 12Zm0-4a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z',
  play: 'M6 3l14 9-14 9V3Z',
  pause: 'M8 4v16M16 4v16',
  home: 'M3 10.5 12 3l9 7.5V21a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1V10.5Z',
  list: 'M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01',
  spark: 'M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M18.4 5.6l-2.8 2.8M8.4 15.6l-2.8 2.8',
  'chevron-down': 'M6 9l6 6 6-6',
};

export default function Icon({
  name,
  class: cls = 'h-4 w-4',
  strokeWidth = 2,
}: {
  name: IconName;
  class?: string;
  strokeWidth?: number;
}) {
  return (
    <svg
      class={cls}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width={strokeWidth}
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <path d={paths[name]} />
    </svg>
  );
}
