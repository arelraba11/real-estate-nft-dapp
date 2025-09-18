// RealEstate NFT contract - each token represents a unique real estate asset.
//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";

contract RealEstate is ERC721URIStorage {
    // Counter for tracking token IDs.
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;

    // Initialize contract with collection name and symbol.
    constructor() ERC721("Real Estate", "REAL") {}

    // Mint a new token with a given metadata URI.
    function mint(string memory tokenURI) public returns (uint256) {
        _tokenIds.increment();

        uint256 newItemId = _tokenIds.current();
        _mint(msg.sender, newItemId);
        _setTokenURI(newItemId, tokenURI);

        return newItemId;
    }

    // Get total number of minted tokens.
    function totalSupply() public view returns (uint256) {
        return _tokenIds.current();
    }
}