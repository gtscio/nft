# Interface: INftUpdateRequest\<T\>

Update the mutable data for the NFT.

## Type parameters

• **T** = `unknown`

## Properties

### pathParams

> **pathParams**: `object`

The data to be used in the transfer.

#### id

> **id**: `string`

The id of the NFT to transfer in urn format.

***

### body

> **body**: `object`

The data to be used in the minting.

#### metadata?

> `optional` **metadata**: `T`

The metadata for the NFT.
