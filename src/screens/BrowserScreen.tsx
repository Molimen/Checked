import { useNavigation } from '@react-navigation/native';
import { BackHandler, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import WebView, { WebViewNavigation } from 'react-native-webview';
import { storage } from '../services/storage';
import DeviceInfo from 'react-native-device-info';
import { useCallback, useEffect, useRef, useState } from 'react';
import Svg, { Path } from 'react-native-svg';
import { Kiosk } from '../services/kiosk';
import { useMMKVBoolean } from 'react-native-mmkv';
import { Button, Dialog, Portal, Text } from 'react-native-paper';
import SystemNavigationBar from 'react-native-system-navigation-bar';

const EUjianVersion = "3.1.4"

const ACCENT_CYAN = '#22D3EE';
const BG_PRIMARY = '#0B0F19';
const SURFACE = '#151B2B';
const TEXT_SECONDARY = '#94A3B8';

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: BG_PRIMARY,
  },
  progressContainer: {
    height: 8,
    width: '100%',
  },
  progressGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 8,
    backgroundColor: ACCENT_CYAN,
    opacity: 0.25,
  },
  progressTrack: {
    height: 3,
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
  },
  progressFill: {
    height: 3,
    backgroundColor: ACCENT_CYAN,
  },
  webview: {
    flex: 1,
    backgroundColor: BG_PRIMARY,
  },
  statusBar: {
    height: 28,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    backgroundColor: SURFACE,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  batteryText: {
    flex: 1,
    color: TEXT_SECONDARY,
    fontSize: 12,
  },
  refreshButton: {
    paddingHorizontal: 10,
    paddingVertical: 2,
  },
  clockText: {
    color: TEXT_SECONDARY,
    fontSize: 12,
    fontVariant: ['tabular-nums'],
  },
});

