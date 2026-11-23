import React, { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Appbar, Divider, List, Switch, useTheme, Button, Portal, Dialog, Text, TextInput, ProgressBar } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getCache, setCache, storage } from '../services/storage';
import verifyTenantCode from '../services/verifyTenantCode';
import { useMMKVBoolean, useMMKVString } from 'react-native-mmkv';
import { checkForUpdate, downloadAndInstall, UpdateInfo } from '../services/updater';
import DeviceInfo from 'react-native-device-info';

// what will have here:
// - change tenant code
// - add setting that force use old login ui

// menu:
// --- General ---
// - dark mode
// - language
// --- --END-- ---

// --- Ujian settings ---
// - change tenant code
// - use the old login ui (in browser)
// --- ------END----- ---

const styles = StyleSheet.create({
  root: { flex: 1 },
  input: {
    backgroundColor: 'transparent',
    height: 56,
  },
  outline: {
    borderRadius: 4,
    borderWidth: 1,
  },
});

function ListGeneral() {
  const [systemDarkMode, setSystemDarkMode] = useMMKVBoolean("system_dark_mode");
  const [darkMode, setDarkMode] = useMMKVBoolean("dark_mode");

  return (
    <>
      <List.Section>
        <List.Subheader>General</List.Subheader>

        <List.Item
          title="System Dark mode"
          description="following system dark mode"
          left={(p) => <List.Icon {...p} icon="theme-light-dark" />}
          right={() => <Switch value={systemDarkMode} onValueChange={setSystemDarkMode} />}
        />
        <List.Item
          title="Dark mode"
          left={(p) => <List.Icon {...p} icon="theme-light-dark" />}
          right={() => <Switch disabled={systemDarkMode} value={darkMode} onValueChange={setDarkMode} />}
        />
        <List.Item
          title="Language"
          description="Coming soon..."
          left={(p) => <List.Icon {...p} icon="earth" />}
          // right={(p) => <List.Icon {...p} icon="chevron-right" />}
          // onPress={() => {}}
        />
      </List.Section>
    </>
  )
}

function ListUjianSettings() {
  const [changeTennantCode, setChangeTennantCode] = useState(false);
  const [enterTennantCode, setEnterTennantCode] = useState(false);
  const [forceOldLogin, setForceOldLogin] = useMMKVBoolean("force_old_login");
  const [tenantCode, setTenantCode] = useState('');
  const [tenantError, setTenantError] = useState('');
  const [tenantCheckingState, setTenantCheckingState] = useState(false);
  const [tenantName] = useMMKVString('tenant_name');
  
  const theme = useTheme();
  
  async function checkTenantCode() {
    setTenantCheckingState(true);
    const result = await verifyTenantCode(tenantCode);

    if (result.success) {
      storage.set('tenant_name', result.tenant_name);
      storage.set('tenant_code', result.tenant_code);

      setTenantError("");
      setEnterTennantCode(false);
      setTenantCode("");
    } else {
      setTenantError(result.message);
    }
    setTenantCheckingState(false);
  }

  return (
    <>
      <List.Section>
        <List.Subheader>Ujian Settings</List.Subheader>

        <List.Item
          title="Tennant code"
          description={tenantName ? "Change the tennant code" : "Set the tennant code"}
          left={(p) => <List.Icon {...p} icon="xml" />}
          right={(p) => <List.Icon {...p} icon="chevron-right" />}
          onPress={() => {
            tenantName
            ? setChangeTennantCode(true)
            : setEnterTennantCode(true)
          }}
        />
        <List.Item
          title="Old login screen"
          description="Use the old login screen on the browser"
          left={(p) => <List.Icon {...p} icon="login-variant" />}
          right={() => <Switch value={forceOldLogin} onValueChange={setForceOldLogin} />}
        />
      </List.Section>


      <Portal>
        <Dialog visible={changeTennantCode} onDismiss={() => setChangeTennantCode(false)}>
          <Dialog.Icon icon="xml" />
          <Dialog.Title style={{ textAlign: 'center' }}>Change tennant code?</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium">
              You'll need to re-enter the tennant code to enter an exam.
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setChangeTennantCode(false)}>Cancel</Button>
            <Button
              onPress={() => {
                setChangeTennantCode(false);
                storage.remove('tenant_code');
                storage.remove('tenant_name');
                setEnterTennantCode(true);
              }}
            >
              Change
            </Button>
          </Dialog.Actions>
        </Dialog>

        <Dialog visible={enterTennantCode} onDismiss={() => setEnterTennantCode(false)}>
          <Dialog.Icon icon="xml" />
          <Dialog.Title style={{ textAlign: 'center' }}>Enter the tennant code</Dialog.Title>
          <Dialog.Content>
            <TextInput
              mode='outlined'
              label='Masukan kode'
              value={tenantCode}
              onChangeText={(text) => {setTenantCode(text); setTenantError("")}}
              autoCapitalize='none'
              autoCorrect={false}
              returnKeyType='done'
              onSubmitEditing={() => checkTenantCode()}
              error={!!tenantError}
              outlineStyle={styles.outline} 
              style={styles.input}
              right={
                tenantError ? (
                  <TextInput.Icon
                    icon="alert-circle"
                    color={theme.colors.error}
                  />
                ) : tenantCode.length > 0 ? (
                  <TextInput.Icon
                    icon="close-circle"
                    onPress={() => setTenantCode('')}
                  />
                ) : undefined
              }
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setEnterTennantCode(false)}>Cancel</Button>
            <Button
              disabled={!tenantCode}
              loading={tenantCheckingState}
              onPress={() => {
                checkTenantCode();
              }}
            >
              Change
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </>
  )
}

// automatic update 1 day ttl
// check for update button is NOT cache

