import ReactNativeBlobUtil from 'react-native-blob-util';

const OWNER = 'Molimen';
const REPO = 'Checked';
export type UpdateInfo = {
  version: string;
  notes: string;
  apkUrl: string;
  size: number;
};

// Set to true in debug builds to use the local mock server (mock-github-server.js)
// const USE_MOCK = __DEV__ && true;
const USE_MOCK = false;
// 10.0.2.2 = host machine from the Android emulator.
// Real device over USB: run `adb reverse tcp:8787 tcp:8787` and use http://localhost:8787
const MOCK_BASE = 'http://localhost:8787';
const API_BASE = USE_MOCK ? MOCK_BASE : 'https://api.github.com';


/** Returns update info if a newer release with an .apk asset exists, else null. */
export async function checkForUpdate(): Promise<UpdateInfo | null> {
  const res = await fetch(
    `${API_BASE}/repos/${OWNER}/${REPO}/releases/latest`,
    { headers: { Accept: 'application/vnd.github+json' } },
  );
  if (!res.ok) throw new Error(`GitHub API error ${res.status}`);

  const release = await res.json();
  const asset = release.assets?.find((a: any) => a.name.endsWith('.apk'));
  if (!asset) return null;

  const version: string = release.tag_name;

  return {
    version,
    notes: release.body ?? '',
    apkUrl: asset.browser_download_url,
    size: asset.size,
  };
}

/** Downloads the APK and opens the system installer. */
export async function downloadAndInstall(
  info: UpdateInfo,
  onProgress?: (fraction: number) => void,
) {
  const path = `${ReactNativeBlobUtil.fs.dirs.DocumentDir}/update-${info.version}.apk`;

  // remove old copy if present
  if (await ReactNativeBlobUtil.fs.exists(path)) {
    await ReactNativeBlobUtil.fs.unlink(path);
  }

  await ReactNativeBlobUtil.config({ path, fileCache: true })
    .fetch(
      'GET',
      info.apkUrl,
      {},
    )
    .progress({ count: 10 }, (received, total) => {
      const t = Number(total) || info.size;
      onProgress?.(Number(received) / t);
    });

  await ReactNativeBlobUtil.open.file(path, {
    mime: 'application/vnd.android.package-archive',
  });
}

/* Usage:

const info = await checkForUpdate();
if (info) {
  await downloadAndInstall(info, p => console.log(Math.round(p * 100) + '%'));
}
*/