function formatClock(date: Date) {
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

export default function BrowserScreen() {
  const isNumeric = (s: string) => /^\d+$/.test(s);

  const webviewRef = useRef(null);

  const [progress, setProgress] = useState(0); // 0..1, like onProgressChanged
  const [isLoading, setIsLoading] = useState(true);
  const [batteryLevel, setBatteryLevel] = useState(-1); // 0..1
  const [clock, setClock] = useState(formatClock(new Date()));
  const [forceOldLogin] = useMMKVBoolean("force_old_login");
  const [warningExitDialog, setWarningExitDialog] = useState(false);
  const [lastWarningExitDialog, setLastWarningExitDialog] = useState(false);
  
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    if (hidden) {
      SystemNavigationBar.setImmersive("sticky");
    } else {
      SystemNavigationBar.show();
    }
  }, [hidden]);

  const handleRefresh = useCallback(() => {
    webviewRef.current?.reload();
  }, []);

  const handleLock = useCallback(async () => {
    if (!(await Kiosk.isEnabled())) {
      await Kiosk.enable();
      setHidden(true);
    } else if (await Kiosk.isEnabled()) {
      await Kiosk.disable();
      setHidden(false);
    }
  }, []);

  useEffect(() => {
    const id = setInterval(() => setClock(formatClock(new Date())), 1000);
    return () => clearInterval(id);
  }, []);

  // useEffect(() => {
  //   if (!DeviceInfo) return;
  //   let sub;
  //   DeviceInfo.getBatteryLevel().then(setBatteryLevel);
  //   if (DeviceInfo.addBatteryLevelListener) {
  //     sub = DeviceInfo.addBatteryLevelListener(setBatteryLevel);
  //   }
  //   return () => sub && sub.remove && sub.remove();
  // }, []);

  useEffect(() => {
    const updateBattery = async () => {
      const level = await DeviceInfo.getBatteryLevel();
      setBatteryLevel(level);
    };

    updateBattery();

    const interval = setInterval(updateBattery, 30000); // every 30s

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        setWarningExitDialog(true);

        return true;
      }
    );
    
    return () => backHandler.remove();
  }, []);


  const tenantCode = storage.getString('tenant_code');
  const navigation = useNavigation();

  if (tenantCode === undefined) {
    return (
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
        <Text>
          something went wrong.
        </Text>
      </SafeAreaView>
    )
  }

  const uri = forceOldLogin
  ? `https://e-ujian.com/${tenantCode}/gologin`
  : isNumeric(tenantCode) 
    ? `https://e-ujian.com/${tenantCode}/gologin` 
    : `https://app.e-ujian.com/${tenantCode}/login`;

  const ua = DeviceInfo.getUserAgentSync();
 
  const batteryText =
    batteryLevel === -1 ? '🔋 --%' : `🔋 ${Math.round(batteryLevel * 100)}%`;


  const handleNavChange = (navState: WebViewNavigation) => {
    console.log(navState);
    if (navState.url.includes('seb-quit-confirmed')) {
      navigation.goBack()
    }
  };



  return (
    <SafeAreaView style={[styles.root ,{ flex: 1 }]} edges={['top', 'bottom']}>
      <View style={styles.progressContainer}>
        {isLoading && <View style={styles.progressGlow} />}
        {isLoading && (
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                { width: `${Math.max(progress * 100, 4)}%` },
              ]}
            />
          </View>
        )}
      </View>


      <WebView
        ref={webviewRef}
        source={{ uri: uri}}
        style={styles.webview}
        onLoadStart={() => setIsLoading(true)}
        onLoadEnd={() => setIsLoading(false)}
        onLoadProgress={({ nativeEvent }) => setProgress(nativeEvent.progress)}
        userAgent={ua + ` EujianBrowser/${EUjianVersion}`}
        onNavigationStateChange={handleNavChange}
      />

      <View style={styles.statusBar}>
        <TouchableOpacity onPress={handleLock} style={{ flex:1, paddingVertical:4 }}>
          <Text style={styles.batteryText} numberOfLines={1}>
            {batteryText}
          </Text>
        </TouchableOpacity>
 
        <TouchableOpacity onPress={handleRefresh} style={styles.refreshButton}>
          <Svg width={24} height={24} viewBox="0 0 24 24">
            <Path
              fill={"#6B7280"}
              d="M17.65,6.35C16.2,4.9 14.21,4 12,4c-4.42,0 -7.99,3.58 -7.99,8s3.57,8 7.99,8c3.73,0 6.84,-2.55 7.73,-6h-2.08c-0.82,2.33 -3.04,4 -5.65,4 -3.31,0 -6,-2.69 -6,-6s2.69,-6 6,-6c1.66,0 3.14,0.69 4.22,1.78L13,11h7V4l-2.35,2.35z"
            />
          </Svg>
        </TouchableOpacity>
 
        <Text style={styles.clockText}>{clock}</Text>
      </View>


      <Portal>
        <Dialog visible={warningExitDialog} onDismiss={() => setWarningExitDialog(false)}>
          <Dialog.Icon icon="alert" />
          <Dialog.Title style={{ textAlign: 'center' }}>Exit?</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium">
              You pressed the back button. Are you sure want to exit?
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button
              onPress={() => {
                setWarningExitDialog(false);
                setLastWarningExitDialog(true);
              }}
            >
              Exit
            </Button>
            <Button mode='contained' onPress={() => setWarningExitDialog(false)}>Cancel</Button>
          </Dialog.Actions>
        </Dialog>

        <Dialog visible={lastWarningExitDialog} onDismiss={() => setLastWarningExitDialog(false)}>
          <Dialog.Icon icon="alert" />
          <Dialog.Title style={{ textAlign: 'center' }}>LAST WARNING</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium">
              Are you REALLY sure want to exit?
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <View
              style={{ flex: 1, flexDirection: "row", justifyContent: "space-between" }}
            >
              <Button
                onPress={() => {
                  navigation.goBack();
                  setLastWarningExitDialog(false);
                }}
              >
                Exit
              </Button>
              <Button mode='contained' onPress={() => setLastWarningExitDialog(false)}>Cancel</Button>
            </View>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </SafeAreaView>
  );
}