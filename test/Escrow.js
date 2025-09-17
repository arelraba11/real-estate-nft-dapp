const { expect } = require('chai');
const { ethers } = require('hardhat');

// Function to convert numbers to ether units
const tokens = (n) => {
    return ethers.utils.parseUnits(n.toString(), 'ether')
}

describe('Escrow', () => {
    let buyer, seller, inspector, lender
    let realEstate, escrow

    beforeEach(async ()=> {
        // Setup accounts for buyer, seller, inspector, and lender
        [buyer, seller, inspector, lender] = await ethers.getSigners()

        // Deploy the RealEstate contract
        const RealEstate = await ethers.getContractFactory('RealEstate')
        realEstate = await RealEstate.deploy()

        // Mint a new NFT to the seller
        let transaction = await realEstate.connect(seller).mint("https://ipfs.io/ipfs/QmQvcpsjrA6cr1iJjZAodYwmPekYgbnXGo4DFubJiLc2EB/1.json")
        await transaction.wait()

        // Deploy the Escrow contract with the required addresses
        const Escrow = await ethers.getContractFactory('Escrow')
        escrow = await Escrow.deploy(
            realEstate.address,
             seller.address,
              inspector.address,
               lender.address)

        // Approve the escrow contract to transfer the NFT on behalf of the seller
        transaction = await realEstate.connect(seller).approve(escrow.address,1)
        await transaction.wait()

        // List the property on the escrow contract
        transaction = await escrow.connect(seller).list(1, buyer.address, tokens(10), tokens(5))
        await transaction.wait()
    })

    describe('Deployment', () => {
        // Each test checks that the contract stores the correct address
        it('saves NFT address', async() => {
            const result = await escrow.nftAddress()
            expect(result).to.be.equal(realEstate.address)
        })

        it('saves seller', async() => {
            const result = await escrow.seller()
            expect(result).to.be.equal(seller.address)
        })

        it('saves inspector', async() => {
            const result = await escrow.inspector()
            expect(result).to.be.equal(inspector.address)
        })

        it('saves lender', async() => {
            const result = await escrow.lender()
            expect(result).to.be.equal(lender.address)
        })
    })

    describe('Listing', () => {
        // Check that ownership of the NFT is transferred to the escrow contract
        it('Updates ownership', async() => {
            expect(await realEstate.ownerOf(1)).to.be.equal(escrow.address)
        })

        // Verify that the buyer is correctly recorded for the listed NFT
        it('Returns buyer', async() => {
            const result = await escrow.buyer(1)
            expect(result).to.be.equal(buyer.address)
        })

        // Test that custom listing details such as price and escrow amount are recorded correctly
        it('records custom listing details', async () => {
            // Deploy a new property and list it with different details
            const [newBuyer] = await ethers.getSigners()
            const tokenId = 2

            // Mint a new token to seller
            let transaction = await realEstate.connect(seller).mint("https://ipfs.io/ipfs/QmQvcpsjrA6cr1iJjZAodYwmPekYgbnXGo4DFubJiLc2EB/2.json")
            await transaction.wait()

            // Approve escrow contract to transfer token
            transaction = await realEstate.connect(seller).approve(escrow.address, tokenId)
            await transaction.wait()

            // List property with custom price and escrow amount
            const customPrice = tokens(15)
            const customEscrowAmount = tokens(7)
            transaction = await escrow.connect(seller).list(tokenId, newBuyer.address, customPrice, customEscrowAmount)
            await transaction.wait()

            // Check listing details
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

})
