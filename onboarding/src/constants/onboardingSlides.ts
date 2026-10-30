import type { Tone } from '@/theme';

import type { CommunityIconName } from './icons';

export interface OnboardingSlide {
  key: string;
  eyebrow: string;
  title: string;
  body: string;
  icon: CommunityIconName;
  secondaryIcon: CommunityIconName;
  tone: Tone;
}

export const ONBOARDING_SLIDES: readonly OnboardingSlide[] = [
  {
    key: 'fishing',
    eyebrow: 'Fishing & catch log',
    title: 'Know the sea before you push off.',
    body: 'Check wind and waves for Tablas Strait, Tayabas Bay, and the Sibuyan Sea. Log your catch when you are back on shore. Your records stay on your phone until you choose to share them.',
    icon: 'sail-boat',
    secondaryIcon: 'fish',
    tone: 'sea',
  },
  {
    key: 'aquaculture',
    eyebrow: 'Aquaculture & seaweed',
    title: 'Keep track of every planting cycle.',
    body: 'Note when you planted, how the lines are growing, and when to harvest. Get practical tips on ice-ice, line spacing, and what to check after heavy rain.',
    icon: 'sprout',
    secondaryIcon: 'waves',
    tone: 'mangrove',
  },
  {
    key: 'reefs',
    eyebrow: 'Protect the reefs',
    title: 'See something wrong? Tell Bantay Dagat.',
    body: 'Report illegal fishing, coral bleaching, or trash washing in, from the reefs of the Tres Reyes Islands to your own shoreline. Reports are saved offline and sent once you have signal.',
    icon: 'shield-check',
    secondaryIcon: 'jellyfish',
    tone: 'coral',
  },
  {
    key: 'biodiversity',
    eyebrow: 'Biodiversity watch',
    title: 'Help count what lives in our waters.',
    body: 'Log sea turtles nesting on Maniwaya Island, dolphins offshore, or how the mangroves around Mongpong Island are holding up. Every sighting helps MENRO and researchers protect them.',
    icon: 'turtle',
    secondaryIcon: 'binoculars',
    tone: 'reef',
  },
];
