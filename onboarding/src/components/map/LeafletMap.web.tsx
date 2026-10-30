import { createElement, forwardRef, useCallback, useEffect, useImperativeHandle, useRef } from 'react';
import { View } from 'react-native';

import { colors } from '@/theme';

import { LEAFLET_HTML } from './leafletHtml';
import { parseMapMessage, type LeafletMapHandle, type LeafletMapProps } from './types';

type MapWindow = Window & { __receive?: (json: string) => void };

// Web version: the same Leaflet page in a same-origin srcdoc iframe.
export const LeafletMap = forwardRef<LeafletMapHandle, LeafletMapProps>(function LeafletMap({ data, onZonePress, onPlacePress, onTownPress, onError, style }, ref) {
  const frame = useRef<HTMLIFrameElement | null>(null);
  const ready = useRef(false);
  const latest = useRef({ data, onZonePress, onPlacePress, onTownPress, onError });
  latest.current = { data, onZonePress, onPlacePress, onTownPress, onError };

  const post = useCallback((msg: object) => {
    if (!ready.current) return;
    (frame.current?.contentWindow as MapWindow | null)?.__receive?.(JSON.stringify(msg));
  }, []);

  useImperativeHandle(ref, () => ({ command: (c) => post(c) }), [post]);

  useEffect(() => {
    post({ type: 'data', data });
  }, [data, post]);

  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (e.source !== frame.current?.contentWindow) return;
      const m = parseMapMessage((e.data as { __maraine?: unknown } | null)?.__maraine);
      if (!m) return;
      if (m.type === 'ready') {
        ready.current = true;
        post({ type: 'data', data: latest.current.data });
      } else if (m.type === 'error') latest.current.onError?.();
      else if (m.type === 'place') latest.current.onPlacePress?.(m.id);
      else if (m.type === 'town') latest.current.onTownPress?.(m.id);
      else latest.current.onZonePress?.(m.id);
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [post]);

  return (
    <View style={[{ backgroundColor: colors.sea100, overflow: 'hidden' }, style]}>
      {createElement('iframe', {
        ref: frame,
        srcDoc: LEAFLET_HTML,
        title: 'Map of Marinduque',
        style: { border: 0, width: '100%', height: '100%', display: 'block' },
      })}
    </View>
  );
});
