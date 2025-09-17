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

    // Restricts function access to the buyer of the specified NFT
    modifier onlyBayer(uint256 _nftID) {
        require(msg.sender == buyer[_nftID], "Only buyer can call this method");
        _;
    }

    // Restricts function access to the seller
    modifier onlySeller() {
        require(msg.sender == seller, "Only seller can call this method");
        _;
    }

    // Restricts function access to the inspector
    modifier onlyInspector() {
        require(msg.sender == inspector, "Only inspector can call this method");
        _;
    }

    // Indicates if an NFT is listed for sale
    mapping(uint256 => bool) public isListed;
    // Purchase price set for each NFT
    mapping(uint256 => uint256) public purchasePrice;
    // Required escrow deposit for each NFT
    mapping(uint256 => uint256) public escrowAmount;
    // Buyer address associated with each NFT
    mapping(uint256 => address) public buyer;
    // Inspection status for each NFT
    mapping(uint256 => bool) public inspectionPassed;
    // Approval status from involved parties per NFT
    mapping(uint256 => mapping(address => bool)) public approval;

    // Initializes contract with NFT address and role addresses
    constructor(address _nftAddress, address payable _seller, address _inspector, address _lender){
        nftAddress = _nftAddress;
        inspector = _inspector;
        seller = _seller;
        lender = _lender;
    }

    // Lists an NFT and transfers it to escrow
    function list(uint256 _nftID ,address _buyer ,uint256 _purchasePrice ,uint256 _escrowAmount) public payable onlySeller {
        IERC721(nftAddress).transferFrom(msg.sender, address(this), _nftID);
        isListed[_nftID] = true;
        purchasePrice[_nftID] = _purchasePrice;
        escrowAmount[_nftID] = _escrowAmount;
        buyer[_nftID] = _buyer;
    }

    // Buyer deposits earnest money (escrow)
    function depositEarnest(uint256 _nftID) public payable onlyBayer(_nftID) {
        require(msg.value >= escrowAmount[_nftID]);
    }

    // Updates inspection result; callable by inspector only
    function updateInspectionStatus(uint256 _nftID, bool _passed) public onlyInspector{
        inspectionPassed[_nftID] = _passed;
    }

    // Records approval from a party for the sale
    function approveSale(uint256 _nftID) public {
        approval[_nftID][msg.sender] = true;
    }    

    // Accepts Ether sent directly to contract
    receive() external payable{}

    // Returns escrow contract balance
    function getBalance() public view returns (uint256) {
        return address(this).balance;
    }

    // Completes the sale after all conditions are met
    function finalizeSale(uint256 _nftID) public{
        require(inspectionPassed[_nftID]);
        require(approval[_nftID][buyer[_nftID]]);
        require(approval[_nftID][seller]);
        require(approval[_nftID][lender]);
        require(address(this).balance >= purchasePrice[_nftID]);

        (bool success, ) = payable(seller).call{value: address(this).balance}("");
        require(success);

        IERC721(nftAddress).transferFrom(address(this), buyer[_nftID], _nftID);
    }

}
