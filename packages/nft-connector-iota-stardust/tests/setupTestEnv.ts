// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import path from "node:path";
import type { IClientOptions } from "@iota/sdk-wasm/node/lib/index.js";
import { Guards, Is } from "@twin.org/core";
import { Bip39 } from "@twin.org/crypto";
import { MemoryEntityStorageConnector } from "@twin.org/entity-storage-connector-memory";
import { EntityStorageConnectorFactory } from "@twin.org/entity-storage-models";
import { nameof } from "@twin.org/nameof";
import {
	EntityStorageVaultConnector,
	type VaultKey,
	type VaultSecret,
	initSchema
} from "@twin.org/vault-connector-entity-storage";
import { VaultConnectorFactory } from "@twin.org/vault-models";
import {
	IotaStardustFaucetConnector,
	IotaStardustWalletConnector
} from "@twin.org/wallet-connector-iota-stardust";
import { FaucetConnectorFactory, WalletConnectorFactory } from "@twin.org/wallet-models";
import * as dotenv from "dotenv";

console.debug("Setting up test environment from .env and .env.dev files");

dotenv.config({ path: [path.join(__dirname, ".env"), path.join(__dirname, ".env.dev")] });

Guards.stringValue("TestEnv", "TEST_NODE_ENDPOINT", process.env.TEST_NODE_ENDPOINT);
Guards.stringValue("TestEnv", "TEST_FAUCET_ENDPOINT", process.env.TEST_FAUCET_ENDPOINT);
Guards.stringValue("TestEnv", "TEST_BECH32_HRP", process.env.TEST_BECH32_HRP);
Guards.stringValue("TestEnv", "TEST_COIN_TYPE", process.env.TEST_COIN_TYPE);
Guards.stringValue("TestEnv", "TEST_EXPLORER_URL", process.env.TEST_EXPLORER_URL);

if (!Is.stringValue(process.env.TEST_MNEMONIC)) {
	// eslint-disable-next-line no-restricted-syntax
	throw new Error(
		`Please define TEST_MNEMONIC as a 24 word mnemonic either as an environment variable or inside an .env.dev file
		 e.g. TEST_MNEMONIC="word0 word1 ... word23"
		 You can generate one using the following command
		 npx "@twin.org/crypto-cli" mnemonic --env ./tests/.env.dev --env-prefix TEST_`
	);
}
if (!Is.stringValue(process.env.TEST_2_MNEMONIC)) {
	// eslint-disable-next-line no-restricted-syntax
	throw new Error(
		`Please define TEST_2_MNEMONIC as a 24 word mnemonic either as an environment variable or inside an .env.dev file
		 e.g. TEST_2_MNEMONIC="word0 word1 ... word23"
		 You can generate one using the following command
		 npx "@twin.org/crypto-cli" mnemonic --env ./tests/.env.dev --env-prefix TEST_2_ --merge-env`
	);
}

export const TEST_IDENTITY_ID = "test-identity";
export const TEST_IDENTITY_ID_2 = "test-identity-2";
export const TEST_MNEMONIC_NAME = "test-mnemonic";

initSchema();

EntityStorageConnectorFactory.register(
	"vault-key",
	() =>
		new MemoryEntityStorageConnector<VaultKey>({
			entitySchema: nameof<VaultKey>()
		})
);
const secretEntityStorage = new MemoryEntityStorageConnector<VaultSecret>({
	entitySchema: nameof<VaultSecret>()
});
EntityStorageConnectorFactory.register("vault-secret", () => secretEntityStorage);

export const TEST_VAULT_CONNECTOR = new EntityStorageVaultConnector();
VaultConnectorFactory.register("vault", () => TEST_VAULT_CONNECTOR);

export const TEST_CLIENT_OPTIONS: IClientOptions = {
	nodes: [process.env.TEST_NODE_ENDPOINT],
	localPow: true
};

export const TEST_SEED = Bip39.mnemonicToSeed(process.env.TEST_MNEMONIC);
export const TEST_COIN_TYPE = Number.parseInt(process.env.TEST_COIN_TYPE, 10);
export const TEST_BECH32_HRP = process.env.TEST_BECH32_HRP;
export const TEST_WALLET_ADDRESS_INDEX = 1;

export const TEST_FAUCET_CONNECTOR = new IotaStardustFaucetConnector({
	config: {
		clientOptions: TEST_CLIENT_OPTIONS,
		endpoint: process.env.TEST_FAUCET_ENDPOINT
	}
});
FaucetConnectorFactory.register("faucet", () => TEST_FAUCET_CONNECTOR);

export const TEST_WALLET_CONNECTOR = new IotaStardustWalletConnector({
	config: {
		clientOptions: TEST_CLIENT_OPTIONS,
		vaultMnemonicId: TEST_MNEMONIC_NAME,
		coinType: TEST_COIN_TYPE,
		bech32Hrp: TEST_BECH32_HRP
	}
});

WalletConnectorFactory.register("wallet", () => TEST_WALLET_CONNECTOR);

await TEST_VAULT_CONNECTOR.setSecret(
	`${TEST_IDENTITY_ID}/${TEST_MNEMONIC_NAME}`,
	process.env.TEST_MNEMONIC
);

await TEST_VAULT_CONNECTOR.setSecret(
	`${TEST_IDENTITY_ID_2}/${TEST_MNEMONIC_NAME}`,
	process.env.TEST_2_MNEMONIC
);

const addresses = await TEST_WALLET_CONNECTOR.getAddresses(
	TEST_IDENTITY_ID,
	0,
	TEST_WALLET_ADDRESS_INDEX,
	1
);
export const TEST_NFT_ADDRESS_BECH32 = addresses[0];

const addresses2 = await TEST_WALLET_CONNECTOR.getAddresses(
	TEST_IDENTITY_ID_2,
	0,
	TEST_WALLET_ADDRESS_INDEX,
	1
);
export const TEST_NFT_ADDRESS_2_BECH32 = addresses2[0];

/**
 * Setup the test environment.
 */
export async function setupTestEnv(): Promise<void> {
	console.debug("NFT Address", `${process.env.TEST_EXPLORER_URL}addr/${TEST_NFT_ADDRESS_BECH32}`);
	console.debug(
		"NFT Address 2",
		`${process.env.TEST_EXPLORER_URL}addr/${TEST_NFT_ADDRESS_2_BECH32}`
	);
	await TEST_WALLET_CONNECTOR.ensureBalance(TEST_IDENTITY_ID, TEST_NFT_ADDRESS_BECH32, 1000000000n);
	await TEST_WALLET_CONNECTOR.ensureBalance(
		TEST_IDENTITY_ID_2,
		TEST_NFT_ADDRESS_2_BECH32,
		1000000000n
	);
}
