// Copyright (c) Blub Labs, Inc.
// SPDX-License-Identifier: Apache-2.0

export interface BlubStakingObjectsIds {
  BLUB_STAKING_PACKAGE_ID: string;
  ADMIN_CAP_ID: string;
  PROTOCOL_CONFIG_ID: string;
  REWARD_MANAGER_ID: string;
  VAULT_ID: string;
}

export const BLUB_COINTYPE =
  "0xfa7ac3951fdca92c5200d468d31a365eb03b2be9936fde615e69f0c1274ad3a0::BLUB::BLUB";

export const testnetObjectIds: BlubStakingObjectsIds = {
  BLUB_STAKING_PACKAGE_ID:
    "0x586afd26578f6700409cd7e9a5bc59428f762c122a6076cfa220e5799fbb03e6",
  ADMIN_CAP_ID:
    "0xa0d97b470d5c11d0b4f1d99bacc2b3afb58c1a791abafe8b59837b5e9553b498",
  PROTOCOL_CONFIG_ID:
    "0xbc9ea8a267de77205d659f99298681b28bb730950e338460eb449a424ea588d5",
  REWARD_MANAGER_ID:
    "0xe43722c47e09a557ed4d2156ad9b72c8bafdebab0700e987b4951a0beb86349c",
  VAULT_ID:
    "0x7bc2d3ce12315d0a7653d2dd844a954fbcb0f02d6a10132165ccb8b5f8581f5c",
};

export const mainnetObjectIds: BlubStakingObjectsIds = {
  BLUB_STAKING_PACKAGE_ID:
    "0xd683b30a655b25c49184002a4668e0f603e862598e9d57ae2ffbfdc8507155df",
  ADMIN_CAP_ID:
    "0x063163ee579d2ef018f23db7777a1a0d31dbcf1c1d7f24e139811ac9548f1d61",
  PROTOCOL_CONFIG_ID:
    "0x086385e23dcfab6ec41cd74830ccaa95a11d9c9d2f33028ea2fd62c3bd823763",
  REWARD_MANAGER_ID:
    "0xa42a644371d67495ca4e21f7ddc61fccc241145d265e1c85efbaabe24140c4d6",
  VAULT_ID:
    "0xda9d30b165d6a1ee71aab54f183ee361afd320c250163a9e476dc0f66d4119ad",
};
