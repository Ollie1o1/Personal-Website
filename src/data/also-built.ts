export interface AlsoBuilt {
  name: string;
  blurb: string;
  lang: string;
  href: string;
}

const gh = (repo: string) => `https://github.com/Ollie1o1/${repo}`;

export const alsoBuilt: AlsoBuilt[] = [
  { name: 'RISC-V emulator', blurb: 'RV32I CPU with 128 MB DRAM and a unit-tested fetch-decode-execute loop', lang: 'C', href: gh('emulator') },
  { name: 'Crypto trading bot', blurb: 'Maker-only hybrid strategy on an XGBoost classifier, walk-forward tested', lang: 'Python', href: gh('crypto_mathbot') },
  { name: 'Maze RL solver', blurb: 'Q-learning agent that learns the shortest path from scratch', lang: 'Python', href: gh('Maze') },
  { name: 'img2ascii', blurb: 'Zero-dependency image to ASCII CLI', lang: 'Go', href: gh('imgtoascii') },
  { name: 'Audio visualizer', blurb: 'Real-time audio spectrum at 60 fps', lang: 'Java', href: gh('Audio-Visualizer') },
];
