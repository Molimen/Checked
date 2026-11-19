
type tenantType = {
  success: boolean;
  tenant_code: string;
  tenant_name: string;
  message: string;
};

export default async function verifyTenantCode(code: string) {
  const host = /^\d+$/.test(code)
    ? "https://e-ujian.com"
    : "https://app.e-ujian.com";

  const response = await fetch(`${host}/api/seb/tenant/${encodeURIComponent(code)}`, {
    method: "GET",
    headers: {
      "User-Agent": "EUjianBrowser/1.0 Android",
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP Error: ${response.status}`);
  }

  return await response.json() as tenantType;
}