import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, type ComponentType, type Ref } from 'react';
import type { NativeSyntheticEvent, StyleProp, ViewStyle } from 'react-native';
import { WebView as RNWebView } from 'react-native-webview';

import { SITE_URL } from '@/services/supabase';
import { colors } from '@/theme';

import { LEAFLET_HTML } from './leafletHtml';
import { parseMapMessage, type LeafletMapHandle, type LeafletMapProps } from './types';

// react-native-webview 14's published props intersect to `never` against React Native 0.88's types,
// so the handful of props used here are typed by hand. Runtime behaviour is the library's own.
type WebViewMessageEvent = NativeSyntheticEvent<{ data: string }>;
interface WebViewHandle {
  injectJavaScript: (script: string) => void;
}
const WebView = RNWebView as unknown as ComponentType<{
  ref?: Ref<WebViewHandle>;
  source: { html: string; baseUrl?: string };
  originWhitelist?: string[];
  onMessage?: (e: WebViewMessageEvent) => void;
  onError?: () => void;
  style?: StyleProp<ViewStyle>;
  setSupportMultipleWindows?: boolean;
  javaScriptEnabled?: boolean;
  scrollEnabled?: boolean;
  overScrollMode?: 'always' | 'content' | 'never';
}>;

// Phone version: Leaflet inside a WebView. The web build uses LeafletMap.web.tsx.
export const LeafletMap = forwardRef<LeafletMapHandle, LeafletMapProps>(function LeafletMap({ data, onZonePress, onError, style }, ref) {
  const web = useRef<WebViewHandle>(null);
  const ready = useRef(false);

  const post = useCallback((msg: object) => {
    if (!ready.current) return;
    web.current?.injectJavaScript(`window.__receive(${JSON.stringify(JSON.stringify(msg))});true;`);
  }, []);

  useImperativeHandle(ref, () => ({ command: (c) => post(c) }), [post]);

  useEffect(() => {
    post({ type: 'data', data });
  }, [data, post]);

  const onMessage = (e: WebViewMessageEvent) => {
    const m = parseMapMessage(e.nativeEvent.data);
    if (!m) return;
    if (m.type === 'ready') {
      ready.current = true;
      post({ type: 'data', data });
    } else if (m.type === 'error') onError?.();
    else onZonePress?.(m.id);
  };

  return (
    <WebView
      ref={web}
      // A real base URL so OpenStreetMap sees a Referer, as its tile policy asks.
      source={{ html: LEAFLET_HTML, baseUrl: SITE_URL || 'https://huliko.app' }}
      originWhitelist={['*']}
      onMessage={onMessage}
      onError={onError}
      style={[{ backgroundColor: colors.sea100 }, style]}
      setSupportMultipleWindows={false}
      javaScriptEnabled
      scrollEnabled={false}
      overScrollMode="never"
    />
  );
});