function ListUpdates() {
  const [updateInfoPopup, setUpdateInfoPopup] = useState(false);
  const [updateAppPopup, setUpdateAppPopup] = useState(false);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [isOnLatestUpdate, setIsOnLatestUpdate] = useState(true);
  const [updateDownloadProgress, setUpdateDownloadProgress] = useState(0.0);

  const [isThereAnyError, setIsThereIsAnyError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

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

  async function checkUpdates() {
    setUpdateLoading(true);
    let cacheInfo = getCache<UpdateInfo>("cacheUpdate");

    let info: UpdateInfo | null = null;

    try {
      info = await checkForUpdate();
    } catch (error) {
      if (error instanceof Error) {
        setErrorMessage(error.message);
        setIsThereIsAnyError(true);
        setUpdateLoading(false);
        setIsOnLatestUpdate(true);
        return;
      } else {
        setErrorMessage("Failed to retrieve the data");
        setIsThereIsAnyError(true);
        setUpdateLoading(false);
        setIsOnLatestUpdate(true);
        return
      }
    }

    if (info === null) {
      setErrorMessage("Failed to retrieve the data");
      setIsThereIsAnyError(true);
      setUpdateLoading(false);
      setIsOnLatestUpdate(true);
      return;
    }

    setCache("cacheUpdate", info);
    cacheInfo = info;

    if (isNewerVersion(cacheInfo.version, DeviceInfo.getVersion())) {
      setIsOnLatestUpdate(false);
    } else {
      setIsOnLatestUpdate(true);
    }
    setUpdateLoading(false);
  }

  async function downloadUpdates() {
    let cacheInfo = getCache<UpdateInfo>("cacheUpdate");

    if (cacheInfo === null) {
      setErrorMessage("Failed to retrieve the data");
      setIsThereIsAnyError(true);
      setUpdateLoading(false);
      setIsOnLatestUpdate(true);
      setUpdateDownloadProgress(0);
      return
    }

    try {
      await downloadAndInstall(cacheInfo, p => setUpdateDownloadProgress(p));
    } catch (error) {
      if (error instanceof Error) {
        setErrorMessage(error.message);
        setIsThereIsAnyError(true);
        setUpdateLoading(false);
        setIsOnLatestUpdate(true);
        setUpdateDownloadProgress(0);
      } else {
        setErrorMessage("Failed to retrieve the data");
        setIsThereIsAnyError(true);
        setUpdateLoading(false);
        setIsOnLatestUpdate(true);
        setUpdateDownloadProgress(0);
      }
    }
  }

  let updateInfoPopupDialogContentText = "";
  if (!isThereAnyError) {
  if (updateLoading) {
      updateInfoPopupDialogContentText = "Checking for updates";
    } else if (isOnLatestUpdate) {
      updateInfoPopupDialogContentText = "No updates available."
    } else {
      updateInfoPopupDialogContentText = "There's updates available."
    }
  } else {
    if (errorMessage === "Network request failed") {
      updateInfoPopupDialogContentText = "Failed to request a updates. Please check your internet connection."
    } else if (errorMessage === "Failed to retrieve the data") {
      updateInfoPopupDialogContentText = "Something went wrong. please inform the developer."
    }
  }

  return (
    <>
      <List.Section>
        <List.Subheader>Updates</List.Subheader>

        <List.Item
          title="Update"
          description="Check for updates"
          left={(p) => <List.Icon {...p} icon="update" />}
          right={(p) => <List.Icon {...p} icon="chevron-right" />}
          onPress={() => { checkUpdates(); setUpdateInfoPopup(true); }}
        />

        {/* <List.Item
          title="Reset cache update"
          left={(p) => <List.Icon {...p} icon="update" />}
          right={(p) => <List.Icon {...p} icon="chevron-right" />}
          onPress={() => { removeCache("cacheUpdate") }}
        /> */}
      </List.Section>

      <Portal>
        <Dialog visible={updateInfoPopup} onDismiss={() => setUpdateInfoPopup(false)}>
          <Dialog.Icon icon="update" />
          <Dialog.Title style={{ textAlign: 'center' }}>Updates</Dialog.Title>
          <Dialog.Content>
            <ProgressBar indeterminate visible={updateLoading} />
            <Text variant="bodyLarge">
              {updateInfoPopupDialogContentText}
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setUpdateInfoPopup(false) }>Cancel</Button>
            <Button
              disabled={isOnLatestUpdate}
              onPress={() => {
                setUpdateAppPopup(true);
                setUpdateInfoPopup(false);
                downloadUpdates();
              }}
            >
              Updates
            </Button>
          </Dialog.Actions>
        </Dialog>

        <Dialog visible={updateAppPopup} onDismiss={() => setUpdateAppPopup(false)}>
          <Dialog.Icon icon="update" />
          <Dialog.Title style={{ textAlign: 'center' }}>Updates</Dialog.Title>
          <Dialog.Content>
              <ProgressBar progress={updateDownloadProgress} />
              <Text variant="bodyLarge">
                Downloading updates...
              </Text>
          </Dialog.Content>
          {/* <Dialog.Actions>
            <Button onPress={() => setUpdateAppPopup(false) }>Cancel</Button>
            <Button
              onPress={() => {
              }}
            >
              Updates
            </Button>
          </Dialog.Actions> */}
        </Dialog>
      </Portal>
    </>
  )
}

export default function SettingsScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.background }]}>
      <Appbar.Header mode="small" elevated>
        <Appbar.Content title="Settings" />
      </Appbar.Header>

      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
        showsVerticalScrollIndicator={false}
      >
        <ListGeneral />

        <Divider />

        <ListUjianSettings />

        <Divider />

        <ListUpdates />
      </ScrollView>
    </View>
  );
}