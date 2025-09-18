# Real Estate NFT DApp

A decentralized application (DApp) that allows users to **buy, sell, and manage real estate as NFTs** on the Ethereum blockchain.  
The project uses an **Escrow smart contract** to securely handle transactions between buyers and sellers.

---

## 🚀 Technology Stack

- **Solidity** → Smart Contracts  
- **Hardhat** → Development & Testing Framework  
- **Ethers.js** → Blockchain Interaction  
- **React.js** → Frontend  
- **JavaScript** → Logic & Testing  
- **Metamask** → Wallet Integration  

---

## ⚙️ Requirements

- Install [Node.js](https://nodejs.org/en/)  
- Install [Metamask](https://metamask.io/)  

---

## 📦 Setup & Usage

### 1. Clone the repository
```bash
git clone https://github.com/arelraba11/real-estate-nft-dapp.git
cd real-estate-nft-dapp
```

### 2. Install dependencies
```bash
npm install
```

### 3. Run tests
```bash
npx hardhat test
```

### 4. Start Hardhat local node
```bash
npx hardhat node
```

### 5. Deploy contracts
```bash
npx hardhat run ./scripts/deploy.js --network localhost
```

### 6. Start frontend
```bash
npm start
```

---

## 📌 Features

- Mint properties as **ERC721 NFTs**  
- Secure property transactions using **Escrow contract**  
- Display property metadata (images, descriptions, details)  
- Wallet connection via **Metamask**  

---

## 🏗️ Project Architecture

```
Metamask Wallet <-> React Frontend <-> Ethers.js <-> Hardhat Node <-> Smart Contracts
```

---

## 📄 License

This project is licensed under the **MIT License**.