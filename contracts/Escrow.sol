// Escrow smart contract for handling real estate NFT transactions with roles and conditions
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

    // Restricts access to the buyer of the given NFT
    modifier onlyBayer(uint256 _nftID) {
        require(msg.sender == buyer[_nftID], "Only buyer can call this method");
        _;
    }

    // Restricts access to the seller
    modifier onlySeller() {
        require(msg.sender == seller, "Only seller can call this method");
        _;
    }

    // Restricts access to the inspector
    modifier onlyInspector() {
        require(msg.sender == inspector, "Only inspector can call this method");
        _;
    }

    /**
     * Mappings to manage property state:
     * - Listing status, price, escrow deposit, buyer, inspection status, and approvals.
     */
    mapping(uint256 => bool) public isListed;
    mapping(uint256 => uint256) public purchasePrice;
    mapping(uint256 => uint256) public escrowAmount;
    mapping(uint256 => address) public buyer;
    mapping(uint256 => bool) public inspectionPassed;
    mapping(uint256 => mapping(address => bool)) public approval;

    constructor(address _nftAddress, address payable _seller, address _inspector, address _lender){
        nftAddress = _nftAddress;
        inspector = _inspector;
        seller = _seller;
        lender = _lender;
    }

    // List an NFT and transfer it into escrow
    function list(uint256 _nftID ,address _buyer ,uint256 _purchasePrice ,uint256 _escrowAmount) public payable onlySeller {
        IERC721(nftAddress).transferFrom(msg.sender, address(this), _nftID);
        isListed[_nftID] = true;
        purchasePrice[_nftID] = _purchasePrice;
        escrowAmount[_nftID] = _escrowAmount;
        buyer[_nftID] = _buyer;
    }

    // Buyer deposits escrow funds
    function depositEarnest(uint256 _nftID) public payable onlyBayer(_nftID) {
        require(msg.value >= escrowAmount[_nftID]);
    }

    // Inspector updates inspection result
    function updateInspectionStatus(uint256 _nftID, bool _passed) public onlyInspector{
        inspectionPassed[_nftID] = _passed;
    }

    // Records approval from a party
    function approveSale(uint256 _nftID) public {
        approval[_nftID][msg.sender] = true;
    }    

    // Finalize the sale after all requirements are met
    function finalizeSale(uint256 _nftID) public{
        require(inspectionPassed[_nftID]);
        require(approval[_nftID][buyer[_nftID]]);
        require(approval[_nftID][seller]);
        require(approval[_nftID][lender]);
        require(address(this).balance >= purchasePrice[_nftID]);

        isListed[_nftID] = false;

        (bool success, ) = payable(seller).call{value: address(this).balance}("");
        require(success);

        IERC721(nftAddress).transferFrom(address(this), buyer[_nftID], _nftID);
    }

    // Cancel the sale and handle refunds based on inspection
    function cancelSale(uint256 _nftID) public{
        if(inspectionPassed[_nftID] == false){
            payable(buyer[_nftID]).transfer(address(this).balance);
        } else {
            payable(seller).transfer(address(this).balance);
        }
    }

    // Accept direct Ether transfers
    receive() external payable{}

    // Get escrow contract balance
    function getBalance() public view returns (uint256) {
        return address(this).balance;
    }
}
