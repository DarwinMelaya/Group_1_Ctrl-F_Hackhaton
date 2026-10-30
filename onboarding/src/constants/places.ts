import type { CommunityIconName } from './icons';
import type { MunicipalityId } from './municipalities';

// Real coastal places in Marinduque. Descriptions stay general on purpose: no prices, schedules or
// ratings that would go out of date or would need a source.

export interface Place {
  id: string;
  name: string;
  town: MunicipalityId;
  kind: string;
  icon: CommunityIconName;
  about: string;
  tip: string;
}

export const PLACES: readonly Place[] = [
  {
    id: 'maniwaya',
    name: 'Maniwaya Island',
    town: 'santa-cruz',
    kind: 'Island',
    icon: 'island',
    about: 'A long white-sand beach and clear water, reached by boat from Santa Cruz.',
    tip: 'Sea turtles nest on some beaches here. Keep away from marked nests and never use lights on them at night.',
  },
  {
    id: 'palad',
    name: 'Palad Sandbar',
    town: 'santa-cruz',
    kind: 'Sandbar',
    icon: 'waves',
    about: 'A sandbar near Maniwaya that rises out of the sea when the tide is low.',
    tip: 'It disappears at high tide. Go with a boatman who knows the tide times and stays with you.',
  },
  {
    id: 'mongpong',
    name: 'Mongpong Island',
    town: 'santa-cruz',
    kind: 'Island',
    icon: 'palm-tree',
    about: 'Quiet beaches and mangroves, a short boat ride from Maniwaya.',
    tip: 'Mangroves are nurseries for young fish. Stay on paths and do not cut or pull roots.',
  },
  {
    id: 'gaspar',
    name: 'Gaspar Island (Tres Reyes)',
    town: 'gasan',
    kind: 'Island and reef',
    icon: 'diving-snorkel',
    about: 'One of the three Tres Reyes islands off Gasan, with reefs close to shore for snorkeling.',
    tip: 'Float, do not stand on the coral. Parts of the reef are protected; follow your guide on where to swim.',
  },
  {
    id: 'poctoy',
    name: 'Poctoy White Beach',
    town: 'torrijos',
    kind: 'Beach',
    icon: 'beach',
    about: 'A public white-sand beach facing the Sibuyan Sea, with Mt. Malindig behind it.',
    tip: 'Bring your trash back with you. There are few bins on most beaches.',
  },
];
