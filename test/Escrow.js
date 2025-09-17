const { expect } = require('chai');
const { ethers } = require('hardhat');

// Converts a number to its equivalent in ether units
const tokens = (n) => {
    return ethers.utils.parseUnits(n.toString(), 'ether')
}

describe('Escrow', () => {
    let buyer, seller, inspector, lender
    let realEstate, escrow

    beforeEach(async ()=> {
        // Get test accounts for buyer, seller, inspector, and lender
        [buyer, seller, inspector, lender] = await ethers.getSigners()

        // Deploy the RealEstate contract
        const RealEstate = await ethers.getContractFactory('RealEstate')
        realEstate = await RealEstate.deploy()

        // Mint an NFT to the seller
        let transaction = await realEstate.connect(seller).mint("https://ipfs.io/ipfs/QmQvcpsjrA6cr1iJjZAodYwmPekYgbnXGo4DFubJiLc2EB/1.json")
        await transaction.wait()

        // Deploy the Escrow contract with required roles
        const Escrow = await ethers.getContractFactory('Escrow')
        escrow = await Escrow.deploy(
            realEstate.address,
             seller.address,
              inspector.address,
               lender.address)

        // Seller approves escrow contract to transfer the NFT
        transaction = await realEstate.connect(seller).approve(escrow.address,1)
        await transaction.wait()

        // Seller lists the property on the escrow contract
        transaction = await escrow.connect(seller).list(1, buyer.address, tokens(10), tokens(5))
        await transaction.wait()
    })

    describe('Deployment', () => {
        // Verify the NFT contract address is stored correctly
        it('saves NFT address', async() => {
            const result = await escrow.nftAddress()
            expect(result).to.be.equal(realEstate.address)
        })

        // Verify the seller address is stored correctly
        it('saves seller', async() => {
            const result = await escrow.seller()
            expect(result).to.be.equal(seller.address)
        })

        // Verify the inspector address is stored correctly
        it('saves inspector', async() => {
            const result = await escrow.inspector()
            expect(result).to.be.equal(inspector.address)
        })

        // Verify the lender address is stored correctly
        it('saves lender', async() => {
            const result = await escrow.lender()
            expect(result).to.be.equal(lender.address)
        })
    })

    describe('Listing', () => {
        // Confirm the NFT ownership transfers to the escrow contract upon listing
        it('Updates ownership', async() => {
            expect(await realEstate.ownerOf(1)).to.be.equal(escrow.address)
        })

        // Confirm the buyer is correctly recorded for the listed NFT
        it('Returns buyer', async() => {
            const result = await escrow.buyer(1)
            expect(result).to.be.equal(buyer.address)
        })

        // Check that custom listing details such as price and escrow amount are saved properly
        it('records custom listing details', async () => {
            // Use a new buyer and token for this test
            const [newBuyer] = await ethers.getSigners()
            const tokenId = 2

            // Mint a new NFT to the seller
            let transaction = await realEstate.connect(seller).mint("https://ipfs.io/ipfs/QmQvcpsjrA6cr1iJjZAodYwmPekYgbnXGo4DFubJiLc2EB/2.json")
            await transaction.wait()

            // Approve the escrow contract to transfer the new NFT
            transaction = await realEstate.connect(seller).approve(escrow.address, tokenId)
            await transaction.wait()

            // List the new property with specified price and escrow amount
            const customPrice = tokens(15)
            const customEscrowAmount = tokens(7)
            transaction = await escrow.connect(seller).list(tokenId, newBuyer.address, customPrice, customEscrowAmount)
            await transaction.wait()

            // Verify the listing details are set correctly
            const isListed = await escrow.isListed(tokenId)
            const buyerAddress = await escrow.buyer(tokenId)
            const purchasePrice = await escrow.purchasePrice(tokenId)
            const escrowAmount = await escrow.escrowAmount(tokenId)

            expect(isListed).to.be.true
            expect(buyerAddress).to.equal(newBuyer.address)
            expect(purchasePrice).to.equal(customPrice)
            expect(escrowAmount).to.equal(customEscrowAmount)
        })
    })

    describe('Deposits', () =>{
        // Ensure the contract balance updates when buyer deposits earnest money
        it('Updates contract balance', async()=> {
            const transaction = await escrow.connect(buyer).depositEarnest(1, {value: tokens(5)})
            await transaction.wait()
            const result = await escrow.getBalance()
            expect(result).to.be.equal(tokens(5))
        })
    })

    describe('Inspection', () =>{
        // Confirm inspection status updates correctly when inspector marks it passed
        it('Updates inspection status', async()=> {
            const transaction = await escrow.connect(inspector).updateInspectionStatus(1, true)
            await transaction.wait()
            const result = await escrow.inspectionPassed(1)
            expect(result).to.be.equal(true)
        })
    })

    describe('Approval', () =>{
        // Verify that buyer, seller, and lender can approve the sale
        it('Updates approval status', async()=> {
            let transaction = await escrow.connect(buyer).approveSale(1)
            await transaction.wait()

            transaction = await escrow.connect(seller).approveSale(1)
            await transaction.wait()

            transaction = await escrow.connect(lender).approveSale(1)
            await transaction.wait()

            expect(await escrow.approval(1, buyer.address)).to.be.equal(true)
            expect(await escrow.approval(1, seller.address)).to.be.equal(true)
            expect(await escrow.approval(1, lender.address)).to.be.equal(true)
            
        })
    })
})
