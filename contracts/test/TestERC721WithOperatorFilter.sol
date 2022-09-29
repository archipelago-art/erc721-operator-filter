// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

import "../ERC721OperatorFilter.sol";

contract TestERC721WithOperatorFilter is ERC721OperatorFilter {
    constructor() ERC721("TestToken", "TT") {}

    function mint(address recipient, uint256 tokenId) external {
        _mint(recipient, tokenId);
    }

    function burn(uint256 tokenId) external {
        _burn(tokenId);
    }
}
