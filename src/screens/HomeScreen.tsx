import { Button, Icon, Text, TextInput, useTheme } from 'react-native-paper';
import { storage } from '../services/storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { KeyboardAvoidingView, StyleSheet, View } from 'react-native';
import { useState } from 'react';
import verifyTenantCode from '../services/verifyTenantCode';
import { useMMKVString } from 'react-native-mmkv';

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 16,
    gap: 24,
  },
  card: {
    borderRadius: 28,
    paddingTop: 24,
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 8,
  },
  input: {
    backgroundColor: 'transparent',
    height: 56,
  },
  outline: {
    borderRadius: 4,
    borderWidth: 1,
  },
  supporting: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: 24,
  },
  button: {
    borderRadius: 28,
  },
  buttonContent: {
    height: 56,
  },
  buttonLabel: {
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: 0.1,
  },
});

function EnterCodeTenantScreen() {
  const [tenantCode, setTenantCode] = useState('');
  const [tenantError, setTenantError] = useState('');
  const [tenantCheckingState, setTenantCheckingState] = useState(false);

  async function checkTenantCode() {
    setTenantCheckingState(true);
    const result = await verifyTenantCode(tenantCode);

    if (result.success) {
      storage.set('tenant_name', result.tenant_name);
      storage.set('tenant_code', result.tenant_code);

      setTenantError("");
    } else {
      setTenantError(result.message);
    }
    setTenantCheckingState(false);
  }

  const theme = useTheme();

  return (
    <KeyboardAvoidingView
      style={[
        styles.root,
        { backgroundColor: theme.colors.background }
      ]}
    >
      <View style={{ gap:16, paddingBottom: 16 }}>
        <Text
          variant='displayMedium'
        >
          Kode Instansi
        </Text>
        <Text
          variant='bodyLarge'
          >
          Masukan kode yang diberikan oleh instansi atau sekolah Anda untuk mengakses ujian
        </Text>
      </View>

      <View
        style={[
          styles.card,
          { backgroundColor: theme.colors.surfaceVariant }
        ]}
      >
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

        <View style={[{flexDirection: 'column'}]}>
          {tenantError && (
            <>
              <Text
                variant="bodySmall"
                style={{ color: theme.colors.error, paddingHorizontal: 16 }}
              >
                {tenantError}
              </Text>
            </>
          )}

          <View style={styles.supporting}>
            <Icon
              source="code-tags"
              size={18}
              color={theme.colors.onSurfaceVariant}
            />
            <Text
              variant="bodySmall"
              style={{ color: theme.colors.onSurfaceVariant }}
            >
              Contoh: smkn1-bandung atau 123456
            </Text>
          </View>
        </View>
      </View>

      <Button
        mode='contained'
        onPress={() => checkTenantCode()}
        disabled={!tenantCode}
        contentStyle={styles.buttonContent}
        labelStyle={styles.buttonLabel}
        style={styles.button}
      >
        {tenantCheckingState ? "Menvalidasi..." : "Lanjutkan"}
      </Button>
    </KeyboardAvoidingView>
  );
}

function NormalHomeScreen({
  tenantName,
}: {
  tenantName: string;
}) {
  const navigation = useNavigation<any>();

  return (
    <>
      <View
        style={{ flex: 1, justifyContent: 'center', paddingHorizontal: 24, gap: 12 }}
      >
        <Text
          style={{
            fontWeight: "bold"
          }}
          variant='titleLarge'
        >
          Selamat datang
        </Text>

        <Text
          variant='displaySmall'
        >
          {tenantName}
        </Text>

        <Button
          mode='contained'
          onPress={() => navigation.navigate('Browser')}
        >
          Mulai Ujian
        </Button>
      </View>
    </>
  );
}

export default function HomeScreen() {
  const [tenantName] = useMMKVString("tenant_name");

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top']}>
      {tenantName 
        ? <NormalHomeScreen tenantName={tenantName} /> 
        : <EnterCodeTenantScreen />}

      {/* <Text variant="headlineMedium">
        {tenantName ? tenantName : "not entered a tenant code"}
      </Text>
      <Button mode="contained" onPress={() => navigation.navigate('Detail', { id: 42 })}>
        open detail
      </Button> */}
    </SafeAreaView>
  );
}