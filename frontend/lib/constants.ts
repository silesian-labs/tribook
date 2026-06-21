// Testnet deployment (tribook on testnet using DBUSDC)
export const PACKAGE_ID = "0x30fc00c84984342f69a81cf114798d0f820c9e009121184e86761ad957ee99f6";
export const VAULT_ID = "0x6351c896d9881fa9a04dedb00d37af0983a836d1d04063088825620bb121b3e1";

export const COIN_TYPES = {
  USDC: "0xf7152c05930480cd740d7311b5b8b45c6f488e3a53a11c3f74a6fac36a52e0d7::DBUSDC::DBUSDC",
  TBUSDC: `${PACKAGE_ID}::tbusdc::TBUSDC`,
};

export const MODULE_NAMES = {
  VAULT: "tribook_vault",
  AGENT: "agent",
};
