const { expect } = require('chai');
const { ethers } = require('hardhat');

const tokens = (n) => {
    return ethers.utils.parseUnits(n.toString(), 'ether')
}

describe('Escrow', () => {
    let buyer, seller, inspector, lender
    let realEstate, escrow

    beforeEach(async ()=> {
        // setup accounts
        [buyer, seller, inspector, lender] = await ethers.getSigners()

        // Deploy Real Estate
        const RealEstate = await ethers.getContractFactory('RealEstate')
        realEstate = await RealEstate.deploy()

        // Mint
        let transaction = await realEstate.connect(seller).mint("https://ipfs.io/ipfs/QmQvcpsjrA6cr1iJjZAodYwmPekYgbnXGo4DFubJiLc2EB/1.json")
        await transaction.wait()

        const Escrow = await ethers.getContractFactory('Escrow')
        escrow = await Escrow.deploy(
            realEstate.address,
             seller.address,
              inspector.address,
               lender.address)
    })

    describe('Deployment', () => {
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

})
