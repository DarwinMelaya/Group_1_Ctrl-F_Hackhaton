import type { Tone } from '@/theme';

import type { CommunityIconName } from './icons';

export interface GuideSection {
  title: string;
  icon: CommunityIconName;
  tone: Tone;
  do: string[];
  dont: string[];
}

// General good practice for visitors and coastal residents. No laws are quoted by number on purpose.
export const GUIDE_SECTIONS: GuideSection[] = [
  {
    title: 'Coral reefs',
    icon: 'flower-poppy',
    tone: 'reef',
    do: ['Float over the reef and keep your fins up.', 'Ask your boatman to tie up to a buoy, not drop anchor on coral.'],
    dont: ['Stand on, touch, or break coral.', 'Take coral, shells, or starfish home.'],
  },
  {
    title: 'Sea turtles (pawikan)',
    icon: 'turtle',
    tone: 'mangrove',
    do: ['Watch from a few meters away and let them swim off.', 'Keep away from nests on the beach, especially at night.'],
    dont: ['Touch, ride, chase, or feed them.', 'Buy anything made from turtles or their shells. They are protected by law.'],
  },
  {
    title: 'Marine sanctuaries',
    icon: 'shield-half-full',
    tone: 'sea',
    do: ['Follow the barangay rules posted at the sanctuary.', 'Check the Map tab to see where the sanctuaries are.'],
    dont: ['Fish, collect, or spearfish inside a sanctuary.'],
  },
  {
    title: 'Trash and plastic',
    icon: 'recycle',
    tone: 'mangrove',
    do: ['Bring back everything you brought, including small wrappers.', 'Use a refillable water bottle.'],
    dont: ['Leave trash on islands or sandbars; the tide carries it out to sea.'],
  },
  {
    title: 'Safety on a banca',
    icon: 'lifebuoy',
    tone: 'coral',
    do: ['Wear a life vest for the whole trip.', "Check today's sea on the Home tab before you go."],
    dont: ['Go out when the sea is rough, even if someone offers.'],
  },
];
