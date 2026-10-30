import type { ImageSourcePropType } from 'react-native';

import type { CommunityIconName } from './icons';
import type { MunicipalityId } from './municipalities';

// Real coastal places in Marinduque: islands, beaches, sandbars and ports only (nothing inland, no golf
// courses or hotels). Positions come from OpenStreetMap. Descriptions stay general on purpose: no prices,
// schedules or ratings that would go out of date or would need a source.
// Photos are freely licensed from Wikimedia Commons and always shown with their credit; places without a
// verified free photo get a drawing instead of a stand-in picture.

export type PlaceKind = 'island' | 'beach' | 'sandbar' | 'reef' | 'port';

export interface PlacePhoto {
  source: ImageSourcePropType;
  credit: string; // "Photo: <author>[, <license>, <source>]"
}

export interface Place {
  id: string;
  name: string;
  town: MunicipalityId;
  kind: PlaceKind;
  kindLabel: string;
  icon: CommunityIconName;
  lat: number;
  lng: number;
  about: string;
  tip: string;
  photo?: PlacePhoto;
}

export const PLACES: readonly Place[] = [
  {
    id: 'maniwaya',
    name: 'Maniwaya Island',
    town: 'santa-cruz',
    kind: 'island',
    kindLabel: 'Island',
    icon: 'island',
    lat: 13.5276,
    lng: 122.1216,
    about: 'A long white-sand beach and clear water, reached by boat from Santa Cruz.',
    tip: 'Sea turtles nest on some beaches here. Keep away from marked nests and never use lights on them at night.',
    photo: { source: require('../../assets/places/maniwaya-shore.jpg'), credit: 'Photo: Totoyba2, CC BY-SA 4.0, Wikimedia Commons' },
  },
  {
    id: 'palad',
    name: 'Palad Sandbar',
    town: 'santa-cruz',
    kind: 'sandbar',
    kindLabel: 'Sandbar',
    icon: 'waves',
    lat: 13.5424,
    lng: 122.1354,
    about: 'A sandbar near Maniwaya that rises out of the sea when the tide is low.',
    tip: 'It disappears at high tide. Go with a boatman who knows the tide times and stays with you.',
    photo: { source: require('../../assets/gallery/palad-sandbar.jpg'), credit: 'Photo: Shoestring Travelers Photography' },
  },
  {
    id: 'mongpong',
    name: 'Mongpong Island',
    town: 'santa-cruz',
    kind: 'island',
    kindLabel: 'Island',
    icon: 'palm-tree',
    lat: 13.5165,
    lng: 122.1789,
    about: 'Quiet beaches and mangroves east of Maniwaya.',
    tip: 'Mangroves are nurseries for young fish. Stay on paths and do not cut or pull roots.',
  },
  {
    id: 'salomague',
    name: 'Salomague Island',
    town: 'santa-cruz',
    kind: 'island',
    kindLabel: 'Island',
    icon: 'island',
    lat: 13.4111,
    lng: 122.1331,
    about: 'A small island off the east coast of Santa Cruz.',
    tip: 'Bring water and shade; there are few shops on the small islands.',
  },
  {
    id: 'buyabod',
    name: 'Buyabod Port',
    town: 'santa-cruz',
    kind: 'port',
    kindLabel: 'Port',
    icon: 'ferry',
    lat: 13.4793,
    lng: 122.0549,
    about: 'A port on the north coast of Santa Cruz, by the water at Matalaba.',
    tip: 'Ask the port staff about boat schedules on the day; they change with the weather and the sea.',
  },
  {
    id: 'gaspar',
    name: 'Gaspar Island (Tres Reyes)',
    town: 'gasan',
    kind: 'reef',
    kindLabel: 'Island and reef',
    icon: 'diving-snorkel',
    lat: 13.2491,
    lng: 121.8589,
    about: 'The biggest of the three Tres Reyes islands off Gasan, with clear water and reefs close to the rocks for snorkeling.',
    tip: 'Float, do not stand on the coral. Parts of the reef are protected; follow your guide on where to swim.',
    photo: { source: require('../../assets/places/tres-reyes.jpg'), credit: 'Photo: Tomauer (Wikivoyage), public domain, Wikimedia Commons' },
  },
  {
    id: 'melchor',
    name: 'Melchor Island (Tres Reyes)',
    town: 'gasan',
    kind: 'island',
    kindLabel: 'Islet',
    icon: 'island',
    lat: 13.2345,
    lng: 121.8329,
    about: 'The middle of the three Tres Reyes islets, between Gaspar and Baltasar.',
    tip: 'Small islets can be slippery and sharp. Wear reef shoes and stay with your boat crew.',
    photo: { source: require('../../assets/gallery/tres-reyes-aerial.jpg'), credit: 'Photo: supplied by the MarAIne team' },
  },
  {
    id: 'baltasar',
    name: 'Baltasar Island (Tres Reyes)',
    town: 'gasan',
    kind: 'island',
    kindLabel: 'Islet',
    icon: 'island',
    lat: 13.2251,
    lng: 121.8113,
    about: 'The westernmost of the three Tres Reyes islets off Gasan.',
    tip: 'Check the sea before you cross; the channel can get rough in the afternoon wind.',
    photo: { source: require('../../assets/gallery/tres-reyes-aerial.jpg'), credit: 'Photo: supplied by the MarAIne team' },
  },
  {
    id: 'poctoy',
    name: 'Poctoy White Beach',
    town: 'torrijos',
    kind: 'beach',
    kindLabel: 'Beach',
    icon: 'beach',
    lat: 13.3264,
    lng: 122.1012,
    about: 'A public white-sand beach in Torrijos facing the Sibuyan Sea, with Mt. Malindig behind it.',
    tip: 'Bring your trash back with you. There are few bins on most beaches.',
  },
];

export const getPlace = (id: string) => PLACES.find((p) => p.id === id);

// Gallery photos. Some show places that are not pins on the map (a resort island, a rock arch),
// so they live in their own list. Photos supplied by the team; credits follow the watermark on each.
export interface GalleryPhoto {
  id: string;
  name: string;
  town: MunicipalityId;
  about: string;
  photo: PlacePhoto;
}

export const GALLERY: GalleryPhoto[] = [
  {
    id: 'tres-reyes-aerial',
    name: 'Tres Reyes Islands',
    town: 'gasan',
    about: 'Gaspar, Melchor and Baltasar, three small islands off Gasan with clear water and coral.',
    photo: { source: require('../../assets/gallery/tres-reyes-aerial.jpg'), credit: 'Photo: supplied by the MarAIne team' },
  },
  {
    id: 'palad',
    name: 'Palad Sandbar',
    town: 'santa-cruz',
    about: 'A long white sandbar near Maniwaya that shows at low tide.',
    photo: { source: require('../../assets/gallery/palad-sandbar.jpg'), credit: 'Photo: Shoestring Travelers Photography' },
  },
  {
    id: 'bellarocca',
    name: 'Bellarocca (Elephant Island)',
    town: 'buenavista',
    about: 'A small island off Buenavista with a private resort on its slopes.',
    photo: { source: require('../../assets/gallery/bellarocca.jpg'), credit: 'Photo: supplied by the MarAIne team' },
  },
  {
    id: 'ungab',
    name: 'Ungab Rock Formation',
    town: 'santa-cruz',
    about: 'A natural rock arch over a quiet, clear-water cove.',
    photo: { source: require('../../assets/gallery/ungab-rock.jpg'), credit: 'Photo: robellejoyce' },
  },
];
