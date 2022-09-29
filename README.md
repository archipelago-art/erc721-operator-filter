# `ERC721OperatorFilter`

`ERC721OperatorFilter` is a smart contract that extends OpenZeppelin's
`ERC721` base contract and adds functionality for restricting which
operators may transfer tokens. The motivating purpose is to **block
royalty-evading marketplaces** from facilitating sales of digital art
without paying the required royalties back to the original artists.

The logic to determine which operators are blocked is pluggable via the
`IOperatorFilter` interface. This repository also provides the
`BlacklistOperatorFilter` contract, which is a simple implementation of
`IOperatorFilter` that allows an owner to block specific contracts by
address or by code implementation.

In all cases, **token owners can transfer their own tokens** to any
address. This functionality only restricts *approved operators* from
transferring tokens that belong to other addresses.

If you are writing your own ERC-721 token contract, you can *mix in* the
functionality of `ERC721OperatorFilter`. At a high level, the steps to
use this functionality look like this:

-   Modify your token contract to extend from `ERC721OperatorFilter`.
-   Deploy a `BlacklistOperatorFilter` contract.
-   Deploy your token contract, and call `setOperatorFilter(address)`,
    passing the address of the deployed operator filter.
-   Call `setAddressBlocked` on the operator filter to block offending
    contracts.

## Mixing in `ERC721OperatorFilter`

`ERC721OperatorFilter` inherits from both `ERC721` and `Ownable`, so you
can replace those if they appear:

```solidity
// Before:
contract MyToken is ERC721, Ownable, SomeOtherBaseContract {
    // ...
}

// After:
contract MyToken is ERC721OperatorFilter, SomeOtherBaseContract {
    // ...
}
```

(If your contract inherits from other `ERC721` descendants, like
`ERC721Enumerable`, you may need to add a `_beforeTokenTransfer`
override in your contract that just `super._beforeTokenTransfer(...)`,
per Solidity language restrictions.)

The owner of the contract (per OpenZeppelin `Ownable` semantics) can
call `setOperatorFilter` at any time, pointing to a contract with the
logic to determine which transfers are permitted. The operator filter
can be any contract that implements the `IOperatorFilter` interface,
which has one method:

```solidity
interface IOperatorFilter {
    /// Tests whether `operator` is permitted to facilitate token transfers.
    function mayTransfer(address operator) external view returns (bool);
}
```

## License

These contracts are written with love by the [Archipelago][] team and
released under the MIT License.

[Archipelago]: https://archipelago.art
