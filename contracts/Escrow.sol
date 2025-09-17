// Escrow contract for managing real estate NFT transactions
//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

interface IERC721 {
    function transferFrom(
        address _from,
        address _to,
        uint256 _id
    ) external;
}

contract Escrow {
    address public lender;
    address public inspector;
    address payable public seller;
    address public nftAddress;

    // Ensures that only the buyer associated with the NFT ID can call the function
    modifier onlyBayer(uint256 _nftID) {
        require(msg.sender == buyer[_nftID], "Only buyer can call this method");
        _;
    }

    // Ensures that only the seller can call the function
    modifier onlySeller() {
        require(msg.sender == seller, "Only seller can call this method");
        _;
    }

    // Ensures that only the inspector can call the function
    modifier onlyInspector() {
        require(msg.sender == inspector, "Only inspector can call this method");
        _;
    }

    // Tracks whether an NFT is listed for sale
    mapping(uint256 => bool) public isListed;
    // Stores the purchase price for each NFT
    mapping(uint256 => uint256) public purchasePrice;
    // Stores the required escrow amount for each NFT
    mapping(uint256 => uint256) public escrowAmount;
    // Maps each NFT to its buyer's address
    mapping(uint256 => address) public buyer;
    // Records whether the inspection has passed for each NFT
    mapping(uint256 => bool) public inspectionPassed;
    // Records approval status from involved parties for each NFT
    mapping(uint256 => mapping(address => bool)) public approval;

    // Initializes contract with NFT address and role addresses
    constructor(address _nftAddress, address payable _seller, address _inspector, address _lender){
        nftAddress = _nftAddress;
        inspector = _inspector;
        seller = _seller;
        lender = _lender;
    }

    // Lists an NFT for sale and transfers it to escrow
    function list(uint256 _nftID ,address _buyer ,uint256 _purchasePrice ,uint256 _escrowAmount) public payable onlySeller {
        IERC721(nftAddress).transferFrom(msg.sender, address(this), _nftID);
        isListed[_nftID] = true;
        purchasePrice[_nftID] = _purchasePrice;
        escrowAmount[_nftID] = _escrowAmount;
        buyer[_nftID] = _buyer;
    }

    // Allows the buyer to deposit the earnest money (escrow amount)
    function depositEarnest(uint256 _nftID) public payable onlyBayer(_nftID) {
        require(msg.value >= escrowAmount[_nftID]);
    }

    // Updates the inspection status for the NFT; callable only by the inspector
    function updateInspectionStatus(uint256 _nftID, bool _passed) public onlyInspector{
        inspectionPassed[_nftID] = _passed;
    }

    // Records approval of the sale from involved parties
    function approveSale(uint256 _nftID) public {
        approval[_nftID][msg.sender] = true;
    }    

    // Accepts Ether sent directly to the contract
    receive() external payable{}

    // Returns the current balance held by the escrow contract
    function getBalance() public view returns (uint256) {
        return address(this).balance;
    }


}
