import { DM_Mono, DM_Sans, Instrument_Serif, Space_Grotesk } from 'next/font/google';

// Self-hosted at build time: visitors' browsers never contact Google.
export const display = Space_Grotesk({ subsets: ['latin'], weight: ['400', '500', '600', '700'], variable: '--ff-display' });
export const body = DM_Sans({ subsets: ['latin'], weight: ['400', '500', '600', '700'], variable: '--ff-body' });
export const serif = Instrument_Serif({ subsets: ['latin'], weight: '400', style: ['normal', 'italic'], variable: '--ff-serif' });
export const mono = DM_Mono({ subsets: ['latin'], weight: ['400', '500'], variable: '--ff-mono' });

export const fontVariables = [display.variable, body.variable, serif.variable, mono.variable].join(' ');
