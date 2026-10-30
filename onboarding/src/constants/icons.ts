import type { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';

export type CommunityIconName = ComponentProps<typeof MaterialCommunityIcons>['name'];
export type MaterialIconName = ComponentProps<typeof MaterialIcons>['name'];
