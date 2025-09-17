import logo from '../assets/logo.svg';

// Navigation bar component for the dApp
const Navigation = ({ account, setAccount }) => {
    // Function to request accounts from MetaMask and set the connected account
    const connectHandler = async () => {
        const accounts = await window.ethereum.request({method: `eth_requestAccounts`});
        setAccount(accounts[0]);
    }

    // Render the navigation bar UI
    return (
        <nav>
            <ul className='nav__links'>
                <li><a href="#">Buy</a></li>
                <li><a href="#">Rent</a></li>
                <li><a href="#">Sell</a></li>
            </ul>

            <div className='nav__brand'>
                <img src={logo} alt="Logo" />
                <h1>Millow</h1>
            </div>

            {/* Show either the connected wallet address (shortened) or a "Connect" button if not connected */}
            {account ? (
                <button type="button" className='nav__connect'>
                    {account.slice(0, 6) + '...' + account.slice(38, 42)}
                </button>
            ) : (
                <button type="button" className='nav__connect' onClick={connectHandler}>Connect</button>
            )}

        </nav>
  );
}

export default Navigation;
