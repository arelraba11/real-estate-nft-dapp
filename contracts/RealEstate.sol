// This contract represents a Real Estate NFT collection, where each NFT corresponds to a unique real estate asset.
//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";

contract RealEstate is ERC721URIStorage {
    // Use Counters library for incrementing token IDs safely and efficiently.
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;

    // Constructor sets the collection name and symbol.
    constructor() ERC721("Real Estate", "REAL") {}

    // Mints a new NFT with the given metadata URI.
    function mint(string memory tokenURI) public returns (uint256) {
        _tokenIds.increment();

        uint256 newItemId = _tokenIds.current();
        _mint(msg.sender, newItemId);
        _setTokenURI(newItemId, tokenURI);

        return newItemId;
    }

    // Returns the total number of minted tokens in the collection.
    function totalSupply() public view returns (uint256) {
        return _tokenIds.current();
    }
}