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
        // Initialize test accounts
        [buyer, seller, inspector, lender] = await ethers.getSigners()

        // Deploy RealEstate contract and mint NFT to seller
        const RealEstate = await ethers.getContractFactory('RealEstate')
        realEstate = await RealEstate.deploy()
        let transaction = await realEstate.connect(seller).mint("https://ipfs.io/ipfs/QmQvcpsjrA6cr1iJjZAodYwmPekYgbnXGo4DFubJiLc2EB/1.json")
        await transaction.wait()

        // Deploy Escrow contract with assigned roles
        const Escrow = await ethers.getContractFactory('Escrow')
        escrow = await Escrow.deploy(
            realEstate.address,
             seller.address,
              inspector.address,
               lender.address)

        // Approve and list the NFT on escrow
        transaction = await realEstate.connect(seller).approve(escrow.address,1)
        await transaction.wait()
        transaction = await escrow.connect(seller).list(1, buyer.address, tokens(10), tokens(5))
        await transaction.wait()
    })

    describe('Deployment', () => {
        // Check NFT contract address
        it('saves NFT address', async() => {
            const result = await escrow.nftAddress()
            expect(result).to.be.equal(realEstate.address)
        })

        // Check seller address
        it('saves seller', async() => {
            const result = await escrow.seller()
            expect(result).to.be.equal(seller.address)
        })

        // Check inspector address
        it('saves inspector', async() => {
            const result = await escrow.inspector()
            expect(result).to.be.equal(inspector.address)
        })

        // Check lender address
        it('saves lender', async() => {
            const result = await escrow.lender()
            expect(result).to.be.equal(lender.address)
        })
    })

    describe('Listing', () => {
        // Verify NFT ownership transfers to escrow upon listing
        it('Updates ownership', async() => {
            expect(await realEstate.ownerOf(1)).to.be.equal(escrow.address)
        })

        // Verify buyer is recorded correctly
        it('Returns buyer', async() => {
            const result = await escrow.buyer(1)
            expect(result).to.be.equal(buyer.address)
        })

        // Verify listing details are stored accurately
        it('records custom listing details', async () => {
            const [newBuyer] = await ethers.getSigners()
            const tokenId = 2

            // Mint and approve new NFT
            let transaction = await realEstate.connect(seller).mint("https://ipfs.io/ipfs/QmQvcpsjrA6cr1iJjZAodYwmPekYgbnXGo4DFubJiLc2EB/2.json")
            await transaction.wait()
            transaction = await realEstate.connect(seller).approve(escrow.address, tokenId)
            await transaction.wait()

            // List new property with specified price and escrow amount
            const customPrice = tokens(15)
            const customEscrowAmount = tokens(7)
            transaction = await escrow.connect(seller).list(tokenId, newBuyer.address, customPrice, customEscrowAmount)
            await transaction.wait()

            // Confirm listing details
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
        // Verify contract balance updates after earnest deposit
        it('Updates contract balance', async()=> {
            const transaction = await escrow.connect(buyer).depositEarnest(1, {value: tokens(5)})
            await transaction.wait()
            const result = await escrow.getBalance()
            expect(result).to.be.equal(tokens(5))
        })
    })

    describe('Inspection', () =>{
        // Verify inspection status update
        it('Updates inspection status', async()=> {
            const transaction = await escrow.connect(inspector).updateInspectionStatus(1, true)
            await transaction.wait()
            const result = await escrow.inspectionPassed(1)
            expect(result).to.be.equal(true)
        })
    })

    describe('Approval', () =>{
        // Verify approval status updates for buyer, seller, and lender
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
    describe('Sale', () =>{
        beforeEach(async () => {
            // Complete prerequisites for finalizing sale
            let transaction = await escrow.connect(buyer).depositEarnest(1, {value: tokens(5)})
            await transaction.wait()

            transaction = await escrow.connect(inspector).updateInspectionStatus(1, true)
            await transaction.wait()

            transaction = await escrow.connect(buyer).approveSale(1)
            await transaction.wait()

            transaction = await escrow.connect(seller).approveSale(1)
            await transaction.wait()

            transaction = await escrow.connect(lender).approveSale(1)
            await transaction.wait()

            await lender.sendTransaction({to: escrow.address, value: tokens(5)})

            transaction = await escrow.connect(seller).finalizeSale(1)
            await transaction.wait()
        })

        // Verify ownership transfers to buyer
        it('Updates ownership', async () => {
            expect(await realEstate.ownerOf(1)).to.be.equal(buyer.address)
        })

        // Verify escrow contract balance resets after sale
        it('works', async () => {
            expect(await escrow.getBalance()).to.be.equal(0)
        })
    })
})
