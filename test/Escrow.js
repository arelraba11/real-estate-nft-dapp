const { expect } = require('chai');
const { ethers } = require('hardhat');

// Test suite for the Escrow contract managing NFT real estate transactions
const tokens = (n) => {
    return ethers.utils.parseUnits(n.toString(), 'ether')
}

describe('Escrow', () => {
    let buyer, seller, inspector, lender
    let realEstate, escrow

    beforeEach(async ()=> {
        [buyer, seller, inspector, lender] = await ethers.getSigners()

        const RealEstate = await ethers.getContractFactory('RealEstate')
        realEstate = await RealEstate.deploy()
        let transaction = await realEstate.connect(seller).mint("/metadata/1.json")
        await transaction.wait()

        const Escrow = await ethers.getContractFactory('Escrow')
        escrow = await Escrow.deploy(
            realEstate.address,
             seller.address,
              inspector.address,
               lender.address)

        transaction = await realEstate.connect(seller).approve(escrow.address,1)
        await transaction.wait()
        transaction = await escrow.connect(seller).list(1, buyer.address, tokens(10), tokens(5))
        await transaction.wait()
    })

    describe('Deployment', () => {
        it('stores NFT contract address', async() => {
            const result = await escrow.nftAddress()
            expect(result).to.be.equal(realEstate.address)
        })

        it('stores seller address', async() => {
            const result = await escrow.seller()
            expect(result).to.be.equal(seller.address)
        })

        it('stores inspector address', async() => {
            const result = await escrow.inspector()
            expect(result).to.be.equal(inspector.address)
        })

        it('stores lender address', async() => {
            const result = await escrow.lender()
            expect(result).to.be.equal(lender.address)
        })
    })

    describe('Listing', () => {
        it('transfers NFT ownership to escrow upon listing', async() => {
            expect(await realEstate.ownerOf(1)).to.be.equal(escrow.address)
        })

        it('records the buyer correctly', async() => {
            const result = await escrow.buyer(1)
            expect(result).to.be.equal(buyer.address)
        })

        it('stores custom listing details accurately', async () => {
            const [newBuyer] = await ethers.getSigners()
            const tokenId = 2

            let transaction = await realEstate.connect(seller).mint("/metadata/2.json")
            await transaction.wait()
            transaction = await realEstate.connect(seller).approve(escrow.address, tokenId)
            await transaction.wait()

            const customPrice = tokens(15)
            const customEscrowAmount = tokens(7)
            transaction = await escrow.connect(seller).list(tokenId, newBuyer.address, customPrice, customEscrowAmount)
            await transaction.wait()

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
        it('updates contract balance after earnest deposit', async()=> {
            const transaction = await escrow.connect(buyer).depositEarnest(1, {value: tokens(5)})
            await transaction.wait()
            const result = await escrow.getBalance()
            expect(result).to.be.equal(tokens(5))
        })
    })

    describe('Inspection', () =>{
        it('updates inspection status', async()=> {
            const transaction = await escrow.connect(inspector).updateInspectionStatus(1, true)
            await transaction.wait()
            const result = await escrow.inspectionPassed(1)
            expect(result).to.be.equal(true)
        })
    })

    describe('Approval', () =>{
        it('updates approval status for all parties', async()=> {
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

        it('transfers ownership to buyer', async () => {
            expect(await realEstate.ownerOf(1)).to.be.equal(buyer.address)
        })

        it('resets escrow contract balance after sale', async () => {
            expect(await escrow.getBalance()).to.be.equal(0)
        })
    })
})
