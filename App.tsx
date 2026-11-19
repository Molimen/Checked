import { StatusBar, useColorScheme } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  Button,
  Dialog,
  // BottomNavigation,
  MD3DarkTheme,
  MD3LightTheme,
  MD3Theme,
  PaperProvider,
  Portal,
  Text,
} from 'react-native-paper';
import TabNavigation from './src/navigation/TabNavigation';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import DetailScreen from './src/screens/DetailScreen';
import BrowserScreen from './src/screens/BrowserScreen';
import { useMMKVBoolean } from 'react-native-mmkv';
import { useState } from 'react';
import { getCache, setCache } from './src/services/storage';
import { checkForUpdate, UpdateInfo } from './src/services/updater';
import DeviceInfo from 'react-native-device-info';
import { AndroidDynamicColor } from 'material-color-react-native';
import { PaperColorAdapter } from 'material-color-react-native/react-native-paper';

// currently missing:
// - always force user to run
// the app on background so
// the browser dont close

// const styles = StyleSheet.create({
//   center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
// });

// function makeScreen(title: string) {
//   return function Screen() {
//     const theme = useTheme();
    // return (
//       <View style={[styles.center, { backgroundColor: theme.colors.background }]}>
//         <Text variant="headlineMedium">{title}</Text>
//       </View>
//     );
//   };
// }

// const HomeRoute = makeScreen('Home');
// const SettingsRoute = makeScreen('Settings');
// const AboutRoute = makeScreen('About');

// function Tabs() {
//   const [index, setIndex] = useState(0);
//   const [routes] = useState([
//     { key: 'home', title: 'Home', focusedIcon: 'home', unfocusedIcon: 'home-outline' },
//     { key: 'settings', title: 'Settings', focusedIcon: 'cog', unfocusedIcon: 'cog-outline' },
//     { key: 'about', title: 'About', focusedIcon: 'information', unfocusedIcon: 'information-outline' },
//   ]);

//   const renderScene = BottomNavigation.SceneMap({
//     home: HomeRoute,
//     settings: SettingsRoute,
//     about: AboutRoute,
//   });

//   return (
//     <BottomNavigation
//       navigationState={{ index, routes }}
//       onIndexChange={setIndex}
//       renderScene={renderScene}
//     />
//   );
// }

const Stack = createNativeStackNavigator();

export default function App() {
  const [darkMode, setDarkMode] = useMMKVBoolean("dark_mode");
  const [systemDarkMode] = useMMKVBoolean("system_dark_mode");
  const scheme = useColorScheme();

  if (darkMode === undefined) {
    if (scheme === null) {
      setDarkMode(true);
    } else {
      setDarkMode(scheme === "dark" ? true : false);
    }
  }

  let base: MD3Theme;
  let isDark: boolean;

  if (systemDarkMode) {
    base = scheme === "dark" ? MD3DarkTheme : MD3LightTheme;
    isDark = scheme === "dark" ? true : false;
  } else {
    base = darkMode ? MD3DarkTheme : MD3LightTheme;
    isDark = darkMode ? true : false;
  }

  const androidTheme = new AndroidDynamicColor({ isDark: isDark });

  const PaperTheme = {
    ...base,
    colors: {
      ...base.colors,
      ...PaperColorAdapter.fromAndroidDynamicColor(androidTheme)
    }
  }

  // "v1.2.3" -> [1,2,3]
  const parseVersion = (v: string) =>
    v.replace(/^v/i, '').split('-')[0].split('.').map(n => parseInt(n, 10) || 0);

  function isNewerVersion(remote: string, local: string): boolean {
    const r = parseVersion(remote);
    const l = parseVersion(local);
    for (let i = 0; i < Math.max(r.length, l.length); i++) {
      const diff = (r[i] ?? 0) - (l[i] ?? 0);
      if (diff !== 0) return diff > 0;
    }
    return false;
  }
  
  const [updatesPopup, setUpdatesPopup] = useState(false);
  async function checkUpdates() {
    let cacheInfo = getCache<UpdateInfo>("cacheUpdate");

    if (cacheInfo === null) {
      let info: UpdateInfo | null = null;

      try {
        info = await checkForUpdate();
      } catch {
        return
      }

      if (info === null) {
        return;
      }

      setCache("cacheUpdate", info);
      cacheInfo = info;
    }

    if (isNewerVersion(cacheInfo.version, DeviceInfo.getVersion())) {
      setUpdatesPopup(true);
    }
  }

  const [dontCheckUpdates, setDontCheckUpdates] = useState(false);
  if (!dontCheckUpdates) {
    checkUpdates();
    setDontCheckUpdates(true);
  }

  return (
    <SafeAreaProvider>
      <PaperProvider theme={PaperTheme}>
        <StatusBar 
          barStyle={scheme === "dark" ? "light-content" : "dark-content"}
        />

        <NavigationContainer>
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            {/* home, settings, about */}
            <Stack.Screen name="Tabs" component={TabNavigation} />

            {/* more information that didn't need bottom navigation */}
            <Stack.Screen name="Browser" component={BrowserScreen} />
            <Stack.Screen name="Detail" component={DetailScreen} />
          </Stack.Navigator>
        </NavigationContainer>

        <Portal>
          <Dialog visible={updatesPopup} onDismiss={() => setUpdatesPopup(false)}>
            <Dialog.Icon icon="update" />
            <Dialog.Title style={{ textAlign: 'center' }}>Updates</Dialog.Title>
            <Dialog.Content>
                <Text variant="bodyLarge">
                  There updates available. go to settings to updates it.
                </Text>
            </Dialog.Content>
            <Dialog.Actions>
              <Button onPress={() => setUpdatesPopup(false) }>Close</Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>
      </PaperProvider>
    </SafeAreaProvider>
  );
}